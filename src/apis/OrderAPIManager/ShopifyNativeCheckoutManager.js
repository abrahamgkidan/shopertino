import { Alert } from 'react-native';
import Loading from 'react-native-loader-overlay';
import uuid from 'uuidv4';
import stripe from 'tipsi-stripe';
import base64 from 'react-native-base64';
import { shopifyDataManager } from '../shopify';
import Order from '../../models/Order';
import PaymentRequestAPI from '../../Core/payment/api';
import { IMLocalized } from '../../Core/localization/IMLocalization';

export default class {
  constructor(props, appConfig, loading, shoppingBag, totalPrice) {
    this.props = props;
    this.loading = loading;
    this.appConfig = appConfig;
    this.shoppingBag = shoppingBag;
    this.totalPrice = totalPrice;
    this.paymentRequestAPI = new PaymentRequestAPI(appConfig);
  }

  handleAppStateChange() {}

  startCheckout = async (loading, selectedPaymentMethod, items, options) => {
    this.loading = loading;
    if (selectedPaymentMethod.isNativePaymentMethod) {
      this.handleNativePaymentMethod(items, options);
      return;
    }

    this.handleNonNativePaymentMethod();
  };

  handleNativePaymentMethod = async (items, options) => {
    try {
      const token = await stripe.paymentRequestWithNativePay(options, items);

      if (token) {
        const source = await this.paymentRequestAPI.addNewPaymentSource(
          this.props.stripeCustomer,
          token.tokenId,
        );

        this.source = source.data.response.id;

        await this.startOrder();
        stripe.completeNativePayRequest();
      } else {
        alert('An error occurred, please try again.');
      }
    } catch (error) {
      console.log('native pay error', error);
      Loading.hide(this.loading);
      alert(error);
      stripe.cancelNativePayRequest();
    }
  };

  handleNonNativePaymentMethod = async () => {
    this.source = this.props.selectedPaymentMethod.cardId;
    this.startOrder();
  };

  startOrder = async (source) => {
    if (source) {
      this.source = source;
    }
    return await this.createOrder(this.source);
  };

  createOrder = async (source) => {
    const {
      totalPrice: stateTotalPrice,
      selectedShippingMethod,
      selectedPaymentMethod,
      shoppingBag: stateShoppingBag,
      user,
    } = this.props;

    let shoppingBag;
    let totalPrice;

    if (!this.shoppingBag) {
      shoppingBag = stateShoppingBag;
    } else {
      shoppingBag = this.shoppingBag;
    }

    if (!this.totalPrice) {
      totalPrice = stateTotalPrice;
    } else {
      totalPrice = this.totalPrice;
    }

    const line_items = this.getLineItems(shoppingBag);
    const {
      name,
      address,
      apt,
      zipCode,
      city,
      state,
      country,
    } = this.props.user?.shippingAddress;

    const newShopifyOrder = {
      financial_status: 'paid',
      email: user.email,
      shipping_address: {
        first_name: name,
        last_name: name,
        address1: apt,
        address2: address,
        city: city,
        province: state,
        zip: zipCode,
        country: country,
      },
      line_items,
      customer: {
        id: base64?.decode(user.id)?.replace(/[^0-9]/g, ''),
      },
      total_price: Number(totalPrice),
    };

    this.chargeOrder(newShopifyOrder, Number(totalPrice), source);
  };

  getLineItems = (shoppingBag) => {
    const productsItems =
      shoppingBag.length > 0
        ? [...shoppingBag]
        : this.getProductsFromOrderHistory();

    return productsItems.map((product) => {
      return {
        variant_id: base64.decode(product.id)?.replace(/[^0-9]/g, ''),
        quantity: product.quantity ? product.quantity : 1,
        // meta_data: this.getLineItemMetaData(product),
      };
    });
  };

  getLineItemMetaData = (product) => {
    if (
      product.selectedAttributes &&
      Object.keys(product.selectedAttributes)?.length
    ) {
      return Object.values(product.selectedAttributes).map((attribute) => {
        return { key: attribute.attributeName, value: attribute.option };
      });
    }

    return [];
  };

  chargeOrder = async (order, totalPrice, source) => {
    const { selectedShippingMethod } = this.props;
    const orderCopy = {
      ...order,
    };

    try {
      if (selectedShippingMethod?.amount) {
        orderCopy.total_price =
          order.total_price - selectedShippingMethod.amount;
      }

      const charge = await this.chargeCustomer(source, totalPrice);

      if (charge.success) {
        const result = await shopifyDataManager.createOrder({
          order: orderCopy,
        });

        if (result.order) {
          this.alertOrderPLaced(result.order);
        }

        if (result.error) {
          alert(
            IMLocalized(
              "Unfortunately an error occurred, we couldn't place your order.",
            ),
          );
        }

        Loading.hide(this.loading);
      }

      if (!charge.success) {
        Loading.hide(this.loading);
        console.log(charge);
        alert(IMLocalized('An error occurred please try again later.'));
        // alert(charge.error);
      }
    } catch (error) {
      console.log(error);
      Loading.hide(this.loading);
      alert(error);
    }
  };

  chargeCustomer = async (source, totalPrice) => {
    const charge = await this.paymentRequestAPI.chargeStripeCustomer({
      customer: this.props.stripeCustomer,
      amount: Number(totalPrice) * 100,
      currency: 'usd',
      source,
      uuid: uuid(),
    });

    return charge;
  };

  alertOrderPLaced = (order) => {
    setTimeout(() => {
      Alert.alert(
        IMLocalized('Congratulations!'),
        IMLocalized('Your order has been placed successfully.'),
        [
          {
            text: 'OK',
            onPress: () => this.handleOrderPlaced(order),
          },
        ],
        { cancelable: true },
      );
    }, 1000);
  };

  handleOrderPlaced = async (order) => {
    const {
      selectedShippingMethod,
      selectedPaymentMethod,
      user,
      shoppingBag: stateShoppingBag,
    } = this.props;

    let shoppingBag;

    if (!this.shoppingBag) {
      shoppingBag = stateShoppingBag;
    } else {
      shoppingBag = this.shoppingBag;
    }

    const modelledOrder = new Order(
      new Date(),
      order.id,
      order.financial_status,
      order.total_price,
      shoppingBag.length > 0
        ? [...shoppingBag]
        : this.getProductsFromOrderHistory(),
      user,
      selectedShippingMethod,
      selectedPaymentMethod,
      user.shippingAddress,
      user.id,
    );

    await this.props.resetCheckout();
    Loading.hide(this.loading);
    this.props.onCancelPress && this.props.onCancelPress();
    this.props.navigation.navigate('Order', { appConfig: this.appConfig });
  };

  getProductsFromOrderHistory = () => {
    const order = this.props.orderHistory.find((product) => {
      return product.id === this.props.currentOrderId;
    });

    if (
      order &&
      order.shopertino_products &&
      order.shopertino_products.length > 0
    ) {
      return order.shopertino_products;
    }
    return [];
  };
}

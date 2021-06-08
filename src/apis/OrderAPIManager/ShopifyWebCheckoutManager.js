import { Alert, Linking } from 'react-native';
import Loading from 'react-native-loader-overlay';
import uuid from 'uuidv4';
import { shopifyDataManager } from '../shopify';
import { IMLocalized } from '../../Core/localization/IMLocalization';

export default class {
  constructor(props, appConfig, loading, shoppingBag, totalPrice) {
    this.props = props;
    this.appConfig = appConfig;
    this.loading = loading;
    this.shoppingBag = shoppingBag;
    this.totalPrice = totalPrice;
    this.shopifyCheckoutId;
  }

  startCheckout = async (loading) => {
    this.loading = loading;
    this.startOrder();
  };

  startOrder = async () => {
    return await this.createOrder();
  };

  createOrder = async () => {
    const {
      name,
      address,
      apt,
      zipCode,
      city,
      state,
      country,
    } = this.props.user?.shippingAddress;

    const lineItems = this.getLineItems();

    const params = {
      email: this.props.user.email,
      lineItems,
      shippingAddress: {
        address1: apt,
        address2: address,
        city: city,
        country: country,
        firstName: name,
        lastName: name,
        province: state,
        zip: zipCode,
      },
    };

    const {
      success,
      response,
      error,
    } = await shopifyDataManager.createCheckout(params);
    // shopifyDataManager.createOrder(params);

    if (success && response) {
      this.shopifyCheckoutId = response?.id;
      this.openWebUrl(response?.webUrl);
      return { checkoutId: response.id, webPayUrl: response.webUrl };
    }

    if (error) {
      Loading.hide(this.loading);
      new Error(error);
      if (JSON.parse(error?.message).length) {
        Alert.alert(JSON.parse(error?.message)[0].message);
      } else {
        Alert.alert(error?.message);
      }
    }
    return {};
  };

  getLineItems = () => {
    const productsItems =
      this.props.shoppingBag.length > 0
        ? [...this.props.shoppingBag]
        : this.getProductsFromOrderHistory();

    return productsItems.map((product) => {
      const { id, quantity } = product;
      return {
        quantity: parseInt(quantity, 10),
        variantId: id,
      };
    });
  };

  openWebUrl = async (url) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        IMLocalized(
          'An error occurred and we could not proceed with your checkout. Please try again later',
        ),
      );
    }
  };

  handleAppStateChange() {
    this.checkIfCheckoutCompleted();
  }

  checkIfCheckoutCompleted = async () => {
    if (!this.shopifyCheckoutId) {
      Loading.hide(this.loading);
      return;
    }

    const { success, response, error } = await shopifyDataManager.getCheckout(
      this.shopifyCheckoutId,
    );

    if (success && response) {
      response.order && alertOrderPLaced();
      !response.order &&
        response.webUrl &&
        this.alertShouldCompleteCheckout(response.webUrl);
    }

    if (error) {
      Loading.hide(this.loading);
    }
  };

  alertShouldCompleteCheckout = (paymentUrl) => {
    Alert.alert(
      IMLocalized('Checkout not complete'),
      IMLocalized('Do you want to complete your checkout?'),
      [
        {
          text: 'Complete checkout',
          onPress: () => this.openWebUrl(paymentUrl),
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => Loading.hide(this.loading),
        },
      ],
      { cancelable: true },
    );
  };

  alertOrderPLaced = () => {
    setTimeout(() => {
      Alert.alert(
        IMLocalized('Congratulations!'),
        IMLocalized('Your order has been placed successfully.'),
        [
          {
            text: 'OK',
            onPress: () => Loading.hide(this.loading),
          },
        ],
        { cancelable: true },
      );
    }, 1000);
  };

  chargeCustomer = async (source, totalPrice) => {};

  handleOrderPlaced = async (order, charge, response) => {};

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

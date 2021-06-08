import { Alert } from 'react-native';
import { shopifyDataManager } from '../shopify';
import deviceStorage from '../../utils/deviceStorage';
import { IMLocalized } from '../../Core/localization/IMLocalization';

export default class {
  unsubscribe() {}
  async loadShopData(callback) {
    let products = [];
    let categories = [];

    const { response, success } = await shopifyDataManager.loadProducts();
    const {
      response: catResponse,
      success: catSuccess,
    } = await shopifyDataManager.loadCategories();

    if (success) {
      products = response;
    }

    if (catSuccess) {
      categories = catResponse;
    }

    callback && callback({ products, categories });
  }

  async setWishlistState(props) {
    const wishlist = await deviceStorage.getWishlist(props.user.email);
    if (wishlist) {
      wishlist.map((wishlist) => {
        props.setWishlist(wishlist);
      });
    }
  }

  setWishlist(user, wishlist) {
    deviceStorage.storeWishlist(user.email, wishlist);
  }

  async loadPaymentMethod(user, callback) {
    const paymentMethods = await deviceStorage.getPaymentMethod(user.email);

    if (paymentMethods) {
      callback && callback({ paymentMethods });
    }
  }

  onUpdatePaymentMethod(props, token, source, paymentMethods) {
    if (source.success && source.data.response) {
      const newPaymentMethod = {
        ownerId: props.user.id,
        card: token.card,
      };
      paymentMethods.push(newPaymentMethod);
      props.updatePaymentMethods(paymentMethods);

      deviceStorage.storePaymentMethod(props.user.email, paymentMethods);
    }
  }

  onRemoveFromPaymentMethods(
    method,
    user,
    paymentMethods,
    removePaymentMethod,
  ) {
    paymentMethods = paymentMethods.filter((existingMethod) => {
      return existingMethod.card.cardId !== method.cardId;
    });

    if (paymentMethods) {
      deviceStorage.storePaymentMethod(user.email, paymentMethods);
      removePaymentMethod && removePaymentMethod(method);
    }
  }

  updateCustomerAddress(props, address) {
    shopifyDataManager.updateCustomerAddress(
      props.user.token,
      address,
      (res) => {
        console.log(res);
        if (res.success) {
          props.setUserData({
            user: {
              ...props.user,
              shippingAddress: address,
              stripeCustomer: props.user.stripeCustomer,
            },
          });
        }
        if (!res.success) {
          alert(
            IMLocalized(
              'Unfortunately an error occurred while saving ur address, please go back and enter a valid address before completing your order',
            ),
          );
        }
      },
    );
  }

  storeUserShippAddress(props, address) {
    if (!props.user.shippingAddress) {
      this.updateCustomerAddress(props, address);
      return;
    }

    const oldAddress = { ...props.user.shippingAddress };
    oldAddress.country = address.country;
    const stringifyOldAddress = JSON.stringify(
      Object.values(oldAddress),
    )?.toLowerCase();
    const stringifyNewAddress = JSON.stringify(
      Object.values(address),
    )?.toLowerCase();
    const didChangeAddress = stringifyOldAddress != stringifyNewAddress;

    if (!didChangeAddress) {
      return;
    }

    this.updateCustomerAddress(props, address);
  }

  onUpdateUser(props, userData) {
    //shopify
    // NOT YET DONE
  }

  loadOrder(user, callback) {
    shopifyDataManager.getCustomerOrder(user, (order) => {
      if (order.success) {
        callback && callback(order.response);
        return;
      }
      callback && callback();
    });
  }

  onShoppingBagContinuePress(props, appConfig, callback) {
    if (props.shoppingBag.length < 1) {
      return;
    }
    props.setSubtotalPrice(Number(props.totalShoppinBagPrice));

    if (!props.stripeCustomer && appConfig.isStripeCheckoutEnabled) {
      Alert.alert(
        IMLocalized('Oops! We are unable to continue this order.'),
        IMLocalized(
          'An unknown error occured and ur account will be logged out. Afterwards, Kindly login and try again.',
        ),
        [
          {
            text: 'Ok',
            onPress: () => callback && callback(),
          },
        ],
        { cancelable: true },
      );

      return;
    }

    if (!appConfig.isStripeCheckoutEnabled) {
      props.navigation.navigate('ShippingAddress', {
        appConfig,
      });
      return;
    }

    props.navigation.navigate('PaymentMethod', {
      appConfig,
    });
  }

  // onShoppingBagContinuePress(props, appConfig) {
  //   if (props.shoppingBag.length < 1) {
  //     return;
  //   }
  //   props.setSubtotalPrice(Number(props.totalShoppinBagPrice));

  //   props.navigation.navigate('ShippingAddress', {
  //     appConfig,
  //   });
  //   return;
  // }

  logout() {}
}

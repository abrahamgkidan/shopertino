import { NativeModules } from 'react-native';
import authDeviceStorage from '../AuthDeviceStorage';

const shopifyAPI = NativeModules.ShopifyAPI;

export default class ShopifyApiManager {
  constructor(SHOPIFY_CONFIG) {
    const config = {
      shopDomain: SHOPIFY_CONFIG.domain,
      apiKey: SHOPIFY_CONFIG.storefrontAccessToken,
    };
    shopifyAPI.configShop(config);
  }

  login(email, password) {
    const credentials = {
      email: email || '',
      password: password || '',
    };
    return new Promise((resolve, reject) => {
      shopifyAPI.loginWithCredentials(credentials, async (res, err) => {
        if (res?.success) {
          authDeviceStorage.setEmailLoginCredentials(email, password);
          resolve(res);
        } else {
          resolve(err);
        }
      });
    });
  }

  signup(userDetails) {
    const credentials = {
      email: userDetails.email || '',
      password: userDetails.password || '',
      firstName: userDetails.firstName || '',
      lastName: userDetails.lastName || '',
    };

    return new Promise((resolve, reject) => {
      shopifyAPI.signupWithCredentials(credentials, (res, err) => {
        if (res?.success) {
          authDeviceStorage.setEmailLoginCredentials(
            credentials.email,
            credentials.password,
          );

          resolve(res);
        } else {
          resolve(err);
        }
      });
    });
  }

  retrievePersistedAuthUser() {
    return new Promise(async (resolve, reject) => {
      const {
        email,
        password,
      } = await authDeviceStorage.getEmailLoginCredentials();

      if (email && password) {
        this.login(email, password).then((res) => {
          resolve(res);
        });
      } else {
        resolve(null);
      }
    });
  }
}

import { ShopifyApiManager } from '../../Core/ecommerceServices';
import PaymentRequestAPI from '../../Core/payment/api';
import { ErrorCode } from '../../Core/onboarding/utils/ErrorCode';
import deviceStorage from '../../utils/deviceStorage';

const defaultProfilePhotoURL =
  'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg';

const loginWithEmailAndPassword = (email, password, appConfig) => {
  const shopifyAPI = new ShopifyApiManager(appConfig.SHOPIFY_CONFIG);

  return new Promise(async (resolve, reject) => {
    shopifyAPI.login(email, password).then(async (res) => {
      if (res.success) {
        const user = await updateStripeFieldIfNeeded(res, appConfig);

        resolve({
          user,
        });
      } else {
        resolve({ error: res.error ? res.error : ErrorCode.noUser });
      }
    });
  });
};

const createAccountWithEmailAndPassword = (userDetails, appConfig) => {
  const shopifyAPI = new ShopifyApiManager(appConfig.SHOPIFY_CONFIG);

  return new Promise(async (resolve, reject) => {
    shopifyAPI.signup(userDetails).then(async (res) => {
      if (res.success) {
        const user = await updateStripeFieldIfNeeded(res, appConfig);

        resolve({
          user,
        });
      } else {
        resolve({ error: res.error ? res.error : ErrorCode.serverError });
      }
    });
  });
};

const validateUsernameFieldIfNeeded = () => {
  return new Promise(async (resolve, reject) => {
    resolve({ success: true });
  });
};

const retrievePersistedAuthUser = (appConfig) => {
  const shopifyAPI = new ShopifyApiManager(appConfig.SHOPIFY_CONFIG);

  return new Promise(async (resolve, reject) => {
    shopifyAPI.retrievePersistedAuthUser().then(async (res) => {
      if (res?.success) {
        const user = await updateStripeFieldIfNeeded(res, appConfig);

        resolve({
          user,
        });
      } else {
        resolve({ error: ErrorCode.noUser });
      }
    });
  });
};

const logout = (user) => {};

const updateStripeFieldIfNeeded = async (user, appConfig) => {
  if (!appConfig.isStripeCheckoutEnabled) {
    return user;
  }

  const paymentRequestAPI = new PaymentRequestAPI(appConfig);

  const deviceStripeCustomer = await deviceStorage.getStripeCustomer(
    user.email,
  );

  if (deviceStripeCustomer) {
    return { ...user, stripeCustomer: deviceStripeCustomer };
  }

  const res = await paymentRequestAPI.createStripeCustomer(user.email);

  if (res.success && res.data.customer.id) {
    const stripeCustomer = res.data.customer.id;
    deviceStorage.storeStripeCustomer(user.email, stripeCustomer);
    return { ...user, stripeCustomer };
  }

  return user;
};

const authManager = {
  retrievePersistedAuthUser,
  loginWithEmailAndPassword,
  logout,
  createAccountWithEmailAndPassword,
  validateUsernameFieldIfNeeded,
};

export default authManager;

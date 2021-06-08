import { userAPIManager } from '../../api';

export const updateUserShippingAddress = async (userId, shippingAddress) => {
  try {
    userAPIManager.updateUserData(userId, {
      shippingAddress,
    });
    return { success: true };
  } catch (error) {
    return { error, success: false };
  }
};

import AsyncStorage from '@react-native-community/async-storage';

const CREDENTIAL_KEYS = {
  email: 'EMAIL',
  password: 'PASSWORD',
};

const setEmailLoginCredentials = async (email, password) => {
  try {
    await AsyncStorage.setItem(CREDENTIAL_KEYS.email, email);
    await AsyncStorage.setItem(CREDENTIAL_KEYS.password, password);
  } catch (err) {
    console.log(err);
  }
};

const getEmailLoginCredentials = async () => {
  try {
    const email = await AsyncStorage.getItem(CREDENTIAL_KEYS.email);
    const password = await AsyncStorage.getItem(CREDENTIAL_KEYS.password);
    return { email, password };
  } catch (err) {
    console.log(err);
  }
};

const removeEmailLoginCredentials = async () => {
  try {
    await AsyncStorage.removeItem(CREDENTIAL_KEYS.email);
    await AsyncStorage.removeItem(CREDENTIAL_KEYS.password);
  } catch (err) {
    console.log(err);
  }
};

const authDeviceStorage = {
  setEmailLoginCredentials,
  getEmailLoginCredentials,
  removeEmailLoginCredentials
};

export default authDeviceStorage;

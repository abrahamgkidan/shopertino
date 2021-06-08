import deviceStorage from '../../utils/deviceStorage';

const SET_LOADER = 'SET_LOADER';
const UPDATE_USER = 'UPDATE_USER';
const LOGOUT = 'LOG_OUT';

export const logout = (data) => ({
  type: LOGOUT,
  data,
});

export const setLoader = () => ({
  type: SET_LOADER,
});

export const setUserData = (data) => ({
  type: UPDATE_USER,
  data,
});

const initialState = {
  isLoading: false,
  user: {},
  stripeCustomer: '',
};

export const app = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOADER:
      return {
        ...state,
        isLoading: action.data,
      };
    case UPDATE_USER:
      return {
        ...state,
        user: action.data.user,
        stripeCustomer: action.data.user.stripeCustomer,
      };
    case LOGOUT:
      deviceStorage.logoutDeviceStorage();
      return initialState;

    default:
      return state;
  }
};

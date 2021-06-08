//default
import axios from 'axios';
import appConfig from '../ShopertinoConfig';

//shopify
export * from './shopify';

export default axios.create(appConfig.stripeEnv.API);

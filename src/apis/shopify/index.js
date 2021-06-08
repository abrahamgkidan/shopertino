import Client from 'shopify-buy';
import ShopifyNetworkRequest from './ShopifyNetworkRequestModel';
import AppConfig from '../../ShopertinoConfig';

const config = {
  domain: AppConfig.SHOPIFY_CONFIG.domain,
  storefrontAccessToken: AppConfig.SHOPIFY_CONFIG.storefrontAccessToken,
};

const client = Client.buildClient(config);

export const shopifyDataManager = new ShopifyNetworkRequest(client);

import { NativeModules } from 'react-native';
import Category from './../../models/Category';
import Product from './../../models/Product';
import Order from './../../models/Order';
import AppConfig from '../../ShopertinoConfig';

const shopifyAPI = NativeModules.ShopifyAPI;

export default class ShopifyNetworkRequest {
  static allCategories = null;

  constructor(client) {
    this.client = client;
    const config = {
      shopDomain: AppConfig.SHOPIFY_CONFIG.domain,
      apiKey: AppConfig.SHOPIFY_CONFIG.storefrontAccessToken,
    };
    this.shopifyAPI = shopifyAPI;
    this.shopifyAPI.configShop(config);
  }

  async loadCategories() {
    try {
      if (this.allCategories != null) {
        return { response: this.allCategories, success: true };
      }

      const collections = await this.client.collection.fetchAllWithProducts();

      const response = collections.map((collection) => {
        const { id, title, image } = collection;
        const photo = image && image.src ? image.src : '';

        return new Category(
          id,
          title,
          photo,
          this.processProducts(collection.products),
        );
      });

      this.allCategories = response;

      return { response, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async getCheckout(id) {
    try {
      const checkout = await this.client.checkout.fetch(id);

      return { response: checkout, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async createCheckout(params) {
    try {
      const checkout = await this.client.checkout.create(params);

      return { response: checkout, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async createOrder(params) {
    try {
      const res = await fetch(
        `https://${AppConfig.SHOPIFY_CONFIG.domain}/admin/api/2020-07/orders.json`,
        {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Shopify-Access-Token': AppConfig.SHOPIFY_CONFIG.password,
          },
          body: JSON.stringify(params),
        },
      );

      return await res.json();
    } catch (error) {
      return { error, success: false };
    }
  }

  async loadProducts() {
    try {
      const products = await this.client.product.fetchAll();

      return { response: this.processProducts(products), success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  getCustomerOrder(user, callback) {
    if (!user.token) {
      callback(null);
      return;
    }
    this.shopifyAPI.getCustomerOrder(user.token, (res, err) => {
      if (res?.success) {
        const order = this.processOrders(user, res.order);

        callback({ response: order, success: res.success });
        return;
      }
      callback({ response: null, success: res.success, error: err?.error });
    });
  }

  updateCustomerAddress(token, address, callback) {
    if (!token || !address) {
      callback(null);
    }
    this.shopifyAPI.updateCustomerAddress(token, address, (res, err) => {
      if (res?.success) {
        callback(res);
        return;
      }
      callback(err);
    });
  }

  processOrders(user, orders) {
    return orders.map((order) => {
      const shoppingBag = this.getShoppingBagItems(order.lineItems);

      return new Order(
        new Date(order.createdAt),
        order.id,
        order.status,
        Number(order.totalPrice),
        shoppingBag,
        user,
        null,
        null,
        user.shippingAddress,
        user.id,
      );
    });
  }

  getShoppingBagItems = (lineItems) => {
    return lineItems.map((item) => {
      return {
        id: item.id,
        quantity: item?.quantity ? item?.quantity : 1,
        photo: item.image,
        name: item.title,
        price: item.price,
      };
    });
  };

  processProducts(products) {
    return products.map((product) => {
      const images = this.getImages(product);

      return new Product(
        product.variants[0].id,
        product.title,
        product.variants[0].price,
        product.description,
        images[0],
        images,
      );
    });
  }

  getImages(product) {
    return product.images.map((image) => {
      return image.src;
    });
  }
}

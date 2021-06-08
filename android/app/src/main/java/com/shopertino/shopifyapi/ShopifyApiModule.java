package com.shopertino.shopifyapi;

import android.util.Log;

import androidx.annotation.NonNull;


import com.facebook.react.bridge.Callback;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import com.shopify.buy3.*;
import com.shopify.graphql.support.ID;
import com.shopify.graphql.support.Input;


interface ShopifyCallback {
  void onCompletion();
}



public class ShopifyApiModule extends ReactContextBaseJavaModule implements ShopifyCallback{

  private final ReactApplicationContext context;

  private String shopDomain = "";
  private String apiKey = "";

  public ShopifyApiModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
  }

  @Override
  public String getName() {
    return "ShopifyAPI";
  }

  @Override
  public void onCompletion() {

  }

  private WritableMap errorMap(String token){

    WritableMap errorCustomerMap = new WritableNativeMap();

    errorCustomerMap.putBoolean("success", false);
    errorCustomerMap.putString("token", token);

    return errorCustomerMap;
  }

  @ReactMethod
  public void configShop(ReadableMap config) {
    this.shopDomain = config.getString("shopDomain");
    this.apiKey = config.getString("apiKey");
  }

  private Storefront.QueryRootQuery buildLoginQuery(String accessToken) {
    return Storefront.query(root -> root
            .customer(accessToken, customer -> customer
                    .id()
                    .firstName()
                    .lastName()
                    .email()
                    .addresses(arg -> arg.first(10), connection -> connection
                            .edges(edge -> edge
                                    .node(node -> node
                                            .address1()
                                            .address2()
                                            .city()
                                            .province()
                                            .country()
                                            .zip()
                                            .firstName()
                                    )
                            )
                    )

            )
    );
  };

  private Storefront.QueryRootQuery buildOrderQuery(String accessToken) {
    return Storefront.query(root -> root
            .customer(accessToken, customer -> customer
                    .orders(arg -> arg.first(10), connection -> connection
                            .edges(edge -> edge
                                    .node(node -> node
                                            .orderNumber()
                                            .totalPrice()
                                            .processedAt()
                                            .lineItems(arg -> arg.first(10), orderConnection -> orderConnection
                                                    .edges(orderEdge -> orderEdge
                                                            .node(orderNode -> orderNode
                                                                    .title()
                                                                    .variant( variant -> variant
                                                                            .title()
                                                                            .price()
                                                                    )

                                                            )
                                                    ))
                                    )
                            )
                    )

            )
    );
  };

  private ReadableMap structureLoginResponse(Storefront.Customer customer, String email, String accessToken) {
    WritableMap customerMap = new WritableNativeMap();
    WritableMap shippingAddress = new WritableNativeMap();

    List<Storefront.MailingAddressEdge> address = customer.getAddresses().getEdges();

    for (Storefront.MailingAddressEdge obj : address) {
      shippingAddress.putString("apt", obj.getNode().getAddress1());
      shippingAddress.putString("address", obj.getNode().getAddress2());
      shippingAddress.putString("city", obj.getNode().getCity());
      shippingAddress.putString("state", obj.getNode().getProvince());
      shippingAddress.putString("country", obj.getNode().getCountry());
      shippingAddress.putString("zipCode", obj.getNode().getZip());
      shippingAddress.putString("email", email);
      shippingAddress.putString("name", obj.getNode().getFirstName());
    }

    String firstName = customer.getFirstName();
    String lastName = customer.getLastName();
    String userId = customer.getId().toString();


    customerMap.putBoolean("success", true);
    customerMap.putString("firstName", firstName);
    customerMap.putString("lastName", lastName);
    customerMap.putString("email", email);
    customerMap.putString("token", accessToken.toString());
    customerMap.putString("id", userId);
    customerMap.putMap("shippingAddress", shippingAddress);

    return customerMap;
  };

  private ReadableMap structureOrderResponse(Storefront.Customer customer) {
    WritableMap responseMap = new WritableNativeMap();
    WritableArray customerOrders = new WritableNativeArray();

    List<Storefront.OrderEdge> order = customer.getOrders().getEdges();

    for (Storefront.OrderEdge obj : order) {
      WritableMap customerOrder = new WritableNativeMap();
      WritableArray lineItems = new WritableNativeArray();

      customerOrder.putString("id", obj.getNode().getId().toString());
      customerOrder.putString("totalPrice", obj.getNode().getTotalPrice().toString());
      customerOrder.putString("orderNumber", obj.getNode().getOrderNumber().toString());
      customerOrder.putString("createdAt", obj.getNode().getProcessedAt().toString());
      List<Storefront.OrderLineItemEdge> orderLineItems = obj.getNode().getLineItems().getEdges();


      for (Storefront.OrderLineItemEdge orderLineItem : orderLineItems) {
        WritableMap lineItem = new WritableNativeMap();

        lineItem.putString("id", orderLineItem.getNode().getVariant().getId().toString() );
        lineItem.putString("title", orderLineItem.getNode().getVariant().getTitle());
        lineItem.putString("price", orderLineItem.getNode().getVariant().getPrice().toString());
        // lineItem.putString("image", orderLineItem.getNode().getVariant().getImage().getOriginalSrc());
        lineItems.pushMap(lineItem);
      }
      customerOrder.putArray("lineItems", lineItems);
      customerOrders.pushMap(customerOrder);
    }

    responseMap.putBoolean("success", true);
    responseMap.putArray("order", customerOrders);

    return responseMap;
  };

  @ReactMethod
  public void loginWithCredentials(ReadableMap credentials, Callback callback) {
    String email = credentials.getString("email");
    String password = credentials.getString("password");

    StringBuffer userToken = new StringBuffer("");

    final ShopifyApiModule self = this;


    //a map/JSON Object to send back in the event of an error
    WritableMap errorCustomerMap = this.errorMap(userToken.toString());

    try {

      GraphClient graphClient = GraphClient.builder(this.context)
              .shopDomain(this.shopDomain)
              .accessToken(this.apiKey).build();

      Storefront.CustomerAccessTokenCreateInput input = new Storefront.CustomerAccessTokenCreateInput(email, password);

      Storefront.MutationQuery loginMutation = Storefront.mutation(mutation -> mutation
              .customerAccessTokenCreate(input, query -> query
                      .customerAccessToken(customerAccessToken -> customerAccessToken
                              .accessToken()
                              .expiresAt()
                      )
                      .userErrors(userError -> userError
                              .field()
                              .message()
                      )
              )
      );


      MutationGraphCall call = graphClient.mutateGraph(loginMutation);

      call.enqueue(new GraphCall.Callback<Storefront.Mutation>(){


        @Override
        public void onResponse(@NonNull GraphResponse<Storefront.Mutation> response) {

          if (response.data().getCustomerAccessTokenCreate().getCustomerAccessToken() != null){
            userToken.append((String)(response.data().getCustomerAccessTokenCreate().getCustomerAccessToken().responseData.get("accessToken")));
          }

          Storefront.QueryRootQuery userQuery = self.buildLoginQuery(userToken.toString());

          QueryGraphCall queryCall = graphClient.queryGraph(userQuery);

          queryCall.enqueue(new GraphCall.Callback<Storefront.QueryRoot>() {

            @Override
            public void onResponse(@NonNull GraphResponse<Storefront.QueryRoot> response) {

              if (response.data().getCustomer() != null){

                String email = response.data().getCustomer().getEmail();

                ReadableMap customResponse = self.structureLoginResponse(response.data().getCustomer(), email, userToken.toString());

                //if the data exists, everything is safe to proceed
                if (email != null){
                  callback.invoke(customResponse, null);
                }

              }
              else {
                callback.invoke(null, errorCustomerMap);
              }
            }

            @Override
            public void onFailure(@NonNull GraphError error) {
              callback.invoke(error.getLocalizedMessage(), errorCustomerMap);
            }

          });
        }

        @Override
        public void onFailure(@NonNull GraphError error) {
          errorCustomerMap.putString("error",error.getLocalizedMessage());

          callback.invoke(error.getLocalizedMessage(), errorCustomerMap);
        }
      });


    }
    catch (Exception e) {
      errorCustomerMap.putString("error",e.getLocalizedMessage());

      callback.invoke(e.getLocalizedMessage(), errorCustomerMap);
    }


  }


  @ReactMethod
  public void signupWithCredentials(ReadableMap credentials, Callback callback){
    String firstname = credentials.getString("firstName");
    String lastname = credentials.getString("lastName");
    String email = credentials.getString("email");
    String password = credentials.getString("password");
     

    final ShopifyApiModule self = this;

    WritableMap errorCustomerMap = this.errorMap("");

    try {

      GraphClient graphClient = GraphClient.builder(this.context)
              .shopDomain(this.shopDomain)
              .accessToken(this.apiKey).build();


      Storefront.CustomerCreateInput input = new Storefront.CustomerCreateInput(email, password)
              .setFirstName(firstname)
              .setLastName(lastname)
              .setAcceptsMarketing(true);



      Storefront.MutationQuery signupMutation = Storefront.mutation(mutation -> mutation
              .customerCreate(input, query -> query
                      .customer(customer -> customer
                              .id()
                              .email()
                              .firstName()
                              .lastName()
                      )
                      .userErrors(userError -> userError
                              .field()
                              .message()
                      )
              )
      );


      MutationGraphCall call = graphClient.mutateGraph(signupMutation);

      call.enqueue(new GraphCall.Callback<Storefront.Mutation>() {

        @Override
        public void onResponse(@NonNull GraphResponse<Storefront.Mutation> response) {

          //get the hash map and convert it into a Writable map so that it can be sent to React Native
          Storefront.Customer customer = response.data().getCustomerCreate().getCustomer();
          WritableMap responseMap = new WritableNativeMap();

          if (customer != null){

            responseMap.putBoolean("success", true);
            responseMap.putString("firstName", customer.getFirstName());
            responseMap.putString("lastName", customer.getLastName());
            responseMap.putString("email", customer.getEmail());
            responseMap.putString("id", customer.getId().toString());

            self.loginWithCredentials(credentials, callback);

          }
          else {
            callback.invoke("No Customer Found", errorCustomerMap);
          }


        }

        @Override
        public void onFailure(@NonNull GraphError error) {
          errorCustomerMap.putString("error", error.getLocalizedMessage());
          callback.invoke(error.getLocalizedMessage(), errorCustomerMap);
        }

      });


    }
    catch (Exception e) {
      errorCustomerMap.putString("error",e.getLocalizedMessage());

      callback.invoke(e.getLocalizedMessage(), errorCustomerMap);
    }

  }

  @ReactMethod
  public void getCustomerOrder(String token, Callback callback) {
    WritableMap errorCustomerMap = this.errorMap("");

    final ShopifyApiModule self = this;

    try {
      GraphClient graphClient = GraphClient.builder(this.context)
              .shopDomain(this.shopDomain)
              .accessToken(this.apiKey).build();

      Storefront.QueryRootQuery orderQuery = self.buildOrderQuery(token);


      QueryGraphCall queryCall = graphClient.queryGraph(orderQuery);

      queryCall.enqueue(new GraphCall.Callback<Storefront.QueryRoot>() {

        @Override
        public void onResponse(@NonNull GraphResponse<Storefront.QueryRoot> response) {

          if (response.data().getCustomer() != null){

            ReadableMap customResponse = self.structureOrderResponse(response.data().getCustomer());

            callback.invoke(customResponse, null);

          }
          else {
            callback.invoke(null, errorCustomerMap);
          }
        }

        @Override
        public void onFailure(@NonNull GraphError error) {
          errorCustomerMap.putString("error", error.getLocalizedMessage());
          callback.invoke(error.getLocalizedMessage(), errorCustomerMap);
        }

      });
    }catch (Exception e) {
      errorCustomerMap.putString("error",e.getLocalizedMessage());
      callback.invoke(e.getLocalizedMessage(), errorCustomerMap);
    }
  }

  @ReactMethod
  public void updateCustomerAddress(String token, ReadableMap address, Callback callback){

    WritableMap errorCustomerMap = this.errorMap("");

    try {

      GraphClient graphClient = GraphClient.builder(this.context)
              .shopDomain(this.shopDomain)
              .accessToken(this.apiKey).build();


      Storefront.MailingAddressInput input = new Storefront.MailingAddressInput()
              .setAddress1(address.getString("apt"))
              .setAddress2(address.getString("address"))
              .setCity(address.getString("city"))
              .setCountry(address.getString("country"))
              .setFirstName(address.getString("name"))
              .setLastName(address.getString("name"))
              .setProvince(address.getString("state"))
              .setZip(address.getString("zipCode"));


      Storefront.MutationQuery addressMutation = Storefront.mutation(mutation -> mutation
              .customerAddressCreate(token, input, query -> query
                      .customerAddress(customerAddress -> customerAddress
                              .address1()
                              .address2()
                      )
                      .userErrors(userError -> userError
                              .field()
                              .message()
                      )
              )
      );


      MutationGraphCall call = graphClient.mutateGraph(addressMutation);

      call.enqueue(new GraphCall.Callback<Storefront.Mutation>() {

        @Override
        public void onResponse(@NonNull GraphResponse<Storefront.Mutation> response) {

          WritableMap responseMap = new WritableNativeMap();

          if (response.data().getCustomerAddressCreate().getCustomerAddress() != null){

            responseMap.putBoolean("success", true);

            callback.invoke(responseMap, errorCustomerMap);

          }
          else {
            responseMap.putBoolean("success", false);

            callback.invoke(responseMap, errorCustomerMap);
          }


        }

        @Override
        public void onFailure(@NonNull GraphError error) {
          errorCustomerMap.putString("error", error.getLocalizedMessage());
          callback.invoke(error.getLocalizedMessage(), errorCustomerMap);
        }

      });


    }
    catch (Exception e) {
      errorCustomerMap.putString("error",e.getLocalizedMessage());
      callback.invoke(e.getLocalizedMessage(), errorCustomerMap);
    }

  }


}
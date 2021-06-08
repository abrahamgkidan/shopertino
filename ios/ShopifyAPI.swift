//
//  ShopifyAPI.swift
//  Shopertino
//
//  Created by instamobile.io on 8/27/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit
import MobileBuySDK

@objc(ShopifyAPI)
class ShopifyAPI: NSObject {
  var shopDomain: String = "";
  var apiKey: String = "";
  
  @objc(configShop:)
  func configShop(config:[String:String]) {
    self.apiKey = config["apiKey"]!;
    self.shopDomain = config["shopDomain"]!;
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  func buildLoginQuery(accessToken: String) -> Storefront.QueryRootQuery {
    return Storefront.buildQuery { $0
      .customer(customerAccessToken: accessToken ) { $0
          .id()
          .firstName()
          .lastName()
          .email()
          .addresses(first: 10) { $0
              .edges { $0
                  .node { $0
                      .address1()
                      .address2()
                      .city()
                      .province()
                      .country()
                      .zip()
                    .firstName()
                  }
              }
          }
      }
    }
  }
  
  func buildOrderQuery(accessToken: String) -> Storefront.QueryRootQuery {
    return Storefront.buildQuery { $0
      .customer(customerAccessToken: accessToken ) { $0
          .orders(first: 10) { $0
            .edges { $0
                .node { $0
                    .id()
                    .orderNumber()
                    .totalPrice()
                    .processedAt()
                    .financialStatus()
                    .lineItems(first: 10) { $0
                      .edges { $0
                        .node { $0
                          .title()
                          .variant { $0
                            .id()
                            .title()
                            .price()
                            .image {  $0
                              .originalSrc()
                            }
                          }
                        }
                      }
                   }
                }
             }
           }
         }
      }
  }
  
  
  func structureLoginResponse(customer: Storefront.Customer, email: String, accessToken: String) -> [String:Any] {
    var shippingAddress: [String: String] = [:];
    let address = (customer.addresses.edges) as Array;
    
    for obj in address {
      shippingAddress["apt"] = obj.node.address1
      shippingAddress["address"] = obj.node.address2
      shippingAddress["city"] = obj.node.city
      shippingAddress["state"] = obj.node.province
      shippingAddress["country"] = obj.node.country
      shippingAddress["zipCode"] = obj.node.zip
      shippingAddress["email"] = email
      shippingAddress["name"] = obj.node.firstName
    }
    
    return ["success": true,
            "firstName": customer.firstName! as Any,
            "lastName": customer.lastName as Any ,
            "email": customer.email! as Any,
            "id": customer.id.rawValue as Any,
            "shippingAddress": shippingAddress,
            "token": accessToken]
  }
  
  func structureOrderResponse(customer: Storefront.Customer) -> [String:Any] {
    var customerOrders: [Any] = [] ;
    var customerOrder: [String: Any] = [:];

    let order = (customer.orders.edges) as Array;
    
    for obj in order {
      var lineItems: [Any] = [];
      var lineItem: [String: Any] = [:];
      customerOrder["id"] = obj.node.id.rawValue;
      customerOrder["totalPrice"] = obj.node.totalPrice;
      customerOrder["orderNumber"] = obj.node.orderNumber;
      customerOrder["createdAt"] = obj.node.processedAt.description;
      customerOrder["status"] = obj.node.financialStatus?.rawValue;
      let orderLineItems = obj.node.lineItems.edges as Array;
      
      for orderLineItem in orderLineItems {
        lineItem["id"] = orderLineItem.node.variant?.id.rawValue;
        lineItem["title"] = orderLineItem.node.variant?.title
        lineItem["price"] = orderLineItem.node.variant?.price ?? ""
        lineItem["image"] = orderLineItem.node.variant?.image?.originalSrc.absoluteString ?? ""
        lineItems.append(lineItem);
      }
      customerOrder["lineItems"] = lineItems;
      customerOrders.append(customerOrder)
    }
    
    return ["success": true,
            "order": customerOrders]
  }
  
  @objc(loginWithCredentials:callback:)
  func loginWithCredentials(credentials: [String:String], callback: @escaping RCTResponseSenderBlock ) {
    
    let client = Graph.Client( shopDomain: self.shopDomain, apiKey: self.apiKey);
    let input = Storefront.CustomerAccessTokenCreateInput.create(
      email: credentials["email"]!,
      password: credentials["password"]!
    )
    let loginMutation = Storefront.buildMutation { $0
      .customerAccessTokenCreate(input: input) { $0
        .customerAccessToken { $0
          .accessToken()
          .expiresAt()
        }
        .customerUserErrors { $0
          .field()
          .message()
        }
      }
    }
    
    client.mutateGraphWith(loginMutation) { response, error in
      
      //if there is a response
      if(response != nil){
        
        let accessToken = response?.customerAccessTokenCreate?.customerAccessToken?.accessToken;
        let userQuery = self.buildLoginQuery(accessToken: accessToken ?? " ");
        
        client.queryGraphWith(userQuery, completionHandler: { (res, err) in
          
//         if there is no error AND the customer IS NOT EMPTY
          if(err == nil && res?.customer != nil){
            
            let customResponse = self.structureLoginResponse(customer: (res?.customer)!, email: credentials["email"]!, accessToken: accessToken!);
            
            callback([customResponse,err as Any]);
          }
          else {
             let errorResponse = ["success": false, "error": err?.localizedDescription ?? ""] as [String : Any]
                   callback([nil ?? "", errorResponse])
          }
          
        }).resume()
        
      }
      else {
        let errorResponse = ["success": false, "error": error?.localizedDescription ?? ""] as [String : Any]
        callback([nil ?? "", errorResponse])
      }
      
    }.resume()
  }
  

  @objc(signupWithCredentials:callback:)
   func signupWithCredentials(credentials: [String:String], callback: @escaping RCTResponseSenderBlock ) {

    let client = Graph.Client( shopDomain: self.shopDomain, apiKey: self.apiKey);
    
    let input = Storefront.CustomerCreateInput.create(
      email:  credentials["email"]!,
      password: credentials["password"]!,
      firstName:  .value(credentials["firstName"]!),
      lastName: .value(credentials["lastName"]!),
      acceptsMarketing: .value(true)
    );
    
    let signupMutation = Storefront.buildMutation { $0
      .customerCreate(input: input) { $0
        .customer { $0
          .id()
          .email()
          .firstName()
          .lastName()
        }
        .customerUserErrors { $0
          .field()
          .message()
        }
      }
    }
    
    client.mutateGraphWith(signupMutation) { (res, err) in
      
      //if there is a response
      if(res != nil){
        
        let customer = res?.customerCreate?.customer;

        if(customer?.id.rawValue.count ?? 0 > 0){
          self.loginWithCredentials(credentials: credentials, callback: callback);
        } else {
           let errorResponse = ["success": false, "error": err?.localizedDescription ?? ""] as [String : Any]
                 callback([nil ?? "", errorResponse])
        }
        
      }
      else {
         let errorResponse = ["success": false, "error": err?.localizedDescription ?? ""] as [String : Any]
               callback([nil ?? "", errorResponse])
      }
      
    }.resume();
    
  }
  
  @objc(getCustomerOrder:callback:)
  func getCustomerOrder(token: NSString, callback: @escaping RCTResponseSenderBlock ) {
    
    let client = Graph.Client( shopDomain: self.shopDomain, apiKey: self.apiKey);
    
    let orderQuery = self.buildOrderQuery(accessToken: token as String)
    
    client.queryGraphWith(orderQuery, completionHandler: { (res, err) in
              
      if(err == nil && res?.customer != nil){
                
        let customResponse = self.structureOrderResponse(customer: (res?.customer)!);
                
                callback([customResponse,err as Any]);
      }
      else {
         let errorResponse = ["success": false, "error": err?.localizedDescription ?? ""] as [String : Any]
               callback([nil ?? "", errorResponse])
      }
              
    }).resume()
    
  }
  
  @objc(updateCustomerAddress:address:callback:)
  func updateCustomerAddress(token: NSString, address: [String:String], callback: @escaping RCTResponseSenderBlock ) {

    let client = Graph.Client( shopDomain: self.shopDomain, apiKey: self.apiKey);
    
    let input = Storefront.MailingAddressInput.create(
        address1:  .value(address["apt"]!),
        address2:  .value(address["address"]!),
        city:      .value(address["city"]!),
        country:      .value(address["country"]!),
        firstName: .value(address["name"]!),
        lastName:  .value(address["name"]!),
        province:  .value(address["state"]!),
        zip:       .value(address["zipCode"]!)
    );
    
    let updateAddressMutation = Storefront.buildMutation { $0
      .customerAddressCreate(customerAccessToken: token as String, address: input) { $0
        .customerAddress { $0
          .id()
          .address1()
          .address2()
        }
        .customerUserErrors { $0
          .field()
          .message()
        }
      }
    }
    
    client.mutateGraphWith(updateAddressMutation) { (res, err) in
      
      if(res?.customerAddressCreate?.customerAddress != nil){
        callback([["success": true], err as Any]);
      }
      else {
        
         let errorResponse = ["success": false, "error": err?.localizedDescription ?? ""] as [String : Any]
               callback([nil ?? "", errorResponse])
      }
      
    }.resume();
    
  }
}


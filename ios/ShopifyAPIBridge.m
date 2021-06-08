//
//  ShopifyAPIBridge.m
//  Shopertino
//
//  Created by shola emmanuel on 8/27/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "ShopifyAPIBridge.h"
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ShopifyAPI, NSObject)

RCT_EXTERN_METHOD(configShop: (NSDictionary *) config)

RCT_EXTERN_METHOD(loginWithCredentials: (NSDictionary *) credentials callback: (RCTResponseSenderBlock) callback)

RCT_EXTERN_METHOD(signupWithCredentials: (NSDictionary *) credentials callback: (RCTResponseSenderBlock) callback)

RCT_EXTERN_METHOD(getCustomerOrder: (NSString *) token callback: (RCTResponseSenderBlock) callback)

RCT_EXTERN_METHOD(updateCustomerAddress: (NSString *) token address: (NSDictionary *) address callback: (RCTResponseSenderBlock) callback)


@end

import React, { useState, useEffect, useRef } from 'react';
import Button from 'react-native-button';
import { AppState, Image, Keyboard, Platform, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import TNActivityIndicator from '../../truly-native/TNActivityIndicator';
import { IMLocalized } from '../../localization/IMLocalization';
import dynamicStyles from './styles';
import { useColorScheme } from 'react-native-appearance';
import { setUserData } from '../redux/auth';
import { IMDismissButton } from '../../truly-native';

const WelcomeScreen = (props) => {
  const currentUser = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const appStyles = props?.appStyles
    ? props?.appStyles
    : props.route?.params?.appStyles;
  const colorScheme = useColorScheme();
  const styles = dynamicStyles(appStyles, colorScheme);
  const appConfig = props?.appConfig
    ? props?.appConfig
    : props.route?.params?.appConfig;
  const authManager = props?.authManager
    ? props?.authManager
    : props.route?.params?.authManager;

  const { title, caption } = props;

  useEffect(() => {
    tryToLoginFirst();
  }, []);

  const tryToLoginFirst = async () => {
    authManager
      .retrievePersistedAuthUser(appConfig)
      .then((response) => {
        if (response?.user) {
          const user = response.user;
          dispatch(
            setUserData({
              user: response.user,
            }),
          );
          Keyboard.dismiss();
          props.navigation.reset({
            index: 0,
            routes: [{ name: 'MainStack', params: { user: user } }],
          });
          return;
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  if (isLoading == true) {
    return <TNActivityIndicator appStyles={appStyles} />;
  }

  return (
    <View style={styles.container}>
      {props.delayedMode && (
        <IMDismissButton
          style={styles.dismissButton}
          tintColor={appStyles.colorSet[colorScheme].mainThemeForegroundColor}
          onPress={() => props.navigation.goBack()}
        />
      )}
      <View style={styles.logo}>
        <Image
          style={styles.logoImage}
          source={
            props.delayedMode
              ? appStyles.iconSet.delayedLogo
              : appStyles.iconSet.logo
          }
        />
      </View>
      <Text style={styles.title}>
        {title ? title : appConfig.onboardingConfig.welcomeTitle}
      </Text>
      <Text style={styles.caption}>
        {caption ? caption : appConfig.onboardingConfig.welcomeCaption}
      </Text>
      <Button
        containerStyle={styles.loginContainer}
        style={styles.loginText}
        onPress={() => {
          props.navigation.navigate('LoginStack', {
            screen: 'Login',
            params: {
              appStyles,
              appConfig,
              authManager,
            },
          });
        }}>
        {IMLocalized('Log In')}
      </Button>
      <Button
        containerStyle={styles.signupContainer}
        style={styles.signupText}
        onPress={() => {
          props.navigation.navigate('LoginStack', {
            screen: 'Signup',
            params: {
              appStyles,
              appConfig,
              authManager,
            },
          });
        }}>
        {IMLocalized('Sign Up')}
      </Button>
    </View>
  );
};

export default WelcomeScreen;

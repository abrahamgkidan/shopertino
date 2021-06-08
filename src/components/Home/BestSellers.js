import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  Modal,
  BackHandler,
  TouchableOpacity,
  Image,
  Linking
} from 'react-native';
import ProductGrid from '../ProductGrid/ProductGrid';
import FooterButton from '../FooterButton/FooterButton';
import { useColorScheme } from 'react-native-appearance';
import { IMLocalized } from '../../Core/localization/IMLocalization';
import dynamicStyles from './styles';
import { WebView } from "react-native-webview";
function BestSellers(props) {
  const colorScheme = useColorScheme();
  const styles = dynamicStyles(colorScheme);
  const {
    bestSellerProducts,
    title,
    extraData,
    onCardPress,
    shouldLimit,
    limit,
    appConfig,
  } = props;
  const [showModal, setShowModal] = useState(false);

  function handleBackButtonClick() {
    console.log('handleBackButtonClick');
    return true;
  }

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick);
    };
  }, []);
  const onFooterPress = () => {
    // props.navigation.navigate('CategoryProductGrid', {
    //   title: IMLocalized('Best Sellers'),
    //   products: bestSellerProducts,
    //   appConfig,
    // });
    console.log('open webview here');
    setShowModal(true)
    // Linking.openURL('https://thegivingmovement.com/collections/women-manual')
  };

  const renderlistFooter = () => (
    <FooterButton
      onPress={() => onFooterPress()}
      title={IMLocalized('Browse all')}
    />
  );

  const data = [...bestSellerProducts];

  return (
    <View style={styles.unitContainer}>
      <Text style={styles.unitTitle}>{title}</Text>
      <ProductGrid
        products={shouldLimit ? data.splice(0, limit) : data}
        onCardPress={onCardPress}
        extraData={extraData}
        ListFooterComponent={renderlistFooter}
        itemContainerStyle={{ alignItems: 'center' }}
        appConfig={appConfig}
      />
      <Modal
        visible={showModal}
      >
        <View style={{
          paddingHorizontal: 15,
          marginTop: 10
        }}>
          <TouchableOpacity onPress={() => {
            setShowModal(false)
          }}>
            <Image source={require('../../../assets/icons/backArrow.png')} style={{
              width: 20,
              height: 20,
              tintColor: 'black'
            }} />
          </TouchableOpacity>
        </View>
        <WebView source={{ uri: 'https://thegivingmovement.com/collections/women-manual' }} />
      </Modal>
    </View>
  );
}

BestSellers.propTypes = {
  title: PropTypes.string,
  bestSellerProducts: PropTypes.array,
  navigation: PropTypes.object,
  extraData: PropTypes.object,
  onCardPress: PropTypes.func,
  shouldLimit: PropTypes.bool,
  limit: PropTypes.number,
};

export default BestSellers;

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { View, Text, Modal, BackHandler, TouchableOpacity } from 'react-native';
import ProductGrid from '../ProductGrid/ProductGrid';
import FooterButton from '../FooterButton/FooterButton';
import { useColorScheme } from 'react-native-appearance';
import { IMLocalized } from '../../Core/localization/IMLocalization';
import dynamicStyles from './styles';
import { WebView } from "react-native-webview";
const WebViewScreen = (props) => {
    const colorScheme = useColorScheme();
    const styles = dynamicStyles(colorScheme);

    const [showModal, setShowModal] = useState(false);


    useEffect(() => {
        BackHandler.addEventListener("hardwareBackPress", () => {

            console.log('press back');
        });
        // BackHandler.addEventListener("hardwareBackPress", backButton);

        return () =>
            BackHandler.removeEventListener("hardwareBackPress", () => {
                setShowModal(false)
                console.log('press');
            });
        // BackHandler.removeEventListener("hardwareBackPress", backButton);
    }, []);
    function backButton() {
        setShowModal(false)
        console.log('press backbutton');
    }
    const onFooterPress = () => {
        // props.navigation.navigate('CategoryProductGrid', {
        //   title: IMLocalized('Best Sellers'),
        //   products: bestSellerProducts,
        //   appConfig,
        // });
        console.log('open webview here');
        setShowModal(true)
        // Linking.openURL('')
    };


    return (
        <View style={styles.unitContainer}>

            <Modal visible={true}>
                <View style={{
                    position: 'absolute',
                    bottom: '10',
                    left: 20
                }}>
                    <TouchableOpacity>
                        <Text style={{
                            fontSize: 20,
                            color: 'red'
                        }}>Back</Text>
                    </TouchableOpacity>
                </View>
                <WebView source={{ uri: 'https://thegivingmovement.com/collections/women-manual' }} />
            </Modal>
        </View>
    );
}



export default WebViewScreen;

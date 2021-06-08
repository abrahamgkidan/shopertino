import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import ColorCheckBox from '../../ColorCheckBox/ColorCheckBox';
import ProductAttribute from '../../ProductAttribute/ProductAttribute';
import { useColorScheme } from 'react-native-appearance';
import dynamicStyles from './styles';

function ProductOptions(props) {
  const colorScheme = useColorScheme();
  const styles = dynamicStyles(colorScheme);
  const { optionContainerStyle, item } = props;

  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedAttribute, setSelectedAttribute] = useState({});

  useEffect(() => {
    props.onAttributesSelected(selectedAttribute);
  }, [selectedAttribute]);

  const onProductAttributePress = (index) => {
    setSelectedSizeIndex(index);
    props.onSizeSelected(index);
  };

  const onColorCheckBoxPress = (index) => {
    setSelectedColorIndex(index);
    props.onColorSelected(index);
  };

  const onAttributeOptionSelected = (index, option, attributeName) => {
    setSelectedAttribute((prevAttribute) => {
      return {
        ...prevAttribute,
        [attributeName]: { index, option, attributeName },
      };
    });
  };

  const renderAttribute = (attribute) => {
    return (
      <>
        <View style={styles.attributeNameContainer}>
          <Text style={styles.attributeName}>{attribute.name + ':'}</Text>
        </View>

        <View style={styles.attributeContainer}>
          {attribute.options &&
            attribute.options.map((option, index) => (
              <ProductAttribute
                containerStyle={styles.checkBox}
                key={index + ''}
                option={option}
                attributeName={attribute.name}
                selectedAttribute={selectedAttribute}
                onPress={() =>
                  onAttributeOptionSelected(index, option, attribute.name)
                }
                index={index}
              />
            ))}
        </View>
      </>
    );
  };

  return (
    <View style={[styles.optionContainer, optionContainerStyle]}>
      {item.attributes && item.attributes.map(renderAttribute)}
      {/* <View style={styles.sizeContainer}>
        {item.sizes &&
          item.sizes.map((size, index) => (
            <ProductAttribute
              containerStyle={styles.checkBox}
              key={index + ''}
              size={size}
              selectedIndex={selectedSizeIndex}
              onPress={() => onProductAttributePress(index)}
              index={index}
            />
          ))}
      </View>
      <View style={styles.colorContainer}>
        {item.colors &&
          item.colors.map((color, index) => (
            <ColorCheckBox
              containerStyle={styles.checkBox}
              key={index + ''}
              color={color}
              selectedIndex={selectedColorIndex}
              onPress={() => onColorCheckBoxPress(index)}
              index={index}
            />
          ))}
      </View> */}
    </View>
  );
}

ProductOptions.propTypes = {
  optionContainerStyle: PropTypes.object,
  item: PropTypes.object,
  onSizeSelected: PropTypes.func,
  onColorSelected: PropTypes.func,
};

export default ProductOptions;

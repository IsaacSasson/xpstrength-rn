import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface CustomDropdownProps {
  placeholder: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  primaryColor: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  placeholder,
  value,
  options,
  onSelect,
  primaryColor,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        className="bg-black-100 border border-black-200 rounded-lg px-3 py-2.5 flex-row items-center justify-between min-h-[40px]"
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Text 
          className="text-sm flex-1 mr-2"
          style={{ color: value ? 'white' : '#7b7b8b' }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {displayText}
        </Text>
        <FontAwesome5 
          name="chevron-down" 
          size={12} 
          color={primaryColor}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-5"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View 
            className="bg-black-100 rounded-lg border border-black-200 w-full max-w-[300px]"
            style={{ maxHeight: screenHeight * 0.6 }}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  className="px-4 py-3 flex-row items-center justify-between"
                  style={[
                    { 
                      backgroundColor: item.value === value ? `${primaryColor}20` : 'transparent',
                      borderTopWidth: index === 0 ? 0 : 0.5,
                      borderTopColor: '#333',
                    }
                  ]}
                  onPress={() => handleSelect(item.value)}
                  activeOpacity={0.7}
                >
                  <Text 
                    className="text-sm flex-1"
                    style={{ color: item.value === value ? primaryColor : 'white' }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <FontAwesome5 name="check" size={14} color={primaryColor} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default CustomDropdown;
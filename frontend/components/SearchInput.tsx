import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface FormFieldProps extends TextInputProps {
  title: string;
  value: string;
  placeHolder: string;
  handleChangeText: (text: string) => void;
  otherStyles?: string;
}

const SearchInput: React.FC<FormFieldProps> = ({
  title,
  value,
  placeHolder,
  handleChangeText,
  otherStyles,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (

     
      <View
        className={`border-2  ${
          isFocused ? 'border-secondary' : 'border-black-200'
        } w-full h-16 px-4 bg-black-100 rounded-2xl items-center flex-row space-x-4`}
      >
        <TextInput
          className="mt-0.5 text-base text-white flex-1 font-pregular"
          // Conditionally apply web-only style and cast as any to satisfy TypeScript
          style={Platform.OS === 'web' ? ({ outlineWidth: 0 } as any) : {}}
          underlineColorAndroid="transparent"
          value={value}
          placeholder={"Search for appraised items"}
          placeholderTextColor="#7b7b8b"
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={title === 'Password' && !showPassword}
          {...props}
        />

        <TouchableOpacity>
        <FontAwesome5 name="search" size={22} color="#a5bbde" />
        </TouchableOpacity>
      </View>
  
  );
};

export default SearchInput;
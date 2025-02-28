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

const FormField: React.FC<FormFieldProps> = ({
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
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className="text-base text-gray-100 font-pmedium">
        {title}
      </Text>

      {/* Outer View border toggles color on focus */}
      <View
        className={`border-2  ${
          isFocused ? 'border-secondary' : 'border-black-200'
        } w-full h-16 px-4 bg-black-100 rounded-2xl items-center flex-row`}
      >
        <TextInput
          className="flex-1 text-white font-psemibold text-base py-4 px-full"
          // Conditionally apply web-only style and cast as any to satisfy TypeScript
          style={Platform.OS === 'web' ? ({ outlineWidth: 0 } as any) : {}}
          underlineColorAndroid="transparent"
          value={value}
          placeholder={placeHolder}
          placeholderTextColor="#7b7b8b"
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={title === 'Password' && !showPassword}
          {...props}
        />

        {title === 'Password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <FontAwesome5 name="eye-slash" size={22} color="#CDCDE0" />
            ) : (
              <FontAwesome5 name="eye" size={22} color="#CDCDE0" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
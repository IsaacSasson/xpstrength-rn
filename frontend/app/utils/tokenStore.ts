import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'accessToken';
const isWeb = Platform.OS === 'web';

export async function saveToken(token: string) {
  if (isWeb) {
    await AsyncStorage.setItem(KEY, token);      // unencrypted on web
  } else {
    await SecureStore.setItemAsync(KEY, token);  // encrypted on device
  }
}

export async function getToken() {
  return isWeb ? AsyncStorage.getItem(KEY) : SecureStore.getItemAsync(KEY);
}

export async function deleteToken() {
  return isWeb ? AsyncStorage.removeItem(KEY) : SecureStore.deleteItemAsync(KEY);
}
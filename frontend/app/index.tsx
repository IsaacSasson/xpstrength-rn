import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import logo from '../assets/images/logo.png';
import CustomButton from '@/components/CustomButton';
import cards from '../assets/images/cards.png'
import { useGlobalContext } from '@/context/GlobalProvider';

export default function App() {

const {isLoading, isLoggedIn} = useGlobalContext();

if (!isLoading && isLoggedIn) return <Redirect href = "/home"/>

  return (
    <SafeAreaView className="bg-primary flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 w-full items-center justify-center px-4">
          <Image 
            source={logo}
            style={{ width: 300, height: 90 }}
            resizeMode="contain"
          />
          
          <Image 
            source={cards}
            className="max-w-[380px] w-full"
            style= {{ height: 300 }}
          />

          <View className="mt-5">
            <Text className="text-3xl text-white font-bold text-center leading-[40px]">
              Discover Endless Possibilities with{' '}
              <Text className="relative text-secondary-100 pb-5 overflow-visible">
                Appraisal
              </Text>
            </Text>
          </View>

          <Link href="/home" className="text-secondary">Go to Home (testing)</Link>

          <Text className="text-sm font-pregular text-gray-100 mt-7 text-center">
            Where creativity meets innovation: embark on a journey of limitless exploration with Appraisal
          </Text>
          <Link href="/home">YAYAYAYAYAYAY</Link>

          <CustomButton 
            title="Continue with Email"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-full sm:w-3/6 mt-7"
          />
        </View>
      </ScrollView>

      <StatusBar 
        backgroundColor='#161622'
        style='light'
      />
    </SafeAreaView>
  );
}
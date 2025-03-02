import { 
  View, 
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';

const Home = () => {

  return (
    <SafeAreaView className="bg-primary flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      
      <View className="px-4 py-6">
      <TopBar subtext="Welcome Back" title="Wiiwho" titleTop={false} />
      </View>
    </SafeAreaView>
  );
};

export default Home;
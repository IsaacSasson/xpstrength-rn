import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Appraise() {
  const { thumbnail } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#161622] p-4">
      <StatusBar style="light" />
      
      {/* Header with back button */}
      <Pressable 
        className="py-3 px-2 self-start"
        onPress={() => router.back()}
      >
        <Text className="text-[#a5bbde] font-medium text-base">← Back</Text>
      </Pressable>
      
      {/* Main content */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl text-[#f0f0f0] mb-5 font-bold uppercase tracking-wide">
          System Appraisal
        </Text>
        
        {/* Anime-style interface elements */}
        <View className="w-full aspect-[1.2] max-w-[500px] bg-[#232533] rounded-lg border-2 border-[#a5bbde] p-4 relative overflow-hidden">
          {/* Scan lines overlay (background image not directly supported in RN) */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.15,
              zIndex: 2,
              backgroundColor: "transparent",
            }}
          />
          
          {/* Display image */}
          <View className="flex-1 items-center justify-center border border-[#a5bbde] bg-black bg-opacity-40 rounded mb-4 relative overflow-hidden">
            {thumbnail ? (
              <Image
                source={{ uri: thumbnail as string }}
                style={{ width: "80%", height: "80%", borderRadius: 8 }}
                resizeMode="contain"
              />
            ) : (
              <View className="items-center justify-center w-full h-full">
                <Text className="text-[#a5bbde] text-base font-medium">
                  No item detected
                </Text>
              </View>
            )}
          </View>
          
          {/* Status indicators */}
          <View className="flex-row justify-between flex-wrap">
            <Text className="text-[#cccccc] text-sm font-medium mb-2 mr-2">
              Status: <Text className="text-[#a5bbde] font-bold">ANALYZING</Text>
            </Text>
            <Text className="text-[#cccccc] text-sm font-medium mb-2 mr-2">
              Confidence: <Text className="text-[#a5bbde] font-bold">87.3%</Text>
            </Text>
            <Text className="text-[#cccccc] text-sm font-medium mb-2 mr-2">
              System: <Text className="text-[#a5bbde] font-bold">ONLINE</Text>
            </Text>
          </View>
        </View>
        
        <Text className="text-base text-[#cccccc] text-center mt-5">
          Image captured and ready for analysis.
        </Text>
        
        {/* Futuristic decorative elements */}
        <View
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            right: 20,
            top: 60,
            borderTopWidth: 2,
            borderRightWidth: 2,
            borderColor: "#a5bbde",
            opacity: 0.6,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            left: 20,
            bottom: 100,
            borderBottomWidth: 2,
            borderLeftWidth: 2,
            borderColor: "#a5bbde",
            opacity: 0.6,
          }}
        />
      </View>
    </View>
  );
}
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

/** Represents the user (appraiser) who owns or is associated with the image. */
interface Appraiser {
  username: string;
  avatar: string;
}

/** Represents the data needed to display the card (image, description, etc.). */
interface ImageData {
  objectImage: string;
  description: string;
  objectName: string;
  rarity: string;
  appraiser: Appraiser;
}

/** The props expected by the ImageCard component. */
interface ImageCardProps {
  image: ImageData;
}

/**
 * A card component that displays an image, its name, 
 * appraiser information, and other relevant details.
 */
const ImageCard: React.FC<ImageCardProps> = ({
  image: {
    objectImage,
    description,
    objectName,
    rarity,
    appraiser: { username, avatar },
  },
}) => {
  return (
    <View className="flex-col items-center px-4 mb-14">
      {/* Top Row: Avatar + Username + Object Name + Menu Icon */}
      <View className="flex-row gap-4 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center p-0.5">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="text-white font-psemibold text-sm"
              numberOfLines={1}
            >
              {objectName}
            </Text>
            <Text
              className="text-xs text-gray-100 font-pregular"
              numberOfLines={1}
            >
              {username}
            </Text>
          </View>
        </View>

        <View className="pt-2">
          <FontAwesome5 name="bars" size={24} color="#a6c2f0" />
        </View>
      </View>

      {/* Main Image Section */}
      <TouchableOpacity className="w-full h-60 rounded-xl mt-3 relative justify-center items-center">
        <Image
          source={{ uri: objectImage }}
          className="w-full h-full rounded-xl"
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

export default ImageCard;

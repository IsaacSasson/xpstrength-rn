import React from "react";
import { View, Text, Image, TouchableOpacity, ImageSourcePropType } from "react-native";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

interface FriendCardProps {
  pfp: ImageSourcePropType;
  name: string;
  level: string;
  status?: string;
  lastActive?: string;
  workouts?: number;
  showActions?: boolean;
  actionType?: 'request' | 'pending';
  border?: string;
  levelTextColor?: string;
  color?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

const FriendCard: React.FC<FriendCardProps> = ({
  pfp,
  name,
  level,
  status = 'Offline',
  lastActive = '',
  workouts,
  showActions = false,
  actionType = 'request',
  border = '#000',
  levelTextColor = '#CDCDE0',
  color = '#A742FF',
  onAccept,
  onDecline,
  onCancel,
  onRemove,
}) => {
  // Get status color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'Online':
        return 'bg-green-500';
      case 'In Workout':
        return 'bg-blue-500';
      case 'Pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <View className="mb-4 last:mb-0 ">
      <View className="flex-row items-center mt-2">
        {/* Profile Picture with Status Indicator */}
        <View className="relative">
          <Image
            source={pfp}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              borderWidth: 2,
              borderColor: border || '#000',
            }}
          />
          <View className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-black-100 ${getStatusColor()}`} />
        </View>

        {/* User Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-psemibold text-base">{name}</Text>
            <View className="flex-row items-center">
              <FontAwesome5 name="crown" size={12} color="#FFD700" />
              <Text style={{ color: levelTextColor }} className="font-pmedium ml-1">Lvl {level}</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between mt-1">
            <View className="flex-row items-center">
              <Text className="text-gray-100 text-sm">
                {status} {lastActive ? `• ${lastActive}` : ''}
              </Text>
            </View>
            
            {workouts !== undefined && (
              <View className="flex-row items-center">
                <FontAwesome5 name="dumbbell" size={10} color="#CDCDE0" />
                <Text className="text-gray-100 text-xs ml-1">{workouts} workouts</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View className="flex-row justify-end mt-4">
          {actionType === 'request' ? (
            <>
              <TouchableOpacity 
                style={{ backgroundColor: color }}
                className="px-4 py-2 rounded-l-lg flex-row items-center"
                activeOpacity={0.7}
                onPress={onAccept}
              >
                <FontAwesome5 name="check" size={12} color="#FFF" />
                <Text className="text-white font-pmedium text-sm ml-2">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-black-200 px-4 py-2 rounded-r-lg"
                activeOpacity={0.7}
                onPress={onDecline}
              >
                <Text className="text-white font-pmedium text-sm">Decline</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              className="bg-black-200 px-4 py-2 rounded-lg"
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text className="text-white font-pmedium text-sm">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Separator line for non-last items */}
      <View className="mt-4 border-b border-black-200" />
    </View>
  );
};

export default FriendCard;
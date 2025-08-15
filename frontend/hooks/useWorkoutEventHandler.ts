// Path: /hooks/useWorkoutEventHandler.ts
import { useEffect, useCallback } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSocket, WorkoutEvent } from '@/context/SocketProvider';
import { useUser } from '@/context/UserProvider';

interface WorkoutEventHandlerOptions {
  showNotifications?: boolean;
  autoMarkAsSeen?: boolean;
  hapticFeedback?: boolean;
}

const hapticFeedback = async (type: "light" | "medium" | "heavy" | "success") => {
  try {
    if (Platform.OS === "android") {
      const patterns: Record<string, number[]> = {
        light: [0, 50],
        medium: [0, 100], 
        heavy: [0, 200],
        success: [0, 50, 50, 50, 100],
      };
      Vibration.vibrate(patterns[type] || [0, 50]);
    } else {
      const impacts = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
        success: Haptics.NotificationFeedbackType.Success,
      };
      
      if (type === "success") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(impacts[type] || Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  } catch (error) {
    // Haptics not available
  }
};

export const useWorkoutEventHandler = (options: WorkoutEventHandlerOptions = {}) => {
  const {
    showNotifications = true,
    autoMarkAsSeen = true,
    hapticFeedback: enableHaptics = true,
  } = options;

  const { onWorkoutEvents, markEventsSeen } = useSocket();
  const { addExperience, addCurrency } = useUser();

  const handleWorkoutEvents = useCallback((events: WorkoutEvent[]) => {
    console.log('🎉 Received workout events:', events.length);

    events.forEach((event) => {
      // Provide haptic feedback
      if (enableHaptics) {
        switch (event.type) {
          case 'userLevelUp':
            hapticFeedback('success');
            break;
          case 'muscleLevelUp':
            hapticFeedback('medium');
            break;
          case 'newPersonalBest':
            hapticFeedback('heavy');
            break;
          case 'firstTimeCompletingExercise':
            hapticFeedback('light');
            break;
        }
      }

      // Update user context with rewards
      if (event.type === 'userLevelUp' && event.payload.rewards?.coins) {
        addCurrency(event.payload.rewards.coins);
      }

      if (event.payload.rewards?.userXP || event.payload.rewards?.userXp) {
        const xp = event.payload.rewards.userXP || event.payload.rewards.userXp;
        addExperience(xp);
      }

      // Show notifications
      if (showNotifications) {
        const title = getEventTitle(event);
        const message = getEventMessage(event);
        
        Alert.alert(title, message, [
          { text: 'Awesome!', style: 'default' }
        ]);
      }
    });

    // Auto-mark events as seen
    if (autoMarkAsSeen && events.length > 0) {
      const maxId = Math.max(...events.map(e => e.id));
      markEventsSeen(maxId);
    }
  }, [enableHaptics, showNotifications, autoMarkAsSeen, addExperience, addCurrency, markEventsSeen]);

  useEffect(() => {
    const unsubscribe = onWorkoutEvents(handleWorkoutEvents);
    return unsubscribe;
  }, [onWorkoutEvents, handleWorkoutEvents]);

  return {
    // Exposed for manual event handling if needed
    handleEvents: handleWorkoutEvents,
  };
};

// Helper functions to generate notification content
const getEventTitle = (event: WorkoutEvent): string => {
  switch (event.type) {
    case 'userLevelUp':
      return '🎉 Level Up!';
    case 'muscleLevelUp':
      return `💪 ${event.payload.type.charAt(0).toUpperCase() + event.payload.type.slice(1)} Level Up!`;
    case 'newPersonalBest':
      return '🏆 Personal Best!';
    case 'firstTimeCompletingExercise':
      return '⭐ First Time Achievement!';
    default:
      return '🎉 Achievement Unlocked!';
  }
};

const getEventMessage = (event: WorkoutEvent): string => {
  switch (event.type) {
    case 'userLevelUp':
      return `You reached level ${event.payload.newLevel}! You earned ${event.payload.rewards.coins} coins.`;
    case 'muscleLevelUp':
      return `Your ${event.payload.type} reached level ${event.payload.newLevel}! You earned ${event.payload.rewards.userXP} bonus XP.`;
    case 'newPersonalBest':
      return `You set a new personal best for exercise ${event.payload.exerciseId}! You earned ${event.payload.rewards.userXp} XP.`;
    case 'firstTimeCompletingExercise':
      return `You completed exercise ${event.payload.exerciseId} for the first time! You earned ${event.payload.rewards.userXp} XP.`;
    default:
      return 'You unlocked a new achievement!';
  }
};
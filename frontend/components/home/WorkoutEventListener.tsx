import React, { useEffect } from "react";
import { useWorkoutEventHandler } from "@/hooks/useWorkoutEventHandler";
import { useSocket } from "@/context/SocketProvider";

interface WorkoutEventListenerProps {
  showNotifications?: boolean;
  autoMarkAsSeen?: boolean;
  hapticFeedback?: boolean;
  onEvent?: (events: any[]) => void;
}

export const WorkoutEventListener: React.FC<WorkoutEventListenerProps> = ({
  showNotifications = true,
  autoMarkAsSeen = true,
  hapticFeedback = true,
  onEvent,
}) => {
  const { isConnected, connectionError, connect, onWorkoutEvents } = useSocket();

  useWorkoutEventHandler({
    showNotifications,
    autoMarkAsSeen,
    hapticFeedback,
  });

  useEffect(() => {
    if (!onEvent) return;
    const unsubscribe = onWorkoutEvents(onEvent);
    return unsubscribe;
  }, [onEvent, onWorkoutEvents]);

  useEffect(() => {
    if (connectionError && !isConnected) {
      const retryTimeout = setTimeout(() => {
        connect();
      }, 5000);
      return () => clearTimeout(retryTimeout);
    }
  }, [connectionError, isConnected, connect]);

  return null;
};

export default WorkoutEventListener;
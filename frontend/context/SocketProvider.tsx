import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { API_BASE_URL } from '@/utils/api';
import { io, Socket } from 'socket.io-client';

/* ----------------------------- Types ----------------------------- */
export interface WorkoutEvent {
  id: number;
  type: 'userLevelUp' | 'muscleLevelUp' | 'firstTimeCompletingExercise' | 'newPersonalBest';
  payload: any;
  createdAt: string;
}

export interface SocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  
  // Event handling
  onWorkoutEvents: (callback: (events: WorkoutEvent[]) => void) => () => void;
  
  // Manual controls
  connect: () => void;
  disconnect: () => void;
  
  // Event syncing
  syncEvents: () => void;
  markEventsSeen: (upToId: number) => void;
}

/* ----------------------------- Context ----------------------------- */
const SocketContext = createContext<SocketContextType | undefined>(undefined);

/* ----------------------------- Provider ----------------------------- */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [wsToken, setWsToken] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const workoutEventCallbacks = useRef<Set<(events: WorkoutEvent[]) => void>>(new Set());

  /* ----------------------------- WebSocket Token ----------------------------- */
  const fetchWebSocketToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!accessToken) {
        console.log('🔌 No access token available for WebSocket');
        return null;
      }
      
      console.log('🔌 Fetching WebSocket token...');
      const response = await fetch(`${API_BASE_URL}/api/v1/network/websocket-token`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        console.error('🔌 Failed to fetch WebSocket token:', response.status);
        return null;
      }

      const data = await response.json();
      const token = data?.data?.WsToken || data?.data?.wsToken || null;
      console.log('🔌 WebSocket token obtained:', !!token);
      return token;
    } catch (error) {
      console.error('🔌 Error fetching WebSocket token:', error);
      return null;
    }
  }, [accessToken]);

  /* ----------------------------- Connection Management ----------------------------- */
  const connect = useCallback(async () => {
    if (!isAuthenticated || socketRef.current?.connected) {
      console.log('🔌 Skipping connection - not authenticated or already connected');
      return;
    }

    try {
      console.log('🔌 Connecting to WebSocket...');
      
      // Get fresh WebSocket token
      const token = await fetchWebSocketToken();
      if (!token) {
        setConnectionError('Failed to get WebSocket token');
        return;
      }

      setWsToken(token);
      setConnectionError(null);

      // Create Socket.IO connection with token
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
      const socket = io(wsUrl, {
        path: '/socket',
        auth: { token }, // Send token in auth
        transports: ['websocket'],
        upgrade: false,
      });
      
      socket.on('connect', () => {
        console.log('🔌 Socket.IO connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Request initial event sync
        socket.emit('eventSync');
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        setIsConnected(false);
        
        if (isAuthenticated && reason !== 'io client disconnect') {
          scheduleReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Socket.IO connection error:', error.message);
        setConnectionError('Connection failed');
        setIsConnected(false);
        
        if (isAuthenticated) {
          scheduleReconnect();
        }
      });

      // Handle incoming events
      socket.on('newEvent', (event) => {
        console.log('🔌 Received new event:', event.type);
        if (isWorkoutEvent(event)) {
          workoutEventCallbacks.current.forEach(callback => {
            callback([event]);
          });
        }
      });

      socket.on('newEvents', (events) => {
        console.log('🔌 Received new events:', events.length);
        if (Array.isArray(events)) {
          const workoutEvents = events.filter(isWorkoutEvent);
          if (workoutEvents.length > 0) {
            workoutEventCallbacks.current.forEach(callback => {
              callback(workoutEvents);
            });
          }
        }
      });

      socket.on('pong', (data) => {
        console.log('🔌 Received pong:', data);
      });

      socket.on('eventsSeenUpToId', (data) => {
        console.log('🔌 Events marked as seen up to ID:', data.upTo);
      });

      socket.on('error', (error) => {
        console.error('🔌 Socket error:', error);
        setConnectionError('Socket error occurred');
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('🔌 Failed to connect WebSocket:', error);
      setConnectionError('Failed to connect');
    }
  }, [isAuthenticated, fetchWebSocketToken]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    setWsToken(null);
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;
    
    console.log(`🔌 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, delay);
  }, [connect]);

  /* ----------------------------- Event Utilities ----------------------------- */
  const isWorkoutEvent = (event: any): event is WorkoutEvent => {
    return event && 
           typeof event.type === 'string' &&
           ['userLevelUp', 'muscleLevelUp', 'firstTimeCompletingExercise', 'newPersonalBest'].includes(event.type);
  };

  /* ----------------------------- Public Methods ----------------------------- */
  const onWorkoutEvents = useCallback((callback: (events: WorkoutEvent[]) => void) => {
    workoutEventCallbacks.current.add(callback);
    
    return () => {
      workoutEventCallbacks.current.delete(callback);
    };
  }, []);

  const syncEvents = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 Requesting event sync...');
      socketRef.current.emit('eventSync');
    } else {
      console.log('🔌 Cannot sync events - not connected');
    }
  }, []);

  const markEventsSeen = useCallback((upToId: number) => {
    if (socketRef.current?.connected) {
      console.log('🔌 Marking events seen up to ID:', upToId);
      socketRef.current.emit('markEvents', upToId);
    } else {
      console.log('🔌 Cannot mark events seen - not connected');
    }
  }, []);

  /* ----------------------------- Effects ----------------------------- */
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure auth is fully settled
      const timeoutId = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /* ----------------------------- Context Value ----------------------------- */
  const contextValue: SocketContextType = {
    isConnected,
    connectionError,
    onWorkoutEvents,
    connect,
    disconnect,
    syncEvents,
    markEventsSeen,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
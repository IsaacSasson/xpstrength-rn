import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  level: number;
  status: string;
  lastActive: string;
  workouts?: number;
}

export type FriendType = 'friends' | 'requests' | 'pending';

// Mock data for the useFriends hook - kept private within the hook
const MOCK_FRIENDS: User[] = [
  {
    id: "1",
    name: "Wiiwho loves ikey",
    level: 25,
    status: "Online",
    lastActive: "Now",
    workouts: 42,
  },
  {
    id: "2",
    name: "Alex",
    level: 31,
    status: "Online",
    lastActive: "Now",
    workouts: 67,
  },
  {
    id: "3",
    name: "Jordan",
    level: 19,
    status: "Offline",
    lastActive: "2h ago",
    workouts: 23,
  },
  {
    id: "4",
    name: "Taylor",
    level: 45,
    status: "In Workout",
    lastActive: "Now",
    workouts: 128,
  },
  {
    id: "5",
    name: "Casey",
    level: 37,
    status: "Offline",
    lastActive: "1d ago",
    workouts: 85,
  },
  {
    id: "6",
    name: "Morgan",
    level: 22,
    status: "Online",
    lastActive: "Now",
    workouts: 31,
  },
];

const MOCK_REQUESTS: User[] = [
  {
    id: "7",
    name: "Riley",
    level: 15,
    status: "Pending",
    lastActive: "3h ago",
  },
  {
    id: "8",
    name: "Jamie",
    level: 28,
    status: "Pending",
    lastActive: "1d ago",
  },
];

const MOCK_PENDING: User[] = [
  {
    id: "9",
    name: "Quinn",
    level: 33,
    status: "Pending",
    lastActive: "4h ago",
  },
];

export const useFriends = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Track locally modified friends data
  const [friendsData, setFriendsData] = useState<User[]>([]);
  const [requestsData, setRequestsData] = useState<User[]>([]);
  const [pendingData, setPendingData] = useState<User[]>([]);

  // Fetch mock data with simulated loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Initialize local state with mock data
        setFriendsData([...MOCK_FRIENDS]);
        setRequestsData([...MOCK_REQUESTS]);
        setPendingData([...MOCK_PENDING]);
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch friends data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Getter functions
  const getFriends = () => friendsData;
  const getRequests = () => requestsData;
  const getPending = () => pendingData;
  
  // Get counts
  const getFriendsCount = () => friendsData.length;
  const getRequestsCount = () => requestsData.length;
  const getPendingCount = () => pendingData.length;

  // Simple search function - filter by name match
  const searchUsers = (query: string, type: FriendType): User[] => {
    if (query.trim() === "") {
      // If search is empty, return all users of the specified type
      switch (type) {
        case 'friends': return getFriends();
        case 'requests': return getRequests();
        case 'pending': return getPending();
        default: return [];
      }
    }
    
    // Get the correct list based on type
    let users: User[] = [];
    switch (type) {
      case 'friends': users = getFriends(); break;
      case 'requests': users = getRequests(); break;
      case 'pending': users = getPending(); break;
    }
    
    // Simple case-insensitive search
    const searchQuery = query.toLowerCase();
    return users.filter((user: User) => 
      user.name.toLowerCase().includes(searchQuery)
    );
  };

  // Friend management functions
  const acceptFriendRequest = (userId: string) => {
    // Find the user in requests
    const userToAccept = requestsData.find(user => user.id === userId);
    if (!userToAccept) return false;
    
    // Remove from requests
    setRequestsData(prev => prev.filter(user => user.id !== userId));
    
    // Add to friends with a workout count
    setFriendsData(prev => [
      ...prev, 
      { ...userToAccept, workouts: Math.floor(Math.random() * 30) }
    ]);
    
    return true;
  };

  const declineFriendRequest = (userId: string) => {
    // Remove from requests
    setRequestsData(prev => prev.filter(user => user.id !== userId));
    return true;
  };

  const cancelPendingRequest = (userId: string) => {
    // Remove from pending
    setPendingData(prev => prev.filter(user => user.id !== userId));
    return true;
  };

  const removeFriend = (userId: string) => {
    // Remove from friends
    setFriendsData(prev => prev.filter(user => user.id !== userId));
    return true;
  };

  return {
    // Status
    loading,
    error,
    
    // Getter functions
    getFriends,
    getRequests,
    getPending,
    getFriendsCount,
    getRequestsCount,
    getPendingCount,
    
    // Search function
    searchUsers,
    
    // Friend management functions
    acceptFriendRequest,
    declineFriendRequest,
    cancelPendingRequest,
    removeFriend
  };
};
import { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*                               Types                                */
/* ------------------------------------------------------------------ */

export interface Spotlight {
  exercise: string;
  oneRm: number;
}

export interface User {
  id: string;
  name: string;
  level: number;
  xp: number;               // NEW
  joinDate: string;         // NEW – ISO string
  goal: string;             // NEW
  spotlight: Spotlight;     // NEW
  status: string;
  lastActive: string;
  workouts?: number;
  friends?: number; // NEW – optional, for friends list
}

export type FriendType = "friends" | "requests" | "pending";

/* ------------------------------------------------------------------ */
/*                          Mock Data Sets                            */
/* ------------------------------------------------------------------ */

const MOCK_FRIENDS: User[] = [
  {
    id: "1",
    name: "Wiiwho loves ikey",
    level: 25,
    xp: 6400,
    joinDate: "2024-05-01",
    goal: "Run a marathon",
    spotlight: { exercise: "Squat", oneRm: 275 },
    status: "Online",
    lastActive: "Now",
    workouts: 42,
    friends: 10, 
  },
  {
    id: "2",
    name: "Alex",
    level: 31,
    xp: 9300,
    joinDate: "2023-12-14",
    goal: "Bench 315 lbs",
    spotlight: { exercise: "Bench Press", oneRm: 295 },
    status: "Online",
    lastActive: "Now",
    workouts: 67,
    friends: 4
  },
  {
    id: "3",
    name: "Jordan",
    level: 19,
    xp: 4150,
    joinDate: "2024-08-07",
    goal: "Bike 100 miles",
    spotlight: { exercise: "Deadlift", oneRm: 305 },
    status: "Offline",
    lastActive: "2h ago",
    workouts: 23,
    friends: 8
  },
  {
    id: "4",
    name: "Taylor",
    level: 45,
    xp: 20100,
    joinDate: "2023-05-22",
    goal: "Sub-20 5K",
    spotlight: { exercise: "Clean & Jerk", oneRm: 225 },
    status: "In Workout",
    lastActive: "Now",
    workouts: 128,
    friends: 32
  },
  {
    id: "5",
    name: "Casey",
    level: 37,
    xp: 15250,
    joinDate: "2024-02-18",
    goal: "Do a handstand",
    spotlight: { exercise: "Overhead Press", oneRm: 145 },
    status: "Offline",
    lastActive: "1d ago",
    workouts: 85,
    friends: 1
  },
  {
    id: "6",
    name: "Morgan",
    level: 22,
    xp: 5400,
    joinDate: "2024-09-30",
    goal: "Swim 1 mile",
    spotlight: { exercise: "Pull-Ups", oneRm: 20 },
    status: "Online",
    lastActive: "Now",
    workouts: 31,
    friends: 2
  },
];

const MOCK_REQUESTS: User[] = [
  {
    id: "7",
    name: "Riley",
    level: 15,
    xp: 2750,
    joinDate: "2025-03-11",
    goal: "Lose 10 lbs",
    spotlight: { exercise: "Plank", oneRm: 180 }, // seconds
    status: "Pending",
    lastActive: "3h ago",
  },
  {
    id: "8",
    name: "Jamie",
    level: 28,
    xp: 7600,
    joinDate: "2024-10-04",
    goal: "Row 5K",
    spotlight: { exercise: "Row", oneRm: 2100 }, // meters
    status: "Pending",
    lastActive: "1d ago",
  },
];

const MOCK_PENDING: User[] = [
  {
    id: "9",
    name: "Quinn",
    level: 33,
    xp: 10850,
    joinDate: "2024-07-19",
    goal: "Do the splits",
    spotlight: { exercise: "L-Sit", oneRm: 60 }, // seconds
    status: "Pending",
    lastActive: "4h ago",
  },
];

/* ------------------------------------------------------------------ */
/*                            Hook Body                               */
/* ------------------------------------------------------------------ */

export const useFriends = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Local state mirrors the mock data so we can mutate it */
  const [friendsData, setFriendsData] = useState<User[]>([]);
  const [requestsData, setRequestsData] = useState<User[]>([]);
  const [pendingData, setPendingData] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 300)); // fake latency
        setFriendsData([...MOCK_FRIENDS]);
        setRequestsData([...MOCK_REQUESTS]);
        setPendingData([...MOCK_PENDING]);
        setError(null);
      } catch (err) {
        setError("Failed to fetch friends data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------- Getters ------------------- */
  const getFriends = () => friendsData;
  const getRequests = () => requestsData;
  const getPending = () => pendingData;

  const getFriendsCount = () => friendsData.length;
  const getRequestsCount = () => requestsData.length;
  const getPendingCount = () => pendingData.length;

  /* ------------------- Search -------------------- */
  const searchUsers = (query: string, type: FriendType): User[] => {
    const trimmed = query.trim().toLowerCase();
    const pool =
      type === "friends"
        ? friendsData
        : type === "requests"
        ? requestsData
        : pendingData;

    if (trimmed === "") return pool;
    return pool.filter((u) => u.name.toLowerCase().includes(trimmed));
  };

  /* -------------- Friend Management -------------- */
  const acceptFriendRequest = (id: string) => {
    const user = requestsData.find((u) => u.id === id);
    if (!user) return false;
    setRequestsData((d) => d.filter((u) => u.id !== id));
    setFriendsData((d) => [...d, { ...user, workouts: Math.floor(Math.random() * 30) }]);
    return true;
  };
  const declineFriendRequest = (id: string) =>
    (setRequestsData((d) => d.filter((u) => u.id !== id)), true);
  const cancelPendingRequest = (id: string) =>
    (setPendingData((d) => d.filter((u) => u.id !== id)), true);
  const removeFriend = (id: string) =>
    (setFriendsData((d) => d.filter((u) => u.id !== id)), true);

  /* ------------------ Return --------------------- */
  return {
    loading,
    error,
    /* getters */
    getFriends,
    getRequests,
    getPending,
    getFriendsCount,
    getRequestsCount,
    getPendingCount,
    /* search */
    searchUsers,
    /* actions */
    acceptFriendRequest,
    declineFriendRequest,
    cancelPendingRequest,
    removeFriend,
  };
};

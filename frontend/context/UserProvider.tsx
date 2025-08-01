// Path: /context/UserProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthProvider";
import { userApi, UserProfile, ExerciseHistory } from "@/services/userApi";

/* ----------------------------- Types ----------------------------- */
interface UserContextType {
  // Profile data
  profile: UserProfile | null;
  profilePictureUri: string | null;
  exerciseHistory: ExerciseHistory;
  
  // Legacy support for existing code
  currency: number;
  experience: number;
  level: number;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<boolean>;
  addCurrency: (amount: number) => void;
  addExperience: (amount: number) => void;
  clearError: () => void;
}

/* ----------------------------- Context ----------------------------- */
const UserContext = createContext<UserContextType>({
  profile: null,
  profilePictureUri: null,
  exerciseHistory: {},
  currency: 0,
  experience: 0,
  level: 1,
  isLoading: false,
  isRefreshing: false,
  error: null,
  refreshProfile: async () => {},
  updateProfilePicture: async () => false,
  addCurrency: () => {},
  addExperience: () => {},
  clearError: () => {},
});

/* ----------------------------- Provider ----------------------------- */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  /* ----------------------------- Data Loading ----------------------------- */
  const loadProfileData = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) {
        console.log("🚫 Not authenticated, skipping profile data fetch");
        return;
      }

      try {
        if (!isRefresh) setIsLoading(true);
        else setIsRefreshing(true);
        setError(null);

        console.log("🔄 Loading profile data for user:", user?.username);

        // Use the new userApi service to load all data
        const result = await userApi.loadAllUserData();

        if (result.success) {
          console.log("✅ User data loaded successfully:", result);
          
          // Update state with the loaded data
          if (result.profile) {
            setProfile(result.profile);
          }
          
          if (result.profilePictureUri) {
            setProfilePictureUri(result.profilePictureUri);
          } else {
            setProfilePictureUri(null);
          }
          
          if (result.exerciseHistory) {
            setExerciseHistory(result.exerciseHistory);
          } else {
            setExerciseHistory({});
          }

          setHasInitialized(true);
          console.log("🎉 Profile data loading complete!");
        } else {
          throw new Error(result.error || "Failed to load user data");
        }
      } catch (err) {
        console.error("❌ Error loading profile data:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile data");
        setProfile(null);
        setProfilePictureUri(null);
        setExerciseHistory({});
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, user]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfileData(true);
  }, [loadProfileData]);

  /* ----------------------------- Profile Picture Update ----------------------------- */
  const updateProfilePicture = useCallback(
    async (imageUri: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const result = await userApi.updateProfilePicture(imageUri);
        
        if (result.success) {
          // Update local state with new image
          setProfilePictureUri(imageUri);
          return true;
        } else {
          setError(result.error || "Failed to update profile picture");
          return false;
        }
      } catch (err) {
        console.error("❌ Error updating profile picture:", err);
        setError(err instanceof Error ? err.message : "Failed to update profile picture");
        return false;
      }
    },
    [isAuthenticated]
  );

  /* ----------------------------- Legacy Support ----------------------------- */
  // These functions provide backward compatibility for existing code
  const addCurrency = useCallback((amount: number) => {
    setProfile(prev => prev ? { ...prev, totalCoins: prev.totalCoins + amount } : null);
  }, []);

  const addExperience = useCallback((amount: number) => {
    setProfile(prev => {
      if (!prev) return null;
      
      const newXp = prev.xp + amount;
      // Simple level calculation - you might want to adjust this based on your game logic
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      if (newLevel > prev.level) {
        // Level up bonus
        const levelUpBonus = newLevel * 50;
        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          totalCoins: prev.totalCoins + levelUpBonus
        };
      }
      
      return { ...prev, xp: newXp };
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /* ----------------------------- Auth Effect ----------------------------- */
  useEffect(() => {
    console.log("🔍 UserContext auth effect:", {
      isAuthenticated,
      authLoading,
      hasInitialized,
      username: user?.username,
    });

    if (authLoading) return;

    if (isAuthenticated && !hasInitialized) {
      console.log("🔐 Authenticated, loading profile data for:", user?.username);
      setTimeout(() => loadProfileData(false), 100);
    } else if (!isAuthenticated && hasInitialized) {
      console.log("🔓 Logged out, clearing profile data...");
      setProfile(null);
      setProfilePictureUri(null);
      setExerciseHistory({});
      setError(null);
      setHasInitialized(false);
    }
  }, [isAuthenticated, authLoading, hasInitialized, loadProfileData, user]);

  /* ----------------------------- Context Value ----------------------------- */
  const contextValue: UserContextType = {
    profile,
    profilePictureUri,
    exerciseHistory,
    // Legacy support
    currency: profile?.totalCoins || 0,
    experience: profile?.xp || 0,
    level: profile?.level || 1,
    // States
    isLoading,
    isRefreshing,
    error,
    // Actions
    refreshProfile,
    updateProfilePicture,
    addCurrency,
    addExperience,
    clearError,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

// Legacy export for backward compatibility
export const useUserProgress = () => useContext(UserContext);
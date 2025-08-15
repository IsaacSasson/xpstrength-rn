// Path: /context/UserProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthProvider";
import { userApi, UserProfile, ExerciseHistory } from "@/services/userApi";
import { totalXpForUserLevel } from "@/utils/xpUtils";

/* ----------------------------- Types ----------------------------- */
interface UserContextType {
  profile: UserProfile | null;
  profilePictureUri: string | null;
  exerciseHistory: ExerciseHistory;

  currency: number;
  experience: number;
  level: number;

  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  refreshProfile: () => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<boolean>;
  updateProfile: (updates: {
    username?: string;
    email?: string;
    fitnessGoal?: string;
  }) => Promise<boolean>;
  addCurrency: (amount: number) => void;
  addExperience: (amount: number, skipLevelUpBonus?: boolean) => void;
  clearError: () => void;

  /** Immediately reflect saved notes in local cache so new workouts see them */
  setExerciseNotes: (exerciseId: number | string, notes: string) => void;
}

/* ----------------------------- Helpers ----------------------------- */
// Shallow structural equality for ExerciseHistory to avoid thrashing state.
function equalExerciseHistory(a: ExerciseHistory, b: ExerciseHistory): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    const k = aKeys[i];
    if (!(k in b)) return false;
    const aVal = (a as any)[k];
    const bVal = (b as any)[k];
    if (JSON.stringify(aVal) !== JSON.stringify(bVal)) return false;
  }
  return true;
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
  updateProfile: async () => false,
  addCurrency: () => {},
  addExperience: () => {},
  clearError: () => {},
  setExerciseNotes: () => {},
});

/* ----------------------------- Provider ----------------------------- */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user, accessToken, setAccessToken } = useAuth();

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

        const result = await userApi.loadAllUserData(accessToken || undefined);

        if (result.success) {
          if (result.profile) setProfile(result.profile);

          if (result.profilePictureUri) {
            setProfilePictureUri(result.profilePictureUri);
          } else {
            setProfilePictureUri(null);
          }

          if (result.exerciseHistory) {
            // Narrow once and keep it strongly typed inside this block
            const incoming = result.exerciseHistory as ExerciseHistory;
            setExerciseHistory((prev) =>
              equalExerciseHistory(prev, incoming) ? prev : incoming
            );
          } else {
            setExerciseHistory({});
          }

          setHasInitialized(true);
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
    [isAuthenticated, user, accessToken]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfileData(true);
  }, [loadProfileData]);

  /* ----------------------------- Profile Picture Update ----------------------------- */
  const updateProfilePicture = useCallback(
    async (imageUri: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        console.log("🖼️ Updating profile picture...");
        const previousUri = profilePictureUri;
        setProfilePictureUri(imageUri);

        const uploadResult = await userApi.updateProfilePicture(imageUri);
        if (!uploadResult.success) {
          setProfilePictureUri(previousUri);
          setError(uploadResult.error || "Failed to update profile picture");
          return false;
        }

        const downloadResult = await userApi.getProfilePicture(accessToken || undefined);
        if (downloadResult.success && downloadResult.uri) {
          setProfilePictureUri(downloadResult.uri);
        }
        return true;
      } catch (err) {
        console.error("❌ Error updating profile picture:", err);
        setError(err instanceof Error ? err.message : "Failed to update profile picture");
        return false;
      }
    },
    [isAuthenticated, accessToken, profilePictureUri]
  );

  /* ----------------------------- Profile Update ----------------------------- */
  const updateProfile = useCallback(
    async (updates: {
      username?: string;
      email?: string;
      fitnessGoal?: string;
    }): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const apiUpdates: any = {};
        if (updates.username) apiUpdates.newUsername = updates.username;
        if (updates.email) apiUpdates.newEmail = updates.email;
        if (updates.fitnessGoal !== undefined) apiUpdates.newFitnessGoal = updates.fitnessGoal;

        const result = await userApi.updateProfile(apiUpdates);

        if (result.success) {
          if (result.accessToken) {
            await setAccessToken(result.accessToken);
          }
          if (result.profile) setProfile(result.profile);
          return true;
        } else {
          setError(result.error || "Failed to update profile");
          return false;
        }
      } catch (err) {
        console.error("❌ Error updating profile:", err);
        setError(err instanceof Error ? err.message : "Failed to update profile");
        return false;
      }
    },
    [isAuthenticated, setAccessToken]
  );

  /* ----------------------------- Rewards Management ----------------------------- */
  const addCurrency = useCallback((amount: number) => {
    setProfile(prev => prev ? { ...prev, totalCoins: prev.totalCoins + amount } : null);
  }, []);

  const addExperience = useCallback((amount: number, skipLevelUpBonus = false) => {
    setProfile(prev => {
      if (!prev) return null;

      const newXp = prev.xp + amount;

      const calculateLevelFromXp = (xp: number): number => {
        let level = 1;
        while (level <= 1000 && totalXpForUserLevel(level + 1) <= xp) {
          level++;
        }
        return level;
      };

      const newLevel = calculateLevelFromXp(newXp);

      if (newLevel > prev.level && !skipLevelUpBonus) {
        const levelUpBonus = newLevel * 50;
        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          totalCoins: prev.totalCoins + levelUpBonus
        };
      }

      return { ...prev, xp: newXp, level: newLevel };
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /* ----------------------------- Notes cache update ----------------------------- */
  const setExerciseNotes = useCallback((exerciseId: number | string, notes: string) => {
    const key = String(exerciseId);
    setExerciseHistory(prev => {
      const prevEntry = (prev as any)[key] || {};
      // No-op when nothing changed
      if (prevEntry?.notes === notes) return prev;
      return {
        ...(prev as any),
        [key]: { ...prevEntry, notes },
      } as ExerciseHistory;
    });
  }, []);

  /* ----------------------------- Auth Effect ----------------------------- */
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && !hasInitialized) {
      setTimeout(() => loadProfileData(false), 100);
    } else if (!isAuthenticated && hasInitialized) {
      setProfile(null);
      setProfilePictureUri(null);
      setExerciseHistory({});
      setError(null);
      setHasInitialized(false);
    }
  }, [isAuthenticated, authLoading, hasInitialized, loadProfileData]);

  /* ----------------------------- Context Value ----------------------------- */
  const contextValue: UserContextType = useMemo(() => ({
    profile,
    profilePictureUri,
    exerciseHistory,

    currency: profile?.totalCoins || 0,
    experience: profile?.xp || 0,
    level: profile?.level || 1,

    isLoading,
    isRefreshing,
    error,

    refreshProfile,
    updateProfilePicture,
    updateProfile,
    addCurrency,
    addExperience,
    clearError,
    setExerciseNotes,
  }), [
    profile,
    profilePictureUri,
    exerciseHistory,
    isLoading,
    isRefreshing,
    error,
    refreshProfile,
    updateProfilePicture,
    updateProfile,
    addCurrency,
    addExperience,
    clearError,
    setExerciseNotes,
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
export const useUserProgress = () => useContext(UserContext);
// Path: /services/userApi.ts
import { api, API_BASE_URL } from "@/utils/api";
import { handleApiError } from "@/utils/handleApiError";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

/* ----------------------------- Types ----------------------------- */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_pic?: string;
  authority: 'basic' | 'premium' | 'admin';
  level: number;
  xp: number;
  total_friends: number;
  total_workouts: number;
  totalTimeWorkedOut: number; // in minutes
  totalCoins: number;
  shopUnlocks: number[];
  fitnessGoal?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseHistoryItem {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  cooldown: number;
  notes?: string;
  lastPerformed?: string;
}

export interface ExerciseHistory {
  [exerciseId: string]: ExerciseHistoryItem;
}

export interface UpdateProfileParams {
  currentPassword?: string;
  newPassword?: string;
  newUsername?: string;
  newEmail?: string;
  newFitnessGoal?: string;
}

export interface UserHistoryItem {
  id: string;
  action: string;
  details?: string;
  timestamp: string;
}

/* ----------------------------- Helpers ----------------------------- */
const toNum = (v: any) => Number(v);

const transformProfileFromAPI = (apiProfile: any): UserProfile => {
  return {
    id: toNum(apiProfile.id),
    username: apiProfile.username || '',
    email: apiProfile.email || '',
    profile_pic: apiProfile.profile_pic || apiProfile.profilePic,
    authority: apiProfile.authority || 'basic',
    level: toNum(apiProfile.level) || 1,
    xp: toNum(apiProfile.xp) || 0,
    total_friends: toNum(apiProfile.totalFriends || apiProfile.total_friends) || 0,
    total_workouts: toNum(apiProfile.totalWorkouts || apiProfile.total_workouts) || 0,
    totalTimeWorkedOut: toNum(apiProfile.totalTimeWorkedOut || apiProfile.total_time_worked_out) || 0,
    totalCoins: toNum(apiProfile.totalCoins || apiProfile.total_coins) || 0,
    shopUnlocks: Array.isArray(apiProfile.shopUnlocks) ? apiProfile.shopUnlocks.map(toNum) :
                  Array.isArray(apiProfile.shop_unlocks) ? apiProfile.shop_unlocks.map(toNum) : [],
    fitnessGoal: apiProfile.fitnessGoal || apiProfile.fitness_goal || '',
    createdAt: apiProfile.createdAt || apiProfile.created_at,
    updatedAt: apiProfile.updatedAt || apiProfile.updated_at,
  };
};

const transformExerciseHistoryFromAPI = (apiHistory: any): ExerciseHistory => {
  if (!apiHistory || typeof apiHistory !== 'object') return {};

  const transformed: ExerciseHistory = {};
  Object.entries(apiHistory).forEach(([key, value]: [string, any]) => {
    if (value && typeof value === 'object') {
      if (typeof value.exercise === 'string' &&
          typeof value.weight === 'number' &&
          typeof value.reps === 'number') {
        transformed[key] = {
          exercise: value.exercise,
          weight: toNum(value.weight),
          reps: toNum(value.reps),
          sets: toNum(value.sets) || 1,
          cooldown: toNum(value.cooldown) || 60,
          notes: value.notes,
          lastPerformed: value.lastPerformed || value.last_performed,
        };
      }
    }
  });

  return transformed;
};

/* ----------------------------- API Service ----------------------------- */
export const userApi = {
  /* ----------- Profile ----------- */
  async getProfile(): Promise<{
    success: boolean;
    profile?: UserProfile;
    error?: string;
  }> {
    try {
      const response = await api.get("/api/v1/user/profile");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to fetch profile" };
      }

      const result = await response.json();
      const profileData = result.data?.profileData || result.data || result.profile || result;
      if (!profileData) return { success: false, error: "No profile data in response" };

      return { success: true, profile: transformProfileFromAPI(profileData) };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  async updateProfile(params: UpdateProfileParams): Promise<{
    success: boolean;
    profile?: UserProfile;
    accessToken?: string;
    error?: string;
  }> {
    try {
      // Allow fitnessGoal-only saves; require password only when touching secured fields.
      const hasAnyUpdate =
        !!(params.newUsername || params.newEmail || params.newPassword || params.newFitnessGoal !== undefined);
      if (!hasAnyUpdate) {
        return { success: false, error: "No updatable fields provided." };
      }

      const touchesSecuredField = !!(params.newUsername || params.newEmail || params.newPassword);
      if (touchesSecuredField && !params.currentPassword) {
        return {
          success: false,
          error: "Current password is required to update username, email, or password."
        };
      }

      console.log("🔄 updateProfile called with params:", params);

      const response = await api.patch("/api/v1/user/update-profile", { data: params });

      console.log("📡 API Response status:", response.status);
      console.log("📡 API Response ok:", response.ok);

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        console.log("❌ API Error details:", errorDetails);
        return { success: false, error: errorDetails.error || "Failed to update profile" };
      }

      const result = await response.json();
      console.log("📦 Raw API response:", result);

      // Backend returns: { data: { newAccessToken, newProfile: { usernameChanged, emailChanged, etc. } } }
      const accessToken = result.data?.newAccessToken || result.newAccessToken;
      const changesSummary = result.data?.newProfile || result.newProfile;

      console.log("🔑 Extracted access token:", accessToken ? "Present" : "Missing");
      console.log("📝 Changes summary:", changesSummary);

      if (!accessToken) {
        console.log("❌ No access token in response");
        return { success: false, error: "No access token in response" };
      }

      // Since the backend only returns a changes summary, we need to fetch the actual updated profile
      console.log("🔄 Fetching updated profile data...");
      const profileResult = await userApi.getProfile();
      
      if (!profileResult.success || !profileResult.profile) {
        console.log("❌ Failed to fetch updated profile:", profileResult.error);
        return { success: false, error: profileResult.error || "Failed to fetch updated profile data" };
      }

      console.log("✅ Successfully retrieved updated profile:", profileResult.profile);

      return {
        success: true,
        profile: profileResult.profile,
        accessToken
      };
    } catch (error) {
      console.error("💥 updateProfile catch block:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.delete("/api/v1/user/delete-account");
      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to delete account" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- User History ----------- */
  async getUserHistory(): Promise<{
    success: boolean;
    history?: UserHistoryItem[];
    error?: string;
  }> {
    try {
      const response = await api.get("/api/v1/user/history");
      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to fetch user history" };
      }
      const result = await response.json();
      const historyData = result.data?.history || result.history || result.data || result;
      const history = Array.isArray(historyData) ? historyData : [];
      return { success: true, history };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  async getUserHistoryPaginated(page: number, pageSize: number): Promise<{
    success: boolean;
    history?: UserHistoryItem[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/api/v1/user/history/${page}/${pageSize}`);
      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to fetch user history" };
      }
      const result = await response.json();
      const historyData = result.data?.history || result.history || result.data || result;
      const history = Array.isArray(historyData) ? historyData : [];
      return { success: true, history };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Profile Picture ----------- */
  async getProfilePicture(accessToken?: string): Promise<{
    success: boolean;
    uri?: string;
    error?: string;
  }> {
    try {
      // Native: download to cache with Authorization header
      if (Platform.OS !== "web") {
        const url = `${API_BASE_URL}/api/v1/user/profile-pic`;  // ✅ Fixed endpoint
        const dest = `${FileSystem.cacheDirectory}pfp-current.jpg`;

        // Remove any stale file (ok if it doesn't exist)
        try {
          await FileSystem.deleteAsync(dest, { idempotent: true });
        } catch {}

        const { status, uri } = await FileSystem.downloadAsync(url, dest, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        if (status === 200) {
          return { success: true, uri };
        }
        if (status === 404) {
          return { success: true, uri: undefined };
        }
        return { success: false, error: `Failed to fetch profile picture (status ${status})` };
      }

      // Web: blob -> object URL
      const response = await api.get("/api/v1/user/profile-pic");  // ✅ Fixed endpoint

      if (response.status === 404) {
        return { success: true, uri: undefined };
      }

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to fetch profile picture" };
      }

      try {
        const blob = await response.blob();
        const hasCreateObjectURL = typeof URL !== "undefined" && (URL as any).createObjectURL;
        const uri = hasCreateObjectURL ? (URL as any).createObjectURL(blob) : undefined;
        return { success: true, uri };
      } catch {
        return { success: true, uri: undefined };
      }
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  async updateProfilePicture(imageUri: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('newPFP', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await api.postFormData("/api/v1/user/profile-pic", formData);  // ✅ Fixed endpoint

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to update profile picture" };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Exercise History ----------- */
  async getExerciseHistory(): Promise<{
    success: boolean;
    exerciseHistory?: ExerciseHistory;
    error?: string;
  }> {
    try {
      const response = await api.get("/api/v1/user/exercise-history");
      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to fetch exercise history" };
      }

      const result = await response.json();

      const historyData =
        result.data?.exerciseHistory?.exerciseHistory ||
        result.data?.exerciseHistory ||
        result.data ||
        result.exerciseHistory ||
        result;

      const exerciseHistory = transformExerciseHistoryFromAPI(historyData);
      return { success: true, exerciseHistory };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Exercise Notes ----------- */
  async saveExerciseNotes(exerciseId: string | number, notes: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await api.post(`/api/v1/user/save-notes/${exerciseId}`, { data: { notes } });
      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || "Failed to save exercise notes" };
      }
      await response.json().catch(() => undefined);
      return { success: true };
    } catch {
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Bulk Data Load ----------- */
  async loadAllUserData(accessToken?: string): Promise<{
    success: boolean;
    profile?: UserProfile;
    profilePictureUri?: string;
    exerciseHistory?: ExerciseHistory;
    error?: string;
  }> {
    try {
      const [profileResult, pictureResult, historyResult] = await Promise.allSettled([
        userApi.getProfile(),
        userApi.getProfilePicture(accessToken),
        userApi.getExerciseHistory(),
      ]);

      if (profileResult.status === 'rejected' || !profileResult.value.success) {
        const error =
          profileResult.status === 'rejected'
            ? profileResult.reason?.message || 'Failed to load profile'
            : profileResult.value.error || 'Failed to load profile';
        return { success: false, error };
      }

      const profile = profileResult.value.profile!;

      let profilePictureUri: string | undefined;
      if (pictureResult.status === 'fulfilled' && pictureResult.value.success) {
        profilePictureUri = pictureResult.value.uri;
      }

      let exerciseHistory: ExerciseHistory = {};
      if (historyResult.status === 'fulfilled' && historyResult.value.success) {
        exerciseHistory = historyResult.value.exerciseHistory || {};
      }

      return {
        success: true,
        profile,
        profilePictureUri,
        exerciseHistory,
      };
    } catch {
      return { success: false, error: "Failed to load user data" };
    }
  },
};
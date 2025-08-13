// Path: /services/userApi.ts
import { api } from "@/utils/api";
import { handleApiError } from "@/utils/handleApiError";

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
  fitnessGoal?: string; // Add fitness goal field
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

// Transform API profile response to our UserProfile type
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

// Transform API exercise history response to our ExerciseHistory type
const transformExerciseHistoryFromAPI = (apiHistory: any): ExerciseHistory => {
  if (!apiHistory || typeof apiHistory !== 'object') {
    return {};
  }

  const transformed: ExerciseHistory = {};
  
  // Handle different possible response structures
  Object.entries(apiHistory).forEach(([key, value]: [string, any]) => {
    if (value && typeof value === 'object') {
      // Validate that the exercise data has the required fields
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
      console.log("📊 Fetching user profile...");
      const response = await api.get("/api/v1/user/profile");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch profile",
        };
      }

      const result = await response.json();
      console.log("✅ Raw profile API response:", result);

      // Extract profile data from the API response structure
      const profileData = result.data?.profileData || result.data || result.profile || result;
      
      if (!profileData) {
        return { success: false, error: "No profile data in response" };
      }

      const profile = transformProfileFromAPI(profileData);
      console.log("✅ Transformed profile:", profile);

      return { success: true, profile };
    } catch (error) {
      console.error("❌ Get profile error:", error);
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
      console.log("📝 Updating user profile...", Object.keys(params));
      
      // Validate that at least one field is being updated
      const hasUpdates = params.newUsername || params.newEmail || params.newPassword || params.newFitnessGoal;
      if (!hasUpdates) {
        return { success: false, error: "At least one field must be provided for update" };
      }

      const response = await api.patch("/api/v1/user/update-profile", {
        data: params
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to update profile",
        };
      }

      const result = await response.json();
      console.log("✅ Profile update response:", result);

      // Extract the updated profile and new access token
      const profileData = result.data?.user || result.user || result.data || result;
      const accessToken = result.data?.accessToken || result.accessToken;

      if (!profileData) {
        return { success: false, error: "No updated profile data in response" };
      }

      const profile = transformProfileFromAPI(profileData);

      return { 
        success: true, 
        profile,
        accessToken 
      };
    } catch (error) {
      console.error("❌ Update profile error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  async deleteAccount(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log("🗑️ Deleting user account...");
      
      const response = await api.delete("/api/v1/user/delete-account");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to delete account",
        };
      }

      console.log("✅ Account deleted successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Delete account error:", error);
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
      console.log("📜 Fetching user history...");
      const response = await api.get("/api/v1/user/history");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch user history",
        };
      }

      const result = await response.json();
      console.log("✅ User history response:", result);

      const historyData = result.data?.history || result.history || result.data || result;
      const history = Array.isArray(historyData) ? historyData : [];

      return { success: true, history };
    } catch (error) {
      console.error("❌ Get user history error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  async getUserHistoryPaginated(page: number, pageSize: number): Promise<{
    success: boolean;
    history?: UserHistoryItem[];
    error?: string;
  }> {
    try {
      console.log(`📜 Fetching user history page ${page} with size ${pageSize}...`);
      const response = await api.get(`/api/v1/user/history/${page}/${pageSize}`);

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch user history",
        };
      }

      const result = await response.json();
      console.log("✅ Paginated user history response:", result);

      const historyData = result.data?.history || result.history || result.data || result;
      const history = Array.isArray(historyData) ? historyData : [];

      return { success: true, history };
    } catch (error) {
      console.error("❌ Get paginated user history error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Profile Picture ----------- */
  async getProfilePicture(): Promise<{
    success: boolean;
    uri?: string;
    error?: string;
  }> {
    try {
      console.log("🖼️ Fetching profile picture...");
      const response = await api.get("/api/v1/user/profile-picture");

      if (response.status === 404) {
        console.log("ℹ️ No profile picture found");
        return { success: true, uri: undefined };
      }

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch profile picture",
        };
      }

      const blob = await response.blob();
      const uri = URL.createObjectURL(blob);
      console.log("✅ Profile picture loaded");

      return { success: true, uri };
    } catch (error) {
      console.error("❌ Get profile picture error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  async updateProfilePicture(imageUri: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log("📤 Uploading new profile picture...");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('newPFP', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await api.postFormData("/api/v1/user/profile-picture", formData);

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to update profile picture",
        };
      }

      console.log("✅ Profile picture updated successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Update profile picture error:", error);
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
      console.log("💪 Fetching exercise history...");
      const response = await api.get("/api/v1/user/exercise-history");

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to fetch exercise history",
        };
      }

      const result = await response.json();
      console.log("✅ Raw exercise history API response:", result);

      // Extract exercise history from the API response structure
      const historyData = result.data?.exerciseHistory?.exerciseHistory || 
                         result.data?.exerciseHistory || 
                         result.data || 
                         result.exerciseHistory || 
                         result;

      const exerciseHistory = transformExerciseHistoryFromAPI(historyData);
      console.log("✅ Transformed exercise history:", Object.keys(exerciseHistory).length, "exercises");

      return { success: true, exerciseHistory };
    } catch (error) {
      console.error("❌ Get exercise history error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Exercise Notes ----------- */
  async saveExerciseNotes(exerciseId: string | number, notes: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`📝 Saving notes for exercise ${exerciseId}...`);
      
      const response = await api.post(`/api/v1/user/save-notes/${exerciseId}`, {
        data: { notes }
      });

      if (!response.ok) {
        const errorDetails = await handleApiError(response);
        return {
          success: false,
          error: errorDetails.error || "Failed to save exercise notes",
        };
      }

      const result = await response.json();
      console.log("✅ Exercise notes saved successfully:", result.message);

      return { success: true };
    } catch (error) {
      console.error("❌ Save exercise notes error:", error);
      return { success: false, error: "Network error occurred" };
    }
  },

  /* ----------- Bulk Data Load ----------- */
  async loadAllUserData(): Promise<{
    success: boolean;
    profile?: UserProfile;
    profilePictureUri?: string;
    exerciseHistory?: ExerciseHistory;
    error?: string;
  }> {
    try {
      console.log("🔄 Loading all user data...");

      // Run all requests in parallel for better performance
      const [profileResult, pictureResult, historyResult] = await Promise.allSettled([
        userApi.getProfile(),
        userApi.getProfilePicture(),
        userApi.getExerciseHistory(),
      ]);

      // Handle profile result (required)
      if (profileResult.status === 'rejected' || !profileResult.value.success) {
        const error = profileResult.status === 'rejected' 
          ? profileResult.reason?.message || 'Failed to load profile'
          : profileResult.value.error || 'Failed to load profile';
        return { success: false, error };
      }

      const profile = profileResult.value.profile!;

      // Handle profile picture (optional)
      let profilePictureUri: string | undefined;
      if (pictureResult.status === 'fulfilled' && pictureResult.value.success) {
        profilePictureUri = pictureResult.value.uri;
      } else {
        console.warn("⚠️ Profile picture load failed, continuing without it");
      }

      // Handle exercise history (optional)
      let exerciseHistory: ExerciseHistory = {};
      if (historyResult.status === 'fulfilled' && historyResult.value.success) {
        exerciseHistory = historyResult.value.exerciseHistory || {};
      } else {
        console.warn("⚠️ Exercise history load failed, continuing without it");
      }

      console.log("🎉 All user data loaded successfully!");
      return {
        success: true,
        profile,
        profilePictureUri,
        exerciseHistory,
      };
    } catch (error) {
      console.error("❌ Load all user data error:", error);
      return { success: false, error: "Failed to load user data" };
    }
  },
};
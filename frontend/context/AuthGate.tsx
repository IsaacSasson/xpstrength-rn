// Path: /context/AuthGate.tsx
import React, { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/context/AuthProvider";

/**
 * Redirect unauthenticated users to /(auth)/sign-in,
 * and authenticated users into the tabs stack at /(tabs)/home.
 * Uses a guard to avoid redirect loops by only acting on auth-state changes.
 */
const SIGN_IN_ROUTE = "/(auth)/sign-in";
const TABS_HOME_ROUTE = "/(tabs)/home";

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments(); // e.g. ["(auth)","sign-in"] or ["(tabs)","home"]
  const router = useRouter();

  // Remember last auth state to prevent duplicate navigations
  const lastAuth = useRef<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Only navigate when auth status actually changes
    if (lastAuth.current === isAuthenticated) return;
    lastAuth.current = isAuthenticated;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace(SIGN_IN_ROUTE);
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace(TABS_HOME_ROUTE);
      return;
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
};

export default AuthGate;
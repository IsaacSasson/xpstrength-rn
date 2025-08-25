// Path: /context/AppProvider.tsx
import React from "react";
import { UserProvider } from "./UserProvider";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./AuthProvider";
import { WorkoutProvider } from "./WorkoutContext";
import { SocketProvider } from "./SocketProvider";
import AuthGate from "./AuthGate";

// This component combines all providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SocketProvider>
        <UserProvider>
          <ThemeProvider>
            <WorkoutProvider>
              <AuthGate> 
                {children}
              </AuthGate>
            </WorkoutProvider>
          </ThemeProvider>
        </UserProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default AppProvider;
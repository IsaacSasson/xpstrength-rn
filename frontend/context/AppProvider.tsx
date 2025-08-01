// Path: /context/AppProvider.tsx
import React from 'react';
import { UserProvider } from './UserProvider';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthProvider';
import { WorkoutProvider } from './WorkoutContext';

// This component combines all providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        <ThemeProvider>
          <WorkoutProvider>
            {children}
          </WorkoutProvider>
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default AppProvider;
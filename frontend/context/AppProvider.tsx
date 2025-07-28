import React from 'react';
import { UserProgressProvider } from './UserProgressContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthProvider';
import { WorkoutProvider } from './WorkoutContext';

// This component combines all providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProgressProvider>
        <ThemeProvider>
          <WorkoutProvider>
            {children}
          </WorkoutProvider>
        </ThemeProvider>
      </UserProgressProvider>
    </AuthProvider>
  );
};

export default AppProvider;
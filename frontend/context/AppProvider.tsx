import React from 'react';
import { UserProgressProvider } from './UserProgressContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthProvider';

// This component combines all providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProgressProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </UserProgressProvider>
    </AuthProvider>
  );
};

export default AppProvider;
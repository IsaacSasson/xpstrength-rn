import React from 'react';
import { UserProgressProvider } from './UserProgressContext';
import { ThemeProvider } from './ThemeContext';

// This component combines all providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProgressProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </UserProgressProvider>
  );
};

export default AppProvider;
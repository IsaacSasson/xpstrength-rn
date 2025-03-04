// Path: /context/AppProvider.tsx
import React, { useContext } from 'react';
import { UserProgressProvider } from './UserProgressContext';
import { ShopProvider, ShopContext } from './ShopContext';
import { ThemeProvider } from './ThemeContext';

// Intermediate component to pass owned themes from ShopContext to ThemeProvider
const ThemedChildrenWithShop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ownedThemes } = useContext(ShopContext);
  
  return (
    <ThemeProvider ownedThemes={ownedThemes}>
      {children}
    </ThemeProvider>
  );
};

// This component combines all providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProgressProvider>
      <ShopProvider>
        <ThemedChildrenWithShop>
          {children}
        </ThemedChildrenWithShop>
      </ShopProvider>
    </UserProgressProvider>
  );
};

export default AppProvider;
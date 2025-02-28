import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser } from "@/lib/appwrite";

// 1. Define the type for your "user" from Appwrite
type AppwriteUser = any;
interface GlobalContextType {
  isLoggedIn: boolean;
  setIsLogged : (value: boolean) => void;
  user: AppwriteUser | null;
  setUser: (user: AppwriteUser | null) => void;
  isLoading: boolean;
}

// 2. Create the context with that type
const GlobalContext = createContext<GlobalContextType>({
  isLoggedIn: false,
  setIsLogged : () => {},
  user: null,
  setUser: () => {},
  isLoading: true,
});

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLogged ] = useState(false);
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [isLoading, setisLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res) {
            setIsLogged (true);
          setUser(res);
        } else {
            setIsLogged (false);
          setUser(null);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setisLoading(false);
      });
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        setIsLogged ,
        user,
        setUser,
        isLoading,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;

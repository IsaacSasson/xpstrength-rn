import { useState, useEffect } from "react";
import { Alert } from "react-native";

const useAppwrite = (fn: any) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fn(); // returns an array of documents
      // Log here to see what you are receiving
      console.log("useAppwrite response:", response);
      setData(response ?? []);
    } catch (error) {
      Alert.alert("Error", "We done fucked up");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch once on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Provide a refetch function so we can refresh
  const refetch = () => fetchData();

  return { data, isLoading, refetch };
};

export default useAppwrite;

import { useCallback, useEffect, useState } from "react";

export const useUserIdentity = () => {
  const [username, setUsername] = useState<string>(
    localStorage.getItem("username") ?? "",
  );
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("userId") ?? "",
  );
  useEffect(() => {
    if (userId === "") {
      const newUserId = crypto.randomUUID();
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const handleSetUsername = useCallback((newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  }, []);

  return { username, userId, handleSetUsername };
};

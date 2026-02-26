import { useCallback, useEffect, useMemo, useState } from "react";

export const useUserIdentityStorage = () => {
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
  }, [userId]);

  const handleSetUsername = useCallback((newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  }, []);

  const userIdentity = useMemo(
    () => ({ username, userId }),
    [username, userId],
  );

  return { userIdentity, handleSetUsername };
};

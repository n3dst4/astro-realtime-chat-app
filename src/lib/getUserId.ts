import { authClient } from "@/lib/auth-client";

export async function getUserId(): Promise<{
  userId: string;
  username: string;
  signedIn: boolean;
}> {
  const { data: sessionData, error } = await authClient.getSession();

  if (error) {
    console.error("Auth error - using stored data", error);
  }

  const user = sessionData?.user;

  if (user) {
    return {
      userId: user.id,
      username: user.name,
      signedIn: true,
    };
  } else {
    let userId = localStorage.getItem("userId");
    let username = localStorage.getItem("username");
    if (!userId)
      if (userId) {
        return userId;
      } else {
        const generated = crypto.randomUUID();
        localStorage.setItem("userId", generated);
        return generated;
      }
  }
}

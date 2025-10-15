"use client";

import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";

/**
 * Hook to get the current user's access token for API calls
 * @returns The access token or null if not authenticated
 */
export function useAuthToken() {
  const user = useUser();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      if (!user) {
        setToken(null);
        return;
      }

      try {
        // Get the access token from Stack Auth
        // Stack stores tokens in a cookie named "stack-access" as a JSON array
        const cookies = document.cookie.split(";");
        const accessCookie = cookies.find((c) =>
          c.trim().startsWith("stack-access=")
        );

        if (accessCookie) {
          const cookieValue = accessCookie.split("=")[1];
          const decoded = decodeURIComponent(cookieValue);
          const tokenArray = JSON.parse(decoded);
          // Access token is the second element in the array
          if (tokenArray && tokenArray[1]) {
            setToken(tokenArray[1]);
            return;
          }
        }

        // Fallback: Try old pattern for backwards compatibility
        const tokenCookie = cookies.find((c) =>
          c.trim().match(/stack-.*-access-token=/)
        );

        if (tokenCookie) {
          const cookieValue = tokenCookie.split("=")[1];
          const decodedToken = decodeURIComponent(cookieValue);
          setToken(decodedToken);
        }
      } catch (error) {
        console.error("Error getting auth token:", error);
        setToken(null);
      }
    };

    getToken();
  }, [user]);

  return token;
}


import { useCallback, useEffect, useState } from "react";
import API_URL from "../services/api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearAuth = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("Session refresh failed:", error);
      return false;
    }
  }, []);

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      const makeRequest = () =>
        fetch(url, {
          ...options,
          credentials: "include",
          headers: new Headers(options.headers || {}),
        });

      let response = await makeRequest();

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        response = await makeRequest();
      }

      return response;
    },
    [refreshAccessToken]
  );

  const loadCurrentUser = useCallback(async () => {
    const response = await authenticatedFetch(`${API_URL}/users/me`, {
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to load user profile");
    }

    setUser(data);
    return data;
  }, [authenticatedFetch]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        if (window.location.pathname !== "/verify-email") {
          await loadCurrentUser();
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser]);

  return {
    user,
    setUser,
    clearAuth,
    refreshAccessToken,
    authenticatedFetch,
    loadCurrentUser,
    isInitializing,
  };
}

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  agencyName?: string;
  reraId?: string;
  city?: string;
  experience?: string;
  bio?: string;
  website?: string;
  areaOfExpertise?: string[];
  workingRegions?: string[];
  role?: string;
  profilePhoto?: string;
  agencyLogo?: string;
  isVerified?: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState<User | null>(null);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        setUserData(data);
        return data;
      } catch (err) {
        console.error("Auth error:", err);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const updateUser = (updatedUser: Partial<User>) => {
    const newUser = { ...user, ...updatedUser };
    setUserData(newUser);
    queryClient.setQueryData(["auth/me"], newUser);
  };

  const logout = () => {
    setUserData(null);
    queryClient.removeQueries({ queryKey: ["auth/me"] });
    queryClient.clear();
  };

  return {
    user: (user || userData) as User | null,
    isLoading,
    error,
    isAuthenticated: !!(user || userData),
    updateUser,
    logout,
  };
}

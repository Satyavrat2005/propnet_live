"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { iosAuthUtils } from "../utils/ios-auth-fix";

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

const profilePhotoKeys = [
  "profilePhoto",
  "profile_photo_url",
  "profilePhotoUrl",
  "photo_url",
  "photoUrl",
  "avatar_url",
  "avatarUrl",
  "avatar",
];

function extractProfilePhoto(source: Record<string, unknown>): string | undefined {
  for (const key of profilePhotoKeys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeUser(user: User | null): User | null {
  if (!user) return null;
  const photo = extractProfilePhoto(user as unknown as Record<string, unknown>);
  if (photo === user.profilePhoto) {
    return user;
  }
  return { ...user, profilePhoto: photo };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<User | undefined>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) {
          // Return undefined so data is falsy; let useEffect handle fallback
          throw new Error("Not authenticated");
        }

        const payload = await response.json();
        return payload.user as User;
      } catch (err) {
        // Propagate so TanStack marks it as an error (we rely on fallback logic below)
        throw err;
      }
    },
  });

  useEffect(() => {
    // When query finished loading, initialize auth state (either from response or iOS backup)
    if (!isLoading) {
      if (data) {
        const normalizedUser = normalizeUser(data) ?? data;
        setUser(normalizedUser);
        setIsInitialized(true);
        // Keep iOS backup in sync
        try {
          iosAuthUtils.backupUserState(normalizedUser);
        } catch (e) {
          // ignore backup errors
          // eslint-disable-next-line no-console
          console.warn("iosAuthUtils.backupUserState failed", e);
        }
      } else {
        // No authenticated user from server — attempt to restore iOS PWA backup
        try {
          const backupUser = normalizeUser(iosAuthUtils.restoreUserState() as User | null);
          if (backupUser && iosAuthUtils.isIOS()) {
            setUser(backupUser);
          } else {
            setUser(null);
            iosAuthUtils.clearBackup();
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("iOS auth restore failed", e);
          setUser(null);
        }
        setIsInitialized(true);
      }
    }
  }, [data, isLoading]);

  // On first app start (PWA on iOS standalone mode) try one more restore if needed
  useEffect(() => {
    try {
      if (iosAuthUtils.isIOS() && iosAuthUtils.isStandalone() && !user && isInitialized) {
        const backupUser = normalizeUser(iosAuthUtils.restoreUserState() as User | null);
        if (backupUser) {
          setUser(backupUser);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("iOS standalone restore failed", e);
    }
    // Only run when initialization state or user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  const login = (userData: User) => {
    const normalizedUser = normalizeUser(userData) ?? userData;
    setUser(normalizedUser);
    try {
      iosAuthUtils.backupUserState(normalizedUser);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("iosAuthUtils.backupUserState failed on login", e);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      iosAuthUtils.clearBackup();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("iosAuthUtils.clearBackup failed on logout", e);
    }
  };

  const updateUser = (userData: User) => {
    const normalizedUser = normalizeUser(userData) ?? userData;
    setUser(normalizedUser);
    try {
      iosAuthUtils.backupUserState(normalizedUser);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("iosAuthUtils.backupUserState failed on update", e);
    }
    // intentionally not refetching server to avoid loops
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

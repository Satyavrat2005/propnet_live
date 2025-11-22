// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

/**
 * Admin login — Next.js App Router compatible
 * - Replaced wouter with next/navigation
 * - Uses fetch inside mutation instead of apiRequest to avoid SSR/import-time issues
 * - UI, styling, text and behavior kept identical
 */

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // plain fetch to your server endpoint; server should set HTTP-only cookie on success
      const res = await fetch("/api/secure-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      const json = await res.json().catch(() => ({ success: false, message: "Invalid response" }));
      return { ok: res.ok, status: res.status, body: json };
    },
    onSuccess: (result) => {
      const data = result?.body;
      if (result.ok && data?.success) {
        // session cookie should already be set by server
        router.push("/admin/dashboard");
      } else {
        setError(data?.message || "Login failed");
      }
    },
    onError: (err: any) => {
      setError(err?.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-emerald-100/[0.2] bg-[size:40px_40px]"></div>

      <Card className="w-full max-w-md shadow-2xl border-gray-200 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-emerald-100 rounded-full w-fit">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Secure Portal Access
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Authorized personnel only. Please authenticate to continue.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-300 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Enter your username"
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  placeholder="Enter your password"
                  disabled={loginMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-700 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Secure Login
                </div>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This portal uses advanced security measures including device
              fingerprinting and encrypted sessions. Unauthorized access
              attempts are monitored and logged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

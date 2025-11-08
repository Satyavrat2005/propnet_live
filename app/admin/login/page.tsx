"use client";

import { useState } from "react";
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
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/secure-portal/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // The session token is automatically set as an HTTP-only cookie by the server
        // No need to store it in localStorage
        setLocation("/admin/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    },
    onError: (error: any) => {
      setError(error.message || "Login failed");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20"></div>

      <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-blue-600/20 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Secure Portal Access
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Authorized personnel only. Please authenticate to continue.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                placeholder="Enter your username"
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10"
                  placeholder="Enter your password"
                  disabled={loginMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
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

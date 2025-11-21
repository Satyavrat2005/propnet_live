"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function EnterPinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const phone = searchParams?.get("phone") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length < 4 || pin.length > 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter your 4-6 digit PIN",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast({
          title: "Invalid PIN",
          description: data.error || "PIN verification failed",
          variant: "destructive",
        });
        setPin("");
        return;
      }

      // Redirect based on profile status
      if (data.redirectTo) {
        toast({
          title: "Welcome Back!",
          description: "Login successful",
        });
        router.push(data.redirectTo);
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-8">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Key className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Enter Your PIN</CardTitle>
          <CardDescription className="text-blue-100 text-base mt-2">
            Enter your secure PIN to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Logging in as: <span className="font-semibold text-gray-900">{phone}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PIN Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 text-center block">
                Enter PIN (4-6 digits)
              </label>
              <Input
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-3xl tracking-widest font-semibold"
                maxLength={6}
                autoFocus
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg"
              disabled={loading || pin.length < 4}
            >
              {loading ? "Verifying..." : "Login"}
            </Button>

            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/auth/login")}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center pt-4 border-t space-y-2">
            <p className="text-sm text-gray-600">
              Forgot Password?{" "}
              <button
                onClick={() => router.push("/auth/forgot-password")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Password
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EnterPinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <EnterPinContent />
    </Suspense>
  );
}

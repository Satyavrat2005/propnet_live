"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smartphone, MessageSquare, CheckCircle2 } from "lucide-react";

/**
 * Signup page — same flow as login but purpose "signup"
 * After successful verification, server returns requiresProfileComplete; redirect accordingly.
 */

export default function Page() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizePhone = (v: string) => v.replace(/\D/g, "").slice(0, 10);

  const startResendCountdown = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer((p) => {
        if (p <= 1) {
          clearInterval(t);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setMessage(null);

    const p = normalizePhone(phone);
    if (p.length !== 10) {
      setError("Enter a 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      
      // Check if phone exists in database
      const checkRes = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      
      const checkData = await checkRes.json();
      setLoading(false);
      
      if (!checkRes.ok || !checkData.exists) {
        setError("Phone number not registered. Please sign up first.");
        return;
      }

      // Phone exists, redirect to PIN entry
      router.push(`/auth/enter-pin?phone=${encodeURIComponent(`+91${p}`)}`);
      
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      setError("Error checking phone number. Try again.");
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const p = normalizePhone(phone);
    if (code.trim().length === 0) {
      setError("Enter the verification code.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: p,
          code: code.trim(),
          purpose: "signup",
        }),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(json?.error || "Verification failed");
        return;
      }

      // Use server-provided redirectTo path
      if (json?.redirectTo) {
        setMessage("Verification successful. Redirecting...");
        router.push(json.redirectTo);
        return;
      }

      // Fallback: Use requiresProfileComplete flag (backward compatibility)
      const requiresProfile = json?.requiresProfileComplete === true;
      if (requiresProfile) {
        router.push("/auth/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      setError("Verification error. Try again.");
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendCode();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            {showOtp ? (
              <MessageSquare className="h-8 w-8" />
            ) : (
              <Smartphone className="h-8 w-8" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {showOtp ? "Verify Your Phone" : "Get Started"}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {showOtp
              ? "Enter the 6-digit code sent to your phone"
              : "Enter your mobile number to join PropNet"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {message && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 p-2 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {!showOtp ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    className="rounded-l-none"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive a verification code via SMS
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={phone.length !== 10 || loading}
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="text-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Code sent to: <span className="font-medium">+91 {phone}</span>
                </p>
              </div>

              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={code.length !== 6 || loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowOtp(false);
                      setCode("");
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || loading}
                    className="text-sm"
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend Code"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to PropNet?{" "}
              <Link href="/auth/signup">
                <span className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up here
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

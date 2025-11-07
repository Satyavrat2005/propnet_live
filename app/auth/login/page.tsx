"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, MessageSquare, CheckCircle2, Play } from "lucide-react";

/**
 * Login page (improved)
 * - shows inline errors
 * - shows OTP input only when server returns ok
 * - displays clear Twilio/trial hints when Twilio returns permission errors
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
    setMessage(null);
    setError(null);

    const p = normalizePhone(phone);
    if (p.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, purpose: "login" }),
      });
      const json = await res.json();
      setLoading(false);

      if (!res.ok) {
        // show clear error and helpful guidance for Twilio trial issues
        const msg = json?.error || "Failed to send verification code.";
        setError(msg);

        // Twilio specific hints often show phrases like "Permission to send an SMS"
        if (/permission|verify|trial|not authorized|not enabled/i.test(msg)) {
          setError(msg + " — On Twilio trial you must verify recipient numbers or upgrade your account. See Twilio console.");
        }
        return;
      }

      // success: show otp input
      setShowOtp(true);
      setMessage(json?.message || "Verification code sent.");
      startResendCountdown();
    } catch (err: any) {
      setLoading(false);
      console.error("sendCode error:", err);
      setError("Network error sending code. Check server logs and .env variables.");
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

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
        body: JSON.stringify({ phone: p, code: code.trim(), purpose: "login" }),
      });
      const json = await res.json();
      setLoading(false);

      if (!res.ok) {
        const msg = json?.error || "Verification failed";
        setError(msg);
        return;
      }

      // success: server returns requiresProfileComplete flag
      const requiresProfile = json?.requiresProfileComplete === true;
      setMessage("Verification successful. Redirecting...");

      // decide destination
      if (requiresProfile) {
        router.push("/auth/complete-profile");
      } else {
        router.push("/dashboard"); // explicit dashboard route
      }
    } catch (err: any) {
      setLoading(false);
      console.error("verifyCode error:", err);
      setError("Network error verifying code. Check server logs.");
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendCode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            {showOtp ? <MessageSquare className="h-8 w-8" /> : <Smartphone className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold">{showOtp ? "Verify Your Phone" : "Login to PropNet"}</CardTitle>
          <CardDescription className="text-blue-100">
            {showOtp ? "Enter the 6-digit code sent to your phone" : "Enter your registered mobile number to continue"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* show messages */}
          {message && <div className="mb-4 text-sm text-green-700 bg-green-50 p-2 rounded">{message}</div>}
          {error && <div className="mb-4 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}

          {!showOtp ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">+91</span>
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
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={phone.replace(/\D/g, "").length !== 10 || loading}
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="text-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Code sent to: <span className="font-medium">+91 {phone}</span></p>
              </div>

              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={code.length !== 6 || loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={() => { setShowOtp(false); setCode(""); setMessage(null); setError(null); }}>
                    Back
                  </Button>

                  <Button type="button" variant="ghost" onClick={handleResend} disabled={resendTimer > 0 || loading} className="text-sm">
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to PropNet?{" "}
              <Link href="/auth/signup"><span className="text-blue-600 hover:text-blue-800 font-medium">Sign up here</span></Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, MessageSquare, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

/**
 * Forgot password / reset PIN
 * Steps:
 *  - phone -> send OTP (purpose: "pin_reset")
 *  - verify OTP -> allow set new PIN -> call verify-otp with purpose "pin_reset" for verification step,
 *    and then call /api/auth/reset-pin (or reuse verify-otp to return logged-in user)
 * For simplicity: we reuse verify-otp endpoint for checking code (purpose pin_reset),
 * and then call a server endpoint to set the PIN if required.
 *
 * For this drop-in, after verification we'll redirect to /auth/setup-pin (you can implement server side pin logic)
 */

export default function Page() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"phone" | "verify" | "newpin">("phone");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const normalizePhone = (v: string) => v.replace(/\D/g, "").slice(0, 10);

  useEffect(() => {
    if (resendTimer === 0) return;
    const t = setInterval(() => {
      setResendTimer((p) => {
        if (p <= 1) {
          clearInterval(t);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = normalizePhone(phone);
    if (p.length !== 10) return alert("Enter a 10-digit phone number.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, purpose: "pin_reset" }),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) return alert(json?.error || "Failed to send reset code.");
      setStep("verify");
      setResendTimer(60);
      alert(json?.message || "Reset code sent");
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Error sending reset code.");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!code || code.length < 4) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, code: code.trim(), purpose: "pin_reset" }),
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) return alert(json?.error || "Verification failed");
      // Move to set new PIN
      setStep("newpin");
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Verification error. Try again.");
    }
  };

  const setPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) return alert("PINs do not match");
    if (newPin.length < 4) return alert("PIN must be at least 4 digits");
    
    const p = normalizePhone(phone);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, newPin }),
      });
      const json = await res.json();
      setLoading(false);
      
      if (!res.ok) return alert(json?.error || "Failed to reset PIN");
      
      alert("PIN reset successfully. You will be redirected to login.");
      router.push("/auth/login");
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Failed to reset PIN");
    }
  };

  const resend = async () => {
    if (resendTimer > 0) return;
    await sendOtp();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-linear-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            {step === "phone" && <Smartphone className="h-8 w-8" />}
            {step === "verify" && <MessageSquare className="h-8 w-8" />}
            {step === "newpin" && <KeyRound className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "phone" && "Reset Your PIN"}
            {step === "verify" && "Verify Reset Code"}
            {step === "newpin" && "Set New PIN"}
          </CardTitle>
          <CardDescription className="text-red-100">
            {step === "phone" && "Enter your registered mobile number"}
            {step === "verify" && "Enter the 6-digit code sent to your phone"}
            {step === "newpin" && "Create a new 4-6 digit PIN"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {step === "phone" && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <Label htmlFor="phone">Registered Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">+91</span>
                  <Input id="phone" type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(normalizePhone(e.target.value))} className="rounded-l-none" maxLength={10} required />
                </div>
                <p className="text-xs text-gray-500 mt-1">We'll send a reset code to this number</p>
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700" disabled={phone.length !== 10 || loading}>
                  {loading ? "Sending..." : "Send Reset Code"}
                </Button>

                <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/auth/login")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Reset code sent to: <span className="font-medium">+91 {phone}</span></p>
              </div>

              <div>
                <Label htmlFor="otp">Reset Code</Label>
                <Input id="otp" type="text" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-2xl tracking-widest" maxLength={6} required />
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700" disabled={code.length !== 6 || loading}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={() => { setStep("phone"); setCode(""); }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button type="button" variant="ghost" onClick={resend} disabled={resendTimer > 0 || loading} className="text-sm">
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === "newpin" && (
            <form onSubmit={setPin} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Setting new PIN for: <span className="font-medium">+91 {phone}</span></p>
              </div>

              <div>
                <Label htmlFor="newPin">New PIN (4-6 digits)</Label>
                <Input id="newPin" type="password" placeholder="••••••" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-2xl tracking-widest" maxLength={6} required />
              </div>

              <div>
                <Label htmlFor="confirmPin">Confirm New PIN</Label>
                <Input id="confirmPin" type="password" placeholder="••••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-2xl tracking-widest" maxLength={6} required />
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700" disabled={newPin.length < 4 || confirmPin.length < 4 || loading}>
                  {loading ? "Setting PIN..." : "Set New PIN"}
                </Button>

                <Button type="button" variant="outline" className="w-full" onClick={() => { setStep("verify"); }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Need help? Contact support for assistance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

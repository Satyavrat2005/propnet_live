// components/BetaForm.tsx
"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/**
 * Beta form inserts into supabase table `beta_users` with columns `name` and `phone`.
 * It navigates to /login after a successful insert.
 *
 * Uses simple inline UI and is responsive via parent layout's Tailwind classes.
 */

export default function BetaForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const router = useRouter();

  const validate = () => {
    const trimmedName = name.trim();
    const digits = phone.replace(/\D/g, "");
    if (trimmedName.length < 2) {
      setStatusMsg("Please enter your name (at least 2 characters).");
      return false;
    }
    if (digits.length !== 10) {
      setStatusMsg("Please enter a valid 10-digit Indian mobile number.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const phoneDigits = phone.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("beta_users")
        .insert([{ name: name.trim(), phone: phoneDigits }]);

      if (error) {
        console.error("Supabase insert error:", error);
        setStatusMsg(error.message || "Failed to submit. Try again.");
        setLoading(false);
        return;
      }

      // success
      setStatusMsg("Thanks! You've been added to the beta list — redirecting...");
      // small delay to show message then route
      setTimeout(() => {
        router.push("/login");
      }, 700);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err?.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="space-y-4">
        <div>
          <label htmlFor="beta-name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="beta-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            maxLength={80}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="beta-phone" className="block text-sm font-medium text-slate-700">
            Mobile number
          </label>
          <div className="mt-1 flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-gray-100 text-sm">
              +91
            </span>
            <input
              id="beta-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              placeholder="9876543210"
              maxLength={10}
              className="block w-full rounded-r-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Apply for beta access"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Join the network
          </button>
        </div>

        {statusMsg && (
          <p
            className={`text-sm ${statusMsg.startsWith("Thanks") ? "text-green-600" : "text-red-600"}`}
            role="status"
          >
            {statusMsg}
          </p>
        )}
      </div>
    </form>
  );
}

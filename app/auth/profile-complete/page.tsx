// app/auth/profile-complete/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Profile complete page (client)
 * - UI unchanged from previous version
 * - Get Started performs:
 *   1) GET /api/auth/me -> expects { user: { phone, name, rera_id, status?, ... } }
 *   2) If status === 'approved' -> redirect /dashboard
 *   3) POST /api/auth/approve-check { phone, name, rera_id } -> expects { approved: boolean }
 *      - Server should check verified_user_check for matching rera_id + name and update profiles.status = 'approved'
 *   4) If approved -> /dashboard else /auth/approval-pending
 *
 * Note: If you want, I can add a suggested server implementation for POST /api/auth/approve-check.
 */

export default function ProfileCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleGetStarted = async () => {
    setErr(null);
    setLoading(true);

    try {
      // 1) read current signed-in user via your existing endpoint
      const meRes = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // include credentials if your API uses cookies/session
        credentials: "same-origin",
      });

      if (!meRes.ok) {
        // Not authenticated or session expired -> go to login
        router.push("/auth/login");
        return;
      }

      const meJson = await meRes.json();
      const user = meJson?.user ?? meJson; // support multiple shapes

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Pull the fields we need. Adjust keys if your /api/auth/me returns different names.
      const phone = (user.phone ?? user.mobile ?? "").toString();
      const name = (user.name ?? user.full_name ?? "").toString().trim();
      const rera_id = (user.rera_id ?? "").toString().trim();
      const status = (user.status ?? "").toString().trim().toLowerCase();

      // If the profile is already approved, go straight to dashboard
      if (status === "approved") {
        router.push("/dashboard");
        return;
      }

      // If name or rera_id missing -> go to approval pending (can't verify)
      if (!name || !rera_id) {
        router.push("/auth/approval-pending");
        return;
      }

      // 2) Ask server to verify and (if match) update profile.status
      // Server endpoint expected: POST /api/auth/approve-check
      // Body: { phone, name, rera_id }
      // Response: { approved: boolean }
      const approveRes = await fetch("/api/auth/approve-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone, name, rera_id }),
      });

      // If endpoint not implemented / returns 404/500, treat as not-approved fallback
      if (!approveRes.ok) {
        // But if server returned JSON with status info, parse it
        try {
          const json = await approveRes.json();
          if (json?.approved === true) {
            router.push("/dashboard");
            return;
          }
        } catch (e) {
          // ignore parse error
        }
        router.push("/auth/approval-pending");
        return;
      }

      const approveJson = await approveRes.json();
      if (approveJson?.approved === true) {
        router.push("/dashboard");
      } else {
        router.push("/auth/approval-pending");
      }
    } catch (e: any) {
      console.error("approval-check error:", e);
      // Fail safe: send to pending if anything unexpected happens
      router.push("/auth/approval-pending");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-svh overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100">
      {/* Soft vignette + pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(60rem 60rem at 10% 10%, rgba(16,185,129,0.08), transparent 60%), radial-gradient(70rem 60rem at 90% 20%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(50rem 40rem at 30% 90%, rgba(14,165,233,0.08), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px, 32px 32px",
          backgroundPosition: "-1px -1px, -1px -1px",
        }}
      />

      {/* Centered card */}
      <section className="relative z-10 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-md">
            {/* Top accent bar */}
            <div className="h-1.5 w-full rounded-t-3xl bg-linear-to-r from-blue-400 via-blue-500 to-blue-600" />

            <div className="p-8 sm:p-10">
              {/* Illustration */}
              <div className="mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-2xl bg-linear-to-br from-blue-50 to-blue-100 shadow-inner">
                <span className="sr-only">Profile completed</span>
                <svg
                  className="h-28 w-28"
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* House base */}
                  <g>
                    <path
                      d="M30 100 L100 40 L170 100"
                      fill="none"
                      stroke="url(#roof)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="55"
                      y="95"
                      width="90"
                      height="70"
                      rx="10"
                      fill="url(#walls)"
                      stroke="rgba(15,23,42,0.08)"
                      strokeWidth="2"
                    />
                    <rect x="85" y="120" width="30" height="45" rx="6" fill="white" />
                    <circle cx="111" cy="142" r="2.2" fill="#10b981" />
                    {/* Window */}
                    <rect x="62" y="108" width="18" height="18" rx="4" fill="white" />
                    <rect x="120" y="108" width="18" height="18" rx="4" fill="white" />
                  </g>

                  {/* Ribbon badge */}
                  <g transform="translate(135,55)">
                    <circle cx="0" cy="0" r="18" fill="url(#badge)" />
                    <path
                      d="M-6 14 L-10 30 L0 22 L10 30 L6 14"
                      fill="url(#tails)"
                      opacity="0.9"
                    />
                    {/* Checkmark */}
                    <path
                      d="M-7 0 l4 5 l10 -12"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <animate
                        attributeName="stroke-dasharray"
                        from="0,40"
                        to="40,0"
                        dur="0.9s"
                        begin="0.2s"
                        fill="freeze"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1"
                      />
                    </path>
                  </g>

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="roof" x1="0" x2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="walls" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#e6fffb" />
                      <stop offset="100%" stopColor="#eff6ff" />
                    </linearGradient>
                    <linearGradient id="badge" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="tails" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#86efac" />
                      <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Heading & message */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Your profile is complete 🎉
                </h1>
                <p className="mx-auto mt-3 max-w-md text-slate-600">
                  Thanks for the information. You’re all set — press the button
                  below to proceed.
                </p>
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="group relative inline-flex items-center justify-center rounded-xl border border-blue-600/20 bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 active:translate-y-0 disabled:opacity-70"
                >
                  <span className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-blue-400 via-blue-500 to-blue-600 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" />
                  {loading ? "Checking..." : "Get Started"}
                  <svg
                    className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {err && <p className="text-sm text-amber-600">{err}</p>}
              </div>

              {/* Secondary link (optional navigation back to home) */}
              <div className="mt-4 text-center">
                <a
                  href="/"
                  className="text-sm font-medium text-slate-500 underline-offset-4 hover:underline"
                >
                  Back to home
                </a>
              </div>
            </div>
          </div>

          {/* Small trust strip (real-estate vibe) */}
          <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Verified Profiles
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Secure Login
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Property Insights
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

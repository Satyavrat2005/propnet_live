// app/auth/approval-pending/page.tsx
import Link from "next/link";

export default function NotApprovedPage() {
  return (
    <main className="relative min-h-[svh] overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100">
      {/* Soft color glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(60rem 60rem at 10% 10%, rgba(245,158,11,0.10), transparent 60%), radial-gradient(70rem 60rem at 90% 20%, rgba(2,132,199,0.10), transparent 60%), radial-gradient(50rem 40rem at 30% 90%, rgba(59,130,246,0.08), transparent 60%)",
        }}
      />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black,transparent_65%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px, 32px 32px",
          backgroundPosition: "-1px -1px, -1px -1px",
        }}
      />

      {/* Centered content */}
      <section className="relative z-10 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-xl backdrop-blur-md">
            {/* Accent bar */}
            <div className="h-1.5 w-full rounded-t-3xl bg-linear-to-r from-amber-500 via-blue-500 to-blue-600" />

            <div className="p-8 sm:p-10">
              {/* Illustration */}
              <div className="mx-auto mb-8 flex h-40 w-40 items-center justify-center rounded-2xl bg-linear-to-br from-amber-50 to-blue-50 shadow-inner">
                <span className="sr-only">Approval pending</span>
                <svg
                  className="h-28 w-28"
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Building / house */}
                  <g>
                    <path
                      d="M30 100 L100 42 L170 100"
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
                    {/* Door & windows */}
                    <rect x="85" y="120" width="30" height="45" rx="6" fill="white" />
                    <circle cx="111" cy="142" r="2.2" fill="#f59e0b" />
                    <rect x="62" y="108" width="18" height="18" rx="4" fill="white" />
                    <rect x="120" y="108" width="18" height="18" rx="4" fill="white" />
                  </g>

                  {/* Hourglass badge (pending) */}
                  <g transform="translate(135,55)">
                    <circle cx="0" cy="0" r="18" fill="url(#badge)" />
                    {/* Hourglass body */}
                    <g transform="scale(0.9)">
                      <path
                        d="M-7 -10 h14 a3 3 0 0 1 0 6 h-14 a3 3 0 0 1 0 -6 z
                           M-7 10 h14 a3 3 0 0 1 0 6 h-14 a3 3 0 0 1 0 -6 z
                           M-6 -4 c6 6 6 6 12 0
                           M-6 4 c6 -6 6 -6 12 0"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Sand animation */}
                      <circle r="2" fill="white">
                        <animate
                          attributeName="cy"
                          dur="1.6s"
                          values="-2;4;-2"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  </g>

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="roof" x1="0" x2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id="walls" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fff7ed" />
                      <stop offset="100%" stopColor="#eff6ff" />
                    </linearGradient>
                    <linearGradient id="badge" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Heading & copy */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Approval pending
                </h1>
                <p className="mx-auto mt-3 max-w-md text-slate-600">
                  Your account is still under review. Please check back later,
                  or reach out to an administrator if you need assistance. We’ll
                  notify you as soon as your access is enabled.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/login"
                  className="group relative inline-flex items-center justify-center rounded-xl border border-amber-600/20 bg-amber-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-amber-600/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 active:translate-y-0"
                >
                  <span className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-amber-500 via-blue-500 to-cyan-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" />
                  Check Again
                  <svg
                    className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 12a9 9 0 1 0 9-9M3 6v6h6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Small reassurance strip */}
          <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Review in Progress
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Secure Access
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-500" />
              Trusted Listings
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

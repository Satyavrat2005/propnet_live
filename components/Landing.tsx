"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Users,
  FileCheck,
  IndianRupee,
  MapPin,
  Search,
  Star,
  Play,
  TrendingUp,
  Clock,
  Zap,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  Lock,
  BarChart3,
} from "lucide-react";

/**
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local
 * Make sure those env vars are present in your app before running.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
  );
}

// Create a client even if env vars are missing (will fail gracefully on API calls)
const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key");

export default function Page() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  // helper for scrolling to beta form
  const scrollToBetaForm = () =>
    document.getElementById("beta-form")?.scrollIntoView({ behavior: "smooth" });

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // basic phone normalization (remove spaces, +91 prefix handling is minimal)
  const normalizePhone = (raw: string) => raw.replace(/[^\d]/g, "");

  // Submit: check if phone exists, if not insert into supabase beta_users (columns: name, phone) then navigate to /login
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    const rawPhone = formData.phone.trim();
    const phone = normalizePhone(rawPhone);

    if (!name || !phone) {
      alert("Please enter both name and contact number.");
      return;
    }

    // optional: basic length check (adjust to your required validation)
    if (phone.length < 7 || phone.length > 15) {
      alert("Please enter a valid contact number.");
      return;
    }

    setLoading(true);

    try {
      // Check existing phone
      const { data: existingData, error: selectError } = await supabase
        .from("beta_users")
        .select("id, phone")
        .eq("phone", phone)
        .limit(1);

      if (selectError) {
        console.error("Supabase select error:", selectError);
        alert("Unable to check the phone number right now. Please try again.");
        setLoading(false);
        return;
      }

      if (existingData && existingData.length > 0) {
        // phone already exists
        alert("This phone number is already registered. Please use another number.");
        setLoading(false);
        return;
      }

      // Insert new record
      const { error: insertError } = await supabase
        .from("beta_users")
        .insert([{ name, phone }]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        alert("Failed to register. Please try again.");
        setLoading(false);
        return;
      }

      // Success -> navigate to /login
      router.push("/auth/login");
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Building2 className="h-8 w-8 text-emerald-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  PropNet
                </span>
                <span className="hidden sm:inline-flex bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full px-2 py-0.5 text-xs font-medium">
                  Live
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                className="bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                onClick={() => router.push("/auth/login")}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-600 via-blue-600 to-indigo-700 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/20 text-white border border-white/30 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Trusted by 500+ Real Estate Professionals</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Real Estate Network,
              <br />
              <span className="bg-linear-to-r from-yellow-300 via-yellow-200 to-yellow-300 bg-clip-text text-transparent">
                Built for Success.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              The only platform where <span className="font-semibold text-white">verified brokers</span> connect,
              collaborate, and close deals with <span className="font-semibold text-yellow-300">complete transparency</span> and <span className="font-semibold text-yellow-300">commission protection</span>.
            </p>

            <div className="flex justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 border-0 group"
                onClick={() => router.push("/auth/login")}
              >
                Join PropNet Today
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <Trophy className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Lead Protection</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <Shield className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Verified Network</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <BarChart3 className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Track Everything</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-block bg-red-100 text-red-700 border border-red-300 rounded-full px-4 py-1 mb-4 text-sm font-medium">
              The Challenge
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Real Estate Shouldn't Feel Like a Battle
            </h2>
            <p className="text-lg text-gray-600">
              But without the right tools, it often does. Sound familiar?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="relative bg-linear-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <p className="text-gray-800 text-lg font-medium mt-2">
                You show clients properties, but someone else closes the deal and gets the commission.
              </p>
            </div>

            <div className="relative bg-linear-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <p className="text-gray-800 text-lg font-medium mt-2">
                Your exclusive listings get shared everywhere without credit or consent.
              </p>
            </div>

            <div className="relative bg-linear-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <p className="text-gray-800 text-lg font-medium mt-2">
                No proof of your efforts when commission disputes arise.
              </p>
            </div>

            <div className="relative bg-linear-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
              <p className="text-gray-800 text-lg font-medium mt-2">
                WhatsApp chaos with no organized system for leads and listings.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-bold text-gray-900 mb-2">
              It's not your fault.
            </p>
            <p className="text-xl text-emerald-600 font-semibold">
              You just needed the right platform. Welcome to PropNet.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Section (What We Fixed) */}
      <section className="py-16 md:py-20 bg-linear-to-b from-emerald-50 via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full px-4 py-1 mb-4 text-sm font-medium">
                Platform Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Everything You Need to Win
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Professional tools designed specifically for real estate brokers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Verified Network</h3>
                <p className="text-gray-600">
                  Exclusive platform for verified brokers and agents only. No buyers, no builders, no spam.
                </p>
              </div>

              <div className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Owner Consent</h3>
                <p className="text-gray-600">
                  Every listing verified with SMS-based owner approval. Real properties, real trust.
                </p>
              </div>

              <div className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Smart Listing Cards</h3>
                <p className="text-gray-600">
                  Auto-generated, media-rich property cards. Upload once, share everywhere professionally.
                </p>
              </div>

              <div className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-yellow-500">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <IndianRupee className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Commission Protection</h3>
                <p className="text-gray-600">
                  Digital consent forms, clear terms, and timestamped records. Your commission is protected.
                </p>
              </div>

              <div className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-red-500">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Lead Protection</h3>
                <p className="text-gray-600">
                  Track every client interaction with timestamps. Get full credit for your hard work.
                </p>
              </div>

              <div className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Smart Search</h3>
                <p className="text-gray-600">
                  Map-based property discovery with filters for location, price, and property type.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 bg-linear-to-b from-white via-slate-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-700 border border-blue-300 rounded-full px-4 py-1 mb-4 text-sm font-medium">
              Why PropNet?
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Built for Real Estate Professionals
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to grow your business and protect your interests
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Never Lose a Lead
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track every client interaction with timestamps. Your efforts are recorded, your commission is protected.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Full Transparency
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Digital consent forms, clear commission terms, and verified listings. No surprises, no disputes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Work Smarter
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Say goodbye to WhatsApp chaos. Organize listings, manage clients, and close deals efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 md:py-20 bg-linear-to-b from-blue-50/40 via-purple-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-block bg-purple-100 text-purple-700 border border-purple-300 rounded-full px-4 py-1 mb-4 text-sm font-medium">
              Coming Soon
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              The Future of PropNet
            </h2>
            <p className="text-lg text-gray-600">
              We're constantly innovating to make your work easier
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg group">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">AI Buyer Matching</h3>
              <p className="text-sm text-gray-600">Match properties to buyers automatically using smart algorithms</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg group">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Preference Reports</h3>
              <p className="text-sm text-gray-600">Auto-generate detailed property requirement reports for clients</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg group">
              <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Reputation System</h3>
              <p className="text-sm text-gray-600">Build your professional reputation with verified ratings and reviews</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg group">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Builder Module</h3>
              <p className="text-sm text-gray-600">Direct collaboration features with developers and builders</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg group">
              <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Smart Documents</h3>
              <p className="text-sm text-gray-600">Automated document handling and digital signature integration</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg group">
              <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600">Track your performance with detailed insights and metrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Application Form */}
      {/* <section id="beta-form" className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Get Early Access</h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-2">
                We're onboarding the first 250 verified brokers in Ahmedabad.
              </p>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                Interested in testing our platform?
              </p>
            </div>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Join the Beta</CardTitle>
                <CardDescription>Share your details and we'll be in touch</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="Your full name"
                      className="h-11 w-full border border-gray-300 text-gray-800 placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Contact Number *
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="Your WhatsApp number"
                      className="h-11 w-full border border-gray-300 text-gray-800 placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Apply for Beta Access"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* Final CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-linear-to-br from-emerald-600 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[60px_60px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-linear-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
              Real Estate Business?
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of real estate professionals who are already winning with PropNet.
          </p>

          <div className="flex justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 px-12 py-7 text-xl font-bold shadow-2xl group"
              onClick={() => router.push("/auth/login")}
            >
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-blue-200 text-sm">
            No credit card required · Get started in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-emerald-400" />
                <span className="text-2xl font-bold">PropNet</span>
              </div>
              <p className="text-gray-400 mb-4">
                The trusted platform for real estate professionals. Built by brokers, for brokers.
              </p>
              <div className="inline-flex items-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                <span>Live & Growing</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/auth/login" className="block text-gray-400 hover:text-emerald-400 transition-colors">
                  Login
                </Link>
                <Link href="/auth/signup" className="block text-gray-400 hover:text-emerald-400 transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Platform Features</h3>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                  Verified Broker Network
                </p>
                <p className="text-gray-400 text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                  Lead Protection System
                </p>
                <p className="text-gray-400 text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                  Commission Transparency
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm text-center md:text-left">
                &copy; 2025 PropNet. All rights reserved. Building the future of real estate.
              </p>
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                  Access Platform →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

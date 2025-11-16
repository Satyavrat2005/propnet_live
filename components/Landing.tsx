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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold">PropNet</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                  Beta
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-semibold shadow-md hover:shadow-lg transition-all duration-200 border border-yellow-500"
                onClick={() => router.push("/auth/login")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              The Real Estate Network
              <br />
              <span className="text-yellow-300">Built for Brokers.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 text-blue-100 px-2">
              A powerful <span className="font-semibold">private network</span> built for{" "}
              <span className="font-bold text-white">verified brokers</span> — where every{" "}
              <span className="italic font-semibold">lead</span>,{" "}
              <span className="italic font-semibold">listing</span>, and{" "}
              <span className="italic font-semibold">effort</span> is tracked, protected, and
              rewarded.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-6 px-4">
              <Button
                size="lg"
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-6 md:px-10 py-3 md:py-4 w-full sm:w-auto font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() => router.push("/auth/login")}
              >
                Get Started
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white hover:bg-white hover:text-blue-600 px-6 md:px-8 py-3 font-medium w-full sm:w-auto text-[#facc15]"
                onClick={() => router.push("/auth/login")}
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2 inline-block" />
                See Demo
              </Button>
            </div>

            <p className="text-sm sm:text-base italic text-blue-200 px-4">
              "WhatsApp isn't built for real estate. We are."
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 md:py-16 bg-red-50 dark:bg-red-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-600 inline mr-2 align-middle" />
              The Problem: Real Estate Is Broken for Brokers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-8">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500 border border-gray-200">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  You show a client a property, someone else closes the deal.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500 border border-gray-200">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  Your listings are shared everywhere without your name.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500 border border-gray-200">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  You do the hard work, but get ghosted — or lose commission.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500 border border-gray-200">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  Every deal feels like a war instead of a win.
                </p>
              </div>
            </div>

            <p className="text-lg md:text-xl mt-6 text-gray-600 dark:text-gray-300 px-4">
              It's not your fault. You never had the right tools.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Section (What We Fixed) */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 inline mr-2 align-middle" />
                What We Fixed
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Features That Matter
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              <Card className="border border-gray-200 border-l-4 border-l-blue-500">
                <CardHeader>
                  <Shield className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Verified Brokers-Only Network</CardTitle>
                  <CardDescription>
                    Only real, verified agents and brokers. No builders, no buyers, no noise.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border border-gray-200 border-l-4 border-l-green-500">
                <CardHeader>
                  <FileCheck className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Owner-Approved Listings</CardTitle>
                  <CardDescription>
                    Every property comes from a real broker with owner consent.
                    No duplicates. No misinformation.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border border-gray-200 border-l-4 border-l-purple-500">
                <CardHeader>
                  <Zap className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>Structured Listing Sharing</CardTitle>
                  <CardDescription>
                    Upload once. Share anytime. Auto-generated, searchable,
                    media-rich listing cards. Goodbye WhatsApp chaos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border border-gray-200 border-l-4 border-l-yellow-500">
                <CardHeader>
                  <IndianRupee className="h-10 w-10 text-yellow-600 mb-2" />
                  <CardTitle>Commission Protection Tools</CardTitle>
                  <CardDescription>
                    Set clear terms with your client: role, responsibility, and
                    commission. Get digital consent.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border border-gray-200 border-l-4 border-l-red-500">
                <CardHeader>
                  <Users className="h-10 w-10 text-red-600 mb-2" />
                  <CardTitle>Anti-Poaching & Lead Protection</CardTitle>
                  <CardDescription>
                    Timestamped lead logs, visit history, and soft exclusivity.
                    Get credit for your work. Every time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border border-gray-200 border-l-4 border-l-indigo-500">
                <CardHeader>
                  <MapPin className="h-10 w-10 text-indigo-600 mb-2" />
                  <CardTitle>Map-Based Search (Beta)</CardTitle>
                  <CardDescription>
                    Find listings based on location, landmarks, radius, or
                    micro-market demand.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience (Built For) */}
      <section className="py-12 md:py-16 bg-blue-50 dark:bg-blue-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Built For: Brokers & Agents in the Secondary Market
            </h2>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 text-left">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-blue-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-semibold">
                    Stop losing leads due to system gaps
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Track every interaction and maintain lead ownership
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 text-left">
                <div className="flex-shrink-0">
                  <Shield className="w-12 h-12 md:w-16 md:h-16 text-green-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-semibold">
                    Protect your commission, effort, and relationships
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Digital consent tools and transparent commission terms
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 text-left">
                <div className="flex-shrink-0">
                  <IndianRupee className="w-12 h-12 md:w-16 md:h-16 text-yellow-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-semibold">
                    Earn more with less chaos
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                    Streamlined workflows and organized property management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">What's Coming Soon</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center">
                <Search className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-center">AI-Powered Buyer Matching</h3>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center">
                <FileCheck className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-center">Property Preference Report Generator</h3>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center">
                <Star className="w-8 h-8 text-yellow-600 mb-2" />
                <h3 className="font-semibold text-center">Reputation & Rating Layer</h3>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center">
                <Building2 className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-center">Builder/Developer Module</h3>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg flex flex-col items-center">
                <Clock className="w-8 h-8 text-red-600 mb-2" />
                <h3 className="font-semibold text-center">Automated Document Handling</h3>
              </div>
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

      {/* Bottom CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Trust · Clarity · Reward</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 w-full sm:w-auto"
              onClick={() => router.push("/auth/login")}
            >
              Join The Network
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-white text-yellow-400 hover:bg-white hover:text-blue-600 w-full sm:w-auto"
              onClick={() => router.push("/auth/login")}
            >
              <MessageSquare className="w-4 h-4 mr-2 inline-block" />
              Suggestions
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">PropNet</span>
              <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                Beta
              </Badge>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">&copy; 2025 PropNet. All rights reserved.</p>
              <div className="mt-2">
                <Link
                  href="/auth/login"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium underline-offset-2 hover:underline inline-block px-3 py-1 rounded-md hover:bg-blue-500/10 border border-blue-500/30"
                >
                  Approved Beta Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

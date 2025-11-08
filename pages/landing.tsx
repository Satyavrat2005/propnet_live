// app/landing/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Button,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function Landing() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [suggestionData, setSuggestionData] = useState({
    name: "",
    contact: "",
    suggestion: "",
  });
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ phone: "" });

  const betaSignupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/beta-signup", data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description:
          "We'll review your application and contact you soon with beta access details.",
      });
      setFormData({ name: "", phone: "" });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: async (data: typeof suggestionData) => {
      return apiRequest("POST", "/api/suggestions", data);
    },
    onSuccess: () => {
      toast({
        title: "Suggestion Submitted!",
        description: "Thank you for your feedback. We'll review it carefully.",
      });
      setSuggestionData({ name: "", contact: "", suggestion: "" });
      setShowSuggestionForm(false);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginData) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Welcome!",
        description: "Login successful. Redirecting to dashboard...",
      });

      // navigate to dashboard
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error?.message || "Phone number not approved for beta access",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast({
        title: "Missing Information",
        description:
          "Please fill in your name and contact number to apply for beta access.",
        variant: "destructive",
      });
      return;
    }

    betaSignupMutation.mutate(formData);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !suggestionData.name ||
      !suggestionData.contact ||
      !suggestionData.suggestion
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    suggestionMutation.mutate(suggestionData);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.phone) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to login.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(loginData);
  };

  const updateFormData = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateSuggestionData = (field: string, value: string) =>
    setSuggestionData((prev) => ({ ...prev, [field]: value }));

  const updateLoginData = (field: string, value: string) =>
    setLoginData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              PropNet
            </span>
            <Badge variant="secondary" className="ml-2">
              Beta
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-semibold shadow-md hover:shadow-lg transition-all duration-200 border border-yellow-500"
              onClick={() =>
                document
                  .getElementById("beta-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Early Access
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
              The Real Estate Network
              <br />
              <span className="text-yellow-300">Built for Brokers.</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-blue-100 px-2">
              A powerful <span className="font-semibold">private network</span>{" "}
              built for <span className="font-bold text-white">verified brokers</span>{" "}
              — where every <span className="italic font-semibold">lead</span>,{" "}
              <span className="italic font-semibold">listing</span>, and{" "}
              <span className="italic font-semibold">effort</span> is tracked,
              protected, and rewarded.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-6 md:mb-8 px-4">
              <Button
                size="lg"
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-8 md:px-10 py-4 w-full sm:w-auto font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() =>
                  document
                    .getElementById("beta-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get Early Access
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-white hover:bg-white hover:text-blue-600 px-6 md:px-8 py-3 font-medium w-full sm:w-auto text-[#facc15]"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                See Demo
              </Button>
            </div>

            <p className="text-base md:text-lg italic text-blue-200 px-4">
              "WhatsApp isn't built for real estate. We are."
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 md:py-16 bg-red-50 dark:bg-red-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-600 inline mr-2" />
              The Problem: Real Estate Is Broken for Brokers
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-12">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  You show a client a property, someone else closes the deal.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  Your listings are shared everywhere without your name.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  You do the hard work, but get ghosted — or lose commission.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
                  Every deal feels like a war instead of a win.
                </p>
              </div>
            </div>

            <p className="text-lg md:text-xl mt-6 md:mt-8 text-gray-600 dark:text-gray-300 px-4">
              It's not your fault. You never had the right tools.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 inline mr-2" />
                What We Fixed
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Features That Matter</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              <Card className="border-l-4">
                <CardHeader>
                  <Shield className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle>Verified Brokers-Only Network</CardTitle>
                  <CardDescription>
                    Only real, verified agents and brokers. No builders, no buyers, no noise.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4">
                <CardHeader>
                  <FileCheck className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Owner-Approved Listings</CardTitle>
                  <CardDescription>
                    Every property comes from a real broker with owner consent. No duplicates. No misinformation.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4">
                <CardHeader>
                  <Zap className="h-10 w-10 text-purple-600 mb-2" />
                  <CardTitle>Structured Listing Sharing</CardTitle>
                  <CardDescription>
                    Upload once. Share anytime. Auto-generated, searchable, media-rich listing cards. Goodbye WhatsApp chaos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4">
                <CardHeader>
                  <IndianRupee className="h-10 w-10 text-yellow-600 mb-2" />
                  <CardTitle>Commission Protection Tools</CardTitle>
                  <CardDescription>
                    Set clear terms with your client: role, responsibility, and commission. Get digital consent.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4">
                <CardHeader>
                  <Users className="h-10 w-10 text-red-600 mb-2" />
                  <CardTitle>Anti-Poaching & Lead Protection</CardTitle>
                  <CardDescription>
                    Timestamped lead logs, visit history, and soft exclusivity. Get credit for your work. Every time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-l-4">
                <CardHeader>
                  <MapPin className="h-10 w-10 text-indigo-600 mb-2" />
                  <CardTitle>Map-Based Search (Beta)</CardTitle>
                  <CardDescription>
                    Find listings based on location, landmarks, radius, or micro-market demand.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-12 md:py-16 bg-blue-50 dark:bg-blue-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
              Built For: Brokers & Agents in the Secondary Market
            </h2>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 text-left">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-blue-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Stop losing leads due to system gaps</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Track every interaction and maintain lead ownership</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 text-left">
                <div className="flex-shrink-0">
                  <Shield className="w-12 h-12 md:w-16 md:h-16 text-green-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Protect your commission, effort, and relationships</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Digital consent tools and transparent commission terms</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-4 text-left">
                <div className="flex-shrink-0">
                  <IndianRupee className="w-12 h-12 md:w-16 md:h-16 text-yellow-600" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Earn more with less chaos</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Streamlined workflows and organized property management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">What's Coming Soon</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <Search className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">AI-Powered Buyer Matching</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <FileCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Property Preference Report Generator</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold">Reputation & Rating Layer</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <Building2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Builder/Developer Module</h3>
              </div>
              <div className="p-4 border rounded-lg">
                <Clock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold">Automated Document Handling</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Application Form */}
      <section id="beta-form" className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Get Early Access</h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-2">We're onboarding the first 250 verified brokers in Ahmedabad.</p>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">Interested in testing our platform?</p>
            </div>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Join the Beta</CardTitle>
                <CardDescription>Share your details and we'll be in touch</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="Your full name"
                      className="h-11"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Number *</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="Your WhatsApp number"
                      className="h-11"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium"
                    disabled={betaSignupMutation.isPending}
                  >
                    {betaSignupMutation.isPending ? "Submitting..." : "Apply for Beta Access"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Trust · Clarity · Reward</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-yellow-400 text-blue-900 hover:bg-yellow-300"
              onClick={() =>
                document
                  .getElementById("beta-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Join The Network
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-white text-yellow-400 hover:bg-white hover:text-blue-600"
              onClick={() => setShowSuggestionForm(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Suggestions
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">PropNet</span>
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">&copy; 2025 PropNet. All rights reserved.</p>
              <div className="mt-2">
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium underline-offset-2 hover:underline transition-colors border border-blue-500/30 px-3 py-1 rounded-md hover:bg-blue-500/10">
                  Approved Beta Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Suggestion Modal (simple) */}
      {showSuggestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Share Your Suggestion
              </CardTitle>
              <CardDescription>Help us improve PropNet with your feedback</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Your Name *</label>
                  <Input
                    value={suggestionData.name}
                    onChange={(e) => updateSuggestionData("name", e.target.value)}
                    placeholder="Your full name"
                    className="h-11"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact (Mobile/Email) *</label>
                  <Input
                    value={suggestionData.contact}
                    onChange={(e) => updateSuggestionData("contact", e.target.value)}
                    placeholder="Your mobile number or email"
                    className="h-11"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Your Suggestion *</label>
                  <Textarea
                    value={suggestionData.suggestion}
                    onChange={(e) => updateSuggestionData("suggestion", e.target.value)}
                    placeholder="Tell us what feature or improvement you'd like to see..."
                    className="min-h-[100px] text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium"
                    disabled={suggestionMutation.isPending}
                  >
                    {suggestionMutation.isPending ? "Submitting..." : "Submit Suggestion"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setShowSuggestionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

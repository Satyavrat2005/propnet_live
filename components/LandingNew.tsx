"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Shield,
  CheckCircle,
  Users,
  FileCheck,
  IndianRupee,
  MapPin,
  Search,
  Star,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  Lock,
  BarChart3,
  Handshake,
  LineChart,
  Globe,
  AlertCircle,
  MessageSquare,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function LandingNew() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white p-1 border border-gray-200">
                <img 
                  src="/Propnet_icon.png" 
                  alt="PropNet" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">PropNet</span>
              <Badge className="hidden sm:inline-flex bg-blue-100 text-blue-700 border-blue-300 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
            <Button
              onClick={() => router.push("/auth/login")}
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base px-4 sm:px-6 h-9 sm:h-10"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Bento Grid */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 bg-linear-to-br from-blue-50 via-white to-blue-50/30 overflow-hidden">
        <div className="absolute inset-0 bg-grid-blue-100/[0.2] bg-size-[30px_30px] sm:bg-size-[40px_40px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hero Content */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-4 sm:mb-6 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Trusted by 500+ Real Estate Professionals
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
              Your Real Estate Network,
              <br />
              <span className="bg-linear-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Built for Success
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              Connect with verified brokers, protect your leads, and close deals faster on India's most trusted real estate platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Button
                size="lg"
                onClick={() => router.push("/auth/login")}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg shadow-blue-600/30 group"
              >
                Join PropNet Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
            <Card className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 border-0 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-90" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">500+</div>
                <div className="text-xs sm:text-sm opacity-90">Active Brokers</div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 border-0 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-90" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">2,500+</div>
                <div className="text-xs sm:text-sm opacity-95">Properties Listed</div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-500 to-purple-600 border-0 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <Handshake className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-90" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">1,200+</div>
                <div className="text-xs sm:text-sm opacity-90">Deals Closed</div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-yellow-500 to-yellow-600 border-0 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <IndianRupee className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-90" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">₹120Cr+</div>
                <div className="text-xs sm:text-sm opacity-90">Commission Protected</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problems vs Solutions Table */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-red-100 text-red-700 border-red-300 mb-3 sm:mb-4 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              The Challenge
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              From Real Estate Chaos to Clarity
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              See how PropNet solves the biggest pain points in real estate
            </p>
          </div>

          {/* Mobile: Card Layout, Desktop: Table */}
          <div className="max-w-6xl mx-auto">
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">Without PropNet</h3>
                      <p className="text-sm text-gray-700">Commission theft - show properties, someone else closes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-red-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">With PropNet</h3>
                      <p className="text-sm text-blue-700">Lead protection with timestamped records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">Without PropNet</h3>
                      <p className="text-sm text-gray-700">Listings stolen without credit or consent</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-red-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">With PropNet</h3>
                      <p className="text-sm text-blue-700">SMS-verified owner consent for all listings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">Without PropNet</h3>
                      <p className="text-sm text-gray-700">No proof when commission disputes arise</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-red-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">With PropNet</h3>
                      <p className="text-sm text-blue-700">Digital consent forms with clear terms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">Without PropNet</h3>
                      <p className="text-sm text-gray-700">WhatsApp chaos, no organized system</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-red-200">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">With PropNet</h3>
                      <p className="text-sm text-blue-700">Professional dashboard for everything</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">Without PropNet</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Check className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">With PropNet</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">Commission theft - you show properties, someone else closes and gets paid</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 bg-blue-50/50">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Lead protection system with timestamped client interaction records</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">Exclusive listings get stolen and shared everywhere without credit or consent</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 bg-blue-50/50">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">SMS-verified owner consent required for every listing - full transparency</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">No proof of your efforts when commission disputes arise</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 bg-blue-50/50">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Digital consent forms with clear commission terms and complete audit trail</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">WhatsApp chaos with no organized system for tracking leads and listings</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 bg-blue-50/50">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Professional dashboard to organize everything - clients, listings, deals</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-12 px-4">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              It's not your fault.
            </p>
            <p className="text-lg sm:text-xl text-blue-600 font-semibold">
              You just needed the right platform. Welcome to PropNet.
            </p>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-12 sm:py-16 md:py-20 bg-linear-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-3 sm:mb-4 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Platform Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              Everything You Need to Win
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Professional tools designed specifically for real estate brokers
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {/* Large Feature Card - Spans 2 columns on desktop */}
            <Card className="sm:col-span-2 lg:col-span-2 bg-linear-to-br from-blue-600 to-blue-700 border-0 text-white hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[20px_20px]"></div>
              <CardContent className="p-6 sm:p-8 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Verified Broker Network</h3>
                    <p className="text-blue-100 text-sm sm:text-base">
                      Connect with confidence - every member is a verified real estate professional
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold mb-1">100%</div>
                    <div className="text-xs sm:text-sm text-blue-100">Verified Profiles</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                    <div className="text-2xl sm:text-3xl font-bold mb-1">Zero</div>
                    <div className="text-xs sm:text-sm text-blue-100">Spam Users</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
                    <div className="text-2xl sm:text-3xl font-bold mb-1">500+</div>
                    <div className="text-xs sm:text-sm text-blue-100">Active Brokers</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vertical Feature Card */}
            <Card className="sm:row-span-2 bg-linear-to-br from-blue-500 to-blue-600 border-0 text-white hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-6 sm:p-8 h-full flex flex-col">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileCheck className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Owner Consent System</h3>
                <p className="text-blue-100 mb-6 text-sm sm:text-base grow">
                  Every listing verified with SMS-based owner approval. Real properties, real trust, zero fake listings.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>SMS verification required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>Owner details protected</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>Consent timestamp stored</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regular Feature Cards */}
            <Card className="bg-white border-2 border-gray-200 hover:border-purple-500 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Smart Listing Cards</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Auto-generated, media-rich property cards. Upload once, share professionally.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 hover:border-yellow-500 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <IndianRupee className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Commission Protection</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Digital consent forms and timestamped records. Your commission is protected.
                </p>
              </CardContent>
            </Card>

            {/* Wide Feature Card */}
            <Card className="sm:col-span-2 bg-linear-to-br from-red-500 to-red-600 border-0 text-white hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div className="grow">
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Lead Protection System</h3>
                    <p className="text-red-100 text-sm sm:text-base">
                      Track every client interaction with timestamps. Get full credit for your hard work - never lose a commission again.
                    </p>
                  </div>
                  <Button variant="secondary" className="w-full sm:w-auto bg-white text-red-600 hover:bg-red-50 shrink-0">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Smart Search</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Map-based discovery with filters for location, price, and property type.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 hover:border-blue-600 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Built-in Messaging</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Connect with brokers and clients directly through our secure platform.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900">Analytics Dashboard</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Track your performance with detailed insights and metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose PropNet - Bento Grid */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 mb-3 sm:mb-4 text-xs sm:text-sm">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Why PropNet?
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              Built for Real Estate Professionals
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need to grow your business and protect your interests
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <Card className="bg-linear-to-br from-blue-600 to-blue-700 border-0 text-white hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Never Lose a Lead</h3>
                <p className="text-blue-100 leading-relaxed text-sm sm:text-base">
                  Track every client interaction with timestamps. Your efforts are recorded, your commission is protected.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-blue-500 to-blue-600 border-0 text-white hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Full Transparency</h3>
                <p className="text-blue-100 leading-relaxed text-sm sm:text-base">
                  Digital consent forms, clear commission terms, and verified listings. No surprises, no disputes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-yellow-500 to-yellow-600 border-0 text-white hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Work Smarter</h3>
                <p className="text-yellow-100 leading-relaxed text-sm sm:text-base">
                  Say goodbye to WhatsApp chaos. Organize listings, manage clients, and close deals efficiently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 mb-3 sm:mb-4 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Coming Soon
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              The Future of PropNet
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              We're constantly innovating to make your work easier
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[
              { icon: Search, title: "AI Buyer Matching", desc: "Match properties to buyers automatically using smart algorithms", color: "blue" },
              { icon: FileCheck, title: "Preference Reports", desc: "Auto-generate detailed property requirement reports for clients", color: "emerald" },
              { icon: Star, title: "Reputation System", desc: "Build your professional reputation with verified ratings and reviews", color: "yellow" },
              { icon: Building2, title: "Builder Module", desc: "Direct collaboration features with developers and builders", color: "purple" },
              { icon: Globe, title: "Smart Documents", desc: "Automated document handling and digital signature integration", color: "red" },
              { icon: LineChart, title: "Advanced Analytics", desc: "Deep insights into market trends and your performance metrics", color: "indigo" },
            ].map((feature, idx) => (
              <Card key={idx} className="bg-white border-2 border-gray-200 hover:border-blue-600 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-5 sm:p-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Final CTA */}
      <section className="py-16 sm:py-20 md:py-28 relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[40px_40px] sm:bg-size-[60px_60px]"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white leading-tight px-4">
            Ready to Transform Your
            <br />
            <span className="bg-linear-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
              Real Estate Business?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Join hundreds of real estate professionals who are already winning with PropNet.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6 sm:mb-8">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 px-8 sm:px-12 py-6 sm:py-7 text-lg sm:text-xl font-bold shadow-2xl group"
              onClick={() => router.push("/auth/login")}
            >
              Get Started Now
              <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-blue-200 text-sm sm:text-base">
            No credit card required · Get started in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white p-1">
                  <img 
                    src="/Propnet_icon.png" 
                    alt="PropNet" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl sm:text-2xl font-bold">PropNet</span>
              </div>
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                The trusted platform for real estate professionals. Built by brokers, for brokers.
              </p>
              <div className="inline-flex items-center bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                <span>Live & Growing</span>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/auth/login" className="block text-gray-400 hover:text-blue-400 transition-colors text-sm sm:text-base">
                  Login
                </Link>
                <Link href="/auth/signup" className="block text-gray-400 hover:text-blue-400 transition-colors text-sm sm:text-base">
                  Sign Up
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Platform Features</h3>
              <div className="space-y-2">
                <p className="text-gray-400 text-xs sm:text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-400 shrink-0" />
                  Verified Broker Network
                </p>
                <p className="text-gray-400 text-xs sm:text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-400 shrink-0" />
                  Lead Protection System
                </p>
                <p className="text-gray-400 text-xs sm:text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-400 shrink-0" />
                  Commission Transparency
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
                &copy; 2025 PropNet. All rights reserved. Building the future of real estate.
              </p>
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors">
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

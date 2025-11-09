// app/property-feed/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { UserCircle, Plus, Search, Filter, X, Sparkles } from "lucide-react";
import CompactPropertyCard from "@/components/ui/compact-property-card";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/utils/formatters";
import { safeFetch } from "@/lib/safeFetch";

export default function PropertyFeedPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<string>("sale");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState({
    propertyType: "",
    bhk: "",
    location: "",
    listingType: "",
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);

  const { user } = useAuth();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => safeFetch("/api/properties", []),
  });

  const filteredProperties = Array.isArray(properties)
    ? properties.filter((property: any) => {
        // Search query filter
        const matchesSearch =
          !searchQuery ||
          property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.description?.toLowerCase().includes(searchQuery.toLowerCase());

        // Tab filter (transaction type)
        const matchesTab = selectedTab === "all" || property.transactionType === selectedTab;

        // Advanced filters
        const matchesPropertyType = !filters.propertyType || property.propertyType === filters.propertyType;
        const matchesBHK = !filters.bhk || property.bhk?.toString() === filters.bhk;
        const matchesLocation = !filters.location || property.location?.toLowerCase().includes(filters.location.toLowerCase());
        const matchesListingType = !filters.listingType || property.listingType === filters.listingType;

        // price parsing fallback (strip non-digits)
        const propertyPrice = parseFloat(String(property.price || "").replace(/[^\d.]/g, "")) || 0;
        const matchesPriceRange = propertyPrice >= priceRange[0] && propertyPrice <= priceRange[1];

        return (
          matchesSearch &&
          matchesTab &&
          matchesPropertyType &&
          matchesBHK &&
          matchesLocation &&
          matchesListingType &&
          matchesPriceRange
        );
      })
    : [];

  const clearFilters = () => {
    setFilters({
      propertyType: "",
      bhk: "",
      location: "",
      listingType: "",
    });
    setPriceRange([0, 10000000]);
    setSearchQuery("");
    setShowFilters(false);
  };

  const activeFiltersCount =
    Object.values(filters).filter(Boolean).length +
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Properties</h1>
              <p className="text-sm text-neutral-500">{filteredProperties.length} listings available</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/quickpost")}
                className="flex items-center space-x-1 text-primary border-primary hover:bg-primary/5"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">QuickPost</span>
              </Button>
              <button className="p-2 text-neutral-400" onClick={() => router.push("/profile")} type="button" aria-label="Profile">
                <UserCircle size={28} />
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by address, city, or ZIP code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 border-gray-200 focus:border-primary bg-gray-50 focus:bg-white transition-colors rounded-lg"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-3 min-w-fit rounded-lg ${
                activeFiltersCount > 0 ? "border-primary text-primary bg-primary/5" : "bg-gray-50"
              }`}
            >
              <Filter size={16} />
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeFiltersCount}</span>
              )}
            </Button>
          </div>

          {/* Transaction Type Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTab("sale")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                selectedTab === "sale" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              type="button"
            >
              For Sale
            </button>
            <button
              onClick={() => setSelectedTab("rent")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                selectedTab === "rent" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              type="button"
            >
              For Rent
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <Card className="mx-4 mb-3 border-t-0 rounded-t-none shadow-sm bg-white">
            <CardContent className="p-4 space-y-4 bg-white">
              {/* Quick Filters Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Select
                  value={filters.propertyType}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, propertyType: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="House">Independent House</SelectItem>
                    <SelectItem value="Plot">Plot/Land</SelectItem>
                    <SelectItem value="Office">Office Space</SelectItem>
                    <SelectItem value="Shop">Shop/Showroom</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.bhk} onValueChange={(value) => setFilters((prev) => ({ ...prev, bhk: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                    <SelectItem value="5">5+ BHK</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.listingType}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, listingType: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Listing Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                    <SelectItem value="colisting">Co-Listing</SelectItem>
                    <SelectItem value="shared">Open Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range: {formatPrice(priceRange[0], selectedTab)} - {formatPrice(priceRange[1], selectedTab)}
                </label>
                <Slider value={priceRange} onValueChange={setPriceRange} max={10000000} min={0} step={50000} className="w-full" />
              </div>

              {/* Location Filter */}
              <div>
                <Input
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={clearFilters} size="sm" className="text-sm">
                    <X size={14} className="mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Property List */}
      <div className="flex-1 px-4 pt-4 pb-6">
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-neutral-900" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Properties Found</h3>
            <p className="text-neutral-500 mb-4">
              {selectedTab === "all" ? "Be the first to add a property to the network" : `No ${selectedTab === "sale" ? "sale" : "rental"} properties available`}
            </p>
            <Button onClick={() => router.push("/add-property")} type="button">
              Add Property
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProperties.map((property: any) => (
              <CompactPropertyCard key={property.id} property={property} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-20 touch-target"
        onClick={() => router.push("/add-property")}
        type="button"
        aria-label="Add property"
      >
        <Plus size={24} />
      </button>

      <MobileNavigation />
    </div>
  );
}
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
import { Plus, Search, Filter, X, Sparkles, Home, MessageCircle, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CompactPropertyCard, { FeedProperty } from "@/components/ui/compact-property-card";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useAuth } from "@/hooks/use-auth";
import { safeFetch } from "@/lib/safeFetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PropertyDetailsPanel from "@/components/ui/property-details-panel";
import { parsePriceToNumber } from "@/utils/formatters";

export default function PropertyFeedPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<string>("sale");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [filters, setFilters] = useState({
    propertyType: "",
    bhk: "",
    location: "",
    listingType: "",
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000000]); // 1 Cr max
  const [selectedProperty, setSelectedProperty] = useState<FeedProperty | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { user } = useAuth();

  const { data: properties = [], isLoading } = useQuery<FeedProperty[]>({
    queryKey: ["/api/properties"],
    queryFn: () => safeFetch<FeedProperty[]>("/api/properties", []),
  });

  // ✅ Filter logic with price parsing
  const filteredProperties = Array.isArray(properties)
    ? properties.filter((property) => {
        const matchesSearch =
          !searchQuery ||
          property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = selectedTab === "all" || property.transactionType === selectedTab;
        const matchesPropertyType = !filters.propertyType || filters.propertyType === 'all' || property.propertyType === filters.propertyType;
        const matchesBHK = !filters.bhk || filters.bhk === 'all' || property.bhk?.toString() === filters.bhk;
        const matchesLocation = !filters.location || property.location?.toLowerCase().includes(filters.location.toLowerCase());
        const matchesListingType = !filters.listingType || filters.listingType === 'all' || property.listingType === filters.listingType;

        const propertyPrice = parsePriceToNumber(property.price);
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
    setPriceRange([0, 100000000]);
    setSearchQuery("");
    setShowFilters(false);
  };

  const activeFiltersCount =
    Object.values(filters).filter(Boolean).length +
    (priceRange[0] > 0 || priceRange[1] < 100000000 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const handleOpenDetails = (property: FeedProperty) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedProperty(null);
  };

  const handleMessageBroker = (ownerId?: string | number | null, propertyId?: string | null) => {
    if (!ownerId) {
      return;
    }
    const normalizedOwnerId = String(ownerId);
    router.push(`/messages?participantId=${normalizedOwnerId}${propertyId ? `&propertyId=${propertyId}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="text-primary hover:opacity-80"
                type="button"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Properties</h1>
                <p className="text-sm text-neutral-500">{filteredProperties.length} listings available</p>
              </div>
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
              <button
                className="p-2 text-neutral-400"
                onClick={() => router.push("/profile")}
                type="button"
                aria-label="Profile"
              >
                <Avatar className="h-10 w-10">
                  {user?.profilePhoto ? (
                    <AvatarImage src={user.profilePhoto} alt={user.name ?? "Profile"} />
                  ) : (
                    <AvatarFallback className="text-xs font-semibold">
                      {user?.name?.charAt(0) ?? user?.phone?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
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
                activeFiltersCount > 0
                  ? "border-primary text-primary bg-primary/5"
                  : "bg-gray-50"
              }`}
            >
              <Filter size={16} />
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTab("sale")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                selectedTab === "sale"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              type="button"
            >
              For Sale
            </button>
            <button
              onClick={() => setSelectedTab("rent")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                selectedTab === "rent"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              type="button"
            >
              For Rent
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mx-4 mb-3 border-t-0 rounded-t-none shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={filters.propertyType}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, propertyType: value }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="House">Independent House</SelectItem>
                    <SelectItem value="Plot">Plot/Land</SelectItem>
                    <SelectItem value="Office">Office Space</SelectItem>
                    <SelectItem value="Shop">Shop/Showroom</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.bhk}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, bhk: value }))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Bedrooms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Bedrooms</SelectItem>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                    <SelectItem value="5">5+ BHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range with Input Fields */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100000000}
                    min={0}
                    step={100000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>₹0</span>
                    <span>₹10 Cr</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Input
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="sm"
                  className="text-sm flex-1 border border-gray-300 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500"
                >
                  <X size={14} className="mr-1" />
                  Reset Filters
                </Button>
                <Button
                  onClick={() => setShowFilters(false)}
                  size="sm"
                  className="text-sm flex-1 border border-gray-300 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500"
                >
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Property List */}
      <div className="flex-1 px-4 pt-4 pb-6">
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No Properties Found
            </h3>
            <p className="text-neutral-500 mb-4">
              {selectedTab === "all"
                ? "Be the first to add a property"
                : `No ${
                    selectedTab === "sale" ? "sale" : "rental"
                  } properties available`}
            </p>
            <Button onClick={() => router.push("/add-property")} type="button">
              Add Property
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProperties.map((property: FeedProperty) => (
              <CompactPropertyCard
                key={property.id}
                property={property}
                onViewDetails={handleOpenDetails}
              />
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

      <Dialog open={isDetailModalOpen} onOpenChange={(open) => (open ? setIsDetailModalOpen(true) : handleCloseDetails())}>
        <DialogContent className="max-w-xl lg:max-w-2xl rounded-[28px] border border-neutral-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Home size={20} />
              Property Details
            </DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <PropertyDetailsPanel
              property={selectedProperty}
              onCall={() => {
                const phone = selectedProperty.broker?.phone ?? selectedProperty.owner?.phone;
                if (phone) {
                  window.open(`tel:${phone}`, "_self");
                }
              }}
              actions={
                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => {
                      handleMessageBroker(selectedProperty.ownerId, selectedProperty.id);
                      handleCloseDetails();
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>Message Broker</span>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      router.push(`/property/${selectedProperty.id}`);
                      handleCloseDetails();
                    }}
                  >
                    View Full Listing
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition-all duration-200" 
                    onClick={handleCloseDetails}
                  >
                    Close
                  </Button>
                </div>
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}

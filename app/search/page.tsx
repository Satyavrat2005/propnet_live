// app/property-search/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, X, Building, ArrowLeft } from "lucide-react";
import EnhancedPropertyCard from "@/components/ui/enhanced-property-card";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/utils/formatters";
import { safeFetch } from "@/lib/safeFetch";

export default function PropertySearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    transactionType: "",
    propertyType: "",
    bhk: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    sizeUnit: "",
    listingType: "",
    minSize: "",
    maxSize: "",
  });
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [showAdvancedFilters] = useState(false); // kept for parity if you toggle later

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => safeFetch("/api/properties", []),
  });

  const filteredProperties = Array.isArray(properties)
    ? properties.filter((property: any) => {
        const title = String(property.title || "").toLowerCase();
        const location = String(property.location || "").toLowerCase();
        const description = String(property.description || "").toLowerCase();
        const q = searchQuery.trim().toLowerCase();

        const matchesSearch =
          !q ||
          title.includes(q) ||
          location.includes(q) ||
          description.includes(q);

        const matchesTransactionType =
          !selectedFilters.transactionType ||
          property.transactionType === selectedFilters.transactionType;

        const matchesPropertyType =
          !selectedFilters.propertyType ||
          property.propertyType === selectedFilters.propertyType;

        const matchesBHK =
          !selectedFilters.bhk ||
          String(property.bhk) === selectedFilters.bhk;

        const matchesLocation =
          !selectedFilters.location ||
          String(property.location || "").toLowerCase().includes(selectedFilters.location.toLowerCase());

        const rawPrice = String(property.price || "");
        const propertyPrice = parseFloat(rawPrice.replace(/[^\d.]/g, "")) || 0;
        const matchesPriceRange = propertyPrice >= priceRange[0] && propertyPrice <= priceRange[1];

        const matchesListingType =
          !selectedFilters.listingType ||
          property.listingType === selectedFilters.listingType;

        const propertySize = parseFloat(String(property.size || "")) || 0;
        const matchesMinSize =
          !selectedFilters.minSize || propertySize >= parseFloat(selectedFilters.minSize || "0");
        const matchesMaxSize =
          !selectedFilters.maxSize || propertySize <= parseFloat(selectedFilters.maxSize || "0");

        return (
          matchesSearch &&
          matchesTransactionType &&
          matchesPropertyType &&
          matchesBHK &&
          matchesLocation &&
          matchesPriceRange &&
          matchesListingType &&
          matchesMinSize &&
          matchesMaxSize
        );
      })
    : [];

  const clearFilters = () => {
    setSelectedFilters({
      transactionType: "",
      propertyType: "",
      bhk: "",
      minPrice: "",
      maxPrice: "",
      location: "",
      sizeUnit: "",
      listingType: "",
      minSize: "",
      maxSize: "",
    });
    setPriceRange([0, 10000000]);
    setSearchQuery("");
  };

  const activeFiltersCount =
    Object.values(selectedFilters).filter(Boolean).length +
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => router.back()} 
            className="text-primary hover:opacity-80"
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Find Your Perfect Property</h1>
        </div>
        <p className="text-gray-600 ml-12">Search through verified listings from trusted agents</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Search by title, location, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg"
        />
      </div>

      {/* Unified Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} size="sm" className="flex items-center gap-2">
                <X size={16} />
                Clear All ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transaction Type</label>
              <Select
                value={selectedFilters.transactionType}
                onValueChange={(value) => setSelectedFilters((prev) => ({ ...prev, transactionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Buy/Rent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Property Type</label>
              <Select
                value={selectedFilters.propertyType}
                onValueChange={(value) => setSelectedFilters((prev) => ({ ...prev, propertyType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Shop">Shop</SelectItem>
                  <SelectItem value="Plot">Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">BHK</label>
              <Select
                value={selectedFilters.bhk}
                onValueChange={(value) => setSelectedFilters((prev) => ({ ...prev, bhk: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any BHK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 BHK</SelectItem>
                  <SelectItem value="2">2 BHK</SelectItem>
                  <SelectItem value="3">3 BHK</SelectItem>
                  <SelectItem value="4">4 BHK</SelectItem>
                  <SelectItem value="5">5+ BHK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Listing Type</label>
              <Select
                value={selectedFilters.listingType}
                onValueChange={(value) => setSelectedFilters((prev) => ({ ...prev, listingType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                  <SelectItem value="colisting">Co-Listing</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Price Range:{" "}
              {formatPrice(priceRange[0], selectedFilters.transactionType || "sale")} -{" "}
              {formatPrice(priceRange[1], selectedFilters.transactionType || "sale")}
            </label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={10000000}
              min={0}
              step={50000}
              className="w-full"
            />
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                placeholder="Enter location"
                value={selectedFilters.location}
                onChange={(e) => setSelectedFilters((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Area Unit</label>
              <Select
                value={selectedFilters.sizeUnit}
                onValueChange={(value) => setSelectedFilters((prev) => ({ ...prev, sizeUnit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sq.ft">Square Feet</SelectItem>
                  <SelectItem value="sq.m">Square Meters</SelectItem>
                  <SelectItem value="sq.yd">Square Yards</SelectItem>
                  <SelectItem value="acre">Acres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Area Size</label>
              <Input
                type="number"
                placeholder="Min size"
                value={selectedFilters.minSize}
                onChange={(e) => setSelectedFilters((prev) => ({ ...prev, minSize: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Area Size</label>
              <Input
                type="number"
                placeholder="Max size"
                value={selectedFilters.maxSize}
                onChange={(e) => setSelectedFilters((prev) => ({ ...prev, maxSize: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{filteredProperties.length} Properties Found</h2>

        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Searching for:</span>
            <Badge variant="outline">{searchQuery}</Badge>
          </div>
        )}
      </div>

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or clearing some filters</p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property: any) => (
            <EnhancedPropertyCard key={property.id} property={property} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}

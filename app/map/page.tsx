// app/map/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Navigation,
  Layers,
  Phone,
  Eye,
  Filter,
  Home,
} from "lucide-react";
import PropertyDetailsPanel from "@/components/ui/property-details-panel";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { formatPrice, getListingTypeBadgeColor, getListingTypeLabel } from "@/utils/formatters";
import { safeFetch } from "@/lib/safeFetch";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache freshness
const CACHE_GC_MS = 30 * 60 * 1000; // keep cached data in memory for 30 minutes
const PROPERTY_CACHE_KEY = "propnet_map_properties";
const PRIMARY_CACHE_KEY = "propnet_map_primary";
const GEOCODE_CACHE_KEY = "propnet_map_geocode";

type SessionCacheEntry<T> = {
  data: T;
  timestamp: number;
};

function readSessionCache<T>(key: string): SessionCacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.timestamp !== "number" || !("data" in parsed)) return null;
    return parsed as SessionCacheEntry<T>;
  } catch (error) {
    console.warn(`[map] Failed to read cache for ${key}`, error);
    return null;
  }
}

function writeSessionCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.warn(`[map] Failed to write cache for ${key}`, error);
  }
}

function getRemainingStaleTime(entry: SessionCacheEntry<unknown> | null): number {
  if (!entry) return 0;
  const age = Date.now() - entry.timestamp;
  if (age >= CACHE_TTL_MS) return 0;
  return CACHE_TTL_MS - age;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    openListing?: (propertyId: string | number) => void;
  }
}

interface Property {
  id: string;
  title: string;
  propertyType: string;
  transactionType: string;
  price: string | number | null;
  location: string;
  fullAddress?: string | null;
  size?: number | string | null;
  sizeUnit?: string | null;
  bhk?: number;
  buildingSociety?: string | null;
  owner: {
    name: string | null;
    phone: string | null;
  };
  lat?: number | null;
  lng?: number | null;
  createdAt?: string;
  description?: string | null;
  promoter?: string | null;
  details?: string | null;
  blocks?: string | null;
  landArea?: number | null;
  totalAreaOfLand?: number | null;
  totalCarpetArea?: number | string | null;
  listingSource?: "property" | "primary";
}

export default function MapPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentMarkers, setCurrentMarkers] = useState<any[]>([]);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);
  const [propertyCoordinates, setPropertyCoordinates] = useState<{ [key: string]: { lat: number; lng: number } }>({});
  const [markersMap, setMarkersMap] = useState<{ [key: string]: { marker: any; infoWindow: any } }>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsProperty, setDetailsProperty] = useState<Property | null>(null);
  const PAGE_SIZE = 6;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInitializedRef = useRef(false);
  const geocodeCacheRef = useRef<Record<string, { lat: number; lng: number }>>({});

  const propertyCacheEntry = useMemo(() => readSessionCache<Property[]>(PROPERTY_CACHE_KEY), []);
  const primaryCacheEntry = useMemo(() => readSessionCache<Property[]>(PRIMARY_CACHE_KEY), []);

  const propertyQuery = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: () => safeFetch("/api/properties", []),
    initialData: propertyCacheEntry?.data,
    staleTime: getRemainingStaleTime(propertyCacheEntry),
    gcTime: CACHE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const primaryQuery = useQuery<Property[]>({
    queryKey: ["/api/primarly-listing"],
    queryFn: async () => {
      const data = await safeFetch("/api/primarly-listing", []);
      console.log("[Primary Listings] Total fetched:", Array.isArray(data) ? data.length : 0);
      return data;
    },
    initialData: primaryCacheEntry?.data,
    staleTime: getRemainingStaleTime(primaryCacheEntry),
    gcTime: CACHE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const propertyData = propertyQuery.data ?? [];
  const primaryListings = primaryQuery.data ?? [];
  const isPropertyLoading = propertyQuery.isLoading && !propertyCacheEntry?.data;
  const isPrimaryLoading = primaryQuery.isLoading && !primaryCacheEntry?.data;

  useEffect(() => {
    if (propertyQuery.data && propertyQuery.isSuccess) {
      writeSessionCache(PROPERTY_CACHE_KEY, propertyQuery.data);
    }
  }, [propertyQuery.data, propertyQuery.isSuccess]);

  useEffect(() => {
    if (primaryQuery.data && primaryQuery.isSuccess) {
      writeSessionCache(PRIMARY_CACHE_KEY, primaryQuery.data);
    }
  }, [primaryQuery.data, primaryQuery.isSuccess]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = window.sessionStorage.getItem(GEOCODE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          geocodeCacheRef.current = parsed;
        }
      }
    } catch (error) {
      console.warn("[map] Failed to hydrate geocode cache", error);
    }
  }, []);

  const persistGeocodeCache = () => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(geocodeCacheRef.current));
    } catch (error) {
      console.warn("[map] Failed to persist geocode cache", error);
    }
  };

  const allListings = useMemo(() => {
    const normalizedPrimary = (Array.isArray(primaryListings) ? primaryListings : []).map((listing: Property) => ({
      ...listing,
      transactionType: (listing.transactionType || "primary").toLowerCase(),
      listingSource: "primary" as const,
    }));

    const normalizedProperties = (Array.isArray(propertyData) ? propertyData : []).map((listing: Property) => ({
      ...listing,
      transactionType: (listing.transactionType || "").toLowerCase(),
      listingSource: "property" as const,
    }));

    return [...normalizedProperties, ...normalizedPrimary];
  }, [propertyData, primaryListings]);

  const isLoading = isPropertyLoading || isPrimaryLoading;

  // Get user's current location
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          // Keep same behaviour as original
          console.log("Location access denied:", error);
        }
      );
    }
  }, []);

  // Load Google Maps script and initialize
  useEffect(() => {
    // expose global function for listing opening from external scripts
    window.openListing = (propertyId: string | number) => {
      const normalizedId = String(propertyId);
      const property = visibleProperties.find((p) => p.id === normalizedId);
      if (property) {
        setSelectedProperty(property);
        const listElement = document.querySelector(".property-list-section");
        if (listElement) {
          listElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    };

    let scriptEl: HTMLScriptElement | null = null;
    let didCancel = false;
    const SCRIPT_DATA_ATTR = "data-propnet-google-maps";
    const getExistingScript = () =>
      document.querySelector<HTMLScriptElement>(
        `script[${SCRIPT_DATA_ATTR}="true"], script[src*="maps.googleapis.com/maps/api/js"]`
      );

    const initializeMap = () => {
      if (!mapRef.current || didCancel || mapInitializedRef.current) return;
      // Default to Ahmedabad coordinates as original
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 23.0225, lng: 72.5714 },
        zoom: 11,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setMap(mapInstance);
      setIsMapLoaded(true);
      mapInitializedRef.current = true;
    };

    const handleScriptLoad = () => {
      if (didCancel) return;
      const existingScript = getExistingScript();
      existingScript?.removeEventListener("load", handleScriptLoad);
      if (window.google?.maps) {
        initializeMap();
      }
    };

    const loadGoogleMaps = async () => {
      const existingScript = getExistingScript();
      if (existingScript) {
        existingScript.setAttribute(SCRIPT_DATA_ATTR, "true");
        window.initMap = initializeMap;
        if (window.google?.maps) {
          initializeMap();
        } else {
          existingScript.addEventListener("load", handleScriptLoad);
        }
        return;
      }

      if ((window as any).google && (window as any).google.maps) {
        initializeMap();
        return;
      }

      try {
        const res = await fetch("/api/config/google-maps-key");
        const json = await res.json();
        const key = json?.key;
        if (!key) {
          console.error("Google Maps key missing from /api/config/google-maps-key");
          return;
        }

        window.initMap = initializeMap;
        scriptEl = document.createElement("script");
        scriptEl.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initMap`;
        scriptEl.async = true;
        scriptEl.defer = true;
        scriptEl.setAttribute(SCRIPT_DATA_ATTR, "true");
        scriptEl.addEventListener("load", handleScriptLoad);
        document.head.appendChild(scriptEl);
      } catch (err) {
        console.error("Failed to load Google Maps API key:", err);
      }
    };

    loadGoogleMaps();

    return () => {
      didCancel = true;
      // cleanup global function
      try {
        (window as any).initMap = undefined;
      } catch {}
      const existingScript = getExistingScript();
      if (existingScript) {
        existingScript.removeEventListener("load", handleScriptLoad);
      }
      if (scriptEl) {
        scriptEl.removeEventListener("load", handleScriptLoad);
      }
    };
    // we intentionally do not add visibleProperties/map etc here — this effect only concerns loading the Maps script
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Add markers whenever map, isMapLoaded, properties or filterType changes
  useEffect(() => {
    if (map && isMapLoaded && Array.isArray(allListings)) {
      addMarkersToMap().catch((e) => console.error("addMarkersToMap error:", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isMapLoaded, allListings, filterType, userLocation]);

  // cleanup markers on unmount
  useEffect(() => {
    return () => {
      currentMarkers.forEach((m) => {
        try {
          m.setMap(null);
        } catch {}
      });
      setCurrentMarkers([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(visibleProperties.length / PAGE_SIZE) || 1);
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [visibleProperties.length]);

  const resolveTransactionMeta = (type?: string) => {
    const normalized = (type || "").toLowerCase();
    switch (normalized) {
      case "rent":
        return { bg: "#dcfce7", color: "#166534", label: "Rent" };
      case "primary":
        return { bg: "#fef3c7", color: "#92400e", label: "Primary" };
      case "sale":
        return { bg: "#dbeafe", color: "#1d4ed8", label: "Sale" };
      default:
        return { bg: "#e5e7eb", color: "#374151", label: getListingTypeLabel(type) };
    }
  };

  const resolvePriceLabel = (property: Property) => {
    const normalizedType = (property.transactionType || "").toLowerCase();
    if (normalizedType === "primary") {
      if (property.price && typeof property.price === "string" && property.price.trim().length > 0) {
        return property.price;
      }
      if (property.details) return property.details;
      return "Primary listing";
    }

    const numericPrice = typeof property.price === "number"
      ? property.price
      : Number(String(property.price || "").replace(/[^0-9.]/g, ""));

    if (!numericPrice) {
      return "Price on request";
    }

    return formatPrice(numericPrice, property.transactionType);
  };

  const addMarkersToMap = async () => {
    if (!map || typeof window === "undefined" || !window.google) return;

    // Clear existing markers + their listeners & infoWindows
    currentMarkers.forEach((marker) => {
      try {
        marker.setMap(null);
      } catch {}
    });
    Object.values(markersMap).forEach((m) => {
      try {
        if (m.infoWindow && typeof m.infoWindow.close === "function") m.infoWindow.close();
      } catch {}
    });

    setCurrentMarkers([]);
    setMarkersMap({});

    const filteredProps: Property[] = Array.isArray(allListings)
      ? allListings.filter((property: Property) => {
          if (filterType === "all") return true;
          return (property.transactionType || "").toLowerCase() === filterType;
        })
      : [];

    setVisibleProperties(filteredProps);

  const newMarkers: any[] = [];
  const newMarkersMap: { [key: string]: any } = {};

    // helper to attach detail button click safely
  const attachDetailsBtnListener = (propertyId: string, property: Property, infoWindow: any) => {
      // when info window DOM is attached, add listener to details button
      setTimeout(() => {
        const detailsBtn = document.getElementById(`details-btn-${propertyId}`);
        if (detailsBtn) {
          // remove previous listener to avoid duplicates
          const cloned = detailsBtn.cloneNode(true) as HTMLElement;
          detailsBtn.parentNode?.replaceChild(cloned, detailsBtn);
          cloned.addEventListener("click", (ev) => {
            ev.stopPropagation();
            try {
              infoWindow.close();
            } catch {}
            setDetailsProperty(property);
            setShowDetailsModal(true);
          });
        }
      }, 150);
    };

    for (const property of filteredProps) {
      try {
        const coords = await geocodeProperty(property);

        // Properly encode SVG for Google Maps marker icons
        function encodeSvg(svg: string) {
          return (
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(svg)
              .replace(/'/g, '%27')
              .replace(/"/g, '%22')
          );
        }

        const saleSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#00C853" stroke="white" stroke-width="2"/><path d="M10 18V14.5L16 10L22 14.5V18C22 18.5523 21.5523 19 21 19H11C10.4477 19 10 18.5523 10 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="19" width="6" height="3" rx="1" fill="white"/></svg>`;
        const rentSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#D50000" stroke="white" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="18" font-family="Arial" fill="white" font-weight="bold">₹</text></svg>`;
        const primarySvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#F97316" stroke="white" stroke-width="2"/><path d="M16 8L18.4721 13.009L24 13.8197L19.8 17.8619L20.9443 23.1803L16 20.4L11.0557 23.1803L12.2 17.8619L8 13.8197L13.5279 13.009L16 8Z" fill="white"/></svg>`;

        const saleIcon = {
          url: encodeSvg(saleSvg),
          scaledSize: new window.google.maps.Size(32, 32),
        };
        const rentIcon = {
          url: encodeSvg(rentSvg),
          scaledSize: new window.google.maps.Size(32, 32),
        };
        const primaryIcon = {
          url: encodeSvg(primarySvg),
          scaledSize: new window.google.maps.Size(36, 36),
        };

        const normalizedType = (property.transactionType || "").toLowerCase();
        const markerIcon =
          normalizedType === "rent" ? rentIcon : normalizedType === "primary" ? primaryIcon : saleIcon;

        const marker = new window.google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map,
          title: property.title,
          icon: markerIcon,
        });

        const buildingInfo = property.buildingSociety
          ? `<div style=\"color: #888; font-size: 12px; margin-bottom: 4px;\">${property.buildingSociety}</div>`
          : "";
        const priceLabel = resolvePriceLabel(property);
        const transactionMeta = resolveTransactionMeta(property.transactionType);
        const descriptionBlock = property.description
          ? `<div style="color: #4b5563; font-size: 12px; margin-bottom: 6px;">${property.description}</div>`
          : "";

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div id="info-${property.id}" style="min-width: 200px; padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${property.title}</div>
              ${buildingInfo}
              ${descriptionBlock}
              <div style="color: #666; margin-bottom: 8px; font-size: 14px;">${property.location}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: bold; color: #2563eb;">${priceLabel}</span>
                <span style="background: ${transactionMeta.bg}; color: ${transactionMeta.color}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                  ${transactionMeta.label}
                </span>
              </div>
              <button id="details-btn-${property.id}" style="width: 100%; background: #3b82f6; color: white; border: none; padding: 8px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-top: 8px;">
                View Full Details
              </button>
            </div>
          `,
        });

        const clickHandler = () => {
          setSelectedProperty(property);
          infoWindow.open(map, marker);
          attachDetailsBtnListener(property.id, property, infoWindow);
        };

        marker.addListener("click", clickHandler);

        newMarkers.push(marker);
        newMarkersMap[property.id] = { marker, infoWindow, clickHandler };
      } catch (error) {
        console.error("Failed to add marker for property:", property.id, error);
      }
    }

    // user location marker
    if (userLocation) {
      try {
        const userMarker = new window.google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          },
          label: { text: "📍", fontSize: "16px" },
        });
        newMarkers.push(userMarker);
      } catch (err) {
        console.warn("Failed to add user location marker", err);
      }
    }

    setCurrentMarkers(newMarkers);
    setMarkersMap(newMarkersMap);
  };

  // center map on a property and open its infoWindow if available
  const centerOnProperty = async (property: Property) => {
    if (!map || typeof window === "undefined" || !window.google) return;
    try {
      const coords = await geocodeProperty(property);
      map.setCenter({ lat: coords.lat, lng: coords.lng });
      map.setZoom(16);

      const markerData = markersMap[property.id];
      if (markerData?.infoWindow && markerData?.marker) {
        try {
          markerData.infoWindow.open(map, markerData.marker);
        } catch {}
        setSelectedProperty(property);
      }
    } catch (error) {
      console.error("Failed to center on property:", property.id, error);
    }
  };

  // geocode property via your API or fallback to distributed coordinates
  const geocodeProperty = async (property: Property) => {
    const cacheKey = property.id.toString();
    const geocodeAddressKey = property.fullAddress || property.buildingSociety || property.location || cacheKey;

    if (typeof property.lat === "number" && typeof property.lng === "number") {
      return { lat: property.lat, lng: property.lng };
    }

    if (propertyCoordinates[cacheKey]) {
      return propertyCoordinates[cacheKey];
    }

    if (geocodeCacheRef.current[geocodeAddressKey]) {
      const coords = geocodeCacheRef.current[geocodeAddressKey];
      setPropertyCoordinates((prev) => ({
        ...prev,
        [cacheKey]: coords,
      }));
      return coords;
    }

    try {
      const addressParts = [property.fullAddress, property.buildingSociety, property.location, "Gujarat, India"].filter(Boolean);
      const address = addressParts.join(", ");
      const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data?.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
        const coords = { lat: data.latitude, lng: data.longitude };
        setPropertyCoordinates((prev) => ({
          ...prev,
          [cacheKey]: coords,
        }));
        geocodeCacheRef.current[geocodeAddressKey] = coords;
        persistGeocodeCache();
        return coords;
      }
    } catch (error) {
      console.error("Geocoding failed for property:", property.id, error);
    }

    // fallback distributed placement around Ahmedabad
    const ahmedabadLat = 23.0225;
    const ahmedabadLng = 72.5714;
    const numericKey = Array.from(cacheKey).reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
    const angle = (numericKey * 2 * Math.PI) / 10;
    const radius = 0.02 + (numericKey % 3) * 0.01;

    const fallback = {
      lat: ahmedabadLat + Math.cos(angle) * radius,
      lng: ahmedabadLng + Math.sin(angle) * radius,
    };
    setPropertyCoordinates((prev) => ({ ...prev, [cacheKey]: fallback }));
    return fallback;
  };

  const propertyTypes = ["all", "sale", "rent", "primary"];
  const getFilterLabel = (type: string) => (type === "all" ? "All" : getListingTypeLabel(type));
  const totalPages = Math.max(1, Math.ceil(visibleProperties.length / PAGE_SIZE) || 1);
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleProperties.slice(start, start + PAGE_SIZE);
  }, [visibleProperties, currentPage]);
  const pageStart = visibleProperties.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, visibleProperties.length);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Property Map</h1>
            <p className="text-sm text-neutral-600">{visibleProperties.length} properties found</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (userLocation && map) {
                map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                map.setZoom(15);
              }
            }}
          >
            <Navigation size={16} className="mr-1" />
            My Location
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-neutral-600" />
          <div className="flex space-x-2">
            {propertyTypes.map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
              >
                {getFilterLabel(type)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Google Maps */}
      <div className="relative h-[60vh] bg-neutral-100">
        <div ref={mapRef} className="h-full w-full" style={{ minHeight: "400px" }} />

        {!isMapLoaded && (
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <MapPin size={48} className="mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">Loading Interactive Map...</p>
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mt-2" />
            </div>
          </div>
        )}

        {/* Map Controls */}
  <div className="absolute top-4 right-4 flex flex-col space-y-2 z-1000">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md"
            onClick={() => {
              if (userLocation && map) {
                map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                map.setZoom(15);
              }
            }}
          >
            <Navigation size={16} />
          </Button>
          <Button variant="outline" size="sm" className="bg-white shadow-md">
            <Layers size={16} />
          </Button>
        </div>
      </div>

      {/* Property List */}
      <div className="px-6 py-4 property-list-section">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Properties in View ({visibleProperties.length})
        </h2>
        <div className="space-y-3">
          {paginatedProperties.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-neutral-500">
                No properties match the current filters.
              </CardContent>
            </Card>
          )}
          {paginatedProperties.map((property: Property) => {
            const priceDisplay = resolvePriceLabel(property);
            const badgeLabel = getListingTypeLabel(property.transactionType);

            return (
              <Card
                key={property.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedProperty?.id === property.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => centerOnProperty(property)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-neutral-900 text-sm">{property.title}</h3>
                        <Badge className={`text-xs ${getListingTypeBadgeColor(property.transactionType)}`}>
                          {badgeLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600 mb-1">{property.location}</p>
                      {property.description && (
                        <p className="text-xs text-neutral-500 mb-2">{property.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{priceDisplay}</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (property.owner.phone) {
                                window.open(`tel:${property.owner.phone}`, "_self");
                              }
                            }}
                            disabled={!property.owner.phone}
                          >
                            <Phone size={12} className="mr-1" />
                            Contact
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsProperty(property);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye size={12} className="mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {visibleProperties.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs text-neutral-600">
            <span>
              Showing {pageStart}-{pageEnd} of {visibleProperties.length}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20" />
      <MobileNavigation />

      {/* Property Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-xl lg:max-w-2xl rounded-[28px] border border-neutral-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Home size={20} />
              Property Details
            </DialogTitle>
          </DialogHeader>

          {detailsProperty ? (
            <PropertyDetailsPanel
              property={detailsProperty}
              onCall={() => {
                if (detailsProperty.owner?.phone) {
                  window.open(`tel:${detailsProperty.owner.phone}`, "_self");
                }
              }}
              actions={
                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
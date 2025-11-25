/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Navigation, Layers, Phone, Eye, Filter, Home, Search, ArrowLeft } from "lucide-react";
import PropertyDetailsPanel from "@/components/ui/property-details-panel";
import { AppLayout } from "@/components/layout/app-layout";
import { formatPrice, getListingTypeBadgeColor, getListingTypeLabel } from "@/utils/formatters";
import { Input } from "@/components/ui/input";
import type { MapProperty } from "@/lib/types/map";

const GEOCODE_CACHE_KEY = "propnet_map_geocode";
const PAGE_SIZE = 6;

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    openListing?: (propertyId: string | number) => void;
  }
}

interface MapClientProps {
  initialProperties: MapProperty[];
  initialPrimaryListings: MapProperty[];
}

type Property = MapProperty;

type MarkerEntry = {
  marker: any;
  infoWindow: any;
  clickHandler: () => void;
};

type SecondaryFilterType = "sale" | "rent";
type SecondaryFilterState = Record<SecondaryFilterType, boolean>;

const MobileNavigation = () => null;

const normalizeAddressSegments = (parts: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .forEach((part) => {
      const lowered = part!.toLowerCase();
      if (seen.has(lowered)) return;
      seen.add(lowered);
      result.push(part!);
    });
  return result;
};

const GOOGLE_MAPS_SCRIPT_ID = "propnet-google-maps-script";
const GOOGLE_MAPS_DATA_ATTR = "data-propnet-google-maps";
let googleMapsScriptPromise: Promise<void> | null = null;

const ensureGoogleMapsApiLoaded = async () => {
  if (typeof window === "undefined") return;
  if (window.google?.maps) return;
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  const loadScript = async () => {
    const response = await fetch("/api/config/google-maps-key");
    if (!response.ok) {
      throw new Error("Google Maps API key missing from /api/config/google-maps-key");
    }
    const json = await response.json();
    const key = json?.key;
    if (!key) {
      throw new Error("Google Maps API key missing from /api/config/google-maps-key");
    }

    return new Promise<void>((resolve, reject) => {
      let targetScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

      const handleLoad = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Failed to load Google Maps JavaScript API"));
      };

      function cleanup() {
        if (!targetScript) return;
        targetScript.removeEventListener("load", handleLoad);
        targetScript.removeEventListener("error", handleError);
      }

      const attachListeners = (element: HTMLScriptElement) => {
        targetScript = element;
        element.addEventListener("load", handleLoad);
        element.addEventListener("error", handleError);
      };

      if (targetScript) {
        if (window.google?.maps) {
          cleanup();
          resolve();
          return;
        }
        attachListeners(targetScript);
        return;
      }

      const scriptEl = document.createElement("script");
      scriptEl.id = GOOGLE_MAPS_SCRIPT_ID;
      scriptEl.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.setAttribute(GOOGLE_MAPS_DATA_ATTR, "true");
      attachListeners(scriptEl);
      document.head.appendChild(scriptEl);
    });
  };

  const promise = loadScript();
  googleMapsScriptPromise = promise;
  promise.catch(() => {
    googleMapsScriptPromise = null;
  });
  return promise;
};

export default function MapClient({ initialProperties, initialPrimaryListings }: MapClientProps) {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsProperty, setDetailsProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [secondaryFilters, setSecondaryFilters] = useState<SecondaryFilterState>({ sale: true, rent: true });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInitializedRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  const geocodeCacheRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const propertyCoordinatesRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const markersRef = useRef<any[]>([]);
  const markersMapRef = useRef<Record<string, MarkerEntry>>({});
  const activeInfoWindowRef = useRef<any>(null);
  const highlightCircleRef = useRef<any>(null);
  const markerRenderVersionRef = useRef(0);

  const toggleSecondaryFilter = useCallback((type: SecondaryFilterType) => {
    setSecondaryFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);


  const normalizedPrimary = useMemo(
    () =>
      (initialPrimaryListings || []).map((listing) => ({
        ...listing,
        transactionType: (listing.transactionType || "primary").toLowerCase(),
        listingSource: "primary" as const,
      })),
    [initialPrimaryListings]
  );

  const normalizedProperties = useMemo(
    () =>
      (initialProperties || []).map((listing) => ({
        ...listing,
        transactionType: (listing.transactionType || "").toLowerCase(),
        listingSource: "property" as const,
      })),
    [initialProperties]
  );

  const allListings = useMemo(() => [...normalizedProperties, ...normalizedPrimary], [normalizedProperties, normalizedPrimary]);
  const secondaryFilterOptions: Array<{ label: string; type: SecondaryFilterType }> = useMemo(
    () => [
      { label: "For Sale", type: "sale" },
      { label: "For Rent", type: "rent" },
    ],
    []
  );

  const filteredListings = useMemo(() => {
    if (filterType === "primary") {
      return allListings.filter(
        (property) => property.listingSource === "primary" || (property.transactionType || "").toLowerCase() === "primary"
      );
    }

    if (filterType === "secondary") {
      const secondaryPool = allListings.filter((property) => property.listingSource !== "primary");
      const activeTypes = Object.entries(secondaryFilters)
        .filter(([, active]) => active)
        .map(([type]) => type);
      if (activeTypes.length === 0) {
        return [];
      }
      return secondaryPool.filter((property) => activeTypes.includes((property.transactionType || "").toLowerCase()));
    }

    return allListings;
  }, [allListings, filterType, secondaryFilters]);

  const searchFilteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return filteredListings;
    return filteredListings.filter((property) => {
      const title = property.title?.toLowerCase() || "";
      const location = property.location?.toLowerCase() || "";
      const building = property.buildingSociety?.toLowerCase() || "";
      return title.includes(query) || location.includes(query) || building.includes(query);
    });
  }, [filteredListings, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(searchFilteredListings.length / PAGE_SIZE) || 1);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedProperties = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return searchFilteredListings.slice(start, start + PAGE_SIZE);
  }, [searchFilteredListings, safeCurrentPage]);
  const pageStart = searchFilteredListings.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safeCurrentPage * PAGE_SIZE, searchFilteredListings.length);

  const resolveTransactionMeta = (type?: string | null) => {
    const normalized = (type || "").toLowerCase();
    switch (normalized) {
      case "rent":
        return { bg: "#dcfce7", color: "#166534", label: "Rent" };
      case "primary":
        return { bg: "#fef3c7", color: "#92400e", label: "Primary" };
      case "sale":
        return { bg: "#dbeafe", color: "#1d4ed8", label: "Sale" };
      default:
        return { bg: "#e5e7eb", color: "#374151", label: getListingTypeLabel(type || undefined) };
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

    const numericPrice = typeof property.price === "number" ? property.price : Number(String(property.price || "").replace(/[^0-9.]/g, ""));

    if (!numericPrice) {
      return "Price on request";
    }

    return formatPrice(numericPrice, property.transactionType || undefined);
  };


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

  const persistGeocodeCache = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(geocodeCacheRef.current));
    } catch (error) {
      console.warn("[map] Failed to persist geocode cache", error);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.log("Location access denied:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let didCancel = false;

    const initializeMap = () => {
      if (
        !mapRef.current ||
        didCancel ||
        mapInitializedRef.current ||
        !window.google?.maps
      ) {
        return;
      }
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 23.0225, lng: 72.5714 },
        zoom: 11,
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
      });

      mapInstanceRef.current = mapInstance;
      setIsMapLoaded(true);
      mapInitializedRef.current = true;
    };

    ensureGoogleMapsApiLoaded()
      .then(() => {
        if (didCancel) return;
        initializeMap();
      })
      .catch((error) => {
        if (!didCancel) {
          console.error("Failed to load Google Maps API:", error);
        }
      });

    return () => {
      didCancel = true;
    };
  }, []);

  const closeActiveInfoWindow = useCallback(() => {
    if (activeInfoWindowRef.current) {
      try {
        activeInfoWindowRef.current.close();
      } catch {
        /* empty */
      }
      activeInfoWindowRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch {
          // ignore cleanup failures
        }
      });
      markersRef.current = [];
      markersMapRef.current = {};
      if (highlightCircleRef.current) {
        try {
          highlightCircleRef.current.setMap(null);
        } catch {
          /* empty */
        }
        highlightCircleRef.current = null;
      }
      closeActiveInfoWindow();
    };
  }, [closeActiveInfoWindow]);

  const highlightPropertyOnMap = useCallback((coords: { lat: number; lng: number }) => {
    if (typeof window === "undefined" || !window.google) return;
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance || !(mapInstance instanceof window.google.maps.Map)) return;

    if (highlightCircleRef.current) {
      try {
        highlightCircleRef.current.setMap(null);
      } catch {
        /* empty */
      }
    }

    highlightCircleRef.current = new window.google.maps.Circle({
      center: coords,
      radius: 60,
      strokeColor: "#2563eb",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#2563eb",
      fillOpacity: 0.15,
      clickable: false,
      map: mapInstance,
    });
  }, []);

  useEffect(() => {
    if (!selectedProperty && highlightCircleRef.current) {
      try {
        highlightCircleRef.current.setMap(null);
      } catch {
        /* empty */
      }
      highlightCircleRef.current = null;
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (!selectedProperty) {
      closeActiveInfoWindow();
    }
  }, [selectedProperty, closeActiveInfoWindow]);

  const persistMarkerDetailsButton = useCallback(
    (propertyId: string, property: Property, infoWindow: any) => {
      setTimeout(() => {
        const detailsBtn = document.getElementById(`details-btn-${propertyId}`);
        if (!detailsBtn) return;
        const cloned = detailsBtn.cloneNode(true) as HTMLElement;
        detailsBtn.parentNode?.replaceChild(cloned, detailsBtn);
        cloned.addEventListener("click", (event) => {
          event.stopPropagation();
          try {
            infoWindow.close();
          } catch {
            /* empty */
          }
          setDetailsProperty(property);
          setShowDetailsModal(true);
        });
      }, 150);
    },
    []
  );

  const geocodeProperty = useCallback(
    async (property: Property) => {
      const cacheKey = property.id.toString();
      const addressSegments = normalizeAddressSegments([
        property.fullAddress,
        property.buildingSociety,
        property.location,
        "Gujarat",
        "India",
      ]);
      const geocodeAddressKey = addressSegments.join(", ") || cacheKey;

      if (typeof property.lat === "number" && typeof property.lng === "number") {
        return { lat: property.lat, lng: property.lng };
      }

      if (propertyCoordinatesRef.current[cacheKey]) {
        return propertyCoordinatesRef.current[cacheKey];
      }

      if (geocodeCacheRef.current[geocodeAddressKey]) {
        const coords = geocodeCacheRef.current[geocodeAddressKey];
        propertyCoordinatesRef.current[cacheKey] = coords;
        return coords;
      }

      try {
        const address = addressSegments.join(", ").slice(0, 220);
        const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(address)}`);
        const data = await response.json();

        if (data?.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
          const coords = { lat: data.latitude, lng: data.longitude };
          propertyCoordinatesRef.current[cacheKey] = coords;
          geocodeCacheRef.current[geocodeAddressKey] = coords;
          persistGeocodeCache();
          return coords;
        }
      } catch (error) {
        console.error("Geocoding failed for property:", property.id, error);
      }

      const ahmedabadLat = 23.0225;
      const ahmedabadLng = 72.5714;
      const numericKey = Array.from(cacheKey).reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
      const angle = (numericKey * 2 * Math.PI) / 10;
      const radius = 0.02 + ((numericKey % 3) || 1) * 0.01;

      const fallback = {
        lat: ahmedabadLat + Math.cos(angle) * radius,
        lng: ahmedabadLng + Math.sin(angle) * radius,
      };
      propertyCoordinatesRef.current[cacheKey] = fallback;
      return fallback;
    },
    [persistGeocodeCache]
  );

  const geocodeAddress = useCallback(async (address: string) => {
    try {
      const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data?.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
        return { lat: data.latitude, lng: data.longitude };
      }
    } catch (error) {
      console.error("[map] manual geocode failed", error);
    }
    return null;
  }, []);

  const addMarkersToMap = useCallback(
    async (listings: Property[]) => {
      if (typeof window === "undefined" || !window.google) return;
      const mapInstance = mapInstanceRef.current;
      if (!mapInstance || !(mapInstance instanceof window.google.maps.Map)) return;

      markerRenderVersionRef.current += 1;
      const requestVersion = markerRenderVersionRef.current;

      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch {
          /* empty */
        }
      });
      Object.values(markersMapRef.current).forEach((entry) => {
        try {
          entry.infoWindow.close();
        } catch {
          /* empty */
        }
      });
      markersRef.current = [];
      markersMapRef.current = {};

      const newMarkers: any[] = [];
      const newMarkersMap: Record<string, MarkerEntry> = {};

      const encodeSvg = (svg: string) =>
        `data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22")}`;

      const saleIcon = {
        url: encodeSvg(
          `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#00C853" stroke="white" stroke-width="2"/><path d="M10 18V14.5L16 10L22 14.5V18C22 18.5523 21.5523 19 21 19H11C10.4477 19 10 18.5523 10 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="19" width="6" height="3" rx="1" fill="white"/></svg>`
        ),
        scaledSize: new window.google.maps.Size(32, 32),
      };
      const rentIcon = {
        url: encodeSvg(
          `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#D50000" stroke="white" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="18" font-family="Arial" fill="white" font-weight="bold">₹</text></svg>`
        ),
        scaledSize: new window.google.maps.Size(32, 32),
      };
      const primaryIcon = {
        url: encodeSvg(
          `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#F97316" stroke="white" stroke-width="2"/><path d="M16 8L18.4721 13.009L24 13.8197L19.8 17.8619L20.9443 23.1803L16 20.4L11.0557 23.1803L12.2 17.8619L8 13.8197L13.5279 13.009L16 8Z" fill="white"/></svg>`
        ),
        scaledSize: new window.google.maps.Size(36, 36),
      };

      for (const property of listings) {
        if (markerRenderVersionRef.current !== requestVersion) {
          break;
        }
        try {
          const coords = await geocodeProperty(property);
          if (markerRenderVersionRef.current !== requestVersion) {
            break;
          }
          const normalizedType = (property.transactionType || "").toLowerCase();
          const markerIcon = normalizedType === "rent" ? rentIcon : normalizedType === "primary" ? primaryIcon : saleIcon;

          const marker = new window.google.maps.Marker({
            position: { lat: coords.lat, lng: coords.lng },
            map: mapInstance,
            title: property.title,
            icon: markerIcon,
          });

          const buildingInfo = property.buildingSociety
            ? `<div style="color: #888; font-size: 12px; margin-bottom: 4px;">${property.buildingSociety}</div>`
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
            mapInstance.setCenter({ lat: coords.lat, lng: coords.lng });
            mapInstance.setZoom(16);
            highlightPropertyOnMap(coords);
            closeActiveInfoWindow();
            infoWindow.open(mapInstance, marker);
            activeInfoWindowRef.current = infoWindow;
            persistMarkerDetailsButton(property.id, property, infoWindow);
          };

          marker.addListener("click", clickHandler);

          newMarkers.push(marker);
          newMarkersMap[property.id] = { marker, infoWindow, clickHandler };
        } catch (error) {
          console.error("Failed to add marker for property:", property.id, error);
        }
      }

      if (markerRenderVersionRef.current !== requestVersion) {
        newMarkers.forEach((marker) => {
          try {
            marker.setMap(null);
          } catch {
            /* empty */
          }
        });
        Object.values(newMarkersMap).forEach((entry) => {
          try {
            entry.infoWindow.close();
          } catch {
            /* empty */
          }
        });
        return;
      }

      if (userLocation) {
        try {
          const userMarker = new window.google.maps.Marker({
            position: { lat: userLocation.lat, lng: userLocation.lng },
            map: mapInstance,
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
        } catch (error) {
          console.warn("Failed to add user location marker", error);
        }
      }

      markersRef.current = newMarkers;
      markersMapRef.current = newMarkersMap;
    },
    [geocodeProperty, persistMarkerDetailsButton, userLocation, highlightPropertyOnMap, closeActiveInfoWindow]
  );

  const listingsForMap = searchFilteredListings;

  useEffect(() => {
    if (!isMapLoaded || listingsForMap.length === 0) {
      if (listingsForMap.length === 0) {
        markersRef.current.forEach((marker) => {
          try {
            marker.setMap(null);
          } catch {
            /* empty */
          }
        });
        markersRef.current = [];
        markersMapRef.current = {};
      }
      return;
    }

    addMarkersToMap(listingsForMap);
  }, [addMarkersToMap, listingsForMap, isMapLoaded]);

  const centerOnProperty = useCallback(
    async (property: Property) => {
      if (typeof window === "undefined" || !window.google) return;
      const mapInstance = mapInstanceRef.current;
      if (!mapInstance || !(mapInstance instanceof window.google.maps.Map)) return;

      try {
        const coords = await geocodeProperty(property);
        mapInstance.setCenter({ lat: coords.lat, lng: coords.lng });
        mapInstance.setZoom(16);
        highlightPropertyOnMap(coords);
        closeActiveInfoWindow();

        const markerData = markersMapRef.current[property.id];
        if (markerData?.marker) {
          window.google.maps.event.trigger(markerData.marker, "click");
        }
      } catch (error) {
        console.error("Failed to center on property:", property.id, error);
      }
    },
    [geocodeProperty, highlightPropertyOnMap, closeActiveInfoWindow]
  );

  const handleSearchSubmit = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Enter an address to search");
      return;
    }
    if (typeof window === "undefined" || !window.google) return;
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance || !(mapInstance instanceof window.google.maps.Map)) {
      setSearchError("Map not ready yet");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const coords = await geocodeAddress(query);
      if (!coords) {
        setSearchError("Address not found");
        return;
      }
      setSelectedProperty(null);
      highlightPropertyOnMap(coords);
      mapInstance.setCenter(coords);
      mapInstance.setZoom(15);
    } finally {
      setIsSearching(false);
    }
  }, [geocodeAddress, highlightPropertyOnMap, searchQuery]);

  useEffect(() => {
    window.openListing = (propertyId: string | number) => {
      const normalizedId = String(propertyId);
      const property = allListings.find((p) => p.id === normalizedId);
      if (property) {
        setSelectedProperty(property);
        centerOnProperty(property);
        const listElement = document.querySelector(".property-list-section");
        if (listElement) {
          listElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    };

    return () => {
      window.openListing = undefined;
    };
  }, [allListings, centerOnProperty]);

  const propertyTypes = ["all", "primary", "secondary"] as const;
  const getFilterLabel = (type: string) => {
    switch (type) {
      case "all":
        return "All Listings";
      case "primary":
        return "Primary Listing";
      case "secondary":
        return "Secondary Listing";
      default:
        return getListingTypeLabel(type);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, secondaryFilters.sale, secondaryFilters.rent]);

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Property Map</h1>
            <p className="text-sm text-muted-foreground">{searchFilteredListings.length} properties found</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (userLocation && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                mapInstanceRef.current.setZoom(15);
              }
            }}
            className="w-full sm:w-auto"
          >
            <Navigation size={16} className="mr-1" />
            <span className="hidden sm:inline">My Location</span>
            <span className="sm:hidden">Location</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-muted-foreground" />
          <div className="flex flex-wrap items-center gap-2">
            {propertyTypes.map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterType(type);
                  setCurrentPage(1);
                }}
              >
                {getFilterLabel(type)}
              </Button>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              {secondaryFilterOptions.map(({ label, type }) => (
                <Button
                  key={type}
                  variant={secondaryFilters[type] ? "default" : "outline"}
                  size="sm"
                  disabled={filterType !== "secondary"}
                  onClick={() => {
                    if (filterType !== "secondary") {
                      setFilterType("secondary");
                    }
                    toggleSecondaryFilter(type);
                  }}
                  className={filterType === "secondary" ? "" : "opacity-60"}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[60vh] bg-neutral-100">
        <div ref={mapRef} className="h-full w-full" style={{ minHeight: "400px" }} />

        {!isMapLoaded && (
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-green-50 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <MapPin size={48} className="mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">Loading Interactive Map...</p>
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mt-2" />
            </div>
          </div>
        )}


        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-1000">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md"
            onClick={() => {
              if (userLocation && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                mapInstanceRef.current.setZoom(15);
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

      <div className="px-6 py-4 property-list-section">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Properties in View ({searchFilteredListings.length})
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(null);
              }}
              placeholder="Search title or location"
              className="w-full sm:w-64"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="min-w-[88px]"
              onClick={handleSearchSubmit}
              disabled={isSearching}
            >
              <Search size={14} className="mr-1" />
              {isSearching ? "Searching" : "Search"}
            </Button>
          </div>
        </div>
        {searchError ? <p className="text-xs text-red-500 mt-2">{searchError}</p> : null}
        <div className="space-y-3">
          {paginatedProperties.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-neutral-500">No properties match the current filters.</CardContent>
            </Card>
          )}
          {paginatedProperties.map((property: Property) => {
            const priceDisplay = resolvePriceLabel(property);
            const badgeLabel = getListingTypeLabel(property.transactionType || undefined);
            const contactPhone = property.broker?.phone || property.owner?.phone || "";

            return (
              <Card
                key={property.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedProperty?.id === property.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  setSelectedProperty(property);
                  centerOnProperty(property);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-neutral-900 text-sm">{property.title}</h3>
                        <Badge className={`text-xs ${getListingTypeBadgeColor(property.transactionType || undefined)}`}>{badgeLabel}</Badge>
                      </div>
                      <p className="text-xs text-neutral-600 mb-1">{property.location}</p>
                      {property.description && <p className="text-xs text-neutral-500 mb-2">{property.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-600">{priceDisplay}</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (contactPhone) {
                                window.open(`tel:${contactPhone}`, "_self");
                              }
                            }}
                            disabled={!contactPhone}
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
        {filteredListings.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs text-neutral-600">
            <span>
              Showing {pageStart}-{pageEnd} of {filteredListings.length}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="h-20" />
      <MobileNavigation />

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
                const phone = detailsProperty.broker?.phone || detailsProperty.owner?.phone;
                if (phone) {
                  window.open(`tel:${phone}`, "_self");
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
    </AppLayout>
  );
}

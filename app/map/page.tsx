// app/map/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  User,
} from "lucide-react";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { formatPrice, getListingTypeBadgeColor } from "@/utils/formatters";
import { safeFetch } from "@/lib/safeFetch";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    openListing?: (propertyId: number) => void;
  }
}

interface Property {
  id: number;
  title: string;
  propertyType: string;
  transactionType: string;
  price: string;
  location: string;
  fullAddress?: string;
  size: string;
  sizeUnit: string;
  bhk?: number;
  buildingSociety?: string;
  owner: {
    name: string;
    phone: string;
  };
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}

export default function MapPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentMarkers, setCurrentMarkers] = useState<any[]>([]);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);
  const [propertyCoordinates, setPropertyCoordinates] = useState<{ [key: number]: { lat: number; lng: number } }>({});
  const [markersMap, setMarkersMap] = useState<{ [key: number]: { marker: any; infoWindow: any } }>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsProperty, setDetailsProperty] = useState<Property | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => safeFetch("/api/properties", []),
  });

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
    window.openListing = (propertyId: number) => {
      const property = visibleProperties.find((p) => p.id === propertyId);
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

    const initializeMap = () => {
      if (!mapRef.current || didCancel) return;
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
    };

    const loadGoogleMaps = async () => {
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
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
    // we intentionally do not add visibleProperties/map etc here — this effect only concerns loading the Maps script
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Add markers whenever map, isMapLoaded, properties or filterType changes
  useEffect(() => {
    if (map && isMapLoaded && Array.isArray(properties)) {
      addMarkersToMap().catch((e) => console.error("addMarkersToMap error:", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isMapLoaded, properties, filterType, userLocation]);

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

    const filteredProps: Property[] = Array.isArray(properties)
      ? properties.filter((property: Property) => {
          if (filterType === "all") return true;
          return property.transactionType === filterType;
        })
      : [];

    setVisibleProperties(filteredProps);

    const newMarkers: any[] = [];
    const newMarkersMap: { [key: number]: any } = {};

    // helper to attach detail button click safely
    const attachDetailsBtnListener = (propertyId: number, property: Property, infoWindow: any) => {
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

        const marker = new window.google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map,
          title: property.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 15,
            fillColor: property.transactionType === "sale" ? "#3B82F6" : "#10B981",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          },
          label: {
            text: property.bhk?.toString() || "P",
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
          },
        });

        const buildingInfo = property.buildingSociety
          ? `<div style="color: #888; font-size: 12px; margin-bottom: 4px;">${property.buildingSociety}</div>`
          : "";

        const priceNumber = typeof property.price === "string" ? parseFloat(property.price) : property.price;

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div id="info-${property.id}" style="min-width: 200px; padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${property.title}</div>
              ${buildingInfo}
              <div style="color: #666; margin-bottom: 8px; font-size: 14px;">${property.location}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: bold; color: #2563eb;">${formatPrice(priceNumber, property.transactionType)}</span>
                <span style="background: ${
                  property.transactionType === "sale" ? "#dbeafe" : "#dcfce7"
                }; color: ${property.transactionType === "sale" ? "#1d4ed8" : "#166534"}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                  ${property.transactionType}
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
    if (property.latitude && property.longitude) {
      return { lat: property.latitude, lng: property.longitude };
    }

    if (propertyCoordinates[property.id]) {
      return propertyCoordinates[property.id];
    }

    try {
      const addressParts = [property.buildingSociety, property.location, "Gujarat, India"].filter(Boolean);
      const address = addressParts.join(", ");
      const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data?.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
        const coords = { lat: data.latitude, lng: data.longitude };
        setPropertyCoordinates((prev) => ({
          ...prev,
          [property.id]: coords,
        }));
        return coords;
      }
    } catch (error) {
      console.error("Geocoding failed for property:", property.id, error);
    }

    // fallback distributed placement around Ahmedabad
    const ahmedabadLat = 23.0225;
    const ahmedabadLng = 72.5714;
    const angle = ((property.id ?? 1) * 2 * Math.PI) / 10;
    const radius = 0.02 + ((property.id ?? 1) % 3) * 0.01;

    const fallback = {
      lat: ahmedabadLat + Math.cos(angle) * radius,
      lng: ahmedabadLng + Math.sin(angle) * radius,
    };
    setPropertyCoordinates((prev) => ({ ...prev, [property.id]: fallback }));
    return fallback;
  };

  const propertyTypes = ["all", "sale", "rent"];

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
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Google Maps */}
      <div className="relative h-[60vh] bg-neutral-100">
        <div ref={mapRef} className="h-full w-full" style={{ minHeight: "400px" }} />

        {!isMapLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <MapPin size={48} className="mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">Loading Interactive Map...</p>
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mt-2" />
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
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
          {visibleProperties.slice(0, 5).map((property: Property) => (
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
                        {property.transactionType}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 mb-2">{property.location}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(typeof property.price === "string" ? parseFloat(property.price) : property.price, property.transactionType)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${property.owner.phone}`, "_self");
                          }}
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
          ))}
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20" />
      <MobileNavigation />

      {/* Property Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home size={20} />
              Property Details
            </DialogTitle>
          </DialogHeader>

          {detailsProperty && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{detailsProperty.title}</h3>
                <p className="text-sm text-muted-foreground">{detailsProperty.propertyType}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="font-semibold text-primary">
                    {formatPrice(typeof detailsProperty.price === "string" ? parseFloat(detailsProperty.price) : detailsProperty.price, detailsProperty.transactionType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Size</p>
                  <p className="font-semibold">
                    {detailsProperty.size} {detailsProperty.sizeUnit}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{detailsProperty.location}</p>
                    {detailsProperty.buildingSociety && (
                      <p className="text-xs text-muted-foreground">{detailsProperty.buildingSociety}</p>
                    )}
                  </div>
                </div>
              </div>

              {detailsProperty.bhk && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Configuration</p>
                  <p className="text-sm">{detailsProperty.bhk} BHK</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Owner Details</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{detailsProperty.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <span className="text-sm">{detailsProperty.owner.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => window.open(`tel:${detailsProperty.owner.phone}`, "_self")}>
                  <Phone size={16} className="mr-2" />
                  Call Owner
                </Button>
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

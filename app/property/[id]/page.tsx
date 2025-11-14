// app/property/[id]/page.tsx
"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share, Heart, FileText, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { asMediaUrl } from "@/lib/utils";
import { formatPrice, formatArea } from "@/utils/formatters";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ["/api/properties", id],
    queryFn: async () => {
      if (!id) throw new Error("Invalid id");
      const response = await fetch(`/api/properties/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Property not found");
      return response.json();
    },
    enabled: Boolean(id),
  });

  const requestColistingMutation = useMutation({
    mutationFn: async () => {
      // send co-listing request
      const payload = {
        propertyId: parseInt(id!, 10),
        ownerId: property?.ownerId,
      };
      const resp = await apiRequest("POST", "/api/colisting-requests", payload);
      if (resp && typeof (resp as Response).json === "function") return (resp as Response).json();
      return resp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/colisting-requests"] });
      toast({
        title: "Success",
        description: "Co-listing request sent successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Property Not Found</h3>
          <Button onClick={() => router.push("/feed")}>Back to Feed</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === property.ownerId;
  const isCoAgent = Array.isArray(property.coAgents) ? property.coAgents.some((agent: any) => agent.id === user?.id) : false;
  const canShare = isOwner || isCoAgent;

  const primaryPhoto = asMediaUrl(property.photos?.[0])
    || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500";
  const priceLabel = formatPrice(Number(property.price) || 0, property.transactionType, property.rentFrequency);
  const sizeLabel = property.size ? formatArea(property.size, property.sizeUnit || "sq ft") : "N/A";

  const handleGeneratePDF = () => {
    toast({
      title: "PDF Generated",
      description: "Property flyer has been generated successfully!",
    });
  };

  const handleShareWhatsApp = () => {
    const rawPhone = property.owner?.phone ?? null;
    const digitsOnly = rawPhone?.replace(/\D/g, "") || "";
    const whatsappNumber = (() => {
      if (!digitsOnly) return null;
      if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) return digitsOnly;
      if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) return `91${digitsOnly.slice(1)}`;
      if (digitsOnly.length === 10) return `91${digitsOnly}`;
      return digitsOnly;
    })();

    if (!whatsappNumber) {
      toast({
        title: "Phone number unavailable",
        description: "We couldn't find a valid broker number for WhatsApp sharing.",
        variant: "destructive",
      });
      return;
    }

    const message = `🏠 ${property.title}\n📍 ${property.location}\n💰 ${priceLabel}\n📐 ${sizeLabel}\n\nContact me for more details!`;
    const shareUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    if (typeof window !== "undefined") {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <button className="text-primary" onClick={() => router.push("/feed")} type="button" aria-label="Back to feed">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-3">
            <button className="text-neutral-400" type="button" aria-label="Share">
              <Share size={20} />
            </button>
            <button className="text-neutral-400" type="button" aria-label="Favorite">
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Image Gallery */}
        <div className="relative">
          {/* keep same image markup */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryPhoto}
            alt={property.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            1 / {Math.max((property.photos && property.photos.length) || 0, 1)}
          </div>
        </div>

        {/* Property Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">{property.title}</h1>
              <p className="text-neutral-600">{property.location}</p>
            </div>
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                property.listingType === "exclusive" ? "bg-accent text-white" : "bg-blue-100 text-blue-800"
              }`}
            >
              {property.listingType === "exclusive" ? "Exclusive" : "Co-listing"}
            </span>
          </div>

          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{priceLabel}</div>
                <div className="text-sm text-neutral-500">Price</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{sizeLabel}</div>
                <div className="text-sm text-neutral-500">Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{property.bhk || "N/A"}</div>
                <div className="text-sm text-neutral-500">BHK</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-neutral-900 mb-3">Description</h3>
              <p className="text-neutral-600 leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Agent Info */}
          <div className="border border-neutral-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                  <span className="text-neutral-500 font-medium">{property.owner.name?.charAt(0) || "A"}</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">{property.owner.name}</div>
                  <div className="text-sm text-neutral-500">{property.owner.agencyName}</div>
                </div>
              </div>
              <Button size="sm">Contact</Button>
            </div>

            {property.coAgents?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <div className="text-sm text-neutral-500 mb-2">Co-listed with:</div>
                <div className="flex items-center space-x-2">
                  {property.coAgents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-neutral-500">{agent.name?.charAt(0) || "A"}</span>
                      </div>
                      <span className="text-sm text-neutral-600">{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Co-listing Request (for non-owned properties) */}
          {!isOwner && !isCoAgent && property.listingType === "colisting" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">Interested in co-listing?</div>
                  <div className="text-sm text-blue-700">Request to co-list this property with the owner</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => requestColistingMutation.mutate()}
                  disabled={requestColistingMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {requestColistingMutation.isPending ? <div className="loading-spinner" /> : "Request"}
                </Button>
              </div>
            </div>
          )}

          {/* Share Options (for owned/co-listed properties) */}
          {canShare && (
            <div className="space-y-3">
              <Button
                onClick={handleGeneratePDF}
                className="w-full bg-accent text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <FileText size={20} />
                <span>Generate PDF Flyer</span>
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-green-700"
              >
                <MessageCircle size={20} />
                <span>Share on WhatsApp</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
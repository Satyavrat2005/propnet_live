// app/property/[id]/page.tsx
"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { asMediaUrl } from "@/lib/utils";
import { formatPrice, formatArea } from "@/utils/formatters";
import PropertyDetailsPanel from "@/components/ui/property-details-panel";

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

  const handleShareProperty = async () => {
    // Transaction type header
    const transactionHeader = property.transactionType === 'rent' ? '🏠 FOR RENT' : '🏡 FOR SALE';
    
    // Build comprehensive share text
    let shareText = `${transactionHeader}\n\n`;
    shareText += `${property.title}\n\n`;
    
    // Property Details Section
    shareText += `📋 PROPERTY DETAILS\n`;
    shareText += `💰 Price: ${priceLabel}\n`;
    shareText += `📐 Size: ${sizeLabel}\n`;
    if (property.bhk) shareText += `🛏️ Bedrooms: ${property.bhk}\n`;
    if (property.bathrooms) shareText += `🚿 Bathrooms: ${property.bathrooms}\n`;
    if (property.propertyType) shareText += `🏢 Type: ${property.propertyType}\n`;
    if (property.floor) shareText += `📶 Floor: ${property.floor}\n`;
    if (property.buildingSociety) shareText += `🏢 Building: ${property.buildingSociety}\n`;
    
    // Location Section
    shareText += `\n📍 LOCATION\n`;
    shareText += `${property.location}\n`;
    if (property.fullAddress) shareText += `${property.fullAddress}\n`;
    if (property.flatNumber) {
      shareText += `Flat: ${property.flatNumber}\n`;
    }
    
    // Description
    if (property.description) {
      shareText += `\n📝 DESCRIPTION\n${property.description}\n`;
    }
    
    // Broker Contact
    if (property.broker?.name || property.owner?.name) {
      const brokerName = property.broker?.name || property.owner?.name || 'Agent';
      const brokerPhone = property.broker?.phone || property.owner?.phone || 'Not provided';
      const agencyName = property.broker?.agencyName || property.owner?.agencyName || '';
      
      shareText += `\n📞 CONTACT BROKER\n`;
      shareText += `Name: ${brokerName}\n`;
      if (agencyName) shareText += `Agency: ${agencyName}\n`;
      shareText += `Phone: ${brokerPhone}\n`;
    }
    
    // Always copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Property details with broker contact copied to clipboard",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "Copied to clipboard",
          description: "Property details with broker contact copied to clipboard",
        });
      } catch (fallbackError) {
        toast({
          title: "Copy failed",
          description: "Unable to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <button className="text-blue-600" onClick={() => router.back()} type="button" aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          {/* <div className="flex items-center space-x-3">
            <button className="text-neutral-400" type="button" aria-label="Share">
              <Share size={20} />
            </button>
            <button className="text-neutral-400" type="button" aria-label="Favorite">
              <Heart size={20} />
            </button>
          </div> */}
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
            className="w-full object-contain bg-gray-100"
            style={{ maxHeight: '500px' }}
          />
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            1 / {Math.max((property.photos && property.photos.length) || 0, 1)}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <PropertyDetailsPanel
            property={property}
          />

          {property.coAgents?.length > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
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

          {!isOwner && !isCoAgent && property.listingType === "colisting" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">Interested in co-listing?</div>
                  <div className="text-sm text-blue-700">Request to co-list this property with the owner</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => requestColistingMutation.mutate()}
                  disabled={requestColistingMutation.isPending}
                  className="border-2 border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 text-white transition-all duration-200"
                >
                  {requestColistingMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Requesting...
                    </div>
                  ) : (
                    "Request"
                  )}
                </Button>
              </div>
            </div>
          )}

          {canShare && (
            <Button
              onClick={handleShareProperty}
              className="w-full border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 hover:border-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <Share size={20} />
              <span>Copy Property Details For Sharing</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
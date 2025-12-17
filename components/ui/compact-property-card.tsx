"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Share2, MapPin, Eye, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatArea, getSafeFormattedPrice } from "@/utils/formatters";
import { asMediaUrl } from "@/lib/utils";
import type { PropertyDetailsData } from "@/components/ui/property-details-panel";

export type FeedProperty = PropertyDetailsData & {
  id: string;
  photos?: string[];
  rentFrequency?: string;
  sizeUnit?: string;
  listingType?: string;
  bathrooms?: number;
  ownerId?: number;
  coAgents?: Array<{ id: string; name?: string; phone?: string }>;
};

interface CompactPropertyCardProps {
  property: FeedProperty;
  onViewDetails?: (property: FeedProperty) => void;
}

export default function CompactPropertyCard({ property, onViewDetails }: CompactPropertyCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const handleDetailsClick = () => {
    if (onViewDetails) {
      onViewDetails(property);
      return;
    }
    router.push(`/property/${property.id}`);
  };

  const hasPhotos = Array.isArray(property.photos) && property.photos.length > 0;
  const primaryPhoto = hasPhotos ? asMediaUrl(property.photos![0]) : null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Property removed from your favorites" : "Property saved to your favorites",
    });
  };

  const handleShare = async () => {
    const formattedPrice = getSafeFormattedPrice(property.price ?? undefined, property.transactionType ?? undefined, property.rentFrequency);
    const formattedArea = formatArea(property.size ?? 0, property.sizeUnit);
    
    // Transaction type header
    const transactionHeader = property.transactionType === 'rent' ? '🏠 FOR RENT' : '🏡 FOR SALE';
    
    // Build comprehensive share text
    let shareText = `${transactionHeader}\n\n`;
    shareText += `${property.title}\n\n`;
    
    // Property Details Section
    shareText += `📋 PROPERTY DETAILS\n`;
    shareText += `💰 Price: ${formattedPrice}\n`;
    shareText += `📐 Size: ${formattedArea}\n`;
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
    
    // Always copy to clipboard, never use native share dialog
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
      } catch (err) {
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
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 mb-4">
        <div className="flex h-[160px]">
          {/* Content Section - Left */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            {/* Top Section */}
            <div>
              {/* Property Type Badge */}
              <div className="mb-2">
                <span className="text-xs text-blue-600 bg-transparent font-medium uppercase tracking-wide">
                  {property.propertyType}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 line-clamp-2">
                {property.title}
              </h3>

              {/* Property Details */}
              <div className="flex items-center text-blue-600 text-sm mb-2 space-x-1">
                {property.bhk && (
                  <>
                    <span>{property.bhk} bed{property.bhk > 1 ? 's' : ''}</span>
                    <span>•</span>
                  </>
                )}
                {property.bathrooms && (
                  <>
                    <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatArea(property.size ?? 0, property.sizeUnit || 'sq ft')}</span>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isLiked ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"
                  } transition-colors`}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!property.ownerId) {
                      toast({
                        title: "Broker unavailable",
                        description: "This property does not have a listed broker yet.",
                      });
                      return;
                    }
                    router.push(`/messages?participantId=${String(property.ownerId)}&propertyId=${property.id}`);
                  }}
                  className="text-xs px-3 py-1.5 h-8 border-gray-300 flex items-center gap-1.5"
                >
                  <MessageCircle size={13} />
                  <span>Message</span>
                </Button>
        
                <Button size="sm" variant="ghost" onClick={handleDetailsClick}
                  className="text-xs px-3 py-1.5 h-8 flex items-center gap-1.5"
                >
                  <Eye size={13} />
                  <span>Details</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Image Section - Right */}
          <div className="w-[180px] shrink-0 relative">
            {primaryPhoto ? (
              <div className="relative h-full w-full overflow-hidden rounded-tr-2xl rounded-br-2xl">
                <img 
                  src={primaryPhoto} 
                  alt={property.title ?? 'Property image'}
                  className="w-full h-full object-cover"
                />
                {property.photos && property.photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs">
                    +{property.photos.length - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center rounded-tr-2xl rounded-br-2xl">
                <div className="text-blue-400 text-center">
                  <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">
                      {property.propertyType?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="text-xs text-blue-500">No Image</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin size={12} className="mr-1 shrink-0" />
            <span className="truncate text-xs">{property.location}</span>
          </div>
          
          <div className="text-lg font-bold text-gray-900">
            {getSafeFormattedPrice(property.price ?? undefined, property.transactionType ?? undefined, property.rentFrequency)}
          </div>
        </div>
      </div>

    </>
  );
}


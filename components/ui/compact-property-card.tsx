"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Share2, MapPin, Phone, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContactModal from "@/components/ui/contact-modal";
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
  const [showContactModal, setShowContactModal] = useState(false);
  const { toast } = useToast();
  const handleDetailsClick = () => {
    if (onViewDetails) {
      onViewDetails(property);
      return;
    }
    router.push(`/property/${property.id}`);
  };

  const hasPhotos = Array.isArray(property.photos) && property.photos.length > 0;
  const primaryPhoto = hasPhotos ? asMediaUrl(property.photos[0]) : null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Property removed from your favorites" : "Property saved to your favorites",
    });
  };

  const handleShare = () => {
    const formattedPrice = getSafeFormattedPrice(property.price, property.transactionType, property.rentFrequency);
    const formattedArea = formatArea(property.size, property.sizeUnit);
    const shareText = `${property.title}\n📍 ${property.location}\n💰 ${formattedPrice}\n📐 ${formattedArea}`;
    
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Property details copied to clipboard",
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 mb-4">
        <div className="flex h-[140px]">
          {/* Content Section - Left */}
          <div className="flex-1 p-4 flex flex-col justify-between">
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
                <span>{formatArea(property.size, property.sizeUnit || 'sq ft')}</span>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={handleLike}
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isLiked ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"
                  } transition-colors`}
                >
                  <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Share2 size={12} />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowContactModal(true)}
                  className="text-xs px-2 py-1 h-6 border-gray-300"
                >
                  <Phone size={10} className="mr-1" />
                  Contact
                </Button>
                
                <Button size="sm" variant="ghost" onClick={handleDetailsClick}
                  className="text-xs px-2 py-1 h-6"
                >
                  <Eye size={10} className="mr-1" />
                  Details
                </Button>
              </div>
            </div>
          </div>

          {/* Image Section - Right */}
          <div className="w-[120px] shrink-0 relative">
            {primaryPhoto ? (
              <div className="relative h-full w-full">
                <img 
                  src={primaryPhoto} 
                  alt={property.title}
                  className="w-full h-full object-cover rounded-tr-2xl rounded-br-2xl"
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
            {getSafeFormattedPrice(property.price, property.transactionType, property.rentFrequency)}
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyOwner={property.owner}
        propertyTitle={property.title}
      />
    </>
  );
}


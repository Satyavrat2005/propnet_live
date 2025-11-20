import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MapPin, Calendar, Eye, TrendingUp, Phone, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContactModal from "@/components/ui/contact-modal";
import { formatPrice, formatArea, getListingTypeBadgeColor, getListingTypeLabel } from "@/utils/formatters";
import { asMediaUrl } from "@/lib/utils";

interface EnhancedPropertyCardProps {
  property: any;
  currentUserId?: number;
}

export default function EnhancedPropertyCard({ property, currentUserId }: EnhancedPropertyCardProps) {
  const [, setLocation] = useLocation();
  const [isLiked, setIsLiked] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { toast } = useToast();

  const isOwner = currentUserId === property.ownerId;
  const hasCoAgents = property.coAgents && property.coAgents.length > 0;
  const contactInfo = property.broker || property.owner || null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Property removed from your favorites" : "Property saved to your favorites",
    });
  };

  const handleShare = () => {
  const formattedPrice = formatPrice(Number(property.price) || 0, property.transactionType, property.rentFrequency);
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

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/properties/${property.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${property.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_listing.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "PDF Downloaded",
          description: "Property listing PDF has been downloaded successfully",
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasPhotos = Array.isArray(property.photos) && property.photos.length > 0;
  const primaryPhoto = hasPhotos ? asMediaUrl(property.photos[0]) : null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {primaryPhoto ? (
        <div className="relative">
          <img 
            src={primaryPhoto}
            alt={property.title}
            className="w-full h-48 object-cover"
          />
          
          <div className="absolute top-3 left-3">
            <Badge className={`text-xs font-medium ${
              property.propertyType === "Villa" 
                ? "bg-purple-100 text-purple-800" 
                : property.propertyType === "Commercial"
                ? "bg-orange-100 text-orange-800"
                : "bg-blue-100 text-blue-800"
            }`}>
              {property.propertyType}
            </Badge>
          </div>



          <div className="absolute bottom-3 right-3 flex space-x-2">
            <button
              onClick={handleLike}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isLiked ? "bg-red-500 text-white" : "bg-white/80 text-neutral-700"
              } backdrop-blur-sm`}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-neutral-700"
            >
              <Share2 size={16} />
            </button>
          </div>

          {property.photos && property.photos.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              +{property.photos.length - 1} photos
            </div>
          )}
        </div>
      ) : null}
      
      <div className="p-4">
  {!primaryPhoto && (
          <div className="flex items-center justify-between mb-3">
            <Badge className={`text-xs font-medium ${
              property.propertyType === "Villa" 
                ? "bg-purple-100 text-purple-800" 
                : property.propertyType === "Commercial"
                ? "bg-orange-100 text-orange-800"
                : "bg-blue-100 text-blue-800"
            }`}>
              {property.propertyType}
            </Badge>

          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-neutral-900 text-lg leading-tight">{property.title}</h3>
          <div className="flex items-center space-x-1 ml-2">
            <Badge className={`text-xs ${getListingTypeBadgeColor(property.listingType || 'shared')}`}>
              {getListingTypeLabel(property.listingType || 'shared')}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center text-neutral-600 text-sm mb-3">
          <MapPin size={14} className="mr-1" />
          {property.location}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(Number(property.price) || 0, property.transactionType, property.rentFrequency)}
          </div>
          <div className="text-right">
            <div className="text-sm text-neutral-500">
              {formatArea(property.size, property.sizeUnit || 'sq.ft')}
            </div>
            {property.bhk && (
              <div className="text-xs text-neutral-400">{property.bhk} BHK</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
          <div className="flex items-center">
            <Eye size={12} className="mr-1" />
            {Math.floor(Math.random() * 50) + 10} views
          </div>
          <div className="flex items-center">
            <Calendar size={12} className="mr-1" />
            {formatDate(property.createdAt)}
          </div>
        </div>

        <div className="space-y-2">
          {contactInfo && (
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {contactInfo.name?.charAt(0) || contactInfo.phone?.charAt(0) || 'B'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {contactInfo.name || 'Listing Broker'}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {contactInfo.agencyName || 'Real Estate Agent'}
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowContactModal(true)}
                className="text-xs"
              >
                <Phone size={12} className="mr-1" />
                Contact
              </Button>
            </div>
          )}

          {hasCoAgents && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs font-medium text-blue-800 mb-1">Co-Listed by:</div>
              <div className="flex flex-wrap gap-1">
                {property.coAgents.map((agent: any, index: number) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {agent.name || agent.phone}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-4">
          {!hasPhotos && (
            <div className="flex space-x-1">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full border ${
                  isLiked ? "bg-red-50 border-red-200 text-red-600" : "bg-neutral-50 border-neutral-200 text-neutral-600"
                }`}
              >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full border bg-neutral-50 border-neutral-200 text-neutral-600"
              >
                <Share2 size={16} />
              </button>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/property/${property.id}`)}
            className="flex-1 text-xs"
          >
            <Eye size={12} className="mr-1" />
            View Details
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="text-xs"
          >
            <Download size={12} className="mr-1" />
            PDF
          </Button>
        </div>
      </div>

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyOwner={contactInfo || { name: "", phone: "", agencyName: "" }}
        propertyTitle={property.title}
      />
    </div>
  );
}
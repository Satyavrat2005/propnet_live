import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  property: any;
  currentUserId?: number;
}

export default function PropertyCard({ property, currentUserId }: PropertyCardProps) {
  const [, setLocation] = useLocation();

  const isOwner = currentUserId === property.ownerId;
  const hasCoAgents = property.coAgents && property.coAgents.length > 0;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 mb-4 overflow-hidden shadow-sm">
      <img 
        src={property.photos?.[0] ? `/uploads/${property.photos[0]}` : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
        alt={property.title}
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-neutral-900 text-lg">{property.title}</h3>
          <div className="flex items-center space-x-1">
            <Badge className={`text-xs ${
              property.listingType === "exclusive" 
                ? "bg-accent text-white" 
                : "bg-blue-100 text-blue-800"
            }`}>
              {property.listingType === "exclusive" ? "Exclusive" : "Co-listing"}
            </Badge>
          </div>
        </div>
        
        <p className="text-neutral-600 text-sm mb-3">{property.location}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-primary">{property.price}</div>
          <div className="text-sm text-neutral-500">{property.size}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasCoAgents ? (
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-neutral-500">
                      {property.owner.name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-white">
                      {property.coAgents[0].name?.charAt(0) || "A"}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-neutral-600">
                  {property.owner.name} & {property.coAgents.length} other{property.coAgents.length > 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-neutral-500">
                    {property.owner.name?.charAt(0) || "A"}
                  </span>
                </div>
                <span className="text-sm text-neutral-600">{property.owner.name}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/property/${property.id}`)}
            className="text-primary font-medium text-sm"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

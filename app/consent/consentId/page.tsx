// app/owner-consent/[consentId]/page.tsx
"use client";

import React, { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, MapPin, Building2, User, Phone, FileText, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Property {
  id: number;
  title: string;
  propertyType: string;
  price: string;
  size: string;
  bhk?: number;
  location: string;
  fullAddress?: string;
  description?: string;
  listingType: string;
  commissionTerms?: string;
  scopeOfWork?: string[];
}

interface Agent {
  id: number;
  name: string;
  agencyName?: string;
  phone: string;
  experience?: string;
  reraId?: string;
  profilePhoto?: string;
}

interface ConsentData {
  id: number;
  status: "pending" | "approved" | "rejected";
  property: Property;
  agent: Agent;
  action?: "approve" | "reject";
}

interface OwnerConsentProps {
  params: Promise<{ consentId: string }>;
}

export default function OwnerConsent({ params }: OwnerConsentProps) {
  const { consentId } = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consentData, isLoading } = useQuery<ConsentData>({
    queryKey: [`/api/consent/${consentId}`],
  });

  const approveConsentMutation = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      const resp = await apiRequest("POST", `/api/consent/${consentId}/${action}`);
      // apiRequest might return Response or parsed; handle both
      if (resp && typeof (resp as Response).json === "function") {
        return (resp as Response).json();
      }
      return resp;
    },
    onSuccess: (data: any, variables: "approve" | "reject") => {
      // Invalidate consent (and properties if you want)
      queryClient.invalidateQueries({ queryKey: [`/api/consent/${consentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });

      const action = data?.action ?? variables;
      toast({
        title: action === "approve" ? "Listing Approved" : "Listing Rejected",
        description:
          action === "approve"
            ? "The property listing is now live and can be shared by the agent."
            : "The property listing has been rejected and will not be published.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAction = (action: "approve" | "reject") => {
    approveConsentMutation.mutate(action);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!consentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid or Expired Link</h2>
            <p className="text-neutral-600">This consent link is no longer valid or has already been processed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const property = consentData.property;
  const agent = consentData.agent;

  if (consentData.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            {consentData.status === "approved" ? (
              <>
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-lg font-semibold mb-2">Already Approved</h2>
                <p className="text-neutral-600">You have already approved this property listing.</p>
              </>
            ) : (
              <>
                <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-lg font-semibold mb-2">Already Rejected</h2>
                <p className="text-neutral-600">You have already rejected this property listing.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield size={32} className="text-primary mr-2" />
            <h1 className="text-2xl font-bold text-neutral-900">Property Listing Consent</h1>
          </div>
          <p className="text-neutral-600">An agent has requested to list your property. Please review the details below.</p>
        </div>

        {/* Property Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 size={20} className="mr-2" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">{property.title}</h3>
                <div className="flex items-center text-neutral-600 mt-1">
                  <MapPin size={14} className="mr-1" />
                  <span>{property.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-neutral-500">Property Type</span>
                  <p className="font-medium">{property.propertyType}</p>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Price</span>
                  <p className="font-medium text-primary">{property.price}</p>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Size</span>
                  <p className="font-medium">{property.size} sq. ft.</p>
                </div>
                {property.bhk && (
                  <div>
                    <span className="text-sm text-neutral-500">BHK</span>
                    <p className="font-medium">{property.bhk} BHK</p>
                  </div>
                )}
              </div>

              {property.fullAddress && (
                <div>
                  <span className="text-sm text-neutral-500">Full Address</span>
                  <p className="font-medium">{property.fullAddress}</p>
                </div>
              )}

              {property.description && (
                <div>
                  <span className="text-sm text-neutral-500">Description</span>
                  <p className="text-neutral-700">{property.description}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-neutral-500">Listing Type</span>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {property.listingType}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {property.listingType === "exclusive" && "Only this agent can list and share this property"}
                  {property.listingType === "colisting" && "Multiple agents can list this property with permission"}
                  {property.listingType === "shared" && "Property can be viewed and promoted within the platform network"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User size={20} className="mr-2" />
              Agent Information & Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                  {agent.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/uploads/${agent.profilePhoto}`} alt="Agent" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-neutral-500">{agent.name?.charAt(0) || "A"}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900">{agent.name}</h4>
                  {agent.agencyName && <p className="text-neutral-600">{agent.agencyName}</p>}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-500">
                    <span className="flex items-center">
                      <Phone size={12} className="mr-1" />
                      {agent.phone}
                    </span>
                    {agent.experience && <span>{agent.experience} Experience</span>}
                  </div>
                  {agent.reraId && (
                    <Badge variant="outline" className="mt-2">
                      RERA: {agent.reraId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText size={20} className="mr-2" />
              Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {property.commissionTerms && (
                <div>
                  <span className="text-sm font-medium text-neutral-700">Commission Terms</span>
                  <p className="text-neutral-600">{property.commissionTerms}</p>
                </div>
              )}

              {property.scopeOfWork && property.scopeOfWork.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-neutral-700">Scope of Work</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {property.scopeOfWork.map((scope: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Agent's Responsibilities</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Market and promote your property to potential buyers</li>
                  <li>• Coordinate property viewings and handle inquiries</li>
                  <li>• Provide regular updates on market interest and feedback</li>
                  <li>• Assist with documentation and legal compliance</li>
                  <li>• Maintain confidentiality of your personal information</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Your Rights</h5>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• You can withdraw consent at any time</li>
                  <li>• Your contact information remains encrypted and secure</li>
                  <li>• You have final approval on all offers and negotiations</li>
                  <li>• You can request changes to the listing details</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAction("reject")}
              disabled={approveConsentMutation.isPending}
              className="w-full"
            >
              <XCircle size={20} className="mr-2" />
              {approveConsentMutation.isPending ? "Processing..." : "Decline Listing"}
            </Button>
            <Button
              size="lg"
              onClick={() => handleAction("approve")}
              disabled={approveConsentMutation.isPending}
              className="w-full"
            >
              <CheckCircle size={20} className="mr-2" />
              {approveConsentMutation.isPending ? "Processing..." : "Approve Listing"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-neutral-500">
              <Shield size={12} className="inline mr-1" />
              This consent is secured and your decision will be recorded with timestamp for legal compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

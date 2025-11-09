import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Phone, CheckCircle, AlertCircle, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ownerDetailsSchema = z.object({
  ownerName: z.string().min(2, "Owner name is required"),
  ownerPhone: z.string().min(10, "Valid phone number is required"),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  ownerType: z.enum(["existing", "new"]),
  existingClientId: z.number().optional(),
  commissionTerms: z.string().min(10, "Commission terms are required"),
  scopeOfWork: z.array(z.string()).min(1, "At least one scope is required"),
  notes: z.string().optional(),
});

type OwnerDetailsFormData = z.infer<typeof ownerDetailsSchema>;

interface OwnerConsentFormProps {
  propertyData: any;
  onOwnerDetailsSubmit: (data: OwnerDetailsFormData) => void;
  ownerClients?: any[];
  isLoading?: boolean;
}

export function OwnerConsentForm({ 
  propertyData, 
  onOwnerDetailsSubmit, 
  ownerClients = [],
  isLoading = false 
}: OwnerConsentFormProps) {
  const { toast } = useToast();
  const [consentStatus, setConsentStatus] = useState<'pending' | 'sent' | 'approved' | 'rejected'>('pending');
  const [consentUrl, setConsentUrl] = useState<string>("");

  const form = useForm<OwnerDetailsFormData>({
    resolver: zodResolver(ownerDetailsSchema),
    defaultValues: {
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerType: "new",
      commissionTerms: "3% of sale value",
      scopeOfWork: ["Property marketing", "Client coordination", "Documentation"],
      notes: "",
    },
  });

  const watchOwnerType = form.watch("ownerType");

  const handleOwnerDetailsSubmit = (data: OwnerDetailsFormData) => {
    onOwnerDetailsSubmit(data);
  };

  const sendConsentLink = async (propertyId: number) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/send-consent-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setConsentStatus('sent');
        setConsentUrl(data.consentUrl);
        toast({
          title: "Consent link sent successfully",
          description: "Owner will receive SMS with consent form link",
        });
      } else {
        toast({
          title: "Failed to send consent link",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error sending consent link",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getConsentStatusBadge = () => {
    switch (consentStatus) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Consent Pending</Badge>;
      case 'sent':
        return <Badge variant="outline"><Send className="w-3 h-3 mr-1" />Consent Link Sent</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown Status</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Property Owner Details & Consent</span>
          </CardTitle>
          {getConsentStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleOwnerDetailsSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ownerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Selection</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New Owner (Add Details)</SelectItem>
                      <SelectItem value="existing">Existing Client</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchOwnerType === "existing" && (
              <FormField
                control={form.control}
                name="existingClientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Existing Client</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ownerClients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name} - {client.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchOwnerType === "new" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter owner's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone Number</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm">
                              +91
                            </span>
                            <Input 
                              placeholder="Enter 10-digit phone number" 
                              className="rounded-l-none"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner's email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="commissionTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Terms</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define commission structure and payment terms"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special instructions or agreements with the owner"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Processing..." : "Save Owner Details"}
              </Button>
              
              {propertyData?.id && consentStatus === 'pending' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => sendConsentLink(propertyData.id)}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Consent Link</span>
                </Button>
              )}
            </div>
          </form>
        </Form>

        {consentStatus === 'sent' && consentUrl && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Consent Link Sent</h4>
            <p className="text-sm text-blue-700 mb-3">
              The property owner will receive an SMS with a secure consent link. They can approve or reject the listing request.
            </p>
            <div className="flex items-center space-x-2">
              <Input 
                value={consentUrl} 
                readOnly 
                className="text-xs bg-white"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(consentUrl);
                  toast({ title: "Consent link copied to clipboard" });
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Consent Process</h4>
          <ol className="text-sm text-amber-700 space-y-1">
            <li>1. Owner details are collected and stored securely</li>
            <li>2. Consent link is sent via SMS to the owner</li>
            <li>3. Owner approves/rejects the listing request</li>
            <li>4. Property becomes active upon approval</li>
            <li>5. You receive notification of the owner's decision</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
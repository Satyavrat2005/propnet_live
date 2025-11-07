import { useState, useEffect } from "react";
import { User, Send, Edit3, Phone, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AgentNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: {
    name: string;
    phone: string;
    requirementType?: string;
    propertyType?: string;
  };
  agentData: {
    name: string;
    phone: string;
    agency?: string;
  };
  onSendNotification: (message: string) => Promise<boolean>;
}

export function AgentNotificationModal({
  isOpen,
  onClose,
  clientData,
  agentData,
  onSendNotification
}: AgentNotificationModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const generateTemplate = () => {
    const requirement = clientData.requirementType || "property";
    const needType = requirement.includes("buy") ? "buying" : 
                    requirement.includes("sell") ? "selling" : "renting";
    
    return `Hi ${clientData.name},

I've added your details to my system to assist you with your ${needType} needs.

I'll personally help you with the best possible options based on your requirements.

Feel free to reach out to me at ${agentData.phone}.

– ${agentData.name}${agentData.agency ? `\n${agentData.agency}` : ""}`;
  };

  useEffect(() => {
    if (isOpen) {
      setCustomMessage(generateTemplate());
      setIsEditing(false);
    }
  }, [isOpen, clientData, agentData]);

  const handleSendMessage = async () => {
    setIsSending(true);
    try {
      const success = await onSendNotification(customMessage);
      
      if (success) {
        toast({
          title: "Notification sent successfully",
          description: `Professional message sent to ${clientData.name}`,
        });
        onClose();
      } else {
        toast({
          title: "Failed to send notification",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error sending notification",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetToTemplate = () => {
    setCustomMessage(generateTemplate());
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Send Client Engagement Message</span>
          </DialogTitle>
          <DialogDescription>
            Send a professional, agent-branded message to build trust and establish direct communication with your new client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{clientData.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>+91 {clientData.phone}</span>
              </div>
              {clientData.requirementType && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{clientData.requirementType}</Badge>
                  {clientData.propertyType && (
                    <Badge variant="secondary">{clientData.propertyType}</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{agentData.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>+91 {agentData.phone}</span>
              </div>
              {agentData.agency && (
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span>{agentData.agency}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Preview/Edit */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Message Preview</CardTitle>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <Button variant="outline" size="sm" onClick={resetToTemplate}>
                      Reset to Template
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit Message
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Customize your message..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    Message length: {customMessage.length} characters
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {customMessage}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Why Send This Message?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Establishes direct communication channel</li>
              <li>• Builds trust and professional credibility</li>
              <li>• Shows personal attention to their requirements</li>
              <li>• Creates agent-client relationship (not platform-dependent)</li>
              <li>• Encourages immediate engagement and response</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Skip for Now
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={isSending || !customMessage.trim()}
              className="flex-1"
            >
              {isSending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
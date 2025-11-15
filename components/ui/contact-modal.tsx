import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageCircle, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyOwner: any;
  propertyTitle: string;
}

export default function ContactModal({ isOpen, onClose, propertyOwner, propertyTitle }: ContactModalProps) {
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<"phone" | "message" | "email">("message");
  const { toast } = useToast();

  const handleContact = () => {
    if (contactMethod === "phone") {
      window.open(`tel:${propertyOwner.phone}`);
    } else if (contactMethod === "email" && propertyOwner.email) {
      window.open(`mailto:${propertyOwner.email}?subject=Inquiry about ${propertyTitle}&body=${message}`);
    } else {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the property owner.",
      });
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md mx-auto bg-white shadow-lg border border-neutral-200 rounded-2xl p-6 backdrop-blur-none!"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-900">
            Contact Agent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Agent Info */}
          <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
            <div className="w-12 h-12">
              <Avatar className="h-12 w-12">
                {propertyOwner?.profilePhotoUrl ? (
                  <AvatarImage
                    src={propertyOwner.profilePhotoUrl}
                    alt={propertyOwner.name ?? "Agent"}
                  />
                ) : (
                  <AvatarFallback className="text-lg font-semibold text-neutral-600">
                    {propertyOwner.name?.charAt(0) || "A"}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div>
              <div className="font-medium text-neutral-900">{propertyOwner.name}</div>
              <div className="text-sm text-neutral-500">{propertyOwner.agencyName}</div>
              <div className="text-xs text-neutral-400">{propertyOwner.phone}</div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Contact Method</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={contactMethod === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactMethod("phone")}
                className="flex items-center space-x-1"
              >
                <Phone size={14} />
                <span>Call</span>
              </Button>
              <Button
                variant={contactMethod === "message" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactMethod("message")}
                className="flex items-center space-x-1"
              >
                <MessageCircle size={14} />
                <span>Message</span>
              </Button>
              {propertyOwner.email && (
                <Button
                  variant={contactMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContactMethod("email")}
                  className="flex items-center space-x-1"
                >
                  <Mail size={14} />
                  <span>Email</span>
                </Button>
              )}
            </div>
          </div>

          {/* Message Input */}
          {(contactMethod === "message" || contactMethod === "email") && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Message</label>
              <Textarea
                placeholder={`Hi, I'm interested in ${propertyTitle}. Please share more details.`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="bg-white"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleContact} className="flex-1 flex items-center space-x-2">
              <Send size={16} />
              <span>
                {contactMethod === "phone"
                  ? "Call Now"
                  : contactMethod === "email"
                  ? "Send Email"
                  : "Send Message"}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after user has used the app for a bit
      setTimeout(() => {
        if (!isStandaloneMode) {
          setShowInstallPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || 
      sessionStorage.getItem('pwa-install-dismissed') || 
      (!showInstallPrompt && !isIOS)) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install PropNet App</h3>
            <p className="text-xs text-white/90 mb-3">
              {isIOS 
                ? "Add PropNet to your home screen for quick access. Tap the share button and select 'Add to Home Screen'"
                : "Get the full app experience with offline access and notifications"
              }
            </p>
            <div className="flex space-x-2">
              {!isIOS && deferredPrompt && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleInstallClick}
                  className="bg-white text-blue-600 hover:bg-white/90"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Install
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-1" />
                Later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
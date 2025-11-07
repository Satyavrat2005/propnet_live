import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, WifiOff } from "lucide-react";

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkInstalled();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isInstalled) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex space-x-2">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center space-x-1"
      >
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </Badge>
      
      <Badge variant="secondary" className="flex items-center space-x-1">
        <Smartphone className="h-3 w-3" />
        <span>App Mode</span>
      </Badge>
    </div>
  );
}
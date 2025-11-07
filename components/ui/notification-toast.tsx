import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface NotificationToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function NotificationToast({ 
  message, 
  type = "success", 
  duration = 3000, 
  onClose 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-accent text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-4 left-4 right-4 ${colors[type]} p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span>{message}</span>
        </div>
        <button onClick={() => setIsVisible(false)}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

// PWA Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', registration);

      // Update found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('New app version available. Refresh to update.');
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Check if app is installed
export const isAppInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Get app installation prompt
export const getInstallPrompt = () => {
  return new Promise((resolve) => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      resolve(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });
};

// Request persistent notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return 'denied';
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }
};

// Check if device is iOS
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Check if device is Android
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Get device type for analytics
export const getDeviceType = (): string => {
  if (isIOS()) return 'iOS';
  if (isAndroid()) return 'Android';
  if (window.innerWidth <= 768) return 'Mobile';
  if (window.innerWidth <= 1024) return 'Tablet';
  return 'Desktop';
};
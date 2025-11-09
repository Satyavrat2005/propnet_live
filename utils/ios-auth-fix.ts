/**
 * iOS PWA Auth Fix Utilities
 * Handles authentication state backup/restore for iOS PWA mode
 */

const IOS_AUTH_BACKUP_KEY = "ios_pwa_auth_backup";

export const iosAuthUtils = {
  /**
   * Check if the device is running iOS
   */
  isIOS(): boolean {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  /**
   * Check if the app is running in standalone (PWA) mode
   */
  isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  },

  /**
   * Backup user state to localStorage
   */
  backupUserState(user: any): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(IOS_AUTH_BACKUP_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Failed to backup user state", e);
    }
  },

  /**
   * Restore user state from localStorage
   */
  restoreUserState(): any | null {
    if (typeof window === "undefined") return null;
    try {
      const backup = localStorage.getItem(IOS_AUTH_BACKUP_KEY);
      return backup ? JSON.parse(backup) : null;
    } catch (e) {
      console.warn("Failed to restore user state", e);
      return null;
    }
  },

  /**
   * Clear the backup from localStorage
   */
  clearBackup(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(IOS_AUTH_BACKUP_KEY);
    } catch (e) {
      console.warn("Failed to clear backup", e);
    }
  },
};

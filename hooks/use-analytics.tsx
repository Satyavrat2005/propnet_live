"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./use-auth";

// Client-side analytics tracking
class ClientAnalytics {
  private sessionId: string | null = null;
  private startTime: number = Date.now();
  private pageViews: number = 0;
  private actions: number = 0;

  async initSession(userId: number) {
    if (this.sessionId) return this.sessionId;

    try {
      const deviceInfo = this.getDeviceInfo();
      const response = await fetch("/api/analytics/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deviceInfo }),
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.sessionId;
        return this.sessionId;
      }
    } catch (error) {
      // swallow; analytics should not break app
      // eslint-disable-next-line no-console
      console.warn("Analytics session start failed", error);
    }
    return null;
  }

  async endSession() {
    if (!this.sessionId) return;

    try {
      await fetch("/api/analytics/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: this.sessionId }),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Analytics session end failed", error);
    }

    this.sessionId = null;
  }

  async trackPageView(path: string, userId?: number) {
    this.pageViews++;
    // fire-and-forget; don't block render
    void this.trackEvent("page_view", "navigation", "page_visit", path, userId);
  }

  async trackEvent(
    eventType: string,
    category: string,
    action: string,
    label?: string,
    userId?: number,
    value?: number,
    metadata?: any
  ) {
    if (!this.sessionId && userId) {
      await this.initSession(userId);
    }

    if (!this.sessionId) return;

    this.actions++;

    try {
      await fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId: this.sessionId,
          eventType,
          category,
          action,
          label,
          value,
          metadata: {
            ...metadata,
            pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
            referrer: typeof document !== "undefined" ? document.referrer : "",
          },
        }),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Analytics event tracking failed", error);
    }
  }

  async trackOnboarding(userId: number, step: number, stepName: string) {
    void this.trackEvent("onboarding", "user_journey", "step_completed", stepName, userId, step);

    try {
      await fetch("/api/analytics/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, step, stepName }),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Onboarding tracking failed", error);
    }
  }

  private getDeviceInfo() {
    // guard for SSR (this module is client-only, but be defensive)
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const deviceType = /Mobile|Android|iPhone|iPad/.test(ua)
      ? "mobile"
      : /Tablet|iPad/.test(ua)
      ? "tablet"
      : "desktop";

    let browserName = "Unknown";
    if (ua.includes("Chrome")) browserName = "Chrome";
    else if (ua.includes("Firefox")) browserName = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browserName = "Safari";
    else if (ua.includes("Edge")) browserName = "Edge";

    let osName = "Unknown";
    if (ua.includes("Windows")) osName = "Windows";
    else if (ua.includes("Mac")) osName = "macOS";
    else if (ua.includes("Linux")) osName = "Linux";
    else if (ua.includes("Android")) osName = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iOS")) osName = "iOS";

    const screenResolution =
      typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "unknown";
    const timezone =
      typeof Intl !== "undefined" && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "unknown";

    return {
      deviceType,
      browserName,
      osName,
      userAgent: ua,
      ipAddress: "", // prefer to fill server-side for privacy
      screenResolution,
      timezone,
    };
  }
}

const analytics = new ClientAnalytics();

/**
 * useAnalytics
 * - Tracks page views (path changes) and manages session lifecycle
 */
export const useAnalytics = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const prevPathRef = useRef<string | null>(null);

  // track page view on path change
  useEffect(() => {
    // pathname may be undefined during SSR hydration; ensure client-only
    if (!pathname) return;

    // initialize prev if first run
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      void analytics.trackPageView(pathname, user?.id);
      return;
    }

    if (pathname !== prevPathRef.current) {
      void analytics.trackPageView(pathname, user?.id);
      prevPathRef.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user?.id]);

  // session lifecycle for authenticated users
  useEffect(() => {
    if (user?.id) {
      void analytics.initSession(user.id);
    }

    const handleUnload = () => {
      void analytics.endSession();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleUnload);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleUnload);
      }
      void analytics.endSession();
    };
  }, [user?.id]);
};

/**
 * useEventTracking
 * - Small wrapper that forwards event calls to the ClientAnalytics instance
 */
export const useEventTracking = () => {
  const { user } = useAuth();

  const trackEvent = (
    eventType: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: any
  ) => {
    void analytics.trackEvent(eventType, category, action, label, user?.id, value, metadata);
  };

  const trackOnboarding = (step: number, stepName: string) => {
    if (user?.id) {
      void analytics.trackOnboarding(user.id, step, stepName);
    }
  };

  const trackPropertyAction = (action: string, propertyId?: number) => {
    void trackEvent(
      "property_interaction",
      "property_management",
      action,
      propertyId?.toString(),
      propertyId
    );
  };

  const trackSearch = (query: string, filters?: any) => {
    void trackEvent("search", "property_discovery", "search_performed", query, undefined, filters);
  };

  const trackMessage = (action: "sent" | "received", recipientId?: number) => {
    void trackEvent(
      "messaging",
      "communication",
      `message_${action}`,
      recipientId?.toString(),
      recipientId
    );
  };

  return {
    trackEvent,
    trackOnboarding,
    trackPropertyAction,
    trackSearch,
    trackMessage,
  };
};

/**
 * Meta Pixel utility for tracking events
 * Pixel ID: 669522983730020
 */

// Type definitions for Meta Pixel
declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom',
      eventName: string,
      params?: Record<string, any>
    ) => void;
  }
}

/**
 * Track standard Facebook event
 */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, params);
      console.log(`📊 Meta Pixel: ${eventName}`, params);
    } catch (error) {
      console.error('Meta Pixel error:', error);
    }
  }
}

/**
 * Track custom Facebook event
 */
export function trackCustomMetaEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('trackCustom', eventName, params);
      console.log(`📊 Meta Pixel Custom: ${eventName}`, params);
    } catch (error) {
      console.error('Meta Pixel error:', error);
    }
  }
}

/**
 * Standard Meta Pixel events for CamionBack
 */
export const MetaPixelEvents = {
  // Page views
  viewSelectRole: () => {
    trackMetaEvent('ViewContent', { content_name: 'select_role' });
  },

  viewCompleteProfile: (role: string) => {
    trackMetaEvent('ViewContent', {
      content_name: 'complete_profile',
      role,
    });
  },

  // User actions
  selectRole: (role: 'client' | 'transporteur') => {
    trackCustomMetaEvent('SelectRole', { role });
  },

  login: (role: string) => {
    trackMetaEvent('Login', { role });
  },

  // Lead generation
  transporterRegistration: (data: {
    city: string;
    vehicleType: string;
    capacity: string;
  }) => {
    trackMetaEvent('Lead', {
      role: 'transporteur',
      city: data.city,
      vehicle_type: data.vehicleType,
      capacity: data.capacity,
      value: 0,
      currency: 'MAD',
    });
  },

  // Client actions
  createTransportRequest: (data: {
    fromCity: string;
    toCity: string;
    goodsType: string;
    budget?: string;
  }) => {
    trackCustomMetaEvent('CreateTransportRequest', {
      from_city: data.fromCity,
      to_city: data.toCity,
      goods_type: data.goodsType,
      budget: data.budget,
      currency: 'MAD',
    });
  },

  // Transporter actions
  submitOffer: (data: {
    requestId: string;
    amount: number;
  }) => {
    trackCustomMetaEvent('SubmitOffer', {
      request_id: data.requestId,
      amount: data.amount,
      currency: 'MAD',
    });
  },

  // Conversion events
  clientSelectsTransporter: (data: {
    requestId: string;
    amount: number;
  }) => {
    trackMetaEvent('Purchase', {
      value: data.amount,
      currency: 'MAD',
      content_type: 'transport_request',
      content_ids: [data.requestId],
    });
  },
};

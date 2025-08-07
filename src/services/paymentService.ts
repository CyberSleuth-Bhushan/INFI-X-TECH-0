// Firebase functions imports removed for free tier compatibility
// import { getFunctions, httpsCallable } from 'firebase/functions';

// Razorpay Payment Service
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOptions {
  amount: number; // Amount in paise (multiply by 100)
  currency: string;
  orderId: string;
  eventName: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create Razorpay order (client-side only for free tier)
export const createRazorpayOrder = async (amount: number, currency: string, receipt: string): Promise<any> => {
  try {
    // For free tier, we'll create a mock order
    // In production, this should call your backend
    const mockOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: currency,
      receipt: receipt,
      status: 'created'
    };
    
    console.log('Mock order created:', mockOrder);
    return mockOrder;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order. Please try again.');
  }
};

// Process payment with Razorpay
export const processPayment = async (options: PaymentOptions): Promise<PaymentResponse> => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    return new Promise((resolve) => {
      // Check if Razorpay key is configured
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay configuration is missing. Please contact support.');
      }

      const razorpayOptions = {
        key: razorpayKey,
        amount: options.amount,
        currency: options.currency,
        name: 'INFI X TECH',
        description: `Payment for ${options.eventName}`,
        order_id: options.orderId,
        image: '/assets/images/IXT.png',
        handler: function (response: any) {
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });
        },
        prefill: {
          name: options.participantName,
          email: options.participantEmail,
          contact: options.participantPhone
        },
        notes: {
          event_name: options.eventName,
          participant_email: options.participantEmail
        },
        theme: {
          color: '#2563eb' // Primary color
        },
        modal: {
          ondismiss: function () {
            resolve({
              success: false,
              error: 'Payment cancelled by user'
            });
          }
        }
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    };
  }
};

// Verify payment (client-side only for free tier)
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<any> => {
  try {
    // For free tier, we'll do basic validation
    // In production, this should call your backend for proper verification
    if (!paymentId || !orderId || !signature) {
      throw new Error('Missing payment verification data');
    }
    
    console.log('Payment verification (mock):', { paymentId, orderId, signature });
    
    // Mock successful verification
    return {
      status: 'success',
      verified: true,
      message: 'Payment verified successfully'
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Payment verification failed. Please contact support.');
  }
};

// Format amount for display
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount / 100);
};

// Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Update payment status in database
export const updatePaymentStatus = async (
  registrationId: string,
  status: PaymentStatus,
  paymentDetails?: {
    paymentId: string;
    orderId: string;
    signature: string;
  }
): Promise<void> => {
  try {
    // This would typically update your database
    // For now, we'll just log the status update
    console.log('Payment status updated:', {
      registrationId,
      status,
      paymentDetails
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};
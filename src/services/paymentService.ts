import { getFunctions, httpsCallable } from 'firebase/functions';

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

// Create Razorpay order
export const createRazorpayOrder = async (amount: number, currency: string, receipt: string): Promise<any> => {
  const functions = getFunctions();
  const createOrder = httpsCallable(functions, 'createRazorpayOrder');
  const result = await createOrder({ amount, currency, receipt });
  return result.data;
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
      const razorpayOptions = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
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

// Verify payment
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<any> => {
  const functions = getFunctions();
  const verify = httpsCallable(functions, 'verifyRazorpayPayment');
  const result = await verify({ payment_id: paymentId, order_id: orderId, signature });
  return result.data;
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
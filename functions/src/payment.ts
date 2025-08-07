import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Razorpay from "razorpay";

admin.initializeApp();

// Use environment variables instead of deprecated functions.config()
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_cXc17rjMexZCLQ",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "vBiiYrVQpr5p5AXyBFdusT2L",
});

export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.amount || !data.currency || !data.receipt) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required payment parameters.");
    }

    const { amount, currency, receipt } = data;

    const options = {
      amount: amount,
      currency: currency,
      receipt: receipt,
    };

    console.log("Creating Razorpay order with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created successfully:", order.id);
    
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError("internal", "Could not create Razorpay order. Please try again.");
  }
});

export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.order_id || !data.payment_id || !data.signature) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required verification parameters.");
    }

    const { order_id, payment_id, signature } = data;

    const body = order_id + "|" + payment_id;

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "vBiiYrVQpr5p5AXyBFdusT2L")
      .update(body.toString())
      .digest("hex");

    console.log("Verifying payment signature for order:", order_id);

    if (expectedSignature === signature) {
      console.log("Payment verification successful for order:", order_id);
      return { status: "success", verified: true };
    } else {
      console.error("Payment signature verification failed for order:", order_id);
      throw new functions.https.HttpsError("permission-denied", "Invalid payment signature.");
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError("internal", "Payment verification failed. Please contact support.");
  }
});

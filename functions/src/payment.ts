import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Razorpay from "razorpay";

admin.initializeApp();

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  const { amount, currency, receipt } = data;

  const options = {
    amount: amount,
    currency: currency,
    receipt: receipt,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw new functions.https.HttpsError("internal", "Could not create Razorpay order.");
  }
});

export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  const { order_id, payment_id, signature } = data;

  const body = order_id + "|" + payment_id;

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", functions.config().razorpay.key_secret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === signature) {
    return { status: "success" };
  } else {
    throw new functions.https.HttpsError("internal", "Invalid payment signature.");
  }
});

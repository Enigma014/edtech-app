const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// ✅ health check
app.get("/", (req, res) => res.send("API is running"));

// ✅ Razorpay instance (from firebase config)
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

// ✅ Create order
app.post("/createOrder", async (req, res) => {
  try {
    const {amount, uid, planType} = req.body;

    if (!amount || !uid || !planType) {
      return res.status(400).json({error: "Missing required fields"});
    }

    const order = await razorpay.orders.create({
      amount, // paise
      currency: "INR",
      receipt: `receipt_${uid}_${Date.now()}`,
      payment_capture: 1,
    });

    return res.json({order});
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({error: "Failed to create order"});
  }
});

// ✅ Verify payment + Set subscription expiry
app.post("/verifyPayment", async (req, res) => {
  try {
    const {
      razorpayOrderid,
      razorpayPaymentid,
      razorpaySignature,
      planType,
      uid,
    } = req.body;

    if (
      !razorpayOrderid ||
      !razorpayPaymentid ||
      !razorpaySignature ||
      !uid ||
      !planType
    ) {
      return res.status(400).json({success: false, error: "Missing fields"});
    }

    // ✅ Verify signature
    const body = `${razorpayOrderid}|${razorpayPaymentid}`;
    const expectedSignature = crypto
        .createHmac("sha256", functions.config().razorpay.key_secret)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpaySignature)
    {return res
        .status(400)
        .json({success: false, error: "Invalid signature"});
    }

    // ✅ Save payment record
    await db.collection("payments").doc(razorpayPaymentid).set({
      uid,
      planType,
      razorpayOrderid,
      razorpayPaymentid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ✅ expiry
    const expiresAt = admin.firestore.Timestamp.fromMillis(
        Date.now() +
        (planType === "trial"?
               10 * 24 * 60 * 60 * 1000:
             365 * 24 * 60 * 60 * 1000),
    );

    await db.collection("users").doc(uid).set(
        {
          subscription: {
            plan: planType,
            active: true,
            expiresAt,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
        {merge: true},
    );

    return res.json({success: true});
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({success: false, error: "Server error"});
  }
});

exports.api = functions.https.onRequest(app);
const {RtcTokenBuilder, RtcRole} = require("agora-token");

app.post("/getAgoraToken", async (req, res) => {
  try {
    const {channelName, uid, role} = req.body;
    if (!channelName || !uid || !role) {
      return res.status(400).json({error: "Missing params"});
    }

    const appId = functions.config().agora.app_id;
    const appCert = functions.config().agora.app_cert;

    const expirationTimeInSeconds = 60 * 60; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const agoraRole =
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // uid can be numeric; if yours is string, convert consistently
    const numericUid =
      typeof uid === "string" ? 
      parseInt(uid.replace(/\D/g, "").slice(0, 9) || "1", 10) : uid;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCert,
        channelName,
        numericUid,
        agoraRole,
        privilegeExpiredTs,
    );

    return res.json({token, appId, uid: numericUid});
  } catch (err) {
    console.error(err);
    return res.status(500).json({error: String(err)});
  }
});

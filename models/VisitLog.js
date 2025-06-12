// models/VisitLog.js
const mongoose = require("mongoose");

const VisitLogSchema = new mongoose.Schema({
  shortCode: { type: String, index: true },
  ip: String,

  // First Log Details
  firstLog_timestamp: Date,
  firstLog_userAgent: String,
  firstLog_referrer: String,
  firstLog_language: String,
  firstLog_platform: String,

  // User Profile Inference
  likelyDeviceType: String,
  probableOS: String,
  techSavviness: String,
  potentialWorkplace: String,

  // Geolocation Info
  geoSource: String,
  country: String,
  countryCode: String,
  region: String,
  city: String,
  zip: String,
  lat: Number,
  lon: Number,
  timezone: String,
  isp: String,
  org: String,
  as: String,
  mobile: Boolean,
  proxy: Boolean,
  hosting: Boolean,

  // Network & Device Behavior
  connectionType: String,
  batteryCharging: Boolean,
  batteryLevel: Number,
  preferredColorScheme: String,

  // Fingerprint Hashes
  canvasHash: String,
  webglHash: String,
  fontHash: String,

  // Location Verification
  browserTimezone: String,
  timezoneMismatch: Boolean,
  usingVPN: Boolean,

  // Raw Data
  rawLocation: mongoose.Schema.Types.Mixed,
  rawFingerprint: mongoose.Schema.Types.Mixed,
  fullAnalysis: mongoose.Schema.Types.Mixed,

  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VisitLog", VisitLogSchema);

const mongoose = require("mongoose");

const visitLogSchema = new mongoose.Schema({
  shortCode: String,
  ip: String,
  location: {
    country: String,
    regionName: String,
    city: String,
    zip: String,
    lat: Number,
    lon: Number,
    isp: String,
    org: String,
    as: String
  },
  timestamp: { type: Date, default: Date.now },
  info: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model("VisitLog", visitLogSchema);

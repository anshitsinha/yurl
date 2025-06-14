const express = require("express");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const ShortUrl = require("./models/shortUrl");
const app = express();
const VisitLog = require("./models/VisitLog");
const mongoURI =
  "mongodb+srv://ansi:123@yurl.w55quqf.mongodb.net/urlShortener?retryWrites=true&w=majority&appName=yurl";

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.get("/admin", async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render("index", { shortUrls: shortUrls });
});
app.get("/", async (req, res) => {
  res.render("home");
});

app.post("/shortUrls", async (req, res) => {
  const { fullUrl, customAlias } = req.body;

  // Check if custom alias exists
  if (customAlias) {
    const existing = await ShortUrl.findOne({ short: customAlias });
    if (existing) {
      return res.send(
        "❌ Custom short URL already taken. Please choose another."
      );
    }

    await ShortUrl.create({ full: fullUrl, short: customAlias });
  } else {
    // Auto-generate short if no custom alias provided
    const randomShort = crypto.randomBytes(3).toString("hex");
    await ShortUrl.create({ full: fullUrl, short: randomShort });
  }

  res.redirect("/admin");
});

app.get("/stats/:shortCode", async (req, res) => {
  const shortCode = req.params.shortCode;
  const shortUrl = await ShortUrl.findOne({ short: shortCode });
  const i = shortUrl.full;

  if (!shortUrl) return res.status(404).send("Short URL not found");

  logs = await VisitLog.find({ shortCode: i })
    .sort({ "data.timestamp": -1 })
    .limit(100); // Limit to 100 logs for performance

  console.log(logs);
  res.render("stats", { shortUrl, logs });
});

app.get("/:shortUrl", async (req, res) => {
  if (req.params.shortUrl === "admin") {
    return res.redirect("/admin");
  }
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (!shortUrl) return res.sendStatus(404);
  shortUrl.clicks++;
  shortUrl.save();

  const firstLog = {
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"] || req.headers["referrer"],
    language: req.headers["accept-language"],
    timestamp: new Date(),
    shortUrl: req.params.shortUrl,
  };

  // Log to server (optional)
  console.log(`Tracking visit to: ${req.params.shortUrl} => ${shortUrl.full}`);

  // Render EJS with redirect URL
  res.render("logAndRedirect", { redirectUrl: shortUrl.full, firstLog });
});

const axios = require("axios");

app.post("/log-visit", express.json(), async (req, res) => {
  const shortCode = req.query.short || "unknown";
  const { firstLog, ...fingerprintData } = req.body;

  // Get IP information (even if behind proxy)
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    "unknown";

  res.status(200).send("Logged");

  // Enhanced geolocation with multiple fallback providers
  let location = {};
  try {
    // Try primary geolocation provider
    const geoRes = await axios.get(
      `http://ip-api.com/json/${ip}?fields=66842623`
    );
    if (geoRes.data.status === "success") {
      location = {
        source: "ip-api.com",
        country: geoRes.data.country,
        countryCode: geoRes.data.countryCode,
        region: geoRes.data.region,
        regionName: geoRes.data.regionName,
        city: geoRes.data.city,
        zip: geoRes.data.zip,
        lat: geoRes.data.lat,
        lon: geoRes.data.lon,
        timezone: geoRes.data.timezone,
        isp: geoRes.data.isp,
        org: geoRes.data.org,
        as: geoRes.data.as,
        mobile: geoRes.data.mobile,
        proxy: geoRes.data.proxy,
        hosting: geoRes.data.hosting,
      };
    } else {
      // Fallback to alternative provider
      const fallbackRes = await axios.get(`https://ipapi.co/${ip}/json/`);
      location = {
        source: "ipapi.co",
        country: fallbackRes.data.country_name,
        countryCode: fallbackRes.data.country_code,
        region: fallbackRes.data.region,
        city: fallbackRes.data.city,
        postal: fallbackRes.data.postal,
        latitude: fallbackRes.data.latitude,
        longitude: fallbackRes.data.longitude,
        timezone: fallbackRes.data.timezone,
        asn: fallbackRes.data.asn,
        org: fallbackRes.data.org,
      };
    }
  } catch (err) {
    console.warn("❌ Geolocation failed:", err.message);
  }

  // Simulate attacker use cases
  const attackAnalysis = {
    // 1. Device Fingerprinting
    deviceFingerprint: {
      uniquenessScore: calculateUniquenessScore(fingerprintData),
      trackingPotential:
        "This combination of GPU, screen, and fonts makes this device highly trackable",
    },

    // 2. Browser Exploit Detection
    potentialExploits: analyzeForExploits(fingerprintData),

    // 3. User Profiling
    userProfile: {
      likelyDeviceType: getDeviceType(fingerprintData),
      probableOS: getProbableOS(fingerprintData),
      techSavviness: estimateTechSavviness(fingerprintData),
      potentialWorkplace: fingerprintData.plugins.some((p) =>
        p.name.includes("Enterprise")
      )
        ? "Corporate environment"
        : "Personal device",
    },

    // 4. Location Verification
    locationVerification: {
      ipBasedLocation: location,
      browserTimezone: fingerprintData.timezoneInfo.timezone,
      mismatch:
        location.timezone && fingerprintData.timezoneInfo.timezone
          ? !timezonesMatch(
              location.timezone,
              fingerprintData.timezoneInfo.timezone
            )
          : null,
      vpnDetection: location.proxy || location.hosting,
    },

    // 5. Behavioral Analysis
    behaviorAnalysis: {
      connectionType: fingerprintData.networkInfo.effectiveType,
      batteryStatus: fingerprintData.batteryInfo,
      preferredColorScheme: fingerprintData.preferences.darkMode
        ? "dark"
        : "light",
    },

    // 6. Cross-Site Tracking Potential
    trackingPotential: {
      canvasHash: generateCanvasHash(fingerprintData.canvasFingerprint),
      webglHash: generateWebGLHash(fingerprintData.webglParams),
      fontHash: generateFontHash(fingerprintData.fontList),
    },
  };

  // Enhanced logging
  console.log("=== FULL ATTACK ANALYSIS ===");
  console.log("IP:", ip);
  console.log("Raw Location Data:", location);
  console.log("Fingerprint Data:", fingerprintData);
  console.log("Attack Potential Analysis:", attackAnalysis);
  console.log("Tracking Hashes:", {
    canvas: attackAnalysis.trackingPotential.canvasHash,
    webgl: attackAnalysis.trackingPotential.webglHash,
    fonts: attackAnalysis.trackingPotential.fontHash,
  });

  try {
    // Store in database with all analysis
    await VisitLog.create({
      shortCode: shortCode || null,
      ip: ip || null,

      // Flattened firstLog (fixed keys)
      firstLog_timestamp: firstLog?.timestamp || null,
      firstLog_userAgent: firstLog?.userAgent || null,
      firstLog_referer: firstLog?.referer || null, // ✅ fixed spelling
      firstLog_language: firstLog?.language || null,
      firstLog_platform: fingerprintData?.platform || null, // ✅ moved from fingerprintData

      // Flattened user profile
      likelyDeviceType: attackAnalysis.userProfile?.likelyDeviceType || null,
      probableOS: attackAnalysis.userProfile?.probableOS || null,
      techSavviness: attackAnalysis.userProfile?.techSavviness || null,
      potentialWorkplace:
        attackAnalysis.userProfile?.potentialWorkplace || null,

      // Flattened location info
      geoSource: location.source || null,
      country: location.country || location.country_name || null,
      countryCode: location.countryCode || location.country_code || null,
      region: location.region || location.regionName || null,
      city: location.city || null,
      zip: location.zip || location.postal || null,
      lat: location.lat || location.latitude || null,
      lon: location.lon || location.longitude || null,
      timezone: location.timezone || null,
      isp: location.isp || null,
      org: location.org || null,
      as: location.as || location.asn || null,
      mobile: location.mobile ?? null,
      proxy: location.proxy ?? null,
      hosting: location.hosting ?? null,

      // Flattened behavior data
      connectionType: fingerprintData.networkInfo?.effectiveType || null,
      batteryCharging: fingerprintData.batteryInfo?.charging ?? null,
      batteryLevel: fingerprintData.batteryInfo?.level ?? null,
      preferredColorScheme:
        fingerprintData.preferences?.darkMode === true
          ? "dark"
          : fingerprintData.preferences?.darkMode === false
          ? "light"
          : null,

      // Flattened fingerprint hashes
      canvasHash: attackAnalysis.trackingPotential?.canvasHash || null,
      webglHash: attackAnalysis.trackingPotential?.webglHash || null,
      fontHash: attackAnalysis.trackingPotential?.fontHash || null,

      // Timezone mismatch + VPN info
      browserTimezone: fingerprintData.timezoneInfo?.timezone || null,
      timezoneMismatch:
        location.timezone && fingerprintData.timezoneInfo?.timezone
          ? !timezonesMatch(
              location.timezone,
              fingerprintData.timezoneInfo.timezone
            )
          : null,
      usingVPN: location.proxy ?? location.hosting ?? null,

      // Raw data
      rawLocation: location || null,
      rawFingerprint: fingerprintData || null,
      fullAnalysis: attackAnalysis || null,

      timestamp: new Date(),
    });
  } catch (err) {
    console.error("❌ Visit logging failed:", err);
    res.status(500).send("Error storing visit");
  }
});

// Helper functions attackers might use

function getProbableOS(data) {
  const ua = data.userAgent.toLowerCase();

  if (ua.includes("windows nt")) {
    const versionMatch = ua.match(/windows nt (\d+\.\d+)/);
    if (versionMatch) {
      const version = parseFloat(versionMatch[1]);
      if (version >= 10) return "Windows 10/11";
      if (version === 6.3) return "Windows 8.1";
      if (version === 6.2) return "Windows 8";
      if (version === 6.1) return "Windows 7";
    }
    return "Windows";
  }
  if (ua.includes("macintosh") || ua.includes("mac os x")) {
    const versionMatch = ua.match(/mac os x (\d+[._]\d+)/);
    if (versionMatch) {
      return `macOS ${versionMatch[1].replace("_", ".")}`;
    }
    return "macOS";
  }
  if (ua.includes("linux")) return "Linux";
  if (ua.includes("android")) return "Android";
  if (ua.includes("ios") || ua.includes("iphone")) return "iOS";

  return "Unknown OS";
}

function calculateUniquenessScore(data) {
  let score = 0;
  if (data.gpuInfo.renderer) score += 25;
  if (data.canvasFingerprint) score += 20;
  if (data.fontList.length > 5) score += 15;
  if (data.webglParams.RENDERER) score += 10;
  if (data.audioFingerprint) score += 10;
  if (data.deviceMemory) score += 5;
  if (data.hardwareConcurrency) score += 5;
  if (data.screenInfo.devicePixelRatio !== 1) score += 5;
  return Math.min(100, score);
}

function analyzeForExploits(data) {
  const exploits = [];
  // Check for old browser versions
  const ua = data.userAgent.toLowerCase();
  if (ua.includes("chrome/") && parseInt(ua.split("chrome/")[1]) < 80) {
    exploits.push("Potential Chrome RCE vulnerabilities");
  }

  // Check WebGL vulnerabilities
  if (
    data.webglParams.VERSION &&
    data.webglParams.VERSION.includes("WebGL 1.0")
  ) {
    exploits.push("WebGL 1.0 may have texture handling vulnerabilities");
  }

  // Check for vulnerable plugins
  if (data.plugins.some((p) => p.name.includes("Java"))) {
    exploits.push("Java plugin detected - potential exploitation vector");
  }

  return exploits.length
    ? exploits
    : "No obvious exploit opportunities detected";
}

function getDeviceType(data) {
  if (data.deviceMemory < 2) return "Low-end mobile device";
  if (data.maxTouchPoints > 0) {
    return data.screenInfo.width < 768 ? "Smartphone" : "Tablet";
  }
  return "Desktop/Laptop";
}

function estimateTechSavviness(data) {
  let score = 50;
  if (data.userAgent.includes("Firefox")) score += 10;
  if (data.userAgent.includes("Chrome") && !data.userAgent.includes("Edg"))
    score += 5;
  if (data.doNotTrack === "1") score += 15;
  if (data.plugins.length < 3) score += 10;
  return score > 70 ? "Tech-savvy" : score > 30 ? "Average" : "Basic user";
}

function timezonesMatch(ipTz, browserTz) {
  // Simple timezone matching - could be enhanced
  return ipTz.replace(/_.*$/, "") === browserTz.replace(/\/.*$/, "");
}

function generateCanvasHash(canvasData) {
  // Simple hash generation - real attackers would use more sophisticated methods
  return crypto.createHash("sha256").update(canvasData).digest("hex");
}

function generateWebGLHash(webglData) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(webglData))
    .digest("hex");
}

function generateFontHash(fontList) {
  return crypto.createHash("sha256").update(fontList).digest("hex");
}

app.listen(process.env.PORT || 5000);

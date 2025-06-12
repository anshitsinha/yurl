const express = require("express");
const mongoose = require("mongoose");
const ShortUrl = require("./models/shortUrl");
const app = express();

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

app.post("/shortUrls", async (req, res) => {
  await ShortUrl.create({ full: req.body.fullUrl });

  res.redirect("/");
});

app.get("/:shortUrl", async (req, res) => {
  if (req.params.shortUrl === "admin") {
    return res.redirect("/admin");
  }
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (!shortUrl) return res.sendStatus(404);
  shortUrl.clicks++;
  shortUrl.save();

  // Log to server (optional)
  console.log(`Tracking visit to: ${req.params.shortUrl} => ${shortUrl.full}`);

  // Render EJS with redirect URL
  res.render("logAndRedirect", { redirectUrl: shortUrl.full });
});

const VisitLog = require("./models/VisitLog");

const axios = require("axios");

app.post("/log-visit", express.json(), async (req, res) => {
  const shortCode = req.query.short || "unknown";

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress ||
    "unknown";

  let location = {};
  try {
    const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
    console.log(geoRes);
    if (geoRes.data.status === "success") {
      location = {
        country: geoRes.data.country,
        regionName: geoRes.data.regionName,
        city: geoRes.data.city,
        zip: geoRes.data.zip,
        lat: geoRes.data.lat,
        lon: geoRes.data.lon,
        isp: geoRes.data.isp,
        org: geoRes.data.org,
        as: geoRes.data.as,
      };
    }
  } catch (err) {
    console.warn("❌ Failed to fetch IP geolocation:", err.message);
  }

  console.log(location, "Logged with location");

  try {
    await VisitLog.create({
      data: {
        shortCode,
        ip,
        location,
        info: req.body,
      },
    });

    res.status(200).send("Logged with location");
  } catch (err) {
    console.error("❌ Visit logging failed:", err);
    res.status(500).send("Error storing visit");
  }
});

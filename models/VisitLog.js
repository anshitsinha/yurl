const mongoose = require("mongoose");

const visitLogSchema = new mongoose.Schema(
  {
    data: mongoose.Schema.Types.Mixed, // this holds everything
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("VisitLog", visitLogSchema);

const mongoose = require("mongoose");

const reporteSchema = new mongoose.Schema({
  choferId: String,
  ubicacion: { lat: Number, lng: Number },
  estado: String,
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reporte", reporteSchema);

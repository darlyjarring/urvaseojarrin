const mongoose = require("mongoose");

const reporteSchema = new mongoose.Schema({
  choferId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ubicacion: { lat: Number, lng: Number },
  estado: { type: String, enum: ["Cumplida", "En proceso", "Pendiente"] },
  observacion: { type: String },
  fecha: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Reporte", reporteSchema);

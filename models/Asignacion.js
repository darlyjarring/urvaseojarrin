const mongoose = require("mongoose");

const AsignacionSchema = new mongoose.Schema({
  choferId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  placa: { type: String, required: true },
  turno: { type: String, required: true }, // 07:00-15:00, 15:00-23:00, 23:00-07:00
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Asignacion", AsignacionSchema);

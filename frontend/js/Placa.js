const mongoose = require("mongoose");

const PlacaSchema = new mongoose.Schema({
  placa: { type: String, required: true, unique: true },  // Placa del vehículo
  marca: { type: String },   // opcional
  modelo: { type: String },  // opcional
  activo: { type: Boolean, default: true }  // si el vehículo está disponible
});

module.exports = mongoose.model("Placa", PlacaSchema);

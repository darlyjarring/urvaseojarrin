const mongoose = require("mongoose");
const PlacaSchema = new mongoose.Schema({
  placa: { type: String, required: true, unique: true },
  marca: { type: String },
  modelo: { type: String },
  activo: { type: Boolean, default: true }
});
module.exports = mongoose.model("Placa", PlacaSchema);

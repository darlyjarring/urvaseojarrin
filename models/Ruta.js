const mongoose = require("mongoose");

const rutaSchema = new mongoose.Schema({
  supervisorId: String,
  choferId: String,
  puntos: [String], // nombres de áreas o coordenadas
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ruta", rutaSchema);

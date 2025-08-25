const mongoose = require("mongoose");

const TareaSchema = new mongoose.Schema({
  placa: { type: String, required: true },       // Vehículo asignado
  sector: { type: String, required: true },     // Sector / Ruta
  ubicacion: { lat: Number, lng: Number },      // Opcional
  estado: { 
    type: String, 
    enum: ["pendiente", "ejecutando", "ejecutada", "reportada"], 
    default: "pendiente" 
  },
  turno: { type: String, required: true },      // 07:00-15:00, etc.
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Tarea", TareaSchema);

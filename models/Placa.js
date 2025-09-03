// models/Placa.js
const mongoose = require("mongoose");

const PlacaSchema = new mongoose.Schema({
  placa: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  estado: { 
    type: String, 
    enum: ["activo", "inactivo"], 
    default: "activo" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Placa", PlacaSchema);

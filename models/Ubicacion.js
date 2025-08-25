const mongoose = require("mongoose");

const ubicacionSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  estado: {
    type: String,
    enum: ["operativo", "dañado"],
    default: "operativo"
  },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

module.exports = mongoose.model("Ubicacion", ubicacionSchema);

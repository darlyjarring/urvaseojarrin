const mongoose = require("mongoose");

const puntoSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  estado: {
    type: String,
    enum: ["Pendiente", "En proceso", "Terminada"],
    default: "Pendiente"
  },
});

const rutaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  choferId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  puntos: [puntoSchema],
  fecha: { type: Date, default: Date.now },
  completada: { type: Boolean, default: false },
});

module.exports = mongoose.model("Ruta", rutaSchema);

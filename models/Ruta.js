const mongoose = require("mongoose");
const rutaSchema = new mongoose.Schema({
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  choferId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  puntos: [{ lat: Number, lng: Number, estado: String }],
  fecha: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Ruta", rutaSchema);

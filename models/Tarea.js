const mongoose = require("mongoose");

const TareaSchema = new mongoose.Schema({
  placa: { type: String, required: true },
  sector: { type: String, required: true },
  // 💡 Referencia a la ruta para poder obtener sus puntos
  rutaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ruta",
    required: true,
  },
  estado: {
    type: String,
    enum: ["pendiente", "ejecutando", "ejecutada"],
    default: "pendiente",
  },
  turno: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tarea", TareaSchema);

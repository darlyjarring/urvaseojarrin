const mongoose = require("mongoose");

const TareaSchema = new mongoose.Schema({
  placa: { type: String, required: true },
  sector: { type: String, required: true },
  turno: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  // 💡 Campo general para el estado de la tarea (pendiente hasta que se complete toda la ruta)
  estado: {
    type: String,
    enum: ["pendiente", "terminada"],
    default: "pendiente",
  },
  // Referencia a la ruta para obtener sus puntos
  rutaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ruta",
    required: true,
  },
  // Campo para rastrear el estado de cada punto de la ruta
  estados_detareaxelemntoderuta: [{
    puntoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "en proceso", "terminada"],
      default: "pendiente"
    },
    // Estado del contenedor
    estadoContenedor: {
      type: String,
      enum: ["pendiente", "en proceso", "terminada"],
      default: "pendiente"
    },
  }],
});

module.exports = mongoose.model("Tarea", TareaSchema);

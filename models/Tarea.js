const mongoose = require("mongoose");

const TareaSchema = new mongoose.Schema({
  placa: { type: String, required: true },
  sector: { type: String, required: true },
  turno: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  // Estado general de la tarea.
  // Será "terminada" solo cuando todos los puntos estén completados.
  estado: {
    type: String,
    enum: ["pendiente", "terminada"],
    default: "pendiente",
  },
  // Referencia a la ruta para obtener sus puntos.
  rutaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ruta",
    required: true,
  },
  // Campo que almacena el estado de cada punto de la ruta individualmente.
  // Solo con los estados del proceso de trabajo.
  estados_detareaxelemntoderuta: [{
    puntoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "en proceso", "ejecutada"],
      default: "pendiente"
    },
  }],
});

module.exports = mongoose.model("Tarea", TareaSchema);

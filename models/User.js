const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },  // puede ser el correo
  password: { type: String, required: true },
  role: { type: String, enum: ["chofer", "supervisor", "admin"], required: true }
});

module.exports = mongoose.model("User", UserSchema);

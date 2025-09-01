// models/Lotofacil.js
import mongoose from "mongoose";

const LotofacilSchema = new mongoose.Schema({
  concurso: { type: Number, required: true, unique: true },
  dezenas: { type: [String], required: true },
});

export default mongoose.model("Lotofacil", LotofacilSchema);

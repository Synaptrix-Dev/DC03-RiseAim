import mongoose from "mongoose";

const cadastrialSchema = new mongoose.Schema({
    code: { type: String, required: true, },
    name: { type: String, required: true, },
});

const Cadastrial = mongoose.model("cadastrial-num", cadastrialSchema);

export default Cadastrial;

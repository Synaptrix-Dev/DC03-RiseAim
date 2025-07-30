import mongoose from "mongoose";

const regionsSchema = new mongoose.Schema({
    name: { type: String, required: true, },
});

const Regions = mongoose.model("regions", regionsSchema);

export default Regions;

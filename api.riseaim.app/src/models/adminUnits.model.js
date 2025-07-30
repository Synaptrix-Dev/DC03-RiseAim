import mongoose from "mongoose";

const adminUnitSchema = new mongoose.Schema({
    name: { type: String, required: true, },
});

const AdminUnits = mongoose.model("adminUnits", adminUnitSchema);

export default AdminUnits;

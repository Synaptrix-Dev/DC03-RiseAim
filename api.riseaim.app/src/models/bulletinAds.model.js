import mongoose from "mongoose";

const bulletinAdsSchema = new mongoose.Schema(
  {
    adName: { type: String, required: true },
    adminUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "adminUnits",
      required: true,
    },
    cadastralNum: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cadastrial-num",
        required: true,
      },
    ],
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "regions",
      required: true,
    },
    additionalCadastralNum: { type: String },
    plotNum: { type: [Number], required: true },
    landType: {
      type: String,
      enum: [
        "meadow",
        "field",
        "forest",
        "building_land",
        "building_on_land",
        "building_garden",
        "apartment",
        "commercial_property",
        "other",
      ],
      required: true,
    },
    ownershipShare: { type: [Number], required: true },
    areaInM2: { type: [Number], required: true },
    pricePerM2: { type: Number },
    packageSale: { type: Boolean, required: true },
    totalPrice: { type: Number },
    remarks: { type: String },
    location: {
      address: { type: String },
      latLong: { type: [Number] },
    },
    buildingType: {
      type: String,
      enum: [
        "apartment",
        "house",
        "weekend_house",
        "farm",
        "office",
        "warehouse",
        "garage",
        "other",
      ],
      required: true,
    },
    urlLink: { type: String },
    publicationDate: { type: Date, required: true },
    expirationDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "pending", "approved"],
      default: "active",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    adminApproval: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BulletinAds = mongoose.model("BulletinAds", bulletinAdsSchema);
export default BulletinAds;
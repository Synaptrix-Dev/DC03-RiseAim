import mongoose from "mongoose";

const auctionAdsSchema = new mongoose.Schema(
  {
    adName: { 
      type: String, 
      required: [true, "Advertisement name is required"], 
      trim: true 
    },
    adminUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "adminUnits",
      required: [true, "Administrative unit is required"],
    },
    cadastralNum: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cadastrial-num",
        required: [true, "At least one cadastral number is required"],
      },
    ],
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "regions",
      required: [true, "Region is required"],
    },
    additionalCadastralNum: { type: String, trim: true },
    plotNum: { 
      type: [Number], 
      required: [true, "At least one plot number is required"], 
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one plot number is required",
      },
    },
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
      required: [true, "Land type is required"],
      trim: true,
    },
    ownershipShare: { 
      type: [Number], 
      required: [true, "At least one ownership share is required"], 
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one ownership share is required",
      },
    },
    areaInM2: { 
      type: [Number], 
      required: [true, "At least one area value is required"], 
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one area value is required",
      },
    },
    pricePerM2: { type: Number },
    packageSale: { 
      type: Boolean, 
      required: [true, "Package sale is required"], 
      default: false 
    },
    totalPrice: { type: Number },
    startingPrice: { type: Number },
    securityDeposit: { type: Number },
    remarks: { type: String, trim: true },
    location: {
      address: { type: String, trim: true },
      latLong: { type: [Number], default: [] },
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
      required: [true, "Building type is required"],
      trim: true,
    },
    urlLink: { type: String, trim: true },
    yearBuilt: { type: Number },
    publicationDate: { 
      type: Date, 
      required: [true, "Publication date is required"] 
    },
    expirationDate: { 
      type: Date, 
      required: [true, "Expiration date is required"],
      validate: {
        validator: function (value) {
          return this.publicationDate < value;
        },
        message: "Expiration date must be after publication date",
      },
    },
    status: {
      type: String,
      enum: ["active", "pending", "approved"],
      default: "active",
      trim: true,
    },
    salesMethod: {
      type: String,
      enum: [
        "Traditional sales",
        "Online sales",
        "Public tendering",
        "Auction with increasing price",
        "Commission sale",
        "Sale with non-binding collection of offers",
        "Sale with binding collection of offers",
      ],
      trim: true,
    },
    auctionDate: { type: Date },
    salesLocationName: { type: String, trim: true },
    salesLocationAddress: { type: String, trim: true },
    auctionSpace: { type: String, trim: true },
    auctionSequence: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminApproval: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AuctionAds = mongoose.model("AuctionAds", auctionAdsSchema);
export default AuctionAds;
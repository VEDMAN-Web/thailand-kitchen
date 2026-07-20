import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    whatsappNumber: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    cityName: { type: String, required: true },
    countryName: { type: String, required: true },
    message: { type: String },
  },
  { timestamps: true }
);

export const Contact =
  mongoose.models.User || mongoose.model("User", contactSchema);

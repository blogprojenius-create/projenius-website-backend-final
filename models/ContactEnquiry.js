import mongoose from "mongoose";

const contactEnquirySchema = new mongoose.Schema(
  {
    enquiryType: {
      type: String,
      required: true,
    },

    sourcePage: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
    },

    organisation: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      default: "",
    },

    enquirySpecificFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    attachment: {
      name: String,
      type: String,
      size: Number,
    },

    submissionId: {
      type: String,
      required: true,
      unique: true,
    },

    emailStatus: {
      admin: {
        type: Boolean,
        default: false,
      },

      client: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ContactEnquiry",
  contactEnquirySchema
);
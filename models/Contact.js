const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
    {
        fileId: { type: String, default: "" },
        name: { type: String, default: "" },
        filename: { type: String, default: "" },
        type: { type: String, default: "" },
        size: { type: Number, default: 0 },
        url: { type: String, default: "" },
        storage: { type: String, default: "mongodb-gridfs" },
    },
    { _id: false }
);

const contactSchema = new mongoose.Schema(
    {
        enquiryType: {
            type: String,
            required: true,
            trim: true,
        },
        sourcePage: {
            type: String,
            default: "website",
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 150,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30,
        },
        organisation: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150,
        },
        city: {
            type: String,
            default: "",
            trim: true,
            maxlength: 100,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        enquirySpecificFields: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        attachment: {
            type: attachmentSchema,
            default: null,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        submissionId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["new", "contacted", "in-progress", "completed", "closed"],
            default: "new",
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);

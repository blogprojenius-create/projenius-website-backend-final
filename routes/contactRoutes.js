const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Contact = require("../models/Contact");
const { sendContactEmails } = require("../services/emailService");

const router = express.Router();

/* =========================================================
   UPLOAD CONFIGURATION
   Files are staged briefly on disk and then moved into
   MongoDB GridFS. This avoids Render/local-disk persistence issues.
========================================================= */

const uploadDir = path.join(__dirname, "..", "uploads", "contact-temp");
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "png",
    "jpg",
    "jpeg",
]);

const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
        cb(null, `${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1).toLowerCase();
        const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
        const extOk = ALLOWED_EXTENSIONS.has(ext);

        if (!mimeOk || !extOk) {
            return cb(
                new Error(
                    "Unsupported attachment type. Please upload PDF, DOC, DOCX, PPT, PPTX, PNG, JPG or JPEG."
                )
            );
        }

        cb(null, true);
    },
});

/* =========================================================
   HELPERS
========================================================= */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const cleanString = (value, fallback = "") =>
    String(value ?? fallback).trim();

function safeDate(value) {
    if (!value) return new Date();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function prettyValue(value) {
    if (Array.isArray(value)) return value.join(", ");
    if (value && typeof value === "object") return JSON.stringify(value);
    return cleanString(value);
}

function getGridFSBucket() {
    if (!mongoose.connection.db) {
        throw new Error("MongoDB is not connected. Cannot store attachment.");
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "contactAttachments",
    });
}

function storeFileInGridFS(file) {
    return new Promise((resolve, reject) => {
        const bucket = getGridFSBucket();
        const fileId = new mongoose.Types.ObjectId();
        const source = fs.createReadStream(file.path);
        const uploadStream = bucket.openUploadStreamWithId(fileId, file.originalname, {
            contentType: file.mimetype,
            metadata: {
                originalName: file.originalname,
                source: "website-contact-form",
            },
        });

        source.on("error", reject);
        uploadStream.on("error", reject);
        uploadStream.on("finish", () => resolve(fileId));

        source.pipe(uploadStream);
    });
}

function removeTempFile(file) {
    if (file?.path) fs.unlink(file.path, () => {});
}

function buildAttachmentUrl(fileId) {
    if (!fileId) return "";

    const baseUrl = cleanString(
        process.env.PUBLIC_API_URL || process.env.PUBLIC_SITE_URL,
        `http://localhost:${process.env.PORT || process.env.API_PORT || 5000}`
    ).replace(/\/$/, "");

    return `${baseUrl}/api/contact/attachments/${encodeURIComponent(String(fileId))}`;
}

const FIELD_LABELS = {
    stage: "Current stage",
    support: "Support needed",
    build: "What they want to build",
    product: "Product status",
    timeline: "Expected timeline",
    budget: "Budget range",
    department: "Department",
    topic: "Workshop topic / technology",
    format: "Workshop format",
    date: "Preferred date",
    duration: "Duration",
    participants: "Expected participants",
    area: "Interested area / Area of interest",
    level: "Current skill level",
    mode: "Preferred learning mode",
    education: "Current education / role",
    skills: "Current skills",
    preference: "Internship preference",
    year: "Current year",
    goal: "Career goal",
    guidance: "Guidance needed",
    role: "Role / designation",
    enquiry: "Enquiry type",
};

function buildEmailParams({ payload, attachmentUrl }) {
    const specific = payload.enquirySpecificFields || {};

    const details = Object.entries(specific)
        .filter(([, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return String(value ?? "").trim() !== "";
        })
        .map(([key, value]) => `${FIELD_LABELS[key] || key}: ${prettyValue(value)}`)
        .join("\n");

    const category = cleanString(payload.enquiryType) || "General";

    return {
        enquiry_type: category,
        category,
        enquiry_category: category,
        source_page: cleanString(payload.sourcePage, "Website"),
        name: cleanString(payload.name),
        email: cleanString(payload.email).toLowerCase(),
        phone: cleanString(payload.phone),
        organisation: cleanString(payload.organisation),
        city: cleanString(payload.city),
        message: cleanString(payload.message),
        specific_fields: details || "No additional category-specific details.",
        attachment_name: payload.attachment?.name || "",
        attachment_url: attachmentUrl || "",
        attachment_available: Boolean(attachmentUrl),
        submission_id: cleanString(payload.submissionId),
        submitted_at: safeDate(payload.timestamp).toLocaleString("en-IN"),
        subject: `${category} Enquiry - ${cleanString(payload.name)}`,
    };
}

/* =========================================================
   POST /api/contact
========================================================= */

router.post(
    "/contact",
    (req, res, next) => {
        upload.single("attachment")(req, res, (uploadError) => {
            if (!uploadError) return next();

            if (uploadError instanceof multer.MulterError) {
                if (uploadError.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: "Attachment is too large. Maximum allowed size is 5 MB.",
                    });
                }
            }

            return res.status(400).json({
                success: false,
                message: uploadError.message || "Unable to process the attachment.",
            });
        });
    },
    async (req, res) => {
        let storedFileId = null;

        try {
            let incoming = req.body;

            if (typeof req.body?.payload === "string") {
                try {
                    incoming = JSON.parse(req.body.payload);
                } catch {
                    removeTempFile(req.file);
                    return res.status(400).json({
                        success: false,
                        message: "Invalid enquiry payload.",
                    });
                }
            }

            const {
                enquiryType,
                sourcePage,
                name,
                email,
                phone,
                organisation,
                city,
                message,
                enquirySpecificFields,
                timestamp,
                submissionId,
            } = incoming || {};

            if (!enquiryType || !name || !email || !phone || !message) {
                removeTempFile(req.file);
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required enquiry details.",
                });
            }

            const cleanEmail = cleanString(email).toLowerCase();

            if (!EMAIL_REGEX.test(cleanEmail)) {
                removeTempFile(req.file);
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address.",
                });
            }

            const cleanSubmissionId = cleanString(submissionId);

            if (cleanSubmissionId) {
                const existing = await Contact.findOne({
                    submissionId: cleanSubmissionId,
                }).lean();

                if (existing) {
                    removeTempFile(req.file);
                    return res.status(200).json({
                        success: true,
                        duplicate: true,
                        message: "This enquiry has already been submitted.",
                        enquiryId: existing._id,
                    });
                }
            }

            /* =====================================================
               STORE FILE IN MONGODB GRIDFS
            ===================================================== */

            let attachment = null;
            let attachmentUrl = "";

            if (req.file) {
                storedFileId = await storeFileInGridFS(req.file);
                removeTempFile(req.file);

                attachmentUrl = buildAttachmentUrl(storedFileId);

                attachment = {
                    fileId: String(storedFileId),
                    name: req.file.originalname,
                    filename: req.file.originalname,
                    type: req.file.mimetype,
                    size: req.file.size,
                    url: attachmentUrl,
                    storage: "mongodb-gridfs",
                };
            }

            /* =====================================================
               SAVE ENQUIRY
            ===================================================== */

            const cleanData = {
                enquiryType: cleanString(enquiryType),
                sourcePage: cleanString(sourcePage, "website"),
                name: cleanString(name),
                email: cleanEmail,
                phone: cleanString(phone),
                organisation: cleanString(organisation),
                city: cleanString(city),
                message: cleanString(message),
                enquirySpecificFields:
                    enquirySpecificFields && typeof enquirySpecificFields === "object"
                        ? enquirySpecificFields
                        : {},
                attachment,
                submittedAt: safeDate(timestamp),
                submissionId: cleanSubmissionId || undefined,
            };

            const enquiry = await Contact.create(cleanData);

            /* =====================================================
               EMAILJS — TEXT/HTML ONLY
               IMPORTANT: Free EmailJS cannot accept file attachments.
               We send a secure GridFS link instead, so the request
               stays below the EmailJS Free plan size restriction.
            ===================================================== */

            let emailStatus = {
                admin: false,
                client: false,
            };

            try {
                const emailResult = await sendContactEmails({
                    templateParams: buildEmailParams({
                        payload: cleanData,
                        attachmentUrl,
                    }),
                });

                emailStatus = {
                    admin: Boolean(emailResult.admin?.success),
                    client: Boolean(emailResult.client?.success),
                };
            } catch (emailError) {
                console.error("CONTACT EMAIL ERROR:", emailError?.message || emailError);
            }

            return res.status(201).json({
                success: true,
                message: "Enquiry submitted successfully.",
                enquiryId: enquiry._id,
                emailStatus,
                attachment: attachment
                    ? {
                          name: attachment.name,
                          url: attachment.url,
                      }
                    : null,
            });
        } catch (error) {
            console.error("========================================");
            console.error("CONTACT ROUTE ERROR");
            console.error(error?.stack || error?.message || error);
            console.error("========================================");

            removeTempFile(req.file);

            /* If GridFS succeeded but the enquiry could not be created,
               remove the orphaned GridFS file. */
            if (storedFileId && mongoose.connection.db) {
                try {
                    const bucket = getGridFSBucket();
                    await bucket.delete(new mongoose.Types.ObjectId(storedFileId));
                } catch (cleanupError) {
                    console.error("GRIDFS CLEANUP ERROR:", cleanupError?.message || cleanupError);
                }
            }

            return res.status(500).json({
                success: false,
                message: "Unable to submit your enquiry right now. Please try again later.",
            });
        }
    }
);

/* =========================================================
   GET /api/contact/attachments/:fileId
   Streams the stored GridFS file.
========================================================= */

router.get("/contact/attachments/:fileId", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attachment ID.",
            });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.fileId);
        const bucket = getGridFSBucket();
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files.length) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found.",
            });
        }

        const file = files[0];

        res.setHeader("Content-Type", file.contentType || "application/octet-stream");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${String(file.filename).replace(/"/g, "")}"`
        );
        res.setHeader("Cache-Control", "private, max-age=3600");

        const stream = bucket.openDownloadStream(fileId);
        stream.on("error", () => {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: "Unable to read the attachment.",
                });
            } else {
                res.end();
            }
        });

        stream.pipe(res);
    } catch (error) {
        console.error("ATTACHMENT DOWNLOAD ERROR:", error?.message || error);
        return res.status(500).json({
            success: false,
            message: "Unable to open the attachment.",
        });
    }
});

/* =========================================================
   GET /api/contact
========================================================= */

router.get("/contact", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Contact API is available. Use POST /api/contact to submit an enquiry.",
    });
});

module.exports = router;

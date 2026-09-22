const mongoose = require("mongoose");

/* =========================================================
   AUTHOR
========================================================= */

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "ProJenius Team",
    },

    role: {
      type: String,
      trim: true,
      default: "Technology Insights",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   BLOG SCHEMA
========================================================= */

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 360,
    },

    content: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      enum: [
        "Article",
        "Technology Video",
        "Event",
        "Company Update",
        "Announcement",
      ],
      default: "Article",
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    customCategory: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       IMAGES
    ===================================================== */

    thumbnailUrl: {
      type: String,
      required: true,
      trim: true,
    },

    galleryImages: {
      type: [String],
      default: [],
    },

    /* =====================================================
       VIDEO
    ===================================================== */

    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    videoFileUrl: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       AUTHOR
    ===================================================== */

    author: {
      type: authorSchema,
      default: () => ({}),
    },

    /* =====================================================
       TAGS
    ===================================================== */

    tags: {
      type: [String],
      default: [],
    },

    /* =====================================================
       EVENT
    ===================================================== */

    eventDate: {
      type: Date,
      default: null,
    },

    venue: {
      type: String,
      default: "",
      trim: true,
    },

    eventType: {
      type: String,
      default: "",
      trim: true,
    },

    eventStatus: {
      type: String,
      enum: [
        "Upcoming",
        "Completed",
      ],
      default: "Upcoming",
    },

    registrationLink: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       PUBLICATION
    ===================================================== */

    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "scheduled",
      ],
      default: "draft",
      index: true,
    },

    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    publicVisibility: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =====================================================
       SEO
    ===================================================== */

    seoTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 70,
    },

    metaDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 170,
    },

    focusKeyword: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       NEWSLETTER
    ===================================================== */

    newsletterSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    /*
     * IMPORTANT:
     * Admin backend stores blogs in "blogs".
     */
    collection: "blogs",
  }
);

/* =========================================================
   SEARCH INDEX
========================================================= */

blogSchema.index({
  title: "text",
  description: "text",
  content: "text",
  category: "text",
  focusKeyword: "text",
});

/* =========================================================
   MODEL
========================================================= */

module.exports =
  mongoose.models.Blog ||
  mongoose.model("Blog", blogSchema);
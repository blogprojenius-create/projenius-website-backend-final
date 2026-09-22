const mongoose = require("mongoose");

const instructorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "ProJenius Team",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const courseSchema = new mongoose.Schema(
  {
    /* =====================================================
       BASIC COURSE INFORMATION
    ===================================================== */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    /* =====================================================
       COURSE DETAILS
    ===================================================== */

    level: {
      type: String,
      default: "Beginner",
      trim: true,
      index: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    mode: {
      type: String,
      default: "Online Live",
      trim: true,
    },

    instructor: {
      type: instructorSchema,
      default: () => ({}),
    },

    badge: {
      type: String,
      default: "",
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    /* =====================================================
       PRICING
    ===================================================== */

    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    offerPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       PUBLIC DISPLAY METRICS
    ===================================================== */

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    enrolled: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       PUBLISHING
    ===================================================== */

    courseStatus: {
      type: String,
      enum: [
        "Draft",
        "Enrollment Open",
        "Enrollment Closed",
        "Ongoing",
        "Completed",
      ],
      default: "Draft",
      index: true,
    },

    publicVisibility: {
      type: Boolean,
      default: true,
      index: true,
    },

    published: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =====================================================
       OLD FIELD
       Kept only for compatibility with old data.
    ===================================================== */

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Course ||
  mongoose.model("Course", courseSchema);
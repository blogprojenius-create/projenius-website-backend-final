const mongoose = require("mongoose");
const Course = require("../models/Course");

/* =========================================================
   PUBLIC COURSE QUERY
========================================================= */

/*
 * This matches the fields used by the ProJenius Admin panel:
 *
 * published === true
 * publicVisibility !== false
 */
const publicCourseQuery = {
  published: true,
  publicVisibility: {
    $ne: false,
  },
};

/* =========================================================
   GET ALL PUBLIC COURSES
========================================================= */

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find(
      publicCourseQuery
    )
      .sort({
        createdAt: -1,
      })
      .lean();

    console.log(
      "Public courses found:",
      courses.length
    );

    res.status(200).json(courses);
  } catch (error) {
    console.error(
      "Failed to fetch courses:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE COURSE
   Supports both:
   /api/courses/slug
   /api/courses/mongodb-id
========================================================= */

const getCourseBySlug = async (
  req,
  res
) => {
  try {
    const identifier = String(
      req.params.slug || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        message: "Course identifier is required",
      });
    }

    const filter =
      mongoose.isValidObjectId(identifier)
        ? {
            _id: identifier,
          }
        : {
            slug: identifier,
          };

    const course =
      await Course.findOne({
        ...filter,
        ...publicCourseQuery,
      }).lean();

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(
      "Failed to fetch course:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch course",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE COURSE
   Kept for compatibility.
========================================================= */

const createCourse = async (
  req,
  res
) => {
  try {
    const course = await Course.create(
      req.body
    );

    res.status(201).json(course);
  } catch (error) {
    console.error(
      "Failed to create course:",
      error
    );

    res.status(400).json({
      message: "Failed to create course",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE COURSE
========================================================= */

const updateCourse = async (
  req,
  res
) => {
  try {
    const course =
      await Course.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(
      "Failed to update course:",
      error
    );

    res.status(400).json({
      message: "Failed to update course",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE COURSE
========================================================= */

const deleteCourse = async (
  req,
  res
) => {
  try {
    const course =
      await Course.findByIdAndDelete(
        req.params.id
      );

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      message:
        "Course deleted successfully",
    });
  } catch (error) {
    console.error(
      "Failed to delete course:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete course",
      error: error.message,
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
};
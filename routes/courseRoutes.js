const express = require("express");

const {
  getCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");

const router =
  express.Router();

router.get(
  "/",
  getCourses
);

router.get(
  "/:slug",
  getCourseBySlug
);

router.post(
  "/",
  createCourse
);

module.exports = router;
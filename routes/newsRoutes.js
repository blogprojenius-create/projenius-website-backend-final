const express = require("express");

const {
  getNews,
  getNewsBySlug,
} = require("../controllers/newsController");

const router =
  express.Router();

/* =========================================================
   PUBLIC NEWS LIST
========================================================= */

router.get(
  "/",
  getNews
);

/* =========================================================
   PUBLIC NEWS DETAIL
========================================================= */

router.get(
  "/:slug",
  getNewsBySlug
);

module.exports = router;
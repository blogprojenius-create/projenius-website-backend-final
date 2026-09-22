const mongoose = require("mongoose");
const Blog = require("../models/Blog");

/* =========================================================
   PUBLIC QUERY
========================================================= */

const publicQuery = {
  status: "published",

  /*
   * true OR missing field is allowed.
   * false stays hidden.
   */
  publicVisibility: {
    $ne: false,
  },
};

/* =========================================================
   PAGINATION
========================================================= */

function getPagination(query) {
  const page = Math.max(
    Number.parseInt(query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(query.limit, 10) || 20,
      1
    ),
    50
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

/* =========================================================
   GET PUBLIC NEWS
========================================================= */

const getNews = async (req, res) => {
  try {
    const {
      category,
      contentType,
      featured,
    } = req.query;

    const {
      page,
      limit,
      skip,
    } = getPagination(req.query);

    const query = {
      ...publicQuery,
    };

    /* Category filter */
    if (
      category &&
      category !== "All"
    ) {
      query.category =
        String(category).trim();
    }

    /* Content type filter */
    if (
      contentType &&
      contentType !== "All"
    ) {
      query.contentType =
        String(contentType).trim();
    }

    /* Featured filter */
    if (featured === "true") {
      query.featured = true;
    }

    const [
      items,
      total,
    ] = await Promise.all([
      Blog.find(query)
        .sort({
          featured: -1,
          publishedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Blog.countDocuments(query),
    ]);

    return res.status(200).json({
      items,
      page,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / limit)
      ),
    });
  } catch (error) {
    console.error(
      "News & Insights fetch error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch News & Insights.",
      message: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE NEWS
   Supports:
   /api/news/my-slug
   /api/news/mongodb-id
========================================================= */

const getNewsBySlug = async (
  req,
  res
) => {
  try {
    const identifier = String(
      req.params.slug || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        error:
          "News identifier is required.",
      });
    }

    const identifierFilter =
      mongoose.isValidObjectId(identifier)
        ? {
            _id: identifier,
          }
        : {
            slug: identifier,
          };

    const news =
      await Blog.findOne({
        ...identifierFilter,
        ...publicQuery,
      }).lean();

    if (!news) {
      return res.status(404).json({
        error:
          "News article not found.",
      });
    }

    return res.status(200).json(
      news
    );
  } catch (error) {
    console.error(
      "News details fetch error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch News & Insights article.",
      message: error.message,
    });
  }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  getNews,
  getNewsBySlug,
};
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB =
  require("./config/db");

const courseRoutes =
  require("./routes/courseRoutes");

const newsRoutes =
  require("./routes/newsRoutes");

const contactRoutes =
  require("./routes/contactRoutes");

const googleReviewRoutes =
  require("./routes/googleReviewRoutes");

const app = express();

/* =========================================================
   CONFIG
========================================================= */

const PORT = Number(
  process.env.API_PORT ||
  process.env.PORT ||
  5000
);

const allowedOrigins = String(
  process.env.CLIENT_ORIGIN ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((value) =>
    value.trim()
  )
  .filter(Boolean);

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      /*
       * Browser request without Origin:
       * Postman / direct server request
       */
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      /*
       * Local development
       */
      if (
        process.env.NODE_ENV !==
        "production"
      ) {
        return callback(
          null,
          true
        );
      }

      /*
       * Production
       */
      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          "CORS origin not allowed."
        )
      );
    },

    credentials: true,
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit:
      process.env.API_JSON_LIMIT ||
      "12mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "12mb",
  })
);

/* =========================================================
   STATIC UPLOADS
========================================================= */

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    ),
    {
      maxAge: "1d",
    }
  )
);

/* =========================================================
   ROOT
========================================================= */

app.get(
  "/",
  (_req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Projenius backend is running",
    });
  }
);

/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (_req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Projenius API is healthy",
    });
  }
);

/* =========================================================
   API ROUTES
========================================================= */

/* ---------------- Courses ---------------- */

app.use(
  "/api/courses",
  courseRoutes
);

/* ---------------- News ---------------- */

app.use(
  "/api/news",
  newsRoutes
);

/* ---------------- Contact ---------------- */

app.use(
  "/api",
  contactRoutes
);

/* ---------------- Google Reviews ---------------- */

app.use(
  "/api/reviews",
  googleReviewRoutes
);

/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "Route not found",
      path: req.originalUrl,
      method: req.method,
    });
  }
);

/* =========================================================
   GLOBAL ERROR
========================================================= */

app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {
    console.error(
      "========================================"
    );

    console.error(
      "Backend Error:"
    );

    console.error(
      error?.stack ||
        error?.message ||
        error
    );

    console.error(
      "========================================"
    );

    res.status(
      error?.status || 500
    ).json({
      success: false,
      message:
        error?.message ||
        "Internal server error",
    });
  }
);

/* =========================================================
   START DATABASE + SERVER
========================================================= */

async function startServer() {
  try {
    await connectDB();

    console.log(
      "MongoDB connected successfully."
    );

    app.listen(
      PORT,
      () => {
        console.log(
          "========================================"
        );

        console.log(
          "Projenius Backend Started"
        );

        console.log(
          `Server: http://localhost:${PORT}`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `Courses: http://localhost:${PORT}/api/courses`
        );

        console.log(
          `News: http://localhost:${PORT}/api/news`
        );

        console.log(
          `Reviews: http://localhost:${PORT}/api/reviews`
        );

        console.log(
          "========================================"
        );
      }
    );
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "Unable to start ProJenius backend."
    );

    console.error(
      error?.message ||
        error
    );

    console.error(
      "Check MONGO_URI and MongoDB Atlas access."
    );

    console.error(
      "========================================"
    );

    process.exit(1);
  }
}

startServer();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");

const courseRoutes = require("./routes/courseRoutes");
const newsRoutes = require("./routes/newsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const googleReviewRoutes = require("./routes/googleReviewRoutes");

const app = express();

/* =========================================================
   PORT
========================================================= */

const PORT = Number(
  process.env.PORT ||
    process.env.API_PORT ||
    5000
);

/* =========================================================
   CORS
========================================================= */

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5181",

  "https://projenius-website-frontend-final.vercel.app",

  "https://projenius-admin-frontend-final.vercel.app",
];

const envOrigins = String(
  process.env.CLIENT_ORIGIN ||
    process.env.FRONTEND_URL ||
    ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([
    ...defaultOrigins,
    ...envOrigins,
  ]),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      if (
        /^https?:\/\/localhost:\d+$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      if (
        /^https?:\/\/127\.0\.0\.1:\d+$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      if (
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      console.warn(
        `CORS blocked origin: ${origin}`
      );

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit:
      process.env.API_JSON_LIMIT ||
      "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

/* =========================================================
   STATIC UPLOADS
========================================================= */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads"),
    {
      maxAge: "1d",
    }
  )
);

/* =========================================================
   ROOT
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Projenius backend is running",
  });
});

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Projenius API is healthy",
  });
});

/* =========================================================
   COURSES
========================================================= */

app.use(
  "/api/courses",
  courseRoutes
);

/* =========================================================
   NEWS
========================================================= */

app.use(
  "/api/news",
  newsRoutes
);

/* =========================================================
   CONTACT
========================================================= */

app.use(
  "/api",
  contactRoutes
);

/* =========================================================
   GOOGLE REVIEWS
========================================================= */

app.use(
  "/api/reviews",
  googleReviewRoutes
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "========================================"
    );

    console.error(
      "Backend Error:"
    );

    console.error(
      err?.stack ||
        err?.message ||
        err
    );

    console.error(
      "========================================"
    );

    res.status(
      err?.status || 500
    ).json({
      success: false,
      message:
        err?.message ||
        "Internal server error",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await connectDB();

    console.log(
      "========================================"
    );

    console.log(
      "MongoDB connected successfully"
    );

    console.log(
      "Allowed CORS origins:"
    );

    allowedOrigins.forEach(
      (origin) => {
        console.log(` - ${origin}`);
      }
    );

    app.listen(
      PORT,
      "0.0.0.0",
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
          `Contact: http://localhost:${PORT}/api/contact`
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
      "Backend startup failed:"
    );

    console.error(
      error?.stack ||
        error?.message ||
        error
    );

    console.error(
      "========================================"
    );

    process.exit(1);
  }
}

startServer();
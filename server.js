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
   CONFIG
========================================================= */

const PORT = Number(
    process.env.PORT ||
    process.env.API_PORT ||
    5000
);

const CLIENT_ORIGIN =
    process.env.CLIENT_ORIGIN ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = CLIENT_ORIGIN
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            /*
             * Allow local development origins.
             */
            if (
                origin.includes("localhost") ||
                origin.includes("127.0.0.1")
            ) {
                return callback(null, true);
            }

            /*
             * Allow Vercel frontend.
             */
            if (origin.endsWith(".vercel.app")) {
                return callback(null, true);
            }

            return callback(
                new Error(
                    `CORS blocked origin: ${origin}`
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
        limit: "20mb",
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
        path.join(__dirname, "uploads")
    )
);

/* =========================================================
   HEALTH
========================================================= */

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Projenius backend is running",
    });
});

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Projenius API is healthy",
    });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use(
    "/api/courses",
    courseRoutes
);

app.use(
    "/api/news",
    newsRoutes
);

app.use(
    "/api",
    contactRoutes
);

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
        _req,
        res,
        _next
    ) => {
        console.error(
            "Backend Error:",
            err?.stack || err?.message || err
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
   START
========================================================= */

async function startServer() {
    try {
        await connectDB();

        console.log(
            "MongoDB connected successfully"
        );

        app.listen(PORT, "0.0.0.0", () => {
            console.log(
                "========================================"
            );

            console.log(
                "Projenius Backend Started"
            );

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                `Health: /api/health`
            );

            console.log(
                `Courses: /api/courses`
            );

            console.log(
                `News: /api/news`
            );

            console.log(
                `Reviews: /api/reviews`
            );

            console.log(
                "========================================"
            );
        });
    } catch (error) {
        console.error(
            "Backend startup failed:",
            error
        );

        process.exit(1);
    }
}

startServer();
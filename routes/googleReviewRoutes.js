const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const placeId = process.env.GOOGLE_PLACE_ID;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "GOOGLE_MAPS_API_KEY is missing",
            });
        }

        if (!placeId) {
            return res.status(500).json({
                success: false,
                message: "GOOGLE_PLACE_ID is missing",
            });
        }

        const googleUrl =
            `https://places.googleapis.com/v1/places/${placeId}`;

        const response = await fetch(googleUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask":
                    "id,displayName,rating,userRatingCount,reviews,googleMapsUri",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Google Places API Error:", data);

            return res.status(response.status).json({
                success: false,
                message: "Google Places API request failed",
                error: data,
            });
        }

        const reviews = (data.reviews || []).map((review) => ({
            name:
                review.authorAttribution?.displayName ||
                "Google User",

            photo:
                review.authorAttribution?.photoUri ||
                null,

            rating: review.rating || 0,

            text:
                review.text?.text ||
                "",

            language:
                review.text?.languageCode ||
                null,

            relativeTime:
                review.relativePublishTimeDescription ||
                "",

            googleMapsUri:
                review.googleMapsUri ||
                data.googleMapsUri ||
                null,
        }));

        res.status(200).json({
            success: true,

            business: {
                id: data.id || null,

                name:
                    data.displayName?.text ||
                    "ProJenius Innovation Technology Private Limited",

                rating: data.rating || 0,

                totalReviews:
                    data.userRatingCount || 0,

                googleMapsUri:
                    data.googleMapsUri || null,
            },

            reviews,
        });

    } catch (error) {
        console.error(
            "Google Reviews Backend Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch Google reviews",
            error: error.message,
        });
    }
});

module.exports = router;
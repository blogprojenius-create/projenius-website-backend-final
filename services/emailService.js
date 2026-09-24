const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CATEGORY_NAMES = {
    startup: "Startup & Innovation",
    "startup-innovation": "Startup & Innovation",
    "startup & innovation": "Startup & Innovation",
    development: "Development",
    workshop: "Workshop",
    course: "Courses & Learning",
    courses: "Courses & Learning",
    "courses-learning": "Courses & Learning",
    "courses & learning": "Courses & Learning",
    learning: "Courses & Learning",
    internship: "Internship",
    career: "Career Guidance",
    "career-guidance": "Career Guidance",
    "career guidance": "Career Guidance",
    general: "Partnership / General",
    "partnership-general": "Partnership / General",
    "partnership / general": "Partnership / General",
    partnership: "Partnership / General",
};

function getCategoryName(enquiryType) {
    const key = String(enquiryType || "")
        .trim()
        .toLowerCase();

    return CATEGORY_NAMES[key] || String(enquiryType || "General Enquiry").trim();
}

function safeText(value) {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

/*
   Optional per-category recipient routing.
   If a category-specific variable is missing, ADMIN_EMAIL is used.
*/
function getAdminRecipient(enquiryType) {
    const key = String(enquiryType || "")
        .trim()
        .toLowerCase();

    const map = {
        startup: process.env.EMAILJS_STARTUP_EMAIL,
        development: process.env.EMAILJS_DEVELOPMENT_EMAIL,
        workshop: process.env.EMAILJS_WORKSHOP_EMAIL,
        course: process.env.EMAILJS_COURSE_EMAIL,
        internship: process.env.EMAILJS_INTERNSHIP_EMAIL,
        career: process.env.EMAILJS_CAREER_EMAIL,
        general: process.env.EMAILJS_GENERAL_EMAIL,
    };

    return (
        map[key] ||
        process.env.ADMIN_EMAIL ||
        process.env.MAIL_RECEIVER ||
        "teamprojenius@gmail.com"
    );
}

function buildDetailsText(data) {
    const lines = [];
    const specific = data.specific_fields || "";

    if (specific) {
        specific.split("\n").forEach((line) => {
            if (line.trim()) lines.push(line.trim());
        });
    }

    return lines.join("\n");
}

async function sendEmailJS({ templateId, templateParams }) {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId) throw new Error("EMAILJS_SERVICE_ID is missing.");
    if (!publicKey) throw new Error("EMAILJS_PUBLIC_KEY is missing.");
    if (!templateId) throw new Error("EmailJS template ID is missing.");

    const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams || {},
    };

    if (privateKey) payload.accessToken = privateKey;

    const response = await fetch(EMAILJS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(`EmailJS failed (${response.status}): ${responseText}`);
    }

    return {
        success: true,
        status: response.status,
        response: responseText,
    };
}

async function sendContactEmails({ templateParams }) {
    const adminTemplateId = process.env.EMAILJS_ADMIN_TEMPLATE_ID;
    const userTemplateId = process.env.EMAILJS_USER_TEMPLATE_ID;

    if (!adminTemplateId) throw new Error("EMAILJS_ADMIN_TEMPLATE_ID is missing.");
    if (!userTemplateId) throw new Error("EMAILJS_USER_TEMPLATE_ID is missing.");
    if (!templateParams?.email) throw new Error("Contact email address is missing.");

    const category = getCategoryName(templateParams.enquiry_type);
    const adminEmail = getAdminRecipient(templateParams.enquiry_type);
    const userEmail = String(templateParams.email).trim().toLowerCase();
    const details = buildDetailsText(templateParams);

    const commonParams = {
        ...templateParams,
        category,
        enquiry_category: category,
        enquiry_type: category,
        specific_fields: details || "No additional category-specific details.",
        to_email: adminEmail,
    };

    const admin = await sendEmailJS({
        templateId: adminTemplateId,
        templateParams: {
            ...commonParams,
            to_email: adminEmail,
            recipient_email: adminEmail,
            recipient_type: "Admin",
            email_type: "New Contact Enquiry",
        },
    });

    /* EmailJS allows 1 request/second. */
    await wait(1100);

    const client = await sendEmailJS({
        templateId: userTemplateId,
        templateParams: {
            ...commonParams,
            to_email: userEmail,
            recipient_email: userEmail,
            recipient_type: "Customer",
            email_type: "Enquiry Confirmation",
        },
    });

    return {
        success: true,
        category,
        subject: templateParams.subject,
        admin,
        client,
    };
}

module.exports = {
    sendEmailJS,
    sendContactEmails,
    getCategoryName,
};

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// REMOVED: Old API key was hardcoded here. This file is no longer deployed.
// AI calls are now made directly from the frontend with a domain-restricted key.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "REVOKED";

const MODELS = [
    "gemini-3-flash-preview",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro"
];

async function callGemini(promptText) {
    let success = false;
    let result = null;

    for (const model of MODELS) {
        if (success) break;
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                logger.warn(`Model ${model} failed with status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                result = data.candidates[0].content.parts[0].text;
                success = true;
            }
        } catch (e) {
            logger.warn(`Model ${model} failed: ${e.message}`);
        }
    }

    if (!success) {
        throw new Error("Failed to contact Gemini API.");
    }

    return result;
}

exports.getElectionInfo = onCall(async (request) => {
    // Ensure the user is authenticated
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to use this feature.");
    }

    const pincode = request.data.pincode;
    if (!pincode || pincode.length !== 6) {
        throw new HttpsError("invalid-argument", "Valid 6-digit pincode is required.");
    }

    const prompt = `You are a precise Indian Election Assistant. For the Indian pincode ${pincode}, provide the EXACT electoral details. 
    IMPORTANT: Verify the specific Tehsil/Area (e.g., 301402 is Bansur, Alwar, not Behror). 
    Return ONLY a JSON object: {"mpName", "mlaName", "state", "chiefMinister", "nextElectionDate" (YYYY-MM-DD), "areaName", "mpConstituency"}. No markdown.`;

    try {
        let rawText = await callGemini(prompt);
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const info = JSON.parse(rawText);
        
        // Hardcoded Correction for known precision issues from old logic
        if (pincode === "301402") {
            info.areaName = "Bansur (Alwar)";
        }

        return info;
    } catch (error) {
        logger.error("Error fetching election info:", error);
        throw new HttpsError("internal", "Failed to retrieve election details.", error.message);
    }
});

exports.chatWithAI = onCall(async (request) => {
    // Ensure the user is authenticated
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to chat with AI.");
    }

    const text = request.data.text;
    if (!text) {
        throw new HttpsError("invalid-argument", "Message text is required.");
    }

    const prompt = `You are VoterSaathi AI. Be brief: ${text}`;

    try {
        const responseText = await callGemini(prompt);
        return { response: responseText };
    } catch (error) {
        logger.error("Error chatting with AI:", error);
        throw new HttpsError("internal", "AI currently busy.", error.message);
    }
});

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!API_KEY) {
    console.error(
        "ERROR: GEMINI_API_KEY is missing from .env"
    );
} else {
    console.log("Gemini API key loaded.");
    console.log("Gemini model:", MODEL);
}

const ai = API_KEY
    ? new GoogleGenAI({
        apiKey: API_KEY
    })
    : null;

app.use(express.json({ limit: "1mb" }));

// ---------------------------------------------------------
// Static files
// ---------------------------------------------------------

app.use(express.static(__dirname));

// ---------------------------------------------------------
// Health check
// ---------------------------------------------------------

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        server: "Samyog",
        geminiConfigured: Boolean(API_KEY),
        model: MODEL
    });
});

// ---------------------------------------------------------
// Translation
// ---------------------------------------------------------

app.post("/api/translate", async (req, res) => {

    try {

        if (!API_KEY || !ai) {
            return res.status(500).json({
                success: false,
                error: "Gemini API key is not configured."
            });
        }

        const { texts, targetLanguage } = req.body;

        if (!Array.isArray(texts)) {
            return res.status(400).json({
                success: false,
                error: "texts must be an array."
            });
        }

        if (!["hi", "sat"].includes(targetLanguage)) {
            return res.status(400).json({
                success: false,
                error: "Unsupported target language."
            });
        }

        if (texts.length === 0) {
            return res.json({
                success: true,
                translations: []
            });
        }

        if (texts.length > 20) {
            return res.status(400).json({
                success: false,
                error: "Maximum 20 texts per request."
            });
        }

        const languageName =
            targetLanguage === "hi"
                ? "Hindi"
                : "Santali";

        const input = texts
            .map(
                (text, index) =>
                    `${index + 1}. ${text}`
            )
            .join("\n");

        const prompt = `
You are the translation engine for the Samyog
Community → Collaborative Innovation Platform.

Translate the following English UI text into ${languageName}.

Rules:

1. Preserve the exact meaning.
2. Return exactly one translation for every input.
3. Keep the same order.
4. Do not add explanations.
5. Do not add numbering.
6. Preserve numbers.
7. Preserve percentages.
8. Preserve names of people.
9. Preserve organization names when appropriate.
10. Preserve technical terms when appropriate.
11. Preserve emojis.
12. Keep translations natural for a software interface.
13. For Santali, use Santali script where appropriate.

English texts:

${input}
`;

        console.log(
            `Translating ${texts.length} texts to ${languageName}...`
        );

        const response =
            await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    }
                }
            });

        const raw = response.text;

        console.log(
            "Gemini response received."
        );

        let translations;

        try {
            translations = JSON.parse(raw);
        } catch (parseError) {

            console.error(
                "Could not parse Gemini response:",
                raw
            );

            return res.status(500).json({
                success: false,
                error: "Gemini returned invalid translation JSON."
            });
        }

        if (
            !Array.isArray(translations) ||
            translations.length !== texts.length
        ) {
            return res.status(500).json({
                success: false,
                error:
                    `Expected ${texts.length} translations but received ${translations?.length || 0}.`
            });
        }

        res.json({
            success: true,
            translations
        });

    } catch (error) {

        console.error(
            "Translation error:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                error.message ||
                "Translation service failed."
        });
    }
});

// ---------------------------------------------------------
// Main page
// ---------------------------------------------------------

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

// ---------------------------------------------------------
// Start
// ---------------------------------------------------------

app.listen(PORT, () => {
    console.log(
        `Samyog server running on port ${PORT}`
    );
});
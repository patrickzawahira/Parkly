import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load .env from frontend folder since that's where the user put the key
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../frontend/.env") });

const apiKey = process.env.VITE_API_KEY;

if (!apiKey) {
    console.error("No API Key found in frontend/.env");
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 10) + "...");

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        const outputPath = path.join(__dirname, "../models_list.txt");
        let output = "Available Text Generation Models:\n";

        if (data.error) {
            output = "API Error: " + JSON.stringify(data.error, null, 2);
        } else {
            if (data.models) {
                const textModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
                textModels.forEach(m => {
                    output += `- ${m.name}\n`;
                });

                if (textModels.length === 0) {
                    output += "No text generation models found. All models: " + data.models.map(m => m.name).join(", ");
                }
            } else {
                output += "No models found in response: " + JSON.stringify(data);
            }
        }

        fs.writeFileSync(outputPath, output);
        console.log("Output written to models_list.txt");
    } catch (error) {
        console.error("Script Error:", error);
    }
}

listModels();

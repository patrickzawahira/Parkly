import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const logFile = join(__dirname, 'test_output.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function listModels() {
    fs.writeFileSync(logFile, ''); // Clear file

    if (!process.env.GEMINI_API_KEY) {
        log('❌ GEMINI_API_KEY not found in environment variables.');
        return;
    }

    log(`API Key loaded: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.0-pro'
        ];

        log('Testing models...');

        for (const modelName of modelsToTest) {
            try {
                log(`Testing ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                const response = await result.response;
                log(`✅ ${modelName} SUCCESS: ${response.text()}`);
                return; // Found a working model
            } catch (error) {
                log(`❌ ${modelName} FAILED:`);
                log(error.message);
            }
        }

        log('❌ All tested models failed.');

    } catch (error) {
        log('Error: ' + error);
    }
}

listModels();

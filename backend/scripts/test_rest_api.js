import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const logFile = join(__dirname, 'rest_output.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function testRestApi() {
    fs.writeFileSync(logFile, '');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        log('❌ GEMINI_API_KEY not found');
        return;
    }

    log(`Testing API Key: ${apiKey.substring(0, 10)}...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            log(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            log('Error details: ' + JSON.stringify(data, null, 2));
            return;
        }

        log('✅ API Request Successful!');
        log('Available Models:');
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    log(`- ${m.name}`);
                }
            });
        } else {
            log('No models found in response.');
        }

    } catch (error) {
        log('❌ Network Error: ' + error);
    }
}

testRestApi();

import { GoogleGenAI } from '@google/genai';

// The API key is read from the environment variables configured in the Netlify UI
const apiKey = process.env.API_KEY;

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    if (!apiKey) {
        console.error("FATAL: API_KEY environment variable is not set.");
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'The AI service is not configured on the server.' }) 
        };
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        const { emailText } = JSON.parse(event.body);
        if (!emailText) {
            return { statusCode: 400, body: JSON.stringify({ error: 'emailText is required' }) };
        }

        const model = 'gemini-2.5-flash';
        const prompt = `You are a helpful assistant integrated into an email client. Your task is to summarize the content of an email concisely. Provide a brief summary in a few bullet points. If there are any critical pieces of information like verification codes, promotional offers, or direct calls to action, highlight them.

Here is the email content:
---
${emailText}
---

Provide your summary below:`;

        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: response.text }),
        };
    } catch (error) {
        console.error('Gemini Summarization Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Failed to communicate with the Gemini API.' }) 
        };
    }
};
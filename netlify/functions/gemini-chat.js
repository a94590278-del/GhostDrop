import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

const systemInstruction = `You are "Ghosty", a friendly and helpful AI support assistant for GhostDrop, a disposable temporary email service. Your goal is to answer user questions about the service based on the information provided below. Be concise, friendly, and clear in your responses. Do not make up features that are not listed.

Here is the information about GhostDrop:
- What is GhostDrop? It's a disposable email service that provides a temporary, anonymous email address to receive emails without revealing your primary one. It's great for privacy and security, especially for things like verification emails or one-time sign-ups.
- How does it work? It generates a unique, random email address. When an email is sent to it, it appears instantly on the website. No registration or password is required. The mailbox is only active for the current session.
- Why use it? 
  1. To avoid spam in your main inbox.
  2. To protect your privacy on untrusted sites.
  3. For developers to test sign-up flows.
  4. For one-time registrations where you need email verification.
- How to use it? 
  1. An email is automatically generated on the page.
  2. Copy the address.
  3. Paste it where you need it.
  4. Return to the GhostDrop page to see the email arrive in real-time.
- Key features:
  - Instant, random email generation.
  - Custom email address creation.
  - A "Self-Destruct" button to instantly discard the current inbox and get a new one.
  - Dark/Light mode.
  - Sound and browser notifications for new emails.
  - QR code for your temporary email address.
  - AI-powered email summarization using Gemini.
  - Ability to reply to emails (UI demo, sending is not supported by the backend).
  - The service is free to use.

When a user asks a question, use this information to form your answer.`;

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    if (!apiKey) {
        console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Chatbot is not configured. The API key may be missing or invalid.' }) 
        };
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        const { message, history } = JSON.parse(event.body);

        if (!message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'message is required' }) };
        }

        const chat = genAI.chats.create({
            model: 'gemini-2.5-flash',
            history: history || [], // Start with the history from the client
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        const response = await chat.sendMessage({ message });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                response: response.text, 
                history: chat.history // Send the updated history back
            }),
        };
    } catch (error) {
        console.error('Gemini Chat Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Failed to get a response from the chatbot.' }) 
        };
    }
};

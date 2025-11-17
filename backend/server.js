import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Gemini API Setup ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the .env file.");
  process.exit(1);
}
const genAI = new GoogleGenAI({ apiKey });

const chatSessions = new Map(); // In-memory session store

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


// --- API Routes ---

// Route for email summarization
app.post('/api/gemini/summarize', async (req, res) => {
  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'emailText is required' });
  }

  try {
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
    
    res.json({ summary: response.text });
  } catch (error) {
    console.error('Gemini Summarization Error:', error);
    res.status(500).json({ error: 'Failed to communicate with the Gemini API.' });
  }
});

// Route for chatbot
app.post('/api/gemini/chat', async (req, res) => {
    let { message, sessionId } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }

    try {
        let chat;
        if (sessionId && chatSessions.has(sessionId)) {
            chat = chatSessions.get(sessionId);
        } else {
            chat = genAI.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                },
            });
            sessionId = `session-${Date.now()}-${Math.random()}`; // Create a new session ID
            chatSessions.set(sessionId, chat);
        }
        
        const response = await chat.sendMessage({ message });

        res.json({ response: response.text, sessionId });

    } catch (error) {
        console.error('Gemini Chat Error:', error);
        res.status(500).json({ error: 'Failed to get a response from the chatbot.' });
    }
});


// --- Static File Serving ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..'); // The project root is one level up from /backend

// Serve all files from the root directory
app.use(express.static(root));

// For any other request, serve index.html to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

app.listen(port, () => {
  console.log(`GhostDrop server running at http://localhost:${port}`);
});

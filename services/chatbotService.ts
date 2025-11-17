import { GoogleGenAI, Chat } from '@google/genai';

let chat: Chat | null = null;

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

export function resetChatSession() {
    chat = null;
}

async function getClient() {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  if (!apiKey) {
    console.warn("Gemini API key not set. Chatbot will be disabled.");
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey: apiKey });
  } catch (error) {
    console.error("Failed to initialize the Gemini client for chat:", error);
    return null;
  }
}

async function initializeChat(): Promise<Chat | null> {
    if (chat) {
        return chat;
    }
    
    const client = await getClient();
    if (!client) {
      return null;
    }

    try {
        chat = client.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return chat;
    } catch (error) {
        console.error("Error creating chat session:", error);
        return null;
    }
}

export async function getChatbotResponse(message: string): Promise<string> {
    const chatSession = await initializeChat();
    if (!chatSession) {
        return "Error: Chatbot is not configured. The API key may be missing or invalid.";
    }

    if (!message || message.trim().length === 0) {
        return "Please ask a question.";
    }

    try {
        const response = await chatSession.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            return 'Error: The provided API key is not valid. Please check your configuration.';
        }
        return "Sorry, I'm having trouble connecting right now. Please try again later.";
    }
}
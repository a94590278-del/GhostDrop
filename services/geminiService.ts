// The client is now created on-demand to prevent module-level side effects
// and to handle configuration issues more gracefully.
async function getClient() {
  // Lazily import the library to prevent module-load-time errors.
  const { GoogleGenAI } = await import('@google/genai');

  // Safely access the API key. The polyfill in index.html ensures `process.env` exists.
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  if (!apiKey) {
    console.warn("Gemini API key not set. Summarization will be disabled.");
    return null;
  }
  try {
    // Create a new instance for each request to ensure no stale configuration.
    return new GoogleGenAI({ apiKey: apiKey });
  } catch (error) {
    console.error("Failed to initialize the Gemini client:", error);
    return null;
  }
}

export async function summarizeEmail(emailText: string): Promise<string> {
  const client = await getClient();
  if (!client) {
    return "Error: AI summarization is not configured. The API key may be missing or invalid.";
  }

  if (!emailText || emailText.trim().length === 0) {
    return "The email body is empty, nothing to summarize.";
  }
  
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `You are a helpful assistant integrated into an email client. Your task is to summarize the content of an email concisely. Provide a brief summary in a few bullet points. If there are any critical pieces of information like verification codes, promotional offers, or direct calls to action, highlight them.

Here is the email content:
---
${emailText}
---

Provide your summary below:`;

    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
    });

    if (!response) {
      throw new Error("Received an empty response from the Gemini API.");
    }

    return response.text;
  } catch (error) {
    console.error("Error summarizing email with Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            return 'Error: The provided API key is not valid. Please check your configuration.';
        }
    }
    return "Sorry, there was a problem communicating with the AI. Please try again later.";
  }
}

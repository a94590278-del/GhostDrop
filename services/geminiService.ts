import { GoogleGenAI } from '@google/genai';

export async function summarizeEmail(emailText: string): Promise<string> {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set for email summarization.");
    return "[CLIENT V2] Configuration Error: API_KEY is missing for email summarization. Please set it in your deployment platform's environment variables.";
  }
  
  if (!emailText || emailText.trim().length === 0) {
    return "The email body is empty, nothing to summarize.";
  }
  
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    
    return response.text;

  } catch (error) {
    console.error("Error summarizing email with Gemini:", error);
    return "[CLIENT V2] Gemini Summarization Error: The API key provided might be invalid or the service is unreachable. Please check your configuration.";
  }
}
import { GoogleGenAI } from "@google/genai";

export async function summarizeEmail(content: string): Promise<string> {
  if (!content) return '';

  try {
    // Initialize the client here to ensure process.env is accessed at runtime
    // This prevents crashes if the environment shim isn't ready immediately at module load
    // We check if process is defined to avoid ReferenceErrors in pure browser environments without bundlers
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful assistant. Summarize the following email content concisely. Highlight the main point and any specific action items if present.\n\nEmail Content:\n${content}`,
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Error summarizing email:", error);
    // Return a user-friendly error instead of throwing, so the UI can display it gracefully
    return "Failed to generate summary. Please try again later.";
  }
}
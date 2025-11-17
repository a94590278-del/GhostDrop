// A minimal representation of the Gemini API's Content type for client-side state management.
export interface ChatHistoryContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}


export async function getChatbotResponse(message: string, history: ChatHistoryContent[]): Promise<{ responseText: string, newHistory: ChatHistoryContent[] }> {
    if (!message || message.trim().length === 0) {
        return { responseText: "Please ask a question.", newHistory: history };
    }

    try {
        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                history, 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return { responseText: data.response, newHistory: data.history };

    } catch (error) {
        console.error("Error sending message to backend chat service:", error);
        const errorMessage = (error instanceof Error && (error.message.includes('API key') || error.message.includes('Chatbot is not configured'))) 
            ? 'Error: The AI assistant is not configured correctly on the server. The API key may be missing or invalid.'
            : "Sorry, I'm having trouble connecting to the support AI right now. Please try again later.";
        
        // Return the error message as a response, and the original history
        return { responseText: errorMessage, newHistory: history };
    }
}

let sessionId: string | null = null;

export function resetChatSession() {
    sessionId = null;
}

export async function getChatbotResponse(message: string): Promise<string> {
    if (!message || message.trim().length === 0) {
        return "Please ask a question.";
    }

    try {
        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                sessionId, // Send current session ID, can be null
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        sessionId = data.sessionId; // Store the new/updated session ID from the backend
        return data.response;

    } catch (error) {
        console.error("Error sending message to backend chat service:", error);
        if (error instanceof Error && error.message.includes('API key')) {
            return 'Error: The API key on the server is not configured correctly.';
        }
        return "Sorry, I'm having trouble connecting to the support AI right now. Please try again later.";
    }
}

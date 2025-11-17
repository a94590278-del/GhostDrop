export async function summarizeEmail(emailText: string): Promise<string> {
  if (!emailText || emailText.trim().length === 0) {
    return "The email body is empty, nothing to summarize.";
  }
  
  try {
    const response = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailText }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.summary;

  } catch (error) {
    console.error("Error summarizing email via backend:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            return 'Error: The API key configured on the server is not valid.';
        }
        return `Error: ${error.message}`;
    }
    return "Sorry, there was a problem communicating with the AI service. Please try again later.";
  }
}

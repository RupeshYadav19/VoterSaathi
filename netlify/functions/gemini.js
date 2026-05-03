// Built-in fetch is available in Node.js 18+ (Netlify default)

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "GEMINI_API_KEY is not set in Netlify environment variables." }) 
            };
        }

        // Using the user-preferred model: gemini-3-flash-preview
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: prompt }] }] 
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return { 
                statusCode: response.status, 
                body: JSON.stringify({ 
                    error: data.error?.message || "Internal API Error",
                    details: data
                }) 
            };
        }

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Unexpected API response format", details: data })
            };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiResponse })
        };
    } catch (error) {
        console.error("Proxy Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to connect to Gemini API", details: error.message })
        };
    }
};

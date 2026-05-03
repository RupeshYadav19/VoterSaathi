const fetch = require('node-fetch');

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
            return { statusCode: response.status, body: JSON.stringify(data) };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiResponse })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to connect to Gemini API", details: error.message })
        };
    }
};

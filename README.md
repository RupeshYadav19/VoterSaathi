# 🗳️ VoterSaathi

An interactive Indian election assistant built with HTML, CSS & Vanilla JS. Helps citizens understand elections, register to vote, find polling booths & get AI-powered help via Google Gemini.

## 🚀 Setup Instructions

To keep API keys secure, they are stored in a local `config.js` file which is ignored by Git.

1.  **Create a `config.js` file** in the root directory:
    ```javascript
    window.CONFIG = {
        GEMINI_KEY: "YOUR_GOOGLE_GEMINI_API_KEY_HERE"
    };
    ```
2.  **Open `index.html`** in your browser (or use a live server).

## 🔐 Security Features

- **Key Isolation**: API keys are never pushed to GitHub.
- **Session Keys**: You can update your API key directly within the chatbot by pasting it into the chat box.
- **Encrypted-ish Storage**: Keys are saved to the browser's `localStorage` for a seamless session without re-entering.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JS (ES6+)
- **AI**: Google Gemini 1.5 Flash / Gemini 2.0 / Gemini 3
- **Maps**: Google Maps Embed (Zero-API-Key required)
- **Deployment**: Optimized for Firebase Hosting

---
Created by [Rupesh Yadav](https://www.linkedin.com/in/rupesh-20-yadav/)

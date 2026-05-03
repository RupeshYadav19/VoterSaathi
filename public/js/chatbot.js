/**
 * Chatbot Integration for VoterSaathi
 * @module chatbot
 */

import { showToast, toggleButtonLoading } from './ui.js';
import { getCurrentUser, saveChatHistory, updateChatResponse } from './firebase.js';

// Global State (will be assigned in initChatbot)
let chatbotToggle, chatbotPanel, chatbotClose, sendBtn, chatInput, chatMessages, typingIndicator, micBtn;

// Model selection handled by middleman proxy
const GEMINI_PROXY_URL = "/.netlify/functions/gemini"; 

/**
 * Initializes the Chatbot UI and listeners.
 */
export const initChatbot = () => {
    // Select elements fresh on initialization
    chatbotToggle = document.getElementById('chatbotToggle');
    chatbotPanel = document.getElementById('chatbotPanel');
    chatbotClose = document.getElementById('chatbotClose');
    sendBtn = document.getElementById('sendBtn');
    chatInput = document.getElementById('chatInput');
    chatMessages = document.getElementById('chatMessages');
    typingIndicator = document.getElementById('typingIndicator');
    micBtn = document.getElementById('micBtn');

    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', () => { 
            if (!getCurrentUser()) {
                showToast("Please login first to chat with AI.", "info");
                return;
            }
            chatbotPanel.classList.add('open'); 
            chatbotToggle.setAttribute('aria-expanded', 'true');
            chatbotToggle.style.display = 'none'; 
            chatInput.focus();
        });
        
        chatbotClose?.addEventListener('click', () => { 
            chatbotPanel.classList.remove('open'); 
            chatbotToggle.setAttribute('aria-expanded', 'false');
            chatbotToggle.style.display = 'flex'; 
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatbotPanel?.classList.contains('open')) {
                chatbotPanel.classList.remove('open');
                chatbotToggle.style.display = 'flex';
                chatbotToggle.focus();
            }
        });

        sendBtn?.addEventListener('click', handleSend);
        chatInput?.addEventListener('keypress', (e) => { 
            if(e.key === 'Enter') handleSend(); 
        });
    }

    if (micBtn && 'webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        micBtn.addEventListener('click', () => { 
            micBtn.style.backgroundColor = "red"; 
            recognition.start(); 
            micBtn.setAttribute('aria-label', 'Listening');
        });
        recognition.onresult = (e) => { 
            chatInput.value = e.results[0][0].transcript; 
            micBtn.style.backgroundColor = "var(--orange)"; 
            micBtn.setAttribute('aria-label', 'Use Voice Input');
            handleSend(); 
        };
        recognition.onerror = () => { 
            micBtn.style.backgroundColor = "var(--orange)"; 
            micBtn.setAttribute('aria-label', 'Use Voice Input');
            showToast("Speech recognition failed.", "error");
        };
    } else if (micBtn) { 
        micBtn.style.display = 'none'; 
    }
};

/**
 * Appends a message to the chat window.
 * @param {string} text - Message content.
 * @param {'user'|'ai'} sender - The sender type.
 */
const appendMessage = (text, sender) => {
    if(!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', sender);
    bubble.textContent = text;
    // Sanitize output conceptually (textContent prevents basic XSS)
    chatMessages.insertBefore(bubble, typingIndicator);
    
    if (sender === 'ai' && text !== "Searching...") {
        const speakBtn = document.createElement('button');
        speakBtn.innerHTML = '🔊';
        speakBtn.className = 'speak-btn';
        speakBtn.title = 'Listen to response';
        speakBtn.setAttribute('aria-label', 'Listen to response');
        speakBtn.onclick = () => speak(text);
        bubble.appendChild(speakBtn);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
};

/**
 * Speaks the text using Web Speech API.
 * @param {string} text - The text to speak.
 */
const speak = (text) => {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    } else {
        showToast("Text-to-speech not supported in this browser.", "info");
    }
};

/**
 * Handles sending a message to the AI.
 */
const handleSend = async () => {
    if(!chatInput || !getCurrentUser()) return;
    
    // Sanitize input basic
    const text = chatInput.value.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
    if(!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';
    if(typingIndicator) typingIndicator.style.display = 'block';

    const chatDocId = await saveChatHistory(text);

    try {
        const response = await fetch(GEMINI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: `You are VoterSaathi AI. Be brief: ${text}` 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Middleman API Error");
        }

        const aiResponse = data.response;
        
        if(typingIndicator) typingIndicator.style.display = 'none';
        appendMessage(aiResponse, 'ai');

        if (chatDocId) {
            await updateChatResponse(chatDocId, aiResponse);
        }

    } catch (error) {
        if(typingIndicator) typingIndicator.style.display = 'none';
        const errorMsg = `Error: ${error.message}. Please try again.`;
        appendMessage(errorMsg, 'ai');
        if (chatDocId) {
            await updateChatResponse(chatDocId, `Error: ${error.message}`);
        }
    }
};

/**
 * Allows external triggers (like suggested buttons) to send a message.
 * @param {string} text - The suggested text.
 */
window.sendSuggestion = (text) => { 
    if(chatInput) {
        chatInput.value = text; 
        handleSend(); 
    }
};

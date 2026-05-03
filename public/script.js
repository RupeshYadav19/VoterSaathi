/**
 * Main Application Entry Point
 * @module script
 */

import { initUI } from './js/ui.js';
import { initAuth } from './js/firebase.js';
import { initAuthUI, onAuthChange } from './js/authUI.js';
import { initDashboard } from './js/dashboard.js';
import { initChatbot } from './js/chatbot.js';
import './js/evm.js'; // Imports window-level functions for EVM and Eligibility

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize generic UI (Mobile Menu, Dark Mode)
    initUI();

    // 2. Initialize Auth UI
    initAuthUI();

    // 3. Initialize Firebase Auth
    initAuth(onAuthChange);

    // 4. Initialize Dashboard & Map Features
    initDashboard();

    // 5. Initialize Chatbot
    initChatbot();
});

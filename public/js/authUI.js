/**
 * Authentication UI updates
 * @module authUI
 */

import { login } from './firebase.js';

// Global State
let loginBtn, navRight;

/**
 * Initializes the Auth UI components.
 */
export const initAuthUI = () => {
    navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    // Login Button
    loginBtn = document.createElement('button');
    loginBtn.className = "pill-btn";
    loginBtn.style.padding = "6px 16px";
    loginBtn.style.fontSize = "14px";
    loginBtn.textContent = "Login";
    navRight.prepend(loginBtn);
    
    loginBtn.addEventListener('click', login);
};

/**
 * Reacts to auth state changes.
 * @param {Object} user - User object.
 */
export const onAuthChange = (user) => {
    const dashboardGrid = document.getElementById('dashboardGrid');
    const lockedOverlay = document.getElementById('lockedOverlay');
    
    if (user) {
        if (loginBtn) loginBtn.textContent = "Logout";
        if (lockedOverlay) lockedOverlay.style.display = 'none';
        if (dashboardGrid) dashboardGrid.classList.remove('dashboard-locked');
    } else {
        if (loginBtn) loginBtn.textContent = "Login";
        if (lockedOverlay) lockedOverlay.style.display = 'flex';
        if (dashboardGrid) dashboardGrid.classList.add('dashboard-locked');
    }
};

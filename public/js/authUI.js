/**
 * Authentication UI updates
 * @module authUI
 */

import { login } from './firebase.js';

// Global State
let loginBtn, profileBtn, profileDropdown, navRight;

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

    // Profile Dropdown Setup
    profileBtn = document.querySelector('.nav-right .icon-btn:not(#themeToggleBtn)');
    
    profileDropdown = document.createElement('div');
    profileDropdown.className = 'clay-card profile-dropdown';
    profileDropdown.style.display = 'none';
    profileDropdown.style.position = 'absolute';
    profileDropdown.style.top = '60px';
    profileDropdown.style.right = '20px';
    profileDropdown.style.padding = '16px';
    profileDropdown.style.zIndex = '1000';
    profileDropdown.style.minWidth = '220px';
    profileDropdown.style.textAlign = 'center';
    navRight.appendChild(profileDropdown);

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = profileDropdown.style.display === 'none';
            profileDropdown.style.display = isHidden ? 'block' : 'none';
            profileBtn.setAttribute('aria-expanded', isHidden);
        });
        
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.style.display = 'none';
                profileBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && profileDropdown.style.display === 'block') {
                profileDropdown.style.display = 'none';
                profileBtn.setAttribute('aria-expanded', 'false');
                profileBtn.focus();
            }
        });
    }

    updateProfileDropdown(null);
};

/**
 * Updates the Profile Dropdown UI.
 * @param {Object} user - The authenticated user or null.
 */
const updateProfileDropdown = (user) => {
    if (!profileDropdown) return;
    
    if (user) {
        // Sanitize
        const safeName = user.displayName ? user.displayName.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Voter';
        const safeEmail = user.email ? user.email.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

        profileDropdown.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 8px;" aria-hidden="true">🧑‍💻</div>
            <h3 style="margin-bottom: 4px; font-family: 'Nunito', sans-serif;">${safeName}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 16px; word-break: break-all;">${safeEmail}</p>
            <a href="https://www.linkedin.com/in/rupesh-20-yadav/" target="_blank" rel="noopener noreferrer" class="pill-btn" style="display:inline-block; text-decoration:none; font-size:12px; background:var(--card-blue); color:black; border-color:black; border:2px solid black;">Connect on LinkedIn</a>
        `;
    } else {
        profileDropdown.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 8px;" aria-hidden="true">👤</div>
            <h3 style="margin-bottom: 4px; font-family: 'Nunito', sans-serif;">Guest</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 16px;">Not logged in</p>
            <a href="https://www.linkedin.com/in/rupesh-20-yadav/" target="_blank" rel="noopener noreferrer" class="pill-btn" style="display:inline-block; text-decoration:none; font-size:12px; background:var(--card-blue); color:black; border-color:black; border:2px solid black;">Connect on LinkedIn</a>
        `;
    }
};

/**
 * Reacts to auth state changes.
 * @param {Object} user - User object.
 */
export const onAuthChange = (user) => {
    updateProfileDropdown(user);
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

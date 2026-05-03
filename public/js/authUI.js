/**
 * Authentication UI updates
 * @module authUI
 */

import { login } from './firebase.js';
import { toggleTheme } from './ui.js';

// Global State
let loginBtn, profileBtn, profileDropdown, navRight;
let currentUser = null; // Track current user to prevent UI resets

/**
 * Initializes the Auth UI components.
 */
export const initAuthUI = () => {
    navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    // Login Button
    loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) {
        loginBtn = document.createElement('button');
        loginBtn.id = 'loginBtn';
        loginBtn.className = "pill-btn";
        loginBtn.style.padding = "6px 16px";
        loginBtn.style.fontSize = "14px";
        loginBtn.textContent = "Login";
        navRight.prepend(loginBtn);
    }
    
    loginBtn.addEventListener('click', login);

    // Profile Dropdown Setup
    profileBtn = document.getElementById('profileBtn');
    
    profileDropdown = document.createElement('div');
    profileDropdown.className = 'clay-card profile-dropdown';
    profileDropdown.style.cssText = `
        display: none;
        position: absolute;
        top: 70px;
        right: 20px;
        padding: 24px;
        z-index: 1000;
        min-width: 260px;
        text-align: center;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    `;
    navRight.appendChild(profileDropdown);

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleProfileDropdown();
        });
        
        document.addEventListener('click', (e) => {
            if (profileDropdown.style.display === 'block' && 
                !profileBtn.contains(e.target) && 
                !profileDropdown.contains(e.target)) {
                hideProfileDropdown();
            }
        });
    }

    // Assign global toggle function for the dropdown buttons
    window.handleDropdownAction = (action) => {
        if (action === 'toggleTheme') {
            toggleTheme();
            updateProfileDropdown(currentUser); // Refresh UI with current user state
        } else if (action === 'logout') {
            login(); // firebase.js login handles both login and logout
        }
    };

    updateProfileDropdown(null);
};

const toggleProfileDropdown = () => {
    const isHidden = profileDropdown.style.display === 'none';
    if (isHidden) {
        showProfileDropdown();
    } else {
        hideProfileDropdown();
    }
};

const showProfileDropdown = () => {
    profileDropdown.style.display = 'block';
    profileBtn.setAttribute('aria-expanded', 'true');
    profileDropdown.offsetHeight;
    profileDropdown.style.opacity = '1';
    profileDropdown.style.transform = 'translateY(0)';
    profileDropdown.style.pointerEvents = 'auto';
};

const hideProfileDropdown = () => {
    profileDropdown.style.opacity = '0';
    profileDropdown.style.transform = 'translateY(-10px)';
    profileDropdown.style.pointerEvents = 'none';
    profileBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
        if (profileDropdown.style.opacity === '0') {
            profileDropdown.style.display = 'none';
        }
    }, 300);
};

/**
 * Updates the Profile Dropdown UI.
 * @param {Object} user - The authenticated user or null.
 */
const updateProfileDropdown = (user) => {
    if (!profileDropdown) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const themeIcon = isDark ? '☀️' : '🌙';
    const themeText = isDark ? 'Light Mode' : 'Dark Mode';

    if (user) {
        const safeName = (user.displayName || 'Voter').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeEmail = (user.email || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");

        profileDropdown.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 12px;" aria-hidden="true">👤</div>
            <h3 style="margin-bottom: 4px; font-family: 'Nunito', sans-serif; font-weight: 800;">${safeName}</h3>
            <p style="font-size: 13px; color: #666; margin-bottom: 20px; word-break: break-all;">${safeEmail}</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="pill-btn" onclick="handleDropdownAction('toggleTheme')" style="font-size:12px; background:var(--white); color:var(--dark-text); border:2px solid var(--dashed-line);">
                    ${themeIcon} ${themeText}
                </button>
                <a href="https://www.linkedin.com/in/rupesh-20-yadav/" target="_blank" rel="noopener noreferrer" class="pill-btn" style="text-decoration:none; font-size:12px; background:var(--card-blue); color:black; border:2px solid black;">Connect on LinkedIn</a>
                <button class="pill-btn" onclick="handleDropdownAction('logout')" style="font-size:12px; background:#ff4444; color:white; border:none;">Logout</button>
            </div>
        `;
    } else {
        profileDropdown.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 12px;" aria-hidden="true">👤</div>
            <h3 style="margin-bottom: 4px; font-family: 'Nunito', sans-serif; font-weight: 800;">Guest</h3>
            <p style="font-size: 13px; color: #666; margin-bottom: 20px;">Not logged in</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="pill-btn" onclick="handleDropdownAction('toggleTheme')" style="font-size:12px; background:var(--white); color:var(--dark-text); border:2px solid var(--dashed-line);">
                    ${themeIcon} ${themeText}
                </button>
                <button class="pill-btn" onclick="document.getElementById('loginBtn').click()" style="font-size:12px; background:var(--orange); color:white; border:none;">Login Now</button>
            </div>
        `;
    }
};

/**
 * Reacts to auth state changes.
 * @param {Object} user - User object.
 */
export const onAuthChange = (user) => {
    currentUser = user; // Store user globally in this module
    updateProfileDropdown(user);
    const dashboardGrid = document.getElementById('dashboardGrid');
    const lockedOverlay = document.getElementById('lockedOverlay');
    
    if (user) {
        if (loginBtn) {
            loginBtn.textContent = "Logout";
            loginBtn.style.background = "#ff4444";
        }
        if (lockedOverlay) lockedOverlay.style.display = 'none';
        if (dashboardGrid) dashboardGrid.classList.remove('dashboard-locked');
    } else {
        if (loginBtn) {
            loginBtn.textContent = "Login";
            loginBtn.style.background = "var(--orange)";
        }
        if (lockedOverlay) lockedOverlay.style.display = 'flex';
        if (dashboardGrid) dashboardGrid.classList.add('dashboard-locked');
    }
};

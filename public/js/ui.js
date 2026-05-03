/**
 * UI Utilities for VoterSaathi
 * @module ui
 */

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - The type of toast.
 */
export const showToast = (message, type = 'info') => {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close message">&times;</button>
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => toast.remove());

    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 5000);
};

/**
 * Toggles a loading spinner on a button.
 * @param {HTMLElement} button - The button element.
 * @param {boolean} isLoading - Whether it is currently loading.
 * @param {string} originalText - Original button text to restore.
 */
export const toggleButtonLoading = (button, isLoading, originalText = 'Submit') => {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.innerHTML = `<span class="spinner" aria-hidden="true"></span> Loading...`;
    } else {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = originalText;
    }
};

/**
 * Displays a loading overlay over an element.
 * @param {HTMLElement} container - The container to overlay.
 * @param {boolean} isLoading - State.
 */
export const toggleContainerLoading = (container, isLoading) => {
    if (!container) return;
    if (isLoading) {
        container.classList.add('loading-overlay-active');
        const spinner = document.createElement('div');
        spinner.className = 'container-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        container.appendChild(spinner);
        container.setAttribute('aria-busy', 'true');
    } else {
        container.classList.remove('loading-overlay-active');
        const spinner = container.querySelector('.container-spinner');
        if (spinner) spinner.remove();
        container.removeAttribute('aria-busy');
    }
};

/**
 * Initializes generic UI interactions like mobile menu and theme toggle.
 */
export const initUI = () => {
    // Mobile Menu
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            hamburgerMenu.setAttribute('aria-expanded', isOpen);
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                hamburgerMenu.setAttribute('aria-expanded', 'false');
                hamburgerMenu.focus();
            }
        });
    }

    // Load saved theme on boot
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
};

/**
 * Toggles the site theme and saves preference.
 * @returns {boolean} New theme state (true for dark).
 */
export const toggleTheme = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    return isDark;
};

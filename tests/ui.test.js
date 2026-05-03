import { showToast, toggleButtonLoading, toggleContainerLoading, initUI } from '../public/js/ui.js';

describe('UI Utilities', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.useFakeTimers();
    });

    describe('showToast', () => {
        it('should create a toast message', () => {
            showToast('Test Message', 'success');
            const toast = document.querySelector('.toast');
            expect(toast).toBeTruthy();
            expect(toast.textContent).toContain('Test Message');
            expect(toast.classList.contains('toast-success')).toBe(true);
        });

        it('should remove toast after timeout', () => {
            showToast('Test Message');
            jest.advanceTimersByTime(5000);
            expect(document.querySelector('.toast')).toBeNull();
        });

        it('should remove toast when close button is clicked', () => {
            showToast('Test Message');
            const closeBtn = document.querySelector('.toast-close');
            closeBtn.click();
            expect(document.querySelector('.toast')).toBeNull();
        });
    });

    describe('toggleButtonLoading', () => {
        it('should show spinner when loading', () => {
            const btn = document.createElement('button');
            toggleButtonLoading(btn, true, 'Original');
            expect(btn.disabled).toBe(true);
            expect(btn.innerHTML).toContain('spinner');
            expect(btn.getAttribute('aria-busy')).toBe('true');
        });

        it('should restore text when not loading', () => {
            const btn = document.createElement('button');
            toggleButtonLoading(btn, false, 'Original');
            expect(btn.disabled).toBe(false);
            expect(btn.textContent).toBe('Original');
            expect(btn.getAttribute('aria-busy')).toBeNull();
        });
    });

    describe('initUI', () => {
        it('should set up mobile menu', () => {
            document.body.innerHTML = `
                <button id="hamburgerMenu"></button>
                <div id="navLinks"></div>
                <div class="nav-right"></div>
            `;
            initUI();
            const hamburger = document.getElementById('hamburgerMenu');
            const navLinks = document.getElementById('navLinks');
            
            hamburger.click();
            expect(navLinks.classList.contains('open')).toBe(true);
            expect(hamburger.getAttribute('aria-expanded')).toBe('true');
            
            hamburger.click();
            expect(navLinks.classList.contains('open')).toBe(false);
            expect(hamburger.getAttribute('aria-expanded')).toBe('false');
        });

        it('should handle escape key for mobile menu', () => {
            document.body.innerHTML = `
                <button id="hamburgerMenu"></button>
                <div id="navLinks" class="open"></div>
                <div class="nav-right"></div>
            `;
            initUI();
            const navLinks = document.getElementById('navLinks');
            
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(navLinks.classList.contains('open')).toBe(false);
        });

        it('should toggle theme', () => {
            document.body.innerHTML = `
                <div class="nav-right"></div>
            `;
            initUI();
            const themeBtn = document.getElementById('themeToggleBtn');
            expect(themeBtn).toBeTruthy();
            
            themeBtn.click();
            expect(document.body.classList.contains('dark-mode')).toBe(true);
            expect(themeBtn.innerHTML).toBe('☀️');
            
            themeBtn.click();
            expect(document.body.classList.contains('dark-mode')).toBe(false);
            expect(themeBtn.innerHTML).toBe('🌙');
        });
    });
});

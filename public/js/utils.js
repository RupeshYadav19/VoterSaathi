/**
 * Core utility functions for VoterSaathi
 * @module utils
 */

/**
 * Validates a 6-digit Indian Pincode.
 * @param {string} pincode - The pincode to validate.
 * @returns {boolean} True if the pincode is valid, false otherwise.
 */
export const validatePincode = (pincode) => {
    if (!pincode) return false;
    const trimmed = pincode.trim();
    return trimmed.length === 6 && /^\d+$/.test(trimmed);
};

/**
 * Calculates a user's age based on their Date of Birth.
 * @param {string} dobString - Date of birth in YYYY-MM-DD format.
 * @param {Date} [today=new Date()] - Optional date to calculate age against.
 * @returns {number|null} The calculated age, or null if input is invalid.
 */
export const calculateAge = (dobString, today = new Date()) => {
    if (!dobString) return null;
    try {
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    } catch (e) {
        return null;
    }
};

/**
 * Debounces a function, preventing it from being called too frequently.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} A debounced version of the function.
 */
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Simple in-memory cache for API responses.
 */
class ResponseCache {
    constructor() {
        this.cache = new Map();
    }
    
    /**
     * Get a value from the cache.
     * @param {string} key - Cache key.
     * @returns {*} The cached value or undefined.
     */
    get(key) {
        return this.cache.get(key);
    }
    
    /**
     * Set a value in the cache.
     * @param {string} key - Cache key.
     * @param {*} value - The value to cache.
     */
    set(key, value) {
        this.cache.set(key, value);
    }
}

export const apiCache = new ResponseCache();

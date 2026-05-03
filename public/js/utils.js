/**
 * Core utility functions for VoterSaathi
 */

export function validatePincode(pincode) {
    if (!pincode) return false;
    const trimmed = pincode.trim();
    return trimmed.length === 6 && /^\d+$/.test(trimmed);
}

export function calculateAge(dobString, today = new Date()) {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

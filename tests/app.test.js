/**
 * @jest-environment jsdom
 */

// Import the real logic from our project!
import { validatePincode, calculateAge } from '../public/js/utils.js';

describe("VoterSaathi Core App Logic Tests", () => {
    
    describe("Pincode Validation Logic", () => {
        test("should return true for a valid 6-digit Indian pincode", () => {
            expect(validatePincode("301402")).toBe(true);
            expect(validatePincode("110001")).toBe(true);
        });

        test("should return false for pincodes that are too short or long", () => {
            expect(validatePincode("12345")).toBe(false);
            expect(validatePincode("1234567")).toBe(false);
        });

        test("should return false for pincodes with letters", () => {
            expect(validatePincode("ABCDEF")).toBe(false);
            expect(validatePincode("301 02")).toBe(false);
        });

        test("should handle whitespace by trimming", () => {
            expect(validatePincode("  301402  ")).toBe(true);
        });
    });

    describe("Age Calculation & Eligibility Logic", () => {
        const today = new Date("2026-05-01T00:00:00Z");

        test("should correctly calculate age for a standard date", () => {
            const age = calculateAge("2000-01-01", today);
            expect(age).toBe(26);
        });

        test("should handle the 'barely 18' edge case (Birthday today)", () => {
            const age = calculateAge("2008-05-01", today);
            expect(age).toBe(18);
        });

        test("should handle the 'not yet 18' edge case (Birthday tomorrow)", () => {
            const age = calculateAge("2008-05-02", today);
            expect(age).toBe(17);
        });

        test("should return null for empty date inputs", () => {
            expect(calculateAge("")).toBe(null);
        });
    });
});

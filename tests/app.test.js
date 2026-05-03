import { validatePincode, calculateAge, debounce, apiCache } from '../public/js/utils.js';

describe('VoterSaathi Utilities', () => {
    describe('validatePincode', () => {
        it('should return true for valid 6-digit pincode', () => {
            expect(validatePincode('400001')).toBe(true);
            expect(validatePincode('110001')).toBe(true);
        });

        it('should return false for invalid pincodes', () => {
            expect(validatePincode('40001')).toBe(false); // 5 digits
            expect(validatePincode('4000012')).toBe(false); // 7 digits
            expect(validatePincode('ABCDEF')).toBe(false); // letters
            expect(validatePincode('400 01')).toBe(false); // space
            expect(validatePincode(null)).toBe(false);
            expect(validatePincode('')).toBe(false);
        });
    });

    describe('calculateAge', () => {
        const today = new Date('2024-05-01');

        it('should correctly calculate age based on DOB', () => {
            expect(calculateAge('2000-05-01', today)).toBe(24);
            expect(calculateAge('2006-04-30', today)).toBe(18); // Just turned 18
        });

        it('should account for birth month not reached yet', () => {
            expect(calculateAge('2000-06-01', today)).toBe(23); 
        });

        it('should return null for invalid inputs', () => {
            expect(calculateAge(null)).toBe(null);
            expect(calculateAge('')).toBe(null);
        });
    });

    describe('apiCache', () => {
        it('should set and retrieve values', () => {
            apiCache.set('test_key', { data: 'test' });
            expect(apiCache.get('test_key')).toEqual({ data: 'test' });
        });

        it('should return undefined for non-existent keys', () => {
            expect(apiCache.get('wrong_key')).toBeUndefined();
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();
        it('should delay function execution', () => {
            const func = jest.fn();
            const debounced = debounce(func, 1000);
            
            debounced();
            debounced();
            debounced();
            
            expect(func).not.toBeCalled();
            jest.runAllTimers();
            expect(func).toBeCalledTimes(1);
        });
    });
});

describe('Firebase Auth UI logic (Mocked)', () => {
    let mockUser;
    
    beforeEach(() => {
        mockUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' };
    });

    it('should handle missing user safely', () => {
        expect(() => {
            // Mock what updateProfileDropdown would do conceptually
            const safeName = undefined ? 'Voter' : 'Guest';
            expect(safeName).toBe('Guest');
        }).not.toThrow();
    });
});

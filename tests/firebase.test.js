import { initAuth, login, getCurrentUser, saveSearchHistory, saveChatHistory } from '../public/js/firebase.js';
import * as auth from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import * as firestore from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

describe('Firebase Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initAuth', () => {
        it('should register onAuthStateChanged listener', () => {
            const callback = jest.fn();
            initAuth(callback);
            expect(auth.onAuthStateChanged).toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should call signInWithPopup if not logged in', async () => {
            // Mock currentUser as null
            auth.onAuthStateChanged.mockImplementation((authObj, cb) => cb(null));
            initAuth();
            
            await login();
            expect(auth.signInWithPopup).toHaveBeenCalled();
        });

        it('should call signOut if already logged in', async () => {
            // Mock currentUser as user
            const mockUser = { uid: '123' };
            auth.onAuthStateChanged.mockImplementation((authObj, cb) => cb(mockUser));
            initAuth(() => {});
            
            await login();
            expect(auth.signOut).toHaveBeenCalled();
        });
    });

    describe('saveSearchHistory', () => {
        it('should call setDoc if user is logged in', async () => {
            const mockUser = { uid: '123', email: 'test@example.com' };
            auth.onAuthStateChanged.mockImplementation((authObj, cb) => cb(mockUser));
            initAuth();
            
            await saveSearchHistory('400001');
            expect(firestore.setDoc).toHaveBeenCalled();
            expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'users', '123');
        });
    });

    describe('saveChatHistory', () => {
        it('should call addDoc and return docId', async () => {
            const mockUser = { uid: '123', email: 'test@example.com' };
            auth.onAuthStateChanged.mockImplementation((authObj, cb) => cb(mockUser));
            initAuth();
            
            firestore.addDoc.mockResolvedValue({ id: 'chat123' });
            
            const docId = await saveChatHistory('Hello');
            expect(firestore.addDoc).toHaveBeenCalled();
            expect(docId).toBe('chat123');
        });
    });
});

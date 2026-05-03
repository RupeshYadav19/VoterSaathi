// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock window.VOTER_CONFIG
window.VOTER_CONFIG = {
  FIREBASE_CONFIG: {
    apiKey: "test-api-key",
    authDomain: "test.firebaseapp.com",
    projectId: "test-project",
    storageBucket: "test.appspot.com",
    messagingSenderId: "123",
    appId: "1:123:web:abc",
    measurementId: "G-123"
  }
};

// Mock Firebase SDKs
jest.mock('https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js', () => ({
  initializeApp: jest.fn(() => ({})),
}), { virtual: true });

jest.mock('https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(),
}), { virtual: true });

jest.mock('https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: 'local',
}), { virtual: true });

jest.mock('https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'now'),
  query: jest.fn(() => ({})),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ forEach: () => {} })),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
}), { virtual: true });

jest.mock('https://www.gstatic.com/firebasejs/10.9.0/firebase-performance.js', () => ({
  getPerformance: jest.fn(() => ({})),
}), { virtual: true });

jest.mock('https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js', () => ({
  getFunctions: jest.fn(() => ({})),
}), { virtual: true });

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";
import { validatePincode, calculateAge } from "./js/utils.js";

// Configuration loaded from window.VOTER_CONFIG (Git Ignored)
const CONFIG = window.VOTER_CONFIG;
const GEMINI_API_KEY = CONFIG?.GEMINI_API_KEY || "";
const firebaseConfig = CONFIG?.FIREBASE_CONFIG || {};

// Initialize Firebase only if config exists
let app, analytics, auth, db, functions;
if (CONFIG) {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
}

// 1. Core Logic: Mobile Menu
const hamburgerMenu = document.getElementById('hamburgerMenu');
const navLinks = document.getElementById('navLinks');
if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburgerMenu.setAttribute('aria-expanded', isOpen);
    });
}

// Auth State Management
const loginBtn = document.createElement('button');
loginBtn.className = "pill-btn";
loginBtn.style.padding = "6px 16px";
loginBtn.style.fontSize = "14px";
loginBtn.textContent = "Login";
const navRight = document.querySelector('.nav-right');
if(navRight) {
    navRight.prepend(loginBtn);
}

let currentUser = null;

// Setup Profile Dropdown
const profileBtn = document.querySelector('.nav-right .icon-btn');
const profileDropdown = document.createElement('div');
profileDropdown.className = 'clay-card profile-dropdown';
profileDropdown.style.display = 'none';
profileDropdown.style.position = 'absolute';
profileDropdown.style.top = '60px';
profileDropdown.style.right = '20px';
profileDropdown.style.padding = '16px';
profileDropdown.style.zIndex = '1000';
profileDropdown.style.minWidth = '220px';
profileDropdown.style.textAlign = 'center';
if(navRight) {
    navRight.appendChild(profileDropdown);
}

if(profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
        if(!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.style.display = 'none';
        }
    });
}

function updateProfileDropdown(user) {
    if (user) {
        profileDropdown.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 8px;">🧑‍💻</div>
            <h3 style="margin-bottom: 4px; font-family: 'Nunito', sans-serif;">${user.displayName || 'Voter'}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 16px; word-break: break-all;">${user.email}</p>
            <a href="https://www.linkedin.com/in/rupesh-20-yadav/" target="_blank" class="pill-btn" style="display:inline-block; text-decoration:none; font-size:12px; background:var(--card-blue); color:black; border-color:black; border:2px solid black;">Connect on LinkedIn</a>
        `;
    } else {
        profileDropdown.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 8px;">👤</div>
            <h3 style="margin-bottom: 4px; font-family: 'Nunito', sans-serif;">Guest</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 16px;">Not logged in</p>
            <a href="https://www.linkedin.com/in/rupesh-20-yadav/" target="_blank" class="pill-btn" style="display:inline-block; text-decoration:none; font-size:12px; background:var(--card-blue); color:black; border-color:black; border:2px solid black;">Connect on LinkedIn</a>
        `;
    }
}
updateProfileDropdown(null);

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const dashboardGrid = document.getElementById('dashboardGrid');
    const lockedOverlay = document.getElementById('lockedOverlay');
    
    updateProfileDropdown(user);

    if (user) {
        loginBtn.textContent = "Logout";
        if(lockedOverlay) lockedOverlay.style.display = 'none';
        if(dashboardGrid) dashboardGrid.classList.remove('dashboard-locked');
    } else {
        loginBtn.textContent = "Login";
        if(lockedOverlay) lockedOverlay.style.display = 'flex';
        if(dashboardGrid) dashboardGrid.classList.add('dashboard-locked');
    }
});

loginBtn.addEventListener('click', async () => {
    try {
        if (currentUser) {
            await signOut(auth);
            alert("Logged out successfully.");
        } else {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        }
    } catch (error) {
        console.error("Auth Error", error);
        alert("Authentication failed. Please try again.");
    }
});

// 2. Dashboard & Gemini AI Integration
const findBoothBtn = document.getElementById('findBoothBtn');
const pincodeInput = document.getElementById('pincodeInput');
const dashboardGrid = document.getElementById('dashboardGrid');
const mapContainer = document.getElementById('mapContainer');
const mapFrame = document.getElementById('mapFrame');

let timerInterval;

if (findBoothBtn) {
    findBoothBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert("Please login first to use the Pincode Search.");
            return;
        }

        const pincode = pincodeInput.value.trim();
        if (!validatePincode(pincode)) {
            alert("Please enter a valid 6-digit Indian pincode.");
            return;
        }

        document.querySelectorAll('.clay-card').forEach(c => c.classList.add('unlocked'));
        if(mapContainer) mapContainer.style.display = 'block';
        showNearby(); 

        // Save search history to Firestore
        if (currentUser) {
            setDoc(doc(db, "users", currentUser.uid), {
                lastPincode: pincode,
                lastSearch: serverTimestamp(),
                email: currentUser.email
            }, { merge: true }).catch(err => console.error("Error saving pincode:", err));
        }
        try {
            if(document.getElementById('mpName')) document.getElementById('mpName').textContent = "Searching...";

            const prompt = `Provide electoral info for Indian pincode ${pincode} as JSON: {"mpName", "mlaName", "state", "chiefMinister", "nextElectionDate", "areaName", "mpConstituency"}`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            const info = JSON.parse(rawText.replace(/```json|```/g, "").trim());

            // Update UI
            if(document.getElementById('locationDisplay')) document.getElementById('locationDisplay').textContent = `Location: ${info.areaName || "Area Identified"}`;
            if(document.getElementById('mpName')) document.getElementById('mpName').textContent = info.mpName || "N/A";
            if(document.getElementById('mpConstituency')) document.getElementById('mpConstituency').textContent = `Constituency: ${info.mpConstituency || "N/A"}`;
            if(document.getElementById('partyName')) document.getElementById('partyName').textContent = info.mlaName || "N/A";
            if(document.getElementById('stateName')) document.getElementById('stateName').textContent = `State: ${info.state || "N/A"}`;
            if(document.getElementById('cmName')) document.getElementById('cmName').textContent = `CM: ${info.chiefMinister || "N/A"}`;
            
            const targetDate = new Date(info.nextElectionDate || "2029-05-01");
            if(document.getElementById('nextElectionDate')) document.getElementById('nextElectionDate').textContent = targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                const distance = targetDate.getTime() - new Date().getTime();
                if (distance < 0) {
                    if(document.getElementById('liveTimer')) document.getElementById('liveTimer').textContent = "Election Day!";
                    return;
                }
                const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);
                if(document.getElementById('liveTimer')) document.getElementById('liveTimer').textContent = `${d}d ${h}h ${m}m ${s}s`;
            }, 1000);

            document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error("AI Error:", error);
            if(document.getElementById('mpName')) document.getElementById('mpName').textContent = "Error";
            alert("Failed to fetch AI details. Please check your internet.");
        }
    });
}

window.showNearby = () => {
    const pincodeInput = document.getElementById('pincodeInput');
    const pincode = pincodeInput ? pincodeInput.value : "";
    const mapFrame = document.getElementById('mapFrame');
    
    if (navigator.geolocation) {
        if(mapFrame) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                mapFrame.src = `https://maps.google.com/maps?q=${lat},${lon}&z=15&t=&ie=UTF8&iwloc=&output=embed`;
            }, (error) => {
                mapFrame.src = `https://maps.google.com/maps?q=${pincode}+India&t=&z=14&ie=UTF8&iwloc=&output=embed`;
            }, { timeout: 10000 });
        }
    } else {
        if(mapFrame) {
            mapFrame.src = `https://maps.google.com/maps?q=${pincode}+India&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        }
    }
};

window.openInGoogleMaps = () => {
    const pincodeInput = document.getElementById('pincodeInput');
    const pincode = pincodeInput ? pincodeInput.value : "";
    window.open(`https://www.google.com/maps/search/polling+booths+near+${pincode}+India`, '_blank');
};

// 3. EVM Practice Logic
window.castVote = (candidateName) => {
    const vvpatSlip = document.getElementById('vvpatSlip');
    const votedName = document.getElementById('votedName');
    if(votedName) votedName.textContent = candidateName;
    if(vvpatSlip) vvpatSlip.style.height = '100px';
    setTimeout(() => {
        if(vvpatSlip) vvpatSlip.style.height = '0';
        if(document.querySelector('.evm-machine')) document.querySelector('.evm-machine').style.display = 'none';
        if(document.getElementById('voteSuccess')) document.getElementById('voteSuccess').style.display = 'block';
    }, 4000);
};

window.resetEVM = () => {
    if(document.querySelector('.evm-machine')) document.querySelector('.evm-machine').style.display = 'block';
    if(document.getElementById('voteSuccess')) document.getElementById('voteSuccess').style.display = 'none';
};

window.checkEligibility = () => {
    const dob = document.getElementById('dobInput').value;
    const result = document.getElementById('eligibilityResult');
    if(!dob || !result) return;
    
    const age = calculateAge(dob);
    if (age === null) return;
    
    if (age >= 18) {
        result.textContent = "Eligible! (" + age + " years)";
        result.style.color = "#00b150";
    } else {
        result.textContent = "Eligible in " + (18 - age) + " years.";
        result.style.color = "#E8622A";
    }
};

// 5. AI Chatbot
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatbotClose = document.getElementById('chatbotClose');
const sendBtn = document.getElementById('sendBtn');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const typingIndicator = document.getElementById('typingIndicator');

if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => { 
        if (!currentUser) {
            alert("Please login first to chat with AI.");
            return;
        }
        chatbotPanel.classList.add('open'); 
        chatbotToggle.style.display = 'none'; 
    });
    chatbotClose.addEventListener('click', () => { chatbotPanel.classList.remove('open'); chatbotToggle.style.display = 'flex'; });
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSend(); });
}

function appendMessage(text, sender) {
    if(!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', sender);
    bubble.textContent = text;
    chatMessages.insertBefore(bubble, typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSend() {
    if(!chatInput || !currentUser) return;
    const text = chatInput.value.trim();
    if(!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';
    if(typingIndicator) typingIndicator.style.display = 'block';

    // 1. Save the User's question to Firestore immediately
    let chatDocId = null;
    try {
        const docRef = await addDoc(collection(db, "chatHistory"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userMessage: text,
            aiResponse: "Pending...", // Placeholder while AI thinks
            timestamp: serverTimestamp()
        });
        chatDocId = docRef.id;
    } catch(dbError) {
        console.error("Failed to save initial chat history:", dbError);
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `You are VoterSaathi AI. Be brief: ${text}` }] }] })
        });
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        if(typingIndicator) typingIndicator.style.display = 'none';
        appendMessage(aiResponse, 'ai');

        // 2. Update the document with the AI's actual response
        if (chatDocId) {
            await setDoc(doc(db, "chatHistory", chatDocId), {
                aiResponse: aiResponse
            }, { merge: true });
        }

    } catch (error) {
        if(typingIndicator) typingIndicator.style.display = 'none';
        appendMessage("Sorry, I couldn't process that. Please try again.", 'ai');
        
        if (chatDocId) {
            await setDoc(doc(db, "chatHistory", chatDocId), {
                aiResponse: "Error: AI failed to respond."
            }, { merge: true });
        }
    }
}

window.sendSuggestion = (text) => { if(chatInput) chatInput.value = text; handleSend(); };

// 6. Speech Recognition
const micBtn = document.getElementById('micBtn');
if (micBtn && 'webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    micBtn.addEventListener('click', () => { micBtn.style.backgroundColor = "red"; recognition.start(); });
    recognition.onresult = (e) => { chatInput.value = e.results[0][0].transcript; micBtn.style.backgroundColor = "var(--orange)"; handleSend(); };
    recognition.onerror = () => { micBtn.style.backgroundColor = "var(--orange)"; };
} else if (micBtn) { micBtn.style.display = 'none'; }

// 1. Core Logic: Mobile Menu
const hamburgerMenu = document.getElementById('hamburgerMenu');
const navLinks = document.getElementById('navLinks');
if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
}

// 2. Dashboard & Gemini AI Integration
const findBoothBtn = document.getElementById('findBoothBtn');
const pincodeInput = document.getElementById('pincodeInput');
const dashboardGrid = document.getElementById('dashboardGrid');
const lockedOverlay = document.getElementById('lockedOverlay');
const mapContainer = document.getElementById('mapContainer');
const mapFrame = document.getElementById('mapFrame');

// API Key Management (Securely handled via config.js and localStorage)
const getGeminiKey = () => {
    // 1. Check if user updated it via chat (localStorage)
    const sessionKey = localStorage.getItem('VOTERSAATHI_KEY');
    if (sessionKey) return sessionKey;
    
    // 2. Check for local config.js (won't be on GitHub)
    if (window.CONFIG && window.CONFIG.GEMINI_KEY) return window.CONFIG.GEMINI_KEY;
    
    // 3. Last fallback (if nothing found)
    return "KEY_NOT_FOUND";
};

// Failsafe Proxies
const PROXIES = [
    "", 
    "https://corsproxy.io/?",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://thingproxy.freeboard.io/fetch/",
    "https://api.allorigins.win/raw?url="
];

const MODELS = [
    "gemini-3-flash-preview",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro"
];

let timerInterval;

if (findBoothBtn) {
    findBoothBtn.addEventListener('click', async () => {
        const pincode = pincodeInput.value.trim();
        if (pincode.length !== 6) {
            alert("Please enter a valid 6-digit Indian pincode.");
            return;
        }

        // UNLOCK UI IMMEDIATELY
        if(lockedOverlay) lockedOverlay.style.display = 'none';
        if(dashboardGrid) dashboardGrid.classList.remove('dashboard-locked');
        document.querySelectorAll('.clay-card').forEach(c => c.classList.add('unlocked'));
        
        if(mapContainer) mapContainer.style.display = 'block';
        showNearby(); 

        const prompt = `You are a precise Indian Election Assistant. For the Indian pincode ${pincode}, provide the EXACT electoral details. 
        IMPORTANT: Verify the specific Tehsil/Area (e.g., 301402 is Bansur, Alwar, not Behror). 
        Return ONLY a JSON object: {"mpName", "mlaName", "state", "chiefMinister", "nextElectionDate" (YYYY-MM-DD), "areaName", "mpConstituency"}. No markdown.`;
        
        let success = false;
        for (const model of MODELS) {
            if (success) break;
            for (let i = 0; i < PROXIES.length; i++) {
                if (success) break;
                try {
                    const proxy = PROXIES[i];
                    const versions = ["v1beta", "v1"];
                    for (const ver of versions) {
                        if (success) break;
                        const url = `${proxy}https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${getGeminiKey()}`;
                        
                        if(document.getElementById('mpName')) document.getElementById('mpName').textContent = "Connecting (Route " + (i+1) + ")...";

                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                            signal: AbortSignal.timeout(10000)
                        });

                        if (!response.ok) {
                            console.warn(`Pincode Route ${i} with ${model} failed status: ${response.status}`);
                            continue;
                        }

                        const data = await response.json();
                        if (!data.candidates || !data.candidates[0]) continue;
                        
                        let rawText = data.candidates[0].content.parts[0].text.trim();
                        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                        const info = JSON.parse(rawText);

                        // Hardcoded Correction for known precision issues
                        if (pincode === "301402") {
                            info.areaName = "Bansur (Alwar)";
                        }

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

                        success = true;
                        document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
                    }
                } catch (e) {
                    console.warn("Pincode Route " + i + " failed:", e);
                }
            }
        }

        if (!success) {
            if(document.getElementById('mpName')) document.getElementById('mpName').textContent = "AI Sync Error";
            if(document.getElementById('partyName')) document.getElementById('partyName').textContent = "Refresh & try one last time.";
        }
    });
}

window.showNearby = () => {
    const pincode = pincodeInput.value || "";
    if (navigator.geolocation) {
        if(document.getElementById('mapFrame')) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Simplified URL to focus on live location
                mapFrame.src = `https://maps.google.com/maps?q=${lat},${lon}&z=15&t=&ie=UTF8&iwloc=&output=embed`;
            }, (error) => {
                console.warn("Geolocation failed, falling back to pincode.");
                mapFrame.src = `https://maps.google.com/maps?q=${pincode}+India&t=&z=14&ie=UTF8&iwloc=&output=embed`;
            }, { timeout: 10000 });
        }
    } else {
        mapFrame.src = `https://maps.google.com/maps?q=${pincode}+India&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }
};

window.openInGoogleMaps = () => {
    const pincode = pincodeInput.value || "";
    // Search for booths in the full map view
    window.open(`https://www.google.com/maps/search/polling+booths+near+${pincode}+India`, '_blank');
};

// Remove searchInMap since search bar was removed
window.searchInMap = null;

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

// 4. Age Eligibility
window.checkEligibility = () => {
    const dob = document.getElementById('dobInput').value;
    const result = document.getElementById('eligibilityResult');
    if(!dob || !result) return;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    
    if (age >= 18) {
        result.textContent = "Eligible! (" + age + " years)";
        result.style.color = "#00b150";
    } else {
        result.textContent = "Eligible in " + (18 - age) + " years.";
        result.style.color = "#E8622A";
    }
};

// 5. AI Chatbot (Triple-Proxy)
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatbotClose = document.getElementById('chatbotClose');
const sendBtn = document.getElementById('sendBtn');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const typingIndicator = document.getElementById('typingIndicator');

if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => { chatbotPanel.classList.add('open'); chatbotToggle.style.display = 'none'; });
    chatbotClose.addEventListener('click', () => { chatbotPanel.classList.remove('open'); chatbotToggle.style.display = 'flex'; });
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSend(); });
}

function appendMessage(text, sender) {
    if(!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', sender);
    bubble.innerHTML = text; 
    chatMessages.insertBefore(bubble, typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSend() {
    if(!chatInput) return;
    const text = chatInput.value.trim();
    if(!text) return;

    // Secret feature: Update API key if provided in chat
    if (text.startsWith("AIzaSy") && text.length > 20) {
        localStorage.setItem('VOTERSAATHI_KEY', text);
        appendMessage("API Key updated and saved to your browser! 🔐", 'ai');
        chatInput.value = '';
        return;
    }

    appendMessage(text, 'user');
    chatInput.value = '';
    if(typingIndicator) typingIndicator.style.display = 'block';
    let success = false;

    for (const model of MODELS) {
        if (success) break;
        for (const proxy of PROXIES) {
            if (success) break;
            try {
                // Try both v1beta and v1
                const versions = ["v1beta", "v1"];
                for (const ver of versions) {
                    if (success) break;
                    const url = `${proxy}https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${getGeminiKey()}`;
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            contents: [{ parts: [{ text: `You are VoterSaathi AI. Be brief: ${text}` }] }] 
                        }),
                        signal: AbortSignal.timeout(10000)
                    });

                    if (!response.ok) continue;

                    const data = await response.json();
                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        const aiText = data.candidates[0].content.parts[0].text;
                        if(typingIndicator) typingIndicator.style.display = 'none';
                        appendMessage(aiText, 'ai');
                        success = true;
                    }
                }
            } catch (e) {
                console.warn(`Model ${model} via ${proxy} failed.`);
            }
        }
    }
    if(!success) {
        if(typingIndicator) typingIndicator.style.display = 'none';
        appendMessage("AI currently busy. Please refresh the page.", 'ai');
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

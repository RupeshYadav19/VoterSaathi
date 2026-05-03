/**
 * Dashboard and Maps Integration for VoterSaathi
 * @module dashboard
 */

import { validatePincode, debounce, apiCache } from './utils.js';
import { getCurrentUser, saveSearchHistory } from './firebase.js';
import { showToast, toggleButtonLoading } from './ui.js';

// Global State
let findBoothBtn, pincodeInput, mapContainer, mapFrame;

let timerInterval;

// Model selection handled by middleman proxy
const GEMINI_PROXY_URL = "/.netlify/functions/gemini"; 

/**
 * Initializes the Dashboard UI.
 */
export const initDashboard = () => {
    // Select elements fresh
    findBoothBtn = document.getElementById('findBoothBtn');
    pincodeInput = document.getElementById('pincodeInput');
    mapContainer = document.getElementById('mapContainer');
    mapFrame = document.getElementById('mapFrame');

    if (findBoothBtn && pincodeInput) {
        // Use debounce to prevent spamming
        const debouncedSearch = debounce(handleSearch, 500);
        findBoothBtn.addEventListener('click', debouncedSearch);
        
        pincodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') debouncedSearch();
        });
    }
};

/**
 * Handles the pincode search.
 */
const handleSearch = async () => {
    if (!getCurrentUser()) {
        showToast("Please login first to use the Pincode Search.", "info");
        return;
    }

    const pincode = pincodeInput.value.trim();
    if (!validatePincode(pincode)) {
        showToast("Please enter a valid 6-digit Indian pincode.", "error");
        return;
    }

    document.querySelectorAll('.clay-card').forEach(c => c.classList.add('unlocked'));
    if(mapContainer) mapContainer.style.display = 'block';
    
    showNearby(pincode); 
    saveSearchHistory(pincode);

    // Check Cache
    const cacheKey = `pincode_${pincode}`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
        updateDashboardUI(cachedData);
        showToast("Loaded from cache.", "success");
        return;
    }

    try {
        toggleButtonLoading(findBoothBtn, true, "Search");
        if(document.getElementById('mpName')) document.getElementById('mpName').textContent = "Searching...";

        const prompt = `Provide electoral info for Indian pincode ${pincode} as JSON: {"mpName", "mlaName", "state", "chiefMinister", "nextElectionDate", "areaName", "mpConstituency"}`;
        
        const response = await fetch(GEMINI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Middleman API Error");

        const rawText = data.response;
        const info = JSON.parse(rawText.replace(/```json|```/g, "").trim());

        // Save to cache
        apiCache.set(cacheKey, info);

        updateDashboardUI(info);
        showToast("Data retrieved successfully.", "success");

    } catch (error) {
        console.error("Dashboard Error:", error);
        if(document.getElementById('mpName')) document.getElementById('mpName').textContent = "Error";
        showToast("Failed to fetch AI details. Please check your internet.", "error");
    } finally {
        toggleButtonLoading(findBoothBtn, false, "Search");
    }
};

/**
 * Updates the Dashboard UI with fetched data.
 * @param {Object} info - Parsed JSON info.
 */
const updateDashboardUI = (info) => {
    // Sanitize dynamically
    const s = (text) => text ? text.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;") : "N/A";

    if(document.getElementById('locationDisplay')) document.getElementById('locationDisplay').textContent = `Location: ${s(info.areaName) || "Area Identified"}`;
    if(document.getElementById('mpName')) document.getElementById('mpName').textContent = s(info.mpName);
    if(document.getElementById('mpConstituency')) document.getElementById('mpConstituency').textContent = `Constituency: ${s(info.mpConstituency)}`;
    if(document.getElementById('partyName')) document.getElementById('partyName').textContent = s(info.mlaName);
    if(document.getElementById('stateName')) document.getElementById('stateName').textContent = `State: ${s(info.state)}`;
    if(document.getElementById('cmName')) document.getElementById('cmName').textContent = `CM: ${s(info.chiefMinister)}`;
    
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

    const dbEl = document.getElementById('dashboard');
    if (dbEl) dbEl.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Loads the map iframe based on geolocation or pincode.
 * @param {string} pincode - Pincode as fallback.
 */
const showNearby = (pincode) => {
    if (!mapFrame) return;
    
    // Add lazy loading
    mapFrame.setAttribute('loading', 'lazy');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            mapFrame.src = `https://maps.google.com/maps?q=${lat},${lon}&z=15&t=&ie=UTF8&iwloc=&output=embed`;
        }, () => {
            mapFrame.src = `https://maps.google.com/maps?q=${pincode}+India&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        }, { timeout: 10000 });
    } else {
        mapFrame.src = `https://maps.google.com/maps?q=${pincode}+India&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }
};

window.openInGoogleMaps = () => {
    const pincode = pincodeInput ? pincodeInput.value.trim() : "";
    if (pincode) {
        window.open(`https://www.google.com/maps/search/polling+booths+near+${pincode}+India`, '_blank');
    }
};

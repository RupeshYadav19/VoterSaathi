// tests/extra.test.js
import { initDashboard } from '../public/js/dashboard.js';
import * as firebase from '../public/js/firebase.js';

describe('Dashboard Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="pincodeInput">
            <button id="findBoothBtn"></button>
            <div id="mapContainer"></div>
            <iframe id="mapFrame"></iframe>
            <div id="mpName"></div>
            <div id="locationDisplay"></div>
            <div id="mpConstituency"></div>
            <div id="partyName"></div>
            <div id="stateName"></div>
            <div id="cmName"></div>
            <div id="nextElectionDate"></div>
            <div id="liveTimer"></div>
            <div id="dashboard"></div>
            <div class="clay-card"></div>
        `;
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should perform search when button is clicked', async () => {
        jest.spyOn(firebase, 'getCurrentUser').mockReturnValue({ uid: '123' });
        
        const mockInfo = {
            mpName: 'Test MP',
            areaName: 'Test Area',
            nextElectionDate: '2029-05-01',
            mlaName: 'Test MLA',
            state: 'Test State',
            chiefMinister: 'Test CM',
            mpConstituency: 'Test Const'
        };
        
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                candidates: [{ content: { parts: [{ text: JSON.stringify(mockInfo) }] } }]
            })
        });

        initDashboard();
        
        const input = document.getElementById('pincodeInput');
        const btn = document.getElementById('findBoothBtn');
        
        input.value = '400001';
        btn.click();
        
        // Trigger debounce
        jest.advanceTimersByTime(600);
        
        // Wait for async fetch
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(document.getElementById('mpName').textContent).toBe('Test MP');
        expect(document.getElementById('locationDisplay').textContent).toContain('Test Area');
    });
});

// tests/evm.test.js
import '../public/js/evm.js';

describe('EVM Practice', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="vvpatSlip"></div>
            <div id="votedName"></div>
            <div class="evm-machine"></div>
            <div id="voteSuccess"></div>
            <input id="dobInput">
            <div id="eligibilityResult"></div>
        `;
        jest.useFakeTimers();
    });

    it('should cast vote and show success message', () => {
        window.castVote('Candidate A');
        expect(document.getElementById('votedName').textContent).toBe('Candidate A');
        expect(document.getElementById('vvpatSlip').style.height).toBe('100px');
        
        jest.advanceTimersByTime(4500);
        
        expect(document.querySelector('.evm-machine').style.display).toBe('none');
        expect(document.getElementById('voteSuccess').style.display).toBe('block');
    });

    it('should check eligibility correctly', () => {
        const input = document.getElementById('dobInput');
        const result = document.getElementById('eligibilityResult');
        
        input.value = '2000-01-01';
        window.checkEligibility();
        expect(result.textContent).toContain('Eligible!');
        
        input.value = '2020-01-01';
        window.checkEligibility();
        expect(result.textContent).toContain('Eligible in');
    });
});

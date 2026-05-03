/**
 * EVM Practice and Eligibility Check Logic
 * @module evm
 */

import { calculateAge } from './utils.js';

/**
 * Simulates casting a vote on the EVM.
 * @param {string} candidateName - Name of the candidate.
 */
window.castVote = (candidateName) => {
    const vvpatSlip = document.getElementById('vvpatSlip');
    const votedName = document.getElementById('votedName');
    
    // Sanitize output
    const safeName = candidateName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    if(votedName) votedName.innerHTML = safeName;
    if(vvpatSlip) vvpatSlip.style.height = '100px';
    
    setTimeout(() => {
        if(vvpatSlip) vvpatSlip.style.height = '0';
        const evmMachine = document.querySelector('.evm-machine');
        if(evmMachine) evmMachine.style.display = 'none';
        
        const successMsg = document.getElementById('voteSuccess');
        if(successMsg) {
            successMsg.style.display = 'block';
            successMsg.setAttribute('aria-live', 'polite');
        }
    }, 4000);
};

/**
 * Resets the EVM machine for another try.
 */
window.resetEVM = () => {
    const evmMachine = document.querySelector('.evm-machine');
    if(evmMachine) evmMachine.style.display = 'block';
    
    const successMsg = document.getElementById('voteSuccess');
    if(successMsg) successMsg.style.display = 'none';
};

/**
 * Checks voter eligibility based on DOB.
 */
window.checkEligibility = () => {
    const dob = document.getElementById('dobInput')?.value;
    const result = document.getElementById('eligibilityResult');
    if(!dob || !result) return;
    
    const age = calculateAge(dob);
    if (age === null) {
        result.textContent = "Please enter a valid date.";
        result.style.color = "#E8622A";
        return;
    }
    
    result.setAttribute('aria-live', 'polite');
    
    if (age >= 18) {
        result.textContent = `Eligible! (${age} years)`;
        result.style.color = "#00b150";
    } else {
        result.textContent = `Eligible in ${18 - age} years.`;
        result.style.color = "#E8622A";
    }
};

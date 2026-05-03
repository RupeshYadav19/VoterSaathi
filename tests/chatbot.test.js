import { initChatbot } from '../public/js/chatbot.js';
import * as firebase from '../public/js/firebase.js';

describe('Chatbot Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="chatbotToggle"></button>
            <div id="chatbotPanel">
                <button id="chatbotClose"></button>
                <div id="chatMessages">
                    <div id="typingIndicator" style="display:none"></div>
                </div>
                <input id="chatInput">
                <button id="sendBtn"></button>
                <button id="micBtn"></button>
            </div>
        `;
        jest.clearAllMocks();
    });

    it('should open chatbot panel on toggle click', () => {
        jest.spyOn(firebase, 'getCurrentUser').mockReturnValue({ uid: '123' });
        initChatbot();
        
        const toggle = document.getElementById('chatbotToggle');
        const panel = document.getElementById('chatbotPanel');
        
        toggle.click();
        expect(panel.classList.contains('open')).toBe(true);
        expect(toggle.style.display).toBe('none');
    });

    it('should handle send button click and call Gemini API', async () => {
        jest.spyOn(firebase, 'getCurrentUser').mockReturnValue({ uid: '123' });
        jest.spyOn(firebase, 'saveChatHistory').mockResolvedValue('doc123');
        
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                candidates: [{ content: { parts: [{ text: 'AI response content' }] } }]
            })
        });

        initChatbot();
        
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        input.value = 'Hello AI';
        sendBtn.click();
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(firebase.saveChatHistory).toHaveBeenCalledWith('Hello AI');
        expect(global.fetch).toHaveBeenCalled();
        
        const messages = document.getElementById('chatMessages');
        expect(messages.textContent).toContain('AI response content');
    });

    it('should handle API errors gracefully', async () => {
        jest.spyOn(firebase, 'getCurrentUser').mockReturnValue({ uid: '123' });
        global.fetch.mockRejectedValue(new Error('Network error'));
        
        initChatbot();
        
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        input.value = 'Help';
        sendBtn.click();
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const messages = document.getElementById('chatMessages');
        expect(messages.textContent).toContain("Sorry, I couldn't process that");
    });
});

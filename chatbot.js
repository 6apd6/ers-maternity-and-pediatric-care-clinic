// chatbot.js - Simple & Working Version
window.chatBot = {
    approvedFAQs: [],
    
    init: function() {
        this.createUI();
        this.loadFAQs();
    },

    createUI: function() {
        const style = document.createElement('style');
        style.innerHTML = `
            .chatbot-toggle { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: linear-gradient(135deg, #fd79a8, #e84393); border-radius: 50%; border: none; color: white; font-size: 28px; cursor: pointer; z-index: 9999; box-shadow: 0 4px 15px rgba(232,67,147,0.4); }
            .chatbot-container { display: none; position: fixed; bottom: 100px; right: 30px; width: 350px; height: 500px; background: white; border-radius: 15px; box-shadow: 0 5px 30px rgba(0,0,0,0.2); z-index: 9999; flex-direction: column; font-family: 'Poppins', sans-serif; }
            .chatbot-container.active { display: flex; }
            .chat-header { background: linear-gradient(135deg, #fd79a8, #e84393); color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
            .chat-messages { flex: 1; padding: 15px; overflow-y: auto; background: #f8f9fa; }
            .msg { margin-bottom: 10px; display: flex; }
            .msg.bot { justify-content: flex-start; }
            .msg.user { justify-content: flex-end; }
            .bubble { max-width: 80%; padding: 10px 15px; border-radius: 15px; font-size: 14px; }
            .msg.bot .bubble { background: white; color: #333; }
            .msg.user .bubble { background: #e84393; color: white; }
            .chat-input { padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; }
            .chat-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; }
            .chat-input button { background: #e84393; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; }
        `;
        document.head.appendChild(style);

        const toggle = document.createElement('button');
        toggle.className = 'chatbot-toggle';
        toggle.innerHTML = '';
        toggle.onclick = () => document.getElementById('chatBox').classList.toggle('active');

        const box = document.createElement('div');
        box.id = 'chatBox';
        box.className = 'chatbot-container';
        box.innerHTML = `
            <div class="chat-header"><strong>ERS Assistant</strong><button onclick="document.getElementById('chatBox').classList.remove('active')" style="background:none;border:none;color:white;font-size:20px;">&times;</button></div>
            <div class="chat-messages" id="chatMsgs"><div class="msg bot"><div class="bubble">Hello! How can I help you?</div></div></div>
            <div class="chat-input"><input type="text" id="chatIn" placeholder="Ask me anything..." onkeypress="if(event.key==='Enter')window.chatBot.send()"><button onclick="window.chatBot.send()"></button></div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(box);
    },

    loadFAQs: async function() {
        if (!window.supabaseClient) {
            console.log('Waiting for Supabase...');
            setTimeout(() => this.loadFAQs(), 1000);
            return;
        }
        const { data, error } = await window.supabaseClient.from('faq_improvements').select('*').eq('is_approved', true);
        if (error) console.error('Error loading FAQs:', error);
        else {
            this.approvedFAQs = data || [];
            console.log('✅ Loaded', this.approvedFAQs.length, 'FAQs');
        }
    },

    send: function() {
        const input = document.getElementById('chatIn');
        const text = input.value.trim();
        if (!text) return;

        this.addMsg(text, 'user');
        input.value = '';

        setTimeout(() => {
            const response = this.findAnswer(text);
            this.addMsg(response, 'bot');
            this.log(text, response);
        }, 500);
    },

    addMsg: function(text, sender) {
        const div = document.getElementById('chatMsgs');
        div.innerHTML += `<div class="msg ${sender}"><div class="bubble">${text}</div></div>`;
        div.scrollTop = div.scrollHeight;
    },

    findAnswer: function(question) {
        const lower = question.toLowerCase();
        
        // Simple keyword matching
        for (let faq of this.approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            const answer = faq.approved_answer;
            
            // Check if question contains FAQ keywords
            const words = faqLower.split(' ');
            for (let word of words) {
                if (word.length > 3 && lower.includes(word)) {
                    return answer;
                }
            }
            
            // Direct match
            if (lower.includes(faqLower) || faqLower.includes(lower)) {
                return answer;
            }
        }
        
        // Fallback
        return "I'm not sure about that. Please call us at +63 970 471 6507 for more information.";
    },

    log: async function(q, a) {
        if (!window.supabaseClient) return;
        await window.supabaseClient.from('ai_conversations').insert([{
            user_message: q,
            ai_response: a,
            source: 'chatbot'
        }]);
    }
};

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.chatBot.init());
} else {
    window.chatBot.init();
}

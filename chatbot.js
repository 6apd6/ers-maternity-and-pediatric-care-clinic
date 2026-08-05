// chatbot.js - Smart AI with Intent Detection (Price vs Availability)
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
            .chatbot-toggle:hover { transform: scale(1.1); }
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

        // Create the pink toggle button with the chat bubble icon
        const toggle = document.createElement('button');
        toggle.className = 'chatbot-toggle';
        toggle.innerHTML = '💬'; 
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
            setTimeout(() => this.loadFAQs(), 1000);
            return;
        }
        const { data, error } = await window.supabaseClient.from('faq_improvements').select('*').eq('is_approved', true);
        if (error) console.error('Error:', error);
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
            const response = this.findBestAnswer(text);
            this.addMsg(response, 'bot');
            this.log(text, response);
        }, 500);
    },

    addMsg: function(text, sender) {
        const div = document.getElementById('chatMsgs');
        div.innerHTML += `<div class="msg ${sender}"><div class="bubble">${text}</div></div>`;
        div.scrollTop = div.scrollHeight;
    },

    // 1. Handle basic manners and greetings
    getBasicResponse: function(text) {
        const lower = text.toLowerCase();
        if (lower.includes('thank') || lower.includes('salamat') || lower.includes('thanks')) {
            return "You're very welcome! Is there anything else I can help you with today?";
        }
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('good morning') || lower.includes('good afternoon') || lower.includes('kumusta')) {
            return "Hello! Welcome to ERS Maternity and Pediatric Care. How can I assist you today?";
        }
        if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('salamat ulit')) {
            return "Thank you for contacting us. Have a wonderful day!";
        }
        if (lower.includes('who are you') || lower.includes('ano ka') || lower.includes('assistant')) {
            return "I am the ERS virtual assistant. I can answer questions about our services, pricing, and appointments.";
        }
        return null;
    },

    // 2. NEW: Detect the intent of the question (Price vs Availability)
    detectIntent: function(text) {
        const lower = text.toLowerCase();
        // Check for Price intent
        if (lower.includes('magkano') || lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('bayad')) {
            return 'price';
        }
        // Check for Availability intent
        if (lower.includes('mayroon') || lower.includes('meron') || lower.includes('may ') || lower.includes('do you have') || lower.includes('available') || lower.includes('offer')) {
            return 'availability';
        }
        return 'general';
    },

    // 3. Convert staff instructions to natural responses
    convertInstructionToResponse: function(text) {
        const lower = text.toLowerCase();
        if (lower.includes('tell the customer to call') || lower.includes('tell them to call')) {
            return "For more information, please call us at +63 970 471 6507.";
        }
        if (lower.includes('tell the patient')) {
            return text.replace(/tell the patient/gi, 'please').replace(/to call/gi, 'call');
        }
        if (lower.includes('price') && lower.includes('call')) {
            return "For pricing information, please call our clinic at +63 970 471 6507.";
        }
        if (lower.includes('appointment') && lower.includes('call')) {
            return "To book an appointment, please call us at +63 970 471 6507.";
        }
        return text;
    },

    // 4. Find the best answer using Intent + Keywords
    findBestAnswer: function(question) {
        const lower = question.toLowerCase();
        
        // First, check for basic manners
        const basicResponse = this.getBasicResponse(question);
        if (basicResponse) return basicResponse;

        // Detect what the user is asking for (Price or Availability)
        const intent = this.detectIntent(question);
        
        const qWords = lower.split(/\s+/);
        let bestMatch = null;
        let bestScore = 0;

        // Search through approved FAQs
        for (let faq of this.approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            const fWords = faqLower.split(/\s+/);
            let score = 0;

            // Count matching words
            for (let qw of qWords) {
                for (let fw of fWords) {
                    if (qw === fw) score += 2;
                    else if (qw.includes(fw) || fw.includes(qw)) score += 1;
                }
            }

            // Boost for medical terms
            if (lower.includes('cs') && faqLower.includes('cs')) score += 10;
            if (lower.includes('nsd') && faqLower.includes('nsd')) score += 10;
            if (lower.includes('check') && faqLower.includes('check')) score += 5;
            if (lower.includes('checkup') && faqLower.includes('checkup')) score += 5;

            if (lower.includes(faqLower) || faqLower.includes(lower)) score += 20;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        // If we found a matching FAQ
        if (bestMatch && bestScore > 0) {
            let finalAnswer = this.convertInstructionToResponse(bestMatch.approved_answer);
            
            // SMART ADJUSTMENT: If they asked "Do you have it?" but the answer is a price, add "Yes"
            if (intent === 'availability' && (finalAnswer.toLowerCase().includes('price') || finalAnswer.match(/\d+/))) {
                return "Yes, we offer that service. " + finalAnswer;
            }
            
            return finalAnswer;
        }
        
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.chatBot.init());
} else {
    window.chatBot.init();
}

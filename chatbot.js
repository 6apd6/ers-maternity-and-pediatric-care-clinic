// chatbot.js - Complete AI with Website Knowledge, Manners, and Smart Matching
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

        const toggle = document.createElement('button');
        toggle.className = 'chatbot-toggle';
        toggle.innerHTML = '💬'; // Chat bubble icon kept
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

    // 1. Basic Manners
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
            return "I am the ERS virtual assistant. I can answer questions about our clinic, services, doctors, and appointments.";
        }
        return null;
    },

    // 2. NEW: Website Knowledge Base
    getWebsiteInfo: function(text) {
        const lower = text.toLowerCase();
        
        // Location / Address
        if (lower.includes('where') || lower.includes('location') || lower.includes('address') || lower.includes('saan') || lower.includes('nasaan') || lower.includes('map')) {
            return "We are located at Trece Martires - Indang Road, Trece Martires City, Cavite 4109.";
        }
        
        // Contact Info (Phone/Email)
        if (lower.includes('contact') || lower.includes('number') || lower.includes('call') || lower.includes('phone') || lower.includes('email') || lower.includes('tawag')) {
            return "You can reach us at Mobile: +63 970 471 6507, Landline: +63 (46) 419-0201, or Email: ersmaternityclinic@gmail.com.";
        }
        
        // Hours / Time
        if (lower.includes('hour') || lower.includes('time') || lower.includes('open') || lower.includes('close') || lower.includes('schedule') || lower.includes('oras') || lower.includes('bukas')) {
            return "We are open Monday to Saturday from 8:00 AM to 5:00 PM. We are closed on Sundays.";
        }
        
        // Doctors
        if (lower.includes('doctor') || lower.includes('physician') || lower.includes('sino') || lower.includes('dr.')) {
            return "Our attending physicians are Dr. Evalyn Rivera-Castillo and Dr. Elli Sinsay.";
        }
        
        // Services
        if (lower.includes('service') || lower.includes('offer') || lower.includes('do you have') || lower.includes('meron') || lower.includes('treatment')) {
            return "We offer Prenatal Care, Postpartum Care, Pediatric Care, Newborn Care, Vaccinations, Ultrasound, and General Check-ups.";
        }
        
        // Portal / Records
        if (lower.includes('portal') || lower.includes('record') || lower.includes('result') || lower.includes('login')) {
            return "You can access your medical records and results through our Patient Portal on the website.";
        }
        
        // Blog / Articles
        if (lower.includes('blog') || lower.includes('article') || lower.includes('read') || lower.includes('tips')) {
            return "We have a Blog section on our website with helpful articles about maternity and pediatric care.";
        }

        return null;
    },

    // 3. Detect Intent (Price vs Availability)
    detectIntent: function(text) {
        const lower = text.toLowerCase();
        if (lower.includes('magkano') || lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('bayad')) {
            return 'price';
        }
        if (lower.includes('mayroon') || lower.includes('meron') || lower.includes('may ') || lower.includes('do you have') || lower.includes('available') || lower.includes('offer')) {
            return 'availability';
        }
        return 'general';
    },

    // 4. Convert staff instructions
    convertInstructionToResponse: function(text) {
        const lower = text.toLowerCase();
        if (lower.includes('tell the customer to call') || lower.includes('tell them to call')) {
            return "For more information, please call us at +63 970 471 6507.";
        }
        if (lower.includes('tell the patient')) {
            return text.replace(/tell the patient/gi, 'please').replace(/to call/gi, 'call');
        }
        return text;
    },

    // 5. Find Best Answer
    findBestAnswer: function(question) {
        const lower = question.toLowerCase();
        
        // First, check basic manners
        const basicResponse = this.getBasicResponse(question);
        if (basicResponse) return basicResponse;

        // Second, check website knowledge
        const websiteInfo = this.getWebsiteInfo(question);
        if (websiteInfo) return websiteInfo;

        // Third, check database FAQs (for pricing and specific medical info)
        const intent = this.detectIntent(question);
        const qWords = lower.split(/\s+/).filter(w => w.length > 2);
        
        let bestMatch = null;
        let bestScore = 0;

        for (let faq of this.approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            const fWords = faqLower.split(/\s+/).filter(w => w.length > 2);
            let score = 0;

            if (lower.includes(faqLower) || faqLower.includes(lower)) score += 100;

            for (let qw of qWords) {
                for (let fw of fWords) {
                    if (qw === fw) score += 10;
                    else if (qw.includes(fw) || fw.includes(qw)) score += 5;
                }
            }

            if (lower.includes('cs') && faqLower.includes('cs')) score += 50;
            if (lower.includes('nsd') && faqLower.includes('nsd')) score += 50;
            if (lower.includes('check') && faqLower.includes('check')) score += 50;
            if (lower.includes('checkup') && faqLower.includes('checkup')) score += 50;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        if (bestMatch && bestScore > 0) {
            let finalAnswer = this.convertInstructionToResponse(bestMatch.approved_answer);
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

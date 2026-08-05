// chatbot.js - Fixed & Smart AI

window.chatBot = {
    approvedFAQs: [],
    
    init: function() {
        this.createUI();
        this.loadFAQs();
    },

    createUI: function() {
        // Add styles
        const style = document.createElement('style');
        style.innerHTML = `
            .chatbot-toggle { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: linear-gradient(135deg, #fd79a8, #e84393); border-radius: 50%; border: none; color: white; font-size: 28px; cursor: pointer; box-shadow: 0 4px 15px rgba(232,67,147,0.4); z-index: 9999; }
            .chatbot-container { display: none; position: fixed; bottom: 100px; right: 30px; width: 350px; height: 500px; background: white; border-radius: 15px; box-shadow: 0 5px 30px rgba(0,0,0,0.2); z-index: 9999; flex-direction: column; overflow: hidden; font-family: 'Poppins', sans-serif; }
            .chatbot-container.active { display: flex; }
            .chat-header { background: linear-gradient(135deg, #fd79a8, #e84393); color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
            .chat-messages { flex: 1; padding: 15px; overflow-y: auto; background: #f8f9fa; }
            .msg { margin-bottom: 10px; display: flex; }
            .msg.bot { justify-content: flex-start; }
            .msg.user { justify-content: flex-end; }
            .bubble { max-width: 80%; padding: 10px 15px; border-radius: 15px; font-size: 14px; line-height: 1.4; }
            .msg.bot .bubble { background: white; color: #333; border-bottom-left-radius: 2px; }
            .msg.user .bubble { background: #e84393; color: white; border-bottom-right-radius: 2px; }
            .chat-input-area { padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; background: white; }
            .chat-input-area input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
            .chat-input-area button { background: #e84393; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 18px; }
            .feedback { margin-top: 5px; font-size: 12px; }
            .feedback button { background: none; border: none; cursor: pointer; font-size: 16px; margin-right: 5px; }
        `;
        document.head.appendChild(style);

        // Create HTML
        const toggle = document.createElement('button');
        toggle.className = 'chatbot-toggle';
        toggle.innerHTML = '💬';
        toggle.onclick = () => document.getElementById('chatBox').classList.toggle('active');

        const box = document.createElement('div');
        box.id = 'chatBox';
        box.className = 'chatbot-container';
        box.innerHTML = `
            <div class="chat-header">
                <div>
                    <strong>ERS Assistant</strong><br>
                    <small style="font-size:10px; opacity:0.9">Online | EN/TL</small>
                </div>
                <button onclick="document.getElementById('chatBox').classList.remove('active')" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;">&times;</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="msg bot"><div class="bubble">Hello! Welcome to ERS Maternity. How can I help you today?</div></div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Type your question..." onkeypress="if(event.key==='Enter') window.chatBot.send()">
                <button onclick="window.chatBot.send()">➤</button>
            </div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(box);
    },

    loadFAQs: async function() {
        if (!window.supabaseClient) return;
        const { data } = await window.supabaseClient.from('faq_improvements').select('*').eq('is_approved', true);
        this.approvedFAQs = data || [];
        console.log('Loaded FAQs:', this.approvedFAQs.length);
    },

    send: function() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        this.addMessage(text, 'user');
        input.value = '';

        // Show typing...
        const typingId = 'typing-' + Date.now();
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.innerHTML += `<div class="msg bot" id="${typingId}"><div class="bubble">Thinking...</div></div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Process after delay
        setTimeout(() => {
            document.getElementById(typingId).remove();
            const response = this.getSmartResponse(text);
            this.addMessage(response, 'bot');
            this.logToDatabase(text, response);
        }, 800);
    },

    addMessage: function(text, sender) {
        const messagesDiv = document.getElementById('chatMessages');
        let html = `<div class="msg ${sender}"><div class="bubble">${text}`;
        
        if (sender === 'bot') {
            html += `<div class="feedback"><button onclick="window.chatBot.rate(this, true)">👍</button><button onclick="window.chatBot.rate(this, false)"></button></div>`;
        }
        
        html += `</div></div>`;
        messagesDiv.innerHTML += html;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    rate: function(btn, isGood) {
        const feedbackDiv = btn.parentElement;
        feedbackDiv.innerHTML = isGood ? 'Thanks!' : 'We will improve!';
    },

    // THE SMART LOGIC
    getSmartResponse: function(question) {
        const lowerQ = question.toLowerCase();
        
        // 1. Detect Intent (Price vs Availability)
        let intent = 'general';
        if (lowerQ.match(/magkano|price|cost|how much|fee/)) intent = 'price';
        if (lowerQ.match(/mayroon|meron|have|available|do you/)) intent = 'availability';

        // 2. Find Match in Database
        let bestMatch = null;
        let bestScore = 0;

        for (let faq of this.approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            let score = 0;
            
            // Check for keyword overlap
            const qWords = lowerQ.split(' ');
            const fWords = faqLower.split(' ');
            
            // If any important word (length > 2) matches
            for (let w of qWords) {
                if (w.length > 2 && fWords.includes(w)) score++;
            }

            // Special boost for medical terms like "cs", "nsd"
            if (lowerQ.includes('cs') && faqLower.includes('cs')) score += 5;
            if (lowerQ.includes('nsd') && faqLower.includes('nsd')) score += 5;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        // 3. Generate Natural Response
        if (bestMatch && bestScore > 0) {
            return this.rephrase(bestMatch.approved_answer, intent, question);
        }

        // Fallback
        return "I'm not sure about that specific detail. Please call us at +63 970 471 6507 for accurate information.";
    },

    rephrase: function(answer, intent, originalQuestion) {
        // This makes the AI sound natural instead of robotic
        if (intent === 'price') {
            return `Regarding the pricing you asked about: ${answer}`;
        }
        if (intent === 'availability') {
            return `To answer your question: ${answer}`;
        }
        return answer; // Default: just give the answer
    },

    logToDatabase: async function(q, a) {
        if (!window.supabaseClient) return;
        await window.supabaseClient.from('ai_conversations').insert([{
            user_message: q,
            ai_response: a,
            source: 'chatbot',
            language: 'en'
        }]);
    }
};

// Start the bot
window.chatBot.init();

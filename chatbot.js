// chatbot.js - Smart AI with Intent Detection

class ChatBot {
    constructor() {
        this.init();
    }

    init() {
        this.createChatUI();
        this.loadApprovedFAQs();
        
        // Quick reply buttons
        const quickReplies = [
            { text: 'Book Appointment', icon: '', action: 'book' },
            { text: 'Hours', icon: '', action: 'hours' },
            { text: 'Location', icon: '', action: 'location' },
            { text: 'Prices', icon: '💰', action: 'prices' },
            { text: 'Services', icon: '🏥', action: 'services' }
        ];

        this.responses = {
            book: "You can book an appointment by clicking the 'Book Appointment' button at the top of the page, or by calling us at +63 970 471 6507.",
            hours: "We're open Monday to Saturday, 8:00 AM to 5:00 PM. We're closed on Sundays.",
            location: "We're located at Trece Martires - Indang Road, Trece Martires City, Cavite 4109.",
            prices: "For our most affordable packages and exact pricing, please call us at +63 970 471 6507. We offer competitive rates!",
            services: "We offer Prenatal Care, Postpartum Care, Pediatric Care, Newborn Care, Vaccinations, and Ultrasound services."
        };

        this.knowledgeBase = {
            hours: ['hour', 'open', 'close', 'time', 'schedule', 'bukas', 'oras'],
            book: ['book', 'appointment', 'schedule', 'reserve', 'set', 'appointment'],
            location: ['location', 'address', 'where', 'address', 'place', 'saan', 'nasaan'],
            prices: ['price', 'cost', 'magkano', 'how much', 'fee', 'payment', 'bayad'],
            services: ['service', 'offer', 'provide', 'meron', 'available', 'do you have']
        };

        // Medical services keywords
        this.medicalKeywords = {
            'cs': ['cs', 'c-section', 'caesarean', 'cesarean', 'operation', 'surgery', 'operative'],
            'nsd': ['nsd', 'normal delivery', 'natural birth', 'vaginal', 'panganak'],
            'checkup': ['checkup', 'check-up', 'check up', 'examination', 'consultation', 'konsulta'],
            'ultrasound': ['ultrasound', 'sono', 'scan', 'baby scan'],
            'vaccine': ['vaccine', 'vaccination', 'bakuna', 'immunization'],
            'prenatal': ['prenatal', 'pregnancy', 'buntis', 'pregnant'],
            'pediatric': ['pediatric', 'child', 'baby', 'infant', 'peds', 'bata']
        };

        this.hasGreeted = false;
    }

    createChatUI() {
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-toggle {
                position: fixed; bottom: 30px; right: 30px;
                width: 60px; height: 60px;
                background: linear-gradient(135deg, #fd79a8, #e84393);
                border-radius: 50%; border: none;
                color: white; font-size: 28px;
                cursor: pointer; box-shadow: 0 4px 15px rgba(232,67,147,0.4);
                z-index: 9999; transition: all 0.3s;
            }
            .chatbot-toggle:hover { transform: scale(1.1); }
            .chatbot-container {
                display: none; position: fixed;
                bottom: 100px; right: 30px;
                width: 380px; max-width: 90vw;
                background: white; border-radius: 15px;
                box-shadow: 0 5px 30px rgba(0,0,0,0.2);
                z-index: 9999; overflow: hidden;
                font-family: 'Poppins', sans-serif;
            }
            .chatbot-container.active { display: flex; flex-direction: column; height: 550px; }
            .chatbot-header {
                background: linear-gradient(135deg, #fd79a8, #e84393);
                color: white; padding: 15px 20px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .chatbot-header h3 { margin: 0; font-size: 16px; }
            .chatbot-header small { opacity: 0.9; }
            .chatbot-close {
                background: none; border: none; color: white;
                font-size: 24px; cursor: pointer;
            }
            .chatbot-messages {
                flex: 1; overflow-y: auto; padding: 20px;
                background: #f8f9fa;
            }
            .message { margin-bottom: 15px; display: flex; }
            .message-bot { justify-content: flex-start; }
            .message-user { justify-content: flex-end; }
            .message-content {
                max-width: 75%; padding: 12px 16px;
                border-radius: 15px; font-size: 14px; line-height: 1.4;
            }
            .message-bot .message-content {
                background: white; color: #2d3436;
                border-bottom-left-radius: 5px;
            }
            .message-user .message-content {
                background: linear-gradient(135deg, #fd79a8, #e84393);
                color: white; border-bottom-right-radius: 5px;
            }
            .chatbot-input {
                padding: 15px; background: white;
                border-top: 1px solid #eee;
                display: flex; gap: 10px;
            }
            .chatbot-input input {
                flex: 1; padding: 10px 15px;
                border: 2px solid #dfe6e9; border-radius: 25px;
                font-family: inherit; outline: none;
            }
            .chatbot-input input:focus { border-color: #e84393; }
            .chatbot-input button {
                background: linear-gradient(135deg, #fd79a8, #e84393);
                color: white; border: none; width: 40px; height: 40px;
                border-radius: 50%; cursor: pointer;
            }
            .quick-replies {
                display: flex; flex-wrap: wrap; gap: 8px;
                padding: 10px 20px; background: white;
                border-top: 1px solid #eee;
            }
            .quick-reply {
                background: #f8f9fa; border: 1px solid #dfe6e9;
                padding: 6px 12px; border-radius: 15px;
                font-size: 13px; cursor: pointer;
                transition: all 0.2s;
            }
            .quick-reply:hover {
                background: #e84393; color: white; border-color: #e84393;
            }
            .typing-indicator {
                display: none; padding: 12px 16px;
                background: white; border-radius: 15px;
                border-bottom-left-radius: 5px;
                width: fit-content;
            }
            .typing-indicator.active { display: block; }
            .typing-indicator span {
                display: inline-block; width: 8px; height: 8px;
                background: #b2bec3; border-radius: 50%;
                margin: 0 2px; animation: typing 1.4s infinite;
            }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            .feedback-btns {
                margin-top: 8px; display: flex; gap: 5px;
            }
            .feedback-btn {
                background: none; border: none;
                font-size: 16px; cursor: pointer; opacity: 0.6;
                transition: opacity 0.2s;
            }
            .feedback-btn:hover { opacity: 1; }
        `;
        document.head.appendChild(style);

        const toggle = document.createElement('button');
        toggle.className = 'chatbot-toggle';
        toggle.innerHTML = '💬';
        toggle.onclick = () => document.getElementById('chatbotContainer').classList.toggle('active');

        const container = document.createElement('div');
        container.id = 'chatbotContainer';
        container.className = 'chatbot-container';
        container.innerHTML = `
            <div class="chatbot-header">
                <div>
                    <h3>🤖 ERS Assistant</h3>
                    <small>Online | EN/TL/CEB/ILO</small>
                </div>
                <button class="chatbot-close" onclick="document.getElementById('chatbotContainer').classList.remove('active')">&times;</button>
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <div class="message message-bot">
                    <div class="message-content">
                        Hello! Welcome to ERS Maternity and Pediatric Care! I'm your virtual assistant. How can I help you today?
                        <div class="feedback-btns">
                            <button class="feedback-btn" onclick="window.chatBot.feedback(true, this)">👍</button>
                            <button class="feedback-btn" onclick="window.chatBot.feedback(false, this)"></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="typing-indicator" id="typingIndicator">
                <span></span><span></span><span></span>
            </div>
            <div class="quick-replies" id="quickReplies"></div>
            <div class="chatbot-input">
                <input type="text" id="chatbotInput" placeholder="Type in any language..." onkeypress="if(event.key==='Enter')window.chatBot.sendMessage()">
                <button onclick="window.chatBot.sendMessage()">➤</button>
            </div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(container);
        
        this.showQuickReplies(quickReplies);
    }

    showQuickReplies(replies) {
        const container = document.getElementById('quickReplies');
        container.innerHTML = replies.map(r => 
            `<button class="quick-reply" onclick="window.chatBot.handleQuickReply('${r.action}')">${r.icon} ${r.text}</button>`
        ).join('');
    }

    handleQuickReply(action) {
        this.addMessage(this.responses[action], 'bot');
        this.logInteraction(action, this.responses[action]);
    }

    async loadApprovedFAQs() {
        if (!window.supabaseClient) return;
        
        const { data: faqs } = await window.supabaseClient
            .from('faq_improvements')
            .select('*')
            .eq('is_approved', true);
        
        this.approvedFAQs = faqs || [];
        console.log('✅ Loaded', this.approvedFAQs.length, 'approved FAQs');
    }

    // Extract important keywords from question
    extractKeywords(text) {
        const lower = text.toLowerCase();
        const keywords = [];
        
        // Extract medical service keywords
        for (const [service, words] of Object.entries(this.medicalKeywords)) {
            if (words.some(w => lower.includes(w))) {
                keywords.push(service);
            }
        }
        
        // Extract intent keywords
        const intents = {
            'availability': ['mayroon', 'meron', 'have', 'available', 'offer', 'provide', 'do you'],
            'price': ['magkano', 'price', 'cost', 'how much', 'fee', 'bayad', 'presyo'],
            'procedure': ['how', 'what', 'process', 'procedure', 'paano', 'ano'],
            'doctor': ['doctor', 'physician', 'dr.', 'sino', 'kanino'],
            'schedule': ['schedule', 'when', 'time', 'date', 'kailan', 'orasan']
        };
        
        for (const [intent, words] of Object.entries(intents)) {
            if (words.some(w => lower.includes(w))) {
                keywords.push('intent:' + intent);
            }
        }
        
        return keywords;
    }

    // Generate natural response based on FAQ and intent
    generateNaturalResponse(faq, keywords) {
        const intent = keywords.find(k => k.startsWith('intent:'))?.replace('intent:', '') || 'general';
        const service = keywords.find(k => !k.startsWith('intent:')) || 'service';
        
        // Get the approved answer
        const answer = faq.approved_answer;
        
        // If asking about price
        if (intent === 'price') {
            if (answer.toLowerCase().includes('price') || answer.toLowerCase().includes('php') || answer.includes('₱')) {
                return `For ${service.toUpperCase()}, ${answer}`;
            }
            return `Regarding pricing for ${service.toUpperCase()}, ${answer}. Would you like to book an appointment to discuss this further?`;
        }
        
        // If asking about availability
        if (intent === 'availability') {
            if (answer.toLowerCase().includes('no') || answer.toLowerCase().includes("don't") || answer.toLowerCase().includes('not available')) {
                return `Unfortunately, ${answer.toLowerCase()}. Is there anything else I can help you with?`;
            }
            return `Yes! ${answer}`;
        }
        
        // If asking about procedure
        if (intent === 'procedure') {
            return `Here's what you need to know about ${service.toUpperCase()}: ${answer}`;
        }
        
        // Default natural response
        return answer;
    }

    // Find matching FAQ with smart matching
    findMatchingFAQ(question) {
        const keywords = this.extractKeywords(question);
        const lowerQ = question.toLowerCase();
        
        console.log('🔍 Keywords extracted:', keywords);
        
        if (!this.approvedFAQs || this.approvedFAQs.length === 0) return null;
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const faq of this.approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            const faqKeywords = this.extractKeywords(faqLower);
            
            // Count keyword matches
            const matchingKeywords = keywords.filter(k => faqKeywords.includes(k));
            const score = matchingKeywords.length;
            
            // Also check for direct phrase match
            if (lowerQ.includes(faqLower) || faqLower.includes(lowerQ)) {
                return { faq, keywords, score: 10 };
            }
            
            if (score > bestScore && score >= 2) {
                bestScore = score;
                bestMatch = { faq, keywords, score };
            }
        }
        
        return bestMatch;
    }

    async getAIResponse(input) {
        const lower = input.toLowerCase();
        
        // Check for quick reply actions first
        for (const [key, response] of Object.entries(this.responses)) {
            if (this.knowledgeBase[key]?.some(kw => lower.includes(kw))) {
                return { text: response, lang: this.detectLanguage(input) };
            }
        }
        
        // Try to find FAQ match
        const match = this.findMatchingFAQ(input);
        
        if (match) {
            console.log('✅ FAQ Match found:', match.faq.question, 'Score:', match.score);
            const naturalResponse = this.generateNaturalResponse(match.faq, match.keywords);
            return { text: naturalResponse, lang: this.detectLanguage(input) };
        }
        
        // Fallback response
        return { 
            text: "I'm not entirely sure about that. For detailed information, please call us at +63 970 471 6507 or visit our clinic. Would you like to book an appointment?",
            lang: this.detectLanguage(input)
        };
    }

    detectLanguage(text) {
        const tl = ['ang', 'sa', 'na', 'ng', 'mayroon', 'meron', 'kayo', 'ba', 'ako', 'si'];
        const count = text.toLowerCase().split(' ').filter(w => tl.includes(w)).length;
        return count >= 2 ? 'tl' : 'en';
    }

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;
        
        let content = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        
        if (sender === 'bot') {
            content += `
                <div class="feedback-btns">
                    <button class="feedback-btn" onclick="window.chatBot.feedback(true, this)">👍</button>
                    <button class="feedback-btn" onclick="window.chatBot.feedback(false, this)">👎</button>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        return messageDiv;
    }

    async sendMessage() {
        const input = document.getElementById('chatbotInput');
        const text = input.value.trim();
        if (!text) return;
        
        this.addMessage(text, 'user');
        input.value = '';
        
        document.getElementById('typingIndicator').classList.add('active');
        
        setTimeout(async () => {
            document.getElementById('typingIndicator').classList.remove('active');
            const result = await this.getAIResponse(text);
            const messageDiv = this.addMessage(result.text, 'bot');
            
            // Log interaction
            this.logInteraction(text, result.text, messageDiv);
            
        }, 1000 + Math.random() * 500);
    }

    async feedback(isHelpful, btn) {
        const messageDiv = btn.closest('.message-content');
        const messageId = messageDiv.dataset.messageId;
        
        if (!window.supabaseClient || !messageId) return;
        
        await window.supabaseClient
            .from('ai_conversations')
            .update({ was_helpful: isHelpful, needs_improvement: !isHelpful })
            .eq('id', messageId);
        
        // Remove buttons
        messageDiv.querySelector('.feedback-btns').remove();
        
        // Show confirmation
        const confirm = document.createElement('div');
        confirm.style.cssText = 'font-size:12px; color:#27ae60; margin-top:5px;';
        confirm.textContent = isHelpful ? 'Thanks for the feedback! 😊' : 'We\'ll improve this! 🙏';
        messageDiv.appendChild(confirm);
    }

    async logInteraction(userMsg, aiMsg, messageDiv) {
        if (!window.supabaseClient) return;
        
        const { data, error } = await window.supabaseClient
            .from('ai_conversations')
            .insert([{
                user_message: userMsg,
                ai_response: aiMsg,
                language: this.detectLanguage(userMsg),
                source: 'chatbot',
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (data && data[0] && messageDiv) {
            messageDiv.querySelector('.message-content').dataset.messageId = data[0].id;
        }
    }
}

// Initialize chatbot
window.chatBot = new ChatBot();

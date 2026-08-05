// chatbot.js - Complete Working Version
window.chatBot = {
    approvedFAQs: [],
    
    init: function() {
        this.createUI();
        this.loadFAQs();
    },

    createUI: function() {
        // Add CSS styles
        const style = document.createElement('style');
        style.innerHTML = `
            .chatbot-toggle {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #fd79a8, #e84393);
                border-radius: 50%;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(232,67,147,0.4);
                transition: transform 0.3s;
            }
            .chatbot-toggle:hover {
                transform: scale(1.1);
            }
            .chatbot-container {
                display: none;
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 30px rgba(0,0,0,0.2);
                z-index: 9999;
                flex-direction: column;
                font-family: 'Poppins', sans-serif;
                overflow: hidden;
            }
            .chatbot-container.active {
                display: flex;
            }
            .chat-header {
                background: linear-gradient(135deg, #fd79a8, #e84393);
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                background: #f8f9fa;
            }
            .msg {
                margin-bottom: 10px;
                display: flex;
            }
            .msg.bot {
                justify-content: flex-start;
            }
            .msg.user {
                justify-content: flex-end;
            }
            .bubble {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 15px;
                font-size: 14px;
                line-height: 1.4;
            }
            .msg.bot .bubble {
                background: white;
                color: #333;
                border-bottom-left-radius: 5px;
            }
            .msg.user .bubble {
                background: #e84393;
                color: white;
                border-bottom-right-radius: 5px;
            }
            .chat-input {
                padding: 15px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
                background: white;
            }
            .chat-input input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
            }
            .chat-input input:focus {
                border-color: #e84393;
            }
            .chat-input button {
                background: #e84393;
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
            }
            .chat-input button:hover {
                background: #d63384;
            }
        `;
        document.head.appendChild(style);

        // Create toggle button (THE PINK CIRCLE ICON)
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'chatbot-toggle';
        toggleBtn.innerHTML = '💬';
        toggleBtn.title = 'Open Chat';
        toggleBtn.onclick = function() {
            document.getElementById('chatbotContainer').classList.toggle('active');
        };

        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatbotContainer';
        chatContainer.className = 'chatbot-container';
        chatContainer.innerHTML = `
            <div class="chat-header">
                <div>
                    <strong style="font-size: 16px;">ERS Assistant</strong><br>
                    <small style="font-size: 11px; opacity: 0.9;">Online | EN/TL</small>
                </div>
                <button onclick="document.getElementById('chatbotContainer').classList.remove('active')" 
                        style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; line-height: 1;">
                    &times;
                </button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="msg bot">
                    <div class="bubble">
                        Hello! Welcome to ERS Maternity and Pediatric Care! How can I help you today?
                    </div>
                </div>
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Type your question..." 
                       onkeypress="if(event.key==='Enter') window.chatBot.send()">
                <button onclick="window.chatBot.send()">➤</button>
            </div>
        `;

        // Add both to page
        document.body.appendChild(toggleBtn);
        document.body.appendChild(chatContainer);
        
        console.log('✅ Chatbot UI created');
    },

    loadFAQs: async function() {
        if (!window.supabaseClient) {
            setTimeout(() => this.loadFAQs(), 1000);
            return;
        }
        const { data, error } = await window.supabaseClient
            .from('faq_improvements')
            .select('*')
            .eq('is_approved', true);
        
        if (error) {
            console.error('Error loading FAQs:', error);
        } else {
            this.approvedFAQs = data || [];
            console.log('✅ Loaded', this.approvedFAQs.length, 'FAQs');
        }
    },

    send: function() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        input.value = '';

        setTimeout(() => {
            const response = this.findAnswer(text);
            this.addMessage(response, 'bot');
            this.logToDB(text, response);
        }, 500);
    },

    addMessage: function(text, sender) {
        const messagesDiv = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}`;
        msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    findAnswer: function(question) {
        const lower = question.toLowerCase();
        
        // Look for matching FAQ
        for (let faq of this.approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            const answer = faq.approved_answer;
            
            // Check word overlap
            const words = faqLower.split(' ');
            for (let word of words) {
                if (word.length > 3 && lower.includes(word)) {
                    return answer;
                }
            }
            
            // Check phrase match
            if (lower.includes(faqLower) || faqLower.includes(lower)) {
                return answer;
            }
        }
        
        return "I'm not sure about that. Please call us at +63 970 471 6507 for more information.";
    },

    logToDB: async function(question, answer) {
        if (!window.supabaseClient) return;
        await window.supabaseClient
            .from('ai_conversations')
            .insert([{
                user_message: question,
                ai_response: answer,
                source: 'chatbot',
                language: 'en'
            }]);
    }
};

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.chatBot.init());
} else {
    window.chatBot.init();
}

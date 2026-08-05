// phone-agent.js - ERS Maternity Voice Agent

(function() {
    let supabaseClient = null;
    
    // Wait for Supabase
    function initSupabase() {
        if (window.supabaseClient) {
            supabaseClient = window.supabaseClient;
            console.log('✅ Phone agent connected to database');
        } else {
            setTimeout(initSupabase, 500);
        }
    }
    initSupabase();

    // Log to database
    function logInteraction(userMsg, aiMsg) {
        if (!supabaseClient) return;
        supabaseClient.from('ai_conversations').insert([{
            user_message: userMsg,
            ai_response: aiMsg,
            language: 'en',
            source: 'phone_agent'
        }]).then(({ error }) => {
            if (error) console.error('Log error:', error);
        });
    }

    // Get answer from database FAQs
    async function findAnswer(question) {
        if (!supabaseClient) return null;
        
        const lowerQ = question.toLowerCase();
        
        try {
            const { data: faqs } = await supabaseClient
                .from('faq_improvements')
                .select('*')
                .eq('is_approved', true);
            
            if (!faqs || faqs.length === 0) return null;
            
            // Simple keyword matching
            for (let faq of faqs) {
                const faqLower = faq.question.toLowerCase();
                
                // Check if question contains FAQ keywords
                const faqWords = faqLower.split(' ').filter(w => w.length > 3);
                const matchCount = faqWords.filter(w => lowerQ.includes(w)).length;
                
                if (matchCount >= 2 || lowerQ.includes(faqLower) || faqLower.includes(lowerQ)) {
                    console.log('✅ Found match:', faq.question);
                    return faq.approved_answer;
                }
            }
            
            return null;
        } catch (e) {
            console.error('FAQ error:', e);
            return null;
        }
    }

    // Create UI
    function createUI() {
        const style = document.createElement('style');
        style.textContent = `
            .phone-fab {
                position: fixed; bottom: 100px; right: 30px;
                width: 60px; height: 60px;
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
                border-radius: 50%; border: none;
                color: white; font-size: 28px;
                cursor: pointer; box-shadow: 0 4px 15px rgba(155,89,182,0.4);
                z-index: 9998; transition: all 0.3s;
            }
            .phone-fab:hover { transform: scale(1.1); }
            .phone-modal {
                display: none; position: fixed;
                bottom: 170px; right: 30px;
                width: 320px; background: white;
                border-radius: 15px;
                box-shadow: 0 5px 25px rgba(0,0,0,0.15);
                z-index: 9999; font-family: 'Poppins', sans-serif;
            }
            .phone-modal.active { display: block; }
            .phone-header {
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
                color: white; padding: 15px; text-align: center;
            }
            .phone-header h3 { margin: 0; font-size: 16px; }
            .phone-body { padding: 25px; text-align: center; }
            .pulse {
                width: 60px; height: 60px; border-radius: 50%;
                background: #9b59b6; margin: 0 auto 15px;
                display: none; animation: pulse 1.5s infinite;
            }
            .pulse.active { display: block; }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(155,89,182,0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(155,89,182,0); }
            }
            .phone-btn {
                background: #27ae60; color: white; border: none;
                padding: 12px 30px; border-radius: 25px;
                font-size: 16px; cursor: pointer; font-weight: 600;
            }
            .phone-btn.end { background: #e74c3c; }
            .transcript {
                margin-top: 15px; padding: 10px;
                background: #f8f9fa; border-radius: 8px;
                font-size: 14px; color: #555; font-style: italic;
            }
        `;
        document.head.appendChild(style);

        const fab = document.createElement('button');
        fab.className = 'phone-fab';
        fab.innerHTML = '';
        fab.onclick = () => document.getElementById('phoneModal').classList.toggle('active');

        const modal = document.createElement('div');
        modal.id = 'phoneModal';
        modal.className = 'phone-modal';
        modal.innerHTML = `
            <div class="phone-header">
                <h3>📞 ERS Voice Assistant</h3>
                <small style="opacity:0.9">Click "Start Call" to speak</small>
            </div>
            <div class="phone-body">
                <div class="pulse" id="pulse"></div>
                <p id="status" style="color:#7F8C8D; margin:0 0 10px;">Ready to assist</p>
                <div class="transcript" id="transcript"></div>
                <button class="phone-btn" id="callBtn" onclick="toggleCall()">Start Call</button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(modal);
    }

    // Voice logic
    let isCalling = false;
    let recognition = null;
    const synth = window.speechSynthesis;

    window.toggleCall = function() {
        const btn = document.getElementById('callBtn');
        const pulse = document.getElementById('pulse');
        const status = document.getElementById('status');
        
        if (!isCalling) {
            isCalling = true;
            btn.textContent = 'End Call';
            btn.classList.add('end');
            pulse.classList.add('active');
            status.textContent = 'Listening...';
            document.getElementById('transcript').textContent = '';
            startListening();
            speak("Hello! Welcome to ERS Maternity and Pediatric Care. How can I help you?");
        } else {
            isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            pulse.classList.remove('active');
            status.textContent = 'Call ended';
            if (recognition) recognition.stop();
            synth.cancel();
        }
    };

    function startListening() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Please use Chrome for voice features');
            return;
        }
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        
        recognition.onresult = async (e) => {
            const text = e.results[0][0].transcript;
            document.getElementById('transcript').textContent = `You said: "${text}"`;
            await handleVoice(text);
        };
        
        recognition.onend = () => {
            if (isCalling) {
                setTimeout(() => {
                    if (isCalling) recognition.start();
                }, 1000);
            }
        };
        
        try { recognition.start(); } catch(err) {}
    }

    async function handleVoice(text) {
        const status = document.getElementById('status');
        status.textContent = 'Thinking...';
        
        // Try to find answer in database
        const answer = await findAnswer(text);
        
        if (answer) {
            console.log('Using FAQ answer:', answer);
            speak(answer);
            logInteraction(text, answer);
            return;
        }
        
        // Fallback responses
        const lower = text.toLowerCase();
        let response = "I'm not sure about that. Please call us at 0912 345 6789 for more information.";
        
        if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
            response = "We are open Monday to Saturday, 8 AM to 5 PM. Closed on Sundays.";
        } else if (lower.includes('book') || lower.includes('appointment')) {
            response = "You can book an appointment on our website or call us directly.";
        } else if (lower.includes('price') || lower.includes('magkano') || lower.includes('cost')) {
            response = "For pricing information, please call our clinic or visit our services page.";
        } else if (lower.includes('hello') || lower.includes('hi')) {
            response = "Hello! How can I help you today?";
        }
        
        console.log('Using fallback:', response);
        speak(response);
        logInteraction(text, response);
    }

    function speak(text) {
        if (synth.speaking) synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        synth.speak(utter);
        document.getElementById('status').textContent = 'Speaking...';
        utter.onend = () => {
            if (isCalling) document.getElementById('status').textContent = 'Listening...';
        };
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();

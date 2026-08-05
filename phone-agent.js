// phone-agent.js - Smart Voice Agent with Intent Detection

(function() {
    let supabaseClient = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let approvedFAQs = [];
    
    // Medical keywords
    const medicalKeywords = {
        'cs': ['cs', 'c-section', 'caesarean', 'cesarean', 'operation', 'surgery'],
        'nsd': ['nsd', 'normal delivery', 'natural birth', 'vaginal', 'panganak'],
        'checkup': ['checkup', 'check-up', 'examination', 'consultation', 'konsulta'],
        'ultrasound': ['ultrasound', 'sono', 'scan'],
        'vaccine': ['vaccine', 'vaccination', 'bakuna'],
        'prenatal': ['prenatal', 'pregnancy', 'buntis', 'pregnant'],
        'pediatric': ['pediatric', 'child', 'baby', 'infant', 'peds']
    };
    
    // Initialize
    function init() {
        if (window.supabaseClient) {
            supabaseClient = window.supabaseClient;
            loadFAQs();
            console.log('✅ Phone agent ready');
        } else {
            setTimeout(init, 500);
        }
    }
    init();
    
    async function loadFAQs() {
        if (!supabaseClient) return;
        const { data } = await supabaseClient
            .from('faq_improvements')
            .select('*')
            .eq('is_approved', true);
        approvedFAQs = data || [];
        console.log('📚 Loaded', approvedFAQs.length, 'FAQs for phone agent');
    }
    
    // Extract keywords and intent
    function extractKeywords(text) {
        const lower = text.toLowerCase();
        const keywords = [];
        
        // Medical services
        for (const [service, words] of Object.entries(medicalKeywords)) {
            if (words.some(w => lower.includes(w))) {
                keywords.push(service);
            }
        }
        
        // Intent detection
        if (lower.match(/mayroon|meron|have|available|offer|do you/)) keywords.push('intent:availability');
        if (lower.match(/magkano|price|cost|how much|fee|bayad/)) keywords.push('intent:price');
        if (lower.match(/how|what|process|procedure|paano/)) keywords.push('intent:procedure');
        if (lower.match(/when|time|schedule|kailan/)) keywords.push('intent:schedule');
        
        return keywords;
    }
    
    // Generate natural response
    function generateResponse(faq, keywords) {
        const intent = keywords.find(k => k.startsWith('intent:'))?.replace('intent:', '') || 'general';
        const service = keywords.find(k => !k.startsWith('intent:')) || 'service';
        const answer = faq.approved_answer;
        
        // Price questions
        if (intent === 'price') {
            if (answer.match(/price|php|₱|\d+/)) {
                return `For ${service.toUpperCase()}, ${answer}`;
            }
            return `About ${service.toUpperCase()}, ${answer}. Would you like to know more?`;
        }
        
        // Availability questions
        if (intent === 'availability') {
            if (answer.match(/no|don't|not available|none/)) {
                return `I'm sorry, but ${answer.toLowerCase()}. Can I help you with something else?`;
            }
            return `Yes! ${answer}`;
        }
        
        // Default
        return answer;
    }
    
    // Find best FAQ match
    function findFAQ(question) {
        const keywords = extractKeywords(question);
        const lowerQ = question.toLowerCase();
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const faq of approvedFAQs) {
            const faqKeywords = extractKeywords(faq.question.toLowerCase());
            const matches = keywords.filter(k => faqKeywords.includes(k));
            const score = matches.length;
            
            if (lowerQ.includes(faq.question.toLowerCase()) || faq.question.toLowerCase().includes(lowerQ)) {
                return { faq, keywords, score: 10 };
            }
            
            if (score > bestScore && score >= 2) {
                bestScore = score;
                bestMatch = { faq, keywords, score };
            }
        }
        
        return bestMatch;
    }
    
    async function handleVoice(text) {
        const status = document.getElementById('status');
        status.textContent = 'Thinking...';
        
        const match = findFAQ(text);
        
        if (match) {
            console.log('✅ Matched:', match.faq.question, 'Score:', match.score);
            const response = generateResponse(match.faq, match.keywords);
            console.log('Response:', response);
            speak(response);
            logInteraction(text, response);
            return;
        }
        
        // Fallback responses
        const lower = text.toLowerCase();
        let response = "I'm not sure about that. Please call us at 0912 345 6789 for more information.";
        
        if (lower.includes('cs') || lower.includes('c-section')) {
            response = "For Cesarean Section services, please call our clinic directly. Our doctors can provide detailed consultation about CS procedures and availability.";
        } else if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
            response = "We are open Monday to Saturday, 8 AM to 5 PM. Closed on Sundays.";
        } else if (lower.includes('book') || lower.includes('appointment')) {
            response = "You can book an appointment on our website or call us directly.";
        } else if (lower.includes('price') || lower.includes('magkano')) {
            response = "For pricing information, please call our clinic or visit our services page.";
        } else if (lower.includes('hello') || lower.includes('hi')) {
            response = "Hello! How can I help you today?";
        }
        
        speak(response);
        logInteraction(text, response);
    }
    
    function speak(text) {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
        document.getElementById('status').textContent = 'Speaking...';
        utter.onend = () => {
            if (window.isCalling) document.getElementById('status').textContent = 'Listening...';
        };
    }
    
    async function logInteraction(userMsg, aiMsg) {
        if (!supabaseClient) return;
        await supabaseClient.from('ai_conversations').insert([{
            user_message: userMsg,
            ai_response: aiMsg,
            language: 'en',
            source: 'phone_agent'
        }]);
    }
    
    // UI Creation (same as before, just adding the phone icon)
    function createUI() {
        const style = document.createElement('style');
        style.textContent = `
            .phone-fab {
                position: fixed; bottom: 100px; right: 30px;
                width: 60px; height: 60px;
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
                border-radius: 50%; border: none;
                color: white; font-size: 24px;
                cursor: pointer; box-shadow: 0 4px 15px rgba(155,89,182,0.4);
                z-index: 9998; transition: all 0.3s;
                display: flex; align-items: center; justify-content: center;
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
            .phone-body { padding: 20px; text-align: center; }
            .pulse {
                width: 60px; height: 60px; border-radius: 50%;
                background: #e74c3c; margin: 0 auto 15px;
                display: none; animation: pulse 1.5s infinite;
            }
            .pulse.active { display: block; }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(231,76,60,0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(231,76,60,0); }
            }
            .phone-btn {
                background: #27ae60; color: white; border: none;
                padding: 12px 30px; border-radius: 25px;
                font-size: 16px; cursor: pointer; font-weight: 600;
                margin: 5px;
            }
            .phone-btn.end { background: #e74c3c; }
            .transcript {
                margin: 15px 0; padding: 10px;
                background: #f8f9fa; border-radius: 8px;
                font-size: 14px; color: #555; min-height: 20px;
            }
            .status { color: #7F8C8D; font-size: 14px; margin: 10px 0; }
        `;
        document.head.appendChild(style);

        const fab = document.createElement('button');
        fab.className = 'phone-fab';
        fab.innerHTML = '📞';
        fab.onclick = () => document.getElementById('phoneModal').classList.toggle('active');

        const modal = document.createElement('div');
        modal.id = 'phoneModal';
        modal.className = 'phone-modal';
        modal.innerHTML = `
            <div class="phone-header">
                <h3>📞 ERS Voice Assistant</h3>
                <small>Click "Start Call" to speak</small>
            </div>
            <div class="phone-body">
                <div class="pulse" id="pulse"></div>
                <p class="status" id="status">Ready to assist</p>
                <div class="transcript" id="transcript"></div>
                <button class="phone-btn" id="callBtn" onclick="window.toggleCall()">Start Call</button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(modal);
    }
    
    // Voice logic
    window.isCalling = false;
    let recognition = null;
    
    window.toggleCall = async function() {
        const btn = document.getElementById('callBtn');
        const pulse = document.getElementById('pulse');
        const status = document.getElementById('status');
        
        if (!window.isCalling) {
            window.isCalling = true;
            btn.textContent = 'End Call';
            btn.classList.add('end');
            pulse.classList.add('active');
            status.textContent = 'Initializing...';
            document.getElementById('transcript').textContent = '';
            audioChunks = [];
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
                mediaRecorder.start();
                
                startListening();
                speak("Hello! Welcome to ERS Maternity and Pediatric Care. How can I help you today?");
                
            } catch (err) {
                alert('Please allow microphone access');
                window.isCalling = false;
                btn.textContent = 'Start Call';
                btn.classList.remove('end');
            }
            
        } else {
            window.isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            pulse.classList.remove('active');
            status.textContent = 'Call ended';
            
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                setTimeout(async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const transcript = document.getElementById('transcript').textContent.replace('You said: "', '').replace('"', '') || 'Call';
                    await logInteraction(transcript, 'Call ended');
                }, 100);
            }
            
            if (recognition) recognition.stop();
            window.speechSynthesis.cancel();
        }
    };
    
    function startListening() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Please use Chrome');
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
            if (window.isCalling) {
                setTimeout(() => { if (window.isCalling) recognition.start(); }, 1000);
            }
        };
        
        try { recognition.start(); } catch(err) {}
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();

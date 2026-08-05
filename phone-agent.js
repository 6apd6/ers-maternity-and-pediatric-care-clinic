// phone-agent.js - ERS Maternity Voice Agent with Recording

(function() {
    let supabaseClient = null;
    let mediaRecorder = null;
    let audioChunks = [];
    
    // Initialize Supabase
    function initSupabase() {
        if (window.supabaseClient) {
            supabaseClient = window.supabaseClient;
            console.log('✅ Phone agent ready');
        } else {
            setTimeout(initSupabase, 500);
        }
    }
    initSupabase();

    // Log interaction with audio
    async function logInteraction(userMsg, aiMsg, audioBlob) {
        if (!supabaseClient) return;
        
        let audioUrl = null;
        
        // Upload audio if exists
        if (audioBlob && audioBlob.size > 0) {
            const fileName = `phone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webm`;
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('call-recordings')
                .upload(fileName, audioBlob);
            
            if (uploadError) {
                console.error('Upload error:', uploadError);
            } else {
                const { data: urlData } = supabaseClient
                    .storage
                    .from('call-recordings')
                    .getPublicUrl(fileName);
                audioUrl = urlData.publicUrl;
                console.log('✅ Audio uploaded:', audioUrl);
            }
        }
        
        // Save to database
        const { error } = await supabaseClient
            .from('ai_conversations')
            .insert([{
                user_message: userMsg,
                ai_response: aiMsg,
                language: 'en',
                source: 'phone_agent',
                audio_url: audioUrl,
                staff_notes: null
            }]);
        
        if (error) console.error('Log error:', error);
    }

    // Find answer from FAQs
    async function findAnswer(question) {
        if (!supabaseClient) return null;
        
        const lowerQ = question.toLowerCase().trim();
        
        try {
            const { data: faqs } = await supabaseClient
                .from('faq_improvements')
                .select('*')
                .eq('is_approved', true);
            
            if (!faqs || faqs.length === 0) return null;
            
            // Better matching logic
            for (let faq of faqs) {
                const faqLower = faq.question.toLowerCase();
                const qWords = lowerQ.split(' ').filter(w => w.length > 2);
                const fWords = faqLower.split(' ').filter(w => w.length > 2);
                
                // Count matching words
                const matches = qWords.filter(w => fWords.includes(w));
                
                // If 2+ words match OR exact phrase match
                if (matches.length >= 2 || lowerQ.includes(faqLower) || faqLower.includes(lowerQ)) {
                    console.log('✅ Matched FAQ:', faq.question);
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
            .phone-modal.active { display: block; animation: slideUp 0.3s; }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
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
            .recording-indicator {
                display: none; color: #e74c3c; font-weight: 600;
                animation: blink 1s infinite;
            }
            .recording-indicator.active { display: block; }
            @keyframes blink { 50% { opacity: 0.5; } }
        `;
        document.head.appendChild(style);

        const fab = document.createElement('button');
        fab.className = 'phone-fab';
        fab.innerHTML = '📞'; // Phone icon
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
                <div class="recording-indicator" id="recIndicator">🔴 Recording...</div>
                <p class="status" id="status">Ready to assist</p>
                <div class="transcript" id="transcript"></div>
                <div>
                    <button class="phone-btn" id="callBtn" onclick="toggleCall()">Start Call</button>
                </div>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(modal);
    }

    // Voice logic
    let isCalling = false;
    let recognition = null;
    const synth = window.speechSynthesis;

    window.toggleCall = async function() {
        const btn = document.getElementById('callBtn');
        const pulse = document.getElementById('pulse');
        const status = document.getElementById('status');
        const recIndicator = document.getElementById('recIndicator');
        
        if (!isCalling) {
            // Start call
            isCalling = true;
            btn.textContent = 'End Call';
            btn.classList.add('end');
            pulse.classList.add('active');
            status.textContent = 'Initializing...';
            document.getElementById('transcript').textContent = '';
            audioChunks = [];
            
            // Request microphone and start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunks.push(e.data);
                };
                
                mediaRecorder.start();
                recIndicator.classList.add('active');
                console.log('🎤 Recording started');
                
                startListening();
                speak("Hello! Welcome to ERS Maternity and Pediatric Care. How can I help you today?");
                
            } catch (err) {
                console.error('Mic error:', err);
                alert('Please allow microphone access to use voice features');
                isCalling = false;
                btn.textContent = 'Start Call';
                btn.classList.remove('end');
            }
            
        } else {
            // End call
            isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            pulse.classList.remove('active');
            recIndicator.classList.remove('active');
            status.textContent = 'Call ended';
            
            // Stop recording
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                
                // Wait for recording to finish
                setTimeout(async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const lastTranscript = document.getElementById('transcript').textContent.replace('You said: "', '').replace('"', '') || 'Call';
                    await logInteraction(lastTranscript, 'Call ended', audioBlob);
                    console.log('📁 Recording saved');
                }, 100);
            }
            
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
        
        // Try database answer
        const answer = await findAnswer(text);
        
        if (answer) {
            console.log('Using FAQ:', answer);
            speak(answer);
            logInteraction(text, answer, null);
            return;
        }
        
        // Fallback responses
        const lower = text.toLowerCase();
        let response = "I'm not sure about that. Please call us at 0912 345 6789 for more information.";
        
        if (lower.includes('cs') || lower.includes('c-section') || lower.includes('caesarean') || lower.includes('operation')) {
            response = "For information about Cesarean Section services, please call our clinic directly. Our doctors can provide detailed consultation about CS procedures and availability.";
        } else if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
            response = "We are open Monday to Saturday, 8 AM to 5 PM. Closed on Sundays.";
        } else if (lower.includes('book') || lower.includes('appointment')) {
            response = "You can book an appointment on our website or call us directly.";
        } else if (lower.includes('price') || lower.includes('magkano') || lower.includes('cost')) {
            response = "For pricing information, please call our clinic or visit our services page.";
        } else if (lower.includes('hello') || lower.includes('hi')) {
            response = "Hello! How can I help you today?";
        }
        
        console.log('Fallback:', response);
        speak(response);
        logInteraction(text, response, null);
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

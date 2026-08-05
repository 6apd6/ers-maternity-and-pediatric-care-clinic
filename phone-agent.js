// phone-agent.js - Fixed Voice Agent

(function() {
    let supabase = null;
    let approvedFAQs = [];
    let isCalling = false;
    let recognition = null;
    let mediaRecorder = null;
    let audioChunks = [];

    // 1. Initialize
    function init() {
        if (window.supabaseClient) {
            supabase = window.supabaseClient;
            loadFAQs();
            createUI();
        } else {
            setTimeout(init, 500);
        }
    }

    async function loadFAQs() {
        if (!supabase) return;
        const { data } = await supabase.from('faq_improvements').select('*').eq('is_approved', true);
        approvedFAQs = data || [];
        console.log('Phone Agent loaded', approvedFAQs.length, 'FAQs');
    }

    // 2. Create UI
    function createUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            .phone-btn { position: fixed; bottom: 100px; right: 30px; width: 60px; height: 60px; background: #9b59b6; border-radius: 50%; border: none; color: white; font-size: 24px; cursor: pointer; z-index: 9998; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; }
            .phone-modal { display: none; position: fixed; bottom: 170px; right: 30px; width: 300px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 9999; padding: 20px; text-align: center; font-family: sans-serif; }
            .phone-modal.active { display: block; }
            .call-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-size: 16px; margin-top: 10px; }
            .call-btn.end { background: #e74c3c; }
            .pulse { width: 50px; height: 50px; background: #e74c3c; border-radius: 50%; margin: 10px auto; display: none; animation: pulse 1s infinite; }
            .pulse.active { display: block; }
            @keyframes pulse { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('button');
        btn.className = 'phone-btn';
        btn.innerHTML = '';
        btn.onclick = () => document.getElementById('phoneModal').classList.toggle('active');

        const modal = document.createElement('div');
        modal.id = 'phoneModal';
        modal.className = 'phone-modal';
        modal.innerHTML = `
            <h3 style="margin-top:0;">Voice Assistant</h3>
            <div class="pulse" id="pulseRing"></div>
            <p id="statusText">Ready</p>
            <p id="transcript" style="font-style:italic; color:#666; min-height:20px;"></p>
            <button id="callBtn" class="call-btn" onclick="window.toggleCall()">Start Call</button>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(modal);
    }

    // 3. Voice Logic
    window.toggleCall = async function() {
        const btn = document.getElementById('callBtn');
        const pulse = document.getElementById('pulseRing');
        const status = document.getElementById('statusText');

        if (!isCalling) {
            isCalling = true;
            btn.textContent = 'End Call';
            btn.classList.add('end');
            pulse.classList.add('active');
            status.textContent = 'Listening...';
            
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.start();
            } catch(e) { console.error('Mic error', e); }

            startListening();
            speak("Hello! Welcome to ERS Maternity. How can I help you?");
        } else {
            isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            pulse.classList.remove('active');
            status.textContent = 'Call Ended';
            if (recognition) recognition.stop();
            window.speechSynthesis.cancel();
            
            // Save Audio
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                setTimeout(saveAudioLog, 500);
            }
        }
    };

    function startListening() {
        if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome');
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US'; // Can change to 'fil-PH' if needed

        recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('transcript').textContent = `You said: "${text}"`;
            const answer = getSmartAnswer(text);
            speak(answer);
            logText(text, answer);
        };

        recognition.onend = () => {
            if (isCalling) setTimeout(() => recognition.start(), 1000);
        };

        recognition.start();
    }

    function speak(text) {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utter);
        document.getElementById('statusText').textContent = 'Speaking...';
        utter.onend = () => { if(isCalling) document.getElementById('statusText').textContent = 'Listening...'; };
    }

    // 4. THE SMART MATCHING LOGIC
    function getSmartAnswer(question) {
        const lowerQ = question.toLowerCase();
        
        // Detect Intent
        let intent = 'general';
        if (lowerQ.match(/magkano|price|cost/)) intent = 'price';
        if (lowerQ.match(/mayroon|meron|have|available/)) intent = 'availability';

        let bestMatch = null;
        let bestScore = 0;

        for (let faq of approvedFAQs) {
            const faqLower = faq.question.toLowerCase();
            let score = 0;

            // Check word overlap
            const qWords = lowerQ.split(' ');
            const fWords = faqLower.split(' ');
            for (let w of qWords) {
                if (w.length > 2 && fWords.includes(w)) score++;
            }

            // BOOST MEDICAL TERMS (Crucial for "CS")
            if (lowerQ.includes('cs') && faqLower.includes('cs')) score += 10;
            if (lowerQ.includes('nsd') && faqLower.includes('nsd')) score += 10;
            if (lowerQ.includes('ultrasound') && faqLower.includes('ultrasound')) score += 10;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        if (bestMatch && bestScore > 0) {
            // Rephrase based on intent
            if (intent === 'price') return `Regarding pricing: ${bestMatch.approved_answer}`;
            if (intent === 'availability') return `To answer your question: ${bestMatch.approved_answer}`;
            return bestMatch.approved_answer;
        }

        return "I'm not sure about that. Please call our clinic for more details.";
    }

    async function logText(q, a) {
        if (!supabase) return;
        await supabase.from('ai_conversations').insert([{ user_message: q, ai_response: a, source: 'phone_agent' }]);
    }

    async function saveAudioLog() {
        if (!supabase || audioChunks.length === 0) return;
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = 'call-' + Date.now() + '.webm';
        
        const { data } = await supabase.storage.from('call-recordings').upload(fileName, blob);
        if (data) {
            const { data: urlData } = supabase.storage.from('call-recordings').getPublicUrl(fileName);
            // Update the last log with the audio URL
            // (Simplified for now: just logging text)
        }
        audioChunks = [];
    }

    init();
})();

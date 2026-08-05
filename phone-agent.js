// phone-agent.js - Smart Voice Agent with Proper Matching
(function() {
    let supabase = null;
    let FAQs = [];
    let isCalling = false;
    let recognition = null;
    let recorder = null;
    let audioData = [];

    // Initialize
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
        FAQs = data || [];
        console.log('📞 Phone FAQs loaded:', FAQs.length);
    }

    // Convert staff instructions to natural responses
    function convertInstruction(text) {
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
    }

    // Smart matching with scoring
    function getBestAnswer(question) {
        const lower = question.toLowerCase();
        const qWords = lower.split(/\s+/);
        
        let bestMatch = null;
        let bestScore = 0;

        for (let faq of FAQs) {
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

            // Exact phrase match
            if (lower.includes(faqLower) || faqLower.includes(lower)) score += 20;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        if (bestMatch && bestScore > 0) {
            return convertInstruction(bestMatch.approved_answer);
        }
        
        return "I'm not sure about that. Please call our clinic at +63 970 471 6507 for more information.";
    }

    function createUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            .phone-icon { position: fixed; bottom: 100px; right: 30px; width: 60px; height: 60px; background: #9b59b6; border-radius: 50%; border: none; color: white; font-size: 24px; cursor: pointer; z-index: 9998; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            .phone-box { display: none; position: fixed; bottom: 170px; right: 30px; width: 300px; background: white; border-radius: 15px; padding: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 9999; text-align: center; font-family: sans-serif; }
            .phone-box.show { display: block; }
            .start-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; margin-top: 10px; }
            .start-btn.end { background: #e74c3c; }
            .ring { width: 50px; height: 50px; background: #e74c3c; border-radius: 50%; margin: 10px auto; display: none; animation: ring 1s infinite; }
            .ring.on { display: block; }
            @keyframes ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('button');
        btn.className = 'phone-icon';
        btn.innerHTML = '';
        btn.onclick = () => document.getElementById('phoneBox').classList.toggle('show');

        const box = document.createElement('div');
        box.id = 'phoneBox';
        box.className = 'phone-box';
        box.innerHTML = `
            <h3 style="margin-top:0;">Voice Assistant</h3>
            <div class="ring" id="ring"></div>
            <p id="phStatus">Ready</p>
            <p id="phText" style="font-style:italic;color:#666;min-height:20px;"></p>
            <button id="phBtn" class="start-btn" onclick="window.toggleCall()">Start Call</button>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(box);
    }

    window.toggleCall = async function() {
        const btn = document.getElementById('phBtn');
        const ring = document.getElementById('ring');
        const status = document.getElementById('phStatus');

        if (!isCalling) {
            isCalling = true;
            btn.textContent = 'End Call';
            btn.classList.add('end');
            ring.classList.add('on');
            status.textContent = 'Listening...';
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recorder = new MediaRecorder(stream);
                recorder.ondataavailable = e => audioData.push(e.data);
                recorder.start();
            } catch(e) { console.error(e); }

            startListen();
            speak("Hello! Welcome to ERS Maternity. How can I help you?");
        } else {
            isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            ring.classList.remove('on');
            status.textContent = 'Ended';
            if (recognition) recognition.stop();
            window.speechSynthesis.cancel();
            if (recorder) {
                recorder.stop();
                setTimeout(saveAudio, 500);
            }
        }
    };

    function startListen() {
        if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome');
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;

        recognition.onresult = async (e) => {
            const text = e.results[0][0].transcript;
            document.getElementById('phText').textContent = `You: "${text}"`;
            const ans = getBestAnswer(text);
            speak(ans);
            logCall(text, ans);
        };

        recognition.onend = () => { if (isCalling) setTimeout(() => recognition.start(), 1000); };
        recognition.start();
    }

    function speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
        document.getElementById('phStatus').textContent = 'Speaking...';
        u.onend = () => { if(isCalling) document.getElementById('phStatus').textContent = 'Listening...'; };
    }

    async function logCall(q, a) {
        if (!supabase) return;
        await supabase.from('ai_conversations').insert([{ user_message: q, ai_response: a, source: 'phone_agent' }]);
    }

    async function saveAudio() {
        if (!supabase || audioData.length === 0) return;
        const blob = new Blob(audioData, { type: 'audio/webm' });
        const name = 'call-' + Date.now() + '.webm';
        await supabase.storage.from('call-recordings').upload(name, blob);
        audioData = [];
    }

    init();
})();

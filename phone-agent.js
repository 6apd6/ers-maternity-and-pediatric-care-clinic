// phone-agent.js - Complete Voice Agent with Booking Info
(function() {
    let supabase = null;
    let FAQs = [];
    let isCalling = false;
    let recognition = null;
    let recorder = null;
    let audioData = [];

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
        console.log(' Phone FAQs loaded:', FAQs.length);
    }

    function getBasicResponse(text) {
        const lower = text.toLowerCase();
        if (lower.includes('thank') || lower.includes('salamat')) return "You're very welcome! Is there anything else I can help you with?";
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('good morning')) return "Hello! Welcome to ERS Maternity. How can I assist you today?";
        if (lower.includes('bye') || lower.includes('goodbye')) return "Thank you for calling ERS Maternity. Have a wonderful day!";
        return null;
    }

    function getWebsiteInfo(text) {
        const lower = text.toLowerCase();
        
        // NEW: Booking/Appointment Info
        if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('reserve') || lower.includes('pa book') || lower.includes('how to book')) {
            return "To book an appointment, you can click the Book Appointment button on our website, or call us at 0917 471 6507. We're open Monday to Saturday, 8 AM to 5 PM.";
        }
        
        if (lower.includes('where') || lower.includes('location') || lower.includes('address') || lower.includes('saan')) {
            return "We are located at Trece Martires - Indang Road, Trece Martires City, Cavite 4109.";
        }
        if (lower.includes('contact') || lower.includes('number') || lower.includes('email')) {
            return "You can reach us at Mobile: 0917 471 6507, Landline: 419-0201, or Email: ersmaternityclinic@gmail.com.";
        }
        if (lower.includes('hour') || lower.includes('time') || lower.includes('open') || lower.includes('oras')) {
            return "We are open Monday to Saturday from 8:00 AM to 5:00 PM. We are closed on Sundays.";
        }
        if (lower.includes('doctor') || lower.includes('sino') || lower.includes('dr.')) {
            return "Our attending physicians are Dr. Evalyn Rivera-Castillo and Dr. Elli Sinsay.";
        }
        if (lower.includes('service') || lower.includes('offer') || lower.includes('meron')) {
            return "We offer Prenatal Care, Postpartum Care, Pediatric Care, Newborn Care, Vaccinations, Ultrasound, and General Check-ups.";
        }
        if (lower.includes('portal') || lower.includes('record') || lower.includes('result')) {
            return "You can access your medical records through our Patient Portal on the website.";
        }
        return null;
    }

    function convertInstruction(text) {
        const lower = text.toLowerCase();
        if (lower.includes('tell the customer to call') || lower.includes('tell them to call')) {
            return "For more information, please call us at 0917 471 6507.";
        }
        if (lower.includes('tell the patient')) {
            return text.replace(/tell the patient/gi, 'please').replace(/to call/gi, 'call');
        }
        return text;
    }

    function getBestAnswer(question) {
        const lower = question.toLowerCase();
        
        const basicResponse = getBasicResponse(question);
        if (basicResponse) return basicResponse;

        const websiteInfo = getWebsiteInfo(question);
        if (websiteInfo) return websiteInfo;

        const qWords = lower.split(/\s+/).filter(w => w.length > 2);
        let bestMatch = null;
        let bestScore = 0;

        for (let faq of FAQs) {
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

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        if (bestMatch && bestScore > 0) {
            return convertInstruction(bestMatch.approved_answer);
        }
        
        return "I'm not sure about that. Please call our clinic at 0917 471 6507 for more information.";
    }

    function createUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            .phone-icon { position: fixed; bottom: 100px; right: 30px; width: 60px; height: 60px; background: #9b59b6; border-radius: 50%; border: none; color: white; font-size: 24px; cursor: pointer; z-index: 9998; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            .phone-icon:hover { transform: scale(1.1); }
            .phone-box { display: none; position: fixed; bottom: 170px; right: 30px; width: 300px; background: white; border-radius: 15px; padding: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 9999; text-align: center; font-family: sans-serif; }
            .phone-box.show { display: block; animation: fadeIn 0.3s; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .start-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; margin-top: 10px; font-weight: 600; }
            .start-btn.end { background: #e74c3c; }
            .ring { width: 50px; height: 50px; background: #e74c3c; border-radius: 50%; margin: 10px auto; display: none; animation: ring 1s infinite; }
            .ring.on { display: block; }
            @keyframes ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('button');
        btn.className = 'phone-icon';
        btn.innerHTML = '📞';
        btn.title = 'Voice Assistant';
        btn.onclick = () => document.getElementById('phoneBox').classList.toggle('show');

        const box = document.createElement('div');
        box.id = 'phoneBox';
        box.className = 'phone-box';
        box.innerHTML = `
            <h3 style="margin-top:0; color: #333;">Voice Assistant</h3>
            <div class="ring" id="ring"></div>
            <p id="phStatus" style="color: #666;">Ready to assist</p>
            <p id="phText" style="font-style:italic; color:#888; min-height:20px; font-size: 14px;"></p>
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
            } catch(e) { 
                console.error(e); 
                alert('Please allow microphone access.');
                isCalling = false;
                btn.textContent = 'Start Call';
                btn.classList.remove('end');
                ring.classList.remove('on');
                return;
            }

            startListen();
            speak("Hello! Welcome to ERS Maternity. How can I help you?");
        } else {
            isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            ring.classList.remove('on');
            status.textContent = 'Call Ended';
            if (recognition) recognition.stop();
            window.speechSynthesis.cancel();
            if (recorder) {
                recorder.stop();
                setTimeout(saveAudio, 500);
            }
        }
    };

    function startListen() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Please use Google Chrome for voice features.');
            return;
        }
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recognition.onresult = async (e) => {
            const text = e.results[0][0].transcript;
            document.getElementById('phText').textContent = `You said: "${text}"`;
            const ans = getBestAnswer(text);
            speak(ans);
            logCall(text, ans);
        };

        recognition.onend = () => { 
            if (isCalling) setTimeout(() => { if (isCalling) recognition.start(); }, 1000);
        };
        
        try { recognition.start(); } catch(err) {}
    }

    function speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95;
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

// phone-agent.js - Working Version
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
        console.log('📞 Phone FAQs loaded:', FAQs.length);
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
        btn.innerHTML = '📞';
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
            const ans = getAnswer(text);
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

    function getAnswer(q) {
        const lower = q.toLowerCase();
        
        for (let faq of FAQs) {
            const fLower = faq.question.toLowerCase();
            const words = fLower.split(' ');
            
            for (let w of words) {
                if (w.length > 3 && lower.includes(w)) {
                    return faq.approved_answer;
                }
            }
            
            if (lower.includes(fLower) || fLower.includes(lower)) {
                return faq.approved_answer;
            }
        }
        
        return "Please call our clinic at 0912 345 6789 for more information.";
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

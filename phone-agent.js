// phone-agent.js - ERS Maternity Voice Agent with Logging

(function() {
    // Wait for Supabase to be ready
    function waitForSupabase(callback) {
        if (window.supabaseClient) {
            callback();
        } else {
            setTimeout(() => waitForSupabase(callback), 500);
        }
    }

    // --- Logging Function ---
    async function logPhoneInteraction(userMsg, aiMsg) {
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient
                .from('ai_conversations')
                .insert([{
                    user_message: userMsg,
                    ai_response: aiMsg,
                    language: 'en',
                    was_helpful: null,
                    source: 'phone_agent' // This tags it as a phone call
                }]);
            
            if (error) console.error('Phone log error:', error);
            else console.log('Phone interaction logged successfully');
        } catch (e) {
            console.error('Failed to log phone interaction:', e);
        }
    }

    // --- UI Creation ---
    function createPhoneAgentUI() {
        // Add CSS
        const style = document.createElement('style');
        style.innerHTML = `
            .phone-fab {
                position: fixed; bottom: 100px; right: 30px; width: 60px; height: 60px;
                background: #9b59b6; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 9998; transition: transform 0.2s;
            }
            .phone-fab:hover { transform: scale(1.1); }
            .phone-modal {
                display: none; position: fixed; bottom: 170px; right: 30px; width: 320px;
                background: white; border-radius: 15px; box-shadow: 0 5px 25px rgba(0,0,0,0.15);
                z-index: 9999; overflow: hidden; font-family: 'Poppins', sans-serif;
            }
            .phone-modal.active { display: block; }
            .phone-header {
                background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;
                padding: 15px; text-align: center;
            }
            .phone-body { padding: 20px; text-align: center; min-height: 150px; display: flex; flex-direction: column; justify-content: center; }
            .phone-btn {
                background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 25px;
                font-size: 16px; cursor: pointer; margin-top: 10px;
            }
            .phone-btn.end { background: #e74c3c; }
            .pulse-ring {
                width: 80px; height: 80px; border-radius: 50%; background: #9b59b6;
                margin: 0 auto; position: relative; display: none;
            }
            .pulse-ring.active { display: block; animation: pulse 1.5s infinite; }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(155, 89, 182, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(155, 89, 182, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(155, 89, 182, 0); }
            }
            .transcript { font-size: 14px; color: #555; margin-top: 10px; font-style: italic; min-height: 20px;}
        `;
        document.head.appendChild(style);

        // Add HTML
        const fab = document.createElement('div');
        fab.className = 'phone-fab';
        fab.innerHTML = '';
        fab.onclick = togglePhoneModal;

        const modal = document.createElement('div');
        modal.className = 'phone-modal';
        modal.id = 'phoneModal';
        modal.innerHTML = `
            <div class="phone-header">
                <h3 style="margin:0;">ERS Voice Assistant</h3>
                <small>Click to start a call</small>
            </div>
            <div class="phone-body">
                <div class="pulse-ring" id="pulseRing"></div>
                <p id="phoneStatus">Ready to assist you.</p>
                <div class="transcript" id="phoneTranscript"></div>
                <button class="phone-btn" id="callBtn" onclick="window.toggleCall()">Start Call</button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(modal);
    }

    // --- Logic ---
    let isCalling = false;
    let recognition = null;
    let synthesis = window.speechSynthesis;

    window.togglePhoneModal = function() {
        document.getElementById('phoneModal').classList.toggle('active');
    };

    window.toggleCall = function() {
        const btn = document.getElementById('callBtn');
        const ring = document.getElementById('pulseRing');
        const status = document.getElementById('phoneStatus');

        if (!isCalling) {
            // Start Call
            isCalling = true;
            btn.textContent = 'End Call';
            btn.classList.add('end');
            ring.classList.add('active');
            status.textContent = 'Listening...';
            startListening();
            speak("Hello! Welcome to ERS Maternity and Pediatric Care. How can I help you today?");
        } else {
            // End Call
            isCalling = false;
            btn.textContent = 'Start Call';
            btn.classList.remove('end');
            ring.classList.remove('active');
            status.textContent = 'Call ended. Thank you!';
            stopListening();
            synthesis.cancel();
        }
    };

    function startListening() {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Your browser doesn't support voice recognition. Please use Chrome.");
            return;
        }
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            const userText = event.results[0][0].transcript;
            document.getElementById('phoneTranscript').textContent = `You: "${userText}"`;
            processVoiceCommand(userText);
        };

        recognition.onend = function() {
            if (isCalling) {
                // Restart listening if call is still active
                try { recognition.start(); } catch(e){}
            }
        };

        try { recognition.start(); } catch(e){}
    }

    function stopListening() {
        if (recognition) recognition.stop();
    }

    function speak(text) {
        if (synthesis.speaking) synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        synthesis.speak(utterance);
        
        // Log the interaction
        const lastUserText = document.getElementById('phoneTranscript').textContent.replace('You: "', '').replace('"', '') || 'Greeting';
        logPhoneInteraction(lastUserText, text);
    }

    function processVoiceCommand(text) {
        const lowerText = text.toLowerCase();
        let response = "I'm sorry, I didn't quite catch that. Could you please repeat?";

        if (lowerText.includes('hour') || lowerText.includes('open') || lowerText.includes('close')) {
            response = "We are open Monday to Saturday, from 8 AM to 5 PM. We are closed on Sundays.";
        } else if (lowerText.includes('book') || lowerText.includes('appointment') || lowerText.includes('schedule')) {
            response = "You can book an appointment by visiting our website at the Book Appointment page, or by calling our clinic directly.";
        } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('magkano')) {
            response = "For our most up-to-date pricing and packages, please call our clinic or check our services page.";
        } else if (lowerText.includes('hello') || lowerText.includes('hi')) {
            response = "Hello! How can I assist you with your maternity or pediatric care needs today?";
        }

        document.getElementById('phoneStatus').textContent = 'Speaking...';
        speak(response);
        setTimeout(() => {
            if(isCalling) document.getElementById('phoneStatus').textContent = 'Listening...';
        }, 3000);
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPhoneAgentUI);
    } else {
        createPhoneAgentUI();
    }

})();

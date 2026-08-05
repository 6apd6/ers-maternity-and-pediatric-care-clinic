// phone-agent.js - ERS Maternity Voice Agent with FAQ Database Integration

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
                    source: 'phone_agent'
                }]);
            
            if (error) console.error('Phone log error:', error);
        } catch (e) {
            console.error('Failed to log phone interaction:', e);
        }
    }

    // --- Check Database for Approved FAQs ---
    async function getApprovedAnswer(input) {
        if (!window.supabaseClient) return null;
        
        try {
            const lowerInput = input.toLowerCase().trim();
            const { data: approvedFaqs } = await window.supabaseClient
                .from('faq_improvements')
                .select('question, approved_answer')
                .eq('is_approved', true);
            
            if (!approvedFaqs || approvedFaqs.length === 0) return null;

            const stopWords = ['magkano', 'how', 'much', 'what', 'is', 'ang', 'sa', 'po', 'ba', 'ano', 'the', 'a', 'an', 'you', 'your', 'my', 'i', 'we', 'can', 'do'];
            const userInputWords = lowerInput.split(' ').filter(word => word.length > 2 && !stopWords.includes(word));

            for (const faq of approvedFaqs) {
                const faqQuestion = faq.question.toLowerCase().trim();
                const faqWords = faqQuestion.split(' ').filter(word => word.length > 2 && !stopWords.includes(word));
                const matchingWords = userInputWords.filter(word => faqWords.includes(word));
                const matchPercentage = matchingWords.length / Math.max(userInputWords.length, faqWords.length);

                if (matchPercentage >= 0.5 || lowerInput.includes(faqQuestion) || faqQuestion.includes(lowerInput)) {
                    console.log('✅ Phone AI found FAQ match:', faq.question);
                    return faq.approved_answer;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error checking phone FAQs:', error);
            return null;
        }
    }

    // --- UI Creation ---
    function createPhoneAgentUI() {
        // Add CSS
        const style = document.createElement('style');
        style.innerHTML = `
            .phone-fab {
                position: fixed; bottom: 100px; right: 30px; width: 60px; height: 60px;
                background: linear-gradient(135deg, #9b59b6, #8e44ad); border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 28px; cursor: pointer; box-shadow: 0 4px 15px rgba(155, 89, 182, 0.4);
                z-index: 9998; transition: all 0.3s; border: none;
            }
            .phone-fab:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(155, 89, 182, 0.6); }
            .phone-modal {
                display: none; position: fixed; bottom: 170px; right: 30px; width: 320px;
                background: white; border-radius: 15px; box-shadow: 0 5px 25px rgba(0,0,0,0.15);
                z-index: 9999; overflow: hidden; font-family: 'Poppins', sans-serif;
            }
            .phone-modal.active { display: block; animation: slideUp 0.3s; }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .phone-header {
                background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;
                padding: 15px; text-align: center;
            }
            .phone-header h3 { margin: 0; font-size: 16px; }
            .phone-header small { opacity: 0.9; }
            .phone-body { padding: 25px; text-align: center; min-height: 150px; display: flex; flex-direction: column; justify-content: center; }
            .phone-btn {
                background: #27ae60; color: white; border: none; padding: 12px 30px; border-radius: 25px;
                font-size: 16px; cursor: pointer; margin-top: 10px; font-weight: 600; transition: all 0.3s;
            }
            .phone-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3); }
            .phone-btn.end { background: #e74c3c; }
            .phone-btn.end:hover { box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3); }
            .pulse-ring {
                width: 80px; height: 80px; border-radius: 50%; background: #9b59b6;
                margin: 0 auto 15px; position: relative; display: none;
            }
            .pulse-ring.active { display: block; animation: pulse 1.5s infinite; }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(155, 89, 182, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(155, 89, 182, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(155, 89, 182, 0); }
            }
            .transcript { font-size: 14px; color: #555; margin-top: 15px; font-style: italic; min-height: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; }
            .status-text { font-size: 14px; color: #7F8C8D; margin: 10px 0; }
        `;
        document.head.appendChild(style);

        // Add HTML with Phone Icon
        const fab = document.createElement('button');
        fab.className = 'phone-fab';
        fab.setAttribute('aria-label', 'Call ERS Clinic');
        fab.innerHTML = ''; // Phone icon
        fab.onclick = togglePhoneModal;

        const modal = document.createElement('div');
        modal.className = 'phone-modal';
        modal.id = 'phoneModal';
        modal.innerHTML = `
            <div class="phone-header">
                <h3>📞 ERS Voice Assistant</h3>
                <small>Click "Start Call" to speak with us</small>
            </div>
            <div class="phone-body">
                <div class="pulse-ring" id="pulseRing"></div>
                <p class="status-text" id="phoneStatus">Ready to assist you.</p>
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
        const modal = document.getElementById('phoneModal');
        modal.classList.toggle('active');
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
            document.getElementById('phoneTranscript').textContent = '';
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
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
            const userText = event.results[0][0].transcript;
            document.getElementById('phoneTranscript').textContent = `You said: "${userText}"`;
            processVoiceCommand(userText);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            if (isCalling) {
                document.getElementById('phoneStatus').textContent = 'Error. Please try again.';
            }
        };

        recognition.onend = function() {
            if (isCalling) {
                setTimeout(() => {
                    if (isCalling) {
                        document.getElementById('phoneStatus').textContent = 'Listening...';
                        try { recognition.start(); } catch(e){}
                    }
                }, 1000);
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
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        synthesis.speak(utterance);
        
        // Log the interaction
        const transcript = document.getElementById('phoneTranscript');
        const lastUserText = transcript.textContent.replace('You said: "', '').replace('"', '') || 'Greeting';
        logPhoneInteraction(lastUserText, text);
        
        document.getElementById('phoneStatus').textContent = 'Speaking...';
        
        utterance.onend = function() {
            if (isCalling) {
                setTimeout(() => {
                    if (isCalling) {
                        document.getElementById('phoneStatus').textContent = 'Listening...';
                    }
                }, 500);
            }
        };
    }

    async function processVoiceCommand(text) {
        console.log(' Processing voice command:', text);
        
        // First, check the database for approved FAQs
        const dbAnswer = await getApprovedAnswer(text);
        
        if (dbAnswer) {
            console.log('✅ Using database answer:', dbAnswer);
            speak(dbAnswer);
            return;
        }

        // Fallback to basic responses if no FAQ match
        const lowerText = text.toLowerCase();
        let response = "I'm not sure about that. For more information, please visit our clinic or call us directly.";

        if (lowerText.includes('hour') || lowerText.includes('open') || lowerText.includes('close') || lowerText.includes('time')) {
            response = "We are open Monday to Saturday, from 8 AM to 5 PM. We are closed on Sundays.";
        } else if (lowerText.includes('book') || lowerText.includes('appointment') || lowerText.includes('schedule') || lowerText.includes('reserve')) {
            response = "You can book an appointment by visiting our website at the Book Appointment page, or by calling our clinic directly at 0912 345 6789.";
        } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('magkano') || lowerText.includes('payment')) {
            response = "For our most up-to-date pricing and packages, please call our clinic or check our services page on the website.";
        } else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('good morning') || lowerText.includes('good afternoon')) {
            response = "Hello! How can I assist you with your maternity or pediatric care needs today?";
        } else if (lowerText.includes('thank') || lowerText.includes('salamat')) {
            response = "You're welcome! Is there anything else I can help you with?";
        } else if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('salamat')) {
            response = "Thank you for calling ERS Maternity. Have a great day!";
            setTimeout(() => { if(isCalling) window.toggleCall(); }, 3000);
        }

        console.log('Using fallback response:', response);
        speak(response);
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPhoneAgentUI);
    } else {
        createPhoneAgentUI();
    }

})();

/* =========================================
   AI CHATBOT - 4 LANGUAGES
   English, Tagalog, Bisaya (Cebuano), Ilocano
   ========================================= */

class MultilingualChatbot {
    constructor() {
        this.isChatOpen = false;
        this.hasGreeted = false;
        this.currentLangMode = 'auto'; // 'auto', 'en', 'tl', 'ceb', 'ilo'
        this.detectedLang = 'en';
        this.init();
    }

    init() {
        this.createWidget();
        this.attachEventListeners();
    }

    createWidget() {
        const container = document.getElementById('chatbotWidget');
        if (!container) return;

        container.innerHTML = `
            <div class="chatbot-widget">
                <div class="chatbot-window" id="chatbotWindow">
                    <div class="chatbot-header">
                        <div class="chatbot-avatar">🤖</div>
                        <div class="chatbot-header-info">
                            <h4>ERS Assistant</h4>
                            <p><span class="status-dot"></span> Online | EN/TL/CEB/ILO</p>
                        </div>
                        <button class="lang-toggle" id="chatLangToggle" title="Switch language">
                            🌐 <span id="chatLangLabel">Auto</span>
                        </button>
                    </div>
                    <div class="chatbot-messages" id="chatbotMessages"></div>
                    <div class="typing-indicator" id="typingIndicator">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="chatbot-input-area">
                        <input type="text" class="chatbot-input" id="chatbotInput" 
                               placeholder="Type in any language...">
                        <button class="chatbot-send" id="chatbotSend">
                            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                        </button>
                    </div>
                </div>
                <button class="chatbot-toggle" id="chatbotToggle">
                    <div class="chatbot-notification"></div>
                    <svg class="icon-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                    <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        `;

        // Inject chatbot styles
        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-widget { position: fixed; bottom: 30px; right: 30px; z-index: 9999; font-family: 'Poppins', sans-serif; }
            .chatbot-toggle { width: 65px; height: 65px; background: linear-gradient(135deg, #E91E63 0%, #FF6F00 100%); border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 10px 30px rgba(233, 30, 99, 0.4); display: flex; align-items: center; justify-content: center; transition: all 0.3s; position: relative; }
            .chatbot-toggle:hover { transform: scale(1.1); }
            .chatbot-toggle svg { width: 30px; height: 30px; fill: white; }
            .chatbot-toggle.active svg.icon-open { display: none; }
            .chatbot-toggle:not(.active) svg.icon-close { display: none; }
            .chatbot-notification { position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 2s infinite; }
            .chatbot-window { position: absolute; bottom: 80px; right: 0; width: 380px; height: 580px; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; overflow: hidden; opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.95); transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            .chatbot-window.active { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
            .chatbot-header { background: linear-gradient(135deg, #E91E63 0%, #FF6F00 100%); color: white; padding: 1.2rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
            .chatbot-avatar { width: 45px; height: 45px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
            .chatbot-header-info { flex: 1; }
            .chatbot-header-info h4 { font-size: 1.1rem; margin-bottom: 0.2rem; }
            .chatbot-header-info p { font-size: 0.8rem; opacity: 0.9; display: flex; align-items: center; gap: 0.3rem; }
            .status-dot { width: 8px; height: 8px; background: #4CD964; border-radius: 50%; display: inline-block; }
            .lang-toggle { background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; }
            .chatbot-messages { flex: 1; padding: 1.5rem; overflow-y: auto; background: #FAFAFA; display: flex; flex-direction: column; gap: 1rem; }
            .message { max-width: 85%; padding: 1rem; border-radius: 15px; font-size: 0.9rem; line-height: 1.5; animation: messagePop 0.3s ease; }
            @keyframes messagePop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .message.bot { background: white; color: #2C3E50; border-bottom-left-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); align-self: flex-start; }
            .message.user { background: linear-gradient(135deg, #E91E63 0%, #FF6F00 100%); color: white; border-bottom-right-radius: 5px; align-self: flex-end; }
            .typing-indicator { display: none; gap: 4px; padding: 1rem; background: white; border-radius: 15px; width: fit-content; box-shadow: 0 2px 10px rgba(0,0,0,0.05); align-self: flex-start; }
            .typing-indicator.active { display: flex; }
            .typing-indicator span { width: 8px; height: 8px; background: #ccc; border-radius: 50%; animation: typing 1.4s infinite; }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .quick-replies { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
            .quick-reply-btn { background: #FFF5F7; color: #E91E63; border: 1px solid #F8BBD0; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; font-family: 'Poppins', sans-serif; }
            .quick-reply-btn:hover { background: #E91E63; color: white; }
            .chatbot-input-area { padding: 1rem; background: white; border-top: 1px solid #eee; display: flex; gap: 0.5rem; }
            .chatbot-input { flex: 1; padding: 0.8rem 1rem; border: 2px solid #e0e0e0; border-radius: 25px; font-family: 'Poppins', sans-serif; outline: none; }
            .chatbot-input:focus { border-color: #E91E63; }
            .chatbot-send { width: 45px; height: 45px; background: linear-gradient(135deg, #E91E63 0%, #FF6F00 100%); border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .chatbot-send svg { width: 20px; height: 20px; fill: white; }
            @media (max-width: 480px) { .chatbot-window { width: calc(100vw - 40px); height: 70vh; right: -10px; } }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        setTimeout(() => {
            const toggle = document.getElementById('chatbotToggle');
            const send = document.getElementById('chatbotSend');
            const input = document.getElementById('chatbotInput');
            const langToggle = document.getElementById('chatLangToggle');

            if (toggle) toggle.addEventListener('click', () => this.toggleChat());
            if (send) send.addEventListener('click', () => this.processUserMessage(input.value));
            if (input) input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.processUserMessage(input.value);
            });
            if (langToggle) langToggle.addEventListener('click', () => this.cycleLanguage());
        }, 100);
    }

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const window = document.getElementById('chatbotWindow');
        const toggle = document.getElementById('chatbotToggle');
        window.classList.toggle('active', this.isChatOpen);
        toggle.classList.toggle('active', this.isChatOpen);

        if (this.isChatOpen && !this.hasGreeted) {
            this.hasGreeted = true;
            setTimeout(() => {
                this.addMessage("Kumusta po! / Hello! / Maayong adlaw! / Naimbag a malem! 👋", 'bot');
                setTimeout(() => {
                    this.addMessage(this.responses.greetings[this.getLang()], 'bot');
                    this.addQuickReplies();
                }, 500);
            }, 500);
        }

        if (this.isChatOpen) {
            document.getElementById('chatbotInput').focus();
        }
    }

    cycleLanguage() {
        const modes = ['auto', 'en', 'tl', 'ceb', 'ilo'];
        const labels = { auto: 'Auto', en: 'EN', tl: 'TL', ceb: 'CEB', ilo: 'ILO' };
        const currentIndex = modes.indexOf(this.currentLangMode);
        this.currentLangMode = modes[(currentIndex + 1) % modes.length];
        document.getElementById('chatLangLabel').textContent = labels[this.currentLangMode];
        
        const langMsg = {
            auto: '🌐 Language: Auto-detect',
            en: '🇬🇧 English',
            tl: '🇵🇭 Tagalog',
            ceb: '🇵🇭 Bisaya (Cebuano)',
            ilo: '🇵🇭 Ilocano'
        };
        this.addMessage(langMsg[this.currentLangMode], 'bot');
    }

    getLang() {
        if (this.currentLangMode !== 'auto') return this.currentLangMode;
        return this.detectedLang;
    }

    // Language detection
    detectLanguage(input) {
        if (this.currentLangMode !== 'auto') return this.currentLangMode;
        
        const lower = input.toLowerCase();
        const words = lower.split(/\s+/);
        
        const markers = {
            tl: ['po','opo','ho','naman','lang','pala','nga','ba','daw','raw','ano','sino','saan','kailan','bakit','paano','magkano','ako','ka','kita','tayo','kami','siya','sila','kumusta','kamusta','magandang','salamat','buntis','bata','ngayon','bukas','kahapon','at','ang','mga','sa','na','may','para'],
            ceb: ['po','maayong','adlaw','gabii','salamat','palihug','unsa','kinsa','asa','kanus-a','ngano','unsay','ko','ika','kita','kami','siya','sila','buntis','bata','karon','ugma','gahapon','ug','ang','mga','sa','na','adlaw','lawom','gabii'],
            ilo: ['po','naimbag','aldaw','rabii','agyamanak','kaloongan','ania','sino','sadino','kaano','apay','aniana','siak','sika','datayo','dakami','isuna','daanda','buntis','ubing','ita','intan','idi','ken','ti','dagiti','iti','nga','para']
        };

        const scores = { en: 0, tl: 0, ceb: 0, ilo: 0 };
        
        words.forEach(word => {
            const clean = word.replace(/[.,!?;:]/g, '');
            Object.entries(markers).forEach(([lang, words]) => {
                if (words.includes(clean)) scores[lang]++;
            });
        });

        const totalWords = Math.max(words.length, 1);
        let maxLang = 'en';
        let maxScore = 0;
        
        Object.entries(scores).forEach(([lang, score]) => {
            const ratio = score / totalWords;
            if (ratio >= 0.2 && score > maxScore) {
                maxScore = score;
                maxLang = lang;
            }
        });

        this.detectedLang = maxLang;
        return maxLang;
    }

    // Multilingual knowledge base
    knowledgeBase = {
        greetings: {
            en: ["hello","hi","hey","good morning","good afternoon","good evening"],
            tl: ["kumusta","kamusta","magandang","umaga","tanghali","hapon","gabi"],
            ceb: ["maayong","adlaw","gabii","hapon","buntag"],
            ilo: ["naimbag","aldaw","rabii","bigat","malem"]
        },
        hours: {
            en: ["hour","open","time","schedule","when","close"],
            tl: ["oras","bukas","sarado","kailan","schedule"],
            ceb: ["oras","abli","sarado","kanus-a","schedule"],
            ilo: ["oras","lukat","serra","kaano","schedule"]
        },
        location: {
            en: ["location","address","where","find","direction","map"],
            tl: ["saan","address","lokasyon","direksyon","paano pumunta"],
            ceb: ["asa","address","lokasyon","direksyon","paon","punta"],
            ilo: ["sadino","address","lokasyon","direksyon","pannaka"]
        },
        doctors: {
            en: ["doctor","obgyn","pediatrician","staff","who"],
            tl: ["doktor","doctor","sino","midwife","hilot"],
            ceb: ["doktor","doctor","kinsa","midwife"],
            ilo: ["doktor","doctor","sino","midwife"]
        },
        booking: {
            en: ["book","appointment","schedule","reserve"],
            tl: ["mag-book","book","appointment","paano"],
            ceb: ["mag-book","book","appointment","paano"],
            ilo: ["ag-book","book","appointment","kasano"]
        },
        services: {
            en: ["service","prenatal","delivery","checkup","pediatric"],
            tl: ["serbisyo","prenatal","panganganak","checkup"],
            ceb: ["serbisyo","prenatal","panganganak","checkup"],
            ilo: ["serbisyo","prenatal","panaganak","checkup"]
        },
        contact: {
            en: ["contact","phone","number","call","email"],
            tl: ["contact","tawag","tawagan","number","numero","email"],
            ceb: ["contact","tawag","tawagan","number","numero","email"],
            ilo: ["contact","tawag","tawagan","number","numero","email"]
        },
        price: {
            en: ["price","cost","package","affordable","fee","how much"],
            tl: ["magkano","presyo","package","pera","bayad"],
            ceb: ["pila","presyo","package","pera","bayad"],
            ilo: ["mano","presyo","package","kuarta","bayad"]
        },
        thanks: {
            en: ["thank","thanks"],
            tl: ["salamat"],
            ceb: ["salamat","daghang salamat"],
            ilo: ["agyamanak"]
        }
    };

    // Multilingual responses
    responses = {
        greetings: {
            en: "Welcome to ERS Maternity & Pediatric Care Clinic! I'm your virtual assistant. How can I help you today?",
            tl: "Maligayang pagdating sa ERS Maternity & Pediatric Care Clinic! Ako po ang inyong virtual assistant. Paano po ako makakatulong sa inyo?",
            ceb: "Welcome sa ERS Maternity & Pediatric Care Clinic! Ako ang inyong virtual assistant. Unsay matabang nako nimo karon?",
            ilo: "Naimbag a panawen iti ERS Maternity & Pediatric Care Clinic! Siak ti virtual assistant yo. Kasano ti makatulong kadakayo?"
        },
        hours: {
            en: "Our clinic is open **Monday to Saturday, 8:00 AM to 5:00 PM**. Closed on Sundays.",
            tl: "Ang aming klinika ay bukas **Lunes hanggang Sabado, 8:00 AM hanggang 5:00 PM**. Sarado tuwing Linggo.",
            ceb: "Ang among klinika bukas **Lunes hangtod Sabado, 8:00 AM hangtod 5:00 PM**. Sarado sa Domingo.",
            ilo: "Lukat ti klinika mi **Lunes agingga Sabado, 8:00 AM agingga 5:00 PM**. Serrado Domingo."
        },
        location: {
            en: "We are at **Trece Martires - Indang Road, Trece Martires City, Cavite 4109**.",
            tl: "Nasa **Trece Martires - Indang Road, Trece Martires City, Cavite 4109** po kami.",
            ceb: "Naa mi sa **Trece Martires - Indang Road, Trece Martires City, Cavite 4109**.",
            ilo: "Adda kami iti **Trece Martires - Indang Road, Trece Martires City, Cavite 4109**."
        },
        doctors: {
            en: "Our doctors are **Dr. Evalyn Rivera-Castillo** and **Dr. Elli Sinsay**, with experienced midwives.",
            tl: "Ang aming mga doktor ay sina **Dr. Evalyn Rivera-Castillo** at **Dr. Elli Sinsay**, kasama ang mga karanasang midwife.",
            ceb: "Ang among mga doktor sila **Dr. Evalyn Rivera-Castillo** ug **Dr. Elli Sinsay**, kauban ang kasinatian nga mga midwife.",
            ilo: "Dagiti doktor mi da **Dr. Evalyn Rivera-Castillo** ken **Dr. Elli Sinsay**, kaadda dagiti nasarakan nga midwife."
        },
        booking: {
            en: "You can book by calling **+63 970 471 6507** or visit our **Book Appointment** page on this website!",
            tl: "Pwede po kayong mag-book sa **+63 970 471 6507** o bisitahin ang **Book Appointment** page sa website!",
            ceb: "Pwede ka mag-book sa **+63 970 471 6507** o bisitaha ang **Book Appointment** page sa website!",
            ilo: "Mabalin yo nga ag-book iti **+63 970 471 6507** wenno bisitaen yo ti **Book Appointment** page iti website!"
        },
        services: {
            en: "We offer: 🤰 Prenatal Care, 👶 Normal Delivery, 🏥 C-Section, 🍼 Pediatric Care, 💊 Postpartum Care, 🩺 OB-GYN.",
            tl: "Nag-o-offer po kami ng: 🤰 Prenatal Care, 👶 Normal Delivery, 🏥 C-Section, 🍼 Pediatric Care, 💊 Postpartum Care, 🩺 OB-GYN.",
            ceb: "Nag-offer mi ug: 🤰 Prenatal Care, 👶 Normal Delivery, 🏥 C-Section, 🍼 Pediatric Care, 💊 Postpartum Care, 🩺 OB-GYN.",
            ilo: "Mang-offer kami ti: 🤰 Prenatal Care, 👶 Normal Delivery, 🏥 C-Section, 🍼 Pediatric Care, 💊 Postpartum Care, 🩺 OB-GYN."
        },
        contact: {
            en: "📞 Mobile: +63 970 471 6507\n☎️ Landline: +63 (46) 419-0201\n✉️ Email: ersmaternityclinic@gmail.com",
            tl: "📞 Mobile: +63 970 471 6507\n☎️ Landline: +63 (46) 419-0201\n✉️ Email: ersmaternityclinic@gmail.com",
            ceb: "📞 Mobile: +63 970 471 6507\n☎️ Landline: +63 (46) 419-0201\n✉️ Email: ersmaternityclinic@gmail.com",
            ilo: "📞 Mobile: +63 970 471 6507\n☎️ Landline: +63 (46) 419-0201\n✉️ Email: ersmaternityclinic@gmail.com"
        },
        price: {
            en: "We offer affordable packages! For exact pricing, call **+63 970 471 6507**.",
            tl: "Nag-o-offer po kami ng abordable packages! Para sa eksaktong presyo, tawagan po ang **+63 970 471 6507**.",
            ceb: "Nag-offer mi ug abordable nga packages! Para sa eksaktong presyo, tawagi ang **+63 970 471 6507**.",
            ilo: "Mang-offer kami ti abordable packages! Para iti eksakto a presyo, tawagan yo ti **+63 970 471 6507**."
        },
        thanks: {
            en: "You're welcome! 😊 Let me know if you need anything else.",
            tl: "Walang anuman po! 😊 Kung may iba pa po kayong tanong, huwag mag-atubili.",
            ceb: "Wala'y sapul! 😊 Kung naa pa kay pangutana, ayaw pagduhaduha.",
            ilo: "Awan ti sapul! 😊 No adda pay kayo saludsod, diyo panagduadua."
        },
        fallback: {
            en: "I'm not sure about that. 🤔 Please call **+63 970 471 6507** for specific inquiries.",
            tl: "Hindi po ako sigurado. 🤔 Pakitawagan po ang **+63 970 471 6507** para sa mga tiyak na tanong.",
            ceb: "Dili ko sigurado. 🤔 Palihug tawagi ang **+63 970 471 6507** para sa espesipiko nga pangutana.",
            ilo: "Saan akon sigurado. 🤔 Pangngaasi tawagan yo ti **+63 970 471 6507** para iti espesipiko a saludsod."
        }
    };

    quickReplies = {
        en: ["📅 Book Appointment", "🕒 Hours", "📍 Location", "💰 Prices", "🩺 Services"],
        tl: ["📅 Mag-book", "🕒 Oras", "📍 Lokasyon", "💰 Presyo", "🩺 Serbisyo"],
        ceb: ["📅 Mag-book", "🕒 Oras", "📍 Lokasyon", "💰 Presyo", "🩺 Serbisyo"],
        ilo: ["📅 Ag-book", "🕒 Oras", "📍 Lokasyon", "💰 Presyo", "🩺 Serbisyo"]
    };

    addMessage(text, sender) {
        const messages = document.getElementById('chatbotMessages');
        if (!messages) return;
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    showTyping() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.classList.add('active');
    }

    hideTyping() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.classList.remove('active');
    }

    getAIResponse(input) {
        const lower = input.toLowerCase();
        const lang = this.detectLanguage(input);
        
        for (const [category, keywords] of Object.entries(this.knowledgeBase)) {
            const allKeywords = Object.values(keywords).flat();
            if (allKeywords.some(kw => lower.includes(kw))) {
                return { text: this.responses[category][lang], lang };
            }
        }
        
        return { text: this.responses.fallback[lang], lang };
    }

    processUserMessage(text) {
        if (!text || !text.trim()) return;
        
        const input = document.getElementById('chatbotInput');
        this.addMessage(text, 'user');
        input.value = '';
        this.showTyping();
        
        setTimeout(() => {
            this.hideTyping();
            const result = this.getAIResponse(text);
            this.addMessage(result.text, 'bot');
            
            if (!this.hasGreeted || 
                text.toLowerCase().match(/hello|hi|kumusta|maayong|naimbag/)) {
                this.addQuickReplies();
            }
        }, 1000 + Math.random() * 500);
    }

    addQuickReplies() {
        const messages = document.getElementById('chatbotMessages');
        if (!messages) return;
        const div = document.createElement('div');
        div.className = 'quick-replies';
        const lang = this.getLang();
        const replies = this.quickReplies[lang];
        
        replies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = reply;
            btn.onclick = () => {
                div.remove();
                this.processUserMessage(reply);
            };
            div.appendChild(btn);
        });
        
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new MultilingualChatbot();
});
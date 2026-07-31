/* =========================================
   AI PHONE AGENT - Multilingual
   ========================================= */

class AIPhoneAgent {
    constructor() {
        this.isOpen = false;
        this.missedCalls = [];
        this.init();
    }

    init() {
        this.createWidget();
        this.loadMissedCalls();
    }

    createWidget() {
        const container = document.getElementById('aiPhoneWidget');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-phone-widget">
                <div class="ai-phone-window" id="aiPhoneWindow">
                    <div class="ai-phone-header">
                        <h4>📞 AI Phone Assistant</h4>
                        <p>🇬🇧 🇵🇭 EN / TL / CEB / ILO</p>
                    </div>
                    <div class="ai-phone-content">
                        <div class="ai-phone-status">
                            <h5>🤖 AI Agent Status</h5>
                            <p>Speaks 4 Philippine languages</p>
                            <p style="color: #4CD964;">● Online 24/7</p>
                        </div>
                        <div class="ai-phone-features">
                            <div class="ai-phone-feature" onclick="alert('AI can answer calls in English, Tagalog, Bisaya, and Ilocano!')">
                                <div class="ai-phone-feature-icon">📞</div>
                                <h6>Answer Calls</h6>
                                <p>4 languages</p>
                            </div>
                            <div class="ai-phone-feature" onclick="alert('AI takes voicemails and categorizes them by urgency')">
                                <div class="ai-phone-feature-icon">🎙️</div>
                                <h6>Voicemail</h6>
                                <p>Smart categorization</p>
                            </div>
                            <div class="ai-phone-feature" onclick="window.location.href='appointment.html'">
                                <div class="ai-phone-feature-icon">📅</div>
                                <h6>Book Online</h6>
                                <p>Schedule via phone</p>
                            </div>
                            <div class="ai-phone-feature" onclick="alert('AI answers FAQs in your preferred language')">
                                <div class="ai-phone-feature-icon">❓</div>
                                <h6>FAQs</h6>
                                <p>Hours, prices, etc.</p>
                            </div>
                        </div>
                        <div class="callback-form" id="callbackForm">
                            <h5>📲 Request Callback</h5>
                            <p style="color: #7F8C8D; font-size: 0.9rem; margin-bottom: 1rem;">
                                Missed our call? We'll call you back!
                            </p>
                            <input type="tel" id="callbackPhone" placeholder="Phone number (09XX-XXX-XXXX)" required>
                            <select id="callbackReason">
                                <option value="general">General Inquiry</option>
                                <option value="appointment">Appointment Booking</option>
                                <option value="prenatal">Prenatal Checkup</option>
                                <option value="delivery">Delivery Inquiry</option>
                                <option value="emergency">Emergency Concern</option>
                            </select>
                            <select id="callbackTime">
                                <option value="asap">ASAP</option>
                                <option value="1hour">Within 1 hour</option>
                                <option value="24hours">Within 24 hours</option>
                            </select>
                            <select id="callbackLanguage">
                                <option value="en">🇬🇧 English</option>
                                <option value="tl">🇵🇭 Tagalog</option>
                                <option value="ceb">🇵🇭 Bisaya</option>
                                <option value="ilo">🇵🇭 Ilocano</option>
                            </select>
                            <button onclick="window.phoneAgent.requestCallback()">📞 Request Callback</button>
                            <div class="callback-success" id="callbackSuccess" style="display:none;">
                                ✓ Callback scheduled! We'll call you in your preferred language.
                            </div>
                        </div>
                        <div class="missed-calls-log">
                            <h5>📋 Recent Missed Calls</h5>
                            <div id="missedCallsList"></div>
                        </div>
                    </div>
                </div>
                <button class="ai-phone-toggle" id="aiPhoneToggle">
                    <svg class="icon-open" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                    <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        `;

        this.injectStyles();
        this.attachEvents();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-phone-widget { position: fixed; bottom: 110px; right: 30px; z-index: 9998; font-family: 'Poppins', sans-serif; }
            .ai-phone-toggle { width: 65px; height: 65px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); display: flex; align-items: center; justify-content: center; transition: all 0.3s; position: relative; }
            .ai-phone-toggle:hover { transform: scale(1.1); }
            .ai-phone-toggle svg { width: 30px; height: 30px; fill: white; }
            .ai-phone-toggle.active svg.icon-open { display: none; }
            .ai-phone-toggle:not(.active) svg.icon-close { display: none; }
            .ai-phone-window { position: absolute; bottom: 80px; right: 0; width: 400px; height: 620px; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; overflow: hidden; opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.95); transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            .ai-phone-window.active { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
            .ai-phone-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; text-align: center; }
            .ai-phone-header h4 { font-size: 1.3rem; margin-bottom: 0.3rem; }
            .ai-phone-header p { font-size: 0.9rem; opacity: 0.9; }
            .ai-phone-content { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.2rem; }
            .ai-phone-status { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 1.2rem; border-radius: 15px; text-align: center; }
            .ai-phone-status h5 { color: #2C3E50; margin-bottom: 0.5rem; }
            .ai-phone-status p { color: #7F8C8D; font-size: 0.9rem; }
            .ai-phone-features { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
            .ai-phone-feature { background: #FFF5F7; padding: 1.2rem; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s; }
            .ai-phone-feature:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
            .ai-phone-feature-icon { font-size: 2rem; margin-bottom: 0.5rem; }
            .ai-phone-feature h6 { color: #2C3E50; font-size: 0.9rem; margin-bottom: 0.3rem; }
            .ai-phone-feature p { color: #7F8C8D; font-size: 0.75rem; }
            .callback-form { background: white; padding: 1.2rem; border-radius: 15px; border: 2px solid #e0e0e0; }
            .callback-form h5 { color: #2C3E50; margin-bottom: 0.8rem; }
            .callback-form input, .callback-form select { width: 100%; padding: 0.8rem; border: 2px solid #e0e0e0; border-radius: 10px; margin-bottom: 0.8rem; font-family: 'Poppins', sans-serif; }
            .callback-form button { width: 100%; padding: 0.9rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; }
            .callback-success { background: #4CD964; color: white; padding: 1rem; border-radius: 10px; text-align: center; margin-top: 1rem; }
            .missed-calls-log { background: white; padding: 1.2rem; border-radius: 15px; border: 2px solid #e0e0e0; }
            .missed-calls-log h5 { color: #2C3E50; margin-bottom: 1rem; }
            .missed-call-item { background: #FFF5F7; padding: 1rem; border-radius: 10px; margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center; }
            .missed-call-info h6 { color: #2C3E50; font-size: 0.9rem; margin-bottom: 0.2rem; }
            .missed-call-info p { color: #7F8C8D; font-size: 0.8rem; }
            .missed-call-action { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; cursor: pointer; }
            @media (max-width: 480px) { .ai-phone-window { width: calc(100vw - 40px); height: 70vh; right: -10px; } }
        `;
        document.head.appendChild(style);
    }

    attachEvents() {
        setTimeout(() => {
            const toggle = document.getElementById('aiPhoneToggle');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    this.isOpen = !this.isOpen;
                    document.getElementById('aiPhoneWindow').classList.toggle('active', this.isOpen);
                    toggle.classList.toggle('active', this.isOpen);
                });
            }
        }, 100);
    }

    loadMissedCalls() {
        // Demo missed calls data
        this.missedCalls = [
            { phone: '0917-XXX-1234', time: 'Today, 2:30 PM', message: '"Magkano prenatal?"', lang: 'tl' },
            { phone: '0920-XXX-5678', time: 'Yesterday, 4:15 PM', message: '"Pila ang checkup?"', lang: 'ceb' },
            { phone: '0915-XXX-9012', time: 'Yesterday, 11:00 AM', message: '"Mano ti prenatal?"', lang: 'ilo' }
        ];
        this.renderMissedCalls();
    }

    renderMissedCalls() {
        const list = document.getElementById('missedCallsList');
        if (!list) return;
        
        const langFlags = { en: '🇬🇧', tl: '🇵🇭 TL', ceb: '🇵🇭 CB', ilo: '🇵🇭 IL' };
        
        list.innerHTML = this.missedCalls.map(call => `
            <div class="missed-call-item">
                <div class="missed-call-info">
                    <h6>${call.phone} ${langFlags[call.lang]}</h6>
                    <p>${call.time} - ${call.message}</p>
                </div>
                <button class="missed-call-action" onclick="window.phoneAgent.followUp('${call.phone}')">Follow Up</button>
            </div>
        `).join('');
    }

    async requestCallback() {
        const phone = document.getElementById('callbackPhone').value;
        const reason = document.getElementById('callbackReason').value;
        const time = document.getElementById('callbackTime').value;
        const language = document.getElementById('callbackLanguage').value;

        if (!phone) {
            alert('Please enter your phone number');
            return;
        }

        // In production, this would call your backend API
        try {
            // Example: await fetch('/api/callbacks', { method: 'POST', body: JSON.stringify({ phone, reason, time, language }) });
            console.log('Callback requested:', { phone, reason, time, language });
            
            document.getElementById('callbackSuccess').style.display = 'block';
            setTimeout(() => {
                document.getElementById('callbackSuccess').style.display = 'none';
                document.getElementById('callbackPhone').value = '';
            }, 5000);
        } catch (error) {
            console.error('Callback request failed:', error);
        }
    }

    followUp(phone) {
        alert(`Initiating follow-up call to ${phone}...\n\nIn production, the AI will call this number and speak in the detected language.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.phoneAgent = new AIPhoneAgent();
});

/* =========================================
   BACKEND INTEGRATION
   Real API calls for production
   ========================================= */

class BackendAPI {
    constructor() {
        this.baseUrl = API_CONFIG.BACKEND_URL;
    }

    // Chatbot AI
    async sendChatMessage(message, context = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    context,
                    apiKey: API_CONFIG.OPENAI_API_KEY,
                    model: API_CONFIG.OPENAI_MODEL
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Chat API error:', error);
            return { reply: 'Sorry, I encountered an error. Please call us at +63 970 471 6507.' };
        }
    }

    // Phone callback
    async requestCallback(data) {
        try {
            const response = await fetch(`${this.baseUrl}/callbacks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    vapiKey: API_CONFIG.VAPI_API_KEY,
                    agentId: API_CONFIG.VAPI_AGENT_ID
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Callback API error:', error);
            throw error;
        }
    }

    // Book appointment
    async bookAppointment(data) {
        try {
            const response = await fetch(`${this.baseUrl}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Appointment API error:', error);
            throw error;
        }
    }

    // Contact form
    async sendContactForm(data) {
        try {
            const response = await fetch(`${this.baseUrl}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Contact form API error:', error);
            throw error;
        }
    }

    // Patient portal login
    async patientLogin(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login API error:', error);
            throw error;
        }
    }

    // Get patient records
    async getPatientRecords(token) {
        try {
            const response = await fetch(`${this.baseUrl}/patient/records`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Records API error:', error);
            throw error;
        }
    }
}

window.backendAPI = new BackendAPI();
/* =========================================
   API CONFIGURATION
   Add your API keys here
   ========================================= */

const API_CONFIG = {
    // OpenAI for chatbot
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY_HERE',
    OPENAI_MODEL: 'gpt-4o-mini',
    
    // Voice AI for phone agent
    VAPI_API_KEY: 'YOUR_VAPI_API_KEY_HERE',
    VAPI_AGENT_ID: 'YOUR_VAPI_AGENT_ID_HERE',
    
    // Twilio for SMS/Phone
    TWILIO_ACCOUNT_SID: 'YOUR_TWILIO_SID_HERE',
    TWILIO_AUTH_TOKEN: 'YOUR_TWILIO_TOKEN_HERE',
    TWILIO_PHONE_NUMBER: '+1234567890',
    
    // Email service
    EMAILJS_SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
    EMAILJS_TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATE_ID',
    EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
    
    // Backend API
    BACKEND_URL: 'https://your-backend.com/api',
    
    // Google Maps
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    
    // Firebase (for patient portal)
    FIREBASE_API_KEY: 'YOUR_FIREBASE_API_KEY',
    FIREBASE_AUTH_DOMAIN: 'your-app.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'your-project-id'
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
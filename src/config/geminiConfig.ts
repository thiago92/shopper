export const geminiConfig = {
    apiKey: process.env.GEMINI_API_KEY || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

if (!geminiConfig.apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente!');
}
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateResponse = async (prompt, fileData = null) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let parts = [{ text: prompt }];
        if (fileData) {
            parts = [
                {
                    inlineData: {
                        mimeType: fileData.mimeType,
                        data: fileData.data
                    }
                },
                { text: prompt }
            ];
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        throw error;
    }
};

exports.generateDialogue = async (topic, context) => {
    // Specialized prompt for dialogue generation
    const prompt = `
    Create a realistic, engaging audio dialogue script between a Teacher and a Student about the following topic.
    The goal is to explain the concept clearly.
    
    Topic: ${topic}
    Context: ${context ? context.substring(0, 5000) : 'General knowledge'}
    
    Format the output as a JSON array of objects, where each object has "speaker" ("Teacher" or "Student") and "text".
    Example:
    [
        {"speaker": "Student", "text": "Professor, I'm struggling to understand supply and demand."},
        {"speaker": "Teacher", "text": "Think of it like a seesaw..."}
    ]
    
    Return ONLY valid JSON.
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating dialogue:", error);
        throw error;
    }
};

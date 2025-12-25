const fs = require('fs');
const pdf = require('pdf-parse');

exports.extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        console.log(`PDF Service: Read file, buffer size: ${dataBuffer.length}`);
        const data = await pdf(dataBuffer);
        console.log(`PDF Service: Extracted text length: ${data.text ? data.text.length : 0}`);
        return data.text;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        throw error;
    }
};

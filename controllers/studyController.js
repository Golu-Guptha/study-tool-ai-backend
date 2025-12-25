const StudySession = require('../models/StudySession');
const pdfService = require('../services/pdfService');
const videoService = require('../services/videoService');
const aiService = require('../services/aiService');
const fs = require('fs');

exports.uploadPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        console.log('PDF Uploaded:', filePath);

        // Skip extraction, store metadata for Vision API usage
        const session = new StudySession({
            type: 'pdf',
            source: filePath,
            content: "PDF Content (Handled by AI Vision)",
            title: req.file.originalname
        });

        await session.save();

        res.json({ message: "PDF processed successfully", sessionId: session._id, contentSnippet: "Ready for analysis." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing PDF", error: error.message });
    }
};

exports.processVideo = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: "No URL provided" });
        }

        const videoId = videoService.extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ message: "Invalid YouTube URL" });
        }

        let content = "";
        let type = 'video';
        let sourcePath = url; // Default to URL

        try {
            content = await videoService.getVideoTranscript(videoId);
            if (!content || content.trim().length === 0) {
                throw new Error("Empty transcript");
            }
        } catch (error) {
            console.log("Transcript failed, falling back to audio download...");
            // Fallback: Download Audio
            try {
                const audioResult = await videoService.downloadAudio(url, videoId);
                type = 'audio';
                sourcePath = audioResult.filePath;
                // Store mimeType in content momentarily or handle schema update? 
                // Actually, schema 'content' is text. The 'source' is the path. 
                // We'll trust the AI Service to detect mimeType from extension later in chat().
                content = "Audio Content (Handled by AI Listening)";
            } catch (downloadErr) {
                return res.status(400).json({ message: "No captions found and failed to download audio for analysis." });
            }
        }

        const session = new StudySession({
            type: type,
            source: sourcePath,
            content: content,
            title: `YouTube Video ${videoId}`
        });

        await session.save();

        res.json({ message: "Video processed successfully", sessionId: session._id, contentSnippet: content.substring(0, 200) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing video", error: error.message });
    }
};

exports.chat = async (req, res) => {
    try {
        const { sessionId, question } = req.body;
        if (!sessionId || !question) {
            return res.status(400).json({ message: "Missing sessionId or question" });
        }

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        let answer;
        if (session.type === 'pdf') {
            // Read PDF file and send to AI
            const fileData = fs.readFileSync(session.source);
            const base64Data = fileData.toString('base64');
            const filePart = { mimeType: 'application/pdf', data: base64Data };

            const prompt = `Answer the user's question based on the provided PDF document.\nQuestion: ${question}`;
            answer = await aiService.generateResponse(prompt, filePart);

        } else if (session.type === 'audio') {
            // Read Audio file and send to AI
            const fileData = fs.readFileSync(session.source);
            const base64Data = fileData.toString('base64');

            // Detect Mime Type based on extension
            const ext = session.source.split('.').pop().toLowerCase();
            const mimeType = ext === 'm4a' ? 'audio/mp4' : (ext === 'mp3' ? 'audio/mp3' : 'audio/webm');

            const filePart = { mimeType: mimeType, data: base64Data };

            const prompt = `Listen to this audio clip and answer the user's question.\nQuestion: ${question}`;
            answer = await aiService.generateResponse(prompt, filePart);

        } else {
            // Text based context (Video with Transcript)
            const context = session.content.substring(0, 30000);
            const prompt = `
            Context information is below.
            ---------------------
            ${context}
            ---------------------
            Given the context information and not prior knowledge, answer the query.
            Query: ${question}
            Answer:
            `;
            answer = await aiService.generateResponse(prompt);
        }

        res.json({ answer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating chat response", error: error.message });
    }
};

exports.generateDialogue = async (req, res) => {
    try {
        const { sessionId, topic } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: "Missing sessionId" });
        }

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const context = session.content;
        // If topic is not provided, AI can generate a general summary dialogue
        const discussionTopic = topic || "Key concepts from the material";

        const dialogue = await aiService.generateDialogue(discussionTopic, context);
        res.json({ dialogue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating dialogue", error: error.message });
    }
};

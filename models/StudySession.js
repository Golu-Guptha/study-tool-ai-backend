const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['pdf', 'video', 'audio'],
        required: true
    },
    source: {
        type: String, // file path or youtube url
        required: true
    },
    content: {
        type: String, // extracted text
        required: true
    },
    title: {
        type: String,
        default: 'Untitled Session'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StudySession', studySessionSchema);

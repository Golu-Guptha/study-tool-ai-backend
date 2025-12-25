const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studyController = require('../controllers/studyController');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.post('/upload-pdf', upload.single('pdf'), studyController.uploadPdf);
router.post('/process-video', studyController.processVideo);
router.post('/chat', studyController.chat);
router.post('/generate-dialogue', studyController.generateDialogue);

module.exports = router;

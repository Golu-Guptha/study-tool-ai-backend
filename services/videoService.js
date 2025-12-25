const { YoutubeTranscript } = require('youtube-transcript');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

exports.getVideoTranscript = async (videoId) => {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        console.error("Error fetching video transcript:", error);
        throw new Error("Could not fetch transcript");
    }
};

exports.downloadAudio = (url, videoId) => {
    return new Promise((resolve, reject) => {
        try {
            const outputDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const fileName = `${videoId}.webm`;
            const filePath = path.join(outputDir, fileName);

            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                console.log("Audio already downloaded:", filePath);
                return resolve(filePath);
            }

            console.log("Downloading audio manually via yt-dlp for:", videoId);

            // Path to the binary installed by youtube-dl-exec
            const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
            const ytDlpPath = path.join(__dirname, '../node_modules/youtube-dl-exec/bin', binaryName);

            if (!fs.existsSync(ytDlpPath)) {
                return reject(new Error(`yt-dlp binary not found at ${ytDlpPath}`));
            }

            const args = [
                url,
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                '--referer', 'https://www.youtube.com/',
                '-f', 'bestaudio[ext=webm]',
                '--output', filePath,
                '--no-check-certificates',
                '--no-warnings',
                '--prefer-free-formats'
            ];

            execFile(ytDlpPath, args, (error, stdout, stderr) => {
                if (error) {
                    console.error("yt-dlp exec error:", error);
                    return reject(error);
                }
                console.log("yt-dlp output:", stdout);

                // Verify existence
                if (fs.existsSync(filePath)) {
                    resolve(filePath);
                } else {
                    resolve(filePath);
                }
            });

        } catch (error) {
            reject(error);
        }
    });
};

exports.extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

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

            // Check for existing files (webm or m4a)
            const possibleExtensions = ['webm', 'm4a', 'mp3'];
            for (const ext of possibleExtensions) {
                const checkPath = path.join(outputDir, `${videoId}.${ext}`);
                if (fs.existsSync(checkPath) && fs.statSync(checkPath).size > 0) {
                    console.log("Audio already downloaded:", checkPath);
                    return resolve({
                        filePath: checkPath,
                        mimeType: ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`
                    });
                }
            }

            console.log("Downloading audio manually via yt-dlp for:", videoId);

            // Path to the binary installed by youtube-dl-exec
            const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
            const ytDlpPath = path.join(__dirname, '../node_modules/youtube-dl-exec/bin', binaryName);

            if (!fs.existsSync(ytDlpPath)) {
                return reject(new Error(`yt-dlp binary not found at ${ytDlpPath}`));
            }

            // Handle Cookies
            const cookiesContent = process.env.YOUTUBE_COOKIES;
            let cookiesPath = null;
            if (cookiesContent) {
                cookiesPath = path.join(__dirname, '../cookies.txt');
                fs.writeFileSync(cookiesPath, cookiesContent);
            }

            // Use template for output to let yt-dlp determine extension
            const outputTemplate = path.join(outputDir, `${videoId}.%(ext)s`);

            const args = [
                url,
                '--force-ipv4',
                '--sleep-interval', '2',
                '-f', 'bestaudio/best', // Relaxed format
                '--output', outputTemplate,
                '--no-check-certificates',
                '--no-warnings',
                '--prefer-free-formats'
            ];

            if (cookiesPath) {
                args.push('--cookies', cookiesPath);
            }

            execFile(ytDlpPath, args, (error, stdout, stderr) => {
                if (error) {
                    console.error("yt-dlp exec error:", error);
                    return reject(error);
                }
                console.log("yt-dlp output:", stdout);

                // Find the downloaded file
                const files = fs.readdirSync(outputDir);
                const downloadedFile = files.find(file => file.startsWith(videoId));

                if (downloadedFile) {
                    const finalPath = path.join(outputDir, downloadedFile);
                    const ext = path.extname(downloadedFile).substring(1); // remove dot
                    resolve({
                        filePath: finalPath,
                        mimeType: ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`
                    });
                } else {
                    reject(new Error("File not found after download"));
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

// downloader.js
const { exec } = require('child_process');
const path = require('path');

function taiVideoTikTok(url) {
    return new Promise((resolve, reject) => {
        // Đường dẫn lưu vào thư mục uploads
        // %(title)s giúp lấy tên video làm tên file
        const outputPath = path.join(__dirname, 'uploads', '%(title)s.%(ext)s');

        // Lệnh gọi yt-dlp (đã cài trong Termux)
        const command = `yt-dlp -o "${outputPath}" "${url}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

// Xuất module để file khác có thể dùng
module.exports = { taiVideoTikTok };
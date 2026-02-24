const { exec } = require('child_process');
const path = require('path');

function taiVideoTikTok(url) {
    return new Promise((resolve, reject) => {
        // 1. Lấy thời gian hiện tại
        const now = new Date();
        const ngay = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const gio = `${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
        const prefix = `day ${ngay} at ${gio}`;

        // 2. Lệnh lấy tiêu đề video trước (lọc bỏ ký tự lạ)
        // Chúng ta bảo yt-dlp: "Cho tôi cái tên video sạch (không emoji/hashtag)"
        const getTitleCmd = `yt-dlp --get-filename -o "%(title)s" "${url}"`;

        exec(getTitleCmd, (tErr, tOut) => {
            // Lọc tên: Bỏ dấu tiếng Việt, bỏ ký tự đặc biệt, chỉ giữ chữ và số
            let cleanTitle = tOut.trim()
                .replace(/[^\w\s]/gi, '') // Xóa sạch emoji, hashtag, ký tự lạ
                .substring(0, 50);        // Giới hạn độ dài cho đỡ dài dòng

            // 3. Kết hợp lại theo ý bạn: day... at... [tên sạch].mp4
            const finalName = `${prefix} ${cleanTitle}.mp4`;
            const outputPath = path.join(__dirname, 'uploads', finalName);

            // 4. Tiến hành tải
            const downloadCommand = `yt-dlp -o "${outputPath}" "${url}"`;

            exec(downloadCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    });
}

module.exports = { taiVideoTikTok };
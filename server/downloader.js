const { exec } = require('child_process');
const path = require('path');

function taiVideoTikTok(url) {
    return new Promise((resolve, reject) => {
        // 1. Lấy thời gian hiện tại (Oppo A71)
        const now = new Date();
        const ngay = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const gio = `${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
        const prefix = `day ${ngay} at ${gio}`;

        // 2. Lấy tên video từ yt-dlp
        const getTitleCmd = `yt-dlp --get-filename -o "%(title)s" "${url}"`;

        exec(getTitleCmd, (tErr, tOut) => {
            let originalTitle = tOut ? tOut.trim() : "TikTok_Video";

            // 3. XỬ LÝ TÊN THEO YÊU CẦU:
            // - Cắt bỏ tất cả ký tự sau dấu #
            // - Loại bỏ ký tự đặc biệt để tránh lỗi file
            let cleanTitle = originalTitle.split('#')[0].trim(); 
            cleanTitle = cleanTitle.replace(/[^\w\s\u00C0-\u1EF9]/gi, ''); // Giữ lại chữ tiếng Việt và số

            // 4. Ghép đúng định dạng: day ... at ... [tên]
            const finalName = `${prefix} ${cleanTitle}.mp4`;
            const outputPath = path.join(__dirname, 'uploads', finalName);

            // 5. Thực hiện tải với tên file đã định dạng
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
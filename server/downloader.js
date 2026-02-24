// downloader.js
const { exec } = require('child_process');
const path = require('path');

/**
 * Ghi chú các khái niệm lạ:
 * - [Regex]: Cách dùng các ký hiệu đặc biệt để tìm và xóa chữ (ví dụ: /#.*$/ là xóa từ dấu # đến hết).
 * - [stdout]: Kết quả mà lệnh hệ thống trả về sau khi chạy xong.
 */

function taiVideoTikTok(url) {
    return new Promise((resolve, reject) => {
        
        const GIOI_HAN_MB = 50; 
        const thuMucLuu = path.join(__dirname, 'uploads');

        // BƯỚC 1: HỎI THÔNG TIN FILE (Dung lượng và Tiêu đề)
        // [API lạ]: --print giúp ta lấy chính xác thông tin cần mà không cần tải file
        const checkInfoCmd = `yt-dlp --print "%(filesize)s|%(title)s" "${url}"`;

        exec(checkInfoCmd, (error, stdout) => {
            if (error) return reject("❌ Không lấy được thông tin video");

            // Tách dung lượng và tiêu đề bằng dấu gạch đứng |
            const [sizeStr, rawTitle] = stdout.trim().split('|');
            const sizeInBytes = parseInt(sizeStr);

            // KIỂM TRA CÂN NẶNG
            if (sizeInBytes && sizeInBytes > GIOI_HAN_MB * 1024 * 1024) {
                return reject(`❌ Video quá nặng (${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB)`);
            }

            // BƯỚC 2: PHẪU THUẬT TÊN FILE (Xóa từ ký tự lạ đầu tiên)
            // Ta dùng Regex để tìm các ký tự: #, @, hoặc các ký tự lạ
            // [Nghĩa]: .split(/[#@]/)[0] nghĩa là: "Gặp dấu # hoặc @ thì lấy phần bên trái thôi"
            let cleanTitle = rawTitle.split(/[#@]/)[0].trim();

            // Nếu sau khi cắt mà tên bị trống, ta dùng tên mặc định
            if (!cleanTitle) cleanTitle = "video_tiktok";

            // Tạo tiền tố thời gian (prefix)
            const now = new Date();
            const prefix = `day ${now.getDate()}-${now.getMonth() + 1} at ${now.getHours()}_${now.getMinutes()}`;

            // BƯỚC 3: TẢI THỰC TẾ
            const fileName = `${prefix} [${cleanTitle}].mp4`;
            const outputPath = path.join(thuMucLuu, fileName);
            
            const downloadCmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o "${outputPath}" "${url}"`;

            exec(downloadCmd, (dlError) => {
                if (dlError) return reject("❌ Lỗi khi đang tải");
                resolve(`✅ Đã tải xong: ${fileName}`);
            });
        });
    });
}

module.exports = { taiVideoTikTok };
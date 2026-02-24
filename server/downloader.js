const { exec } = require('child_process');
const path = require('path');

function taiVideoTikTok(url) {
    return new Promise((resolve, reject) => {
        // 1. Lấy thời gian (Oppo A71)
        const now = new Date();
        const ngay = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
        const gio = `${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
        const prefix = `day ${ngay} at ${gio}`;

        // 2. Lấy tiêu đề gốc
        const getTitleCmd = `yt-dlp --get-filename -o "%(title)s" "${url}"`;

        exec(getTitleCmd, (tErr, tOut) => {
            let title = tOut ? tOut.trim() : "";

            // 3. BỘ LỌC TRIỆT ĐỂ:
            // - Cắt bỏ từ dấu #
            // - Loại bỏ các thẻ @User
            // - CHỈ GIỮ LẠI: Chữ cái (A-Z), Số (0-9), và Tiếng Việt có dấu
            let cleanName = title
                .split('#')[0] 
                .replace(/@\w+/g, '') 
                // Regex dưới đây giữ lại chữ cái, số và các dải ký tự tiếng Việt
                .replace(/[^a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, '')
                .replace(/\s+/g, ' ') // Gom nhiều khoảng trắng thành 1
                .trim();

            // 4. Ghép tên: Nếu có tên thì ghép vào, không thì chỉ lấy day at
            let finalName = cleanName ? `${prefix} ${cleanName}.mp4` : `${prefix}.mp4`;
            
            const outputPath = path.join(__dirname, 'uploads', finalName);

            // 5. Lệnh tải
            const downloadCommand = `yt-dlp -o "${outputPath}" "${url}"`;

            exec(downloadCommand, (error, stdout, stderr) => {
                if (error) { reject(error); return; }
                resolve(stdout);
            });
        });
    });
}

module.exports = { taiVideoTikTok };
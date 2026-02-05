const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const FFMPEG = 'ffmpeg';
const FFPROBE = 'ffprobe';

// Biến để báo trạng thái đang xử lý (để maychu.js checkArranging hoạt động)
let isArranging = false;

function isFormatted(filePath) {
  try {
    const result = spawnSync(
      FFPROBE,
      [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name',
        '-of', 'default=nokey=1:noprint_wrappers=1',
        filePath
      ],
      { encoding: 'utf8' }
    );
    if (result.error) return false;
    const codec = result.stdout.trim();
    return codec === 'h264';
  } catch (e) {
    return false;
  }
}

function chuyenDinhDangVideo(input, output) {
  return new Promise((resolve, reject) => {
    const ff = spawn(FFMPEG, [
      '-y',
      '-i', input,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      output
    ]);
    ff.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error('FFmpeg convert failed'));
    });
  });
}

async function arrangeFile(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) return;
  if (path.extname(oldPath).toLowerCase() === '.mp4') {
    const formatted = isFormatted(oldPath);
    if (!formatted) {
      const tempPath = newPath + '.tmp.mp4';
      await chuyenDinhDangVideo(oldPath, tempPath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      fs.renameSync(tempPath, newPath);
      return;
    }
  }
  fs.renameSync(oldPath, newPath);
}

// =====================
// HÀM MỚI: XỬ LÝ TẤT CẢ FILE TRONG THƯ MỤC UPLOADS
// =====================
async function xuLyTatCaFile() {
  if (isArranging) return;
  isArranging = true;
  module.exports.arranging = true; // Cập nhật export

  try {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) return;

    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      // Nếu là mp4 thì chạy kiểm tra/convert tại chỗ
      if (path.extname(file).toLowerCase() === '.mp4') {
        if (!isFormatted(filePath)) {
          const tempPath = filePath + '.fixed.mp4';
          await chuyenDinhDangVideo(filePath, tempPath);
          fs.unlinkSync(filePath);
          fs.renameSync(tempPath, filePath);
        }
      }
    }
  } catch (error) {
    console.error("Lỗi khi sắp xếp file:", error);
  } finally {
    isArranging = false;
    module.exports.arranging = false;
  }
}

// Export nhiều thứ cùng lúc
module.exports = {
  arrangeFile,
  xuLyTatCaFile,
  arranging: false
};
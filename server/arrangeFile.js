const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

// DÙNG FFMPEG HỆ THỐNG (TERMUX OK)
const FFMPEG = 'ffmpeg';
const FFPROBE = 'ffprobe';

// =====================
// KIỂM TRA ĐỊNH DẠNG VIDEO
// =====================
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

// =====================
// CHUYỂN ĐỊNH DẠNG VIDEO
// =====================
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

    ff.stderr.on('data', () => {});

    ff.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error('FFmpeg convert failed'));
    });
  });
}

// =====================
// SẮP XẾP FILE UPLOAD
// =====================
async function arrangeFile(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) return;

  // Nếu là video mp4 → kiểm tra định dạng
  if (path.extname(oldPath).toLowerCase() === '.mp4') {
    const formatted = isFormatted(oldPath);

    if (!formatted) {
      const tempPath = newPath + '.tmp.mp4';
      await chuyenDinhDangVideo(oldPath, tempPath);
      fs.unlinkSync(oldPath);
      fs.renameSync(tempPath, newPath);
      return;
    }
  }

  fs.renameSync(oldPath, newPath);
}

module.exports = arrangeFile;

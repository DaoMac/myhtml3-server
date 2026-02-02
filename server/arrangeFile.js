// ==================== IMPORT ====================
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

// ==================== BIẾN TOÀN CỤC ====================
let arranging = false;
let queue = [];
let isProcessing = false;

// ==================== KIỂM TRA VIDEO ĐÃ CHUẨN HAY CHƯA ====================
function isFormatted(videoPath) {
  try {
    // 🔹 Lấy codec video
    const vResult = spawnSync(ffprobePath, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath
    ], { encoding: "utf8" });

    // 🔹 Lấy codec âm thanh
    const aResult = spawnSync(ffprobePath, [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=codec_name",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath
    ], { encoding: "utf8" });

    const vCodec = vResult.stdout.trim();
    const aCodec = aResult.stdout.trim();

    // ✅ Nếu video không có track âm thanh thì coi như hợp lệ luôn
    if (vCodec === "h264" && (aCodec === "aac" || aCodec === "")) return true;
    return false;
  } catch (err) {
    console.error("⚠️ Lỗi khi kiểm tra định dạng:", err.message);
    return false;
  }
}

// ==================== HÀM CHÍNH ====================
async function xuLyTatCaFile() {
  if (arranging) {
    console.log("⚠️ Đang định dạng video khác, chờ hoàn tất...");
    return;
  }

  arranging = true;
  console.log("🧩 Bắt đầu sắp xếp & định dạng lại video...");

  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) {
    console.log("❌ Thư mục uploads không tồn tại!");
    arranging = false;
    return;
  }

  // ==================== 1️⃣ Xóa file trùng ====================
  const allFiles = fs.readdirSync(uploadDir);
  const fileMap = new Map();

  for (const f of allFiles) {
    const base = f.replace(/^day \d+-\d+-\d+ at \d+_\d+_\d+ /, "");
    if (!fileMap.has(base)) fileMap.set(base, []);
    fileMap.get(base).push(f);
  }

  for (const [base, versions] of fileMap.entries()) {
    if (versions.length > 1) {
      const sorted = versions.sort((a, b) => {
        const timeA = fs.statSync(path.join(uploadDir, a)).mtimeMs;
        const timeB = fs.statSync(path.join(uploadDir, b)).mtimeMs;
        return timeB - timeA;
      });
      for (let i = 1; i < sorted.length; i++) {
        const duplicatePath = path.join(uploadDir, sorted[i]);
        fs.unlinkSync(duplicatePath);
        console.log("🗑️ Xóa file trùng:", sorted[i]);
      }
    }
  }

  // ==================== 2️⃣ Thêm file cần xử lý vào hàng đợi ====================
  const mp4Files = fs.readdirSync(uploadDir).filter(f => f.toLowerCase().endsWith(".mp4"));
  queue.push(...mp4Files.map(f => path.join(uploadDir, f)));

  // Bắt đầu xử lý hàng đợi
  await processQueue();

  arranging = false;
  console.log("🎯 HOÀN TẤT: Đã xử lý toàn bộ file.");
}

// ==================== 3️⃣ HÀNG ĐỢI XỬ LÝ VIDEO ====================
async function processQueue() {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const videoPath = queue.shift();

  await chuyenDinhDangVideo(videoPath);
  isProcessing = false;

  if (queue.length > 0) {
    await processQueue();
  }
}

// ==================== 4️⃣ CHUYỂN ĐỊNH DẠNG VIDEO ====================
async function chuyenDinhDangVideo(videoPath) {
  const dir = path.dirname(videoPath);
  const name = path.basename(videoPath);
  const fixed = path.join(dir, name.replace(".mp4", "_fixed.mp4"));

  // ⏩ Kiểm tra nếu đã chuẩn thì bỏ qua
  if (isFormatted(videoPath)) {
    console.log(`⏩ Bỏ qua ${name} (đã chuẩn H.264 + AAC)`);
    return;
  }

  console.log(`🎞️ Đang chuyển định dạng video: ${name}`);

  return new Promise((resolve) => {
    const ff = spawn(ffmpegPath, [
      "-i", videoPath,
      "-vcodec", "libx264",
      "-acodec", "aac",
      "-movflags", "+faststart",
      "-preset", "ultrafast",
      "-threads", "1",
      "-y", fixed
    ]);

    ff.on("close", (code) => {
      if (code === 0 && fs.existsSync(fixed)) {
        try {
          fs.renameSync(fixed, videoPath);
          console.log(`✅ Đã chuẩn hóa video: ${name} (H.264 + AAC)`);
        } catch (err) {
          console.error(`⚠️ Lỗi khi đổi tên file ${name}:`, err.message);
        }
      } else {
        console.error(`⚠️ Lỗi khi chuyển video ${name}`);
      }
      resolve();
    });
  });
}

// ==================== EXPORT ====================
module.exports = {
  xuLyTatCaFile,
  get arranging() {
    return arranging;
  }
};
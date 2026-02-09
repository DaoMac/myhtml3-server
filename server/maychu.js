'use strict';

// ==================== 1. KHAI BÁO THƯ VIỆN ====================
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sapxepFiles = require('./arrangeFile');
const portGuard = require('./portGuard');
const unidecode = require('unidecode'); 
const session = require('express-session');

// ==================== 2. KIỂM TRA THƯ VIỆN FILE-TYPE ====================
let FileType;
try {
  FileType = require('file-type');
} catch {
  console.error('❌ Cần cài: npm i file-type@16');
  process.exit(1);
}

// ==================== 3. CÁC HÀM HỖ TRỢ (HELPER FUNCTIONS) ====================
async function validateFileByContent(filePath, ext) {
  const ft = await FileType.fromFile(filePath);
  if (!ft) return false;
  const detectedExt = '.' + ft.ext;
  const base = ft.mime.split('/')[0];
  if (detectedExt === ext) return true;
  if (ext === '.mp4' && base === 'video') return true;
  if (ext === '.mp3' && base === 'audio') return true;
  return false;
}

function tenFileAnToan(ten) {
  let cleanName = unidecode(ten);
  cleanName = cleanName.replace(/\s+/g, '-');
  return cleanName.replace(/[\\\/:*?"<>|]/g, '_');
}

function ngayGioVN(date) {
  date = new Date(date);
  return `day ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} at ${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
}

// ==================== 4. CẤU HÌNH SERVER & TÀI KHOẢN ====================
const app = express();
const PORT1 = 3000;

const TAI_KHOAN_ADMIN = {
  user: 'MinhHieu@luucim.com',
  pass: '@07022026'
};

const allowedExts = [
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
  '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.csv'
];

const quarantineDir = path.join(__dirname, 'quarantine');
const finalUploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(quarantineDir)) fs.mkdirSync(quarantineDir, { recursive: true });
if (!fs.existsSync(finalUploadDir)) fs.mkdirSync(finalUploadDir, { recursive: true });

// ==================== 5. MIDDLEWARE BẢO VỆ & TIỆN ÍCH ====================

// Hàm kiểm tra trạng thái sắp xếp file (để chặn upload khi server bận)
function checkArranging(req, res, next) {
  if (sapxepFiles.arranging) {
    return res.status(503).send('Server đang sắp xếp file, vui lòng chờ');
  }
  next();
}

// Hàm kiểm soát băng thông
const bandwidthControl = {
  limits: { upload: 4 * 1024 * 1024, download: 4 * 1024 * 1024 },
  perIP: {}
};

function bandwidthMiddleware(req, res, next) {
  // Sửa lỗi gạch chéo: dùng req.socket thay vì req.connection
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  
  if (!bandwidthControl.perIP[clientIP]) {
    bandwidthControl.perIP[clientIP] = {
      uploadedThisWindow: 0,
      downloadedThisWindow: 0,
      lastResetTime: Date.now()
    };
  }

  const tracking = bandwidthControl.perIP[clientIP];
  const now = Date.now();
  if (now - tracking.lastResetTime > 1000) {
    tracking.uploadedThisWindow = 0;
    tracking.downloadedThisWindow = 0;
    tracking.lastResetTime = now;
  }
  req.bandwidthTracking = tracking;
  res.bandwidthTracking = tracking;
  next();
}

// Hàm bắt buộc đăng nhập
function yeuCauDangNhap(req, res, next) {
  if (req.session.daDangNhap) {
    return next();
  }
  res.redirect('/dangnhap');
}

// Cấu hình Multer Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, quarantineDir),
  filename: (req, file, cb) => {
    const correctName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${ngayGioVN(Date.now())} ${tenFileAnToan(correctName)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) cb(null, true);
    else cb(new Error('❌ File không hợp lệ'), false);
  }
});

// ==================== 6. APPLY CÁC MIDDLEWARE TOÀN CỤC ====================
// (Phần này chạy trước tất cả mọi thứ)
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(portGuard);             // Chống DDoS / Flood
app.use(bandwidthMiddleware);   // Kiểm soát tốc độ mạng

app.use(session({
  secret: 'hieu-beo',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ==================== 7. KHU VỰC CÔNG KHAI (KHÔNG CẦN ĐĂNG NHẬP) ====================
// Quan trọng: Phải đặt ở đây để không bị vòng lặp redirect

// 1. Cho phép tải file CSS/JS của trang login
app.use(express.static(path.join(__dirname, '..', 'clientlogin')));

// 2. Route hiển thị trang đăng nhập
app.get('/dangnhap', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'clientlogin', 'dangnhap.html'));
});

// 3. Route xử lý đăng nhập
app.post('/xuly-dangnhap', (req, res) => {
  const { username, password } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'Unknown';

  if (password.length === 9 && username === TAI_KHOAN_ADMIN.user && password === TAI_KHOAN_ADMIN.pass) {
    req.session.daDangNhap = true;
    req.session.username = username;
    req.session.loginTime = new Date();
    req.session.clientIP = clientIP;
    console.log(`✅ ${username} đăng nhập từ ${clientIP}`);
    return res.json({ success: true });
  } else {
    return res.json({ success: false, msg: 'Sai tài khoản hoặc mật khẩu!' });
  }
});

// ==================== 8. KHU VỰC BẢO VỆ (CẦN ĐĂNG NHẬP) ====================
// Từ dòng này trở đi, mọi thứ đều phải có session đăng nhập

// Bảo vệ thư mục client chính (chứa app nghe nhạc)
app.use(yeuCauDangNhap, express.static(path.join(__dirname, '..', 'client')));

// Bảo vệ thư mục Uploads/Video
app.use('/videoshort', yeuCauDangNhap, checkArranging, express.static(finalUploadDir)); 

// Trang chủ (Sau khi đăng nhập sẽ vào đây)
app.get('/', yeuCauDangNhap, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'GETinteractive.html'));
});

app.get('/dangxuat', (req, res) => {
  const username = req.session.username || 'Người dùng';
  console.log(`🔓 ${username} đăng xuất`);
  req.session.destroy();
  res.redirect('/dangnhap');
});

app.get('/get-user-info', yeuCauDangNhap, (req, res) => {
  res.json({
    success: true,
    username: req.session.username || 'Người dùng',
    loginTime: req.session.loginTime
  });
});

app.get('/get-client-ip', yeuCauDangNhap, (req, res) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'Unknown';
  res.json({ ip: clientIP });
});

app.get('/get-storage-usage', yeuCauDangNhap, (req, res) => {
  try {
    const files = fs.readdirSync(finalUploadDir);
    let totalSize = 0;
    files.forEach(file => {
      totalSize += fs.statSync(path.join(finalUploadDir, file)).size;
    });
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    res.json({ success: true, usage: `${sizeInMB} MB / 5000 MB`, sizeInBytes: totalSize });
  } catch (err) {
    res.json({ success: false, usage: '0 MB', error: err.message });
  }
});

// ==================== 9. CÁC TÍNH NĂNG CHÍNH (UPLOAD/DOWNLOAD/DATA) ====================

// Download File
app.get('/download/:filename', yeuCauDangNhap, checkArranging, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(finalUploadDir, filename);

  if (!fs.existsSync(filePath)) return res.status(404).send('File không tồn tại');

  const fileStats = fs.statSync(filePath);
  const fileSize = fileStats.size;
  const maxBytesPerSecond = 4 * 1024 * 1024; // 4 MB/s
  const estimatedTime = Math.ceil(fileSize / maxBytesPerSecond);
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('X-Download-Time', `${estimatedTime}s`);
  
  const fileStream = fs.createReadStream(filePath);
  let sentBytes = 0;
  let startTime = Date.now();

  fileStream.on('data', (chunk) => {
    sentBytes += chunk.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const expectedBytes = maxBytesPerSecond * elapsed;
    if (sentBytes > expectedBytes * 1.1) {
      fileStream.pause();
      setTimeout(() => fileStream.resume(), (sentBytes / maxBytesPerSecond - elapsed) * 1000);
    }
  });

  fileStream.pipe(res);
  res.on('error', (err) => console.error(`❌ Lỗi tải file ${filename}:`, err));
});

// Upload File
app.post('/guifile', yeuCauDangNhap, checkArranging, (req, res) => {
  let IsNewMP4orMP3 = false;
  upload.array('myfile', 3)(req, res, async err => {
    if (err) return res.status(400).send(err.message);
    if (!req.files || req.files.length === 0) return res.status(400).send('Không có file');

    const saved = [], invalid = [];
    for (const f of req.files) {
      const ext = path.extname(f.originalname).toLowerCase();
      const ok = await validateFileByContent(f.path, ext);
      if (!ok) {
        if(fs.existsSync(f.path)) fs.unlinkSync(f.path); // Xóa file rác trong quarantine
        invalid.push(f.originalname);
        continue;
      }
      fs.renameSync(f.path, path.join(finalUploadDir, f.filename)); // Di chuyển file
      saved.push(f.filename);
      if (ext === '.mp4' || ext === '.mp3') IsNewMP4orMP3 = true;
    }

    if (IsNewMP4orMP3 && !sapxepFiles.arranging) sapxepFiles.xuLyTatCaFile().catch(console.error);
    res.send({ saved, invalid });
  });
});

// ESP Data
let duLieuJsonESP = {};
let trangThaiESPJson = 'offline';
app.post('/esp_sending', yeuCauDangNhap, checkArranging, (req, res) => {
  const { nhietdo, doam } = req.body;
  if (nhietdo == null || doam == null) return res.status(400).json({ error: 'Dữ liệu sai' });
  duLieuJsonESP = { nhietDo: Number(nhietdo), doAm: Number(doam) };
  trangThaiESPJson = 'online';
  res.json({ status: 'ok' });
});

app.get('/dataesp', (req, res) => {
  res.json({ trangthai: trangThaiESPJson, duLieu: duLieuJsonESP, thoigian: new Date().toLocaleTimeString() });
});

// Lấy danh sách Video/Nhạc
app.get('/layvideoshort', yeuCauDangNhap, checkArranging, (req, res) => {
  const files = fs.readdirSync(finalUploadDir)
    .filter(f => f.endsWith('.mp4'))
    .map(f => `/videoshort/${encodeURIComponent(f)}`);
  res.json({ nguonMP4: files });
});

app.get('/songlist', yeuCauDangNhap, checkArranging, (req, res) => {
  const MP3DIR = path.join(__dirname, '..', 'client', 'clientdata', 'ListMP3');
  const files = fs.readdirSync(MP3DIR)
    .filter(f => f.endsWith('.mp3'))
    .map(f => `/clientdata/ListMP3/${encodeURIComponent(f)}`);
  res.json({ nguonMP3: files });
});

// Tìm file
app.get('/timfile', yeuCauDangNhap, checkArranging, (req, res) => {
  const ext = req.query.ext.toLowerCase();
  const files = fs.readdirSync(finalUploadDir)
    .filter(f => f.toLowerCase().endsWith(ext))
    .map(f => `/download/${encodeURIComponent(f)}`);
  
  if (files.length === 0) return res.status(404).json({ error: 'Không tìm thấy file nào' });
  res.json(files);
});

// ==================== 10. SERVER START & CLEANUP ====================
// Dọn dẹp định kỳ 30 phút
setInterval(async () => {
  if (!sapxepFiles.arranging) {
    console.log('--- [Scheduled] Dọn dẹp file trùng lặp ---');
    try { await sapxepFiles.donDepTrungLap(); } catch (err) { console.error(err); }
  }
}, 30 * 60 * 1000);

// Khởi động
const server = app.listen(PORT1, '0.0.0.0', () => {
  console.log('✅ Server chạy tại http://0.0.0.0:3000');
  sapxepFiles.donDepTrungLap().catch(console.error);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;
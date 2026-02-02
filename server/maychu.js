'use strict';

// ==================== IMPORTS ====================
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sapxepFiles = require('./arrangeFile');
const portGuard = require('./portGuard');

const app = express();
const PORT1 = 3000;

// ==================== CẤU HÌNH UPLOAD ====================
const allowedExts = [
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
  '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.csv'
];

// ==================== STORAGE ====================
const quarantineDir = path.join(__dirname, 'quarantine');
const finalUploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(quarantineDir)) fs.mkdirSync(quarantineDir, { recursive: true });
if (!fs.existsSync(finalUploadDir)) fs.mkdirSync(finalUploadDir, { recursive: true });

function tenFileAnToan(ten) {
  return ten.replace(/[\\\/:*?"<>|]/g, '_');
}

function ngayGioVN(date) {
  date = new Date(date);
  return `day ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} at ${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, quarantineDir),
  filename: (req, file, cb) => {
    cb(null, `${ngayGioVN(Date.now())} ${tenFileAnToan(file.originalname)}`);
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

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(portGuard);

function checkArranging(req, res, next) {
  if (sapxepFiles.arranging) {
    return res.status(503).send('Server đang sắp xếp file, vui lòng chờ');
  }
  next();
}

app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/videoshort', checkArranging, express.static(finalUploadDir)); //không cho lấy video short khi đg sắp xếp

// ==================== BIẾN ESP ====================
let duLieuJsonESP = {};
let trangThaiESPJson = 'offline';

// ==================== FILE TYPE ====================
let FileType;
try {
  FileType = require('file-type');
} catch {
  console.error('❌ Cần cài: npm i file-type@16');
  process.exit(1);
}

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

function moveFromQuarantine(name) {
  fs.renameSync(
    path.join(quarantineDir, name),
    path.join(finalUploadDir, name)
  );
}

function removeQuarantine(name) {
  const p = path.join(quarantineDir, name);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'mainpage.html'));
});

// ==================== DOWNLOAD ====================
app.get('/download/:filename', checkArranging, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(finalUploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File không tồn tại');
  }

  // Lúc này portGuard + server đều biết rõ file nào bị lấy
  res.download(filePath);
});

// ==================== UPLOAD ====================
app.post('/guifile', checkArranging, (req, res) => {
  let IsNewMP4orMP3 = false;

  upload.array('myfile', 3)(req, res, async err => {
    if (err) return res.status(400).send(err.message);
    if (!req.files || req.files.length === 0)
      return res.status(400).send('Không có file');

    const saved = [];
    const invalid = [];

    for (const f of req.files) {
      const ext = path.extname(f.originalname).toLowerCase();
      const ok = await validateFileByContent(f.path, ext);

      if (!ok) {
        removeQuarantine(f.filename);
        invalid.push(f.originalname);
        continue;
      }

      moveFromQuarantine(f.filename);
      saved.push(f.filename);
      if (ext === '.mp4' || ext === '.mp3') IsNewMP4orMP3 = true;
    }

    if (IsNewMP4orMP3 && !sapxepFiles.arranging) {
      sapxepFiles.xuLyTatCaFile().catch(console.error);
    }

    res.send({
      saved,
      invalid
    });
  });
});

// ==================== ESP ====================
app.post('/esp_sending', (req, res) => {
  const { nhietdo, doam } = req.body;

  if (nhietdo == null || doam == null)
    return res.status(400).json({ error: 'Dữ liệu sai' });

  duLieuJsonESP = {
    nhietDo: Number(nhietdo),
    doAm: Number(doam)
  };
  trangThaiESPJson = 'online';

  res.json({ status: 'ok' });
});

app.get('/dataesp', (req, res) => {
  res.json({
    trangthai: trangThaiESPJson,
    duLieu: duLieuJsonESP,
    thoigian: new Date().toLocaleTimeString()
  });
});

// ==================== VIDEO SHORT và SONGLIST ====================
app.get('/layvideoshort', checkArranging, (req, res) => {
  const files = fs.readdirSync(finalUploadDir)
    .filter(f => f.endsWith('.mp4'))
    .map(f => `/videoshort/${encodeURIComponent(f)}`);

  res.json({ nguonMP4: files });
});

app.get('/songlist', checkArranging, (req, res) => {
  const MP3DIR = path.join(__dirname, '..', 'client', 'clientdata', 'ListMP3');
  const files = fs.readdirSync(MP3DIR)
    .filter(f => f.endsWith('.mp3'))
    .map(f => `/clientdata/ListMP3/${encodeURIComponent(f)}`);

  res.json({ nguonMP3: files });
});
// ==================== TÌM FILE ====================
app.get('/timfile', checkArranging, (req, res) => {
  const ext = req.query.ext.toLowerCase();
  const files = fs.readdirSync(finalUploadDir).filter(f => f.toLowerCase().endsWith(ext)).map(f => `/download/${encodeURIComponent(f)}`);
  if (files.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy file nào' });
  } else {
    res.json(files);
  }
});

// ==================== START ====================
app.listen(PORT1, '0.0.0.0', () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT1}`);
});

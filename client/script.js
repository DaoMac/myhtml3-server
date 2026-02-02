// ============================================================================
// 🎧 CẤU HÌNH & KHỞI TẠO TRÌNH PHÁT NHẠC
// ============================================================================
const audiobox        = document.getElementById('audio-player');
const hopchucnang     = document.getElementById('chucnangUI');
const hopmini         = document.getElementById('miniMode');
const tenbai          = document.getElementById('tenbai-text');
const realtimemp3     = document.getElementById('real-timemp3');
const fulltimemp3     = document.getElementById('full-timemp3');
const thanhtgianmp3   = document.getElementById('thanhtgianmp3');
const tenbaiwidth     = document.getElementById('tenbai');

const nutReplay    = document.getElementById('playBtn1');
const nutRewind    = document.getElementById('playBtn2');
const nutPlaysound = document.getElementById('playBtn3');
const nutForward   = document.getElementById('playBtn4');
const nutShuffle   = document.getElementById('playBtn5');
const shortVideoElement = document.getElementById('short-video');
const videoSource = shortVideoElement.querySelector('source');

// ============================================================================
// ⚙️ TRẠNG THÁI TOÀN CỤC
// ============================================================================
let sound;
let tongthoigian = 0;
let daphatduoc   = 0;
let tronbai      = true;
let laplai       = true;
let minimode     = false;
let songIndex    = 0;
let songList     = [];
let ketthucnhac  = false;
let danhsachShortvideo = [];
let mp4Index     = 0;
let played       = false;
let tuongtacroi = false;
let tuongtaclandau = false;
let touchStartY = 0;
let touchEndY = 0;

// ============================================================================
// 🎵 HÀM: LẤY ĐỘ RỘNG CỦA KHUNG TENBAI ĐỂ BẮT ĐẦU CHỖ CHAY 
// ============================================================================
function layvitrichaychu() {
    const textEl = document.getElementById('tenbai-text');
    const boxEl = document.getElementById('tenbai');

    if (!textEl || !boxEl) return;

    // 1. Xóa animation cũ để trình duyệt đo chính xác
    textEl.style.animation = 'none';
    
    // 2. Lấy scrollWidth (độ rộng thực tế của text bên trong)
    const doRongThuc = textEl.scrollWidth;
    
    // 3. Gán biến CSS
    textEl.style.setProperty('--tenbai-width', `${doRongThuc}px`);
    
    // 4. Tính toán thời gian dựa trên độ dài (vận tốc không đổi)
    const tocDo = doRongThuc / 50; // 50px mỗi giây
    textEl.style.animationDuration = `${Math.max(tocDo, 8)}s`;
    
    // 5. Kích hoạt lại animation
    textEl.style.animation = ''; 
}
// ============================================================================
// 🎵 HÀM: XÓA ÂM THANH CŨ
// ============================================================================
async function clearOldSound() {
  if (sound) {
    try {
      await new Promise(r => setTimeout(r, 100)); // ✅ chờ 100ms cho chắc chắn 
      sound.pause();              // ✅ dừng phát
      sound.src = '';             // ✅ xóa nguồn âm thanh
      sound.load();               // ✅ reset lại trạng thái
    } catch (e) {
      console.warn('⚠️ clearOldSound lỗi:', e);
    }
    sound = null; // ✅ xóa tham chiếu
  }
}

// ============================================================================
// 🎵 HÀM: NẠP BÀI HÁT MỚI
// ============================================================================
async function refreshSong() {
  await clearOldSound();  // ✅ đảm bảo âm thanh cũ tắt hoàn toàn
  sound = new Audio(songList[songIndex]);

  // Trong refreshSong()
  sound.addEventListener('loadedmetadata', () => {
    tongthoigian = sound.duration;
    fulltimemp3.textContent = formatTime(tongthoigian);
    
    const name = decodeURIComponent(songList[songIndex]).split('/').pop().replace('.mp3', '');
    
    // Đảm bảo cập nhật text cho thẻ SPAN
    const textSpan = document.getElementById('tenbai-text');
    textSpan.textContent = name;

    // Đợi trình duyệt render xong rồi mới đo
    setTimeout(layvitrichaychu, 150);
  });

  sound.addEventListener('timeupdate', () => {
    daphatduoc = sound.currentTime;
    realtimemp3.textContent = formatTime(daphatduoc);
    if (tongthoigian > 0)
      thanhtgianmp3.value = (daphatduoc / tongthoigian) * 100;
  });

  sound.addEventListener('ended', () => {
    ketthucnhac = true;
    if (laplai) {
      sound.currentTime = 0;
      capNhatNut(3); // phát lại
    } else if (tronbai) {
      nextSong(true);
    } else {
      nutPlaysound.textContent = '▶️';
    }
  });
}

// ============================================================================
// ⏱️ HÀM PHỤ: CHUYỂN GIÂY ➜ PHÚT:GIÂY
// ============================================================================
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
    : `${m}:${s < 10 ? '0' + s : s}`;
}

// ============================================================================
// ⏭️ HÀM CHUYỂN BÀI
// ============================================================================
async function nextSong(isShuffle) {
  if (isShuffle) {
    let thelastsongIndex = songIndex;
    for (let i = 0; i < 10; i++) {
      if (songIndex == thelastsongIndex)
        songIndex = Math.floor(Math.random() * (songList.length-1));  // đây mới ngẫu nhiên bài hát
      else break;
    }
  } else {
    songIndex++;
    if (songIndex >= songList.length) songIndex = 0; // ✅ tránh tràn
  }
  await refreshSong(); // ✅ thêm await
  capNhatNut(3);
}

async function lastSong() {
  songIndex--;
  if (songIndex < 0) songIndex = songList.length - 1; // ✅ tránh tràn
  await refreshSong(); // ✅ thêm await
  capNhatNut(3);
}

// ============================================================================
// 🎨 HÀM: CẬP NHẬT TRẠNG THÁI NÚT
// ============================================================================
async function capNhatNut(idNut) {
  switch (idNut) {
    case 1:
      laplai = !laplai;
      nutReplay.style.opacity = laplai ? '1' : '0.5';
      nutReplay.style.color = laplai ? 'orange' : 'white';
      if (laplai && tronbai) capNhatNut(5);
      break;

    case 2:
      await lastSong(); // ✅ thêm await
      break;

    case 3:
      if(tuongtacroi) break;
      await shortVideoElement.pause();
      tuongtacroi = true;
      if (sound.paused) {
        nutPlaysound.textContent = '⏸️';
        await sound.play();             // ✅ chờ phát xong promise
      } else {
        nutPlaysound.textContent = '▶️';
        await sound.pause();            // ✅ chờ tạm dừng xong
      }
      tuongtacroi = false;
      break;


    case 4:
      await nextSong(false); // ✅ thêm await
      break;

    case 5:
      tronbai = !tronbai;
      nutShuffle.style.opacity = tronbai ? '1' : '0.5';
      nutShuffle.style.color = tronbai ? 'aqua' : 'white';
      if (laplai && tronbai) capNhatNut(1);
      break;
  }
}

// ============================================================================
// 🎵 HÀM LẤY DANH SÁCH BÀI HÁT / VIDEO SHORT
// ============================================================================
async function layDanhSachBaiHat() {
  try {
    const res = await fetch('/songlist');
    if (!res.ok) throw new Error('❌ Không thể lấy danh sách bài hát!');  // throw Error là hàm tạo lỗi khi có đk 
    const data = await res.json();
    songList = data.nguonMP3;
    return songList;
  } catch (err) {
    console.error('⚠️ Lỗi khi lấy danh sách bài hát:', err);
    return [];
  }
}

async function laysoursevideoshort() {
  try {
    const res = await fetch('/layvideoshort');
    if (!res.ok) throw new Error('Không thể lấy short video!');
    const data = await res.json();
    danhsachShortvideo = data.nguonMP4;
  } catch (err) {
    console.error('⚠️ Lỗi lấy danh sách video short:', err);
  }
}

// ============================================================================
// 🚀 KHỞI ĐỘNG TRÌNH PHÁT NHẠC
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  await layDanhSachBaiHat();

  if (songList.length === 0) {
    console.warn('⚠️ Không có bài hát nào trong server!');
  } else {
    songIndex = Math.floor(Math.random()*(songList.length-1));
    refreshSong();
  }
  await laysoursevideoshort();
  capNhatNut(1);
  capNhatNut(5);

  // Nạp video đầu tiên vào thẻ video
    if (danhsachShortvideo.length > 0) {
        shortVideoElement.src = danhsachShortvideo[songIndex];
        shortVideoElement.load();
    try {
        await shortVideoElement.play();
    } catch (err) {
        console.warn("Tự động phát video bị chặn, chờ tương tác người dùng.");
    }
    }
});

// ============================================================================
// 🎬 SỰ KIỆN GIAO DIỆN
// ============================================================================
audiobox.addEventListener('dblclick', () => {
  audiobox.classList.toggle('mini');
});

nutRewind.addEventListener('click', () => capNhatNut(2));
nutForward.addEventListener('click', () => capNhatNut(4));
nutPlaysound.addEventListener('click', () => {capNhatNut(3)});
nutReplay.addEventListener('click', () => capNhatNut(1));
nutShuffle.addEventListener('click', () => capNhatNut(5));

thanhtgianmp3.addEventListener('input', () => {
  sound.currentTime = (thanhtgianmp3.value / 100) * tongthoigian;
  if (sound.paused) capNhatNut(3); // chống dừng nhạc khi tua
});

// ============================================================================
// 🖱️🎯 KÉO HỘP AUDIO PLAYER (CHUỘT & CẢM ỨNG)
// ============================================================================
let isDragging = false;
let offsetX, offsetY;

// chống lan truyền sự kiện chạm trên thanh tua 
thanhtgianmp3.addEventListener('mousedown', e => e.stopPropagation(), { passive: false });
thanhtgianmp3.addEventListener('touchstart', e => e.stopPropagation(), { passive: false });
thanhtgianmp3.addEventListener('touchmove', e => e.stopPropagation(), { passive: false });
thanhtgianmp3.addEventListener('touchend', e => e.stopPropagation(), { passive: false });

// --- XỬ LÝ CUỘN CHUỘT ---
document.getElementById('container-3').addEventListener('wheel', (e) => {
    if (moigui) return;
    moigui = true;

    if (e.deltaY > 0) {
        playNextShort(1); 
    } else {
        playNextShort(-1); 
    }

    // Chống spam chuyển video quá nhanh
    setTimeout(() => { moigui = false; }, 800);
}, { passive: true });

// --- XỬ LÝ VUỐT MÀN HÌNH (MOBILE) ---
document.getElementById('container-3').addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.getElementById('container-3').addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    handleGesture();
}, { passive: true });

function handleGesture() {
    const swipeDistance = touchStartY - touchEndY;
    if (Math.abs(swipeDistance) > 50) { 
        if (swipeDistance > 0) {
            playNextShort(1);  
        } else {
            playNextShort(-1); 
        }
    }
}

async function playNextShort(direction) {
    if (danhsachShortvideo.length === 0) return;

    // direction: 1 là đi tới, -1 là lùi lại
    mp4Index += direction;

    // Vòng lặp danh sách video khi về cuối và đầu
    if (mp4Index >= danhsachShortvideo.length) mp4Index = 0;
    if (mp4Index < 0) mp4Index = danhsachShortvideo.length - 1;

    // Cập nhật nguồn video
    shortVideoElement.pause();
    shortVideoElement.src = danhsachShortvideo[mp4Index];
    shortVideoElement.play();
    
    try {
        await shortVideoElement.play();
    } catch (err) {
        console.warn("Tự động phát video bị chặn, chờ tương tác người dùng.");
    }
}

console.log('🎶 script điều khiển hộp nhạc đã load xong');

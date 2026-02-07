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
let refreshingsong = false;
let okrefresh = true;
let baimodau = 'clientdata/ListMP3/Through the Silent Frostbound Night 6.0 OST.mp3';
let napbaimodau = false;

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
      await new Promise(r => setTimeout(r, 200)); // ✅ chờ 200ms cho chắc chắn 
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
async function refreshSong(whichsongIndex) {
  refreshingsong = true;
  await clearOldSound();  // ✅ đảm bảo âm thanh cũ tắt hoàn toàn
  sound = new Audio(songList[whichsongIndex]);

  await new Promise((resolve) => {
    sound.addEventListener('loadedmetadata', () => {
      tongthoigian = sound.duration;
      fulltimemp3.textContent = formatTime(tongthoigian);
      const name = decodeURIComponent(songList[whichsongIndex]).split('/').pop().replace('.mp3', '');
      document.getElementById('tenbai-text').textContent = name;
      setTimeout(layvitrichaychu, 150);
      
      resolve(); // Xong rồi mới cho chạy tiếp xuống dưới
    }, { once: true });
    
    // Nếu lỗi tải nhạc cũng phải resolve để không bị treo code
    sound.addEventListener('error', () => resolve(), { once: true });
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
      setTimeout(()=>{
        capNhatNut(3);
      }, 10);      // phát lại
    } else if (tronbai) {
      nextSong(true);
    } else {
      nutPlaysound.textContent = '▶️';
    }
  });

  refreshingsong = false;
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
  await refreshSong(songIndex); // ✅ thêm await
  capNhatNut(3);
}

async function lastSong() {
  songIndex--;
  if (songIndex < 0) songIndex = songList.length - 1; // ✅ tránh tràn
  await refreshSong(songIndex); // ✅ thêm await
  capNhatNut(3);
}

// ============================================================================
// 🎨 HÀM: CẬP NHẬT TRẠNG THÁI NÚT
// ============================================================================
async function capNhatNut(idNut) {
  switch (idNut) {
    case 1:
      laplai = !laplai;
      if (laplai && tronbai) await capNhatNut(5);
      nutReplay.style.opacity = laplai ? '1' : '0.5';
      nutReplay.style.color = laplai ? 'orange' : 'white';
      break;

    case 2:
      if(!okrefresh)break;
      okrefresh = false;  
      await lastSong(); // ✅ thêm await tương tự nguyên lí nút 4
      setTimeout(() => {
          okrefresh=true;
        }, 100);
      break;

    case 3:
      if(tuongtacroi || refreshingsong) break;  
      tuongtacroi = true;
      if(!shortVideoElement.paused)await shortVideoElement.pause();
      if (sound.paused) {
        nutPlaysound.textContent = '⏸️';
        await sound.play();             // ✅ chờ phát xong promise
      } else {
        nutPlaysound.textContent = '▶️';
        await sound.pause();            // ✅ chờ tạm dừng xong
      }
      setTimeout(() => {
        tuongtacroi = false;
      }, 100);
      break;

    case 4:
      if(!okrefresh)break;
      okrefresh = false;
      await nextSong(false); // ✅ thêm await để chờ phát nhạc 
      setTimeout(() => {    // 100ms sau mới cho đổi cái khác
          okrefresh=true;
        }, 100);
      break;

    case 5:
      tronbai = !tronbai;
      if (laplai && tronbai) await capNhatNut(1);
      nutShuffle.style.opacity = tronbai ? '1' : '0.5';
      nutShuffle.style.color = tronbai ? 'aqua' : 'white';
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
document.getElementById('cover-video').addEventListener('wheel', (e)=>e.stopPropagation(),{passive:false}); // chống cuộn quá rộng khi đổi video
document.getElementById('cover-video').addEventListener('wheel', (e) => {
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
document.getElementById('cover-video').addEventListener('touchstart',(e)=>e.stopPropagation(), {passive:false});// chống vuốt lan khi vuốt dổi video
document.getElementById('cover-video').addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.getElementById('cover-video').addEventListener('touchend', (e) => {
    if (moigui) return;
    moigui = true;

    touchEndY = e.changedTouches[0].screenY;
    handleGesture();

    // Chống spam chuyển video quá nhanh
    setTimeout(() => { moigui = false; }, 800);
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

async function napvideoshort(chisobaihat) { //dừng audio(nếu có) và nạp videoshort mới 
  shortVideoElement.pause();
  shortVideoElement.src = danhsachShortvideo[chisobaihat];
  shortVideoElement.load(); 
}

async function playNextShort(direction) {   //dừng audioplayer(nếu đg phát) và tăng/giảm shortvideo
    if (danhsachShortvideo.length === 0) return;

    if(!sound.paused)await capNhatNut(3);
    mp4Index += direction;

    if (mp4Index >= danhsachShortvideo.length) mp4Index = 0;
    if (mp4Index < 0) mp4Index = danhsachShortvideo.length - 1;

    napvideoshort(mp4Index); 

    try {
        await shortVideoElement.play();
    } catch (err) {
        console.warn("Không thể phát video:", err);
    }
}

// ============================================================================
// 🚀 KHỞI ĐỘNG TRÌNH PHÁT NHẠC
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  await layDanhSachBaiHat();
  await laysoursevideoshort();

    sound = new Audio(baimodau);

    sound.addEventListener('loadedmetadata', () => {
      tongthoigian = sound.duration;
      fulltimemp3.textContent = formatTime(tongthoigian);
      const name = decodeURIComponent(baimodau).split('/').pop().replace('.mp3', '');
      document.getElementById('tenbai-text').textContent = name;
      setTimeout(layvitrichaychu, 150);
    }, {once:true});

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
    }
    });

  document.addEventListener('click',async()=>{
    tuongtaclandau = true;
    if(!sound.paused)await capNhatNut(3);
    shortVideoElement.muted = false; // Bật âm thanh cho Video nhưng chưa play
  }, {once:true});

  await capNhatNut(5);

  shortVideoElement.addEventListener('play',async()=>{
    if(!sound.paused)await capNhatNut(3);
  }); 

  // Nạp video đầu tiên vào thẻ video
    if (danhsachShortvideo.length > 0) {
        mp4Index = Math.floor(Math.random()*danhsachShortvideo.length);
        napvideoshort(mp4Index);
        shortVideoElement.muted = true;
    try {
        await shortVideoElement.play();
    } catch (err) {
        console.warn("Tự động phát video bị chặn, chờ tương tác người dùng.");
    }
    }
});

console.log('🎶 script điều khiển hộp nhạc đã load xong');

/* ==========================================================
   1. KHAI BÁO BIẾN (Chỉ giữ lại ID có trong mainpage.html)
   ========================================================== */
// Chức năng Tìm kiếm & Danh sách file
const nutTim       = document.getElementById('nut2');
const inputTim     = document.getElementById('ae2');
const fileListDiv  = document.getElementById('fileList');
const downloadBtn  = document.querySelector('.nutdownload');

// Chức năng hiển thị dữ liệu ESP
const espon        = document.getElementById('espon');
const nhietdo      = document.getElementById('nhietdo');
const doamDiv      = document.getElementById('doam');
const esprealtime  = document.getElementById('thoi-gian-thuc-dang-do');

// Biến trạng thái
let selectedFile   = null; 
let moigui         = false;      // Chống spam request
let cocambienesp   = true;      // Kiểm soát việc gọi API ESP

/* ==========================================================
   2. CÁC HÀM XỬ LÝ CHÍNH
   ========================================================== */

/**
 * Lấy dữ liệu JSON từ ESP8266 thông qua server
 */
async function layData() {
    try {
        const res = await fetch('/dataesp');
        const data = await res.json();

        if (data.trangthai === "online") {
            if (espon) espon.textContent = "ONLINE-🟢";
            cocambienesp = true;

            if (data.duLieu.nhietdo !== undefined && nhietdo) {
                nhietdo.textContent = `TEMP: ${data.duLieu.nhietdo}°C`;
            }
            if (data.duLieu.doam !== undefined && doamDiv) {
                doamDiv.textContent = `HUM: ${data.duLieu.doam}%`;
            }
            if (data.thoigian !== undefined && esprealtime) {
                esprealtime.textContent = `Cập nhật: ${data.thoigian}`; 
            }
        } else {
            if (espon) espon.textContent = "OFFLINE-🔴 • ESP ngắt kết nối";
            cocambienesp = false;
        }
    } catch (err) {
        if (espon) espon.textContent = "OFFLINE-🔴 • SERVER DIE";
        console.error('Lỗi kết nối server:', err);
    }
}

/* ==========================================================
   3. LẮNG NGHE SỰ KIỆN (Event Listeners)
   ========================================================== */

/**
 * Sự kiện Tìm kiếm File
 */
nutTim?.addEventListener('click', async () => {
    if (moigui) return; // Nếu đang trong thời gian chờ thì thoát
    moigui = true;

    const rqExt = inputTim.value.trim().toLowerCase();
    if (!rqExt) {
        alert('Vui lòng nhập đuôi file cần tìm!');
        moigui = false;
        return;
    }

    try {
        const response = await fetch('/timfile?ext=' + encodeURIComponent(rqExt));
        const fileList = await response.json();

        fileListDiv.textContent = ''; // Xóa danh sách cũ
        selectedFile = null;

        fileList.forEach(url => {
            const fileItem = document.createElement('div');
            const filename = decodeURIComponent(url.split('/').pop());

            // Xử lý hiển thị tên file đặc biệt
            fileItem.textContent = filename.startsWith('day') 
                ? filename.split(' ').slice(4).join(' ') 
                : filename;

            fileItem.className = 'file-item';
            fileItem.style.cssText = 'word-wrap: break-word; overflow-wrap: break-word; white-space: normal;box-sizing: border-box; display:block; max-width:95%; cursor: pointer; margin: 20px; border-bottom: 1px solid rgba(225, 219, 219, 0.91); transition: 0.3s;';

            // Sự kiện click chọn file
            fileItem.addEventListener('click', () => {
                Array.from(fileListDiv.children).forEach(c => c.style.backgroundColor = '');
                fileItem.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                selectedFile = url;
            });

            fileListDiv.appendChild(fileItem);
        });
    } catch (err) {
        alert('Lỗi khi tìm file: ' + err);
    }
});

/**
 * Sự kiện Tải về File đã chọn
 */
downloadBtn?.addEventListener('click', () => {
    if (!selectedFile) {
        alert('Vui lòng chọn một file từ danh sách trước!');
        return;
    }

    const link = document.createElement('a');
    link.href = selectedFile;
    link.download = selectedFile.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});


// Tải lên Files
const uploadForm  = document.getElementById('uploadForm');
const fileInput  = document.getElementById('fileInput');
const fileName   = document.getElementById('fileName');
const uploadStat = document.getElementById('uploadStatus');

fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) {
        fileName.textContent = 'Chưa chọn file';
        return;
    }
    fileName.textContent =
        [...fileInput.files].map(f => f.name).join(', ');   // mẫy cái chấm là toán tử spread đẻ lấy từng phần tử trong fileInput và map là thay thế từng ptu textcontent bằng f.name thêm , giữa các ptu
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!fileInput.files.length) {
        uploadStat.textContent = '❌ Chưa chọn file';
        return;
    }

    const fd = new FormData();

    for (const f of fileInput.files) {
        fd.append('myfile', f);
    }

    uploadStat.textContent = '⏳ Đang upload...';

    try {
        const res = await fetch('/guifile', {
            method: 'POST',
            body: fd
        });

        const data = await res.json();

        uploadStat.textContent =
            `✔ Lưu: ${data.saved.length} | ❌ Loại: ${data.invalid.length}`;

    } catch (err) {
        uploadStat.textContent = '❌ Upload lỗi';
        console.error(err);
    }
});


/* ==========================================================
   4. VẬN HÀNH (Initialization)
   ========================================================== */

// Khởi chạy lấy dữ liệu ESP ngay khi load
layData();

// Vòng lặp lấy dữ liệu định kỳ mỗi 65 giây
setInterval(() => {
    if (cocambienesp) layData();
}, 65000);

// Reset trạng thái chống spam mỗi 5 giây
setInterval(() => {
    moigui = false;
}, 5000);

console.log('ScriptB đã được lọc và sẵn sàng.');
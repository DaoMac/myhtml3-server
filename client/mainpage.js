const limenu = document.querySelectorAll('#dieuhuong ul li');
const indicator = document.querySelector('.nav-indicator'); 
let container = []; 

for(let i = 0; i < limenu.length; i++){
    container.push(document.getElementById(`container-${i+1}`));
}

// Hàm để cập nhật vị trí con trượt
function updateIndicator(element) {
    if (!element || !indicator) return;
    // offsetWidth: lấy chiều rộng của thẻ li được bấm
    indicator.style.width = `${element.offsetWidth}px`;
    // offsetLeft: lấy vị trí từ bên trái của thẻ li so với ul (cha)
    indicator.style.left = `${element.offsetLeft}px`;
}

//dòng này để tự set nav-indicator cho trang chủ 
const initialActive = document.querySelector('#dieuhuong ul li.active');
if (initialActive) {
    //lấy left và width của cái li đang active
    setTimeout(() => updateIndicator(initialActive), 100);
}

limenu.forEach((d, i) => {
    d.addEventListener('click', () => {
        // 1. XỬ LÝ NAV VÀ CON TRƯỢT bỏ hết active rồi cho cái đang chọn active
        limenu.forEach(li => li.classList.remove('active'));
        d.classList.add('active');
        
        // lấy độ rộng li và trượt sang
        updateIndicator(d);

        // 2. XỬ LÝ CÁC CONTAINER (HIỆU ỨNG CHUI LÊN)
        container.forEach((t, y) => {
            if (t) {
                if (i !== y) {
                    // Ẩn các container không liên quan
                    t.classList.remove('active-slide');
                    t.style.display = 'none';
                } else {
                    // Hiện container được chọn
                    t.style.display = 'flex'; 
                    
                    // Delay 10ms để trình duyệt kịp nhận diện chuyển đổi display
                    setTimeout(() => {
                        t.classList.add('active-slide');
                    }, 10);
                }
            }
        });
    });
});

const canvas = document.getElementById('canvasnen');
const pen = canvas.getContext('2d');
const petal = new Image();
petal.src = 'clientdata/Listphotos/longchim.png';

function resizeCanvas() {
    // Cập nhật kích thước thực tế của các điểm ảnh trong canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Gọi ngay khi load trang để lấy độ dài các trục
resizeCanvas();

// Lắng nghe sự kiện thay đổi kích thước màn hình
window.addEventListener('resize', resizeCanvas);

function layY() {
            if(Math.random()<0.5){
                return Math.floor(0.8*canvas.height);
            }else{
                return Math.floor(0.2*canvas.height);
            }
        } // Vị trí ngẫu nhiên theo chiều dọc
function bezierY(y0, y1, y2, t) {
    const q0 = y0 + (y1 - y0) * t;  //lấy q0 trên đoạn từ gốc đến y1
    const q1 = y1 + (y2 - y1) * t;  //lấy q1 trên đoạn y1 tới y2
    return q0 + (q1 - q0) * t;  // xuất phát từ (1-t)q0+tq1
    //đoạn này là " từ điểm ban đầu q0 nhích từ 0-100% hiệu khoảng cách 2 điểm q0 và q1 là bản chất đg bezier"
}
function ve(gocxoay, p1, p2, p3){
    pen.save();
    pen.translate(p1, p2);  // di chuyển tới x y 
    pen.rotate(gocxoay);
    pen.drawImage(petal, -p3/2, -p3/2, p3, p3);
    pen.restore();
}

const limitHeight = 350; 
const sizeMin = 15;      
const sizeMax = 55;      

function createPetal() {
    const side = Math.random() < 0.5 ? 'top' : 'bottom';
    
    // Xuất phát từ góc trái (trên hoặc dưới)
    const startY = side === 'top' 
        ? Math.random() * limitHeight 
        : canvas.height - Math.random() * limitHeight;

    // KHÔNG TỤM GIỮA: Cho y2 bay thoáng ra ở phía bên phải
    // Luồng trên bay ở nửa trên, luồng dưới bay ở nửa dưới
    const endY = side === 'top' 
        ? Math.random() * (canvas.height * 0.4) 
        : canvas.height - (Math.random() * (canvas.height * 0.4));

    // NÉ CỘT: Điểm uốn y1 đẩy ra xa tâm màn hình hoa sẽ bay lên trc rồi bay xuống 
    let y1 = side === 'top' ? -10 : canvas.height + 10;

    return {
        side: side,
        // PHÁ VỠ NỐI ĐUÔI: Khởi tạo x ở các vị trí âm khác nhau để xuất hiện rải rác
        x: -(Math.random() * canvas.width), 
        y0: startY,
        y1: y1, 
        y2: endY, 
        t: 0,
        // Tốc độ chậm kiểu gió thoảng
        speedT: Math.random() * 0.0006 + 0.0004, 
        size: sizeMin,
        w: Math.random() * Math.PI * 2,
        speedW: (Math.random() - 0.5) * 0.02    //lấy từ -0.5 tới 0.5
    };
}

// Khởi tạo mảng ban đầu
let petals = [];
for (let i = 0; i < 50; i++) {
    petals.push(createPetal());
    // Cho t chạy ngẫu nhiên để hoa không bay cùng lúc lúc mới load trang
    petals[i].t = Math.random(); 
}

function animate() {
    pen.clearRect(0, 0, canvas.width, canvas.height);

    petals.forEach(p => {
        p.t += p.speedT;

        // --- TÍNH KÍCH THƯỚC: TO DẦN RỒI NHỎ DẦN ---
        if (p.t < 0.5) {
            // Nửa đầu hành trình (0 -> 0.5)    từ 0.2 lên 0.8
            let tiLe = p.t * 2; 
            p.size = sizeMin + (sizeMax - sizeMin) * tiLe;
        } 
        else {
            // Nửa sau hành trình (0.5 -> 1)    từ 0.8 về 0.2
            let tiLe = 1 - ((p.t - 0.5) * 2);
            p.size = sizeMin + (sizeMax - sizeMin) * tiLe;
        }

        // --- TÍNH VỊ TRÍ ---
        // Để không nối đuôi, X xuất phát từ vị trí âm riêng biệt của mỗi hoa
        // Khi t tăng, hoa sẽ trôi dần sang phải
        p.x += (p.speedT * canvas.width * 2.1); 
        
        // Quỹ đạo né cột (Bezier) < chỉ có 1 đường bezier trong cả hành trình từ t=0(đầu trang) tới t=1(cuối trang)>
        p.y = bezierY(p.y0, p.y1, p.y2, p.t);

        // --- VẼ ---
        p.w += p.speedW;
        ve(p.w, p.x, p.y, p.size);

        // Reset khi hoa đã bay khuất màn hình bên phải (p.x > canvas.width)
        // hoặc hành trình t kết thúc
        if (p.t > 1 || p.x > canvas.width) {
            const fresh = createPetal();
            // Khi reset, cho x nằm xa lề trái để chờ đến lượt bay vào
            fresh.x = -Math.random() * 200 - 50; // từ sấp sỉ -200 tới -50
            Object.assign(p, fresh);    // đưa các dữ liệu(hay copy) obj fresh sang nơi p trỏ tới( hiện tại là obj petals)
        }
    });

    requestAnimationFrame(animate);
}

animate();



function containermacdinh(limacdinh, chisovitri){
    limacdinh.classList.add('active');  //thêm active cho li đc chọn
    updateIndicator(limacdinh);     // di chuyển nav-indicator đến đó

    container[chisovitri].style.display = 'flex';
    container[chisovitri].classList.add('active-slide');
}
containermacdinh(limenu[2], 2);
// ==================== PROFILE MANAGEMENT ====================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Lấy thông tin người dùng
        const response = await fetch('/get-user-info');
        const userData = await response.json();

        if (userData.success) {
            // Cập nhật tên người dùng
            const usernameElement = document.getElementById('profileUsername');
            if (usernameElement && userData.username) {
                usernameElement.textContent = userData.username.toUpperCase();
            }

            // Cập nhật thời gian đăng nhập
            const loginTimeElement = document.getElementById('profileLoginTime');
            if (loginTimeElement && userData.loginTime) {
                const time = new Date(userData.loginTime).toLocaleTimeString('vi-VN');
                loginTimeElement.textContent = `Đăng nhập lúc: ${time}`;
            }
        }
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
    }

    // Lấy thông tin thiết bị
    const deviceInfo = getDeviceInfo();
    const deviceElement = document.getElementById('deviceInfo');
    if (deviceElement) {
        deviceElement.textContent = deviceInfo;
    }

    // Lấy IP từ server
    try {
        const ipResponse = await fetch('/get-client-ip');
        const ipData = await ipResponse.json();
        const ipElement = document.getElementById('ipAddress');
        if (ipElement && ipData.ip) {
            ipElement.textContent = ipData.ip;
        }
    } catch (error) {
        console.error('Lỗi lấy IP:', error);
    }

    // Lấy dung lượng storage
    try {
        const storageResponse = await fetch('/get-storage-usage');
        const storageData = await storageResponse.json();
        const storageElement = document.getElementById('storageUsage');
        if (storageElement && storageData.usage) {
            storageElement.textContent = storageData.usage;
        }
    } catch (error) {
        console.error('Lỗi lấy dung lượng:', error);
    }
});

// ==================== HÀM HELPER ====================
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'Máy Tính';
    let osName = 'Unknown';

    // Kiểm tra loại thiết bị
    if (/mobile|android/i.test(ua)) {
        deviceType = 'Điện Thoại';
        if (/android/i.test(ua)) osName = 'Android';
        else if (/iphone|ipad/i.test(ua)) osName = 'iOS';
    } else if (/tablet|ipad/i.test(ua)) {
        deviceType = 'Máy Tính Bảng';
    }

    // Kiểm tra hệ điều hành chi tiết
    if (/windows/i.test(ua)) osName = 'Windows';
    else if (/mac/i.test(ua)) osName = 'macOS';
    else if (/linux/i.test(ua)) osName = 'Linux';

    return `${deviceType} (${osName})`;
}

// ==================== LOGOUT HANDLER ====================
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.logout-btn-profile');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Xác nhận trước khi đăng xuất
            if (confirm('⚠️ Bạn chắc chắn muốn đăng xuất?')) {
                window.location.href = '/dangxuat';
            }
        });
    }
});

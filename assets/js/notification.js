/**
 * Notification Component - Sistem Notifikasi In-App
 * Komponen untuk menampilkan lonceng notifikasi dengan dropdown panel
 */

const NOTIFICATION_POLL_INTERVAL = 60000; // 60 detik
let notificationPollTimer = null;
let notificationDropdownOpen = false;

/**
 * Initialize notification component
 * @param {string} containerId - ID container untuk render komponen
 */
function initNotification(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Notification container not found:', containerId);
        return;
    }

    // Render initial bell component
    renderNotificationBell(container);

    // Start polling for unread count
    checkUnreadCount();
    notificationPollTimer = setInterval(checkUnreadCount, NOTIFICATION_POLL_INTERVAL);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notification-dropdown');
        const bell = document.getElementById('notification-bell');
        if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
            closeNotificationDropdown();
        }
    });
}

/**
 * Cleanup notification polling
 */
function destroyNotification() {
    if (notificationPollTimer) {
        clearInterval(notificationPollTimer);
        notificationPollTimer = null;
    }
}

/**
 * Render notification bell icon with badge
 */
function renderNotificationBell(container) {
    container.innerHTML = `
        <button id="notification-bell" onclick="toggleNotificationDropdown()" 
                class="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 border border-transparent hover:border-orange-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
                </path>
            </svg>
            <span id="notification-badge" 
                  class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                0
            </span>
        </button>
        <div id="notification-dropdown" 
             class="hidden absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
        </div>
    `;
}

/**
 * Toggle notification dropdown
 */
function toggleNotificationDropdown() {
    if (notificationDropdownOpen) {
        closeNotificationDropdown();
    } else {
        openNotificationDropdown();
    }
}

/**
 * Open notification dropdown and fetch notifications
 */
async function openNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    notificationDropdownOpen = true;
    dropdown.classList.remove('hidden');

    // Show loading state
    dropdown.innerHTML = `
        <div class="p-6 text-center">
            <div class="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p class="text-gray-500 text-sm mt-2">Memuat notifikasi...</p>
        </div>
    `;

    try {
        const notifications = await fetchNotifications();
        renderNotificationDropdown(dropdown, notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        dropdown.innerHTML = `
            <div class="p-6 text-center">
                <p class="text-red-500 text-sm">Gagal memuat notifikasi</p>
            </div>
        `;
    }
}

/**
 * Close notification dropdown
 */
function closeNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    notificationDropdownOpen = false;
}

/**
 * Fetch unread count from API
 */
async function checkUnreadCount() {
    try {
        const data = await apiCall('/notifikasi/count');
        updateBadge(data.count || 0);
    } catch (error) {
        console.error('Error checking unread count:', error);
    }
}

/**
 * Update badge count
 */
function updateBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }
}

/**
 * Fetch notifications list from API
 */
async function fetchNotifications() {
    return await apiCall('/notifikasi/me');
}

/**
 * Render notification dropdown content
 */
function renderNotificationDropdown(container, notifications) {
    const hasUnread = notifications && notifications.some(n => n.status === 'TERKIRIM');

    let html = `
        <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
            <h3 class="font-semibold text-gray-900">Notifikasi</h3>
            ${hasUnread ? `
                <button onclick="markAllAsRead()" 
                        class="text-xs text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-100 px-2 py-1 rounded-lg transition">
                    Tandai Semua Dibaca
                </button>
            ` : ''}
        </div>
    `;

    if (!notifications || notifications.length === 0) {
        html += `
            <div class="p-8 text-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
                        </path>
                    </svg>
                </div>
                <p class="text-gray-500 text-sm">Tidak ada notifikasi</p>
            </div>
        `;
    } else {
        html += `<div class="max-h-80 overflow-y-auto">`;
        
        notifications.slice(0, 10).forEach(notif => {
            const isUnread = notif.status === 'TERKIRIM';
            const bgClass = isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50';
            const icon = getNotificationIcon(notif.jenis_notifikasi);
            const timeAgo = getRelativeTime(notif.created_at);

            html += `
                <div class="p-4 border-b border-gray-50 ${bgClass} cursor-pointer transition-colors"
                     onclick="handleNotificationClick('${notif.kode_notifikasi}', '${notif.kode_peminjaman || ''}', ${isUnread})">
                    <div class="flex gap-3">
                        <div class="flex-shrink-0 w-10 h-10 rounded-full ${icon.bgColor} flex items-center justify-center">
                            ${icon.svg}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-800 ${isUnread ? 'font-medium' : ''}">${notif.pesan}</p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-gray-500">${timeAgo}</span>
                                ${isUnread ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    html += `
        <div class="p-3 border-t border-gray-100 bg-gray-50 text-center">
            <button onclick="closeNotificationDropdown()" 
                    class="text-xs text-gray-500 hover:text-gray-700 font-medium">
                Tutup
            </button>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(jenis) {
    const icons = {
        'PENGAJUAN_DIBUAT': {
            bgColor: 'bg-yellow-100 text-yellow-600',
            svg: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
        },
        'STATUS_APPROVED': {
            bgColor: 'bg-green-100 text-green-600',
            svg: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        },
        'STATUS_REJECTED': {
            bgColor: 'bg-red-100 text-red-600',
            svg: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
        },
        'INFO_KEGIATAN': {
            bgColor: 'bg-blue-100 text-blue-600',
            svg: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        },
        'KEHADIRAN_DIVERIFIKASI': {
            bgColor: 'bg-purple-100 text-purple-600',
            svg: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>'
        }
    };

    return icons[jenis] || {
        bgColor: 'bg-gray-100 text-gray-600',
        svg: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>'
    };
}

/**
 * Get relative time string
 */
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay < 7) return `${diffDay} hari lalu`;

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Handle notification click
 */
async function handleNotificationClick(kodeNotifikasi, kodePeminjaman, isUnread) {
    // Mark as read if unread
    if (isUnread) {
        try {
            await apiCall(`/notifikasi/${kodeNotifikasi}/dibaca`, { method: 'PATCH' });
            checkUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Close dropdown
    closeNotificationDropdown();

    // Redirect based on user role and notification type
    const user = getCurrentUser();
    if (kodePeminjaman) {
        if (user && user.role === 'SARPRAS') {
            window.location.href = `verifikasi-peminjaman.html?id=${kodePeminjaman}`;
        } else if (user && user.role === 'SECURITY') {
            window.location.href = `dashboard-security.html`;
        } else {
            window.location.href = `riwayat-peminjaman.html`;
        }
    }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead() {
    try {
        await apiCall('/notifikasi/dibaca-semua', { method: 'PATCH' });
        checkUnreadCount();
        openNotificationDropdown(); // Refresh dropdown
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

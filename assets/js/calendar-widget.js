// --- STATE VARIABLES ---
let currentDate = new Date();
let allSchedules = [];

// --- DOM ELEMENTS ---
// Note: Requires these IDs to be present in the HTML
const calendarGrid = document.getElementById('calendar-grid');
const monthYearLabel = document.getElementById('month-year-label');
const jadwalContainer = document.getElementById('jadwal-list-container');
const selectedDateLabel = document.getElementById('selected-date-label');

// --- HELPERS ---
const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
};

// --- LOGIC: JADWAL & KALENDER ---

const fetchSchedules = async () => {
    try {
        // Uses apiCall global from api.legacy.js
        const data = await apiCall('/jadwal-ruangan');
        allSchedules = data;

        renderCalendar();

        // Show today's schedule by default
        const today = new Date();
        showScheduleForDate(today.getDate(), today.getMonth(), today.getFullYear());
    } catch (error) {
        console.error('Gagal ambil data jadwal:', error);
        if (jadwalContainer) {
            jadwalContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
            <div class="bg-red-50 p-4 rounded-full mb-3">
                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <p class="text-red-600 font-semibold text-sm">Gagal terhubung ke server</p>
            <p class="text-gray-400 text-xs mt-1">Silakan coba muat ulang halaman.</p>
        </div>
        `;
        }
    }
};

const renderCalendar = () => {
    if (!calendarGrid || !monthYearLabel) return;

    calendarGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const todayDate = new Date();

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    monthYearLabel.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        calendarGrid.innerHTML += '<div></div>';
    }

    for (let i = 1; i <= lastDay; i++) {
        const dateKey = formatDateKey(year, month, i);
        const hasEvent = allSchedules.some((s) => s.tanggal_mulai && s.tanggal_mulai.startsWith(dateKey));
        const isToday = i === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();

        const dayEl = document.createElement('div');
        dayEl.className = `relative h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer transition-all duration-200 ${isToday ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-100' : 'text-gray-700 hover:bg-orange-50'}`;

        dayEl.onclick = () => showScheduleForDate(i, month, year);

        dayEl.innerHTML = `<span class="text-sm font-medium">${i}</span>${hasEvent ? `<span class="absolute bottom-1 h-1.5 w-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-red-500'}"></span>` : ''}`;

        calendarGrid.appendChild(dayEl);
    }
};

const showScheduleForDate = (day, month, year) => {
    if (!jadwalContainer) return;

    const dateKey = formatDateKey(year, month, day);
    const dateObj = new Date(year, month, day);
    if (selectedDateLabel) {
        selectedDateLabel.innerText = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Filter: Show APPROVED and PENDING, exclude REJECTED
    const dailySchedules = allSchedules.filter((s) =>
        s.tanggal_mulai &&
        s.tanggal_mulai.startsWith(dateKey) &&
        s.status !== 'REJECTED' &&
        s.status !== 'CANCELLED'
    ).sort((a, b) => {
        // Sort Priority: APPROVED first, then PENDING
        if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
        if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
        return 0;
    });

    // --- UPDATE TAMPILAN KOSONG (EMPTY STATE) ---
    if (dailySchedules.length === 0) {
        jadwalContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
         <div class="bg-orange-50 p-4 rounded-full mb-4 border border-orange-100">
            <svg class="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
         </div>
         <h4 class="text-gray-900 font-semibold text-base mb-1">Tidak Ada Jadwal</h4>
         <p class="text-gray-500 text-sm max-w-[200px]">Belum ada kegiatan yang terdaftar untuk tanggal ini.</p>
      </div>`;
        return;
    }

    // Render Cards - Detailed Block Style (matching sarpras.html pending cards)
    jadwalContainer.innerHTML = dailySchedules
        .map((j) => {
            const jamMulai = formatTime(j.tanggal_mulai);
            const jamSelesai = formatTime(j.tanggal_selesai);
            const namaKegiatan = j.kegiatan?.nama_kegiatan || 'Penggunaan Ruangan';
            const peminjam = j.peminjam || '-';
            const namaRuangan = j.nama_ruangan || 'Lokasi Belum Ditentukan';

            // Status badge styling
            const status = j.status || 'PENDING';
            let statusBadge = '';
            if (status === 'PENDING') {
                statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">BOOKED</span>';
            } else if (status === 'APPROVED') {
                statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">APPROVED</span>';
            } else if (status === 'REJECTED') {
                statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">REJECTED</span>';
            } else {
                statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">${status}</span>`;
            }

            return `
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 transition-all hover:shadow-md group flex flex-col h-full relative overflow-hidden">
            <!-- Decorative Element -->
            <div class="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-[3rem] -mr-3 -mt-3 transition-transform group-hover:scale-110"></div>
            
            <!-- Header: Icon + Time Badge -->
            <div class="relative z-10 mb-3 flex items-start justify-between">
                <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <div class="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${jamMulai} - ${jamSelesai}
                </div>
            </div>

            <!-- Content -->
            <div class="relative z-10 space-y-3 flex-1">
                <!-- Room Name (Primary) -->
                <div>
                    <p class="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Ruangan</p>
                    <h4 class="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">${namaRuangan}</h4>
                </div>
                
                <!-- Activity Name -->
                <div>
                    <p class="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Kegiatan</p>
                    <p class="text-sm font-medium text-gray-700">${namaKegiatan}</p>
                </div>
                
                <!-- Status Badge -->
                <div>
                    <p class="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Status</p>
                    ${statusBadge}
                </div>
                
                <!-- Borrower Info -->
                <div class="pt-2 border-t border-dashed border-gray-100">
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span class="font-medium">${peminjam}</span>
                    </div>
                </div>
            </div>
        </div>
       `;
        })
        .join('');
};

window.changeMonth = (direction) => {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
};

// Initialize if elements exist
if (calendarGrid && jadwalContainer) {
    // Only init if we are not already waiting for something else or if explicitly called
    // But since this is a widget, let's just run it
    fetchSchedules();
}

// --- ROOM AVAILABILITY MODAL LOGIC ---
let currentSelectedDate = new Date(); // Track currently selected date
let allRooms = []; // Store all rooms data

window.openRoomAvailability = async function () {
    const modal = document.getElementById('roomAvailabilityModal');
    const modalDateLabel = document.getElementById('modalDateLabel');
    const roomListContainer = document.getElementById('roomListContainer');

    if (!modal) return;

    // Show modal
    modal.classList.remove('hidden');

    // Set date label
    modalDateLabel.textContent = currentSelectedDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Show loading state
    roomListContainer.innerHTML = `
        <div class="text-center text-gray-400 py-8">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <p class="text-sm">Memuat data ruangan...</p>
        </div>
    `;

    try {
        // Fetch all rooms if not already loaded
        if (allRooms.length === 0) {
            allRooms = await apiCall('/ruangan');
        }

        // Get room availability for selected date
        const roomsWithStatus = getRoomStatusForDate(currentSelectedDate);

        // Render room cards
        renderRoomCards(roomsWithStatus);
    } catch (error) {
        console.error('Error loading room availability:', error);
        roomListContainer.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <p class="text-sm">Gagal memuat data ruangan</p>
            </div>
        `;
    }
}

window.closeRoomModal = function () {
    const modal = document.getElementById('roomAvailabilityModal');
    if (modal) modal.classList.add('hidden');
}

function getRoomStatusForDate(date) {
    const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    const schedulesOnDate = allSchedules.filter(s =>
        s.tanggal_mulai &&
        s.tanggal_mulai.startsWith(dateKey) &&
        s.status !== 'REJECTED' &&
        s.status !== 'CANCELLED'
    );

    return allRooms.map(room => {
        const booking = schedulesOnDate.find(s => s.kode_ruangan === room.kode_ruangan);

        return {
            ...room,
            status: booking ? booking.status : 'AVAILABLE',
            booking: booking || null
        };
    });
}

function renderRoomCards(roomsWithStatus) {
    const container = document.getElementById('roomListContainer');

    if (roomsWithStatus.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p class="text-sm">Tidak ada data ruangan</p>
            </div>
        `;
        return;
    }

    container.innerHTML = roomsWithStatus.map(room => {
        let statusBadge, statusColor;

        if (room.status === 'AVAILABLE') {
            statusBadge = 'AVAILABLE';
            statusColor = 'bg-gray-100 text-gray-700 border-gray-200';
        } else if (room.status === 'PENDING') {
            statusBadge = 'BOOKED';
            statusColor = 'bg-orange-100 text-orange-700 border-orange-200';
        } else if (room.status === 'APPROVED') {
            statusBadge = 'APPROVED';
            statusColor = 'bg-green-100 text-green-700 border-green-200';
        } else {
            statusBadge = room.status;
            statusColor = 'bg-gray-100 text-gray-700 border-gray-200';
        }

        return `
            <div class="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-900 text-base">${room.nama_ruangan}</h4>
                        <p class="text-sm text-gray-500">${room.lokasi || 'Lokasi tidak tersedia'}</p>
                        <p class="text-xs text-gray-400 mt-0.5">Kapasitas: ${room.kapasitas || '-'} orang</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusColor} border flex-shrink-0">
                        ${statusBadge}
                    </span>
                </div>
                ${room.booking ? `
                    <div class="mt-3 pt-3 border-t border-gray-100 space-y-1">
                        <div class="flex items-center gap-2 text-xs text-gray-600">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>${formatTime(room.booking.tanggal_mulai)} - ${formatTime(room.booking.tanggal_selesai)}</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-gray-600">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>${room.booking.peminjam || '-'}</span>
                        </div>
                        ${room.booking.kegiatan ? `
                            <div class="flex items-center gap-2 text-xs text-gray-600">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                                <span>${room.booking.kegiatan.nama_kegiatan}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

const API_BASE = 'http://localhost:8000/api';

// --- STATE VARIABLES ---
let currentDate = new Date();
let allSchedules = [];

// --- DOM ELEMENTS ---
const calendarGrid = document.getElementById('calendar-grid');
const monthYearLabel = document.getElementById('month-year-label');
const jadwalContainer = document.getElementById('jadwal-list-container');
const selectedDateLabel = document.getElementById('selected-date-label');
const barangBody = document.getElementById('barang-body');

// --- HELPERS ---
const formatDateKey = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Helper function to parse ISO date string without timezone conversion
// This ensures "2026-01-30T07:00:00Z" is displayed as "30 Januari 2026 07:00"
const parseAsLocalTime = (isoString) => {
  if (!isoString) return null;
  // Remove "Z" suffix and parse as local time
  const localStr = isoString.replace('Z', '');
  const [datePart, timePart] = localStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  let hours = 0, minutes = 0;
  if (timePart) {
    const timeOnly = timePart.split(/[+-]/)[0]; // Remove timezone offset if any
    [hours, minutes] = timeOnly.split(':').map(Number);
  }
  return new Date(year, month - 1, day, hours, minutes);
};

const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  const date = parseAsLocalTime(dateString);
  if (!date) return '--:--';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// --- LOGIC 1: JADWAL & KALENDER ---

const fetchSchedules = async () => {
  try {
    const response = await fetch(`${API_BASE}/jadwal-ruangan`);
    allSchedules = await response.json();

    renderCalendar();

    const today = new Date();
    showScheduleForDate(today.getDate(), today.getMonth(), today.getFullYear());
  } catch (error) {
    console.error('Gagal ambil data jadwal:', error);
    // Tampilan Error yang Bagus
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
};

const renderCalendar = () => {
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
    const dailyEvents = allSchedules.filter((s) => s.tanggal_mulai && s.tanggal_mulai.startsWith(dateKey));
    const eventCount = dailyEvents.length;
    const isToday = i === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();

    const dayEl = document.createElement('div');
    dayEl.className = `
      h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer transition-all duration-200 group relative
      ${isToday ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-100' : 'text-gray-700 hover:bg-orange-50'}
    `;

    dayEl.onclick = () => showScheduleForDate(i, month, year);

    // Logic Dot dynamic: Jika > 1 tampilkan 2 dot, jika 1 tampilkan 1 dot
    let dotsHtml = '';
    if (eventCount > 0) {
      const dotColor = isToday ? 'bg-white' : 'bg-red-500';
      if (eventCount > 1) {
        // 2 Dots
        dotsHtml = `
            <div class="absolute bottom-1.5 flex gap-0.5">
                <span class="h-1 w-1 rounded-full ${dotColor}"></span>
                <span class="h-1 w-1 rounded-full ${dotColor}"></span>
            </div>`;
      } else {
        // 1 Dot
        dotsHtml = `<span class="absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${dotColor}"></span>`;
      }
    }

    dayEl.innerHTML = `
      <span class="text-sm font-medium relative z-10 ${eventCount > 0 ? '-mt-1' : ''}">${i}</span>
      ${dotsHtml}
    `;

    calendarGrid.appendChild(dayEl);
  }
};

const showScheduleForDate = (day, month, year) => {
  window.currentlySelectedDate = new Date(year, month, day);
  const dateKey = formatDateKey(year, month, day);
  const dateObj = new Date(year, month, day);
  if (selectedDateLabel) {
    selectedDateLabel.innerText = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric' // <--- TAMBAHKAN INI
    });
  }

  const dailySchedules = allSchedules.filter((s) => s.tanggal_mulai && s.tanggal_mulai.startsWith(dateKey));

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

  // Render Cards - Detailed Block Style
  jadwalContainer.innerHTML = dailySchedules.map((j) => {
    const jamMulai = formatTime(j.tanggal_mulai);
    const jamSelesai = formatTime(j.tanggal_selesai);
    const namaKegiatan = j.nama_kegiatan || j.kegiatan?.nama_kegiatan || 'Penggunaan Ruangan';
    const peminjam = j.peminjam || '-';
    const namaRuangan = j.nama_ruangan || 'Lokasi Belum Ditentukan';
    const organisasi = j.organisasi || j.kegiatan?.organisasi?.kode_organisasi || '-';
    const status = j.status || 'APPROVED';
    const isPending = j.is_pending || status === 'PENDING';
    const isApproved = status === 'APPROVED';
    const isOngoing = status === 'ONGOING';

    let cardBorder, decorBg, iconBg, timeBadge, statusBadgeText, statusTextColor, liveIcon;

    if (isOngoing) {
      // ONGOING - Merah dengan ikon live kedap-kedip
      cardBorder = 'border-2 border-red-400 bg-red-50/30';
      decorBg = 'bg-red-100';
      iconBg = 'bg-red-100 text-red-600';
      timeBadge = 'text-red-600 bg-red-50 border-red-200';
      statusBadgeText = 'BERLANGSUNG';
      statusTextColor = 'text-red-600';
      liveIcon = `<span class="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse-live mr-1"></span>`;
    } else if (isPending) {
      // PENDING - Abu-abu
      cardBorder = 'border-2 border-gray-300 bg-gray-50/30';
      decorBg = 'bg-gray-100';
      iconBg = 'bg-gray-100 text-gray-600';
      timeBadge = 'text-gray-600 bg-gray-50 border-gray-200';
      statusBadgeText = 'BOOKED';
      statusTextColor = 'text-gray-500';
      liveIcon = '';
    } else if (isApproved) {
      // APPROVED - Orange
      cardBorder = 'border-2 border-orange-300 bg-orange-50/30';
      decorBg = 'bg-orange-100';
      iconBg = 'bg-orange-100 text-orange-600';
      timeBadge = 'text-orange-600 bg-orange-50 border-orange-200';
      statusBadgeText = 'DISETUJUI';
      statusTextColor = 'text-orange-600';
      liveIcon = '';
    } else {
      // Fallback
      cardBorder = 'border-2 border-green-300 bg-green-50/30';
      decorBg = 'bg-green-100';
      iconBg = 'bg-green-100 text-green-600';
      timeBadge = 'text-green-600 bg-green-50 border-green-200';
      statusBadgeText = 'AVAILABLE';
      statusTextColor = 'text-green-600';
      liveIcon = '';
    }

    return `
        <div class="bg-white rounded-xl p-3 ${cardBorder} hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
            <!-- Decorative Element -->
            <div class="absolute top-0 right-0 w-16 h-16 ${decorBg} rounded-bl-[2.5rem] -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
            
            <!-- Header: Icon + Time Badge -->
            <div class="relative z-10 mb-2 flex items-start justify-between">
                <div class="w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <div class="flex flex-col items-end gap-0.5">
                    <div class="flex items-center gap-1 text-[11px] font-semibold ${timeBadge} px-2 py-0.5 rounded-md border">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${jamMulai} - ${jamSelesai}
                    </div>
                    <span class="text-[9px] font-bold ${statusTextColor} flex items-center">${liveIcon}${statusBadgeText}</span>
                </div>
            </div>

            <!-- Content -->
            <div class="relative z-10 space-y-1.5 flex-1">
                <!-- Room Name (Primary) -->
                <div>
                    <p class="text-[9px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Ruangan</p>
                    <h4 class="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">${namaRuangan}</h4>
                </div>
                
                <!-- Activity Name -->
                <div>
                    <p class="text-[9px] text-gray-400 uppercase font-semibold tracking-wide">Kegiatan</p>
                    <p class="text-xs font-medium text-gray-700">${namaKegiatan}</p>
                </div>
                
                <!-- Borrower Info with Organization -->
                <div class="pt-1.5 border-t border-dashed border-gray-100">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span class="font-medium text-[11px]">${peminjam}</span>
                        </div>
                        <span class="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-600 rounded border border-gray-200">${organisasi}</span>
                    </div>
                </div>
            </div>
        </div>
        `;
  }).join('');
};

window.changeMonth = (direction) => {
  currentDate.setMonth(currentDate.getMonth() + direction);
  renderCalendar();
};

// --- LOGIC 2 & 3: DATA RUANGAN & BARANG (TETAP SAMA) ---
// (Bagian ini tidak perlu diubah karena sudah sesuai dengan permintaan sebelumnya)
fetch(`${API_BASE}/ruangan`)
  .then((r) => r.json())
  .then((data) => {
    const tbody = document.getElementById('ruangan-body');
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-5 py-4 text-center text-gray-400 text-xs">Tidak ada data ruangan.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((r) => `
        <tr class="hover:bg-orange-50/60 transition-colors group">
          <td class="px-5 py-3 font-mono text-xs text-gray-500 bg-orange-50/80 border-r w-20 group-hover:bg-orange-100">${r.kode_ruangan || '-'}</td>
          <td class="px-5 py-3 font-semibold text-gray-800 text-sm">${r.nama_ruangan || '-'}</td>
          <td class="px-5 py-3 text-gray-600 text-xs">${r.lokasi || '-'}</td>
          <td class="px-5 py-3 text-center">
              <span class="inline-block bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-[10px] font-bold border border-orange-100">${r.kapasitas || '0'} Org</span>
          </td>
        </tr>`).join('');
  })
  .catch(() => { document.getElementById('ruangan-body').innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500 text-xs">Gagal memuat data.</td></tr>'; });

const fetchBarang = () => {
  fetch(`${API_BASE}/barang`)
    .then((r) => r.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        barangBody.innerHTML = '<tr><td colspan="3" class="px-5 py-4 text-center text-gray-400 text-xs">Tidak ada data barang.</td></tr>';
        return;
      }
      barangBody.innerHTML = data.map((barang) => `
          <tr class="hover:bg-orange-50/60 transition-colors">
            <td class="px-5 py-3 font-mono text-xs text-gray-500 bg-orange-50/80 border-r w-24">${barang.kode_barang || '-'}</td>
            <td class="px-5 py-3 font-semibold text-gray-800 text-sm">${barang.nama_barang || '-'}</td>
            <td class="px-5 py-3 text-gray-600 text-sm">${barang.deskripsi || '-'}</td>
          </tr>`).join('');
    })
    .catch(() => { barangBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500 text-xs">Gagal memuat barang.</td></tr>'; });
};

fetchSchedules();
fetchBarang();
const API_BASE = 'http://localhost:8000/api';

// --- STATE VARIABLES ---
let currentDate = new Date(); // Menyimpan posisi bulan kalender
let allSchedules = [];        // Menyimpan data jadwal dari API

// --- DOM ELEMENTS ---
const calendarGrid = document.getElementById('calendar-grid');
const monthYearLabel = document.getElementById('month-year-label');
const jadwalContainer = document.getElementById('jadwal-list-container');
const selectedDateLabel = document.getElementById('selected-date-label');
const barangBody = document.getElementById('barang-body');

// --- HELPERS ---

// Format tanggal ke string 'YYYY-MM-DD'
const formatDateKey = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Format Jam (HH:MM)
const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
};

// --- LOGIC 1: JADWAL & KALENDER ---

const fetchSchedules = async () => {
  try {
    const response = await fetch(`${API_BASE}/jadwal-ruangan`);
    allSchedules = await response.json();

    // Render kalender
    renderCalendar();

    // Tampilkan jadwal hari ini otomatis
    const today = new Date();
    showScheduleForDate(today.getDate(), today.getMonth(), today.getFullYear());
  } catch (error) {
    console.error('Gagal ambil data jadwal:', error);
    jadwalContainer.innerHTML = '<p class="text-red-500 text-center text-sm">Gagal terhubung ke server.</p>';
  }
};

const renderCalendar = () => {
  calendarGrid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayDate = new Date();

  // Update Label Bulan
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  monthYearLabel.innerText = `${monthNames[month]} ${year}`;

  // Hitung hari
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Minggu
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Render Padding Kosong
  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.innerHTML += '<div></div>';
  }

  // Render Tanggal
  for (let i = 1; i <= lastDay; i++) {
    const dateKey = formatDateKey(year, month, i);

    // Cek Jadwal (Dot Merah)
    const hasEvent = allSchedules.some((s) => s.tanggal_mulai && s.tanggal_mulai.startsWith(dateKey));
    // Cek Hari Ini (Highlight Biru)
    const isToday = i === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();

    const dayEl = document.createElement('div');
    dayEl.className = `
      h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer transition-all duration-200 group
      ${isToday ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-100' : 'text-gray-700 hover:bg-orange-50'}
    `;

    dayEl.onclick = () => showScheduleForDate(i, month, year);

    dayEl.innerHTML = `
      <span class="text-sm font-medium relative z-10">${i}</span>
      ${hasEvent ? `<span class="h-1.5 w-1.5 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-red-500'}"></span>` : ''}
    `;

    calendarGrid.appendChild(dayEl);
  }
};

const showScheduleForDate = (day, month, year) => {
  const dateKey = formatDateKey(year, month, day);

  // Update Header
  const dateObj = new Date(year, month, day);
  selectedDateLabel.innerText = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  // Filter Data
  const dailySchedules = allSchedules.filter((s) => s.tanggal_mulai && s.tanggal_mulai.startsWith(dateKey));

  if (dailySchedules.length === 0) {
    jadwalContainer.innerHTML = `
      <div class="text-center py-8 border border-dashed border-orange-200 rounded-lg bg-orange-50/40">
         <p class="text-orange-400 text-sm">Tidak ada jadwal ruangan pada tanggal ini.</p>
      </div>`;
    return;
  }

  // Render Kartu
  jadwalContainer.innerHTML = dailySchedules
    .map((j) => {
      const jamMulai = formatTime(j.tanggal_mulai);
      const jamSelesai = formatTime(j.tanggal_selesai);
      const jenis = j.jenis_kegiatan || 'Kelas'; // Default badge

      return `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex gap-4 items-start relative overflow-hidden transition hover:shadow-md">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
          
          <div class="flex-1 pl-2">
             <div class="flex justify-between items-center mb-1">
                <span class="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-orange-200">
                  ${jenis}
                </span>
             </div>
             
             <h4 class="font-bold text-gray-800 text-base mb-1 leading-snug">${j.kegiatan || 'Penggunaan Ruangan'}</h4>
             <p class="text-xs text-gray-500 mb-2">${j.deskripsi || j.peminjam || '-'}</p>
             
             <div class="flex flex-wrap items-center gap-3 mt-3">
               <div class="flex items-center gap-1 bg-orange-50 border border-orange-100 px-2 py-1 rounded text-orange-700 text-xs font-medium">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  ${j.nama_ruangan || 'TBA'}
               </div>

               <div class="flex items-center gap-1 text-xs text-gray-500 font-mono">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  ${jamMulai} - ${jamSelesai}
               </div>
             </div>
          </div>
        </div>
       `;
    })
    .join('');
};

// Expose fungsi ke window agar bisa dipanggil HTML onclick
window.changeMonth = (direction) => {
  currentDate.setMonth(currentDate.getMonth() + direction);
  renderCalendar();
};

// --- LOGIC 2: DIREKTORI RUANGAN (DATA BERSIH) ---
fetch(`${API_BASE}/ruangan`)
  .then((r) => r.json())
  .then((data) => {
    const tbody = document.getElementById('ruangan-body');
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-5 py-4 text-center text-gray-400 text-xs">Tidak ada data ruangan.</td></tr>';
      return;
    }
    tbody.innerHTML = data
      .map(
        (r) => `
        <tr class="hover:bg-orange-50/60 transition-colors group">
          <td class="px-5 py-3 font-mono text-xs text-gray-500 bg-orange-50/80 border-r w-20 group-hover:bg-orange-100">${r.kode_ruangan || '-'}</td>
          <td class="px-5 py-3 font-semibold text-gray-800 text-sm">${r.nama_ruangan || '-'}</td>
          <td class="px-5 py-3 text-gray-600 text-xs">${r.lokasi || '-'}</td>
          <td class="px-5 py-3 text-center">
              <span class="inline-block bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-[10px] font-bold border border-orange-100">
                  ${r.kapasitas || '0'} Org
              </span>
          </td>
        </tr>
      `
      )
      .join('');
  })
  .catch(() => {
    document.getElementById('ruangan-body').innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500 text-xs">Gagal memuat data.</td></tr>';
  });

// --- LOGIC 3: DAFTAR BARANG YANG BISA DIPINJAM ---
const fetchBarang = () => {
  fetch(`${API_BASE}/barang`)
    .then((r) => r.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        barangBody.innerHTML = '<tr><td colspan="4" class="px-5 py-4 text-center text-gray-400 text-xs">Tidak ada data barang.</td></tr>';
        return;
      }

      barangBody.innerHTML = data
        .map(
          (barang) => `
          <tr class="hover:bg-orange-50/60 transition-colors">
            <td class="px-5 py-3 font-mono text-xs text-gray-500 bg-orange-50/80 border-r w-24">${barang.kode_barang || '-'}</td>
            <td class="px-5 py-3 font-semibold text-gray-800 text-sm">${barang.nama_barang || '-'}</td>
            <td class="px-5 py-3 text-center text-sm text-gray-600">${barang.jumlah_total ?? '-'}</td>
            <td class="px-5 py-3 text-center">
              <span class="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-[10px] font-bold border border-orange-200">
                ${barang.jumlah_tersedia ?? '-'} Unit
              </span>
            </td>
          </tr>
        `
        )
        .join('');
    })
    .catch(() => {
      barangBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500 text-xs">Gagal memuat barang.</td></tr>';
    });
};

// Jalankan Fetch Awal
fetchSchedules();
fetchBarang();


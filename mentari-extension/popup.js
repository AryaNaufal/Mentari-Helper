document.addEventListener('DOMContentLoaded', async () => {
  const userNameEl = document.getElementById('user-name');
  const userNimEl = document.getElementById('user-nim');
  const courseListEl = document.getElementById('course-list');
  const btnKuesioner = document.getElementById('btn-quick-kuesioner');
  const btnRefresh = document.getElementById('btn-refresh');

  // Mengambil token dan user data dari Chrome Storage
  chrome.storage.local.get(['token', 'userData'], async (result) => {
    if (result.token && result.userData) {
      const user = result.userData;
      userNameEl.textContent = user.fullname;
      userNimEl.textContent = `NIM: ${user.username}`;
      
      // Ambil data mata kuliah
      await loadCourses(result.token);
    } else {
      userNameEl.textContent = "Kredensial Tidak Ditemukan";
      userNimEl.textContent = "Silakan buka & masuk ke mentari.unpam.ac.id";
    }
  });

  async function loadCourses(token) {
    try {
      courseListEl.innerHTML = '<div class="empty-state"><p>Mengambil data dari Mentari...</p></div>';
      
      const response = await fetch('https://mentari.unpam.ac.id/api/user-course?page=1&limit=12', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      
      if (!resData || !resData.data) {
        courseListEl.innerHTML = '<div class="empty-state"><p>Gagal memuat mata kuliah.</p></div>';
        return;
      }

      courseListEl.innerHTML = '';
      
      for (const course of resData.data) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'course-item';
        
        // Buat elemen progress sederhana
        itemDiv.innerHTML = `
          <div class="course-name">${course.nama_mata_kuliah}</div>
          <div class="progress-stats">
            <span class="status-tag">SKS: ${course.sks}</span>
            <span class="status-tag">${course.nama_dosen.split(' ')[0]}</span>
          </div>
        `;
        courseListEl.appendChild(itemDiv);
      }
    } catch (e) {
      courseListEl.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`;
    }
  }

  // Aksi: Kuesioner Otomatis
  btnKuesioner.addEventListener('click', () => {
    // Kirim pesan ke content script di tab aktif
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "fill_kuesioner" }, (response) => {
          if (response && response.status === "success") {
            alert(`Berhasil mengisi ${response.count} pertanyaan kuesioner!`);
          } else {
            alert("Gagal mengisi. Pastikan Anda sedang membuka halaman kuesioner Mentari.");
          }
        });
      }
    });
  });

  btnRefresh.addEventListener('click', () => {
    chrome.storage.local.get(['token'], (res) => {
      if (res.token) loadCourses(res.token);
    });
  });
});

/**
 * Mentari E-Learning Automation Blueprint
 * 
 * Requirements:
 * 1. Docker running with FlareSolverr (docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest)
 * 2. Valid JWT Token from LocalStorage ('access' key)
 * 
 * Execution Flow:
 * Pre-test (Quiz) -> Forum (2 replies) -> Post-test (Quiz) -> Kuisioner
 */

const fs = require('fs');

let TOKEN = "";
const FLARESOLVERR_URL = 'http://localhost:8191/v1';
const MENTARI_API_BASE = 'https://mentari.unpam.ac.id/api';

function setToken(newToken) {
    TOKEN = newToken.startsWith("Bearer ") ? newToken : `Bearer ${newToken}`;
}

// --- 1. CORE API & BYPASS ---

/**
 * Meminta FlareSolverr untuk mem-bypass Cloudflare dan mengambil session cookies & user-agent.
 */
async function bypassCloudflare() {
    console.log("[SYSTEM] Memulai bypass Cloudflare via FlareSolverr...");
    try {
        const response = await fetch(FLARESOLVERR_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cmd: 'request.get',
                url: `https://mentari.unpam.ac.id/`,
                maxTimeout: 120000,
            })
        });
        const data = await response.json();
        
        if (data.status === 'ok') {
            const cookies = data.solution.cookies.map(c => `${c.name}=${c.value}`).join('; ');
            const userAgent = data.solution.userAgent;
            console.log("[SYSTEM] Bypass berhasil.");
            return { cookies, userAgent };
        } else {
            throw new Error("Gagal bypass Cloudflare: " + JSON.stringify(data));
        }
    } catch (error) {
        console.error("[ERROR] FlareSolverr Error:", error.message);
        console.log("Pastikan container Docker FlareSolverr sedang berjalan di port 8191.");
        throw error;
    }
}

/**
 * Wrapper universal untuk memanggil Mentari API dengan kredensial dari FlareSolverr.
 */
async function fetchApi(path, bypass, options = {}) {
    const defaultHeaders = {
        'Authorization': TOKEN,
        'Cookie': bypass.cookies,
        'User-Agent': bypass.userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    };

    const res = await fetch(`${MENTARI_API_BASE}${path}`, {
        method: options.method || 'GET',
        headers: { ...defaultHeaders, ...options.headers },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText} pada ${path}`);
    }
    
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text; // Fallback jika response bukan JSON (jarang terjadi)
    }
}

// --- 2. AUTOMATION TASKS ---

/**
 * Menjalankan Kuis (Pre-Test / Post-Test)
 */
async function doQuiz(bypass, subSectionId, taskName) {
    console.log(`[KUIS] Memulai ${taskName} (${subSectionId})...`);
    try {
        // 1. Start Quiz
        await fetchApi(`/quiz/start/${subSectionId}`, bypass, {
            method: 'PUT',
            body: { "id_trx_course_sub_section": subSectionId, "reset": true }
        });

        // 2. Ambil Soal
        const resSoal = await fetchApi(`/quiz/soal/${subSectionId}`, bypass);
        const soalList = resSoal.data || [];
        
        if (soalList.length === 0) {
            console.log(`[KUIS] Tidak ada soal ditemukan untuk ${taskName}.`);
            return;
        }

        console.log(`[KUIS] Menjawab ${soalList.length} soal...`);
        // 3. Jawab setiap soal secara sekuensial (in-memory, no temp files)
        for (const soal of soalList) {
            // Logika sederhana: Pilih opsi jawaban pertama (index 0) secara default. 
            // Untuk otomatisasi cerdas, logika evaluasi soal bisa diintegrasikan di sini.
            const jawabanTerpilih = soal.list_jawaban ? soal.list_jawaban[0] : null; 

            if (jawabanTerpilih) {
                await fetchApi(`/quiz/jawab`, bypass, {
                    method: 'PUT',
                    body: {
                        "id_trx_quiz_user_soal": soal.id,
                        "id_jawaban": jawabanTerpilih.id
                    }
                });
            }
        }

        // 4. End Quiz
        await fetchApi(`/quiz/end`, bypass, {
            method: 'PUT',
            body: { "id_trx_course_sub_section": subSectionId }
        });
        
        console.log(`[KUIS] ${taskName} Selesai.`);
    } catch (e) {
        console.error(`[ERROR] Gagal mengerjakan kuis ${taskName}:`, e.message);
    }
}

/**
 * Mengerjakan Forum Diskusi (Minimal 2 Replies) secara otomatis dengan melacak topicId & postId dari API.
 */
async function doForum(bypass, forumId) {
    console.log(`[FORUM] Mengambil topik untuk forum ${forumId}...`);
    try {
        const forumDetail = await fetchApi(`/forum/topic/${forumId}`, bypass);
        if (!forumDetail || !forumDetail.topics || forumDetail.topics.length === 0) {
            console.error("[FORUM] Gagal mengambil topik forum.");
            return;
        }

        const topicSummary = forumDetail.topics[0]; 
        console.log(`[DEBUG FORUM] topicSummary keys:`, Object.keys(topicSummary));
        console.log(`[DEBUG FORUM] topicSummary:`, JSON.stringify(topicSummary, null, 2));

        const topicId = topicSummary.id;
        const originalTitle = topicSummary.judul;

        let postId = null;
        try {
            console.log(`[FORUM] Mengambil post untuk topik ${topicId}...`);
            const posts = await fetchApi(`/forum/post/${topicId}`, bypass);
            if (posts && posts.data && posts.data.length > 0) {
                 postId = posts.data[0].id;
            }
        } catch (err) {
            console.log(`[FORUM] Gagal mengambil post dari daftar, menggunakan fallback.`);
        }

        if (!postId && topicSummary.id_post) {
             postId = topicSummary.id_post;
        }

        if (!postId) {
             postId = topicId;
             console.log(`[FORUM] Menggunakan topicId (${topicId}) sebagai root postId.`);
        }

        const replies = [
            "Terima kasih atas penjelasan materi ini. Materi ini sangat membantu saya dalam memahami konsep yang sedang dibahas. Saya setuju bahwa penerapan konsep ini sangat penting.",
            "Izin menambahkan diskusi, menurut saya penjelasan yang diberikan sudah cukup komprehensif. Saya akan mencoba menerapkan pendekatan ini dalam studi kasus lain. Terima kasih."
        ];

        for (let i = 0; i < replies.length; i++) {
            console.log(`[FORUM] Mengirim balasan ${i+1}...`);
            await fetchApi(`/forum/reply`, bypass, {
                method: 'POST',
                body: {
                    "id_topic": topicId,
                    "id_post": postId,
                    "konten": replies[i],
                    "judul": `RE: ${originalTitle}`
                }
            });
            console.log(`[FORUM] Balasan ${i+1} terkirim.`);
            if (i < replies.length - 1) await new Promise(r => setTimeout(r, 2000));
        }
        console.log(`[FORUM] Forum Diskusi Selesai.`);
    } catch (e) {
        console.error(`[ERROR] Gagal mengerjakan forum:`, e.message);
    }
}

/**
 * Mengisi Kuesioner
 */
async function doKuisioner(bypass, kodeCourse, kodeSection) {
    console.log(`[KUESIONER] Mengambil data kuesioner...`);
    try {
        const res = await fetchApi(`/kuesioner/${kodeCourse}/${kodeSection}`, bypass);
        const kData = res.kuesioner || [];
        
        if (kData.length === 0) {
            console.log(`[KUESIONER] Kuesioner sudah terisi atau tidak tersedia.`);
            return;
        }

        const isCompleted = kData.every(q => q.jawaban !== null);
        if (isCompleted) {
            console.log(`[KUESIONER] Kuesioner sudah selesai sebelumnya.`);
            return;
        }

        console.log(`[KUESIONER] Menyelesaikan kuesioner (${kData.length} pertanyaan)...`);
        
        // Format jawaban (Semua diberi nilai 1 atau nilai konstan default)
        const formatJawaban = kData.map(q => ({
            id_kuesioner: q.id,
            jawaban: 1 // Ganti sesuai kebutuhan evaluasi dosen
        }));

        await fetchApi(`/kuesioner/submit`, bypass, {
            method: 'POST',
            body: {
                "kode_section": kodeSection,
                "kode_course": kodeCourse,
                "kuesioner": formatJawaban
            }
        });
        console.log(`[KUESIONER] Kuesioner Selesai.`);
    } catch (e) {
        console.error(`[ERROR] Gagal mengisi kuesioner:`, e.message);
    }
}

// --- 3. ORCHESTRATOR ---

/**
 * Menjalankan proses pengecekan status (Mode Check)
 * Menggunakan kode_section untuk konsistensi struktur API terbaru.
 */
async function checkStatusMode() {
    const bypass = await bypassCloudflare();
    const coursesUrl = `/user-course?page=1&limit=12&t=${Date.now()}`;
    const courses = await fetchApi(coursesUrl, bypass);
    
    if (!courses || !courses.data) return console.log("Gagal mengambil daftar mata kuliah.");
    
    console.log("=== STATUS E-LEARNING ===");
    for (const course of courses.data) {
        try {
            const detail = await fetchApi(`/user-course/${course.kode_course}`, bypass);
            if (!detail || !detail.data || !Array.isArray(detail.data)) continue;
            
            for (const section of detail.data) {
                 const pertemuan = section.kode_section;
                 // Hanya cek pertemuan yang relevan dengan jadwal minggu ini (Logika target bisa ditambahkan di sini)
                 // Ini memprint seluruh status untuk demonstrasi blueprint
                 
                 const tasks = (section.sub_section || []).filter(s => ['PRE_TEST', 'FORUM_DISKUSI', 'POST_TEST', 'KUESIONER'].includes(s.kode_template));
                 
                 tasks.forEach(task => {
                     let status = task.completion ? "✅ Selesai" : "❌ Tertunda";
                     console.log(`[${course.nama_mata_kuliah}] ${pertemuan} - ${task.kode_template}: ${status}`);
                 });
            }
        } catch (e) {
            // Silently skip if detail fails
        }
    }
}

/**
 * Pintu masuk utama script. 
 * Ubah ke mode yang diinginkan: 'check' atau 'auto'
 */
async function main() {
    const mode = 'check'; // Ganti ke 'auto' untuk menjalankan otomatisasi (belum terangkai full orchestration di contoh ini)
    
    if (TOKEN === "ISI_DENGAN_TOKEN_ANDA_DISINI") {
        console.log("[PERINGATAN] Token belum diisi! Silakan isi konstanta TOKEN di skrip.");
        process.exit(1);
    }

    if (mode === 'check') {
        await checkStatusMode();
    } else {
        console.log("[MODE AUTO] Logika orchestrasi pengerjaan dapat dijalankan di sini dengan memanggil doQuiz, doForum, dll.");
        // Contoh implementasi untuk auto:
        // 1. Ambil list courses
        // 2. Loop courses -> Loop sections -> Loop tasks yang belum selesai
        // 3. Jika PRE_TEST -> await doQuiz()
        // 4. Jika FORUM -> await doForum()
        // 5. ...
    }
}

// Jalankan
// main().catch(console.error);

module.exports = {
    bypassCloudflare,
    fetchApi,
    doQuiz,
    doForum,
    doKuisioner,
    checkStatusMode,
    setToken
};

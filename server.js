const http = require('http');
const bp = require('./mentari_blueprint');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/automate') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const { token, kode_course, kode_section, task_type, id_sub_section } = payload;

                if (!token || !task_type) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Token and task_type are required' }));
                    return;
                }

                console.log(`\n==========================================`);
                console.log(`🤖 [AUTOMATE REQUEST] Received: ${task_type}`);
                console.log(`📚 Course : ${kode_course || '-'}`);
                console.log(`📅 Section: ${kode_section || '-'}`);
                console.log(`🔑 Task ID: ${id_sub_section || '-'}`);
                console.log(`==========================================`);

                // Set token in blueprint
                bp.setToken(token);

                // Run Cloudflare bypass
                const bypass = await bp.bypassCloudflare();

                let resultMessage = '';

                if (task_type === 'PRE_TEST' || task_type === 'POST_TEST') {
                    if (!id_sub_section) throw new Error("Missing ID for Quiz");
                    await bp.doQuiz(bypass, id_sub_section, `${task_type} - ${kode_section}`);
                    resultMessage = `Kuis ${task_type === 'PRE_TEST' ? 'Pre-Test' : 'Post-Test'} berhasil diselesaikan otomatis!`;
                } else if (task_type === 'FORUM_DISKUSI') {
                    if (!id_sub_section) throw new Error("Missing ID for Forum");
                    await bp.doForum(bypass, id_sub_section);
                    resultMessage = "Forum diskusi (2 balasan) berhasil dikirim otomatis!";
                } else if (task_type === 'KUESIONER') {
                    if (!kode_course || !kode_section) throw new Error("Missing course or section code for Kuesioner");
                    await bp.doKuisioner(bypass, kode_course, kode_section);
                    resultMessage = "Kuesioner berhasil diselesaikan otomatis!";
                } else {
                    throw new Error(`Unsupported task type: ${task_type}`);
                }

                console.log(`[SUCCESS] Automate request for ${task_type} completed.`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: resultMessage }));

            } catch (err) {
                console.error(`[ERROR] automation failed:`, err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 Mentari Helper Bridge Server is running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🐳 FlareSolverr expected on port 8191`);
    console.log(`==========================================`);
});

/* Adapter transport tunggal (PRD 9.2). Hanya berkas ini yang tahu cara bicara ke server.
   POST text/plain berisi JSON → tidak memicu preflight CORS; token di badan permintaan. */
window.Transport = (function () {
  const url = function () { return (window.APP_CONFIG && APP_CONFIG.GAS_URL) || ''; };
  function siap() { const u = url(); return !!u && !/GANTI|XXXX/.test(u); }
  async function kirim(body, opsi) {
    if (!siap()) return { ok: false, error: 'Konfigurasi belum lengkap: isi GAS_URL di js/config.js.', code: 'KONFIG' };
    const ctrl = new AbortController(), batas = setTimeout(function () { ctrl.abort(); }, (opsi && opsi.timeout) || 45000);
    try {
      const res = await fetch(url(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctrl.signal, redirect: 'follow' });
      if (!res.ok) return { ok: false, error: 'Server membalas ' + res.status + '.', code: 'HTTP' };
      return await res.json();
    } catch (e) {
      const putus = !navigator.onLine;
      return { ok: false, error: e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : (putus ? 'Tidak ada koneksi internet.' : 'Gagal menghubungi server.'), code: putus ? 'OFFLINE' : 'JARINGAN' };
    } finally { clearTimeout(batas); }
  }
  /** Pemanasan server: GET no-cors, maks. 1×/4 menit per tab. */
  function hangatkan() {
    if (!siap()) return;
    try {
      const k = 'sg_warm', t = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - t < 240000) return;
      sessionStorage.setItem(k, String(Date.now()));
    } catch (e) { }
    fetch(url() + '?w=1', { mode: 'no-cors' }).catch(function () { });
  }
  return { kirim: kirim, hangatkan: hangatkan, siap: siap };
})();

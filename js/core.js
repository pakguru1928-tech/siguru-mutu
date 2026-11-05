/* SIGURU MUTU — core.js
   h() pembuat elemen aman-XSS (textContent), Api (dedupe + batch otomatis + epoch tulis + pengukur),
   Data (cache SWR per sesi), Router hash, format tanggal/angka, toast, modal. */
(function () {
  'use strict';
  // append/replaceChildren/prepend mengabaikan null/false (bawaan DOM menulis teks "null")
  ['append', 'prepend', 'replaceChildren'].forEach(function (m) {
    const asli = Element.prototype[m];
    Element.prototype[m] = function () { return asli.apply(this, [].filter.call(arguments, function (x) { return x !== null && x !== undefined && x !== false; })); };
  });
  // ============================================================ h()
  function h(tag, a) {
    const el = document.createElement(tag);
    if (a && (typeof a !== 'object' || a instanceof Node || Array.isArray(a))) { tambah(el, [].slice.call(arguments, 1)); return el; }
    if (a) Object.keys(a).forEach(function (k) {
      const v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'multiple' || k === 'open' || k === 'readOnly') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    tambah(el, [].slice.call(arguments, 2));
    return el;
  }
  function tambah(el, kids) {
    kids.forEach(function (c) {
      if (c === null || c === undefined || c === false || c === '') return;
      if (Array.isArray(c)) tambah(el, c);
      else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    });
  }
  window.h = h;

  // ============================================================ Format
  const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const F = {
    tgl: function (iso) { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Number(m[3]) + ' ' + BLN[Number(m[2]) - 1] + ' ' + m[1] : '-'; },
    tglP: function (iso) { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Number(m[3]) + ' ' + BLN[Number(m[2]) - 1].slice(0, 3) + ' ' + m[1] : '-'; },
    jam: function (iso) { const m = String(iso || '').match(/T(\d{2}:\d{2})/); return m ? m[1] : ''; },
    bulan: function (ym) { const m = String(ym || '').match(/^(\d{4})-(\d{2})/); return m ? BLN[Number(m[2]) - 1] + ' ' + m[1] : ym; },
    angka: function (v, d) { if (v === '' || v === null || v === undefined || isNaN(Number(v))) return '–'; return Number(v).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d }); },
    persen: function (v) { return v === '' || v === null || v === undefined ? '–' : F.angka(v) + '%'; },
    relatif: function (iso) {
      if (!iso) return '';
      const t = new Date(String(iso).length <= 10 ? iso + 'T00:00:00' : iso).getTime(), d = (Date.now() - t) / 1000;
      if (isNaN(t)) return iso;
      if (d < 60) return 'baru saja'; if (d < 3600) return Math.floor(d / 60) + ' mnt lalu'; if (d < 86400) return Math.floor(d / 3600) + ' jam lalu';
      if (d < 172800) return 'kemarin'; if (d < 604800) return Math.floor(d / 86400) + ' hari lalu';
      return F.tglP(iso);
    },
    inisial: function (n) { const bersih = String(n || '?').split(',')[0].replace(/^((prof|drs?|dra|hj|h|ir|ns)\.?\s+)+/i, '').trim(); return bersih.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase() || '?'; },
    hariIni: function () { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); },
    sapa: function () { const j = new Date().getHours(); return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam'; },
    ukuran: function (b) { b = Number(b) || 0; return b > 1048576 ? F.angka(b / 1048576) + ' MB' : F.angka(b / 1024, 0) + ' KB'; }
  };
  window.F = F;

  // ============================================================ Simpan sesi (aman bila storage diblokir)
  const SS = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { } },
    bersih: function (awalan) { try { Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf(awalan) === 0) sessionStorage.removeItem(k); }); } catch (e) { } }
  };
  const LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  window.SS = SS; window.LS = LS;

  // ============================================================ Api
  const AKSI_BACA = ['boot', 'auth.pernyataan', 'beranda', 'master.get', 'akun.list', 'pengaturan.get', 'log.list', 'profil.get', 'usulan.list', 'perangkat.list', 'rekap.list', 'refleksi.list', 'tugas.list', 'tendik.list', 'pkb.list', 'portofolio.list', 'kelengkapan.saya', 'kelengkapan.matriks', 'instrumen.list', 'instrumen.get', 'jadwal.list', 'supervisi.daftar', 'supervisi.detail', 'spmi.rumus', 'spmi.standar', 'spmi.pemetaan', 'spmi.rencana', 'spmi.audit', 'spmi.tahap', 'temuan.list', 'bukti.list', 'mutu.ringkasan', 'laporan.data', 'laporan.terbit'];
  const BACA = {}; AKSI_BACA.forEach(function (a) { BACA[a] = 1; });
  const inflight = {}, catatanPerf = [];
  let antre = null, epoch = 0, aktif = 0;
  const Api = {
    token: SS.get('sg_token') || '',
    setToken: function (t) { Api.token = t || ''; if (t) SS.set('sg_token', t); else SS.del('sg_token'); },
    get epoch() { return epoch; },
    baca: function (a) { return !!BACA[a]; },
    kirim: async function (action, data) {
      const t0 = performance.now(); aktif++; Segar.cek();
      let res;
      try { res = await Transport.kirim({ action: action, data: data || {}, token: Api.token }); }
      finally { aktif--; Segar.cek(); }
      const total = Math.round(performance.now() - t0);
      catatanPerf.push({ aksi: action, total: total, server: res.ms || 0, jaringan: total - (res.ms || 0), ok: res.ok });
      if (catatanPerf.length > 200) catatanPerf.shift();
      if (res.token) Api.setToken(res.token);
      if (res.code === 'SESI' && action !== 'auth.login') setTimeout(function () { window.App && App.sesiHabis(res.error); }, 0);
      if (res.code === 'GATE') setTimeout(function () { window.App && App.keGerbang(res.gate); }, 0);
      return res;
    },
    /** Panggilan utama: baca → dedupe + batch otomatis; tulis → epoch naik (baca lama tidak dipakai lagi). */
    call: function (action, data) {
      if (!BACA[action]) { epoch++; Data.basi(); return Api.kirim(action, data); }
      const k = epoch + '|' + action + '|' + JSON.stringify(data || {});
      if (inflight[k]) return inflight[k];
      const p = new Promise(function (res) {
        if (!antre) { antre = []; setTimeout(flush, 0); }
        antre.push({ action: action, data: data || {}, res: res });
      });
      inflight[k] = p;
      p.then(function () { delete inflight[k]; });
      return p;
    }
  };
  async function flush() {
    const q = antre; antre = null;
    for (let i = 0; i < q.length; i += 10) {
      const bag = q.slice(i, i + 10);
      if (bag.length === 1) { bag[0].res(await Api.kirim(bag[0].action, bag[0].data)); continue; }
      const r = await Api.kirim('batch', { calls: bag.map(function (x) { return { action: x.action, data: x.data }; }) });
      bag.forEach(function (x, j) { x.res(r.ok ? r.data[j] : r); });
    }
  }
  window.Api = Api;
  window.Perf = {
    table: function () { console.table(catatanPerf.slice(-30)); },
    summary: function () {
      const g = {}; catatanPerf.forEach(function (p) { const x = g[p.aksi] || (g[p.aksi] = { n: 0, total: 0, server: 0 }); x.n++; x.total += p.total; x.server += p.server; });
      console.table(Object.keys(g).map(function (k) { return { aksi: k, panggilan: g[k].n, rata_total_ms: Math.round(g[k].total / g[k].n), rata_server_ms: Math.round(g[k].server / g[k].n) }; }));
    }
  };

  // ============================================================ Data (cache SWR per sesi)
  const mem = {};
  let epochData = 0;
  const Data = {
    awalan: function () { return 'sg_c_' + ((window.App && App.me && App.me.akun) || 'x') + '_'; },
    kunci: function (a, d) { return a + '|' + JSON.stringify(d || {}); },
    get: function (a, d) {
      const k = Data.kunci(a, d);
      if (mem[k]) return mem[k];
      const s = SS.get(Data.awalan() + k);
      if (s) { try { mem[k] = JSON.parse(s); mem[k].e = -1; return mem[k]; } catch (e) { } }
      return null;
    },
    set: function (a, d, nilai) {
      const k = Data.kunci(a, d), s = JSON.stringify(nilai), o = { d: nilai, t: Date.now(), e: epochData, hs: hash(s) };
      mem[k] = o;
      if (s.length < 400000) SS.set(Data.awalan() + k, JSON.stringify(o));
      return o;
    },
    segar: function (o, maxAge) { return o && o.e === epochData && Date.now() - o.t < (maxAge || 30000); },
    basi: function () { epochData++; },
    hapusSemua: function () { Object.keys(mem).forEach(function (k) { delete mem[k]; }); SS.bersih('sg_c_'); },
    /** Ambil data: dari cache bila segar; bila tidak, ke server (dedupe + batch otomatis). */
    ambil: async function (a, d, maxAge) {
      const c = Data.get(a, d);
      if (Data.segar(c, maxAge)) return { ok: true, data: c.d };
      const r = await Api.call(a, d);
      if (r.ok) Data.set(a, d, r.data);
      return r;
    }
  };
  function hash(s) { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x; }
  window.Data = Data;

  // ============================================================ Indikator segar (garis tipis di atas)
  const Segar = {
    el: null,
    cek: function () { if (!Segar.el) Segar.el = document.getElementById('segar'); if (Segar.el) Segar.el.classList.toggle('on', aktif > 0); }
  };

  // ============================================================ Router hash
  const Router = {
    rute: [], token: 0, kini: '',
    daftar: function (pola, fn, opsi) {
      const kunci = [], re = new RegExp('^' + pola.replace(/:(\w+)/g, function (_, k) { kunci.push(k); return '([^/]+)'; }) + '/?$');
      Router.rute.push(Object.assign({ pola: pola, re: re, kunci: kunci, fn: fn }, opsi || {}));
    },
    go: function (p) { if (location.hash === '#' + p) Router.jalan(); else location.hash = '#' + p; },
    jalan: function () {
      const p = decodeURIComponent((location.hash || '#/').slice(1).split('?')[0]) || '/';
      let cocok = null, param = {};
      for (const r of Router.rute) { const m = p.match(r.re); if (m) { cocok = r; r.kunci.forEach(function (k, i) { param[k] = m[i + 1]; }); break; } }
      Router.token++; Router.kini = p;
      if (window.App) App.tampilRute(cocok, param, p);
    }
  };
  window.Router = Router;

  /** Tampilkan halaman dari sumber data dengan pola stale-while-revalidate. */
  window.tampilkan = async function (view, sumber, render, opsi) {
    opsi = opsi || {};
    const tok = Router.token, maxAge = opsi.maxAge || 30000;
    const cache = sumber.map(function (s) { return Data.get(s[0], s[1]); });
    let sudah = false;
    if (cache.every(Boolean)) {
      try { render.apply(null, cache.map(function (c) { return c.d; })); sudah = true; } catch (e) { console.error(e); }
      if (cache.every(function (c) { return Data.segar(c, maxAge); }) && !opsi.paksa) return;
    } else view.replaceChildren(UI.kerangka(opsi.kerangka));
    const hs = await Promise.all(sumber.map(function (s) { return Api.call(s[0], s[1]); }));
    if (tok !== Router.token) return;
    const gagal = hs.filter(function (r) { return !r.ok; })[0];
    if (gagal) {
      if (sudah) { if (gagal.code !== 'SESI') toast(gagal.error, 'warn'); return; }
      view.replaceChildren(UI.galatKartu(gagal.error, function () { tampilkan(view, sumber, render, opsi); }));
      return;
    }
    let berubah = !sudah;
    hs.forEach(function (r, i) {
      const lama = cache[i];
      const baru = Data.set(sumber[i][0], sumber[i][1], r.data);
      if (!lama || lama.hs !== baru.hs) berubah = true;
    });
    if (!berubah) return;
    if (sudah && view.dataset.kotor === '1') { toast('Data terbaru tersedia. Simpan isian Anda lalu muat ulang halaman.', 'info'); return; }
    const y = window.scrollY;
    render.apply(null, hs.map(function (r) { return r.data; }));
    if (sudah) window.scrollTo(0, y);
  };

  /** Aksi tulis dengan status tombol + toast; data cache otomatis ditandai basi. */
  window.aksi = async function (tombol, action, data, opsi) {
    opsi = opsi || {};
    let label = null;
    if (tombol) { tombol.disabled = true; label = Array.from(tombol.childNodes); tombol.replaceChildren(h('span', { class: 'putar' }), opsi.proses || 'Menyimpan…'); }
    const r = await Api.call(action, data);
    if (tombol) { tombol.disabled = false; tombol.replaceChildren.apply(tombol, label); }
    if (r.ok) { if (r.pesan && opsi.diam !== true) toast(r.pesan, 'ok'); }
    else if (r.code !== 'SESI' && r.code !== 'GATE' && !opsi.diamGagal) toast(r.error || 'Gagal.', 'bad');
    return r;
  };

  // ============================================================ Toast, modal, dialog
  window.toast = function (pesan, jenis) {
    let w = document.querySelector('.toasts');
    if (!w) { w = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(w); }
    const t = h('div', { class: 'toast ' + (jenis || '') }, ic(jenis === 'ok' ? 'checkCircle' : jenis === 'bad' ? 'alertCircle' : jenis === 'warn' ? 'alert' : 'info'), h('span', null, pesan));
    w.appendChild(t);
    setTimeout(function () { t.remove(); }, jenis === 'bad' ? 6000 : 3500);
  };
  window.modal = function (o) {
    const tutup = function () { bg.remove(); document.removeEventListener('keydown', esc); if (o.onTutup) o.onTutup(); };
    const esc = function (e) { if (e.key === 'Escape') tutup(); };
    const aksiEl = (o.aksi || []).map(function (a) {
      const b = h('button', { class: 'btn ' + (a.kelas || ''), type: 'button' }, a.ikon ? ic(a.ikon, 's') : null, a.label);
      b.addEventListener('click', async function () { if (a.onClick) { const hasil = await a.onClick(b, tutup); if (hasil !== false && a.tutup !== false) tutup(); } else tutup(); });
      return b;
    });
    const box = h('div', { class: 'modal' + (o.lebar ? ' lebar' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.judul },
      h('div', { class: 'modal-h' }, h('div', { class: 'grow' }, h('h3', null, o.judul), o.sub ? h('p', { class: 'muted small' }, o.sub) : null),
        h('button', { class: 'ibtn', type: 'button', 'aria-label': 'Tutup', onclick: tutup }, ic('x'))),
      h('div', { class: 'modal-b' }, o.isi),
      aksiEl.length ? h('div', { class: 'modal-f' }, aksiEl) : null);
    const bg = h('div', { class: 'modal-bg', onclick: function (e) { if (e.target === bg && !o.wajib) tutup(); } }, box);
    document.body.appendChild(bg); document.addEventListener('keydown', esc);
    setTimeout(function () { const f = box.querySelector('input:not([type=hidden]),select,textarea'); if (f && !o.tanpaFokus) f.focus(); }, 50);
    return { tutup: tutup, el: box };
  };
  window.konfirmasi = function (judul, pesan, opsi) {
    opsi = opsi || {};
    return new Promise(function (res) {
      let jawab = false;
      modal({ judul: judul, isi: h('p', null, pesan), onTutup: function () { res(jawab); },
        aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: opsi.ya || 'Ya, lanjutkan', kelas: opsi.bahaya ? 'bahaya isi' : 'pri', onClick: function () { jawab = true; } }] });
    });
  };
  window.tanya = function (judul, label, opsi) {
    opsi = opsi || {};
    return new Promise(function (res) {
      let jawab = null;
      const inp = h(opsi.panjang ? 'textarea' : 'input', { class: 'inp', placeholder: opsi.placeholder || '', value: opsi.nilai || '' });
      modal({ judul: judul, isi: h('div', { class: 'fld' }, h('label', null, label), inp, opsi.bantuan ? h('span', { class: 'help' }, opsi.bantuan) : null), onTutup: function () { res(jawab); },
        aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: opsi.ya || 'Simpan', kelas: opsi.bahaya ? 'bahaya isi' : 'pri', onClick: function () {
          const v = inp.value.trim(); if ((opsi.min || 1) > v.length) { toast('Isi minimal ' + (opsi.min || 1) + ' karakter.', 'warn'); return false; } jawab = v; } }] });
    });
  };
})();

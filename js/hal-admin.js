/* SIGURU MUTU — hal-admin.js: Perangkat Ajar, Rekap Mingguan, Refleksi, Tugas Tambahan, Kinerja Tendik, PKB & Portofolio. */
(function () {
  'use strict';
  const PRIORITAS = { disetujui: 4, disahkan: 4, diajukan: 3, revisi: 2, draf: 1 };
  function tombolAksiBaris(list) { return h('div', { class: 'row wrap', style: { justifyContent: 'flex-end' } }, list.filter(Boolean)); }

  // ============================================================== PERANGKAT AJAR
  HAL.perangkat = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['perangkat.list', {}]], function (daftar) {
      if (hk.perangkat_isi && !hk.perangkat_lihat_semua) { view.replaceChildren(perangkatGuru(daftar)); return; }
      let tab = hk.perangkat_sahkan ? 'menunggu' : 'semua';
      const isi = h('div');
      const menunggu = daftar.filter(function (p) { return p.status === 'diajukan'; });
      function gambar() {
        if (tab === 'matriks') { isi.replaceChildren(UI.kerangka('daftar')); Data.ambil('kelengkapan.matriks', {}).then(function (r) { if (r.ok) isi.replaceChildren(tabelMatriks(r.data)); else isi.replaceChildren(UI.galatKartu(r.error)); }); return; }
        const arr = tab === 'menunggu' ? menunggu : daftar;
        isi.replaceChildren(UI.tabel({ baris: arr, kosong: tab === 'menunggu' ? 'Tidak ada perangkat yang menunggu pemeriksaan.' : 'Belum ada perangkat ajar.', placeholder: 'Cari guru, jenis, mapel…', kolom: [
          { k: 'nama_pegawai', label: 'Guru', fmt: function (v) { return h('div', { class: 'row' }, UI.ava(v, 's'), h('b', null, v)); } },
          { k: 'jenis', label: 'Jenis', fmt: function (v, p) { return h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, p.judul !== v ? p.judul : '')); } },
          { k: 'mapel', label: 'Mapel / Rombel', fmt: function (v, p) { return h('div', null, v, h('div', { class: 'xs muted' }, p.rombel)); } },
          { k: 'diubah_pada', label: 'Diperbarui', fmt: function (v) { return F.relatif(v); } },
          { k: 'status', label: 'Status', fmt: function (v) { return UI.badge(v); } },
          { k: 'id', label: '', urut: false, fmt: function (v, p) { return tombolAksiBaris([H.tombolBerkas(p.file_id, p.tautan), hk.perangkat_sahkan && p.status === 'diajukan' ? h('button', { class: 'btn pri kecil', onclick: function () { periksaPerangkat(p); } }, ic('check', 's'), 'Periksa') : null, hk.buka_kunci && p.status === 'disetujui' ? tombolBukaKunci('Perangkat_Ajar', p.id) : null]); } }] }));
      }
      view.replaceChildren(UI.kepala('Perangkat Ajar', 'Pemeriksaan modul ajar, ATP, prota, promes, dan asesmen guru semester ini.'),
        UI.tabs([hk.perangkat_sahkan ? { id: 'menunggu', label: 'Menunggu Pemeriksaan', ikon: 'inbox', n: menunggu.length } : null, { id: 'semua', label: 'Semua Perangkat', ikon: 'list' }, { id: 'matriks', label: 'Matriks Kelengkapan', ikon: 'grid' }], tab, function (t) { tab = t; gambar(); }), isi);
      gambar();
    }, { kerangka: 'daftar' });
  };
  function tabelMatriks(m) {
    return UI.tabel({ baris: m, placeholder: 'Cari guru…', kolom: [
      { k: 'nama', label: 'Guru', fmt: function (v, x) { return h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, x.mapel || '')); } },
      { k: 'perangkat', label: 'Perangkat', fmt: function (v, x) { return h('div', null, v, x.perangkat_kurang && x.perangkat_kurang.length ? h('div', { class: 'xs muted' }, 'Kurang: ' + x.perangkat_kurang.join(', ')) : null); } },
      { k: 'rekap', label: 'Rekap (minggu)' }, { k: 'rekap_minggu_ini', label: 'Minggu ini', fmt: function (v) { return v ? UI.badge('selesai') : h('span', { class: 'bdg warn' }, 'Belum'); } },
      { k: 'refleksi', label: 'Refleksi' }, { k: 'tugas', label: 'Tugas tambahan' },
      { k: 'persen', label: 'Kelengkapan', fmt: function (v) { return h('div', { style: { minWidth: '120px' } }, h('b', { class: 'num' }, v + '%'), UI.progres(v, UI.warnaPersen(v))); } }] });
  }
  function perangkatGuru(daftar) {
    const wajib = (App.master.cfg.perangkat_wajib || []);
    const status = {}; daftar.forEach(function (p) { if (!status[p.jenis] || PRIORITAS[p.status] > PRIORITAS[status[p.jenis]]) status[p.jenis] = p.status; });
    const nOk = wajib.filter(function (j) { return status[j] === 'disetujui'; }).length;
    const cek = UI.kartu({ judul: 'Daftar Periksa Kelengkapan', sub: nOk + ' dari ' + wajib.length + ' perangkat wajib disetujui', ikon: 'checkCircle', warnaIkon: 'ok' },
      h('div', { class: 'col' }, UI.progres(wajib.length ? nOk / wajib.length * 100 : 0, UI.warnaPersen(wajib.length ? nOk / wajib.length * 100 : 0)),
        h('div', { class: 'list mt-s' }, wajib.map(function (j) { return h('div', { class: 'li' }, ic(status[j] === 'disetujui' ? 'checkCircle' : 'clock', 's'), h('span', { class: 'grow' }, j), status[j] ? UI.badge(status[j]) : h('button', { class: 'btn kecil', onclick: function () { formPerangkat({ jenis: j }); } }, ic('upload', 's'), 'Unggah')); }))));
    const kartu = daftar.length ? h('div', { class: 'grid g3' }, daftar.map(function (p) {
      return h('div', { class: 'card dok-kartu' },
        h('div', { class: 'dok-thumb' }, ic(p.tautan && !p.file_id ? 'link' : 'file', 'l'), h('span', { class: 'tag biru' }, p.rombel)),
        h('div', { class: 'row between' }, UI.badge(p.status), h('span', { class: 'xs muted' }, F.relatif(p.diubah_pada))),
        h('b', null, p.jenis), h('div', { class: 'small muted' }, p.mapel + (p.judul && p.judul !== p.jenis ? ' · ' + p.judul : '')),
        p.status === 'revisi' && p.catatan_kepsek ? h('div', { class: 'box warn small' }, h('b', null, 'Catatan revisi: '), p.catatan_kepsek) : null,
        h('div', { class: 'row wrap' }, H.tombolBerkas(p.file_id, p.tautan),
          ['draf', 'revisi'].indexOf(p.status) > -1 ? h('button', { class: 'btn kecil', onclick: function () { formPerangkat(p); } }, ic('edit', 's'), 'Ubah') : null,
          ['draf', 'revisi'].indexOf(p.status) > -1 ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus', onclick: async function (e) { if (await konfirmasi('Hapus perangkat?', p.jenis + ' ' + p.mapel + ' akan dihapus.', { bahaya: true, ya: 'Hapus' })) { const r = await aksi(e.currentTarget, 'perangkat.hapus', { id: p.id }); if (r.ok) Router.jalan(); } } }, ic('trash', 's')) : null));
    })) : UI.kartu({}, UI.kosong('Belum ada perangkat ajar semester ini. Mulai dari daftar periksa di samping.', 'book'));
    return h('div', null, UI.kepala('Perangkat Ajar', 'Unggah per jenis, mapel, dan rombel. Kepala sekolah memeriksa lalu menyetujui atau meminta revisi.', h('button', { class: 'btn pri', onclick: function () { formPerangkat({}); } }, ic('upload', 's'), 'Unggah Perangkat')),
      h('div', { class: 'grid g-main' }, kartu, cek));
  }
  function formPerangkat(p) {
    const wajib = App.master.cfg.perangkat_wajib || [];
    const jenis = UI.chips({ opsi: wajib.concat(['Lainnya']), nilai: p.jenis && wajib.indexOf(p.jenis) < 0 ? 'Lainnya' : (p.jenis || ''), onChange: function (v) { jenisLain.classList.toggle('hide', v !== 'Lainnya'); } });
    const jenisLain = UI.inp({ placeholder: 'Nama jenis perangkat', value: p.jenis && wajib.indexOf(p.jenis) < 0 ? p.jenis : '' }); if (!(p.jenis && wajib.indexOf(p.jenis) < 0)) jenisLain.classList.add('hide');
    const mapel = UI.pilih(H.opsiMapel(), p.mapel || App.me.mapel_utama, { kosong: '— pilih mapel —' });
    const rombel = UI.chips({ opsi: H.opsiRombel(), nilai: p.rombel ? String(p.rombel).split(/,\s*/) : [], multi: true, label: 'Rombel' });
    const judul = UI.inp({ placeholder: 'Mis. Modul Ajar Bab 3 — Teks Eksplanasi', value: p.judul && p.judul !== p.jenis ? p.judul : '' });
    const up = UI.unggah('perangkat', { awal: p.file_id ? [{ file_id: p.file_id, nama: 'Berkas tersimpan' }] : [] });
    const tautan = UI.inp({ type: 'url', placeholder: 'https://docs.google.com/… (opsional, bila tidak mengunggah)', value: p.tautan || '' });
    async function kirim(b, ajukan) {
      const j = jenis.nilai() === 'Lainnya' ? jenisLain.value.trim() : jenis.nilai();
      const r = await aksi(b, 'perangkat.simpan', { id: p.id, jenis: j, mapel: mapel.value, rombel: rombel.nilai().join(', '), judul: judul.value || j, file_id: up.ids()[0] || '', tautan: tautan.value.trim(), ajukan: ajukan }, { proses: ajukan ? 'Mengajukan…' : 'Menyimpan…' });
      if (!r.ok) return false; Router.jalan();
    }
    modal({ judul: p.id ? 'Ubah perangkat ajar' : 'Unggah perangkat ajar', lebar: true, isi: h('div', { class: 'form' }, UI.fld('Jenis perangkat', h('div', { class: 'col' }, jenis, jenisLain), { wajib: true }), h('div', { class: 'form dua' }, UI.fld('Mata pelajaran', mapel, { wajib: true }), UI.fld('Judul (opsional)', judul)), UI.fld('Rombel', rombel, { wajib: true, bantuan: 'Boleh lebih dari satu.' }), UI.fld('Berkas', up), UI.fld('Atau tautan dokumen', tautan)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan draf', onClick: function (b) { return kirim(b, false); } }, { label: 'Ajukan ke kepala sekolah', kelas: 'pri', ikon: 'send', onClick: function (b) { return kirim(b, true); } }] });
  }
  function periksaPerangkat(p) {
    const cat = UI.area({ placeholder: 'Wajib diisi bila meminta revisi' });
    modal({ judul: 'Periksa: ' + p.jenis, sub: p.nama_pegawai + ' · ' + p.mapel + ' · ' + p.rombel, isi: h('div', { class: 'col' }, h('div', { class: 'row' }, H.tombolBerkas(p.file_id, p.tautan, 'Buka dokumen')), UI.fld('Catatan', cat)),
      aksi: [{ label: 'Minta revisi', kelas: 'bahaya', onClick: async function (b) { const r = await aksi(b, 'perangkat.periksa', { id: p.id, keputusan: 'revisi', catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } },
        { label: 'Setujui', kelas: 'ok', ikon: 'check', onClick: async function (b) { const r = await aksi(b, 'perangkat.periksa', { id: p.id, keputusan: 'disetujui', catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } }] });
  }
  window.tombolBukaKunci = function (entitas, id) {
    return h('button', { class: 'btn ghost kecil', title: 'Buka kunci (kepala sekolah)', onclick: async function (e) {
      const alasan = await tanya('Buka kunci data', 'Alasan membuka kunci', { min: 5, ya: 'Buka kunci', bahaya: true, panjang: true, bantuan: 'Tindakan ini tercatat di log aktivitas. Dokumen terbit terkait akan dicabut.' });
      if (!alasan) return; const r = await aksi(e.currentTarget, 'kunci.buka', { entitas: entitas, id: id, alasan: alasan }); if (r.ok) Router.jalan();
    } }, ic('unlock', 's'), 'Buka kunci');
  };

  // ============================================================== REKAP MINGGUAN
  function infoMinggu(n) {
    const smt = App.smtAktif(); if (!smt.tgl_mulai) return 'Minggu ke-' + n;
    const a = new Date(smt.tgl_mulai + 'T12:00:00'); a.setDate(a.getDate() + (n - 1) * 7);
    const b = new Date(a); b.setDate(b.getDate() + 4);
    const f = function (d) { return d.getDate(); };
    return 'Minggu ke-' + n + ' (' + f(a) + '–' + F.tglP(b.toISOString().slice(0, 10)) + ')';
  }
  HAL.rekap = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['rekap.list', {}]], function (daftar) {
      if (hk.rekap_isi) { view.replaceChildren(rekapGuru(view, daftar)); return; }
      const ringkas = {}; daftar.forEach(function (r) { const x = ringkas[r.id_pegawai] || (ringkas[r.id_pegawai] = { nama: r.nama_pegawai, minggu: {}, penuh: 0, total: 0 }); x.minggu[r.minggu_ke] = 1; x.total++; if (r.keterlaksanaan === 'penuh') x.penuh++; });
      view.replaceChildren(UI.kepala('Rekap Mingguan', hk.rekap_lihat_semua ? 'Seluruh rekap guru semester ini.' : 'Rekap guru binaan Anda.'),
        h('div', { class: 'grid g3 tetap2 mb' }, UI.stat({ label: 'Guru mengisi', ikon: 'users', nilai: Object.keys(ringkas).length }), UI.stat({ label: 'Total rekap', ikon: 'clipboard', nilai: daftar.length }), UI.stat({ label: 'Terlaksana penuh', ikon: 'checkCircle', warna: 'ok', nilai: daftar.length ? Math.round(daftar.filter(function (r) { return r.keterlaksanaan === 'penuh'; }).length / daftar.filter(function (r) { return r.keterlaksanaan !== 'libur'; }).length * 100 || 0) + '%' : '–' })),
        UI.tabel({ baris: daftar, placeholder: 'Cari guru, rombel, metode…', kolom: [
          { k: 'nama_pegawai', label: 'Guru', fmt: function (v) { return h('b', null, v); } }, { k: 'minggu_ke', label: 'Minggu' }, { k: 'rombel', label: 'Rombel', fmt: function (v, r) { return h('div', null, v, h('div', { class: 'xs muted' }, r.mapel)); } },
          { k: 'keterlaksanaan', label: 'Keterlaksanaan', fmt: function (v) { return h('span', { class: 'bdg ' + ({ penuh: 'ok', sebagian: 'warn', tidak: 'bad', libur: '' }[v] || '') }, { penuh: 'Penuh', sebagian: 'Sebagian', tidak: 'Tidak terlaksana', libur: 'Libur/Agenda' }[v] || v); } },
          { k: 'metode', label: 'Metode', teks: function (r) { return (r.metode || []).join(', '); }, fmt: function (v) { return h('div', { class: 'row wrap' }, (v || []).map(function (m) { return h('span', { class: 'tag' }, m); })); } },
          { k: 'kendala', label: 'Kendala', teks: function (r) { return (r.kendala || []).join(', ') + ' ' + r.kendala_teks; }, fmt: function (v, r) { return h('span', { class: 'small' }, (v || []).filter(function (x) { return x !== 'Tidak ada'; }).join(', ') + (r.kendala_teks ? ' — ' + r.kendala_teks : '') || '–'); } },
          { k: 'tindak_lanjut', label: 'Tindak lanjut', fmt: function (v) { return h('span', { class: 'small' }, v || '–'); } }] }));
    }, { kerangka: 'daftar' });
  };
  function rekapGuru(view, daftar) {
    const cfg = App.master.cfg, mgKini = (App.beranda && App.beranda.minggu_ke) || 1;
    const KEY = 'rekap';
    let st = { id: '', minggu_ke: mgKini, mapel: App.me.mapel_utama || H.opsiMapel()[0] || '', rombel: [], keterlaksanaan: '', metode: [], kendala: [], kendala_teks: '', tindak_lanjut: '' };
    const draf = H.draf.ambil(KEY); if (draf && draf.minggu_ke) st = Object.assign(st, draf);
    const statusDraf = h('span', { class: 'xs muted row' }, ic('cloud', 's'), draf ? 'Draf lokal dipulihkan (' + new Date(draf._t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ')' : 'Draf tersimpan otomatis di perangkat ini');
    const simpanDraf = function () { view.dataset.kotor = '1'; H.draf.simpan(KEY, st); statusDraf.lastChild.textContent = 'Tersimpan di draf lokal (pukul ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ')'; };
    const sudahIsi = function () { return daftar.filter(function (r) { return Number(r.minggu_ke) === Number(st.minggu_ke) && r.mapel === st.mapel && r.id !== st.id; }).map(function (r) { return r.rombel; }); };
    const minggu = UI.pilih(Array.from({ length: mgKini }, function (_, i) { return { v: mgKini - i, l: infoMinggu(mgKini - i) }; }), st.minggu_ke);
    const mapelCepat = [st.mapel, App.me.mapel_utama].concat(daftar.map(function (r) { return r.mapel; })).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).slice(0, 4);
    const mapel = UI.chips({ opsi: mapelCepat.length ? mapelCepat : H.opsiMapel().slice(0, 4), nilai: st.mapel });
    const mapelLain = UI.pilih(H.opsiMapel().filter(function (m) { return mapelCepat.indexOf(m) < 0; }), '', { kosong: 'Mapel lain…', 'aria-label': 'Mapel lain' });
    mapelLain.addEventListener('change', function () { if (!mapelLain.value) return; st.mapel = mapelLain.value; if (mapelCepat.indexOf(st.mapel) < 0) mapelCepat.unshift(st.mapel); mapelLain.value = ''; const baru = UI.chips({ opsi: mapelCepat.slice(0, 5), nilai: st.mapel }); baru.addEventListener('click', function () { setTimeout(function () { st.mapel = baru.nilai(); simpanDraf(); gambarRombel(); }, 0); }); mapelWrap.replaceChildren(baru, mapelLain); simpanDraf(); gambarRombel(); });
    const mapelWrap = h('div', { class: 'col' }, mapel, mapelLain);
    const rombelWrap = h('div');
    const ket = UI.chips({ kelas: 'besar tegas', opsi: [{ v: 'penuh', l: 'Penuh 100%', i: 'checkCircle' }, { v: 'sebagian', l: 'Sebagian', i: 'clock' }, { v: 'tidak', l: 'Tidak terlaksana', i: 'x' }, { v: 'libur', l: 'Libur / Agenda', i: 'calendar' }], nilai: st.keterlaksanaan, label: 'Keterlaksanaan' });
    const metode = UI.chips({ opsi: cfg.metode_pilihan || [], nilai: st.metode, multi: true, label: 'Metode' });
    const kendala = UI.chips({ opsi: cfg.kendala_pilihan || [], nilai: st.kendala, multi: true, label: 'Kendala' });
    const kendalaTeks = UI.inp({ placeholder: 'Keterangan singkat kendala (opsional)', value: st.kendala_teks, maxlength: 300 });
    const tl = UI.area({ placeholder: 'Mis. 3 siswa izin sakit; materi deklamasi diteruskan pekan depan', value: st.tindak_lanjut, maxlength: 500, style: { minHeight: '72px' } });
    const fldMetode = UI.fld('Metode / model pembelajaran', metode, { wajib: true });
    function gambarRombel() {
      const isi = sudahIsi();
      const ch = UI.chips({ opsi: H.opsiRombel().map(function (r) { return { v: r, l: r + (isi.indexOf(r) > -1 ? ' ✓' : '') }; }), nilai: st.rombel, multi: !st.id, label: 'Rombel', onChange: function (v) { st.rombel = [].concat(v); simpanDraf(); } });
      rombelWrap.replaceChildren(ch, isi.length ? h('div', { class: 'xs muted mt-s' }, '✓ = sudah ada rekap minggu ini untuk ' + st.mapel + '. Pilih lagi untuk menyunting dari riwayat di bawah.') : null);
    }
    function sinkronUI() { minggu.value = st.minggu_ke; mapel.atur(st.mapel); ket.atur(st.keterlaksanaan); metode.atur(st.metode); kendala.atur(st.kendala); kendalaTeks.value = st.kendala_teks || ''; tl.value = st.tindak_lanjut || ''; fldMetode.classList.toggle('hide', st.keterlaksanaan === 'libur'); gambarRombel(); judulForm.textContent = st.id ? 'Sunting rekap' : 'Rekap Keterlaksanaan Mingguan'; }
    minggu.addEventListener('change', function () { st.minggu_ke = Number(minggu.value); simpanDraf(); gambarRombel(); });
    mapel.addEventListener('click', function () { setTimeout(function () { st.mapel = mapel.nilai(); simpanDraf(); gambarRombel(); }, 0); });
    ket.addEventListener('click', function () { setTimeout(function () { st.keterlaksanaan = ket.nilai(); fldMetode.classList.toggle('hide', st.keterlaksanaan === 'libur'); simpanDraf(); }, 0); });
    metode.addEventListener('click', function () { setTimeout(function () { st.metode = metode.nilai(); simpanDraf(); }, 0); });
    kendala.addEventListener('click', function () { setTimeout(function () { st.kendala = kendala.nilai(); simpanDraf(); }, 0); });
    kendalaTeks.addEventListener('input', function () { st.kendala_teks = kendalaTeks.value; simpanDraf(); });
    tl.addEventListener('input', function () { st.tindak_lanjut = tl.value; simpanDraf(); });
    const judulForm = h('h3', null, 'Rekap Keterlaksanaan Mingguan');
    const salin = h('button', { class: 'btn kecil', type: 'button', onclick: function () {
      const sumber = daftar.filter(function (r) { return Number(r.minggu_ke) < Number(st.minggu_ke) && r.mapel === st.mapel; }).sort(function (a, b) { return b.minggu_ke - a.minggu_ke; });
      if (!sumber.length) { toast('Belum ada rekap minggu sebelumnya untuk ' + st.mapel + '.', 'info'); return; }
      const mg = sumber[0].minggu_ke, sm = sumber.filter(function (r) { return r.minggu_ke === mg; });
      Object.assign(st, { id: '', rombel: sm.map(function (r) { return r.rombel; }).filter(function (r) { return sudahIsi().indexOf(r) < 0; }), keterlaksanaan: sm[0].keterlaksanaan, metode: sm[0].metode, kendala: sm[0].kendala, kendala_teks: '', tindak_lanjut: '' });
      sinkronUI(); simpanDraf(); toast('Rekap minggu ke-' + mg + ' disalin. Periksa lalu simpan.', 'ok');
    } }, ic('copy', 's'), 'Salin minggu lalu');
    const btn = h('button', { class: 'btn pri', type: 'button', onclick: async function () {
      if (!st.rombel.length) { toast('Pilih rombel.', 'warn'); return; }
      const r = await aksi(btn, 'rekap.simpan', { id: st.id || undefined, minggu_ke: st.minggu_ke, mapel: st.mapel, rombel_list: st.rombel, keterlaksanaan: st.keterlaksanaan, metode: st.metode, kendala: st.kendala, kendala_teks: st.kendala_teks, tindak_lanjut: st.tindak_lanjut }, { proses: 'Mengirim…', diamGagal: true });
      if (!r.ok) {
        if (r.code === 'DUPLIKAT' && r.data) { toast(r.error, 'warn'); const x = daftar.filter(function (d) { return d.id === r.data.id; })[0]; if (x) muatEdit(x); return; }
        toast(r.error, 'bad'); return;
      }
      H.draf.hapus(KEY); view.dataset.kotor = ''; Router.jalan();
    } }, ic('send', 's'), 'Simpan & Kirim Rekap');
    function muatEdit(x) { Object.assign(st, { id: x.id, minggu_ke: Number(x.minggu_ke), mapel: x.mapel, rombel: [x.rombel], keterlaksanaan: x.keterlaksanaan, metode: x.metode || [], kendala: x.kendala || [], kendala_teks: x.kendala_teks, tindak_lanjut: x.tindak_lanjut }); sinkronUI(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    const form = h('section', { class: 'card' },
      h('div', { class: 'card-h' }, h('div', { class: 'grow' }, h('div', { class: 'row' }, h('span', { class: 'titik', style: { background: 'var(--secondary)' } }), judulForm), h('p', null, 'Pengisian cepat (< 3 menit) untuk bukti keterlaksanaan pembelajaran.')),
        h('span', { class: 'bdg info sembunyi-m' }, ic('clock'), 'Target: 2 menit')),
      h('div', { class: 'form' },
        h('div', { class: 'form dua' }, UI.fld('Pekan', minggu), h('div', { class: 'fld' }, h('span', { class: 'lbl' }, ' '), h('div', { class: 'row' }, salin, st.id ? h('button', { class: 'btn ghost kecil', onclick: function () { st.id = ''; sinkronUI(); } }, 'Batal sunting') : null))),
        UI.fld('Mata pelajaran', mapelWrap, { wajib: true }), UI.fld('Rombongan belajar (kelas)', rombelWrap, { wajib: true, bantuan: 'Pilih beberapa rombel sekaligus bila pelaksanaannya sama.' }),
        UI.fld('Keterlaksanaan materi / modul', ket, { wajib: true }), fldMetode,
        UI.fld('Kendala lapangan', h('div', { class: 'col' }, kendala, kendalaTeks)), UI.fld('Catatan tindak lanjut ringkas', tl)),
      h('div', { class: 'sticky-aksi' }, statusDraf, h('span', { class: 'grow' }), h('button', { class: 'btn ghost', type: 'button', onclick: function () { H.draf.hapus(KEY); view.dataset.kotor = ''; st = { id: '', minggu_ke: mgKini, mapel: st.mapel, rombel: [], keterlaksanaan: '', metode: [], kendala: [], kendala_teks: '', tindak_lanjut: '' }; sinkronUI(); } }, 'Reset'), btn));
    sinkronUI();
    // Riwayat dikelompokkan per minggu
    const perMinggu = {}; daftar.forEach(function (r) { (perMinggu[r.minggu_ke] = perMinggu[r.minggu_ke] || []).push(r); });
    const riwayat = UI.kartu({ judul: 'Riwayat Rekap', sub: daftar.length + ' rekap semester ini', ikon: 'history' },
      Object.keys(perMinggu).length ? h('div', null, Object.keys(perMinggu).sort(function (a, b) { return b - a; }).slice(0, 12).map(function (m, i) {
        return h('details', { class: 'ak', open: i === 0 }, h('summary', null, h('span', null, infoMinggu(m)), h('span', { class: 'bdg ok' }, perMinggu[m].length + ' rombel'), ic('chevD', 's')),
          h('div', { class: 'isi list' }, perMinggu[m].map(function (r) {
            return h('div', { class: 'li' }, h('div', { class: 'grow' }, h('div', { class: 'ttl' }, r.rombel + ' · ' + r.mapel), h('div', { class: 'sub' }, ({ penuh: 'Penuh', sebagian: 'Sebagian', tidak: 'Tidak terlaksana', libur: 'Libur/Agenda' }[r.keterlaksanaan]) + (r.metode.length ? ' · ' + r.metode.join(', ') : '')), r.tindak_lanjut ? h('div', { class: 'xs muted' }, r.tindak_lanjut) : null),
              h('button', { class: 'btn ghost kecil', onclick: function () { muatEdit(r); } }, ic('edit', 's'), 'Sunting'),
              h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus', onclick: async function (e) { if (await konfirmasi('Hapus rekap?', 'Rekap ' + r.rombel + ' minggu ke-' + r.minggu_ke + ' akan dihapus.', { bahaya: true, ya: 'Hapus' })) { const x = await aksi(e.currentTarget, 'rekap.hapus', { id: r.id }); if (x.ok) Router.jalan(); } } }, ic('trash', 's')));
          })));
      })) : UI.kosong('Belum ada rekap. Isi formulir di atas.', 'clipboard'));
    return h('div', { class: 'stack' }, form, riwayat);
  }

  // ============================================================== REFLEKSI BULANAN
  const PERTANYAAN = [['yang_berhasil', 'Apa yang berhasil dalam pembelajaran bulan ini?'], ['yang_perlu_diperbaiki', 'Apa yang perlu diperbaiki?'], ['rencana', 'Apa rencana Anda bulan depan?'], ['dukungan_dibutuhkan', 'Dukungan apa yang Anda butuhkan dari sekolah? (opsional)']];
  HAL.refleksi = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['refleksi.list', {}]], function (d) {
      if (!hk.rekap_isi) {
        view.replaceChildren(UI.kepala('Refleksi Bulanan', hk.rekap_lihat_semua ? 'Refleksi seluruh guru.' : (hk.rekap_binaan ? 'Refleksi guru binaan.' : 'Ringkasan keterisian (isi refleksi hanya untuk kepala sekolah/supervisor).')),
          UI.tabel({ baris: d.daftar, onRow: d.daftar[0] && d.daftar[0].yang_berhasil !== undefined ? function (r) { modal({ judul: 'Refleksi ' + F.bulan(r.bulan), sub: r.nama_pegawai, isi: h('div', { class: 'col' }, PERTANYAAN.map(function (q) { return h('div', { class: 'box' }, h('b', { class: 'small' }, q[1]), h('p', { class: 'mt-s' }, r[q[0]] || '–')); })) }); } : null,
            kolom: [{ k: 'nama_pegawai', label: 'Guru' }, { k: 'bulan', label: 'Bulan', fmt: F.bulan }, { k: 'yang_perlu_diperbaiki', label: 'Perlu diperbaiki', fmt: function (v) { return h('span', { class: 'small' }, v ? String(v).slice(0, 120) : '–'); } }] }));
        return;
      }
      const sudah = d.daftar.map(function (r) { return r.bulan; });
      const smt = App.smtAktif(), bulanOps = [];
      if (smt.tgl_mulai) { const a = new Date(smt.tgl_mulai.slice(0, 7) + '-01T12:00:00'), kini = F.hariIni().slice(0, 7); while (a.toISOString().slice(0, 7) <= (d.bulan_terbuka || kini) && a.toISOString().slice(0, 7) <= smt.tgl_selesai.slice(0, 7)) { const ym = a.getFullYear() + '-' + ('0' + (a.getMonth() + 1)).slice(-2); if (ym < kini || ym === d.bulan_terbuka) bulanOps.push(ym); a.setMonth(a.getMonth() + 1); } }
      const pilihan = bulanOps.reverse();
      const bulan = UI.pilih(pilihan.map(function (b) { return { v: b, l: F.bulan(b) + (sudah.indexOf(b) > -1 ? ' (sudah diisi — sunting)' : '') }; }), pilihan.filter(function (b) { return sudah.indexOf(b) < 0; })[0] || pilihan[0]);
      const f = {}; PERTANYAAN.forEach(function (q) { f[q[0]] = UI.area({ maxlength: 1000, style: { minHeight: '80px' } }); });
      const isiDari = function () { const ada = d.daftar.filter(function (r) { return r.bulan === bulan.value; })[0] || H.draf.ambil('refleksi_' + bulan.value) || {}; PERTANYAAN.forEach(function (q) { f[q[0]].value = ada[q[0]] || ''; }); };
      bulan.addEventListener('change', isiDari);
      PERTANYAAN.forEach(function (q) { f[q[0]].addEventListener('input', function () { view.dataset.kotor = '1'; const o = {}; PERTANYAAN.forEach(function (x) { o[x[0]] = f[x[0]].value; }); H.draf.simpan('refleksi_' + bulan.value, o); }); });
      isiDari();
      const btn = h('button', { class: 'btn pri', onclick: async function () { const o = { bulan: bulan.value }; PERTANYAAN.forEach(function (q) { o[q[0]] = f[q[0]].value; }); const r = await aksi(btn, 'refleksi.simpan', o); if (r.ok) { H.draf.hapus('refleksi_' + bulan.value); view.dataset.kotor = ''; Router.jalan(); } } }, ic('save', 's'), 'Simpan refleksi');
      const form = pilihan.length ? UI.kartu({ judul: 'Refleksi Kinerja Bulanan', sub: 'Dibuka mulai minggu terakhir setiap bulan · empat pertanyaan singkat', ikon: 'message', warnaIkon: 'ind' },
        h('div', { class: 'form' }, UI.fld('Bulan', bulan), PERTANYAAN.map(function (q, i) { return UI.fld((i + 1) + '. ' + q[1], f[q[0]], { wajib: i < 3 }); }), h('div', { class: 'row' }, btn)))
        : UI.kartu({ judul: 'Refleksi belum dibuka', ikon: 'clock' }, h('p', { class: 'muted' }, 'Refleksi bulan ini dibuka mulai minggu terakhir bulan berjalan.'));
      const riwayat = UI.kartu({ judul: 'Riwayat Refleksi', ikon: 'history' }, d.daftar.length ? h('div', null, d.daftar.sort(function (a, b) { return a.bulan < b.bulan ? 1 : -1; }).map(function (r) {
        return h('details', { class: 'ak' }, h('summary', null, h('span', { class: 'titik hijau' }), F.bulan(r.bulan), ic('chevD', 's')), h('div', { class: 'isi col' }, PERTANYAAN.map(function (q) { return r[q[0]] ? h('div', null, h('b', { class: 'small' }, q[1]), h('p', null, r[q[0]])) : null; })));
      })) : UI.kosong('Belum ada refleksi.', 'message'));
      view.replaceChildren(UI.kepala('Refleksi Bulanan', 'Catatan reflektif singkat untuk perbaikan pembelajaran.'), h('div', { class: 'grid g-main' }, form, riwayat));
    }, { kerangka: 'daftar' });
  };

  // ============================================================== TUGAS TAMBAHAN
  HAL.tugas = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['tugas.list', {}]], function (d) {
      const blok = [UI.kepala('Tugas Tambahan & Ekskul', 'Butir isian muncul otomatis sesuai label penugasan Anda semester ini.')];
      if (hk.tugas_isi) {
        const milik = d.daftar.filter(function (x) { return x.id_pegawai === App.me.id_pegawai; });
        blok.push(d.jenis_saya.length ? h('div', { class: 'grid g3 mb' }, d.jenis_saya.map(function (j) {
          const n = milik.filter(function (x) { return x.id_jenis_tugas === j.id; }).length;
          return h('div', { class: 'card col' }, h('div', { class: 'row' }, h('div', { class: 'ikon-kotak' }, ic('briefcase')), h('div', { class: 'grow' }, h('b', null, j.nama), h('div', { class: 'xs muted' }, (j.label_terkait ? 'Label ' + j.label_terkait + ' · ' : '') + 'periode ' + (j.periode || 'bebas')))),
            h('div', { class: 'small muted' }, j.butir_wajib.length + ' butir · ' + n + ' laporan semester ini'), h('button', { class: 'btn pri kecil', onclick: function () { formTugas(j, {}); } }, ic('plus', 's'), 'Isi laporan'));
        })) : UI.kartu({ kelas: 'mb' }, UI.kosong('Tidak ada jenis tugas tambahan untuk label Anda semester ini.', 'briefcase')));
      }
      const lihatSemua = hk.tugas_lihat_semua;
      blok.push(UI.kartu({ judul: lihatSemua ? 'Laporan Seluruh Pegawai' : 'Laporan Saya', ikon: 'list' }, UI.tabel({ baris: d.daftar, kosong: 'Belum ada laporan.', kolom: [
        lihatSemua ? { k: 'nama_pegawai', label: 'Pegawai', fmt: function (v) { return h('b', null, v); } } : null,
        { k: 'nama_tugas', label: 'Tugas' }, { k: 'periode', label: 'Periode', fmt: function (v) { return /^\d{4}-\d{2}$/.test(v) ? F.bulan(v) : v; } },
        { k: 'status', label: 'Status', fmt: function (v) { return UI.badge(v); } }, { k: 'diubah_pada', label: 'Diperbarui', fmt: F.relatif },
        { k: 'id', label: '', urut: false, fmt: function (v, x) {
          const j = d.jenis_saya.filter(function (y) { return y.id === x.id_jenis_tugas; })[0];
          return tombolAksiBaris([h('button', { class: 'btn ghost kecil', onclick: function () { lihatTugas(x, hk.tugas_sahkan && x.status === 'diajukan'); } }, ic('eye', 's'), 'Lihat'),
            x.id_pegawai === App.me.id_pegawai && j && ['draf', 'revisi'].indexOf(x.status) > -1 ? h('button', { class: 'btn kecil', onclick: function () { formTugas(j, x); } }, ic('edit', 's'), 'Ubah') : null,
            hk.buka_kunci && x.status === 'disahkan' ? tombolBukaKunci('Laporan_Tugas_Tambahan', x.id) : null]);
        } }].filter(Boolean) })));
      view.replaceChildren.apply(view, blok);
    }, { kerangka: 'daftar' });
  };
  function formTugas(j, x) {
    const isian = x.isian || {}, kontrol = {}, ups = {};
    const periode = j.periode === 'bulanan' ? UI.inp({ type: 'month', value: x.periode || F.hariIni().slice(0, 7) }) : UI.inp({ value: x.periode || '', placeholder: 'Mis. Semester Ganjil / Oktober 2026' });
    const butir = j.butir_wajib.map(function (b) {
      let el;
      if (b.tipe === 'teks') el = UI.area({ value: isian[b.kode] || '', maxlength: 1000 });
      else if (b.tipe === 'angka') el = UI.inp({ type: 'number', min: 0, value: isian[b.kode] === undefined ? '' : isian[b.kode] });
      else if (b.tipe === 'tanggal') el = UI.inp({ type: 'date', value: isian[b.kode] || '' });
      else if (b.tipe === 'ya_tidak') { el = UI.chips({ opsi: [{ v: 'ya', l: 'Ya' }, { v: 'tidak', l: 'Tidak' }], nilai: isian[b.kode] || '' }); }
      else { el = UI.unggah('tugas', { banyak: true, awal: (x.bukti_file_ids || []).map(function (f) { return { file_id: f, nama: 'Bukti tersimpan' }; }) }); ups[b.kode] = el; }
      kontrol[b.kode] = el;
      return UI.fld(b.label, el, { wajib: b.wajib && b.tipe !== 'berkas' });
    });
    async function kirim(btn, ajukan) {
      const out = {}; let bukti = [];
      j.butir_wajib.forEach(function (b) { const el = kontrol[b.kode]; if (b.tipe === 'berkas') { bukti = bukti.concat(el.ids()); out[b.kode] = el.ids().length ? el.ids().length + ' berkas' : ''; } else out[b.kode] = el.nilai ? el.nilai() : el.value; });
      const r = await aksi(btn, 'tugas.simpan', { id: x.id, id_jenis_tugas: j.id, periode: periode.value, isian: out, bukti_file_ids: bukti, ajukan: ajukan }, { proses: ajukan ? 'Mengajukan…' : 'Menyimpan…' });
      if (!r.ok) return false; Router.jalan();
    }
    modal({ judul: j.nama, sub: 'Jangan menulis nama atau data pribadi siswa.', lebar: true, isi: h('div', { class: 'form' }, UI.fld('Periode', periode, { wajib: true }), butir),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan draf', onClick: function (b) { return kirim(b, false); } }, { label: 'Ajukan', kelas: 'pri', ikon: 'send', onClick: function (b) { return kirim(b, true); } }] });
  }
  function lihatTugas(x, bolehPeriksa) {
    const jenis = (App.master.jenis_tugas || []).filter(function (j) { return j.id === x.id_jenis_tugas; })[0] || { butir_wajib: [] };
    const cat = UI.area({ placeholder: 'Catatan (wajib bila revisi)' });
    modal({ judul: x.nama_tugas + ' — ' + x.periode, sub: x.nama_pegawai, isi: h('div', { class: 'col' },
      jenis.butir_wajib.map(function (b) { return h('div', { class: 'li' }, h('span', { class: 'muted small', style: { width: '45%' } }, b.label), h('b', { class: 'grow' }, String(x.isian[b.kode] === undefined || x.isian[b.kode] === '' ? '–' : x.isian[b.kode]))); }),
      (x.bukti_file_ids || []).length ? h('div', { class: 'row wrap mt-s' }, x.bukti_file_ids.map(function (f, i) { return H.tombolBerkas(f, null, 'Bukti ' + (i + 1)); })) : null,
      x.catatan_kepsek ? h('div', { class: 'box warn small' }, 'Catatan: ' + x.catatan_kepsek) : null, bolehPeriksa ? UI.fld('Catatan kepala sekolah', cat) : null),
      aksi: bolehPeriksa ? [{ label: 'Minta revisi', kelas: 'bahaya', onClick: async function (b) { const r = await aksi(b, 'tugas.periksa', { id: x.id, keputusan: 'revisi', catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } }, { label: 'Sahkan', kelas: 'ok', ikon: 'check', onClick: async function (b) { const r = await aksi(b, 'tugas.periksa', { id: x.id, keputusan: 'disahkan', catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } }] : [{ label: 'Tutup' }] });
  }

  // ============================================================== KINERJA TENDIK
  HAL.kinerja = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['tendik.list', {}]], function (d) {
      view.replaceChildren(UI.kepala('Kinerja Tenaga Kependidikan', 'Rencana dan realisasi tugas per periode beserta bukti; kepala sekolah memberi catatan dan mengesahkan.', hk.tendik_isi ? h('button', { class: 'btn pri', onclick: function () { formKinerja({}); } }, ic('plus', 's'), 'Tambah laporan') : null),
        UI.tabel({ baris: d, kosong: 'Belum ada laporan kinerja.', kolom: [
          hk.tendik_lihat_semua ? { k: 'nama_pegawai', label: 'Tendik', fmt: function (v) { return h('b', null, v); } } : null,
          { k: 'periode', label: 'Periode', fmt: function (v) { return /^\d{4}-\d{2}$/.test(v) ? F.bulan(v) : v; } }, { k: 'uraian_tugas', label: 'Uraian tugas', fmt: function (v) { return h('span', { class: 'small' }, String(v).slice(0, 140)); } },
          { k: 'target', label: 'Target' }, { k: 'realisasi', label: 'Realisasi', fmt: function (v) { return h('span', { class: 'small' }, v || '–'); } },
          { k: 'status', label: 'Status', fmt: function (v) { return UI.badge(v); } },
          { k: 'id', label: '', urut: false, fmt: function (v, x) { return tombolAksiBaris([(x.bukti_file_ids || []).length ? H.tombolBerkas(x.bukti_file_ids[0], null, 'Bukti') : null,
            x.id_pegawai === App.me.id_pegawai && ['draf', 'revisi'].indexOf(x.status) > -1 ? h('button', { class: 'btn kecil', onclick: function () { formKinerja(x); } }, ic('edit', 's'), 'Ubah') : null,
            hk.tendik_sahkan && x.status === 'diajukan' ? h('button', { class: 'btn pri kecil', onclick: function () { periksaKinerja(x); } }, 'Periksa') : null,
            hk.buka_kunci && x.status === 'disahkan' ? tombolBukaKunci('Kinerja_Tendik', x.id) : null]); } }].filter(Boolean) }));
    }, { kerangka: 'daftar' });
  };
  function formKinerja(x) {
    const per = UI.inp({ type: 'month', value: x.periode || F.hariIni().slice(0, 7) }), ur = UI.area({ value: x.uraian_tugas || '' }), tg = UI.inp({ value: x.target || '', placeholder: 'Mis. 100 surat terarsip' }), rl = UI.area({ value: x.realisasi || '', placeholder: 'Mis. 96 surat terarsip; 4 menunggu tanda tangan' });
    const up = UI.unggah('tendik', { banyak: true, awal: (x.bukti_file_ids || []).map(function (f) { return { file_id: f, nama: 'Bukti tersimpan' }; }) });
    const kirim = async function (b, aj) { const r = await aksi(b, 'tendik.simpan', { id: x.id, periode: per.value, uraian_tugas: ur.value, target: tg.value, realisasi: rl.value, bukti_file_ids: up.ids(), ajukan: aj }); if (!r.ok) return false; Router.jalan(); };
    modal({ judul: x.id ? 'Ubah laporan kinerja' : 'Laporan kinerja baru', lebar: true, isi: h('div', { class: 'form' }, UI.fld('Periode', per, { wajib: true }), UI.fld('Uraian tugas', ur, { wajib: true }), h('div', { class: 'form dua' }, UI.fld('Target', tg, { wajib: true }), UI.fld('Realisasi', rl)), UI.fld('Bukti', up)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan draf', onClick: function (b) { return kirim(b, false); } }, { label: 'Ajukan', kelas: 'pri', ikon: 'send', onClick: function (b) { return kirim(b, true); } }] });
  }
  function periksaKinerja(x) {
    const cat = UI.area({ placeholder: 'Catatan penilai' });
    modal({ judul: 'Periksa kinerja · ' + x.nama_pegawai, sub: 'Periode ' + x.periode, isi: h('div', { class: 'col' }, h('div', { class: 'box' }, h('b', { class: 'small' }, 'Uraian'), h('p', null, x.uraian_tugas)), h('div', { class: 'form dua' }, h('div', { class: 'box' }, h('b', { class: 'small' }, 'Target'), h('p', null, x.target)), h('div', { class: 'box' }, h('b', { class: 'small' }, 'Realisasi'), h('p', null, x.realisasi))), h('div', { class: 'row wrap' }, (x.bukti_file_ids || []).map(function (f, i) { return H.tombolBerkas(f, null, 'Bukti ' + (i + 1)); })), UI.fld('Catatan penilai', cat)),
      aksi: [{ label: 'Minta revisi', kelas: 'bahaya', onClick: async function (b) { const r = await aksi(b, 'tendik.periksa', { id: x.id, keputusan: 'revisi', catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } }, { label: 'Sahkan', kelas: 'ok', ikon: 'check', onClick: async function (b) { const r = await aksi(b, 'tendik.periksa', { id: x.id, keputusan: 'disahkan', catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } }] });
  }

  // ============================================================== PKB & PORTOFOLIO
  HAL.pkb = function (view) {
    const hk = App.me.hak, tahun = F.hariIni().slice(0, 4);
    let tab = 'pkb';
    tampilkan(view, [['pkb.list', {}], ['portofolio.list', {}]], function (pkb, porto) {
      const isi = h('div');
      function gambar() {
        if (tab === 'pkb') {
          const milik = pkb.daftar.filter(function (k) { return k.id_pegawai === App.me.id_pegawai; });
          const jpTahun = milik.filter(function (k) { return String(k.tanggal).slice(0, 4) === tahun; }).reduce(function (a, k) { return a + Number(k.jp || 0); }, 0);
          isi.replaceChildren(
            hk.pkb_isi ? h('div', { class: 'grid g3 tetap2 mb' }, UI.stat({ label: 'JP tahun ' + tahun, ikon: 'graduation', nilai: F.angka(jpTahun, 0), satuan: 'JP' }), UI.stat({ label: 'Kegiatan saya', ikon: 'list', warna: 'ind', nilai: milik.length })) : null,
            hk.pkb_lihat_semua ? UI.kartu({ judul: 'Rekap JP per Pegawai', ikon: 'users', kelas: 'mb' }, UI.tabel({ baris: pkb.rekap, cari: true, kolom: [{ k: 'nama', label: 'Nama' }, { k: 'kegiatan', label: 'Kegiatan' }, { k: 'jp', label: 'Total JP', fmt: function (v) { return h('b', { class: 'num' }, F.angka(v, 0)); } }] })) : null,
            UI.kartu({ judul: hk.pkb_lihat_semua ? 'Semua Kegiatan' : 'Kegiatan Saya', ikon: 'graduation' }, UI.tabel({ baris: hk.pkb_lihat_semua ? pkb.daftar : milik, kosong: 'Belum ada kegiatan PKB.', kolom: [
              hk.pkb_lihat_semua ? { k: 'nama_pegawai', label: 'Pegawai' } : null, { k: 'tanggal', label: 'Tanggal', fmt: F.tglP }, { k: 'jenis', label: 'Jenis', fmt: function (v) { return h('span', { class: 'tag biru' }, v); } },
              { k: 'judul', label: 'Judul', fmt: function (v, k) { return h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, k.penyelenggara || '')); } }, { k: 'jp', label: 'JP' },
              { k: 'id', label: '', urut: false, fmt: function (v, k) { return tombolAksiBaris([H.tombolBerkas(k.sertifikat_file_id, null, 'Sertifikat'), k.id_pegawai === App.me.id_pegawai ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Ubah', onclick: function () { formPkb(k); } }, ic('edit', 's')) : null, k.id_pegawai === App.me.id_pegawai ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus', onclick: async function (e) { if (await konfirmasi('Hapus kegiatan?', k.judul, { bahaya: true, ya: 'Hapus' })) { const r = await aksi(e.currentTarget, 'pkb.hapus', { id: k.id }); if (r.ok) Router.jalan(); } } }, ic('trash', 's')) : null]); } }].filter(Boolean) })));
        } else {
          const daftar = hk.pkb_lihat_semua ? porto : porto.filter(function (k) { return k.id_pegawai === App.me.id_pegawai; });
          isi.replaceChildren(daftar.length ? h('div', { class: 'grid g3' }, daftar.map(function (k) {
            return h('div', { class: 'card col' }, h('div', { class: 'row' }, h('span', { class: 'tag biru' }, k.kategori), k.id_indikator_terkait ? h('span', { class: 'bdg ind' }, ic('link'), 'Terhubung indikator') : null), h('b', null, k.judul), hk.pkb_lihat_semua ? h('div', { class: 'xs muted' }, k.nama_pegawai) : null, h('p', { class: 'small muted' }, k.deskripsi || ''),
              h('div', { class: 'row wrap' }, H.tombolBerkas(k.file_id, k.tautan), k.id_pegawai === App.me.id_pegawai ? h('button', { class: 'btn ghost kecil', onclick: function () { formPorto(k); } }, ic('edit', 's'), 'Ubah') : null));
          })) : UI.kartu({}, UI.kosong('Belum ada portofolio.', 'award')));
        }
      }
      view.replaceChildren(UI.kepala('PKB & Portofolio', 'Pelatihan, komunitas belajar, publikasi, dan karya. Portofolio yang ditautkan ke indikator otomatis masuk repositori bukti.',
        hk.pkb_isi ? [h('button', { class: 'btn', onclick: function () { formPorto({}); } }, ic('award', 's'), 'Tambah portofolio'), h('button', { class: 'btn pri', onclick: function () { formPkb({}); } }, ic('plus', 's'), 'Catat kegiatan PKB')] : null),
        UI.tabs([{ id: 'pkb', label: 'Pengembangan Profesi', ikon: 'graduation' }, { id: 'porto', label: 'Portofolio', ikon: 'award' }], tab, function (t) { tab = t; gambar(); }), isi);
      gambar();
    }, { kerangka: 'daftar' });
  };
  function formPkb(k) {
    const jenis = UI.pilih(App.master.cfg.pkb_jenis || [], k.jenis), judul = UI.inp({ value: k.judul || '' }), peny = UI.inp({ value: k.penyelenggara || '' }), tgl = UI.inp({ type: 'date', value: k.tanggal || F.hariIni() }), jp = UI.inp({ type: 'number', min: 0, max: 500, value: k.jp || '' });
    const up = UI.unggah('pkb', { label: 'Unggah sertifikat', awal: k.sertifikat_file_id ? [{ file_id: k.sertifikat_file_id, nama: 'Sertifikat tersimpan' }] : [] });
    modal({ judul: k.id ? 'Ubah kegiatan PKB' : 'Catat kegiatan PKB', isi: h('div', { class: 'form' }, h('div', { class: 'form dua' }, UI.fld('Jenis', jenis, { wajib: true }), UI.fld('Tanggal', tgl, { wajib: true })), UI.fld('Judul kegiatan', judul, { wajib: true }), h('div', { class: 'form dua' }, UI.fld('Penyelenggara', peny), UI.fld('Jumlah JP', jp)), UI.fld('Sertifikat', up)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'pkb.simpan', { id: k.id, jenis: jenis.value, judul: judul.value, penyelenggara: peny.value, tanggal: tgl.value, jp: jp.value, sertifikat_file_id: up.ids()[0] || '' }); if (!r.ok) return false; Router.jalan(); } }] });
  }
  function formPorto(k) {
    const kat = UI.pilih(['Karya inovatif', 'Publikasi', 'Media pembelajaran', 'Praktik baik', 'Prestasi'], k.kategori), judul = UI.inp({ value: k.judul || '' }), des = UI.area({ value: k.deskripsi || '' }), tautan = UI.inp({ type: 'url', value: k.tautan || '', placeholder: 'https://…' });
    const ind = UI.pilih(H.opsiIndikator(), k.id_indikator_terkait, { kosong: '— tidak ditautkan —' });
    const up = UI.unggah('portofolio', { awal: k.file_id ? [{ file_id: k.file_id, nama: 'Berkas tersimpan' }] : [] });
    modal({ judul: k.id ? 'Ubah portofolio' : 'Tambah portofolio', lebar: true, isi: h('div', { class: 'form' }, h('div', { class: 'form dua' }, UI.fld('Kategori', kat), UI.fld('Judul', judul, { wajib: true })), UI.fld('Deskripsi', des), UI.fld('Berkas', up), UI.fld('Atau tautan', tautan), UI.fld('Indikator mutu terkait', ind, { bantuan: 'Bila dipilih, portofolio otomatis masuk repositori bukti indikator tersebut.' })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, k.id ? { label: 'Hapus', kelas: 'bahaya', onClick: async function (b) { const r = await aksi(b, 'portofolio.hapus', { id: k.id }); if (!r.ok) return false; Router.jalan(); } } : null, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'portofolio.simpan', { id: k.id, kategori: kat.value, judul: judul.value, deskripsi: des.value, file_id: up.ids()[0] || '', tautan: tautan.value, id_indikator_terkait: ind.value }); if (!r.ok) return false; Router.jalan(); } }].filter(Boolean) });
  }
})();

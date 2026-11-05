/* SIGURU MUTU — hal-umum.js: helper halaman, Beranda per peran, Profil, Verifikasi (publik), Log. */
window.HAL = window.HAL || {};
window.H = (function () {
  'use strict';
  return {
    opsiPegawai: function (filter) { return ((App.master && App.master.pegawai) || []).filter(function (p) { return p.aktif !== 'tidak' && (!filter || filter(p)); }).map(function (p) { return { v: p.id, l: p.nama + (p.jabatan ? ' — ' + p.jabatan : '') }; }); },
    opsiMapel: function () { return ((App.master && App.master.mapel) || []).filter(function (m) { return m.aktif !== 'tidak'; }).map(function (m) { return m.nama; }); },
    opsiRombel: function () { return ((App.master && App.master.rombel) || []).filter(function (m) { return m.aktif !== 'tidak'; }).map(function (m) { return m.nama; }); },
    opsiIndikator: function () {
      const st = {}; ((App.master && App.master.standar) || []).forEach(function (s) { st[s.id] = s; });
      return ((App.master && App.master.indikator) || []).filter(function (i) { return i.aktif === 'ya'; }).map(function (i) { return { v: i.id, l: i.kode + ' · ' + i.indikator + (st[i.id_standar] ? ' (' + st[i.id_standar].nama + ')' : '') }; });
    },
    tombolBerkas: function (fileId, url, label) {
      if (!fileId && !url) return null;
      return h('button', { type: 'button', class: 'btn kecil', onclick: function () { if (!fileId && url) window.open(url, '_blank', 'noopener'); else UI.bukaBerkas(fileId); } }, ic(url && !fileId ? 'external' : 'eye', 's'), label || 'Lihat');
    },
    kategori: function (v) {
      const c = (App.master && App.master.cfg) || {}, hj = Number(c.ambang_hijau || 100), kn = Number(c.ambang_kuning || 75);
      if (v === '' || v === null || v === undefined) return { label: 'Belum dipetakan', warna: 'abu' };
      return v >= hj ? { label: 'Memenuhi', warna: 'hijau' } : v >= kn ? { label: 'Perlu Perbaikan', warna: 'kuning' } : { label: 'Belum Memenuhi', warna: 'merah' };
    },
    WARNA: { hijau: '#16A34A', kuning: '#CA8A04', merah: '#DC2626', abu: '#94A3B8' },
    tglWaktu: function (iso) { return F.tglP(iso) + (F.jam(iso) ? ' · ' + F.jam(iso) : ''); },
    /** Draf formulir di localStorage (PRD 6.4: tidak hilang saat sinyal putus). */
    draf: {
      kunci: function (k) { return 'sg_draf_' + (App.me ? App.me.akun : 'x') + '_' + k; },
      ambil: function (k) { return LS.get(H.draf.kunci(k)); },
      simpan: function (k, v) { LS.set(H.draf.kunci(k), Object.assign({ _t: Date.now() }, v)); },
      hapus: function (k) { LS.del(H.draf.kunci(k)); }
    }
  };
})();

// ================================================================ BERANDA
HAL.beranda = function (view) {
  tampilkan(view, [['beranda', {}]], function (b) {
    App.beranda = b;
    const hk = App.me.hak, isi = [];
    if (App.me.darurat) { view.replaceChildren(UI.kepala('Akses Darurat', 'Gunakan untuk memulihkan akun admin.'), UI.kartu({ judul: 'Langkah pemulihan', ikon: 'key' }, h('ol', null, h('li', null, 'Buka Pengaturan → Akun.'), h('li', null, 'Reset sandi akun kepala sekolah atau operator.'), h('li', null, 'Keluar, lalu masuk dengan akun tersebut.')))); return; }
    if (hk.is_guru) isi.push(berandaGuru(b));
    else if (hk.dashboard_mutu) isi.push(berandaPimpinan(b));
    else if (hk.dashboard_ringkasan) isi.push(berandaPimpinan(b, true));
    else isi.push(berandaTendik(b));
    if (hk.dashboard_mutu && hk.is_guru) isi.push(h('div', { class: 'mt' }, UI.kartu({ judul: 'Ringkasan mutu sekolah', sub: 'Anda anggota Tim Mutu/Auditor', ikon: 'layers', aksi: h('a', { class: 'btn kecil', href: '#/mutu' }, 'Buka dashboard', ic('chevR', 's')) }, kartuStandar(b.mutu))));
    view.replaceChildren.apply(view, isi);
  });
};

function heroBeranda(o) {
  return h('section', { class: 'hero' + (o.gelap ? ' gelap' : '') },
    h('div', { class: 'grow', style: { zIndex: 1 } }, h('span', { class: 'pill' }, o.pill), h('h1', null, o.judul), h('p', null, o.teks), o.aksi ? h('div', { class: 'row wrap mt' }, o.aksi) : null),
    o.samping ? h('div', { class: 'hero-side' }, o.samping) : null);
}
function berandaGuru(b) {
  const k = b.kelengkapan || { persen: 0, perangkat: { wajib: [], disetujui: [], kurang: [] }, rekap: {}, refleksi: {}, tugas: {} };
  const kiri = [], kanan = [];
  const aksi = [h('a', { class: 'btn putih', href: '#/rekap' }, ic('edit', 's'), k.rekap.minggu_ini_terisi ? 'Lihat Rekap Pekan Ini' : 'Isi Rekap Pekan Ini')];
  if (b.jadwal_saya) aksi.push(h('span', { class: 'btn kaca' }, ic('calendar', 's'), 'Supervisi terjadwal: ' + F.tglP(b.jadwal_saya.tanggal)));
  const hero = heroBeranda({
    pill: 'Minggu ke-' + b.minggu_ke + ' · Semester ' + b.semester,
    judul: F.sapa() + ', ' + App.me.nama,
    teks: 'Kelengkapan administrasi Anda ' + k.persen + '%: ' + k.perangkat.disetujui.length + ' dari ' + k.perangkat.wajib.length + ' perangkat wajib disetujui, rekap terisi ' + k.rekap.minggu_terisi + ' dari ' + k.rekap.minggu_berjalan + ' minggu.',
    aksi: aksi,
    samping: [UI.cincin(k.persen, { label: 'lengkap' }), h('div', null, h('small', null, 'Kesiapan administrasi'), h('b', null, k.persen >= 100 ? 'Lengkap' : k.persen >= 75 ? 'Hampir lengkap' : 'Perlu dilengkapi'), h('div', { class: 'xs', style: { opacity: .8 } }, (k.perangkat.kurang.length ? 'Kurang: ' + k.perangkat.kurang.join(', ') : 'Perangkat wajib lengkap')))]
  });
  // Rekap minggu ini
  kiri.push(UI.kartu({ judul: 'Rekap Mingguan', sub: 'Pengisian cepat (< 3 menit) — minggu ke-' + b.minggu_ke, ikon: 'clipboard', aksi: h('a', { class: 'btn pri kecil', href: '#/rekap' }, ic('edit', 's'), 'Isi sekarang') },
    b.rekap_minggu_ini && b.rekap_minggu_ini.length ? h('div', { class: 'col' }, h('div', { class: 'row wrap' }, b.rekap_minggu_ini.map(function (r) { return h('span', { class: 'bdg ok' }, ic('check'), r); })), h('p', { class: 'small muted' }, 'Rombel lain bisa ditambahkan dengan menyalin rekap ini.'))
      : h('div', { class: 'box warn row' }, ic('alert'), h('span', null, 'Rekap minggu ini belum diisi. Ketuk "Isi sekarang" — Anda bisa menyalin rekap minggu lalu.'))));
  // Perangkat ajar
  const pa = b.perangkat || [];
  kiri.push(UI.kartu({ judul: 'Perangkat Ajar & Modul Semester', sub: 'Dokumen kurikulum aktif Anda', ikon: 'book', aksi: h('a', { class: 'link', href: '#/perangkat' }, 'Lihat semua', ic('chevR', 's')) },
    pa.length ? h('div', { class: 'grid g4 tetap2' }, pa.slice(0, 4).map(function (p) {
      return h('a', { class: 'card flat hover dok-kartu', href: '#/perangkat', style: { padding: '12px', color: 'inherit' } },
        h('div', { class: 'dok-thumb' }, ic('file', 'l'), h('span', { class: 'tag biru' }, p.rombel)),
        UI.badge(p.status), h('b', { class: 'trunc' }, p.jenis), h('span', { class: 'xs muted trunc' }, p.mapel), h('span', { class: 'xs muted' }, 'Diperbarui ' + F.relatif(p.diubah_pada)));
    })) : UI.kosong('Belum ada perangkat ajar semester ini.', 'book')));
  // Binaan (supervisor)
  if (b.binaan && b.binaan.length) kiri.push(kartuBinaan(b.binaan));
  // Kanan
  kanan.push(UI.kartu({ judul: 'Kelengkapan Saya', ikon: 'checkCircle', warnaIkon: 'ok' }, h('div', { class: 'col gap-lg' },
    baris('Perangkat ajar disetujui', k.perangkat.disetujui.length, k.perangkat.wajib.length),
    baris('Rekap mingguan', k.rekap.minggu_terisi, k.rekap.minggu_berjalan),
    baris('Refleksi bulanan', k.refleksi.terisi, k.refleksi.wajib),
    k.tugas.wajib ? baris('Laporan tugas tambahan', k.tugas.terisi, k.tugas.wajib) : null)));
  const sup = b.hasil_terbaru;
  kanan.push(UI.kartu({ judul: 'Supervisi Akademik', ikon: 'userCheck', warnaIkon: 'ind' }, h('div', { class: 'col' },
    b.jadwal_saya ? h('div', { class: 'box biru row' }, ic('calendar'), h('div', null, h('b', null, 'Terjadwal ' + F.tgl(b.jadwal_saya.tanggal)), h('div', { class: 'xs muted' }, 'Supervisor: ' + b.jadwal_saya.supervisor + (b.jadwal_saya.rombel ? ' · ' + b.jadwal_saya.rombel : '')))) : null,
    sup ? h('a', { class: 'box row', href: '#/supervisi/hasil/' + sup.id, style: { color: 'inherit' } }, h('div', { class: 'grow' }, h('div', { class: 'xs muted' }, 'Hasil terakhir · ' + F.tglP(sup.tanggal)), h('b', { class: 'num', style: { fontSize: '22px' } }, F.angka(sup.nilai, 2)), ' ', h('span', { class: 'small' }, sup.predikat)), sup.sudah_tanggapan ? UI.badge('selesai') : h('span', { class: 'bdg warn' }, 'Beri tanggapan'))
      : h('p', { class: 'small muted' }, 'Belum ada hasil supervisi yang disahkan.'))));
  if (b.tugas_belum && b.tugas_belum.length) kanan.push(UI.kartu({ judul: 'Tugas Tambahan', ikon: 'briefcase', warnaIkon: 'warn' }, h('div', { class: 'list' }, b.tugas_belum.map(function (t) { return h('a', { class: 'li klik', href: '#/tugas' }, ic('alert', 's'), h('span', { class: 'grow' }, t.nama), ic('chevR', 's')); }))));
  if (b.rtl_saya && b.rtl_saya.length) kanan.push(kartuRtlSaya(b.rtl_saya));
  if (b.refleksi_terbuka) kanan.push(h('a', { class: 'card hover row', href: '#/refleksi', style: { color: 'inherit' } }, h('div', { class: 'ikon-kotak ind' }, ic('message')), h('div', { class: 'grow' }, h('b', null, 'Refleksi ' + F.bulan(b.refleksi_terbuka)), h('div', { class: 'small muted' }, 'Empat pertanyaan singkat, sudah dibuka.')), ic('chevR')));
  return h('div', { class: 'stack' }, hero, h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, kiri), h('div', { class: 'stack' }, kanan)));
}
function baris(label, a, b) {
  const p = b ? Math.round(a / b * 100) : 0;
  return h('div', { class: 'col', style: { gap: '6px' } }, h('div', { class: 'row between small' }, h('span', null, label), h('b', { class: 'num' }, b ? a + '/' + b : '–')), UI.progres(p, b ? UI.warnaPersen(p) : ''));
}
function kartuBinaan(binaan) {
  return UI.kartu({ judul: 'Guru Binaan Saya', sub: 'Supervisi semester ini', ikon: 'users', aksi: h('a', { class: 'link', href: '#/supervisi' }, 'Jadwal', ic('chevR', 's')) },
    h('div', { class: 'list' }, binaan.map(function (g) {
      return h('div', { class: 'li lipat' }, UI.ava(g.nama, 's'), h('div', { class: 'grow' }, h('div', { class: 'ttl' }, g.nama), h('div', { class: 'sub' }, g.tanggal ? 'Jadwal ' + F.tglP(g.tanggal) : 'Belum dijadwalkan')),
        UI.badge(g.status), g.id_jadwal && ['terjadwal', 'draf', 'dikembalikan'].indexOf(g.status) > -1 ? h('a', { class: 'btn pri kecil', href: '#/supervisi/nilai/' + g.id_jadwal }, ic('edit', 's'), 'Nilai') : null);
    })));
}
function kartuRtlSaya(rtl) {
  return UI.kartu({ judul: 'RTL Saya (PIC)', ikon: 'flag', warnaIkon: 'bad', aksi: h('a', { class: 'link', href: '#/temuan' }, 'Kelola', ic('chevR', 's')) },
    h('div', { class: 'list' }, rtl.map(function (r) { return h('a', { class: 'li klik', href: '#/temuan', style: { color: 'inherit' } }, h('div', { class: 'grow' }, h('div', { class: 'ttl small' }, r.tindakan), h('div', { class: 'sub' }, (r.kode || '') + ' · tenggat ' + F.tglP(r.tenggat))), UI.badge(r.status, 'rtl')); })));
}
function kartuStandar(m) {
  if (!m || !m.standar || !m.standar.length) return UI.kosong('Standar mutu belum ditetapkan.', 'layers');
  return h('div', { class: 'grid g2' }, m.standar.map(function (s) {
    const kls = UI.kelasWarna(s.warna);
    return h('a', { class: 'box std-kartu', href: '#/spmi/memetakan', style: { color: 'inherit' } },
      h('div', { class: 'atas' }, h('span', { class: 'titik ' + s.warna }), h('b', { class: 'grow' }, s.nama), h('b', { class: 'num', style: { color: s.warna === 'abu' ? 'var(--text-2)' : H.WARNA[s.warna] } }, F.persen(s.capaian))),
      h('div', { class: 'row between xs muted' }, h('span', null, s.terpetakan + '/' + s.total + ' indikator terpetakan'), UI.badge(s.warna)),
      UI.progres(s.capaian === '' ? 0 : s.capaian, kls));
  }));
}
function berandaPimpinan(b, ringkas) {
  const m = b.mutu || { standar: [], jumlah: {}, tahap: [], rtl: {}, supervisi: {}, admin: {} }, kat = H.kategori(m.indeks);
  const sup = m.supervisi || {}, adm = m.admin || {}, rtl = m.rtl || {}, tahapAktif = (m.tahap || [])[m.tahap_aktif] || {};
  const aksi = [h('a', { class: 'btn putih', href: '#/mutu' }, ic('dashboard', 's'), 'Buka Dashboard Mutu')];
  if (b.menunggu && b.menunggu.supervisi) aksi.push(h('a', { class: 'btn kaca', href: '#/supervisi' }, ic('userCheck', 's'), b.menunggu.supervisi + ' menunggu pengesahan'));
  else if (!ringkas) aksi.push(h('a', { class: 'btn kaca', href: '#/laporan' }, ic('chart', 's'), 'Laporan'));
  const hero = heroBeranda({
    gelap: true, pill: 'Siklus mutu · Semester ' + b.semester,
    judul: (ringkas ? 'Selamat datang, ' : F.sapa() + ', ') + App.me.nama,
    teks: 'Tahap SPMI berjalan: ' + ((m.tahap_aktif || 0) + 1) + '. ' + (tahapAktif.nama || '-') + '. ' + (m.jumlah.hijau || 0) + ' dari ' + (m.jumlah.indikator || 0) + ' indikator memenuhi target; ' + (rtl.terbuka || 0) + ' RTL masih terbuka.',
    aksi: aksi,
    samping: [UI.cincin(m.indeks, { label: 'indeks' }), h('div', null, h('small', null, 'Indeks mutu internal'), h('b', null, kat.label), h('div', { class: 'xs', style: { opacity: .85 } }, m.standar.filter(function (s) { return s.warna === 'hijau'; }).length + ' dari ' + m.standar.length + ' standar memenuhi'))]
  });
  const stats = h('div', { class: 'grid g4 tetap2' },
    UI.stat({ label: 'Indikator memenuhi', ikon: 'target', warna: 'ok', nilai: (m.jumlah.hijau || 0), satuan: '/ ' + (m.jumlah.indikator || 0), sub: (m.jumlah.abu || 0) + ' belum dipetakan', klik: function () { Router.go('/spmi/memetakan'); } }),
    UI.stat({ label: 'Supervisi disahkan', ikon: 'userCheck', warna: 'ind', nilai: sup.disahkan || 0, satuan: '/ ' + (sup.guru_total || 0) + ' guru', sub: sup.rata !== '' && sup.rata !== undefined ? 'Rata-rata ' + F.angka(sup.rata, 2) : 'Belum ada nilai', klik: function () { Router.go('/supervisi'); } }),
    UI.stat({ label: 'Kelengkapan administrasi', ikon: 'book', nilai: F.angka(adm.rata_kelengkapan || 0, 0) + '%', sub: (adm.rekap_minggu_ini || 0) + '/' + (adm.guru_total || 0) + ' guru isi rekap minggu ini', klik: ringkas ? null : function () { Router.go('/perangkat'); } }),
    UI.stat({ label: 'RTL terbuka', ikon: 'hourglass', warna: rtl.terlambat ? 'bad' : 'warn', nilai: rtl.terbuka || 0, sub: rtl.terlambat ? rtl.terlambat + ' terlambat' : 'Tidak ada keterlambatan', subKelas: rtl.terlambat ? 'small' : 'small', klik: function () { Router.go('/temuan'); } }));
  const kiri = [UI.kartu({ judul: 'Capaian per Standar Mutu', sub: 'Rata-rata berbobot rasio indikator · warna dari ambang di Pengaturan', ikon: 'layers', aksi: h('a', { class: 'link', href: '#/spmi' }, 'SPMI 6 tahap', ic('chevR', 's')) }, kartuStandar(m))];
  if (b.supervisi_terbaru && b.supervisi_terbaru.length) kiri.push(UI.kartu({ judul: 'Supervisi Terbaru', sub: 'Semester berjalan', ikon: 'userCheck', aksi: h('a', { class: 'link', href: '#/supervisi' }, 'Semua', ic('chevR', 's')) },
    UI.tabel({ cari: false, per: 6, baris: b.supervisi_terbaru, onRow: function (x) { Router.go('/supervisi/hasil/' + x.id); }, kolom: [
      { k: 'nama', label: 'Guru', fmt: function (v, x) { return h('div', { class: 'row' }, UI.ava(v, 's'), h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, x.nip || ''))); } },
      { k: 'mapel', label: 'Mapel', fmt: function (v, x) { return h('div', null, v || '–', h('div', { class: 'xs muted' }, x.rombel || '')); } },
      { k: 'tanggal', label: 'Tanggal', fmt: function (v) { return F.tglP(v); } },
      { k: 'nilai', label: 'Nilai', fmt: function (v, x) { return v === '' ? '–' : h('b', { class: 'num' }, F.angka(v, 2), h('div', { class: 'xs muted' }, x.predikat)); } },
      { k: 'status', label: 'Status', fmt: function (v) { return UI.badge(v); } }] })));
  const kanan = [];
  if (b.menunggu && !ringkas) {
    const mm = b.menunggu, it = [['userCheck', 'Hasil supervisi', mm.supervisi, '/supervisi'], ['book', 'Perangkat ajar', mm.perangkat, '/perangkat'], ['briefcase', 'Tugas tambahan', mm.tugas, '/tugas'], ['activity', 'Kinerja tendik', mm.tendik, '/kinerja'], ['sparkle', 'Usulan standar/indikator', mm.usulan_spmi, '/spmi/menetapkan']];
    kanan.push(UI.kartu({ judul: 'Menunggu Tindakan Anda', ikon: 'inbox', warnaIkon: 'warn' }, h('div', { class: 'list' }, it.map(function (x) { return h('a', { class: 'li klik', href: '#' + x[3], style: { color: 'inherit' } }, ic(x[0], 's'), h('span', { class: 'grow' }, x[1]), x[2] ? h('span', { class: 'bdg warn' }, String(x[2])) : h('span', { class: 'xs muted' }, 'nihil')); }))));
  }
  if (b.rtl_prioritas && b.rtl_prioritas.length) kanan.push(UI.kartu({ judul: 'Tindak Lanjut Utama (RTL)', ikon: 'flag', warnaIkon: 'bad', aksi: h('span', { class: 'xs muted' }, b.rtl_prioritas.length + ' terdekat') },
    h('div', { class: 'col' }, b.rtl_prioritas.map(function (r) { return h('a', { class: 'box', href: '#/temuan', style: { color: 'inherit' } }, h('div', { class: 'row between' }, h('b', { class: 'small' }, r.tindakan), UI.badge(r.status, 'rtl')), h('div', { class: 'xs muted mt-s' }, (r.kode || '') + ' · PIC: ' + r.pic + ' · tenggat ' + F.tglP(r.tenggat))); }))));
  if (b.agenda && b.agenda.length) kanan.push(UI.kartu({ judul: 'Agenda Mutu', ikon: 'calendar', warnaIkon: 'ind' }, h('div', { class: 'list' }, b.agenda.map(function (a) { return h('div', { class: 'li' }, h('div', { class: 'ikon-kotak ind' }, ic(a.jenis === 'Audit' ? 'shield' : 'userCheck', 's')), h('div', { class: 'grow' }, h('div', { class: 'ttl small' }, a.jenis + ': ' + a.judul), h('div', { class: 'sub' }, F.tglP(a.tanggal) + ' · ' + a.ket))); }))));
  if (b.binaan && b.binaan.length) kanan.push(kartuBinaan(b.binaan));
  return h('div', { class: 'stack' }, hero, stats, h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, kiri), h('div', { class: 'stack' }, kanan)));
}
function berandaTendik(b) {
  const hk = App.me.hak, kanan = [], kiri = [];
  const hero = heroBeranda({ pill: 'Semester ' + b.semester + ' · minggu ke-' + b.minggu_ke, judul: F.sapa() + ', ' + App.me.nama, teks: hk.is_operator ? 'Anda memegang label Operator: kelola akun, data master, dan verifikasi usulan data pegawai.' : 'Catat rencana dan realisasi tugas Anda per periode beserta buktinya.',
    aksi: [hk.tendik_isi ? h('a', { class: 'btn putih', href: '#/kinerja' }, ic('edit', 's'), 'Isi Kinerja') : null, hk.kelola_akun ? h('a', { class: 'btn kaca', href: '#/pengaturan' }, ic('settings', 's'), 'Kelola Akun & Data') : null] });
  if (b.akun) kiri.push(h('div', { class: 'grid g4 tetap2' },
    UI.stat({ label: 'Total akun', ikon: 'users', nilai: b.akun.total }), UI.stat({ label: 'Wajib ganti sandi', ikon: 'key', warna: 'warn', nilai: b.akun.wajib_ganti }),
    UI.stat({ label: 'Akun terkunci', ikon: 'lock', warna: b.akun.terkunci ? 'bad' : 'ok', nilai: b.akun.terkunci, klik: function () { Router.go('/pengaturan/akun'); } }),
    UI.stat({ label: 'Usulan data', ikon: 'edit', warna: 'ind', nilai: b.akun.usulan, klik: function () { Router.go('/pengaturan/usulan'); } })));
  if (b.kinerja) kiri.push(UI.kartu({ judul: 'Kinerja Saya', ikon: 'activity', aksi: h('a', { class: 'btn pri kecil', href: '#/kinerja' }, ic('plus', 's'), 'Tambah') },
    b.kinerja.length ? h('div', { class: 'list' }, b.kinerja.map(function (k) { return h('a', { class: 'li klik', href: '#/kinerja', style: { color: 'inherit' } }, ic('calendar', 's'), h('span', { class: 'grow' }, 'Periode ' + k.periode), UI.badge(k.status)); })) : UI.kosong('Belum ada laporan kinerja semester ini.', 'activity')));
  if (b.tugas_belum && b.tugas_belum.length) kanan.push(UI.kartu({ judul: 'Tugas Tambahan', ikon: 'briefcase', warnaIkon: 'warn' }, h('div', { class: 'list' }, b.tugas_belum.map(function (t) { return h('a', { class: 'li klik', href: '#/tugas' }, ic('alert', 's'), h('span', { class: 'grow' }, t.nama)); }))));
  if (b.rtl_saya && b.rtl_saya.length) kanan.push(kartuRtlSaya(b.rtl_saya));
  return h('div', { class: 'stack' }, hero, h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, kiri.length ? kiri : [UI.kartu({ judul: 'Selamat bekerja', ikon: 'sparkle' }, h('p', { class: 'muted' }, 'Tidak ada tugas yang menunggu.'))]), h('div', { class: 'stack' }, kanan)));
}

// ================================================================ PROFIL
HAL.profil = function (view, p) {
  const id = p.id || (App.me && App.me.id_pegawai);
  if (!id) { view.replaceChildren(UI.galatKartu('Akses darurat tidak memiliki profil.')); return; }
  tampilkan(view, [['profil.get', { id_pegawai: id }]], function (d) {
    const pg = d.pegawai, sendiri = d.sendiri, LBL = { nik: 'NIK', tempat_lahir: 'Tempat lahir', tgl_lahir: 'Tanggal lahir', alamat: 'Alamat', hp: 'Nomor HP', pendidikan_terakhir: 'Pendidikan terakhir' };
    const r = d.ringkasan || {};
    const kepala = h('section', { class: 'card row gap-lg wrap' }, UI.ava(pg.nama, 'l'),
      h('div', { class: 'grow' }, h('h1', { style: { fontSize: '24px' } }, pg.nama), h('div', { class: 'muted' }, [pg.jabatan || pg.jenis, pg.nip ? 'NIP ' + pg.nip : (pg.nuptk ? 'NUPTK ' + pg.nuptk : '')].filter(Boolean).join(' · ')),
        h('div', { class: 'row wrap mt-s' }, (d.labels || []).map(function (l) { return h('span', { class: 'bdg ind' }, ic('award'), l); }), pg.aktif === 'tidak' ? UI.badge('tidak') : null)),
      h('div', { class: 'col', style: { alignItems: 'flex-end' } }, d.username ? h('span', { class: 'tag' }, 'Pengguna: ' + d.username) : null, !sendiri && App.hak('kelola_akun') ? h('a', { class: 'btn kecil', href: '#/pengaturan/pegawai' }, ic('settings', 's'), 'Kelola di Pengaturan') : null));
    const stats = h('div', { class: 'grid g4 tetap2' },
      UI.stat({ label: 'Perangkat disetujui', ikon: 'book', nilai: (r.perangkat_disetujui || 0), satuan: '/ ' + (r.perangkat || 0) }),
      UI.stat({ label: 'Rekap minggu ini', ikon: 'clipboard', warna: r.rekap_minggu_ini ? 'ok' : 'warn', nilai: r.rekap_minggu_ini || 0, satuan: 'rombel' }),
      UI.stat({ label: 'Supervisi terakhir', ikon: 'userCheck', warna: 'ind', nilai: r.supervisi_terakhir ? (r.supervisi_terakhir.nilai !== undefined ? F.angka(r.supervisi_terakhir.nilai, 2) : F.tglP(r.supervisi_terakhir.tanggal)) : '–', sub: r.supervisi_terakhir && r.supervisi_terakhir.predikat ? r.supervisi_terakhir.predikat : '' }),
      UI.stat({ label: 'JP PKB tahun ini', ikon: 'graduation', nilai: F.angka(r.jp_tahun_ini || 0, 0), satuan: 'JP' }));
    const resmi = [['nama', 'Nama'], ['nip', 'NIP'], ['nuptk', 'NUPTK'], ['jabatan', 'Jabatan'], ['mapel_utama', 'Mapel utama'], ['status_kepegawaian', 'Status kepegawaian'], ['email_dinas', 'Email dinas']];
    const kartuResmi = UI.kartu({ judul: 'Data Kepegawaian', sub: 'Kolom resmi diverifikasi operator', ikon: 'briefcase', aksi: sendiri ? h('button', { class: 'btn kecil', onclick: function () { usulKoreksi(pg); } }, ic('edit', 's'), 'Usulkan koreksi') : null },
      h('div', { class: 'list' }, resmi.filter(function (x) { return pg[x[0]] !== undefined; }).map(function (x) { return h('div', { class: 'li' }, h('span', { class: 'muted small', style: { width: '160px' } }, x[1]), h('b', { class: 'grow' }, pg[x[0]] || '–')); }),
        (d.usulan || []).map(function (u) { return h('div', { class: 'box warn row mt-s' }, ic('hourglass', 's'), h('span', { class: 'small' }, 'Usulan ' + u.kolom + ' → "' + u.nilai_baru + '" menunggu verifikasi')); })));
    let kartuPribadi = null;
    if (d.pribadi) {
      const daftar = h('div', { class: 'list' }, Object.keys(LBL).map(function (k) {
        const nilai = h('b', { class: 'grow num' }, d.pribadi[k] || '–');
        const tb = d.pribadi['ada_' + k] ? h('button', { class: 'btn ghost kecil', onclick: async function () {
          let kep = '';
          if (!sendiri) { kep = await tanya('Tampilkan ' + LBL[k], 'Keperluan membuka data ini', { min: 5, ya: 'Tampilkan', bantuan: 'Tercatat di log akses data pribadi beserta nama Anda dan waktunya.' }); if (!kep) return; }
          const r2 = await Api.call('profil.tampilkan', { id_pegawai: pg.id, kolom: k, keperluan: kep });
          if (r2.ok) { nilai.textContent = r2.data.nilai || '–'; tb.remove(); setTimeout(function () { nilai.textContent = d.pribadi[k]; }, 30000); } else toast(r2.error, 'bad');
        } }, ic('eye', 's'), 'Tampilkan') : null;
        return h('div', { class: 'li' }, h('span', { class: 'muted small', style: { width: '160px' } }, LBL[k]), nilai, tb);
      }));
      const dok = h('div', { class: 'col mt' }, h('b', { class: 'small' }, 'Dokumen pribadi (tidak dibagikan)'), (d.pribadi.dokumen || []).length ? (d.pribadi.dokumen || []).map(function (f, i) { return h('div', { class: 'berkas-item' }, ic('lock', 's'), h('span', { class: 'grow' }, 'Dokumen ' + (i + 1)), H.tombolBerkas(f, null, 'Buka')); }) : h('span', { class: 'small muted' }, 'Belum ada.'));
      kartuPribadi = UI.kartu({ judul: 'Data Pribadi', sub: 'Ditampilkan tersamar · pembukaan oleh orang lain tercatat', ikon: 'lock', warnaIkon: 'ind', aksi: sendiri || App.hak('lihat_pribadi') ? h('button', { class: 'btn kecil', onclick: function () { ubahPribadi(pg.id, d.pribadi.dokumen || []); } }, ic('edit', 's'), 'Ubah') : null }, h('div', null, daftar, dok));
    }
    const samping = [];
    if (sendiri) {
      samping.push(UI.kartu({ judul: 'Keamanan Akun', ikon: 'key' }, h('div', { class: 'col' },
        h('button', { class: 'btn', onclick: gantiSandiModal }, ic('key', 's'), 'Ganti kata sandi'),
        h('button', { class: 'btn', onclick: async function (e) { if (await konfirmasi('Keluar dari semua perangkat?', 'Semua sesi di perangkat lain akan berakhir. Anda perlu masuk ulang di perangkat ini.')) { const r2 = await aksi(e.currentTarget, 'auth.logoutSemua', {}); if (r2.ok) App.sesiHabis('Semua perangkat telah dikeluarkan.'); } } }, ic('logout', 's'), 'Keluar dari semua perangkat'))));
      samping.push(UI.kartu({ judul: 'Hak atas Data Saya', sub: 'UU No. 27 Tahun 2022', ikon: 'shield', warnaIkon: 'ok' }, h('div', { class: 'col' },
        h('button', { class: 'btn', onclick: async function (e) { const r2 = await aksi(e.currentTarget, 'profil.ekspor', {}, { proses: 'Menyiapkan…' }); if (r2.ok) UI.unduhTeks('data-saya-siguru.json', JSON.stringify(r2.data, null, 2), 'application/json'); } }, ic('download', 's'), 'Unduh data saya (JSON)'),
        h('button', { class: 'btn bahaya', onclick: async function () { const a = await tanya('Minta penghapusan data pribadi', 'Alasan (mis. mutasi/pensiun)', { min: 5, ya: 'Kirim permintaan', bahaya: true, panjang: true, bantuan: 'Data kinerja dan supervisi tetap diarsip sesuai kebijakan sekolah.' }); if (a) aksi(null, 'profil.mintaHapus', { alasan: a }); } }, ic('trash', 's'), 'Minta penghapusan data pribadi'))));
    }
    view.replaceChildren(h('div', { class: 'stack' }, kepala, stats, h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, kartuResmi, kartuPribadi), h('div', { class: 'stack' }, samping))));
  });
};
function usulKoreksi(pg) {
  const kol = UI.pilih([{ v: 'nama', l: 'Nama' }, { v: 'nip', l: 'NIP' }, { v: 'nuptk', l: 'NUPTK' }, { v: 'jabatan', l: 'Jabatan' }, { v: 'mapel_utama', l: 'Mapel utama' }, { v: 'status_kepegawaian', l: 'Status kepegawaian' }, { v: 'email_dinas', l: 'Email dinas' }], 'nama');
  const nilai = UI.inp({}), alasan = UI.area({ placeholder: 'Mis. sesuai SK terbaru' });
  modal({ judul: 'Usulkan koreksi data resmi', isi: h('div', { class: 'form' }, UI.fld('Kolom', kol), UI.fld('Nilai baru', nilai, { wajib: true }), UI.fld('Alasan', alasan)),
    aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Kirim usulan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'profil.usulkan', { kolom: kol.value, nilai_baru: nilai.value, alasan: alasan.value }); if (!r.ok) return false; Router.jalan(); } }] });
}
function ubahPribadi(idPeg, dokumen) {
  const f = { nik: UI.inp({ inputmode: 'numeric', placeholder: 'Kosongkan bila tidak diubah', maxlength: 16 }), tempat_lahir: UI.inp({ placeholder: 'Kosongkan bila tidak diubah' }), tgl_lahir: UI.inp({ type: 'date' }), alamat: UI.area({ placeholder: 'Kosongkan bila tidak diubah' }), hp: UI.inp({ inputmode: 'tel', placeholder: 'Kosongkan bila tidak diubah' }), pendidikan_terakhir: UI.pilih(['', 'SMA/SMK', 'D3', 'S1/D4', 'S2', 'S3'], '') };
  const up = UI.unggah('pribadi', { banyak: true, label: 'Tambah dokumen pribadi (SK, ijazah, sertifikat)' });
  modal({ judul: 'Ubah data pribadi', sub: 'Isi hanya kolom yang ingin diubah. NIK bersifat opsional.', isi: h('div', { class: 'form dua' }, UI.fld('NIK (opsional)', f.nik), UI.fld('Nomor HP', f.hp), UI.fld('Tempat lahir', f.tempat_lahir), UI.fld('Tanggal lahir', f.tgl_lahir), UI.fld('Pendidikan terakhir', f.pendidikan_terakhir), UI.fld('Alamat', f.alamat, { kelas: 'penuh' }), h('div', { class: 'penuh' }, up)),
    aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) {
      const data = {}; Object.keys(f).forEach(function (k) { if (f[k].value.trim()) data[k] = f[k].value.trim(); });
      if (up.ids().length) data.dokumen_file_ids = dokumen.concat(up.ids());
      if (!Object.keys(data).length) { toast('Tidak ada perubahan.', 'info'); return; }
      const r = await aksi(b, 'profil.simpanPribadi', { id_pegawai: idPeg, data: data }); if (!r.ok) return false; Router.jalan(); } }] });
}
function gantiSandiModal() {
  const lama = UI.sandi({}), baru = UI.sandi({ autocomplete: 'new-password' }), ulang = UI.sandi({ autocomplete: 'new-password' });
  modal({ judul: 'Ganti kata sandi', isi: h('div', { class: 'form' }, UI.fld('Kata sandi saat ini', lama), UI.fld('Kata sandi baru', baru, { bantuan: 'Minimal 8 karakter, huruf dan angka.' }), UI.fld('Ulangi kata sandi baru', ulang)),
    aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) {
      if (baru.input.value !== ulang.input.value) { toast('Ulangi kata sandi baru dengan benar.', 'warn'); return false; }
      const r = await aksi(b, 'auth.gantiSandi', { sandi_lama: lama.input.value, sandi_baru: baru.input.value }); if (!r.ok) return false;
      SS.set('sg_boot', JSON.stringify(r.data.boot)); } }] });
}

// ================================================================ VERIFIKASI (publik)
HAL.verifikasi = function (root, p) {
  const hasil = h('div', { class: 'mt' });
  const inp = UI.inp({ placeholder: 'Contoh: ABCD2345EFGH', value: p.kode || '', maxlength: 14, style: { textTransform: 'uppercase', letterSpacing: '.08em' }, autocapitalize: 'characters' });
  async function cek() {
    const kode = inp.value.trim().toUpperCase(); if (!kode) return;
    hasil.replaceChildren(h('span', { class: 'putar' }));
    const r = await Api.kirim('verifikasi.cek', { kode: kode });
    if (!r.ok) { hasil.replaceChildren(h('div', { class: 'galat' }, ic('alertCircle', 's'), r.error)); return; }
    const d = r.data;
    if (!d.ditemukan) { hasil.replaceChildren(h('div', { class: 'box bad row' }, ic('alertCircle'), h('div', null, h('b', null, 'Kode tidak terdaftar'), h('div', { class: 'small' }, 'Dokumen dengan kode ini tidak diterbitkan oleh SIGURU MUTU. Periksa kembali kodenya.')))); return; }
    const sah = d.status === 'berlaku';
    hasil.replaceChildren(h('div', { class: 'card', style: { borderColor: sah ? 'var(--ok-bd)' : 'var(--bad-bd)' } },
      h('div', { class: 'row' }, h('div', { class: 'ikon-kotak ' + (sah ? 'ok' : 'bad') }, ic(sah ? 'shield' : 'alertCircle')), h('div', null, h('b', null, sah ? 'Dokumen asli dan berlaku' : 'Dokumen telah dicabut'), h('div', { class: 'small muted' }, d.sekolah))),
      h('div', { class: 'list mt' }, [['Jenis dokumen', d.judul], ['Untuk', d.untuk], ['Diterbitkan', d.terbit_pada], ['Oleh', d.diterbitkan_oleh], ['Kode', d.kode]].map(function (x) { return h('div', { class: 'li' }, h('span', { class: 'muted small', style: { width: '130px' } }, x[0]), h('b', null, x[1])); })),
      sah ? null : h('p', { class: 'small mt' }, 'Dokumen ini dibuka kuncinya untuk koreksi dan digantikan dokumen baru. Minta versi terbaru kepada sekolah.')));
  }
  root.replaceChildren(h('div', { class: 'auth-kanan', style: { minHeight: '100vh' } }, h('div', { class: 'auth-kotak' },
    h('div', { class: 'row' }, h('div', { class: 'brand-logo' }, ic('shield')), h('b', null, 'SIGURU MUTU')),
    h('h2', { class: 'mt' }, 'Verifikasi Keaslian Dokumen'), h('p', { class: 'muted' }, 'Masukkan 12 karakter kode verifikasi yang tercetak di bawah QR pada dokumen.'),
    h('form', { class: 'row mt', onsubmit: function (e) { e.preventDefault(); location.hash = '#/verifikasi/' + inp.value.trim().toUpperCase(); cek(); } }, h('div', { class: 'grow' }, inp), h('button', { class: 'btn pri', type: 'submit' }, ic('search', 's'), 'Cek')),
    hasil, h('a', { class: 'link mt', href: '#/beranda' }, ic('chevL', 's'), 'Kembali ke aplikasi'))));
  if (p.kode) cek();
};

// ================================================================ LOG AKTIVITAS
HAL.log = function (view) {
  let tab = 'aktivitas', hal = 1, q = '';
  const isi = h('div');
  async function muat() {
    isi.replaceChildren(UI.kerangka('daftar'));
    const r = await Api.call('log.list', tab === 'pribadi' ? { akses_pribadi: true } : { halaman: hal, q: q });
    if (!r.ok) { isi.replaceChildren(UI.galatKartu(r.error, muat)); return; }
    if (tab === 'pribadi') {
      isi.replaceChildren(UI.tabel({ baris: r.data.daftar, kolom: [{ k: 'waktu', label: 'Waktu', fmt: H.tglWaktu }, { k: 'akun', label: 'Pembuka' }, { k: 'diakses', label: 'Data milik' }, { k: 'kolom', label: 'Kolom' }, { k: 'keperluan', label: 'Keperluan' }] }));
      return;
    }
    const total = Math.ceil(r.data.total / 50);
    isi.replaceChildren(
      h('form', { class: 'tbl-alat', onsubmit: function (e) { e.preventDefault(); q = e.target.q.value; hal = 1; muat(); } }, h('div', { class: 'cari' }, ic('search'), h('input', { name: 'q', type: 'search', value: q, placeholder: 'Cari aksi, nama, entitas…' })), h('button', { class: 'btn kecil' }, 'Cari')),
      UI.tabel({ cari: false, per: 50, baris: r.data.daftar, kolom: [{ k: 'waktu', label: 'Waktu', fmt: H.tglWaktu }, { k: 'akun', label: 'Akun' }, { k: 'aksi', label: 'Aksi', fmt: function (v) { return h('span', { class: 'tag' }, v); } }, { k: 'entitas', label: 'Entitas' }, { k: 'nilai_lama', label: 'Sebelum', fmt: function (v) { return h('span', { class: 'xs muted' }, v || '–'); } }, { k: 'nilai_baru', label: 'Sesudah', fmt: function (v) { return h('span', { class: 'xs' }, v || '–'); } }] }),
      h('div', { class: 'paging' }, h('span', { class: 'small muted' }, r.data.total + ' entri (2.000 terbaru)'), h('div', { class: 'hal' },
        hal > 1 ? h('button', { onclick: function () { hal--; muat(); } }, '‹') : null, h('button', { class: 'on' }, String(hal)), hal < total ? h('button', { onclick: function () { hal++; muat(); } }, '›') : null)));
  }
  view.replaceChildren(UI.kepala('Log Aktivitas', 'Catatan hanya-tambah: setiap perubahan data, pengesahan, dan buka kunci.'),
    App.hak('buka_kunci') ? UI.tabs([{ id: 'aktivitas', label: 'Aktivitas', ikon: 'history' }, { id: 'pribadi', label: 'Akses Data Pribadi', ikon: 'lock' }], tab, function (t) { tab = t; muat(); }) : null, isi);
  muat();
};

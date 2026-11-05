/* SIGURU MUTU — hal-laporan.js: Laporan (tabel + Excel + PDF resmi) dan Pengaturan (pegawai, akun, label, master, sistem, impor, usulan). */
(function () {
  'use strict';
  let smtLaporan = '';
  const LAPORAN = [
    { jenis: 'lmi', judul: 'Laporan Mutu Internal', ket: 'Kompilasi capaian standar, tahapan SPMI, supervisi, administrasi, RTL, dan PKB semester berjalan.', ikon: 'shield', chip: 'Dokumen utama SPMI', boleh: function (h) { return h.laporan_semua; }, pdf: function (h) { return h.laporan_semua; } },
    { jenis: 'rapor_mutu', judul: 'Rapor Mutu per Standar', ket: 'Target, capaian, rasio, dan status setiap indikator per standar.', ikon: 'layers', chip: 'SPMI', boleh: function (h) { return h.laporan_semua || h.laporan_pengawas; }, pdf: function (h) { return h.laporan_semua; } },
    { jenis: 'rekap_supervisi', judul: 'Rekapitulasi Supervisi Akademik', ket: 'Hasil supervisi per guru: tanggal, supervisor, versi instrumen, nilai, dan status.', ikon: 'userCheck', chip: 'Supervisi', boleh: function (h) { return h.laporan_semua || h.laporan_binaan || h.laporan_pengawas; }, pdf: function (h) { return h.laporan_semua; } },
    { jenis: 'rekap_rtl', judul: 'Berita Acara Temuan & RTL', ket: 'Matriks temuan audit/evaluasi beserta tindakan, PIC, tenggat, dan status RTL.', ikon: 'flag', chip: 'Audit Internal', boleh: function (h) { return h.laporan_semua || h.laporan_pengawas; }, pdf: function (h) { return h.laporan_semua; } },
    { jenis: 'rekap_administrasi', judul: 'Rekap Administrasi & Keterlaksanaan', ket: 'Kelengkapan perangkat ajar, rekap mingguan, refleksi, dan tugas tambahan per guru.', ikon: 'clipboard', chip: 'Administrasi', boleh: function (h) { return h.laporan_admin || h.laporan_binaan; }, pdf: function (h) { return h.laporan_semua || h.laporan_admin; } },
    { jenis: 'rekap_pkb', judul: 'Rekap Pengembangan Profesi (PKB)', ket: 'Jumlah kegiatan dan total JP per pegawai dalam semester.', ikon: 'graduation', chip: 'PKB', boleh: function (h) { return h.laporan_semua; }, pdf: function (h) { return h.laporan_semua; } },
    { jenis: 'saya', judul: 'Rekap Pribadi Saya', ket: 'Kelengkapan administrasi, hasil supervisi yang disahkan, dan JP PKB Anda.', ikon: 'user', chip: 'Pribadi', boleh: function (h) { return h.is_guru || h.is_tendik; }, pdf: function () { return false; } }
  ];
  async function cetakPdf(btn, jenis) {
    const r = await aksi(btn, 'laporan.pdf', { jenis: jenis, id_semester: smtLaporan || undefined }, { proses: 'Membuat PDF (± 10 dtk)…' });
    if (r.ok) { UI.tampilBase64(r.data.nama, r.data.mime, r.data.base64); Data.basi(); }
  }
  function pilihSemester(onChange) {
    const ops = (App.master.semester || []).slice().sort(function (a, b) { return a.tgl_mulai < b.tgl_mulai ? 1 : -1; }).map(function (s) { return { v: s.id, l: s.semester + ' ' + s.tahun_ajaran + (s.aktif === 'ya' ? ' (aktif)' : '') }; });
    const sel = UI.pilih(ops, smtLaporan || App.master.smt_aktif, { 'aria-label': 'Semester laporan', style: { width: 'auto' } });
    sel.addEventListener('change', function () { smtLaporan = sel.value === App.master.smt_aktif ? '' : sel.value; onChange(); });
    return sel;
  }

  // ============================================================== LAPORAN
  HAL.laporan = function (view) {
    const hk = App.me.hak, daftar = LAPORAN.filter(function (l) { return l.boleh(hk); });
    const bolehRiwayat = hk.laporan_semua || hk.laporan_pengawas || hk.laporan_admin;
    tampilkan(view, bolehRiwayat ? [['laporan.terbit', {}]] : [], function (terbit) {
      const kartu = daftar.map(function (l) {
        return h('section', { class: 'card row gap-lg', style: { alignItems: 'stretch' } },
          h('div', { class: 'dok-thumb sembunyi-m', style: { width: '120px', height: 'auto', minHeight: '120px', flex: 'none' } }, ic(l.ikon, 'l')),
          h('div', { class: 'grow col' }, h('div', { class: 'row wrap' }, h('span', { class: 'bdg ind' }, l.chip)), h('h3', { style: { fontSize: '18px' } }, l.judul), h('p', { class: 'small muted' }, l.ket),
            h('div', { class: 'row wrap mt-s' }, h('a', { class: 'btn kecil', href: '#/laporan/' + l.jenis }, ic('eye', 's'), 'Lihat & Excel'), l.pdf(hk) ? h('button', { class: 'btn pri kecil', onclick: function (e) { cetakPdf(e.currentTarget, l.jenis); } }, ic('printer', 's'), 'Cetak PDF Resmi') : null)));
      });
      const samping = [UI.kartu({ judul: 'Autentikasi Dokumen', ikon: 'qr', warnaIkon: 'ind' }, h('div', { class: 'col small' }, h('p', null, 'Setiap PDF resmi memuat kode verifikasi 12 karakter dan QR yang menuju halaman Verifikasi Dokumen aplikasi ini.'), h('p', { class: 'muted' }, 'Kode membuktikan dokumen diterbitkan oleh SIGURU MUTU; ini bukan tanda tangan elektronik tersertifikasi.'), h('a', { class: 'btn kecil', href: '#/verifikasi' }, ic('search', 's'), 'Buka halaman verifikasi')))];
      if (bolehRiwayat) samping.push(UI.kartu({ judul: 'Riwayat Terbit', ikon: 'history' }, terbit && terbit.length ? h('div', { class: 'list' }, terbit.slice(0, 12).map(function (d) {
        return h('div', { class: 'li' }, h('span', { class: 'titik ' + (d.status === 'berlaku' ? 'hijau' : 'merah') }), h('div', { class: 'grow' }, h('div', { class: 'ttl small' }, d.judul), h('div', { class: 'sub' }, H.tglWaktu(d.terbit_pada) + ' · ' + d.kode)), d.file_id ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Buka PDF', onclick: function () { UI.bukaBerkas(d.file_id); } }, ic('download', 's')) : null);
      })) : UI.kosong('Belum ada laporan yang diterbitkan.', 'file')));
      view.replaceChildren(UI.kepala('Laporan & Rapor Mutu', 'Setiap laporan bisa difilter, diekspor ke Excel, dan dicetak sebagai PDF resmi dari template Google Docs.', hk.laporan_semua || hk.laporan_pengawas ? pilihSemester(function () { Data.basi(); }) : null),
        h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, kartu.length ? kartu : [UI.kartu({}, UI.kosong('Tidak ada laporan untuk peran Anda.', 'chart'))]), h('div', { class: 'stack' }, samping)));
    });
  };
  HAL.laporanLihat = function (view, p) {
    const meta = LAPORAN.filter(function (l) { return l.jenis === p.jenis; })[0];
    if (!meta) { view.replaceChildren(UI.galatKartu('Laporan tidak dikenal.')); return; }
    const muat = function () {
      tampilkan(view, [['laporan.data', { jenis: p.jenis, id_semester: smtLaporan || undefined }]], function (d) {
        const hk = App.me.hak, bagian = d.jenis === 'lmi' ? d.bagian : [d];
        const lembar = bagian.map(function (b) { return { nama: b.judul, kolom: b.kolom, baris: b.baris }; });
        const aksiAtas = [hk.laporan_semua || hk.laporan_pengawas ? pilihSemester(muat) : null, h('button', { class: 'btn', onclick: function () { Xlsx.buat(d.judul.replace(/\s+/g, '_') + '_' + d.semester.replace(/\W+/g, '_'), lembar); } }, ic('fileSheet', 's'), 'Ekspor Excel'),
          meta.pdf(hk) ? h('button', { class: 'btn pri', onclick: function (e) { cetakPdf(e.currentTarget, p.jenis); } }, ic('printer', 's'), 'Cetak PDF Resmi') : null];
        const ring = d.ringkasan || {};
        const ringkasanEl = d.jenis === 'lmi' ? h('div', { class: 'grid g4 tetap2' }, UI.stat({ label: 'Indeks mutu', ikon: 'shield', nilai: F.persen(ring.indeks) }), UI.stat({ label: 'Indikator memenuhi', ikon: 'checkCircle', warna: 'ok', nilai: ring.jumlah.hijau, satuan: '/ ' + ring.jumlah.indikator }), UI.stat({ label: 'Supervisi disahkan', ikon: 'userCheck', warna: 'ind', nilai: ring.supervisi.disahkan, satuan: '/ ' + ring.supervisi.guru_total }), UI.stat({ label: 'RTL terverifikasi', ikon: 'flag', nilai: ring.rtl.diverifikasi, satuan: '/ ' + ring.rtl.total }))
          : (Object.keys(ring).length ? h('div', { class: 'row wrap' }, Object.keys(ring).filter(function (k) { return typeof ring[k] !== 'object'; }).map(function (k) { return h('span', { class: 'tag' }, k.replace(/_/g, ' ') + ': ' + ring[k]); })) : null);
        view.replaceChildren(h('div', { class: 'stack' }, UI.kepala(d.judul, 'Semester ' + d.semester, aksiAtas), ringkasanEl,
          bagian.map(function (b) { return UI.kartu({ judul: d.jenis === 'lmi' ? b.judul : null }, UI.tabel({ baris: b.baris, kolom: b.kolom.map(function (k) { return { k: k.k, label: k.label, fmt: k.k === 'status' ? function (v) { return UI.STATUS_TEKS ? v : UI.badge(v); } : (k.k === 'tanggal' ? F.tglP : null) }; }) })); }),
          h('a', { class: 'link', href: '#/laporan' }, ic('chevL', 's'), 'Kembali ke daftar laporan')));
      }, { kerangka: 'daftar' });
    };
    muat();
  };

  // ============================================================== PENGATURAN
  HAL.pengaturan = function (view, p) {
    const hk = App.me.hak;
    const tabs = [hk.kelola_akun ? { id: 'pegawai', label: 'Pegawai', ikon: 'users' } : null, hk.kelola_akun ? { id: 'akun', label: 'Akun', ikon: 'key' } : null, hk.kelola_akun ? { id: 'label', label: 'Label Penugasan', ikon: 'award' } : null,
      hk.kelola_master ? { id: 'master', label: 'Data Master', ikon: 'database' } : null, hk.kelola_pengaturan ? { id: 'sistem', label: 'Ambang & Sistem', ikon: 'settings' } : null,
      hk.kelola_akun ? { id: 'impor', label: 'Impor', ikon: 'upload' } : null, hk.verif_usulan ? { id: 'usulan', label: 'Usulan Data', ikon: 'edit' } : null].filter(Boolean);
    const tab = tabs.some(function (t) { return t.id === p.tab; }) ? p.tab : tabs[0].id;
    const isi = h('div');
    view.replaceChildren(UI.kepala('Pengaturan', 'Data master, akun, label penugasan, dan konfigurasi sekolah. Tidak ada nilai sekolah yang ditanam di kode.'), UI.tabs(tabs, tab, function (t) { history.replaceState(null, '', '#/pengaturan/' + t); tampilTab(t); }), isi);
    function tampilTab(t) { ({ pegawai: tabPegawai, akun: tabAkun, label: tabLabel, master: tabMaster, sistem: tabSistem, impor: tabImpor, usulan: tabUsulan })[t](isi); }
    tampilTab(tab);
  };
  function segarMaster() { return App.segarkanBoot(); }
  function tampilkanSandi(judul, baris) {
    modal({ judul: judul, sub: 'Catat sekarang — sandi tidak bisa ditampilkan lagi. Pengguna wajib menggantinya saat login pertama.', isi: h('div', { class: 'col' }, baris.map(function (b) { return h('div', { class: 'box row' }, h('div', { class: 'grow' }, h('b', null, b.nama || ''), h('div', { class: 'small' }, 'Nama pengguna: ', h('code', null, b.username))), h('code', { class: 'num', style: { fontSize: '16px', fontWeight: 700 } }, b.sandi_awal)); }),
      baris.length > 1 ? h('button', { class: 'btn', onclick: function () { UI.unduhTeks('kredensial-awal-HAPUS-SETELAH-DIBAGIKAN.csv', 'nama;username;sandi_awal\n' + baris.map(function (b) { return [b.nama, b.username, b.sandi_awal].join(';'); }).join('\n'), 'text/csv'); } }, ic('download', 's'), 'Unduh CSV (hapus setelah dibagikan)') : null), aksi: [{ label: 'Sudah dicatat', kelas: 'pri' }] });
  }
  // ---------- Pegawai ----------
  function tabPegawai(isi) {
    tampilkan(isi, [['master.get', {}]], function (m) {
      isi.replaceChildren(UI.tabel({ baris: m.pegawai, placeholder: 'Cari nama, NIP, jabatan…', alat: h('button', { class: 'btn pri kecil right', onclick: function () { formPegawai({}); } }, ic('plus', 's'), 'Tambah pegawai'), kolom: [
        { k: 'nama', label: 'Nama', fmt: function (v, x) { return h('a', { href: '#/profil/' + x.id, class: 'row', style: { color: 'inherit' } }, UI.ava(v, 's'), h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, x.email_dinas || ''))); } },
        { k: 'nip', label: 'NIP / NUPTK', fmt: function (v, x) { return h('span', { class: 'num small' }, v || x.nuptk || '–'); } }, { k: 'jenis', label: 'Jenis', fmt: function (v) { return h('span', { class: 'tag' }, v); } },
        { k: 'jabatan', label: 'Jabatan' }, { k: 'mapel_utama', label: 'Mapel' }, { k: 'aktif', label: 'Status', fmt: function (v) { return UI.badge(v || 'ya'); } },
        { k: 'id', label: '', urut: false, fmt: function (v, x) { return h('div', { class: 'row' }, h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Ubah', onclick: function () { formPegawai(x); } }, ic('edit', 's')),
          h('button', { class: 'btn ghost kecil', onclick: async function (e) { const aktif = x.aktif === 'tidak' ? 'ya' : 'tidak'; if (aktif === 'tidak' && !(await konfirmasi('Nonaktifkan ' + x.nama + '?', 'Akunnya tidak bisa dipakai masuk. Data tetap tersimpan.', { bahaya: true, ya: 'Nonaktifkan' }))) return; const r = await aksi(e.currentTarget, 'pegawai.status', { id: x.id, aktif: aktif }); if (r.ok) { await segarMaster(); Router.jalan(); } } }, x.aktif === 'tidak' ? 'Aktifkan' : 'Nonaktifkan')); } }] }));
    }, { kerangka: 'daftar' });
  }
  function formPegawai(x) {
    const f = { nama: UI.inp({ value: x.nama || '' }), nip: UI.inp({ value: x.nip || '', inputmode: 'numeric', maxlength: 18 }), nuptk: UI.inp({ value: x.nuptk || '', inputmode: 'numeric' }), jenis: UI.pilih([{ v: 'guru', l: 'Guru' }, { v: 'tendik', l: 'Tenaga kependidikan' }, { v: 'kepsek', l: 'Kepala sekolah' }, { v: 'pengawas', l: 'Pengawas' }], x.jenis || 'guru'),
      jabatan: UI.inp({ value: x.jabatan || '' }), mapel_utama: UI.pilih(H.opsiMapel(), x.mapel_utama, { kosong: '— mapel —' }), status_kepegawaian: UI.pilih(['PNS', 'PPPK', 'PPPK Paruh Waktu', 'GTT/Honorer', 'PTT'], x.status_kepegawaian, { kosong: '— status —' }), email_dinas: UI.inp({ type: 'email', value: x.email_dinas || '' }) };
    const buat = h('input', { type: 'checkbox', checked: !x.id }), user = UI.inp({ placeholder: 'Kosongkan = pakai NIP/NUPTK/email' });
    modal({ judul: x.id ? 'Ubah pegawai' : 'Tambah pegawai', lebar: true, isi: h('div', { class: 'form dua' }, UI.fld('Nama lengkap & gelar', f.nama, { wajib: true, kelas: 'penuh' }), UI.fld('NIP (18 digit)', f.nip), UI.fld('NUPTK', f.nuptk), UI.fld('Jenis', f.jenis, { wajib: true }), UI.fld('Jabatan', f.jabatan), UI.fld('Mapel utama', f.mapel_utama), UI.fld('Status kepegawaian', f.status_kepegawaian), UI.fld('Email dinas (untuk ringkasan harian)', f.email_dinas, { kelas: 'penuh' }),
      x.id ? null : h('label', { class: 'cek penuh' }, buat, h('span', null, 'Sekaligus buat akun dengan sandi awal acak')), x.id ? null : UI.fld('Nama pengguna', user, { kelas: 'penuh' })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) {
        const data = { id: x.id }; Object.keys(f).forEach(function (k) { data[k] = f[k].value; }); if (!x.id) { data.buat_akun = buat.checked; data.username = user.value; }
        const r = await aksi(b, 'pegawai.simpan', { data: data }); if (!r.ok) return false;
        await segarMaster(); Router.jalan(); if (r.data.sandi_awal) tampilkanSandi('Akun dibuat', [{ nama: data.nama, username: user.value || data.nip || data.nuptk || data.email_dinas, sandi_awal: r.data.sandi_awal }]);
      } }] });
  }
  // ---------- Akun ----------
  function tabAkun(isi) {
    tampilkan(isi, [['akun.list', {}], ['master.get', {}]], function (akun, m) {
      const punya = {}; akun.forEach(function (a) { punya[a.id_pegawai] = 1; });
      const tanpa = m.pegawai.filter(function (p) { return !punya[p.id] && p.aktif !== 'tidak'; });
      isi.replaceChildren(h('div', { class: 'stack' },
        tanpa.length ? UI.kartu({ judul: 'Pegawai tanpa akun', ikon: 'user', warnaIkon: 'warn' }, h('div', { class: 'row wrap' }, tanpa.map(function (p) { return h('button', { class: 'btn kecil', onclick: async function (e) { const u = await tanya('Buat akun ' + p.nama, 'Nama pengguna', { nilai: p.nip || p.nuptk || p.email_dinas || '', ya: 'Buat akun' }); if (!u) return; const r = await aksi(e.currentTarget, 'akun.buat', { id_pegawai: p.id, username: u }); if (r.ok) { Router.jalan(); tampilkanSandi('Akun dibuat', [{ nama: p.nama, username: r.data.username, sandi_awal: r.data.sandi_awal }]); } } }, ic('plus', 's'), p.nama); }))) : null,
        UI.tabel({ baris: akun, placeholder: 'Cari nama atau nama pengguna…', kolom: [
          { k: 'nama', label: 'Pegawai', fmt: function (v) { return h('b', null, v); } }, { k: 'username', label: 'Nama pengguna', fmt: function (v) { return h('code', null, v); } }, { k: 'peran_dasar', label: 'Peran', fmt: function (v) { return h('span', { class: 'tag' }, v); } },
          { k: 'wajib_ganti_sandi', label: 'Sandi', fmt: function (v) { return v === 'ya' ? h('span', { class: 'bdg warn' }, 'Sandi awal') : UI.badge('ya'); } }, { k: 'terkunci', label: 'Kunci', fmt: function (v) { return v ? h('span', { class: 'bdg bad' }, ic('lock'), 'Terkunci') : '–'; } },
          { k: 'login_terakhir', label: 'Login terakhir', fmt: function (v) { return v ? F.relatif(v) : 'belum pernah'; } },
          { k: 'id', label: '', urut: false, fmt: function (v, a) { return h('div', { class: 'row' },
            a.terkunci ? h('button', { class: 'btn kecil', onclick: async function (e) { const r = await aksi(e.currentTarget, 'akun.buka', { id: a.id }); if (r.ok) Router.jalan(); } }, ic('unlock', 's'), 'Buka') : null,
            h('button', { class: 'btn ghost kecil', onclick: async function (e) { if (!(await konfirmasi('Reset sandi ' + a.nama + '?', 'Sandi sementara baru dibuat; semua sesi akun ini berakhir.', { ya: 'Reset' }))) return; const r = await aksi(null, 'akun.reset', { id: a.id }); if (r.ok) tampilkanSandi('Sandi direset', [{ nama: a.nama, username: r.data.username, sandi_awal: r.data.sandi_awal }]); } }, ic('key', 's'), 'Reset sandi'),
            h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Ubah nama pengguna', onclick: async function () { const u = await tanya('Ubah nama pengguna', 'Nama pengguna baru', { nilai: a.username }); if (u) { const r = await aksi(null, 'akun.username', { id: a.id, username: u }); if (r.ok) Router.jalan(); } } }, ic('edit', 's'))); } }] })));
    }, { kerangka: 'daftar' });
  }
  // ---------- Label ----------
  function tabLabel(isi) {
    tampilkan(isi, [['master.get', {}]], function (m) {
      const per = {}; m.labels.forEach(function (l) { (per[l.id_pegawai] = per[l.id_pegawai] || []).push(l); });
      const baris = m.pegawai.filter(function (p) { return p.aktif !== 'tidak' && p.jenis !== 'pengawas'; }).map(function (p) { return Object.assign({ label: per[p.id] || [] }, p); });
      const smt = (m.semester.filter(function (s) { return s.id === m.smt_aktif; })[0] || {});
      isi.replaceChildren(h('div', { class: 'stack' }, h('div', { class: 'box biru small row' }, ic('info', 's'), 'Label berlaku per semester (' + smt.semester + ' ' + smt.tahun_ajaran + '). Saat mengaktifkan semester baru, label bisa disalin dari semester lalu. Operator khusus tendik; Supervisor, Wali Kelas, Guru BK, Pembina Ekskul khusus guru.'),
        UI.tabel({ baris: baris, placeholder: 'Cari pegawai…', kolom: [{ k: 'nama', label: 'Pegawai', fmt: function (v, p) { return h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, p.jenis)); } },
          { k: 'label', label: 'Label aktif', urut: false, teks: function (p) { return p.label.map(function (l) { return l.label; }).join(' '); }, fmt: function (v, p) { return h('div', { class: 'row wrap' }, v.map(function (l) { return h('span', { class: 'bdg ind' }, l.label + (l.cakupan ? ' · ' + l.cakupan : ''), h('button', { class: 'ibtn', style: { width: '22px', height: '22px' }, 'aria-label': 'Hapus label ' + l.label, onclick: async function () { if (await konfirmasi('Hapus label?', l.label + ' untuk ' + p.nama, { bahaya: true, ya: 'Hapus' })) { const r = await aksi(null, 'label.hapus', { id: l.id }); if (r.ok) { await segarMaster(); Router.jalan(); } } } }, ic('x', 's'))); }), h('button', { class: 'btn ghost kecil', onclick: function () { formLabel(p, m.daftar_label); } }, ic('plus', 's'), 'Label')); } }] })));
    }, { kerangka: 'daftar' });
  }
  function formLabel(p, daftar) {
    const izin = daftar.filter(function (l) { return l === 'Operator' ? p.jenis === 'tendik' : (['Wali Kelas', 'Guru BK', 'Pembina Ekskul', 'Supervisor'].indexOf(l) > -1 ? ['guru', 'kepsek'].indexOf(p.jenis) > -1 : true); });
    const lb = UI.pilih(izin, izin[0]), cak = UI.inp({ placeholder: 'Opsional: rombel (VII-B), ekskul (Pramuka)…' });
    modal({ judul: 'Tambah label · ' + p.nama, isi: h('div', { class: 'form' }, UI.fld('Label', lb), UI.fld('Cakupan', cak)), aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'label.simpan', { id_pegawai: p.id, label: lb.value, cakupan: cak.value }); if (!r.ok) return false; await segarMaster(); Router.jalan(); } }] });
  }
  // ---------- Master ----------
  const MASTER = {
    Tahun_Semester: { label: 'Semester', kolom: [['tahun_ajaran', 'Tahun ajaran', '2026/2027'], ['semester', 'Semester', 'Ganjil/Genap', ['Ganjil', 'Genap']], ['tgl_mulai', 'Mulai', '', 'date'], ['tgl_selesai', 'Selesai', '', 'date']] },
    Mapel: { label: 'Mata Pelajaran', kolom: [['kode', 'Kode', 'M01'], ['nama', 'Nama mapel', '']] },
    Rombel: { label: 'Rombel', kolom: [['nama', 'Nama rombel', 'VII-A'], ['tingkat', 'Tingkat', 'VII']] },
    Ekskul: { label: 'Ekstrakurikuler', kolom: [['nama', 'Nama ekskul', 'Pramuka']] },
    Jenis_Tugas_Tambahan: { label: 'Jenis Tugas Tambahan', kolom: [['nama', 'Nama tugas', ''], ['label_terkait', 'Label terkait', '', ['', 'Wali Kelas', 'Guru BK', 'Pembina Ekskul', 'Operator', 'Supervisor', 'Tim Mutu']], ['periode', 'Periode', '', ['bulanan', 'semester', 'bebas']]] }
  };
  function tabMaster(isi) {
    let t = 'Tahun_Semester';
    const wadah = h('div');
    function gambar() {
      tampilkan(wadah, [['master.get', {}]], function (m) {
        const def = MASTER[t], key = { Tahun_Semester: 'semester', Mapel: 'mapel', Rombel: 'rombel', Ekskul: 'ekskul', Jenis_Tugas_Tambahan: 'jenis_tugas' }[t];
        wadah.replaceChildren(UI.tabel({ baris: m[key], alat: h('button', { class: 'btn pri kecil right', onclick: function () { formMaster(t, {}); } }, ic('plus', 's'), 'Tambah ' + def.label.toLowerCase()), kolom: def.kolom.map(function (k) { return { k: k[0], label: k[1], fmt: k[3] === 'date' ? F.tgl : null }; }).concat([
          t === 'Tahun_Semester' ? { k: 'aktif', label: 'Status', fmt: function (v) { return v === 'ya' ? UI.badge('ya') : h('span', { class: 'tag' }, 'Tidak aktif'); } } : { k: 'aktif', label: 'Status', fmt: function (v) { return UI.badge(v || 'ya'); } },
          { k: 'id', label: '', urut: false, fmt: function (v, x) { return h('div', { class: 'row' }, h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Ubah', onclick: function () { formMaster(t, x); } }, ic('edit', 's')),
            t === 'Tahun_Semester' && x.aktif !== 'ya' ? h('button', { class: 'btn kecil', onclick: function () { aktifkanSmt(x); } }, 'Aktifkan') : null,
            !(t === 'Tahun_Semester' && x.aktif === 'ya') ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus', onclick: async function (e) { if (await konfirmasi('Hapus data?', (x.nama || x.tahun_ajaran) + ' akan dihapus (soft delete).', { bahaya: true, ya: 'Hapus' })) { const r = await aksi(e.currentTarget, 'master.hapus', { tabel: t, id: x.id }); if (r.ok) { await segarMaster(); gambar(); } } } }, ic('trash', 's')) : null); } }]) }));
      }, { kerangka: 'daftar' });
    }
    isi.replaceChildren(h('div', { class: 'mb' }, UI.seg(Object.keys(MASTER).map(function (k) { return { id: k, label: MASTER[k].label }; }), t, function (v) { t = v; gambar(); })), wadah);
    gambar();
  }
  function formMaster(t, x) {
    const def = MASTER[t], f = {};
    const isiF = def.kolom.map(function (k) { f[k[0]] = Array.isArray(k[3]) ? UI.pilih(k[3].map(function (o) { return { v: o, l: o || '— tidak ada (untuk semua) —' }; }), x[k[0]] || '') : UI.inp({ type: k[3] === 'date' ? 'date' : 'text', value: x[k[0]] || '', placeholder: k[2] }); return UI.fld(k[1], f[k[0]], { wajib: k[0] === 'nama' || t === 'Tahun_Semester' }); });
    let butir = (x.butir_wajib || []).map(function (b) { return Object.assign({}, b); });
    const wb = h('div', { class: 'col' });
    function gbButir() {
      wb.replaceChildren.apply(wb, butir.map(function (b, i) {
        const lb = UI.inp({ value: b.label, placeholder: 'Label butir' }), tp = UI.pilih([{ v: 'teks', l: 'Teks' }, { v: 'angka', l: 'Angka' }, { v: 'tanggal', l: 'Tanggal' }, { v: 'ya_tidak', l: 'Ya/Tidak' }, { v: 'berkas', l: 'Berkas bukti' }], b.tipe || 'teks', { style: { width: '140px' } }), wj = h('input', { type: 'checkbox', checked: b.wajib !== false });
        lb.addEventListener('input', function () { b.label = lb.value; }); tp.addEventListener('change', function () { b.tipe = tp.value; }); wj.addEventListener('change', function () { b.wajib = wj.checked; });
        return h('div', { class: 'row' }, h('div', { class: 'grow' }, lb), tp, h('label', { class: 'cek', style: { padding: 0 } }, wj, 'Wajib'), h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus butir', onclick: function () { butir.splice(i, 1); gbButir(); } }, ic('x', 's')));
      }).concat([h('button', { class: 'btn ghost kecil', onclick: function () { butir.push({ label: '', tipe: 'teks', wajib: true }); gbButir(); } }, ic('plus', 's'), 'Tambah butir')]));
    }
    if (t === 'Jenis_Tugas_Tambahan') gbButir();
    modal({ judul: (x.id ? 'Ubah ' : 'Tambah ') + def.label.toLowerCase(), lebar: t === 'Jenis_Tugas_Tambahan', isi: h('div', { class: 'form' }, isiF, t === 'Jenis_Tugas_Tambahan' ? UI.fld('Butir isian wajib', wb, { bantuan: 'Muncul otomatis bagi pegawai berlabel terkait. Jangan minta data pribadi siswa.' }) : null),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const data = { id: x.id }; Object.keys(f).forEach(function (k) { data[k] = f[k].value; }); if (t === 'Jenis_Tugas_Tambahan') data.butir_wajib = butir; const r = await aksi(b, 'master.simpan', { tabel: t, data: data }); if (!r.ok) return false; await segarMaster(); Router.jalan(); } }] });
  }
  function aktifkanSmt(x) {
    const salin = h('input', { type: 'checkbox', checked: true });
    modal({ judul: 'Aktifkan ' + x.semester + ' ' + x.tahun_ajaran + '?', isi: h('div', { class: 'col' }, h('p', null, 'Semua pengisian baru (rekap, perangkat, supervisi, SPMI) akan masuk ke semester ini.'), h('label', { class: 'cek' }, salin, h('span', null, 'Salin label penugasan dan pasangan supervisor–guru dari semester yang sedang aktif'))),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Aktifkan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'semester.aktifkan', { id: x.id, salin_label: salin.checked }); if (!r.ok) return false; Data.hapusSemua(); await segarMaster(); Router.jalan(); } }] });
  }
  // ---------- Sistem ----------
  function tabSistem(isi) {
    tampilkan(isi, [['pengaturan.get', {}]], function (c) {
      const arr = function (k) { try { return JSON.parse(c[k]).join('\n'); } catch (e) { return c[k]; } };
      const f = {
        nama_sekolah: UI.inp({ value: c.nama_sekolah }), alamat_sekolah: UI.inp({ value: c.alamat_sekolah }), kota_ttd: UI.inp({ value: c.kota_ttd }), logo_url: UI.inp({ type: 'url', value: c.logo_url, placeholder: 'https://… (gambar persegi)' }),
        url_aplikasi: UI.inp({ type: 'url', value: c.url_aplikasi, placeholder: 'https://pakguru1928-tech.github.io/siguru-mutu/' }),
        ambang_hijau: UI.inp({ type: 'number', value: c.ambang_hijau }), ambang_kuning: UI.inp({ type: 'number', value: c.ambang_kuning }), ambang_skor_temuan: UI.inp({ type: 'number', value: c.ambang_skor_temuan }),
        perangkat_wajib: UI.area({ value: arr('perangkat_wajib') }), metode_pilihan: UI.area({ value: arr('metode_pilihan') }), kendala_pilihan: UI.area({ value: arr('kendala_pilihan') }), pkb_jenis: UI.area({ value: arr('pkb_jenis') }),
        email_aktif: UI.pilih([{ v: 'ya', l: 'Kirim ringkasan harian' }, { v: 'tidak', l: 'Matikan email' }], c.email_aktif), masa_simpan_tahun: UI.inp({ type: 'number', value: c.masa_simpan_tahun }),
        versi_pernyataan_data: UI.inp({ type: 'number', value: c.versi_pernyataan_data }), pernyataan_data: UI.area({ value: c.pernyataan_data, style: { minHeight: '160px' } })
      };
      const btn = h('button', { class: 'btn pri', onclick: async function () { const n = {}; Object.keys(f).forEach(function (k) { n[k] = f[k].value; }); const r = await aksi(btn, 'pengaturan.simpan', { nilai: n }); if (r.ok) { await segarMaster(); } } }, ic('save', 's'), 'Simpan pengaturan');
      isi.replaceChildren(h('div', { class: 'stack' },
        UI.kartu({ judul: 'Identitas Sekolah', ikon: 'home' }, h('div', { class: 'form dua' }, UI.fld('Nama sekolah', f.nama_sekolah), UI.fld('Kota (tanda tangan dokumen)', f.kota_ttd), UI.fld('Alamat', f.alamat_sekolah, { kelas: 'penuh' }), UI.fld('URL logo', f.logo_url), UI.fld('URL aplikasi (GitHub Pages)', f.url_aplikasi, { bantuan: 'Dipakai QR & tautan verifikasi di PDF.' }))),
        UI.kartu({ judul: 'Ambang Warna Capaian & Temuan', sub: 'Rasio = capaian ÷ target × 100%', ikon: 'target' }, h('div', { class: 'form dua' }, UI.fld('Hijau bila rasio ≥ (%)', f.ambang_hijau), UI.fld('Kuning bila rasio ≥ (%)', f.ambang_kuning, { bantuan: 'Di bawahnya merah.' }), UI.fld('Skor butir supervisi ≤ ini bisa dijadikan temuan', f.ambang_skor_temuan))),
        UI.kartu({ judul: 'Pilihan Cepat', sub: 'Satu baris satu pilihan', ikon: 'list' }, h('div', { class: 'form dua' }, UI.fld('Perangkat ajar wajib', f.perangkat_wajib), UI.fld('Metode (rekap mingguan)', f.metode_pilihan), UI.fld('Kendala (rekap mingguan)', f.kendala_pilihan), UI.fld('Jenis PKB', f.pkb_jenis))),
        UI.kartu({ judul: 'Privasi & Notifikasi', ikon: 'shield' }, h('div', { class: 'form dua' }, UI.fld('Email ringkasan', f.email_aktif), UI.fld('Masa simpan data pribadi pegawai nonaktif (tahun)', f.masa_simpan_tahun, { bantuan: 'Setelahnya data pribadi dianonimkan otomatis.' }), UI.fld('Versi pernyataan data', f.versi_pernyataan_data, { bantuan: 'Naikkan versi bila teks diubah agar semua pegawai menyetujui ulang.' }), UI.fld('Teks pernyataan pemrosesan data', f.pernyataan_data, { kelas: 'penuh' }))),
        h('div', { class: 'sticky-aksi' }, h('span', { class: 'grow small muted' }, 'Perubahan tercatat di log aktivitas.'), btn)));
    });
  }
  // ---------- Impor (dry-run → jalankan; aman diulang) ----------
  function parseCsv(teks) {
    const baris = teks.replace(/^﻿/, '').split(/\r?\n/).filter(function (b) { return b.trim(); });
    if (!baris.length) return [];
    const pemisah = (baris[0].match(/;/g) || []).length > (baris[0].match(/,/g) || []).length ? ';' : ',';
    const pecah = function (b) { const out = []; let cur = '', q = false; for (let i = 0; i < b.length; i++) { const c = b[i]; if (q) { if (c === '"' && b[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === pemisah) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(function (x) { return x.trim(); }); };
    const hdr = pecah(baris[0]).map(function (x) { return x.toLowerCase(); });
    return baris.slice(1).map(function (b) { const v = pecah(b), o = {}; hdr.forEach(function (k, i) { o[k] = v[i] || ''; }); return o; });
  }
  function tabImpor(isi) {
    let baris = null;
    const sheet = UI.inp({ placeholder: 'Tempel URL spreadsheet template impor (opsional)' });
    const fileInp = h('input', { type: 'file', accept: '.csv,text/csv', class: 'inp', onchange: async function () { const f = fileInp.files[0]; if (!f) return; baris = parseCsv(await f.text()); info.textContent = baris.length + ' baris terbaca dari ' + f.name; } });
    const info = h('span', { class: 'small muted' }), buat = h('input', { type: 'checkbox', checked: true }), timpa = h('input', { type: 'checkbox' }), hasil = h('div');
    const kirim = async function (b, dry) {
      if (!baris && !sheet.value.trim()) { toast('Pilih berkas CSV atau tempel URL spreadsheet.', 'warn'); return; }
      const r = await aksi(b, 'impor.pegawai', { baris: sheet.value.trim() ? undefined : baris, sheet: sheet.value.trim() || undefined, dry_run: dry, buat_akun: buat.checked, timpa: timpa.checked }, { proses: dry ? 'Memindai…' : 'Mengimpor…' });
      if (!r.ok) return;
      const l = r.data.laporan;
      hasil.replaceChildren(UI.kartu({ judul: dry ? 'Hasil pindai (belum ada yang ditulis)' : 'Impor selesai', ikon: dry ? 'search' : 'checkCircle', warnaIkon: dry ? '' : 'ok' }, h('div', { class: 'col' },
        h('div', { class: 'grid g4 tetap2' }, UI.stat({ label: 'Baris sumber', ikon: 'list', nilai: l.sumber }), UI.stat({ label: 'Ditambah', ikon: 'plus', warna: 'ok', nilai: l.ditambah }), UI.stat({ label: 'Diperbarui', ikon: 'refresh', warna: 'ind', nilai: l.diperbarui }), UI.stat({ label: 'Dilewati', ikon: 'x', warna: 'warn', nilai: l.dilewati, sub: 'Akun baru: ' + l.akun_baru })),
        r.data.peringatan.length ? h('div', { class: 'box warn' }, h('b', null, 'Peringatan'), h('ul', null, r.data.peringatan.map(function (p) { return h('li', { class: 'small' }, p); }))) : null,
        dry && (l.ditambah || l.diperbarui || l.akun_baru) ? h('button', { class: 'btn pri', onclick: function (e) { kirim(e.currentTarget, false); } }, ic('play', 's'), 'Jalankan impor') : null)));
      if (!dry) { await segarMaster(); if (r.data.kredensial.length) tampilkanSandi('Akun baru (' + r.data.kredensial.length + ')', r.data.kredensial); }
    };
    const template = 'nama;nip;nuptk;jenis;jabatan;mapel_utama;status_kepegawaian;email_dinas;username;label\nContoh Guru, S.Pd.;199001012019031001;;guru;Guru Mapel;Ilmu Pengetahuan Sosial;PPPK;contoh@guru.smp.belajar.id;;Wali Kelas\n';
    isi.replaceChildren(h('div', { class: 'grid g-main' }, h('div', { class: 'stack' },
      UI.kartu({ judul: 'Impor Pegawai & Akun Massal', sub: 'Aman diulang: data kunci NIP → NUPTK → email; baris yang sudah ada dilewati kecuali opsi perbarui dicentang.', ikon: 'upload' }, h('div', { class: 'form' },
        UI.fld('1. Berkas CSV (pemisah ; atau ,)', h('div', { class: 'col' }, fileInp, info)), UI.fld('atau URL spreadsheet template impor', sheet, { bantuan: 'Template dibuat setupAwal() di folder Drive "SIGURU MUTU/Template". Spreadsheet hanya DIBACA.' }),
        h('label', { class: 'cek' }, buat, h('span', null, 'Buat akun dengan sandi awal acak untuk pegawai yang belum punya akun')), h('label', { class: 'cek' }, timpa, h('span', null, 'Perbarui data pegawai yang sudah ada (nama, jabatan, mapel, status, email)')),
        h('div', { class: 'row wrap' }, h('button', { class: 'btn', onclick: function () { UI.unduhTeks('template-impor-pegawai.csv', '﻿' + template, 'text/csv'); } }, ic('download', 's'), 'Unduh template CSV'), h('button', { class: 'btn pri', onclick: function (e) { kirim(e.currentTarget, true); } }, ic('search', 's'), 'Pindai (dry-run)')))), hasil),
      UI.kartu({ judul: 'Catatan', ikon: 'info' }, h('ul', { class: 'small', style: { paddingLeft: '18px', margin: 0 } }, h('li', null, 'Kolom NIP/NUPTK ditulis sebagai teks agar digit tidak hilang.'), h('li', null, 'Kolom label opsional, pisahkan dengan titik koma.'), h('li', null, 'Jangan cantumkan NIK, alamat, atau tanggal lahir di berkas impor.'), h('li', null, 'Unduhan kredensial wajib dihapus setelah sandi dibagikan.')))));
  }
  // ---------- Usulan ----------
  function tabUsulan(isi) {
    tampilkan(isi, [['usulan.list', {}]], function (u) {
      isi.replaceChildren(u.length ? h('div', { class: 'grid g2' }, u.map(function (x) {
        return h('div', { class: 'card col' }, h('div', { class: 'row' }, UI.ava(x.nama, 's'), h('b', { class: 'grow' }, x.nama), h('span', { class: 'tag' }, x.jenis === 'hapus_pribadi' ? 'Hapus data pribadi' : 'Koreksi ' + x.kolom)),
          x.jenis === 'hapus_pribadi' ? h('p', { class: 'small' }, 'Data pribadi (NIK, alamat, kontak, tanggal lahir, dokumen) akan dikosongkan. Data kinerja tetap diarsip.') : h('div', { class: 'row small' }, h('span', { class: 'muted' }, x.nilai_lama || '(kosong)'), ic('chevR', 's'), h('b', null, x.nilai_baru)),
          x.alasan ? h('p', { class: 'small muted' }, 'Alasan: ' + x.alasan) : null,
          h('div', { class: 'row' }, h('button', { class: 'btn kecil', onclick: async function (e) { const c = await tanya('Tolak usulan', 'Catatan', { ya: 'Tolak' }); if (c !== null) { const r = await aksi(null, 'usulan.putuskan', { id: x.id, setuju: false, catatan: c }); if (r.ok) Router.jalan(); } } }, 'Tolak'), h('button', { class: 'btn ok kecil', onclick: async function (e) { if (x.jenis === 'hapus_pribadi' && !(await konfirmasi('Hapus data pribadi ' + x.nama + '?', 'Tindakan ini tidak bisa dibatalkan.', { bahaya: true, ya: 'Hapus' }))) return; const r = await aksi(e.currentTarget, 'usulan.putuskan', { id: x.id, setuju: true }); if (r.ok) { await segarMaster(); Router.jalan(); } } }, ic('check', 's'), 'Setujui')));
      })) : UI.kartu({}, UI.kosong('Tidak ada usulan yang menunggu.', 'checkCircle')));
    }, { kerangka: 'daftar' });
  }
})();

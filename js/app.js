/* SIGURU MUTU — app.js: shell (sidebar, topbar, bottom nav), login & gerbang, menu per hak, boot + prefetch, rute. */
(function () {
  'use strict';
  const MENU = [
    { g: 'Utama', id: 'beranda', label: 'Beranda', ikon: 'home', rute: '/beranda', lihat: function () { return true; } },
    { g: 'Administrasi', id: 'perangkat', label: 'Perangkat Ajar', ikon: 'book', rute: '/perangkat', lihat: function (h) { return h.perangkat_isi || h.perangkat_lihat_semua || h.perangkat_binaan; } },
    { g: 'Administrasi', id: 'rekap', label: 'Rekap Mingguan', ikon: 'clipboard', rute: '/rekap', lihat: function (h) { return h.rekap_isi || h.rekap_lihat_semua || h.rekap_binaan; } },
    { g: 'Administrasi', id: 'refleksi', label: 'Refleksi Bulanan', ikon: 'message', rute: '/refleksi', lihat: function (h) { return h.rekap_isi || h.rekap_lihat_semua || h.rekap_ringkasan || h.rekap_binaan; } },
    { g: 'Administrasi', id: 'tugas', label: 'Tugas Tambahan', ikon: 'briefcase', rute: '/tugas', lihat: function (h) { return h.tugas_isi || h.tugas_lihat_semua; } },
    { g: 'Administrasi', id: 'kinerja', label: 'Kinerja Tendik', ikon: 'activity', rute: '/kinerja', lihat: function (h) { return h.tendik_isi || h.tendik_lihat_semua; } },
    { g: 'Administrasi', id: 'pkb', label: 'PKB & Portofolio', ikon: 'graduation', rute: '/pkb', lihat: function (h) { return h.pkb_isi || h.pkb_lihat_semua; } },
    { g: 'Supervisi', id: 'supervisi', label: 'Supervisi Akademik', ikon: 'userCheck', rute: '/supervisi', lihat: function (h) { return h.supervisi_hasil_saya || h.supervisi_nilai || h.supervisi_lihat_semua || h.supervisi_lihat_disahkan; } },
    { g: 'Supervisi', id: 'instrumen', label: 'Kelola Instrumen', ikon: 'list', rute: '/instrumen', lihat: function (h) { return h.instrumen_lihat; } },
    { g: 'Penjaminan Mutu', id: 'mutu', label: 'Dashboard Mutu', ikon: 'dashboard', rute: '/mutu', lihat: function (h) { return h.dashboard_mutu || h.dashboard_ringkasan; } },
    { g: 'Penjaminan Mutu', id: 'spmi', label: 'SPMI 6 Tahap', ikon: 'layers', rute: '/spmi', lihat: function (h) { return h.spmi_lihat; } },
    { g: 'Penjaminan Mutu', id: 'temuan', label: 'Temuan & RTL', ikon: 'flag', rute: '/temuan', lihat: function (h) { return h.rtl_lihat_semua || h.rtl_pic || h.spmi_lihat; } },
    { g: 'Penjaminan Mutu', id: 'bukti', label: 'Repositori Bukti', ikon: 'folder', rute: '/bukti', lihat: function (h) { return h.bukti_isi || h.bukti_lihat_semua; } },
    { g: 'Laporan', id: 'laporan', label: 'Laporan', ikon: 'chart', rute: '/laporan', lihat: function (h) { return h.laporan_semua || h.laporan_admin || h.laporan_binaan || h.laporan_pengawas || h.is_guru || h.is_tendik; } },
    { g: 'Sistem', id: 'pengaturan', label: 'Pengaturan', ikon: 'settings', rute: '/pengaturan', lihat: function (h) { return h.kelola_akun || h.kelola_master || h.kelola_pengaturan; } },
    { g: 'Sistem', id: 'log', label: 'Log Aktivitas', ikon: 'history', rute: '/log', lihat: function (h) { return h.log_lihat; } }
  ];
  const PERAN = { kepsek: 'Kepala Sekolah', guru: 'Guru', tendik: 'Tenaga Kependidikan', pengawas: 'Pengawas', darurat: 'Akses Darurat' };

  const App = {
    me: null, master: null, beranda: null, el: {},
    hak: function (k) { return !!(App.me && App.me.hak && App.me.hak[k]); },
    peranLabel: function () { return App.me ? (PERAN[App.me.peran] || App.me.peran) + (App.me.labels && App.me.labels.length ? ' · ' + App.me.labels.join(', ') : '') : ''; },
    pegawai: function (id) { return ((App.master && App.master.pegawai) || []).filter(function (p) { return p.id === id; })[0] || null; },
    nama: function (id) { const p = App.pegawai(id); return p ? p.nama : '-'; },
    smtAktif: function () { const m = App.master || {}; return (m.semester || []).filter(function (s) { return s.id === m.smt_aktif; })[0] || {}; },

    mulai: function () {
      terapkanTema(LS.get('sg_tema') || 'sistem');
      daftarRute();
      window.addEventListener('hashchange', Router.jalan);
      window.addEventListener('online', function () { toast('Koneksi kembali tersambung.', 'ok'); });
      window.addEventListener('offline', function () { toast('Koneksi terputus. Isian tetap tersimpan sebagai draf di perangkat ini.', 'warn'); });
      if (/^#\/verifikasi/.test(location.hash)) { Router.jalan(); return; }
      if (!Transport.siap()) { layarKonfig(); return; }
      if (!Api.token) { layarLogin(); return; }
      const boot = bacaBoot();
      if (boot && boot.me && !boot.me.gate) { pasangBoot(boot); bangunShell(); Router.jalan(); }
      else document.getElementById('app').replaceChildren(h('div', { class: 'auth-kanan', style: { minHeight: '100vh' } }, h('span', { class: 'putar' })));
      Api.call('boot').then(function (r) {
        if (!r.ok) { if (r.code !== 'SESI') { toast(r.error, 'bad'); if (!boot) layarLogin(); } return; }
        simpanBoot(r.data);
        if (r.data.me.gate) { App.keGerbang(r.data.me.gate); return; }
        const sudah = !!App.el.shell; pasangBoot(r.data);
        if (!sudah) { bangunShell(); Router.jalan(); } else perbaruiShell();
        prefetch();
      });
    },
    tampilRute: function (r, param, path) {
      if (r && r.publik) { document.body.classList.remove('ada-shell'); r.fn(document.getElementById('app'), param); return; }
      if (!App.me) { if (Api.token) return; layarLogin(); return; }
      if (!App.el.shell) bangunShell();
      if (!r) { Router.go('/beranda'); return; }
      const view = App.el.view;
      view.dataset.kotor = '';
      App.el.side.classList.remove('buka'); App.el.drawerBg.classList.remove('buka');
      MENU.forEach(function (m) { const a = App.el.navLink[m.id]; if (a) a.classList.toggle('aktif', m.id === r.menu); });
      App.el.bnav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('aktif', a.dataset.menu === r.menu || (a.dataset.alt || '').split(',').indexOf(r.menu) > -1); });
      App.el.judulM.textContent = r.judul || 'SIGURU MUTU';
      document.title = (r.judul ? r.judul + ' · ' : '') + 'SIGURU MUTU';
      const m = MENU.filter(function (x) { return x.id === r.menu; })[0];
      if (m && !m.lihat(App.me.hak)) { view.replaceChildren(UI.galatKartu('Menu ini tidak tersedia untuk peran Anda.')); return; }
      window.scrollTo(0, 0);
      try { r.fn(view, param); } catch (e) { console.error(e); view.replaceChildren(UI.galatKartu('Terjadi kesalahan tampilan: ' + e.message)); }
    },
    sesiHabis: function (pesan) {
      bersihSesi(); layarLogin(pesan || 'Sesi berakhir. Silakan masuk kembali.');
    },
    keGerbang: function (gate) { if (gate === 'sandi') layarGantiSandi(true); else layarPersetujuan(); },
    keluar: async function () {
      Api.call('auth.logout');
      bersihSesi(); layarLogin('Anda telah keluar.');
    },
    /** Muat ulang boot (mis. setelah label berubah) */
    segarkanBoot: async function () {
      const r = await Api.call('boot'); if (r.ok && !r.data.me.gate) { simpanBoot(r.data); pasangBoot(r.data); perbaruiShell(); }
    },
    MENU: MENU
  };
  window.App = App;

  // ---------------------------------------------------------------- Boot
  function simpanBoot(b) { SS.set('sg_boot', JSON.stringify(b)); }
  function bacaBoot() { try { return JSON.parse(SS.get('sg_boot')); } catch (e) { return null; } }
  function pasangBoot(b) {
    App.me = b.me; App.master = b.master || App.master; App.beranda = b.beranda || App.beranda;
    if (b.master) Data.set('master.get', {}, b.master);
    if (b.beranda) Data.set('beranda', {}, b.beranda);
  }
  function bersihSesi() {
    Api.setToken(''); SS.del('sg_boot'); Data.hapusSemua();
    App.me = null; App.master = null; App.beranda = null; App.el = {};
    document.body.classList.remove('ada-shell');
  }
  /** Prefetch menu inti sesuai peran dalam SATU panggilan batch saat peramban senggang. */
  function prefetch() {
    const h = App.me.hak, daftar = [];
    if (h.rekap_isi) daftar.push(['rekap.list', {}], ['refleksi.list', {}]);
    if (h.perangkat_isi || h.perangkat_lihat_semua || h.perangkat_binaan) daftar.push(['perangkat.list', {}]);
    if (h.tugas_isi || h.tugas_lihat_semua) daftar.push(['tugas.list', {}]);
    if (h.tendik_isi || h.tendik_lihat_semua) daftar.push(['tendik.list', {}]);
    if (h.supervisi_hasil_saya || h.supervisi_nilai || h.supervisi_lihat_semua || h.supervisi_lihat_disahkan) daftar.push(['jadwal.list', {}], ['supervisi.daftar', {}]);
    if (h.dashboard_mutu || h.dashboard_ringkasan) daftar.push(['mutu.ringkasan', {}]);
    if (h.rtl_lihat_semua || h.rtl_pic) daftar.push(['temuan.list', {}]);
    if (h.kelola_akun) daftar.push(['akun.list', {}]);
    const jalan = function () { daftar.slice(0, 10).forEach(function (d) { if (!Data.segar(Data.get(d[0], d[1]), 60000)) Data.ambil(d[0], d[1], 60000); }); };
    (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(jalan);
  }

  // ---------------------------------------------------------------- Shell
  function bangunShell() {
    const cfg = (App.master && App.master.cfg) || {};
    const el = App.el; el.navLink = {};
    el.side = h('aside', { class: 'side', 'aria-label': 'Menu utama' });
    el.view = h('main', { class: 'content', id: 'konten', tabindex: '-1' });
    el.judulM = h('span', { class: 'judul-m hanya-m' }, 'SIGURU MUTU');
    el.drawerBg = h('div', { class: 'drawer-bg', onclick: function () { el.side.classList.remove('buka'); el.drawerBg.classList.remove('buka'); } });
    el.cari = kotakCari();
    el.lonceng = h('button', { class: 'ibtn', 'aria-label': 'Notifikasi', onclick: bukaNotif }, ic('bell'));
    el.user = h('button', { class: 'user-chip', 'aria-label': 'Menu akun', onclick: bukaAkun });
    el.smt = h('span', { class: 'smt-chip' });
    const top = h('header', { class: 'top' },
      h('button', { class: 'ibtn menu-btn', 'aria-label': 'Buka menu', onclick: function () { el.side.classList.add('buka'); el.drawerBg.classList.add('buka'); } }, ic('menu')),
      el.judulM, el.cari, h('span', { class: 'grow sembunyi-m' }), el.smt, el.lonceng, el.user);
    el.bnav = h('nav', { class: 'bnav', 'aria-label': 'Navigasi bawah' });
    el.shell = h('div', { class: 'shell' }, el.side, h('div', { class: 'main' }, top, el.view), el.drawerBg, el.bnav);
    document.getElementById('app').replaceChildren(el.shell);
    document.body.classList.add('ada-shell');
    perbaruiShell();
    if (cfg.nama_sekolah) document.title = 'SIGURU MUTU · ' + cfg.nama_sekolah;
  }
  function perbaruiShell() {
    const el = App.el, hk = App.me.hak, cfg = (App.master && App.master.cfg) || {}, b = App.beranda || {};
    const logo = cfg.logo_url ? h('img', { src: cfg.logo_url, alt: '' }) : ic('shield');
    const cnt = { perangkat: b.menunggu && b.menunggu.perangkat, supervisi: b.menunggu && b.menunggu.supervisi, tugas: (b.menunggu && b.menunggu.tugas) || (b.tugas_belum && b.tugas_belum.length), temuan: b.rtl_saya && b.rtl_saya.length, kinerja: b.menunggu && b.menunggu.tendik };
    let grup = '';
    const nav = h('nav', { class: 'nav' });
    MENU.forEach(function (m) {
      if (!m.lihat(hk)) return;
      if (m.g !== grup) { grup = m.g; nav.appendChild(h('div', { class: 'nav-g' }, grup)); }
      const a = h('a', { href: '#' + m.rute }, ic(m.ikon), m.label, cnt[m.id] ? h('span', { class: 'cnt', 'aria-label': cnt[m.id] + ' menunggu' }, String(cnt[m.id])) : null);
      el.navLink[m.id] = a; nav.appendChild(a);
    });
    const smt = App.smtAktif(), pr = b.jumlah_minggu ? Math.min(100, Math.round((b.minggu_ke || 0) / b.jumlah_minggu * 100)) : 0;
    el.side.replaceChildren(
      h('div', { class: 'brand' }, h('div', { class: 'brand-logo' }, logo), h('div', null, h('b', null, 'SIGURU MUTU'), h('small', null, cfg.nama_sekolah || ''))),
      nav,
      h('div', { class: 'side-foot' }, h('div', { class: 'periode' },
        h('div', { class: 'row between xs muted' }, 'Periode aktif', UI.badge('ya')),
        h('div', { class: 'bold mt-s row' }, ic('calendar', 's'), (smt.semester || '') + ' ' + (smt.tahun_ajaran || '')),
        h('div', { class: 'bar' }, h('i', { style: { width: pr + '%' } })),
        h('div', { class: 'xs muted mt-s' }, 'Minggu ke-' + (b.minggu_ke || '-') + ' dari ' + (b.jumlah_minggu || '-'))))
    );
    el.smt.textContent = 'Semester ' + (smt.semester || '') + ' ' + (smt.tahun_ajaran || '');
    el.user.replaceChildren(UI.ava(App.me.nama, 's'), h('span', { class: 'nm sembunyi-m' }, h('b', null, App.me.nama), h('small', null, PERAN[App.me.peran] || '')));
    const notif = daftarNotif();
    el.lonceng.replaceChildren(ic('bell'), notif.length ? h('span', { class: 'dot' }) : null);
    // Bottom nav (HP): Beranda, Isi, Supervisi/Mutu, Saya
    const isi = hk.rekap_isi ? ['/rekap', 'Isi', 'edit', 'rekap', 'perangkat,refleksi,tugas,pkb'] : hk.tendik_isi ? ['/kinerja', 'Isi', 'edit', 'kinerja', 'tugas,pkb'] : hk.perangkat_sahkan ? ['/perangkat', 'Periksa', 'clipboard', 'perangkat', 'rekap,refleksi,tugas,kinerja'] : hk.kelola_akun ? ['/pengaturan', 'Kelola', 'settings', 'pengaturan', 'log'] : ['/laporan', 'Laporan', 'chart', 'laporan', ''];
    const ketiga = (hk.dashboard_mutu || hk.dashboard_ringkasan) && !hk.is_guru ? ['/mutu', 'Mutu', 'dashboard', 'mutu', 'spmi,temuan,bukti,laporan'] : ['/supervisi', 'Supervisi', 'userCheck', 'supervisi', 'instrumen,temuan'];
    const tab = function (t) { return h('a', { href: '#' + t[0], dataset: { menu: t[3], alt: t[4] || '' } }, ic(t[2]), t[1]); };
    el.bnav.replaceChildren(tab(['/beranda', 'Beranda', 'home', 'beranda']), tab(isi), tab(ketiga), tab(['/profil', 'Saya', 'user', 'profil']));
  }
  function kotakCari() {
    const inp = h('input', { type: 'search', placeholder: 'Cari menu, guru, atau halaman…', 'aria-label': 'Cari' });
    const hasil = h('div', { class: 'cari-hasil hide', role: 'listbox' });
    const wrap = h('div', { class: 'cari' }, ic('search'), inp, hasil);
    let pilihan = [], idx = 0;
    function gambar() {
      const q = inp.value.trim().toLowerCase();
      if (!q) { hasil.classList.add('hide'); return; }
      pilihan = MENU.filter(function (m) { return m.lihat(App.me.hak) && m.label.toLowerCase().indexOf(q) > -1; }).map(function (m) { return { ikon: m.ikon, label: m.label, sub: 'Menu', rute: m.rute }; });
      if (App.hak('lihat_profil_semua')) (App.master.pegawai || []).filter(function (p) { return p.nama.toLowerCase().indexOf(q) > -1 || String(p.nip).indexOf(q) > -1; }).slice(0, 6)
        .forEach(function (p) { pilihan.push({ ikon: 'user', label: p.nama, sub: (p.jabatan || p.jenis) + (p.nip ? ' · ' + p.nip : ''), rute: '/profil/' + p.id }); });
      idx = 0;
      hasil.replaceChildren.apply(hasil, pilihan.length ? pilihan.map(function (x, i) { return h('a', { href: '#' + x.rute, class: i === idx ? 'fokus' : '', onclick: function () { inp.value = ''; hasil.classList.add('hide'); } }, ic(x.ikon, 's'), h('span', null, h('b', null, x.label), h('div', { class: 'xs muted' }, x.sub))); }) : [h('div', { class: 'small muted', style: { padding: '10px' } }, 'Tidak ditemukan.')]);
      hasil.classList.remove('hide');
    }
    inp.addEventListener('input', gambar);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && pilihan[idx]) { Router.go(pilihan[idx].rute); inp.value = ''; hasil.classList.add('hide'); } if (e.key === 'Escape') { inp.value = ''; hasil.classList.add('hide'); } });
    inp.addEventListener('blur', function () { setTimeout(function () { hasil.classList.add('hide'); }, 200); });
    return wrap;
  }
  function daftarNotif() {
    const b = App.beranda || {}, n = [];
    const m = b.menunggu || {};
    if (m.supervisi) n.push(['userCheck', m.supervisi + ' hasil supervisi menunggu pengesahan', '/supervisi']);
    if (m.perangkat) n.push(['book', m.perangkat + ' perangkat ajar menunggu pemeriksaan', '/perangkat']);
    if (m.tugas) n.push(['briefcase', m.tugas + ' laporan tugas tambahan menunggu', '/tugas']);
    if (m.tendik) n.push(['activity', m.tendik + ' laporan kinerja tendik menunggu', '/kinerja']);
    if (m.usulan_spmi) n.push(['sparkle', m.usulan_spmi + ' usulan standar/indikator mutu', '/spmi']);
    (b.rtl_saya || []).forEach(function (r) { n.push([r.status === 'terlambat' ? 'alertCircle' : 'flag', 'RTL ' + (r.kode || '') + ': ' + r.tindakan + ' (tenggat ' + F.tglP(r.tenggat) + ')', '/temuan']); });
    (b.tugas_belum || []).forEach(function (t) { n.push(['briefcase', 'Laporan "' + t.nama + '" belum diisi', '/tugas']); });
    if (b.kelengkapan && !b.kelengkapan.rekap.minggu_ini_terisi) n.push(['clipboard', 'Rekap minggu ke-' + b.minggu_ke + ' belum diisi', '/rekap']);
    if (b.refleksi_terbuka) n.push(['message', 'Refleksi ' + F.bulan(b.refleksi_terbuka) + ' sudah dibuka', '/refleksi']);
    if (b.hasil_terbaru && !b.hasil_terbaru.sudah_tanggapan) n.push(['award', 'Hasil supervisi Anda sudah disahkan. Beri tanggapan.', '/supervisi']);
    if (b.akun && b.akun.terkunci) n.push(['lock', b.akun.terkunci + ' akun terkunci', '/pengaturan']);
    if (b.akun && b.akun.usulan) n.push(['edit', b.akun.usulan + ' usulan perubahan data pegawai', '/pengaturan']);
    return n;
  }
  function dropdown(isi) {
    document.querySelectorAll('.dropdown').forEach(function (d) { d.remove(); });
    const d = h('div', { class: 'dropdown', role: 'menu' }, isi);
    document.body.appendChild(d);
    setTimeout(function () { document.addEventListener('click', function tutup(e) { if (!d.contains(e.target)) { d.remove(); document.removeEventListener('click', tutup); } }); }, 0);
    return d;
  }
  function bukaNotif() {
    const n = daftarNotif();
    dropdown([h('div', { class: 'bold', style: { padding: '8px 12px' } }, 'Perlu perhatian')].concat(n.length ? n.map(function (x) { return h('a', { href: '#' + x[2] }, ic(x[0], 's'), h('span', { class: 'small' }, x[1])); }) : [h('div', { class: 'small muted', style: { padding: '8px 12px 12px' } }, 'Semua beres. Tidak ada yang menunggu.')]));
  }
  function bukaAkun() {
    const tema = LS.get('sg_tema') || 'sistem';
    dropdown([
      h('div', { class: 'row', style: { padding: '8px 12px 12px' } }, UI.ava(App.me.nama), h('div', null, h('b', null, App.me.nama), h('div', { class: 'xs muted' }, App.peranLabel()))),
      App.me.darurat ? null : h('a', { href: '#/profil' }, ic('user', 's'), 'Profil saya'),
      h('div', { class: 'xs muted', style: { padding: '6px 12px 2px' } }, 'Tema tampilan'),
      h('div', { style: { padding: '4px 8px 8px' } }, UI.seg([{ id: 'sistem', label: 'Perangkat' }, { id: 'light', label: 'Terang' }, { id: 'dark', label: 'Gelap' }], tema, function (t) { LS.set('sg_tema', t); terapkanTema(t); })),
      h('button', { onclick: App.keluar }, ic('logout', 's'), 'Keluar')
    ]);
  }
  function terapkanTema(t) { if (t === 'sistem') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }

  // ---------------------------------------------------------------- Layar masuk & gerbang
  function layarAuth(isiKanan) {
    document.body.classList.remove('ada-shell'); App.el = {};
    document.getElementById('app').replaceChildren(h('div', { class: 'auth' },
      h('div', { class: 'auth-kiri' },
        h('div', null, h('div', { class: 'row' }, h('div', { class: 'brand-logo', style: { background: 'rgba(255,255,255,.16)' } }, ic('shield')), h('b', null, 'SIGURU MUTU')),
          h('h1', null, 'Administrasi guru & penjaminan mutu dalam satu tempat.'),
          h('p', null, 'Rekap mingguan kurang dari 3 menit, supervisi digital berversi, dan siklus SPMI enam tahap yang setiap temuannya punya pemilik dan tenggat.'),
          h('div', { class: 'auth-fitur' }, [['clipboard', 'Rekap mingguan dengan pilihan cepat'], ['userCheck', 'Supervisi berversi, nilai dihitung otomatis'], ['layers', 'SPMI: menetapkan sampai mengendalikan'], ['shield', 'Data pribadi tersamar dan tercatat']].map(function (f) { return h('div', null, ic(f[0]), f[1]); }))),
        h('div', { class: 'kaki small', style: { opacity: '.75' } }, 'UPT SMP Negeri 3 Batipuh · Sesuai siklus SPMI Permendikdasmen No. 21 Tahun 2026')),
      h('div', { class: 'auth-kanan' }, h('div', { class: 'auth-kotak' }, isiKanan))));
  }
  function layarKonfig() {
    layarAuth([h('h2', null, 'Konfigurasi belum lengkap'), h('p', { class: 'muted mt-s' }, 'Isi URL Web App Apps Script (berakhiran /exec) di berkas js/config.js, lalu unggah ulang ke GitHub. Lihat PANDUAN-INSTALASI.md langkah 4.')]);
  }
  function layarLogin(pesan) {
    Transport.hangatkan();
    const user = UI.inp({ name: 'username', autocomplete: 'username', placeholder: 'NIP / NUPTK / email', required: true, autocapitalize: 'off' });
    const pass = UI.sandi({ name: 'password', required: true });
    const galat = h('div', { class: 'galat' + (pesan ? '' : ' hide'), role: 'alert' }, ic('alertCircle', 's'), h('span', null, pesan || ''));
    const btn = h('button', { class: 'btn pri', type: 'submit', style: { width: '100%' } }, ic('logout', 's'), 'Masuk');
    const form = h('form', { class: 'form mt', onsubmit: async function (e) {
      e.preventDefault();
      galat.classList.add('hide');
      btn.disabled = true; btn.replaceChildren(h('span', { class: 'putar' }), 'Memeriksa…');
      const r = await Api.kirim('auth.login', { username: user.value, password: pass.input.value });
      btn.disabled = false; btn.replaceChildren(ic('logout', 's'), 'Masuk');
      if (!r.ok) { galat.lastChild.textContent = r.error; galat.classList.remove('hide'); pass.input.value = ''; pass.input.focus(); return; }
      Api.setToken(r.data.token);
      masukDenganBoot(r.data.boot);
    } }, galat, UI.fld('Nama pengguna', user, { wajib: true }), UI.fld('Kata sandi', pass, { wajib: true }), btn);
    layarAuth([h('h2', null, 'Masuk'), h('p', { class: 'muted' }, 'Gunakan akun yang dibuat operator sekolah.'), form,
      h('p', { class: 'small muted mt' }, 'Lupa kata sandi? Hubungi operator sekolah untuk reset.'),
      h('a', { class: 'link mt-s', href: '#/verifikasi' }, ic('qr', 's'), 'Verifikasi keaslian dokumen')]);
    setTimeout(function () { user.focus(); }, 50);
  }
  function masukDenganBoot(boot) {
    simpanBoot(boot);
    if (boot.me.gate) { App.me = boot.me; App.keGerbang(boot.me.gate); return; }
    pasangBoot(boot); bangunShell();
    if (!/^#\/./.test(location.hash) || /^#\/(verifikasi)?$/.test(location.hash)) location.hash = '#/beranda'; else Router.jalan();
    prefetch();
  }
  function layarGantiSandi(wajib) {
    const lama = UI.sandi({ autocomplete: 'current-password' }), baru = UI.sandi({ autocomplete: 'new-password' }), ulang = UI.sandi({ autocomplete: 'new-password' });
    const btn = h('button', { class: 'btn pri', type: 'submit' }, ic('key', 's'), 'Simpan kata sandi baru');
    const form = h('form', { class: 'form mt', onsubmit: async function (e) {
      e.preventDefault();
      if (baru.input.value !== ulang.input.value) { toast('Ulangi kata sandi baru dengan benar.', 'warn'); return; }
      const r = await aksi(btn, 'auth.gantiSandi', { sandi_lama: lama.input.value, sandi_baru: baru.input.value });
      if (r.ok) masukDenganBoot(r.data.boot);
    } }, UI.fld('Kata sandi saat ini (sandi awal dari operator)', lama, { wajib: true }), UI.fld('Kata sandi baru', baru, { wajib: true, bantuan: 'Minimal 8 karakter, berisi huruf dan angka, tidak memuat nama pengguna.' }), UI.fld('Ulangi kata sandi baru', ulang, { wajib: true }), btn);
    layarAuth([h('span', { class: 'bdg warn' }, ic('key'), 'Langkah 1 dari 2'), h('h2', { class: 'mt-s' }, 'Ganti kata sandi awal'), h('p', { class: 'muted' }, 'Demi keamanan, sandi awal dari operator wajib diganti sebelum memakai aplikasi. Perangkat lain yang masuk dengan akun ini akan dikeluarkan.'), form,
      h('button', { class: 'link mt', onclick: App.keluar }, ic('logout', 's'), 'Keluar')]);
  }
  async function layarPersetujuan() {
    const teks = h('div', { class: 'box mt', style: { maxHeight: '320px', overflow: 'auto', lineHeight: '1.6' } }, h('span', { class: 'putar' }));
    const cek = h('input', { type: 'checkbox' });
    const btn = h('button', { class: 'btn pri', type: 'button', disabled: true, onclick: async function () {
      const r = await aksi(btn, 'auth.setujuiData', { setuju: true });
      if (r.ok) { const b = await Api.call('boot'); if (b.ok) masukDenganBoot(b.data); }
    } }, ic('checkCircle', 's'), 'Setuju dan lanjutkan');
    cek.addEventListener('change', function () { btn.disabled = !cek.checked; });
    layarAuth([h('span', { class: 'bdg info' }, ic('shield'), 'Langkah 2 dari 2'), h('h2', { class: 'mt-s' }, 'Pernyataan pemrosesan data pribadi'),
      h('p', { class: 'muted' }, 'Baca pernyataan berikut sebelum memakai SIGURU MUTU (UU No. 27 Tahun 2022).'), teks,
      h('label', { class: 'cek mt' }, cek, h('span', null, 'Saya telah membaca dan menyetujui pemrosesan data sebagaimana dijelaskan di atas.')), btn,
      h('button', { class: 'link mt', onclick: App.keluar }, ic('logout', 's'), 'Keluar')]);
    const r = await Api.call('auth.pernyataan');
    teks.replaceChildren(r.ok ? h('p', null, r.data.teks) : h('p', null, r.error), r.ok ? h('p', { class: 'xs muted mt-s' }, 'Versi pernyataan: ' + r.data.versi) : null);
  }

  // ---------------------------------------------------------------- Rute
  function daftarRute() {
    const P = window.HAL;
    const r = function (pola, fn, menu, judul, opsi) { Router.daftar(pola, fn, Object.assign({ menu: menu, judul: judul }, opsi || {})); };
    r('/verifikasi', P.verifikasi, '', 'Verifikasi Dokumen', { publik: true });
    r('/verifikasi/:kode', P.verifikasi, '', 'Verifikasi Dokumen', { publik: true });
    r('/', function () { Router.go('/beranda'); }, 'beranda', 'Beranda');
    r('/beranda', P.beranda, 'beranda', 'Beranda');
    r('/perangkat', P.perangkat, 'perangkat', 'Perangkat Ajar');
    r('/rekap', P.rekap, 'rekap', 'Rekap Mingguan');
    r('/refleksi', P.refleksi, 'refleksi', 'Refleksi Bulanan');
    r('/tugas', P.tugas, 'tugas', 'Tugas Tambahan');
    r('/kinerja', P.kinerja, 'kinerja', 'Kinerja Tendik');
    r('/pkb', P.pkb, 'pkb', 'PKB & Portofolio');
    r('/supervisi', P.supervisi, 'supervisi', 'Supervisi Akademik');
    r('/supervisi/nilai/:id', P.penilaian, 'supervisi', 'Penilaian Supervisi');
    r('/supervisi/hasil/:id', P.hasilSupervisi, 'supervisi', 'Hasil Supervisi');
    r('/instrumen', P.instrumen, 'instrumen', 'Kelola Instrumen');
    r('/instrumen/:id', P.instrumenEdit, 'instrumen', 'Editor Instrumen');
    r('/mutu', P.mutu, 'mutu', 'Dashboard Mutu');
    r('/spmi', P.spmi, 'spmi', 'SPMI 6 Tahap');
    r('/spmi/:tahap', P.spmi, 'spmi', 'SPMI 6 Tahap');
    r('/temuan', P.temuan, 'temuan', 'Temuan & RTL');
    r('/bukti', P.bukti, 'bukti', 'Repositori Bukti');
    r('/laporan', P.laporan, 'laporan', 'Laporan');
    r('/laporan/:jenis', P.laporanLihat, 'laporan', 'Laporan');
    r('/pengaturan', P.pengaturan, 'pengaturan', 'Pengaturan');
    r('/pengaturan/:tab', P.pengaturan, 'pengaturan', 'Pengaturan');
    r('/log', P.log, 'log', 'Log Aktivitas');
    r('/profil', P.profil, 'profil', 'Profil Saya');
    r('/profil/:id', P.profil, 'profil', 'Profil Pegawai');
  }

  document.addEventListener('DOMContentLoaded', App.mulai);
})();

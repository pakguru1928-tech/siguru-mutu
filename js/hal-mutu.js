/* SIGURU MUTU — hal-mutu.js: Dashboard Mutu, SPMI 6 Tahap, Temuan & RTL, Repositori Bukti. */
(function () {
  'use strict';
  const TAHAP = ['menetapkan', 'memetakan', 'merencanakan', 'melaksanakan', 'mengevaluasi', 'mengendalikan'];
  const KET_TAHAP = ['Standar, indikator & target', 'Capaian per indikator', 'Program dari kesenjangan', 'Kegiatan & bukti PIC', 'Evaluasi diri & audit', 'RTL & verifikasi'];

  // ============================================================== DASHBOARD MUTU
  HAL.mutu = function (view) {
    tampilkan(view, [['mutu.ringkasan', {}]], function (m) {
      const kat = H.kategori(m.indeks), hk = App.me.hak, j = m.jumlah;
      const hero = h('section', { class: 'hero gelap' }, h('div', { class: 'grow', style: { zIndex: 1 } },
        h('span', { class: 'pill' }, 'Semester ' + m.semester.label + ' · tahap ' + (m.tahap_aktif + 1) + ' ' + m.tahap[m.tahap_aktif].nama),
        h('h1', null, 'Dashboard Mutu Internal'), h('p', null, 'Capaian per standar dihitung dari rata-rata berbobot rasio indikator. Indikator tanpa data tampil abu-abu dan tidak dihitung sebagai merah.'),
        h('div', { class: 'row wrap mt' }, h('a', { class: 'btn putih', href: '#/laporan/rapor_mutu' }, ic('chart', 's'), 'Rapor Mutu'),
          hk.spmi_kelola ? h('button', { class: 'btn kaca', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.hitung', {}, { proses: 'Menghitung…' }); if (r.ok) Router.jalan(); } }, ic('refresh', 's'), 'Hitung ulang capaian') : null)),
        h('div', { class: 'hero-side' }, UI.cincin(m.indeks, { label: 'indeks' }), h('div', null, h('small', null, 'Indeks mutu'), h('b', null, kat.label), h('div', { class: 'xs', style: { opacity: .85 } }, m.standar.filter(function (s) { return s.warna === 'hijau'; }).length + ' dari ' + m.standar.length + ' standar memenuhi'))));
      const stats = h('div', { class: 'grid g4 tetap2' },
        UI.stat({ label: 'Total indikator', ikon: 'target', nilai: j.indikator, sub: m.standar.length + ' standar aktif' }),
        UI.stat({ label: 'Memenuhi target', ikon: 'checkCircle', warna: 'ok', nilai: j.hijau, sub: j.indikator ? F.angka(j.hijau / j.indikator * 100) + '% indikator' : '' }),
        UI.stat({ label: 'Perlu perhatian', ikon: 'alert', warna: 'warn', nilai: j.kuning, sub: 'rasio di bawah ambang hijau' }),
        UI.stat({ label: 'Kesenjangan', ikon: 'alertCircle', warna: 'bad', nilai: j.merah, sub: j.abu + ' belum dipetakan', klik: function () { Router.go('/spmi/merencanakan'); } }));
      const step = UI.stepper(m.tahap.map(function (t, i) { return Object.assign({ ket: KET_TAHAP[i] }, t); }), m.tahap_aktif, function (i) { Router.go('/spmi/' + TAHAP[i]); });
      const bar = UI.grafikBatang(m.standar.map(function (s) { return { label: s.kode || s.nama, nilai: s.capaian, warna: H.WARNA[s.warna] }; }), { garis: Number(App.master.cfg.ambang_hijau || 100), label: 'Capaian per standar' });
      const riw = m.riwayat || [];
      const garis = UI.grafikGaris(riw.map(function (r) { return r.label.replace(/^(Ganjil|Genap) \d{4}\/(\d{4})$/, function (_, a, b) { return a.slice(0, 3) + ' ' + b.slice(2); }); }), [{ nama: 'Indeks', warna: '#2563EB', titik: riw.map(function (r) { return r.indeks; }) }], { label: 'Indeks antarsemester' });
      const sup = m.supervisi, belum = Math.max(0, sup.guru_total - sup.disahkan - sup.diajukan - sup.draf);
      const rtl = m.rtl;
      view.replaceChildren(h('div', { class: 'stack' }, hero, stats,
        UI.kartu({ judul: 'Siklus SPMI 6 Tahap', sub: 'Ketuk tahap untuk membuka', ikon: 'layers' }, step),
        h('div', { class: 'grid g2' }, UI.kartu({ judul: 'Capaian per Standar', sub: 'Garis putus-putus = ambang hijau', ikon: 'chart' }, bar, h('div', { class: 'legend mt-s' }, ['hijau', 'kuning', 'merah', 'abu'].map(function (w) { return h('span', null, h('i', { style: { background: H.WARNA[w] } }), UI.labelStatus(w)); }))),
          UI.kartu({ judul: 'Perbandingan Antarsemester', sub: 'Indeks mutu internal (disimpan pemicu harian)', ikon: 'trend', warnaIkon: 'ind' }, riw.length > 1 ? garis : h('div', null, garis, h('p', { class: 'small muted' }, 'Perbandingan muncul setelah lebih dari satu semester tercatat.')))),
        h('div', { class: 'grid g-main' }, UI.kartu({ judul: 'Standar Mutu', ikon: 'layers', aksi: h('a', { class: 'link', href: '#/spmi/memetakan' }, 'Pemetaan', ic('chevR', 's')) }, kartuStandar(m)),
          h('div', { class: 'stack' },
            UI.kartu({ judul: 'Progres Supervisi', ikon: 'userCheck', warnaIkon: 'ind' }, UI.donat([{ label: 'Disahkan', nilai: sup.disahkan, warna: '#16A34A' }, { label: 'Diajukan', nilai: sup.diajukan, warna: '#2563EB' }, { label: 'Draf/dikembalikan', nilai: sup.draf, warna: '#CA8A04' }, { label: 'Belum dinilai', nilai: belum, warna: '#CBD5E1' }], { tengah: sup.disahkan, sub: 'dari ' + sup.guru_total, ukuran: 120 })),
            UI.kartu({ judul: 'Rencana Tindak Lanjut', ikon: 'flag', warnaIkon: 'bad', aksi: h('a', { class: 'link', href: '#/temuan' }, 'Kelola', ic('chevR', 's')) }, h('div', { class: 'list' },
              [['RTL total', rtl.total], ['Terverifikasi', rtl.diverifikasi], ['Menunggu verifikasi', rtl.menunggu_verifikasi], ['Mendekati tenggat (≤ 7 hari)', rtl.mendekati], ['Terlambat', rtl.terlambat], ['Tepat waktu', F.persen(rtl.tepat_waktu_persen)]].map(function (x) { return h('div', { class: 'li' }, h('span', { class: 'grow small' }, x[0]), h('b', { class: 'num' }, x[1] === undefined ? '–' : String(x[1]))); }))),
            hk.dashboard_mutu ? UI.kartu({ judul: 'Kelengkapan Administrasi', ikon: 'book' }, h('div', { class: 'col' }, h('div', { class: 'row between' }, h('span', { class: 'small' }, 'Rata-rata kelengkapan guru'), h('b', { class: 'num' }, m.admin.rata_kelengkapan + '%')), UI.progres(m.admin.rata_kelengkapan, UI.warnaPersen(m.admin.rata_kelengkapan)), h('div', { class: 'xs muted' }, m.admin.guru_lengkap + ' dari ' + m.admin.guru_total + ' guru lengkap 100% · ' + m.admin.rekap_minggu_ini + ' sudah isi rekap minggu ini'))) : null)),
        h('p', { class: 'xs muted' }, 'Dihitung ' + H.tglWaktu(m.dihitung_pada) + '. Data diperbarui otomatis setiap ada perubahan; pemicu harian 05.00 menyimpan riwayat semester.')));
    });
  };

  // ============================================================== SPMI 6 TAHAP
  HAL.spmi = function (view, p) {
    const idx = Math.max(0, TAHAP.indexOf(p.tahap || '')), hk = App.me.hak;
    tampilkan(view, [['spmi.tahap', {}]], function (t) {
      const isi = h('div');
      view.replaceChildren(UI.kepala('Siklus SPMI 6 Tahap', 'Menetapkan → memetakan → merencanakan → melaksanakan → mengevaluasi → mengendalikan (Permendikdasmen No. 21 Tahun 2026).'),
        h('div', { class: 'mb' }, UI.stepper(t.tahap.map(function (x, i) { return Object.assign({ ket: KET_TAHAP[i] }, x); }), idx, function (i) { Router.go('/spmi/' + TAHAP[i]); })), isi);
      [tahapMenetapkan, tahapMemetakan, tahapRencana, tahapRencana, tahapEvaluasi, tahapKendali][idx](isi, hk, idx);
    });
  };
  function muatKe(isi, sumber, fn) {
    isi.replaceChildren(UI.kerangka('daftar'));
    Promise.all(sumber.map(function (s) { return Data.ambil(s[0], s[1]); })).then(function (rs) {
      const g = rs.filter(function (r) { return !r.ok; })[0]; if (g) { isi.replaceChildren(UI.galatKartu(g.error)); return; }
      fn.apply(null, rs.map(function (r) { return r.data; }));
    });
  }
  // 1. Menetapkan
  function tahapMenetapkan(isi, hk) {
    muatKe(isi, [['spmi.standar', {}], ['spmi.rumus', {}]], function (std, rumus) {
      const bisa = hk.spmi_standar_kelola, usul = hk.spmi_standar_usul;
      isi.replaceChildren(h('div', { class: 'stack' },
        h('div', { class: 'row wrap' }, h('p', { class: 'muted grow' }, bisa ? 'Kelola standar, indikator, target, satuan, dan bobot. Usulan tim mutu muncul dengan lencana Usulan.' : usul ? 'Tim mutu dapat mengusulkan standar/indikator; kepala sekolah menetapkan.' : 'Standar dan indikator mutu yang berlaku.'),
          bisa || usul ? h('button', { class: 'btn pri', onclick: function () { formStandar({}, usul && !bisa); } }, ic('plus', 's'), bisa ? 'Standar baru' : 'Usulkan standar') : null),
        std.map(function (s) {
          return UI.kartu({ judul: s.kode + ' · ' + s.nama, sub: s.deskripsi, ikon: 'layers', aksi: [s.aktif !== 'ya' ? UI.badge(s.aktif) : null, bisa ? h('button', { class: 'btn ghost kecil', onclick: function () { formStandar(s); } }, ic('edit', 's'), 'Ubah') : null, bisa && s.aktif !== 'ya' ? h('button', { class: 'btn ok kecil', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.status', { tabel: 'Standar_Mutu', id: s.id, aktif: 'ya' }); if (r.ok) Router.jalan(); } }, 'Tetapkan') : null, bisa && s.aktif === 'ya' ? h('button', { class: 'btn ghost kecil', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.status', { tabel: 'Standar_Mutu', id: s.id, aktif: 'tidak' }); if (r.ok) Router.jalan(); } }, 'Nonaktifkan') : null, bisa || usul ? h('button', { class: 'btn kecil', onclick: function () { formIndikator({ id_standar: s.id }, rumus); } }, ic('plus', 's'), 'Indikator') : null].filter(Boolean) },
            s.indikator.length ? UI.tabel({ cari: false, baris: s.indikator, kolom: [
              { k: 'kode', label: 'Kode' }, { k: 'indikator', label: 'Indikator', fmt: function (v, i) { return h('div', null, h('b', null, v), i.sumber_data === 'otomatis' ? h('div', { class: 'xs muted' }, 'Otomatis: ' + i.rumus_label) : null); } },
              { k: 'target', label: 'Target', fmt: function (v, i) { return (i.arah === 'turun' ? '≤ ' : '≥ ') + F.angka(v) + ' ' + i.satuan; } }, { k: 'bobot', label: 'Bobot' },
              { k: 'sumber_data', label: 'Sumber', fmt: function (v) { return UI.badge(v); } }, { k: 'aktif', label: 'Status', fmt: function (v) { return UI.badge(v); } },
              { k: 'id', label: '', urut: false, fmt: function (v, i) { return bisa ? h('div', { class: 'row' }, h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Ubah', onclick: function () { formIndikator(i, rumus); } }, ic('edit', 's')), i.aktif !== 'ya' ? h('button', { class: 'btn ok kecil', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.status', { tabel: 'Indikator_Mutu', id: i.id, aktif: 'ya' }); if (r.ok) Router.jalan(); } }, 'Tetapkan') : h('button', { class: 'btn ghost kecil', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.status', { tabel: 'Indikator_Mutu', id: i.id, aktif: 'tidak' }); if (r.ok) Router.jalan(); } }, 'Nonaktifkan')) : null; } }] }) : UI.kosong('Belum ada indikator.', 'target'));
        })));
    });
  }
  function formStandar(s, usulan) {
    const kode = UI.inp({ value: s.kode || '' }), nama = UI.inp({ value: s.nama || '' }), des = UI.area({ value: s.deskripsi || '' }), urut = UI.inp({ type: 'number', value: s.urutan || '' }), bobot = UI.inp({ type: 'number', step: 0.1, value: s.bobot || 1 });
    modal({ judul: s.id ? 'Ubah standar' : (usulan ? 'Usulkan standar' : 'Standar baru'), isi: h('div', { class: 'form dua' }, UI.fld('Kode', kode, { wajib: true }), UI.fld('Urutan', urut), UI.fld('Nama standar', nama, { wajib: true, kelas: 'penuh' }), UI.fld('Deskripsi', des, { kelas: 'penuh' }), UI.fld('Bobot dalam indeks', bobot)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: usulan ? 'Kirim usulan' : 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'spmi.standar.simpan', { id: s.id, kode: kode.value, nama: nama.value, deskripsi: des.value, urutan: urut.value, bobot: bobot.value }); if (!r.ok) return false; await App.segarkanBoot(); Router.jalan(); } }] });
  }
  function formIndikator(i, rumus) {
    const kode = UI.inp({ value: i.kode || '' }), teks = UI.area({ value: i.indikator || '', style: { minHeight: '64px' } }), target = UI.inp({ type: 'number', step: 'any', value: i.target === undefined ? '' : i.target }), satuan = UI.inp({ value: i.satuan || '%' }), bobot = UI.inp({ type: 'number', step: 0.1, value: i.bobot || 1 });
    const arah = UI.pilih([{ v: 'naik', l: 'Makin besar makin baik' }, { v: 'turun', l: 'Makin kecil makin baik' }], i.arah || 'naik');
    const rum = UI.pilih(rumus.map(function (r) { return { v: r.kode, l: r.label + ' (' + r.satuan + ')' }; }), i.rumus_otomatis, { kosong: '— pilih rumus —' });
    const sumber = UI.chips({ opsi: [{ v: 'manual', l: 'Diisi manual tim mutu' }, { v: 'otomatis', l: 'Dihitung otomatis dari modul' }], nilai: i.sumber_data || 'manual', onChange: function (v) { fr.classList.toggle('hide', v !== 'otomatis'); } });
    const fr = UI.fld('Rumus otomatis', rum); if ((i.sumber_data || 'manual') !== 'otomatis') fr.classList.add('hide');
    rum.addEventListener('change', function () { const r = rumus.filter(function (x) { return x.kode === rum.value; })[0]; if (r) { satuan.value = r.satuan; arah.value = r.arah; } });
    modal({ judul: i.id ? 'Ubah indikator' : 'Indikator baru', lebar: true, isi: h('div', { class: 'form dua' }, UI.fld('Kode', kode, { wajib: true }), UI.fld('Bobot', bobot), UI.fld('Indikator', teks, { wajib: true, kelas: 'penuh' }), UI.fld('Sumber data', sumber, { kelas: 'penuh' }), h('div', { class: 'penuh' }, fr), UI.fld('Target', target, { wajib: true }), UI.fld('Satuan', satuan), UI.fld('Arah', arah, { bantuan: 'Mis. jumlah RTL terlambat: makin kecil makin baik (rasio dibalik).' })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'spmi.indikator.simpan', { id: i.id, id_standar: i.id_standar, kode: kode.value, indikator: teks.value, sumber_data: sumber.nilai(), rumus_otomatis: rum.value, target: target.value, satuan: satuan.value, arah: arah.value, bobot: bobot.value }); if (!r.ok) return false; await App.segarkanBoot(); Router.jalan(); } }] });
  }
  // 2. Memetakan
  function tahapMemetakan(isi, hk) {
    muatKe(isi, [['spmi.pemetaan', {}]], function (pm) {
      let saring = 'semua';
      const daftar = h('div', { class: 'stack' });
      function gambar() {
        const kartu = pm.map(function (s) {
          const ind = s.indikator.filter(function (i) { return saring === 'semua' || i.warna === saring; });
          return ind.length ? UI.kartu({ judul: s.kode + ' · ' + s.nama, ikon: 'layers' }, UI.tabel({ cari: false, baris: ind, kolom: kolomPemetaan(hk) })) : null;
        }).filter(Boolean);
        daftar.replaceChildren.apply(daftar, kartu.length ? kartu : [UI.kartu({}, UI.kosong('Tidak ada indikator pada filter ini.', 'target'))]);
      }
      isi.replaceChildren(h('div', { class: 'stack' }, h('div', { class: 'row wrap' }, UI.seg([{ id: 'semua', label: 'Semua' }, { id: 'kuning', label: 'Perlu perhatian' }, { id: 'merah', label: 'Kesenjangan' }, { id: 'abu', label: 'Belum dipetakan' }], saring, function (v) { saring = v; gambar(); }), h('span', { class: 'grow' }),
        hk.spmi_kelola ? h('button', { class: 'btn', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.hitung', {}, { proses: 'Menghitung…' }); if (r.ok) Router.jalan(); } }, ic('refresh', 's'), 'Hitung ulang otomatis') : null), daftar));
      gambar();
    });
  }
  function kolomPemetaan(hk) {
    return [
      { k: 'kode', label: 'Kode & indikator', fmt: function (v, i) { return h('div', { style: { minWidth: '220px' } }, h('span', { class: 'tag' }, v), ' ', h('b', null, i.indikator), h('div', { class: 'xs muted' }, i.sumber_data === 'otomatis' ? 'Otomatis: ' + i.rumus_label : 'Manual' + (i.catatan ? ' · ' + i.catatan : ''))); } },
      { k: 'target', label: 'Target', fmt: function (v, i) { return (i.arah === 'turun' ? '≤ ' : '') + F.angka(v) + ' ' + i.satuan; } },
      { k: 'capaian', label: 'Capaian', fmt: function (v, i) { return v === '' ? '–' : h('b', { class: 'num' }, F.angka(v) + ' ' + i.satuan); } },
      { k: 'rasio', label: 'Progres', fmt: function (v, i) { return h('div', { style: { minWidth: '120px' } }, h('span', { class: 'xs num' }, v === '' ? '–' : F.angka(v) + '%'), UI.progres(v === '' ? 0 : v, UI.kelasWarna(i.warna))); } },
      { k: 'warna', label: 'Status', fmt: function (v) { return UI.badge(v); } },
      hk.spmi_kelola ? { k: 'id', label: '', urut: false, fmt: function (v, i) { return i.sumber_data === 'manual' ? h('button', { class: 'btn kecil', onclick: function () { isiCapaian(i); } }, ic('edit', 's'), 'Isi') : null; } } : null].filter(Boolean);
  }
  function isiCapaian(i) {
    const c = UI.inp({ type: 'number', step: 'any', value: i.capaian }), cat = UI.area({ value: i.catatan || '', placeholder: 'Sumber data / dasar penilaian' });
    modal({ judul: 'Capaian ' + i.kode, sub: i.indikator + ' · target ' + i.target + ' ' + i.satuan, isi: h('div', { class: 'form' }, UI.fld('Capaian (' + i.satuan + ')', c, { wajib: true, bantuan: 'Kosongkan untuk menandai belum dipetakan.' }), UI.fld('Catatan', cat)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'spmi.pemetaan.simpan', { id_indikator: i.id, capaian: c.value, catatan: cat.value }); if (!r.ok) return false; Router.jalan(); } }] });
  }
  // 3–4. Merencanakan & Melaksanakan
  function tahapRencana(isi, hk, idx) {
    muatKe(isi, [['spmi.rencana', {}]], function (rc) {
      const laksana = idx === 3;
      isi.replaceChildren(h('div', { class: 'stack' },
        h('div', { class: 'row wrap' }, h('p', { class: 'muted grow' }, laksana ? 'PIC memperbarui status kegiatan dan mengunggah bukti pelaksanaan; bukti otomatis masuk repositori.' : 'Indikator merah/kuning menghasilkan baris kesenjangan; tim mutu menyusun program, kegiatan, PIC, dan jadwal.'),
          !laksana && hk.spmi_kelola ? h('button', { class: 'btn', onclick: async function (e) { const r = await aksi(e.currentTarget, 'spmi.rencana.generate', {}, { proses: 'Membuat…' }); if (r.ok) Router.jalan(); } }, ic('sparkle', 's'), 'Buat baris kesenjangan') : null,
          !laksana && hk.spmi_kelola ? h('button', { class: 'btn pri', onclick: function () { formRencana({}); } }, ic('plus', 's'), 'Rencana baru') : null),
        rc.length ? h('div', { class: 'grid g2' }, rc.map(function (r) {
          const lengkap = r.program && r.pic;
          return h('div', { class: 'card col' }, h('div', { class: 'row' }, h('span', { class: 'tag biru' }, r.kode_indikator || '–'), h('span', { class: 'grow' }), UI.badge(r.status)),
            h('b', null, r.program || h('span', { class: 'muted' }, 'Program belum disusun')), h('div', { class: 'small muted' }, r.indikator || ''),
            r.kesenjangan ? h('div', { class: 'box warn small' }, ic('alert', 's'), ' ', r.kesenjangan) : null,
            r.kegiatan ? h('p', { class: 'small' }, r.kegiatan) : null,
            h('div', { class: 'row wrap xs muted' }, ic('user', 's'), r.nama_pic || 'PIC belum ditetapkan', r.jadwal ? [ic('calendar', 's'), r.jadwal] : null, r.anggaran ? ['· Anggaran ' + r.anggaran] : null),
            (r.bukti_file_ids || []).length ? h('div', { class: 'row wrap' }, r.bukti_file_ids.map(function (f, i) { return H.tombolBerkas(f, null, 'Bukti ' + (i + 1)); })) : null,
            h('div', { class: 'row wrap' }, hk.spmi_kelola ? h('button', { class: 'btn kecil', onclick: function () { formRencana(r); } }, ic('edit', 's'), lengkap ? 'Ubah' : 'Lengkapi') : null,
              r.boleh_ubah_status && lengkap ? h('button', { class: 'btn pri kecil', onclick: function () { statusRencana(r); } }, ic('activity', 's'), 'Perbarui pelaksanaan') : null));
        })) : UI.kartu({}, UI.kosong(laksana ? 'Belum ada rencana untuk dilaksanakan.' : 'Belum ada rencana mutu. Petakan capaian dulu, lalu buat baris kesenjangan.', 'target'))));
    });
  }
  function formRencana(r) {
    const ind = UI.pilih(H.opsiIndikator(), r.id_indikator, { kosong: '— indikator —' }), kes = UI.area({ value: r.kesenjangan || '', style: { minHeight: '60px' } }), prog = UI.inp({ value: r.program || '' }), keg = UI.area({ value: r.kegiatan || '' });
    const pic = UI.pilih(H.opsiPegawai(), r.pic, { kosong: '— PIC —' }), jdw = UI.inp({ value: r.jadwal || '', placeholder: 'Mis. Nov–Des 2026' }), ang = UI.inp({ value: r.anggaran || '', placeholder: 'Mis. Rp1.500.000 (BOS)' });
    modal({ judul: r.id ? 'Rencana mutu' : 'Rencana mutu baru', lebar: true, isi: h('div', { class: 'form dua' }, UI.fld('Indikator', ind, { wajib: true, kelas: 'penuh' }), UI.fld('Kesenjangan', kes, { kelas: 'penuh' }), UI.fld('Program', prog, { wajib: true, kelas: 'penuh' }), UI.fld('Kegiatan', keg, { wajib: true, kelas: 'penuh' }), UI.fld('PIC', pic, { wajib: true }), UI.fld('Jadwal', jdw, { wajib: true }), UI.fld('Anggaran', ang)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'spmi.rencana.simpan', { id: r.id, id_indikator: ind.value, kesenjangan: kes.value, program: prog.value, kegiatan: keg.value, pic: pic.value, jadwal: jdw.value, anggaran: ang.value }); if (!x.ok) return false; Router.jalan(); } }] });
  }
  function statusRencana(r) {
    const st = UI.chips({ opsi: [{ v: 'berjalan', l: 'Sedang berjalan' }, { v: 'selesai', l: 'Selesai' }], nilai: r.status === 'direncanakan' ? 'berjalan' : r.status }), cat = UI.area({ value: r.catatan || '' }), up = UI.unggah('rencana', { banyak: true, label: 'Unggah bukti pelaksanaan' });
    modal({ judul: 'Pelaksanaan: ' + r.program, isi: h('div', { class: 'form' }, UI.fld('Status', st), UI.fld('Catatan pelaksanaan', cat), UI.fld('Bukti', up, { bantuan: 'Wajib minimal satu bukti untuk status Selesai.' })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'spmi.rencana.status', { id: r.id, status: st.nilai(), catatan: cat.value, bukti_file_ids: up.ids() }); if (!x.ok) return false; Router.jalan(); } }] });
  }
  // 5. Mengevaluasi
  function tahapEvaluasi(isi, hk) {
    muatKe(isi, [['spmi.audit', {}]], function (au) {
      isi.replaceChildren(h('div', { class: 'stack' }, h('div', { class: 'row wrap' }, h('p', { class: 'muted grow' }, 'Evaluasi diri dan audit internal; setiap temuan wajib disertai RTL.'), hk.spmi_kelola ? h('button', { class: 'btn pri', onclick: function () { formAudit({}); } }, ic('plus', 's'), 'Jadwalkan evaluasi/audit') : null),
        au.length ? h('div', { class: 'grid g2' }, au.map(function (a) {
          return h('div', { class: 'card col' }, h('div', { class: 'row' }, UI.badge(a.jenis), h('span', { class: 'grow' }), UI.badge(a.status)), h('b', null, a.lingkup), h('div', { class: 'small muted row' }, ic('calendar', 's'), F.tgl(a.tanggal), ' · Auditor: ' + (a.nama_auditor.join(', ') || '–')),
            a.ringkasan ? h('p', { class: 'small' }, a.ringkasan) : null, h('div', { class: 'row wrap' }, h('span', { class: 'tag' }, a.jumlah_temuan + ' temuan'), h('span', { class: 'grow' }),
              hk.spmi_kelola ? h('button', { class: 'btn kecil', onclick: function () { formAudit(a); } }, ic('edit', 's'), 'Ubah') : null, hk.spmi_kelola ? h('button', { class: 'btn pri kecil', onclick: function () { formTemuan({ sumber: 'audit', id_sumber: a.id }); } }, ic('flag', 's'), 'Catat temuan') : null));
        })) : UI.kartu({}, UI.kosong('Belum ada evaluasi/audit semester ini.', 'shield'))));
    });
  }
  function formAudit(a) {
    const jenis = UI.pilih([{ v: 'evaluasi diri', l: 'Evaluasi diri' }, { v: 'audit internal', l: 'Audit internal' }], a.jenis), ling = UI.area({ value: a.lingkup || '', placeholder: 'Mis. Standar Proses dan Penilaian — rumpun MIPA', style: { minHeight: '60px' } }), tgl = UI.inp({ type: 'date', value: a.tanggal || F.hariIni() });
    const st = UI.pilih([{ v: 'direncanakan', l: 'Direncanakan' }, { v: 'berlangsung', l: 'Berlangsung' }, { v: 'selesai', l: 'Selesai' }], a.status || 'direncanakan');
    const aud = UI.chips({ opsi: H.opsiPegawai(function (p) { return p.jenis !== 'pengawas'; }).map(function (o) { return { v: o.v, l: o.l.split(' — ')[0] }; }), nilai: a.auditor_ids || [], multi: true }), rk = UI.area({ value: a.ringkasan || '' });
    modal({ judul: a.id ? 'Ubah evaluasi/audit' : 'Evaluasi/audit baru', lebar: true, isi: h('div', { class: 'form dua' }, UI.fld('Jenis', jenis), UI.fld('Tanggal', tgl, { wajib: true }), UI.fld('Lingkup', ling, { wajib: true, kelas: 'penuh' }), UI.fld('Status', st), h('div'), UI.fld('Auditor', aud, { kelas: 'penuh' }), UI.fld('Ringkasan hasil', rk, { kelas: 'penuh' })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'spmi.audit.simpan', { id: a.id, jenis: jenis.value, lingkup: ling.value, tanggal: tgl.value, status: st.value, auditor_ids: aud.nilai(), ringkasan: rk.value }); if (!x.ok) return false; Router.jalan(); } }] });
  }
  // 6. Mengendalikan
  function tahapKendali(isi) {
    muatKe(isi, [['spmi.tahap', {}]], function (t) {
      const r = t.rtl;
      isi.replaceChildren(h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, h('div', { class: 'grid g3 tetap2' }, UI.stat({ label: 'Temuan terbuka', ikon: 'flag', warna: 'warn', nilai: t.temuan.terbuka, satuan: '/ ' + t.temuan.total }), UI.stat({ label: 'RTL terverifikasi', ikon: 'shield', warna: 'ok', nilai: r.diverifikasi, satuan: '/ ' + r.total }), UI.stat({ label: 'RTL terlambat', ikon: 'alertCircle', warna: 'bad', nilai: r.terlambat })),
        h('a', { class: 'btn pri', href: '#/temuan' }, ic('flag', 's'), 'Buka Temuan & RTL')), kartuAlur()));
    });
  }
  function kartuAlur(aktif) {
    return UI.kartu({ judul: 'Alur Pengendalian Mutu', ikon: 'layers' }, h('div', { class: 'vstep' }, [['Temuan ditetapkan', 'Auditor merumuskan akar masalah & kriteria standar'], ['Pelaksanaan RTL oleh PIC', 'PIC menyusun bukti korektif'], ['Verifikasi bukti', 'Auditor/tim mutu memeriksa bukti'], ['Penutupan', 'RTL terverifikasi menutup temuan']].map(function (x, i) {
      return h('div', { class: aktif === undefined ? '' : i < aktif ? 'ok' : i === aktif ? 'on' : '' }, h('span', { class: 'no' }, String(i + 1)), h('div', null, h('b', { class: 'small' }, x[0]), h('div', { class: 'xs muted' }, x[1])));
    })));
  }

  // ============================================================== TEMUAN & RTL
  HAL.temuan = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['temuan.list', {}]], function (d) {
      const s = d.statistik, pctV = s.rtl ? Math.round(s.diverifikasi / s.rtl * 100) : 0;
      let saring = '', kata = '';
      const daftar = h('div', { class: 'stack' });
      function gambar() {
        const arr = d.daftar.filter(function (t) { return (!saring || t.kategori === saring) && (!kata || JSON.stringify([t.kode, t.uraian, t.standar, t.rtl.map(function (r) { return r.nama_pic + ' ' + r.tindakan; })]).toLowerCase().indexOf(kata) > -1); });
        daftar.replaceChildren.apply(daftar, arr.length ? arr.map(kartuTemuan) : [UI.kartu({}, UI.kosong('Tidak ada temuan.', 'flag'))]);
      }
      const peringatan = []; d.daftar.forEach(function (t) { t.rtl.forEach(function (r) { if (r.status === 'terlambat' || (['direncanakan', 'berjalan'].indexOf(r.status) > -1 && r.sisa_hari <= 7)) peringatan.push(Object.assign({ kode: t.kode }, r)); }); });
      peringatan.sort(function (a, b) { return a.tenggat < b.tenggat ? -1 : 1; });
      const hero = h('section', { class: 'hero' }, h('div', { class: 'grow', style: { zIndex: 1 } }, h('span', { class: 'pill' }, 'Siklus evaluasi & pengendalian SPMI'), h('h1', null, 'Manajemen Temuan & RTL'), h('p', null, 'Setiap temuan wajib punya RTL dengan PIC dan tenggat. PIC mengunggah bukti, auditor memverifikasi, dan status terlambat ditandai otomatis.'),
        h('div', { class: 'row wrap mt' }, hk.spmi_kelola ? h('button', { class: 'btn putih', onclick: function () { formTemuan({ sumber: 'evaluasi' }); } }, ic('plus', 's'), 'Tambah Temuan Baru') : null, hk.laporan_semua || hk.laporan_pengawas ? h('a', { class: 'btn kaca', href: '#/laporan/rekap_rtl' }, ic('download', 's'), 'Rekap Matriks RTL') : null)),
        h('div', { class: 'hero-side' }, UI.cincin(pctV, { label: 'tuntas' }), h('div', null, h('small', null, 'Ketuntasan RTL'), h('b', null, s.diverifikasi + ' dari ' + s.rtl), h('div', { class: 'xs', style: { opacity: .85 } }, 'terverifikasi'))));
      const cari = h('div', { class: 'cari', style: { maxWidth: '320px' } }, ic('search'), h('input', { type: 'search', placeholder: 'Saring kode, PIC, atau standar…', oninput: function (e) { kata = e.target.value.toLowerCase(); gambar(); } }));
      view.replaceChildren(h('div', { class: 'stack' }, hero,
        h('div', { class: 'grid g4 tetap2' }, UI.stat({ label: 'Total temuan', ikon: 'flag', nilai: s.temuan, sub: 'semester ini' }), UI.stat({ label: 'RTL diverifikasi', ikon: 'checkCircle', warna: 'ok', nilai: s.diverifikasi, sub: F.angka(pctV, 0) + '% dari ' + s.rtl + ' RTL' }), UI.stat({ label: 'Sedang berjalan', ikon: 'activity', nilai: s.berjalan }), UI.stat({ label: 'Perlu perhatian', ikon: 'alert', warna: 'bad', nilai: s.perhatian, sub: 'mendekati/lewat tenggat' })),
        h('div', { class: 'grid g-main' },
          h('div', { class: 'stack' }, h('div', { class: 'row wrap' }, UI.seg([{ id: '', label: 'Semua (' + s.temuan + ')' }, { id: 'ketidaksesuaian', label: 'Ketidaksesuaian (' + s.per_kategori.ketidaksesuaian + ')' }, { id: 'observasi', label: 'Observasi (' + s.per_kategori.observasi + ')' }, { id: 'peluang perbaikan', label: 'Peluang (' + s.per_kategori['peluang perbaikan'] + ')' }], saring, function (v) { saring = v; gambar(); })), cari, daftar),
          h('div', { class: 'stack' },
            UI.kartu({ judul: 'Peringatan Tenggat RTL', ikon: 'bell', warnaIkon: 'warn', aksi: peringatan.length ? h('span', { class: 'bdg bad' }, peringatan.length + ' tertunda') : null }, peringatan.length ? h('div', { class: 'col' }, peringatan.slice(0, 6).map(function (r) { return h('div', { class: 'box' }, h('div', { class: 'row between' }, h('b', { class: 'small' }, r.tindakan), h('span', { class: 'bdg ' + (r.status === 'terlambat' ? 'bad' : 'warn') }, r.status === 'terlambat' ? 'Terlambat' : 'H-' + r.sisa_hari)), h('div', { class: 'xs muted mt-s' }, r.kode + ' · PIC: ' + r.nama_pic + ' · ' + F.tglP(r.tenggat))); })) : h('p', { class: 'small muted' }, 'Tidak ada RTL yang mendekati tenggat.')),
            kartuAlur()))));
      gambar();
    }, { kerangka: 'daftar' });
  };
  function kartuTemuan(t) {
    const hk = App.me.hak;
    return h('section', { class: 'card' },
      h('div', { class: 'row wrap' }, h('span', { class: 'tag biru' }, t.kode), UI.badge(t.kategori), t.standar ? h('span', { class: 'xs muted' }, t.standar) : null, h('span', { class: 'grow' }), UI.badge(t.status)),
      t.tanggal_sumber ? h('div', { class: 'xs muted mt-s row' }, ic('calendar', 's'), 'Audit: ' + F.tglP(t.tanggal_sumber)) : null,
      h('h3', { class: 'mt-s', style: { fontSize: '17px' } }, t.uraian), t.indikator ? h('div', { class: 'small muted' }, 'Indikator: ' + t.indikator) : null,
      h('div', { class: 'col mt' }, t.rtl.map(function (r) {
        const sisa = ['direncanakan', 'berjalan'].indexOf(r.status) > -1 ? (r.sisa_hari >= 0 ? ' (H-' + r.sisa_hari + ')' : '') : '';
        return h('div', { class: 'box' }, h('div', { class: 'row wrap' }, h('span', { class: 'xs bold muted', style: { letterSpacing: '.06em' } }, 'RENCANA TINDAK LANJUT (RTL)'), h('span', { class: 'grow' }), UI.badge(r.status, 'rtl'), sisa ? h('span', { class: 'xs muted' }, sisa) : null),
          h('p', { class: 'mt-s' }, r.tindakan), r.progres_catatan ? h('p', { class: 'small muted' }, r.progres_catatan) : null,
          h('div', { class: 'row wrap mt-s small' }, UI.ava(r.nama_pic, 's'), h('b', null, r.nama_pic), h('span', { class: 'muted' }, '· tenggat ' + F.tglP(r.tenggat)), r.bukti_file_ids.length ? h('span', { class: 'muted' }, '· ' + r.bukti_file_ids.length + ' bukti') : null),
          h('div', { class: 'row wrap mt-s', style: { justifyContent: 'flex-end' } },
            r.bukti_file_ids.map(function (f, i) { return H.tombolBerkas(f, null, 'Bukti ' + (i + 1)); }),
            (r.saya_pic || hk.rtl_kelola) && ['direncanakan', 'berjalan', 'terlambat'].indexOf(r.status) > -1 ? h('button', { class: 'btn pri kecil', onclick: function () { progresRtl(r); } }, ic('activity', 's'), 'Perbarui progres RTL') : null,
            hk.rtl_kelola && r.status === 'selesai' && !r.saya_pic ? h('button', { class: 'btn kecil', onclick: async function (e) { const c = await tanya('Kembalikan ke PIC', 'Alasan', { min: 3, ya: 'Kembalikan' }); if (c) { const x = await aksi(null, 'rtl.verifikasi', { id: r.id, setuju: false, catatan: c }); if (x.ok) Router.jalan(); } } }, 'Kembalikan') : null,
            hk.rtl_kelola && r.status === 'selesai' && !r.saya_pic ? h('button', { class: 'btn ok kecil', onclick: async function (e) { const x = await aksi(e.currentTarget, 'rtl.verifikasi', { id: r.id, setuju: true }); if (x.ok) Router.jalan(); } }, ic('checkCircle', 's'), 'Verifikasi & selesai') : null,
            hk.rtl_kelola && r.status !== 'diverifikasi' ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Ubah RTL', onclick: function () { formRtl(r); } }, ic('edit', 's')) : null,
            hk.buka_kunci && r.status === 'diverifikasi' ? tombolBukaKunci('RTL', r.id) : null));
      }), hk.rtl_kelola && t.status !== 'tertutup' ? h('button', { class: 'link', onclick: function () { formRtl({ id_temuan: t.id }); } }, ic('plus', 's'), 'Tambah RTL') : null));
  }
  function formTemuan(o) {
    const kat = UI.pilih([{ v: 'ketidaksesuaian', l: 'Ketidaksesuaian' }, { v: 'observasi', l: 'Observasi' }, { v: 'peluang perbaikan', l: 'Peluang perbaikan' }], o.kategori || 'ketidaksesuaian'), ur = UI.area({ value: o.uraian || '' }), ind = UI.pilih(H.opsiIndikator(), o.id_indikator || '', { kosong: '— indikator terkait —' });
    const tind = UI.area({ placeholder: 'Tindakan perbaikan', style: { minHeight: '60px' } }), pic = UI.pilih(H.opsiPegawai(), '', { kosong: '— PIC —' }), tg = UI.inp({ type: 'date' });
    modal({ judul: 'Temuan baru', sub: 'Setiap temuan wajib memiliki RTL (tindakan, PIC, tenggat).', lebar: true, isi: h('div', { class: 'form dua' }, UI.fld('Kategori', kat), UI.fld('Indikator', ind), UI.fld('Uraian temuan', ur, { wajib: true, kelas: 'penuh' }), h('div', { class: 'penuh box biru small' }, 'Rencana Tindak Lanjut'), UI.fld('Tindakan', tind, { wajib: true, kelas: 'penuh' }), UI.fld('PIC', pic, { wajib: true }), UI.fld('Tenggat', tg, { wajib: true })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan temuan', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'temuan.simpan', { sumber: o.sumber || 'evaluasi', id_sumber: o.id_sumber || '', kategori: kat.value, uraian: ur.value, id_indikator: ind.value, rtl: { tindakan: tind.value, pic: pic.value, tenggat: tg.value } }); if (!x.ok) return false; Router.go('/temuan'); Router.jalan(); } }] });
  }
  function formRtl(r) {
    const tind = UI.area({ value: r.tindakan || '' }), pic = UI.pilih(H.opsiPegawai(), r.pic || '', { kosong: '— PIC —' }), tg = UI.inp({ type: 'date', value: r.tenggat || '' });
    modal({ judul: r.id ? 'Ubah RTL' : 'Tambah RTL', isi: h('div', { class: 'form' }, UI.fld('Tindakan', tind, { wajib: true }), h('div', { class: 'form dua' }, UI.fld('PIC', pic, { wajib: true }), UI.fld('Tenggat', tg, { wajib: true }))),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'rtl.simpan', { id: r.id, id_temuan: r.id_temuan, tindakan: tind.value, pic: pic.value, tenggat: tg.value }); if (!x.ok) return false; Router.jalan(); } }] });
  }
  function progresRtl(r) {
    const st = UI.chips({ opsi: [{ v: 'berjalan', l: 'Sedang berjalan' }, { v: 'selesai', l: 'Selesai — ajukan verifikasi' }], nilai: 'berjalan' }), cat = UI.area({ value: r.progres_catatan || '' }), up = UI.unggah('rtl', { banyak: true, label: 'Unggah bukti tindak lanjut' });
    modal({ judul: 'Progres RTL', sub: r.tindakan, isi: h('div', { class: 'form' }, UI.fld('Status', st), UI.fld('Catatan progres', cat), UI.fld('Bukti', up, { bantuan: 'Status Selesai wajib disertai minimal satu bukti; bukti otomatis masuk repositori.' })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan progres', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'rtl.progres', { id: r.id, status: st.nilai(), catatan: cat.value, bukti_file_ids: up.ids() }); if (!x.ok) return false; Router.jalan(); } }] });
  }
  window.formTemuanSPMI = formTemuan;

  // ============================================================== REPOSITORI BUKTI
  HAL.bukti = function (view) {
    const hk = App.me.hak, q = { halaman: 1, id_standar: '', q: '', sumber: '' };
    const wadah = h('div');
    function muat() {
      tampilkan(wadah, [['bukti.list', Object.assign({}, q)]], function (d) {
        const s = d.statistik, std = (App.master.standar || []).filter(function (x) { return x.aktif === 'ya'; });
        const terhubung = s.total ? Math.round((s.total - s.tanpa_indikator) / s.total * 100) : 0;
        const chips = h('div', { class: 'chips' }, [{ id: '', nama: 'Semua standar', n: s.total }].concat(std.map(function (x) { return { id: x.id, nama: x.kode + ' ' + x.nama, n: s.per_standar[x.id] || 0 }; }), s.per_standar._ ? [{ id: '_', nama: 'Belum ditautkan', n: s.per_standar._ }] : []).map(function (c) {
          return h('button', { type: 'button', class: 'chip' + (q.id_standar === c.id ? ' on' : ''), onclick: function () { q.id_standar = c.id; q.halaman = 1; muat(); } }, c.nama, h('span', { class: 'tag' }, String(c.n)));
        }));
        const per = Math.ceil(d.total / 25);
        wadah.replaceChildren(h('div', { class: 'stack' },
          h('div', { class: 'grid g4 tetap2' }, UI.stat({ label: 'Total berkas bukti', ikon: 'folder', nilai: s.total, satuan: 'dokumen' }), UI.stat({ label: 'Terhubung otomatis', ikon: 'refresh', warna: 'ind', nilai: s.otomatis, sub: 'dari perangkat, supervisi, PKB, RTL' }), UI.stat({ label: 'Unggahan manual', ikon: 'upload', nilai: s.manual }), UI.stat({ label: 'Belum ditautkan indikator', ikon: 'link', warna: s.tanpa_indikator ? 'warn' : 'ok', nilai: s.tanpa_indikator, sub: terhubung + '% sudah terhubung' })),
          UI.kartu({ judul: 'Filter Standar', ikon: 'filter' }, chips),
          h('div', { class: 'row wrap' }, h('form', { class: 'cari grow', style: { maxWidth: '360px' }, onsubmit: function (e) { e.preventDefault(); q.q = e.target.q.value; q.halaman = 1; muat(); } }, ic('search'), h('input', { name: 'q', type: 'search', value: q.q, placeholder: 'Cari judul atau kode indikator…' })),
            UI.seg([{ id: '', label: 'Semua' }, { id: 'otomatis', label: 'Otomatis' }, { id: 'unggah manual', label: 'Manual' }], q.sumber, function (v) { q.sumber = v; q.halaman = 1; muat(); }), h('span', { class: 'grow' }),
            h('button', { class: 'btn', onclick: async function (e) { const r = await aksi(e.currentTarget, 'bukti.list', Object.assign({}, q, { semua: true }), { proses: 'Menyiapkan…', diam: true }); if (r.ok) Xlsx.buat('Daftar_Bukti_Mutu', [{ nama: 'Bukti', kolom: [{ k: 'kode_indikator', label: 'Kode Indikator' }, { k: 'indikator', label: 'Indikator' }, { k: 'standar', label: 'Standar' }, { k: 'judul', label: 'Judul Bukti' }, { k: 'sumber', label: 'Sumber' }, { k: 'modul_asal', label: 'Modul' }, { k: 'nama_pengunggah', label: 'Pengunggah' }, { k: 'diubah_pada', label: 'Diperbarui' }, { k: 'tautan_berkas', label: 'Tautan' }], baris: r.data.daftar.map(function (b) { return Object.assign({ tautan_berkas: b.tautan || (b.file_id && !b.privat ? 'https://drive.google.com/file/d/' + b.file_id + '/view' : (b.file_id ? 'Berkas privat — buka lewat aplikasi' : '')) }, b); }) }]); } }, ic('fileSheet', 's'), 'Ekspor Excel'),
            hk.bukti_isi ? h('button', { class: 'btn pri', onclick: formBukti }, ic('cloudUp', 's'), 'Unggah Bukti') : null),
          UI.kartu({ judul: 'Daftar Dokumen Mutu', sub: 'Menampilkan ' + d.daftar.length + ' dari ' + d.total, ikon: 'list' }, d.daftar.length ? h('div', { class: 'list' }, d.daftar.map(function (b) {
            return h('div', { class: 'li', style: { alignItems: 'flex-start' } }, h('div', { class: 'ikon-kotak ' + (/pdf/.test(b.mime) ? 'bad' : /image/.test(b.mime) ? 'ind' : '') }, ic(b.tautan && !b.file_id ? 'link' : /image/.test(b.mime) ? 'image' : 'file')),
              h('div', { class: 'grow' }, h('div', { class: 'row wrap' }, b.kode_indikator ? h('span', { class: 'tag biru' }, b.kode_indikator) : h('span', { class: 'tag' }, 'Tanpa indikator'), UI.badge(b.sumber), b.privat ? h('span', { class: 'bdg' }, ic('lock'), 'Privat') : null),
                h('div', { class: 'ttl mt-s' }, b.judul), h('div', { class: 'sub' }, [b.ukuran ? F.ukuran(b.ukuran) : '', 'Diperbarui ' + F.relatif(b.diubah_pada), b.nama_pengunggah].filter(Boolean).join(' · '))),
              h('div', { class: 'row' }, H.tombolBerkas(b.file_id, b.tautan), hk.bukti_kelola || (b.pengunggah === App.me.id_pegawai) ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Kelola', onclick: function () { kelolaBukti(b); } }, ic('settings', 's')) : null));
          })) : UI.kosong('Belum ada bukti pada filter ini.', 'folder'),
            per > 1 ? h('div', { class: 'paging' }, h('span', { class: 'small muted' }, 'Halaman ' + q.halaman + ' dari ' + per), h('div', { class: 'hal' }, q.halaman > 1 ? h('button', { onclick: function () { q.halaman--; muat(); } }, '‹') : null, h('button', { class: 'on' }, String(q.halaman)), q.halaman < per ? h('button', { onclick: function () { q.halaman++; muat(); } }, '›') : null)) : null)));
      }, { kerangka: 'daftar' });
    }
    view.replaceChildren(UI.kepala('Repositori Bukti Mutu', 'Bukti dari modul lain masuk otomatis tanpa unggah ulang. Dikelompokkan per standar, indikator, dan semester.'), wadah);
    muat();
  };
  function formBukti() {
    const judul = UI.inp({ placeholder: 'Mis. SK Tim Penjaminan Mutu Internal 2026/2027' }), ind = UI.pilih(H.opsiIndikator(), '', { kosong: '— indikator mutu —' }), up = UI.unggah('bukti'), tautan = UI.inp({ type: 'url', placeholder: 'https://… (opsional)' });
    modal({ judul: 'Unggah bukti mutu', isi: h('div', { class: 'form' }, UI.fld('Judul bukti', judul, { wajib: true }), UI.fld('Indikator', ind), UI.fld('Berkas', up), UI.fld('Atau tautan', tautan)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'bukti.unggah', { judul: judul.value, id_indikator: ind.value, file_id: up.ids()[0] || '', tautan: tautan.value }); if (!x.ok) return false; Router.jalan(); } }] });
  }
  function kelolaBukti(b) {
    const ind = UI.pilih(H.opsiIndikator(), b.id_indikator, { kosong: '— tanpa indikator —' }), judul = UI.inp({ value: b.judul });
    modal({ judul: 'Kelola bukti', isi: h('div', { class: 'form' }, UI.fld('Judul', judul), UI.fld('Tautkan ke indikator', ind)),
      aksi: [{ label: 'Hapus dari repositori', kelas: 'bahaya', onClick: async function (x) { if (!(await konfirmasi('Hapus bukti?', b.judul, { bahaya: true, ya: 'Hapus' }))) return false; const r = await aksi(x, 'bukti.ubah', { id: b.id, hapus: true }); if (!r.ok) return false; Router.jalan(); } },
        { label: 'Simpan', kelas: 'pri', onClick: async function (x) { const r = await aksi(x, 'bukti.ubah', { id: b.id, id_indikator: ind.value, judul: judul.value }); if (!r.ok) return false; Router.jalan(); } }] });
  }
})();

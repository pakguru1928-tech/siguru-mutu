/* SIGURU MUTU — hal-supervisi.js: Supervisi (jadwal, binaan, pengesahan, rekap, hasil saya, penugasan),
   Form Penilaian (versi terkunci, simpan otomatis 30 dtk + draf lokal), Hasil/Pengesahan, Instrumen berversi. */
(function () {
  'use strict';
  const PREDIKAT_BAWAAN = [{ min: 91, label: 'Sangat Baik' }, { min: 76, label: 'Baik' }, { min: 61, label: 'Cukup' }, { min: 0, label: 'Perlu Pembinaan' }];
  function hitung(nilai, skala, rentang) {
    let num = 0, den = 0, n = 0;
    nilai.forEach(function (x) { if (x.skor === '' || x.skor === undefined || x.skor === null) return; const b = Number(x.bobot) || 1; num += Number(x.skor) * b; den += skala * b; n++; });
    const v = den ? Math.round(num / den * 10000) / 100 : 0;
    const r = (rentang || PREDIKAT_BAWAAN).slice().sort(function (a, b) { return b.min - a.min; });
    let p = ''; for (let i = 0; i < r.length; i++) if (v >= Number(r[i].min)) { p = r[i].label; break; }
    return { nilai: v, predikat: n ? p : '', terisi: n };
  }

  // ============================================================== SUPERVISI (tab per peran)
  HAL.supervisi = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['jadwal.list', {}], ['supervisi.daftar', {}]], function (jadwal, sup) {
      const menunggu = sup.daftar.filter(function (x) { return x.status === 'diajukan'; });
      const tabs = [
        hk.supervisi_sahkan ? { id: 'pengesahan', label: 'Menunggu Pengesahan', ikon: 'inbox', n: menunggu.length } : null,
        hk.supervisi_nilai ? { id: 'binaan', label: 'Binaan Saya', ikon: 'users' } : null,
        { id: 'jadwal', label: 'Jadwal', ikon: 'calendar' },
        hk.supervisi_lihat_semua || hk.supervisi_lihat_disahkan ? { id: 'rekap', label: 'Rekap Semester', ikon: 'chart' } : null,
        hk.supervisi_hasil_saya ? { id: 'hasil', label: 'Hasil Saya', ikon: 'award' } : null,
        hk.supervisi_jadwal_kelola ? { id: 'penugasan', label: 'Penugasan', ikon: 'userCheck' } : null
      ].filter(Boolean);
      let tab = view.dataset.tab && tabs.some(function (t) { return t.id === view.dataset.tab; }) ? view.dataset.tab : (menunggu.length && hk.supervisi_sahkan ? 'pengesahan' : tabs[0].id);
      const isi = h('div');
      function gambar() {
        view.dataset.tab = tab;
        if (tab === 'jadwal') isi.replaceChildren(tabJadwal(jadwal));
        else if (tab === 'binaan') isi.replaceChildren(tabBinaan(jadwal));
        else if (tab === 'pengesahan') isi.replaceChildren(menunggu.length ? h('div', { class: 'grid g2' }, menunggu.map(kartuHasil)) : UI.kartu({}, UI.kosong('Tidak ada hasil supervisi yang menunggu pengesahan.', 'checkCircle')));
        else if (tab === 'rekap') isi.replaceChildren(tabRekap(sup));
        else if (tab === 'hasil') tabHasilSaya(isi);
        else if (tab === 'penugasan') isi.replaceChildren(tabPenugasan());
      }
      view.replaceChildren(UI.kepala('Supervisi Akademik', 'Instrumen berversi, nilai dihitung otomatis di server, pengesahan daring, dan PDF berkode verifikasi.',
        hk.supervisi_jadwal_kelola || hk.supervisi_nilai ? h('button', { class: 'btn pri', onclick: function () { formJadwal({}); } }, ic('plus', 's'), 'Jadwalkan supervisi') : null),
        UI.tabs(tabs, tab, function (t) { tab = t; gambar(); }), isi);
      gambar();
    }, { kerangka: 'daftar' });
  };
  function kartuHasil(x) {
    return h('a', { class: 'card hover col', href: '#/supervisi/hasil/' + x.id, style: { color: 'inherit' } },
      h('div', { class: 'row' }, UI.ava(x.nama_guru, 's'), h('div', { class: 'grow' }, h('b', null, x.nama_guru), h('div', { class: 'xs muted' }, (x.mapel || '') + (x.rombel ? ' · ' + x.rombel : ''))), UI.badge(x.status)),
      h('div', { class: 'row between small' }, h('span', { class: 'muted' }, 'Supervisor: ' + x.nama_supervisor), x.nilai_akhir !== undefined && x.nilai_akhir !== '' ? h('b', { class: 'num' }, F.angka(x.nilai_akhir, 2) + ' · ' + x.predikat) : null),
      h('div', { class: 'xs muted' }, F.tglP(x.tanggal) + ' · ' + (x.instrumen || '') + ' v' + x.nomor_versi));
  }
  function tabJadwal(jadwal) {
    const hk = App.me.hak, aktif = jadwal.filter(function (j) { return j.status !== 'batal'; });
    if (!aktif.length) return UI.kartu({}, UI.kosong('Belum ada jadwal supervisi semester ini.', 'calendar'));
    const perBulan = {}; aktif.forEach(function (j) { const b = String(j.tanggal).slice(0, 7); (perBulan[b] = perBulan[b] || []).push(j); });
    return h('div', { class: 'stack' }, Object.keys(perBulan).sort().map(function (b) {
      return UI.kartu({ judul: F.bulan(b), ikon: 'calendar' }, h('div', { class: 'list' }, perBulan[b].map(function (j) {
        const d = String(j.tanggal).slice(8, 10), saya = j.supervisor_id === App.me.id_pegawai, st = j.status_hasil || j.status;
        return h('div', { class: 'li' }, h('div', { class: 'ikon-kotak ind', style: { flexDirection: 'column', width: '52px', height: '52px' } }, h('b', null, d), h('span', { class: 'xs' }, F.tglP(j.tanggal).split(' ')[1])),
          h('div', { class: 'grow' }, h('div', { class: 'ttl' }, j.nama_guru), h('div', { class: 'sub' }, 'Supervisor: ' + j.nama_supervisor + (j.mapel ? ' · ' + j.mapel : '') + (j.rombel ? ' · ' + j.rombel : '') + ' · ' + j.nama_instrumen + ' v' + j.nomor_versi)),
          UI.badge(st),
          saya && ['terjadwal', 'draf', 'dikembalikan'].indexOf(st) > -1 ? h('a', { class: 'btn pri kecil', href: '#/supervisi/nilai/' + j.id }, ic('edit', 's'), st === 'terjadwal' ? 'Mulai menilai' : 'Lanjutkan') : null,
          j.id_hasil && (hk.supervisi_lihat_semua || saya || st === 'disahkan') && ['diajukan', 'disahkan'].indexOf(st) > -1 ? h('a', { class: 'btn kecil', href: '#/supervisi/hasil/' + j.id_hasil }, 'Lihat') : null,
          (hk.supervisi_jadwal_kelola || saya) && st === 'terjadwal' ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Batalkan jadwal', onclick: async function (e) { if (await konfirmasi('Batalkan jadwal?', 'Supervisi ' + j.nama_guru + ' tanggal ' + F.tgl(j.tanggal) + ' dibatalkan.', { bahaya: true, ya: 'Batalkan' })) { const r = await aksi(e.currentTarget, 'jadwal.batal', { id: j.id }); if (r.ok) Router.jalan(); } } }, ic('x', 's')) : null);
      })));
    }));
  }
  function tabBinaan(jadwal) {
    const ids = (App.master.penugasan || []).filter(function (p) { return p.supervisor_id === App.me.id_pegawai; }).map(function (p) { return p.guru_id; });
    if (!ids.length) return UI.kartu({}, UI.kosong('Belum ada guru binaan yang ditugaskan kepada Anda semester ini.', 'users'));
    return h('div', { class: 'grid g3' }, ids.map(function (g) {
      const j = jadwal.filter(function (x) { return x.guru_id === g && x.supervisor_id === App.me.id_pegawai && x.status !== 'batal'; })[0], pg = App.pegawai(g) || {};
      const st = j ? (j.status_hasil || j.status) : 'belum dijadwalkan';
      return h('div', { class: 'card col' }, h('div', { class: 'row' }, UI.ava(pg.nama, 's'), h('div', { class: 'grow' }, h('b', null, pg.nama), h('div', { class: 'xs muted' }, pg.mapel_utama || ''))),
        h('div', { class: 'row between' }, UI.badge(st), j ? h('span', { class: 'xs muted' }, F.tglP(j.tanggal)) : null),
        j && ['terjadwal', 'draf', 'dikembalikan'].indexOf(st) > -1 ? h('a', { class: 'btn pri kecil', href: '#/supervisi/nilai/' + j.id }, ic('edit', 's'), 'Nilai sekarang')
          : j && j.id_hasil ? h('a', { class: 'btn kecil', href: '#/supervisi/hasil/' + j.id_hasil }, 'Lihat hasil')
            : h('button', { class: 'btn kecil', onclick: function () { formJadwal({ guru_id: g, supervisor_id: App.me.id_pegawai }); } }, ic('calendar', 's'), 'Jadwalkan'));
    }));
  }
  function tabRekap(sup) {
    const r = sup.ringkasan, warnaP = { 'Sangat Baik': '#16A34A', Baik: '#2563EB', Cukup: '#CA8A04', 'Perlu Pembinaan': '#DC2626' };
    const dist = r.distribusi || {};
    return h('div', { class: 'stack' },
      h('div', { class: 'grid g3 tetap2' }, UI.stat({ label: 'Total penilaian', ikon: 'clipboard', nilai: r.total }), UI.stat({ label: 'Disahkan', ikon: 'checkCircle', warna: 'ok', nilai: r.disahkan }), UI.stat({ label: 'Rata-rata nilai', ikon: 'trend', warna: 'ind', nilai: r.rata_rata !== undefined ? F.angka(r.rata_rata, 2) : '–' })),
      Object.keys(dist).length ? UI.kartu({ judul: 'Distribusi Predikat', ikon: 'chart' }, UI.donat(Object.keys(dist).map(function (k) { return { label: k, nilai: dist[k], warna: warnaP[k] || '#6366F1' }; }), { sub: 'disahkan', label: 'Distribusi predikat supervisi' })) : null,
      UI.kartu({ judul: 'Rekap Supervisi Semester', sub: sup.nilai_ditampilkan ? '' : 'Tampilan pengawas: nilai per guru disaring di server.', ikon: 'list' }, UI.tabel({ baris: sup.daftar, onRow: sup.nilai_ditampilkan ? function (x) { Router.go('/supervisi/hasil/' + x.id); } : null, kolom: [
        { k: 'nama_guru', label: 'Guru', fmt: function (v, x) { return h('div', null, h('b', null, v), h('div', { class: 'xs muted' }, x.nip_guru || '')); } }, { k: 'mapel', label: 'Mapel' },
        { k: 'tanggal', label: 'Tanggal', fmt: F.tglP }, { k: 'nama_supervisor', label: 'Supervisor' }, { k: 'nomor_versi', label: 'Versi', fmt: function (v) { return 'v' + v; } },
        sup.nilai_ditampilkan ? { k: 'nilai_akhir', label: 'Nilai', fmt: function (v, x) { return v === '' ? '–' : h('b', { class: 'num' }, F.angka(v, 2), h('div', { class: 'xs muted' }, x.predikat)); } } : null,
        { k: 'status', label: 'Status', fmt: function (v) { return UI.badge(v); } }].filter(Boolean) })));
  }
  async function tabHasilSaya(isi) {
    isi.replaceChildren(UI.kerangka('daftar'));
    const r = await Data.ambil('supervisi.daftar', { semua_semester: true });
    if (!r.ok) { isi.replaceChildren(UI.galatKartu(r.error)); return; }
    const d = r.data.daftar.filter(function (x) { return x.guru_id === App.me.id_pegawai && x.status === 'disahkan'; }).sort(function (a, b) { return a.disahkan_pada < b.disahkan_pada ? -1 : 1; });
    if (!d.length) { isi.replaceChildren(UI.kartu({}, UI.kosong('Belum ada hasil supervisi yang disahkan. Hasil berstatus draf/diajukan tidak ditampilkan.', 'award'))); return; }
    isi.replaceChildren(h('div', { class: 'grid g-main' },
      UI.kartu({ judul: 'Riwayat Supervisi Saya', sub: 'Antarsemester', ikon: 'history' }, h('div', { class: 'vstep' }, d.slice().reverse().map(function (x) {
        return h('div', { class: 'ok' }, h('span', { class: 'no' }, ic('check', 's')), h('a', { class: 'grow box', href: '#/supervisi/hasil/' + x.id, style: { color: 'inherit' } }, h('div', { class: 'row between' }, h('b', null, x.semester), h('b', { class: 'num' }, F.angka(x.nilai_akhir, 2))), h('div', { class: 'small muted' }, x.predikat + ' · disahkan ' + F.tglP(x.disahkan_pada) + ' · ' + x.instrumen + ' v' + x.nomor_versi), x.ada_tanggapan ? null : h('span', { class: 'bdg warn mt-s' }, 'Beri tanggapan')));
      }))),
      UI.kartu({ judul: 'Tren Nilai', ikon: 'trend', warnaIkon: 'ind' }, UI.grafikGaris(d.map(function (x) { return x.semester.replace(/(\d{4})\/(\d{4})/, '$2'); }), [{ nama: 'Nilai', warna: '#2563EB', titik: d.map(function (x) { return Number(x.nilai_akhir); }) }], { label: 'Tren nilai supervisi' }))));
  }
  function tabPenugasan() {
    const pen = App.master.penugasan || [], sup = {};
    pen.forEach(function (p) { (sup[p.supervisor_id] = sup[p.supervisor_id] || []).push(p.guru_id); });
    return h('div', { class: 'stack' }, h('div', { class: 'row' }, h('p', { class: 'muted grow' }, 'Pasangan supervisor–guru berlaku per semester. Sistem menolak pasangan dengan orang yang sama.'), h('button', { class: 'btn pri', onclick: function () { formPenugasan('', []); } }, ic('plus', 's'), 'Atur penugasan')),
      Object.keys(sup).length ? h('div', { class: 'grid g2' }, Object.keys(sup).map(function (s) {
        return UI.kartu({ judul: App.nama(s), sub: sup[s].length + ' guru binaan', ikon: 'userCheck', aksi: h('button', { class: 'btn kecil', onclick: function () { formPenugasan(s, sup[s]); } }, ic('edit', 's'), 'Ubah') }, h('div', { class: 'row wrap' }, sup[s].map(function (g) { return h('span', { class: 'tag' }, App.nama(g)); })));
      })) : UI.kartu({}, UI.kosong('Belum ada penugasan supervisi semester ini.', 'users')));
  }
  function formPenugasan(supId, guruIds) {
    const s = UI.pilih(H.opsiPegawai(function (p) { return p.jenis === 'guru' || p.jenis === 'kepsek'; }), supId, { kosong: '— pilih supervisor —' });
    const g = UI.chips({ opsi: H.opsiPegawai(function (p) { return p.jenis === 'guru'; }).map(function (o) { return { v: o.v, l: o.l.split(' — ')[0] }; }), nilai: guruIds, multi: true, label: 'Guru binaan' });
    modal({ judul: 'Penugasan supervisi', lebar: true, isi: h('div', { class: 'form' }, UI.fld('Supervisor', s, { wajib: true, bantuan: 'Guru yang dipilih otomatis mendapat label Supervisor semester ini.' }), UI.fld('Guru binaan', g)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'penugasan.simpan', { supervisor_id: s.value, guru_ids: g.nilai() }); if (!r.ok) return false; await App.segarkanBoot(); Router.jalan(); } }] });
  }
  async function formJadwal(o) {
    const r = await Data.ambil('instrumen.list', {}, 120000);
    const ins = r.ok ? r.data.instrumen.filter(function (i) { return i.versi_aktif && i.aktif !== 'tidak'; }) : [];
    const hk = App.me.hak, pen = App.master.penugasan || [];
    const supOps = hk.supervisi_jadwal_kelola ? H.opsiPegawai(function (p) { return pen.some(function (x) { return x.supervisor_id === p.id; }); }) : [{ v: App.me.id_pegawai, l: App.me.nama }];
    const sup = UI.pilih(supOps, o.supervisor_id || (supOps[0] && supOps[0].v));
    const guru = h('select', { class: 'inp' });
    const isiGuru = function () { guru.replaceChildren.apply(guru, pen.filter(function (p) { return p.supervisor_id === sup.value; }).map(function (p) { return h('option', { value: p.guru_id, selected: p.guru_id === o.guru_id }, App.nama(p.guru_id)); })); };
    sup.addEventListener('change', isiGuru); isiGuru();
    const insSel = UI.pilih(ins.map(function (i) { return { v: i.id, l: i.nama + ' (v' + ((i.versi.filter(function (v) { return v.id === i.versi_aktif; })[0] || {}).nomor_versi || '?') + ')' }; }), '');
    const tgl = UI.inp({ type: 'date', value: F.hariIni() }), jam = UI.inp({ type: 'time', value: '08:00' }), mapel = UI.pilih(H.opsiMapel(), '', { kosong: '— mapel —' }), rombel = UI.pilih(H.opsiRombel(), '', { kosong: '— rombel —' });
    guru.addEventListener('change', function () { const p = App.pegawai(guru.value); if (p && p.mapel_utama) mapel.value = p.mapel_utama; });
    if (!supOps.length) { toast('Atur penugasan supervisor–guru terlebih dahulu (tab Penugasan).', 'warn'); return; }
    modal({ judul: 'Jadwalkan supervisi', sub: 'Versi instrumen yang aktif saat ini dikunci untuk jadwal ini.', isi: h('div', { class: 'form dua' }, UI.fld('Supervisor', sup, { wajib: true }), UI.fld('Guru', guru, { wajib: true }), UI.fld('Instrumen', insSel, { wajib: true, kelas: 'penuh' }), UI.fld('Tanggal', tgl, { wajib: true }), UI.fld('Jam', jam), UI.fld('Mapel', mapel), UI.fld('Rombel', rombel)),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Simpan jadwal', kelas: 'pri', onClick: async function (b) { const x = await aksi(b, 'jadwal.simpan', { guru_id: guru.value, supervisor_id: sup.value, id_instrumen: insSel.value, tanggal: tgl.value + (jam.value ? 'T' + jam.value : ''), mapel: mapel.value, rombel: rombel.value }); if (!x.ok) return false; Router.jalan(); } }] });
  }

  // ============================================================== FORM PENILAIAN
  HAL.penilaian = async function (view, p) {
    view.replaceChildren(UI.kerangka());
    const r = await Api.call('penilaian.buka', { id_jadwal: p.id });
    if (!r.ok) { view.replaceChildren(UI.galatKartu(r.error)); return; }
    const d = r.data, hs = d.hasil, skala = Number(d.versi.skala) || 4, rentang = d.versi.rentang_predikat;
    if (!d.boleh_ubah) { Router.go('/supervisi/hasil/' + hs.id); return; }
    const KEY = 'nilai_' + hs.id, draf = H.draf.ambil(KEY);
    const nilai = d.nilai.map(function (n) { const dr = draf && draf.nilai && draf.nilai[n.id_butir]; return { id_butir: n.id_butir, skor: dr ? dr.skor : n.skor, catatan: dr ? dr.catatan : n.catatan, bobot: n.bobot }; });
    const teks = { kekuatan: (draf && draf.kekuatan) || hs.kekuatan || '', area_perbaikan: (draf && draf.area_perbaikan) || hs.area_perbaikan || '', rekomendasi: (draf && draf.rekomendasi) || hs.rekomendasi || '' };
    let kotor = !!draf, menyimpan = false;
    const skorEl = h('div', { class: 'num', style: { fontSize: '36px', fontWeight: 800 } }), predEl = h('span', { class: 'bdg ok' }), terisiEl = h('span', { class: 'xs' });
    const statusEl = h('span', { class: 'xs muted row' }, ic('cloud', 's'), draf ? 'Draf lokal dipulihkan' : 'Belum ada perubahan');
    function perbaruiSkor() {
      const x = hitung(nilai, skala, rentang);
      skorEl.textContent = x.terisi ? F.angka(x.nilai, 2) : '–';
      predEl.replaceChildren(ic('award'), x.predikat || 'Belum ada skor');
      terisiEl.textContent = x.terisi + ' dari ' + nilai.length + ' butir dinilai' + (x.terisi && x.terisi < nilai.length ? ' · nilai sementara dari butir terisi' : '');
    }
    function tandai() {
      kotor = true; view.dataset.kotor = '1';
      const o = { nilai: {} }; nilai.forEach(function (n) { o.nilai[n.id_butir] = { skor: n.skor, catatan: n.catatan }; }); Object.assign(o, teks);
      H.draf.simpan(KEY, o); statusEl.lastChild.textContent = 'Draf lokal tersimpan · server menyimpan tiap 30 detik';
      perbaruiSkor();
    }
    async function simpanServer(paksa) {
      if ((!kotor && !paksa) || menyimpan) return true;
      menyimpan = true;
      const res = await Api.call('penilaian.simpan', Object.assign({ id_hasil: hs.id, nilai: nilai.map(function (n) { return { id_butir: n.id_butir, skor: n.skor, catatan: n.catatan }; }) }, teks));
      menyimpan = false;
      if (res.ok) { kotor = false; view.dataset.kotor = ''; H.draf.hapus(KEY); statusEl.lastChild.textContent = 'Tersimpan di server pukul ' + F.jam(res.data.disimpan_pada); return true; }
      statusEl.lastChild.textContent = 'Gagal menyimpan ke server: ' + res.error + ' (draf lokal aman)';
      return false;
    }
    const timer = setInterval(function () { if (!document.body.contains(view) || !location.hash.match(/supervisi\/nilai/)) { clearInterval(timer); return; } simpanServer(); }, 30000);
    document.addEventListener('visibilitychange', function sim() { if (document.visibilityState === 'hidden') simpanServer(); if (!location.hash.match(/supervisi\/nilai/)) document.removeEventListener('visibilitychange', sim); });
    const butir = d.nilai.map(function (n, i) {
      const st = nilai[i], des = n.deskriptor_skor || {};
      const cat = UI.area({ value: st.catatan || '', placeholder: 'Catatan khusus / bukti teramati (opsional)', style: { minHeight: '60px' } });
      cat.addEventListener('input', function () { st.catatan = cat.value; tandai(); });
      const grid = h('div', { class: 'skor-grid', role: 'radiogroup', 'aria-label': 'Skor butir ' + (i + 1) });
      function gambarSkor() {
        grid.replaceChildren.apply(grid, Array.from({ length: skala }, function (_, k) {
          const s = k + 1, on = Number(st.skor) === s;
          return h('button', { type: 'button', class: 'skor' + (on ? ' on' : ''), role: 'radio', 'aria-checked': on ? 'true' : 'false', onclick: function () { st.skor = on ? '' : s; gambarSkor(); tandai(); } },
            h('b', null, 'Skor ' + s + (s === skala ? ' (maks.)' : ''), h('i')), h('span', null, des[s] || ''));
        }));
      }
      gambarSkor();
      return h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('span', { class: 'ikon-kotak ind', style: { width: '36px', height: '36px', fontWeight: 700 } }, String(i + 1).padStart(2, '0')),
        h('div', { class: 'grow' }, n.komponen ? h('div', { class: 'xs bold', style: { color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '.05em' } }, n.komponen) : null, h('h3', { style: { fontSize: '16px' } }, n.butir)), h('span', { class: 'tag biru' }, 'Bobot ' + n.bobot)),
        grid, h('details', { class: 'mt-s', open: !!st.catatan }, h('summary', { class: 'link small' }, ic('edit', 's'), 'Catatan khusus'), cat));
    });
    const area = ['kekuatan', 'area_perbaikan', 'rekomendasi'].map(function (k) {
      const el = UI.area({ value: teks[k], maxlength: 2000 }); el.addEventListener('input', function () { teks[k] = el.value; tandai(); });
      return UI.fld({ kekuatan: 'Kekuatan', area_perbaikan: 'Area perbaikan prioritas', rekomendasi: 'Rekomendasi tindak lanjut' }[k], el, { wajib: true });
    });
    const btnAjukan = h('button', { class: 'btn pri', onclick: async function () {
      if (!(await konfirmasi('Ajukan ke kepala sekolah?', 'Setelah diajukan, penilaian terkunci sampai kepala sekolah mengesahkan atau mengembalikannya.', { ya: 'Ajukan' }))) return;
      const res = await aksi(btnAjukan, 'penilaian.ajukan', Object.assign({ id_hasil: hs.id, nilai: nilai.map(function (n) { return { id_butir: n.id_butir, skor: n.skor, catatan: n.catatan }; }) }, teks), { proses: 'Mengajukan…' });
      if (res.ok) { clearInterval(timer); H.draf.hapus(KEY); view.dataset.kotor = ''; Router.go('/supervisi/hasil/' + hs.id); }
    } }, ic('send', 's'), 'Ajukan pengesahan');
    const riwayat = d.riwayat_guru || [];
    const hero = h('section', { class: 'hero' }, h('div', { class: 'grow', style: { zIndex: 1 } },
      h('div', { class: 'row wrap' }, h('span', { class: 'pill' }, 'Instrumen versi ' + d.versi.nomor_versi + ' terkunci'), hs.status === 'dikembalikan' ? h('span', { class: 'pill' }, 'Dikembalikan kepala sekolah') : null),
      h('h1', null, 'Penilaian Supervisi Akademik'),
      h('p', null, 'Guru: ', h('b', null, d.guru.nama), d.guru.nip ? ' · NIP ' + d.guru.nip : '', ' · ', (d.jadwal.mapel || '') + (d.jadwal.rombel ? ' ' + d.jadwal.rombel : '')),
      h('p', { class: 'small' }, d.versi.nama_instrumen + ' · Supervisor: ' + d.supervisor + ' · ' + F.tgl(d.jadwal.tanggal))),
      h('div', { class: 'hero-side', style: { flexDirection: 'column', alignItems: 'flex-start', gap: '6px' } }, h('small', null, 'Skor berbobot'), skorEl, predEl, terisiEl));
    perbaruiSkor();
    view.replaceChildren(h('div', { class: 'stack' }, hero,
      hs.status === 'dikembalikan' && hs.catatan_kepsek ? h('div', { class: 'box warn row' }, ic('alert'), h('div', null, h('b', null, 'Catatan kepala sekolah: '), hs.catatan_kepsek)) : null,
      h('div', { class: 'grid g-main' },
        h('div', { class: 'stack' }, h('div', { class: 'box biru row' }, ic('info'), h('span', { class: 'small' }, 'Ketuk kartu skor yang paling sesuai dengan pengamatan. Nilai = Σ(skor × bobot) ÷ Σ(' + skala + ' × bobot) × 100; nilai final dihitung ulang di server.')), butir,
          UI.kartu({ judul: 'Catatan & Rencana Tindak Lanjut', ikon: 'message' }, h('div', { class: 'form' }, area)),
          h('div', { class: 'sticky-aksi' }, statusEl, h('span', { class: 'grow' }), h('button', { class: 'btn', onclick: async function (e) { const b = e.currentTarget; b.disabled = true; const ok = await simpanServer(true); b.disabled = false; if (ok) toast('Tersimpan.', 'ok'); } }, ic('save', 's'), 'Simpan'), btnAjukan)),
        h('div', { class: 'stack' },
          UI.kartu({ judul: 'Rentang Predikat', sub: 'Berlaku untuk versi ini', ikon: 'award' }, h('div', { class: 'list' }, (rentang || PREDIKAT_BAWAAN).map(function (x) { return h('div', { class: 'li' }, h('b', { class: 'grow' }, x.label), h('span', { class: 'num small' }, '≥ ' + x.min)); }))),
          riwayat.length ? UI.kartu({ judul: 'Tren Kompetensi Guru', sub: riwayat.length + ' supervisi sebelumnya', ikon: 'trend', warnaIkon: 'ind' }, UI.grafikBatang(riwayat.map(function (x) { return { label: x.semester.replace(/^(\w+) \d{4}\/(\d{4})$/, '$1 $2'), nilai: Number(x.nilai), warna: '#6366F1' }; }), { tinggi: 200, satuan: '' })) : null))));
  };

  // ============================================================== HASIL & PENGESAHAN
  HAL.hasilSupervisi = function (view, p) {
    tampilkan(view, [['supervisi.detail', { id_hasil: p.id }]], function (d) {
      const hs = d.hasil, hk = App.me.hak, skala = Number(d.versi.skala) || 4, milikGuru = hs.guru_id === App.me.id_pegawai, milikSup = hs.supervisor_id === App.me.id_pegawai;
      const aksiAtas = [];
      if (hs.status === 'disahkan') aksiAtas.push(h('button', { class: 'btn putih', onclick: function () { UI.bukaBerkas(null, { aksi: 'supervisi.pdf', data: { id_hasil: hs.id } }); } }, ic('printer', 's'), 'Dokumen PDF'));
      if (milikSup && ['draf', 'dikembalikan'].indexOf(hs.status) > -1) aksiAtas.push(h('a', { class: 'btn putih', href: '#/supervisi/nilai/' + hs.id_jadwal }, ic('edit', 's'), 'Lanjutkan penilaian'));
      if (hk.supervisi_sahkan && hs.status === 'diajukan') {
        aksiAtas.push(h('button', { class: 'btn kaca', onclick: async function (e) { const c = await tanya('Kembalikan ke supervisor', 'Catatan untuk supervisor', { min: 3, panjang: true, ya: 'Kembalikan' }); if (!c) return; const r = await aksi(null, 'penilaian.putuskan', { id_hasil: hs.id, keputusan: 'kembalikan', catatan: c }); if (r.ok) Router.jalan(); } }, ic('chevL', 's'), 'Kembalikan'));
        aksiAtas.push(h('button', { class: 'btn putih', onclick: async function (e) { const b = e.currentTarget; if (!(await konfirmasi('Sahkan hasil supervisi?', 'Nilai dihitung ulang di server, hasil dikunci, guru dapat melihatnya, dan PDF berkode verifikasi diterbitkan.', { ya: 'Sahkan' }))) return; const r = await aksi(b, 'penilaian.putuskan', { id_hasil: hs.id, keputusan: 'sahkan' }, { proses: 'Mengesahkan…' }); if (r.ok) { Api.call('pdf.proses', {}); Router.jalan(); } } }, ic('checkCircle', 's'), 'Sahkan'));
      }
      const hero = h('section', { class: 'hero' + (hs.status === 'disahkan' ? ' gelap' : '') }, h('div', { class: 'grow', style: { zIndex: 1 } },
        h('div', { class: 'row wrap' }, h('span', { class: 'pill' }, d.versi.nama_instrumen + ' · versi ' + d.versi.nomor_versi), UI.badge(hs.status)),
        h('h1', null, d.guru.nama), h('p', null, [d.guru.nip ? 'NIP ' + d.guru.nip : '', d.jadwal.mapel, d.jadwal.rombel, F.tgl(d.jadwal.tanggal)].filter(Boolean).join(' · ')),
        h('p', { class: 'small' }, 'Supervisor: ' + d.supervisor + (hs.disahkan_pada ? ' · disahkan ' + F.tgl(hs.disahkan_pada) : '')),
        aksiAtas.length ? h('div', { class: 'row wrap mt' }, aksiAtas) : null),
        h('div', { class: 'hero-side', style: { flexDirection: 'column', alignItems: 'flex-start', gap: '4px' } }, h('small', null, 'Nilai akhir'), h('div', { class: 'num', style: { fontSize: '38px', fontWeight: 800 } }, hs.nilai_akhir === '' ? '–' : F.angka(hs.nilai_akhir, 2)), h('b', null, hs.predikat || ''), hs.kode_verifikasi ? h('a', { class: 'xs', href: '#/verifikasi/' + hs.kode_verifikasi, style: { color: '#BFDBFE' } }, 'Kode verifikasi: ' + hs.kode_verifikasi) : null));
      const bolehTemuan = hs.status === 'disahkan' && (hk.spmi_kelola || hk.supervisi_sahkan);
      const butir = d.nilai.map(function (n, i) {
        const lemah = n.skor !== '' && Number(n.skor) <= d.ambang_temuan;
        return h('div', { class: 'li', style: { alignItems: 'flex-start' } }, h('span', { class: 'tag' }, String(i + 1)),
          h('div', { class: 'grow' }, n.komponen ? h('div', { class: 'xs muted' }, n.komponen) : null, h('b', null, n.butir), n.skor !== '' && n.deskriptor_skor[n.skor] ? h('div', { class: 'small muted' }, 'Deskriptor: ' + n.deskriptor_skor[n.skor]) : null, n.catatan ? h('div', { class: 'small' }, 'Catatan: ' + n.catatan) : null),
          h('div', { class: 'col', style: { alignItems: 'flex-end' } }, h('span', { class: 'bdg ' + (n.skor === '' ? '' : Number(n.skor) >= skala - 0 ? 'ok' : lemah ? 'bad' : 'info') }, n.skor === '' ? 'Belum' : 'Skor ' + n.skor + '/' + skala), h('span', { class: 'xs muted' }, 'bobot ' + n.bobot),
            bolehTemuan && lemah ? h('button', { class: 'btn ghost kecil', onclick: function () { jadikanTemuan(d, n); } }, ic('flag', 's'), 'Jadikan temuan') : null));
      });
      const tanggapan = UI.area({ value: hs.tanggapan_guru || '', placeholder: 'Tanggapan Anda atas hasil supervisi' });
      view.replaceChildren(h('div', { class: 'stack' }, hero,
        hs.catatan_kepsek ? h('div', { class: 'box warn row' }, ic('message'), h('div', null, h('b', null, 'Catatan kepala sekolah: '), hs.catatan_kepsek)) : null,
        h('div', { class: 'grid g-main' },
          h('div', { class: 'stack' }, UI.kartu({ judul: 'Rincian Penilaian', sub: 'Teks butir & bobot tersimpan sebagai salinan versi ' + d.versi.nomor_versi, ikon: 'list' }, h('div', { class: 'list' }, butir)),
            UI.kartu({ judul: 'Catatan Supervisor', ikon: 'message' }, h('div', { class: 'col' }, [['Kekuatan', hs.kekuatan], ['Area perbaikan', hs.area_perbaikan], ['Rekomendasi tindak lanjut', hs.rekomendasi]].map(function (x) { return h('div', { class: 'box' }, h('b', { class: 'small' }, x[0]), h('p', { class: 'mt-s' }, x[1] || '–')); })))),
          h('div', { class: 'stack' },
            milikGuru && hs.status === 'disahkan' ? UI.kartu({ judul: 'Tanggapan Saya', ikon: 'message', warnaIkon: 'ind' }, h('div', { class: 'col' }, tanggapan, h('button', { class: 'btn pri', onclick: async function (e) { const r = await aksi(e.currentTarget, 'supervisi.tanggapan', { id_hasil: hs.id, tanggapan: tanggapan.value }); if (r.ok) Data.basi(); } }, ic('send', 's'), 'Simpan tanggapan'))) : (hs.tanggapan_guru ? UI.kartu({ judul: 'Tanggapan Guru', ikon: 'message' }, h('p', null, hs.tanggapan_guru)) : null),
            d.temuan && d.temuan.length ? UI.kartu({ judul: 'Diteruskan ke Mutu', ikon: 'flag', warnaIkon: 'warn' }, h('div', { class: 'list' }, d.temuan.map(function (t) { return h('a', { class: 'li klik', href: '#/temuan', style: { color: 'inherit' } }, h('b', { class: 'small' }, t.kode), h('span', { class: 'grow small' }, t.uraian), UI.badge(t.status)); }))) : null,
            d.riwayat_guru && d.riwayat_guru.length ? UI.kartu({ judul: 'Riwayat Guru', ikon: 'history' }, h('div', { class: 'list' }, d.riwayat_guru.map(function (x) { return h('div', { class: 'li' }, h('span', { class: 'grow small' }, x.semester), h('b', { class: 'num' }, x.nilai === '' ? '–' : F.angka(x.nilai, 2))); }))) : null,
            hk.buka_kunci && hs.status === 'disahkan' ? UI.kartu({ judul: 'Koreksi', sub: 'Membuka kunci mencabut kode verifikasi lama dan tercatat di log.', ikon: 'unlock' }, tombolBukaKunci('Supervisi_Hasil', hs.id)) : null))));
    }, { paksa: true });
  };
  function jadikanTemuan(d, n) {
    const ur = UI.area({ value: 'Butir "' + n.butir + '" memperoleh skor ' + n.skor + ' pada supervisi ' + d.guru.nama + '.' }), kat = UI.pilih([{ v: 'peluang perbaikan', l: 'Peluang perbaikan' }, { v: 'observasi', l: 'Observasi' }, { v: 'ketidaksesuaian', l: 'Ketidaksesuaian' }], 'peluang perbaikan');
    const ind = UI.pilih(H.opsiIndikator(), n.id_indikator_terkait || '', { kosong: '— pilih indikator —' }), tind = UI.area({ placeholder: 'Mis. Pendampingan oleh supervisor dan kombel mapel' }), pic = UI.pilih(H.opsiPegawai(), d.guru.id), tg = UI.inp({ type: 'date' });
    modal({ judul: 'Jadikan temuan + RTL', lebar: true, isi: h('div', { class: 'form dua' }, UI.fld('Uraian temuan', ur, { wajib: true, kelas: 'penuh' }), UI.fld('Kategori', kat), UI.fld('Indikator mutu', ind), UI.fld('Tindakan RTL', tind, { wajib: true, kelas: 'penuh' }), UI.fld('PIC', pic, { wajib: true }), UI.fld('Tenggat', tg, { wajib: true })),
      aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Buat temuan', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'supervisi.keTemuan', { id_hasil: d.hasil.id, id_nilai: n.id, uraian: ur.value, kategori: kat.value, id_indikator: ind.value, tindakan: tind.value, pic: pic.value, tenggat: tg.value }); if (!r.ok) return false; Router.jalan(); } }] });
  }

  // ============================================================== INSTRUMEN
  HAL.instrumen = function (view) {
    const hk = App.me.hak;
    tampilkan(view, [['instrumen.list', {}]], function (d) {
      view.replaceChildren(UI.kepala('Kelola Instrumen Supervisi', 'Versi terbit tidak pernah diubah. Tombol Sunting membuat draf versi baru; nilai lama tetap memakai versinya.',
        hk.instrumen_kelola ? h('button', { class: 'btn pri', onclick: function () {
          const nama = UI.inp({ placeholder: 'Mis. Supervisi Pembelajaran Mendalam' }), jenis = UI.pilih(d.jenis, d.jenis[1]);
          modal({ judul: 'Instrumen baru', isi: h('div', { class: 'form' }, UI.fld('Nama instrumen', nama, { wajib: true }), UI.fld('Jenis', jenis)), aksi: [{ label: 'Batal', kelas: 'ghost' }, { label: 'Buat', kelas: 'pri', onClick: async function (b) { const r = await aksi(b, 'instrumen.buat', { nama: nama.value, jenis: jenis.value }); if (!r.ok) return false; Router.go('/instrumen/' + r.data.id_versi); } }] });
        } }, ic('plus', 's'), 'Instrumen baru') : null),
        d.instrumen.length ? h('div', { class: 'grid g2' }, d.instrumen.map(function (i) {
          const aktif = i.versi.filter(function (v) { return v.id === i.versi_aktif; })[0], draf = i.versi.filter(function (v) { return v.status === 'draf'; })[0];
          return UI.kartu({ judul: i.nama, sub: i.jenis, ikon: 'list', aksi: aktif ? h('span', { class: 'bdg ok' }, ic('checkCircle'), 'Aktif v' + aktif.nomor_versi) : h('span', { class: 'bdg warn' }, 'Belum terbit') },
            h('div', { class: 'col' }, h('div', { class: 'list' }, i.versi.map(function (v) { return h('a', { class: 'li klik', href: '#/instrumen/' + v.id, style: { color: 'inherit' } }, h('b', null, 'Versi ' + v.nomor_versi), h('span', { class: 'grow small muted' }, v.jumlah_butir + ' butir · skala 1–' + v.skala + (v.diterbitkan_pada ? ' · terbit ' + F.tglP(v.diterbitkan_pada) : '')), UI.badge(v.status)); })),
              hk.instrumen_kelola ? h('div', { class: 'row' }, draf ? h('a', { class: 'btn pri kecil', href: '#/instrumen/' + draf.id }, ic('edit', 's'), 'Lanjutkan draf v' + draf.nomor_versi) : h('button', { class: 'btn kecil', onclick: async function (e) { const r = await aksi(e.currentTarget, 'instrumen.sunting', { id_instrumen: i.id }); if (r.ok) Router.go('/instrumen/' + r.data.id_versi); } }, ic('copy', 's'), 'Sunting (buat versi baru)')) : null));
        })) : UI.kartu({}, UI.kosong('Belum ada instrumen.', 'list')));
    }, { kerangka: 'daftar' });
  };
  HAL.instrumenEdit = function (view, p) {
    tampilkan(view, [['instrumen.get', { id_versi: p.id }]], function (v) {
      const bisa = v.status === 'draf' && App.hak('instrumen_kelola');
      let butir = v.butir.map(function (b) { return { id: b.id, komponen: b.komponen, butir: b.butir, bobot: b.bobot, deskriptor_skor: b.deskriptor_skor || {}, id_indikator_terkait: b.id_indikator_terkait }; });
      let rentang = (v.rentang_predikat || PREDIKAT_BAWAAN).map(function (r) { return { min: r.min, label: r.label }; });
      const skala = UI.inp({ type: 'number', min: 2, max: 10, value: v.skala, disabled: !bisa }), catVer = UI.inp({ value: v.catatan_versi || '', disabled: !bisa, placeholder: 'Apa yang berubah di versi ini?' });
      const nama = UI.inp({ value: v.nama_instrumen, disabled: !bisa });
      const daftarButir = h('div', { class: 'stack' }), daftarRentang = h('div', { class: 'col' });
      const tandai = function () { view.dataset.kotor = '1'; };
      function gambarRentang() {
        daftarRentang.replaceChildren.apply(daftarRentang, rentang.map(function (r, i) {
          const mn = UI.inp({ type: 'number', value: r.min, disabled: !bisa, style: { width: '96px' } }), lb = UI.inp({ value: r.label, disabled: !bisa });
          mn.addEventListener('input', function () { r.min = Number(mn.value); tandai(); }); lb.addEventListener('input', function () { r.label = lb.value; tandai(); });
          return h('div', { class: 'row' }, h('span', { class: 'small muted' }, '≥'), mn, lb, bisa ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus', onclick: function () { rentang.splice(i, 1); gambarRentang(); tandai(); } }, ic('x', 's')) : null);
        }).concat(bisa ? [h('button', { class: 'btn ghost kecil', onclick: function () { rentang.push({ min: 0, label: '' }); gambarRentang(); } }, ic('plus', 's'), 'Tambah rentang')] : []));
      }
      function gambarButir() {
        const sk = Number(skala.value) || 4;
        daftarButir.replaceChildren.apply(daftarButir, butir.map(function (b, i) {
          const kom = UI.inp({ value: b.komponen || '', placeholder: 'Komponen (mis. Kegiatan inti)', disabled: !bisa }), tx = UI.area({ value: b.butir || '', placeholder: 'Rumusan butir', disabled: !bisa, style: { minHeight: '64px' } });
          const bb = UI.inp({ type: 'number', min: 0.1, step: 0.1, value: b.bobot || 1, disabled: !bisa, style: { width: '96px' } }), ind = UI.pilih(H.opsiIndikator(), b.id_indikator_terkait || '', { kosong: '— tanpa indikator —', disabled: !bisa });
          kom.addEventListener('input', function () { b.komponen = kom.value; tandai(); }); tx.addEventListener('input', function () { b.butir = tx.value; tandai(); });
          bb.addEventListener('input', function () { b.bobot = Number(bb.value); tandai(); }); ind.addEventListener('change', function () { b.id_indikator_terkait = ind.value; tandai(); });
          const des = h('div', { class: 'grid g2' }, Array.from({ length: sk }, function (_, k) { const s = k + 1, a = UI.inp({ value: b.deskriptor_skor[s] || '', placeholder: 'Deskriptor skor ' + s, disabled: !bisa }); a.addEventListener('input', function () { b.deskriptor_skor[s] = a.value; tandai(); }); return UI.fld('Skor ' + s, a); }));
          return h('section', { class: 'card' }, h('div', { class: 'row mb' }, h('span', { class: 'ikon-kotak ind', style: { width: '36px', height: '36px' } }, String(i + 1)), h('b', { class: 'grow' }, 'Butir ' + (i + 1)),
            bisa ? h('div', { class: 'row' }, i > 0 ? h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Naikkan', onclick: function () { butir.splice(i - 1, 0, butir.splice(i, 1)[0]); gambarButir(); tandai(); } }, ic('chevR', 's')) : null, h('button', { class: 'btn ghost kecil ikon', 'aria-label': 'Hapus butir', onclick: function () { butir.splice(i, 1); gambarButir(); tandai(); } }, ic('trash', 's'))) : null),
            h('div', { class: 'form' }, h('div', { class: 'form dua' }, UI.fld('Komponen', kom), h('div', { class: 'row' }, UI.fld('Bobot', bb), h('div', { class: 'grow' }, UI.fld('Indikator mutu terkait', ind)))), UI.fld('Butir', tx, { wajib: true }), h('details', { class: 'ak' }, h('summary', null, 'Deskriptor skor (1–' + sk + ')', ic('chevD', 's')), h('div', { class: 'isi' }, des))));
        }).concat(bisa ? [h('button', { class: 'btn', onclick: function () { butir.push({ komponen: '', butir: '', bobot: 1, deskriptor_skor: {}, id_indikator_terkait: '' }); gambarButir(); tandai(); } }, ic('plus', 's'), 'Tambah butir')] : []));
      }
      skala.addEventListener('change', gambarButir);
      gambarRentang(); gambarButir();
      const muatan = function () { return { id_versi: v.id, nama: nama.value, skala: Number(skala.value), rentang_predikat: rentang, catatan_versi: catVer.value, butir: butir }; };
      const aksiBtn = bisa ? [
        h('button', { class: 'btn bahaya', onclick: async function (e) { if (await konfirmasi('Hapus draf?', 'Draf versi ' + v.nomor_versi + ' akan dihapus.', { bahaya: true, ya: 'Hapus' })) { const r = await aksi(e.currentTarget, 'instrumen.hapusDraf', { id_versi: v.id }); if (r.ok) { view.dataset.kotor = ''; Router.go('/instrumen'); } } } }, ic('trash', 's'), 'Hapus draf'),
        h('button', { class: 'btn', onclick: async function (e) { const r = await aksi(e.currentTarget, 'instrumen.simpanDraf', muatan()); if (r.ok) view.dataset.kotor = ''; } }, ic('save', 's'), 'Simpan draf'),
        h('button', { class: 'btn pri', onclick: async function (e) { const b = e.currentTarget; const r = await aksi(b, 'instrumen.simpanDraf', muatan(), { diam: true }); if (!r.ok) return; if (!(await konfirmasi('Terbitkan versi ' + v.nomor_versi + '?', 'Versi terbit tidak dapat diubah lagi. Jadwal baru memakai versi ini; penilaian lama tetap memakai versinya sendiri.', { ya: 'Terbitkan' }))) return; const t = await aksi(b, 'instrumen.terbitkan', { id_versi: v.id }); if (t.ok) { view.dataset.kotor = ''; Router.go('/instrumen'); } } }, ic('checkCircle', 's'), 'Terbitkan')] : [h('a', { class: 'btn', href: '#/instrumen' }, ic('chevL', 's'), 'Kembali')];
      view.replaceChildren(UI.kepala(v.nama_instrumen + ' · versi ' + v.nomor_versi, (bisa ? 'Draf — dapat diubah sampai diterbitkan.' : 'Versi ' + UI.labelStatus(v.status).toLowerCase() + ' — hanya-baca.') + (v.diterbitkan_pada ? ' Terbit ' + F.tgl(v.diterbitkan_pada) + '.' : ''), aksiBtn),
        h('div', { class: 'grid g-main' }, h('div', { class: 'stack' }, daftarButir),
          h('div', { class: 'stack' }, UI.kartu({ judul: 'Pengaturan Versi', ikon: 'settings' }, h('div', { class: 'form' }, UI.fld('Nama instrumen', nama), UI.fld('Skala skor (maks.)', skala, { bantuan: 'Skor 1 sampai nilai ini.' }), UI.fld('Catatan versi', catVer), h('div', { class: 'box small' }, 'Rumus nilai: Σ(skor × bobot) ÷ Σ(skor maks × bobot) × 100'))),
            UI.kartu({ judul: 'Rentang Predikat', ikon: 'award' }, daftarRentang))));
    }, { paksa: true });
  };
})();

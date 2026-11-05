/* SIGURU MUTU — ui.js: komponen tampilan (kartu, lencana, tabel, chip, formulir, grafik SVG, stepper, berkas). */
(function () {
  'use strict';
  const STATUS = {
    draf: ['abu', 'Draf', 'edit'], diajukan: ['info', 'Diajukan', 'send'], disetujui: ['ok', 'Disetujui', 'checkCircle'], revisi: ['warn', 'Perlu Revisi', 'alert'],
    disahkan: ['ok', 'Disahkan', 'checkCircle'], dikembalikan: ['warn', 'Dikembalikan', 'alert'], terjadwal: ['info', 'Terjadwal', 'calendar'], selesai: ['ok', 'Selesai', 'check'],
    batal: ['abu', 'Batal', 'x'], direncanakan: ['abu', 'Direncanakan', 'clock'], berjalan: ['info', 'Sedang Berjalan', 'activity'], terlambat: ['bad', 'Terlambat', 'alertCircle'],
    diverifikasi: ['ok', 'Terverifikasi', 'shield'], terbuka: ['warn', 'Terbuka', 'flag'], tertutup: ['ok', 'Ditutup', 'checkCircle'],
    hijau: ['ok', 'Memenuhi', 'checkCircle'], kuning: ['warn', 'Perlu Perbaikan', 'alert'], merah: ['bad', 'Belum Memenuhi', 'alertCircle'], abu: ['abu', 'Belum Dipetakan', 'info'],
    berlaku: ['ok', 'Berlaku', 'shield'], dicabut: ['bad', 'Dicabut', 'x'], usulan: ['ind', 'Usulan', 'sparkle'], terbit: ['ok', 'Terbit', 'checkCircle'], arsip: ['abu', 'Arsip', 'inbox'],
    ya: ['ok', 'Aktif', 'check'], tidak: ['abu', 'Nonaktif', 'x'], 'belum dijadwalkan': ['abu', 'Belum Dijadwalkan', 'clock'],
    ketidaksesuaian: ['bad', 'Ketidaksesuaian', 'alertCircle'], observasi: ['info', 'Observasi', 'eye'], 'peluang perbaikan': ['ok', 'Peluang Perbaikan', 'trend'],
    otomatis: ['ind', 'Otomatis', 'refresh'], 'unggah manual': ['abu', 'Unggah Manual', 'upload'], manual: ['abu', 'Manual', 'edit'],
    'evaluasi diri': ['info', 'Evaluasi Diri', 'clipboard'], 'audit internal': ['ind', 'Audit Internal', 'shield'], berlangsung: ['info', 'Berlangsung', 'activity']
  };
  const RTL_SELESAI = ['info', 'Menunggu Verifikasi', 'hourglass'];
  const UI = {
    badge: function (st, konteks) {
      const m = (konteks === 'rtl' && st === 'selesai') ? RTL_SELESAI : (STATUS[st] || ['abu', st || '-', 'info']);
      return h('span', { class: 'bdg ' + m[0] }, ic(m[2]), m[1]);
    },
    labelStatus: function (st) { return (STATUS[st] || [0, st])[1]; },
    ava: function (nama, ukuran) { return h('span', { class: 'ava ' + (ukuran || ''), 'aria-hidden': 'true' }, F.inisial(nama)); },
    kartu: function (o, isi) {
      return h('section', { class: 'card ' + (o.kelas || '') },
        (o.judul || o.aksi) ? h('div', { class: 'card-h' }, o.ikon ? h('div', { class: 'ikon-kotak ' + (o.warnaIkon || '') }, ic(o.ikon)) : null,
          h('div', { class: 'grow' }, h('h3', null, o.judul), o.sub ? h('p', null, o.sub) : null), o.aksi ? h('div', { class: 'aksi' }, o.aksi) : null) : null,
        isi);
    },
    stat: function (o) {
      return h('div', { class: 'card stat' + (o.klik ? ' hover' : ''), onclick: o.klik || null },
        h('div', { class: 'lbl' }, o.label, h('span', { class: 'si ' + (o.warna || '') }, ic(o.ikon || 'chart'))),
        h('div', { class: 'val num' }, o.nilai, o.satuan ? h('small', null, o.satuan) : null),
        o.sub ? h('div', { class: 'small ' + (o.subKelas || 'muted') }, o.sub) : null);
    },
    progres: function (pct, kelas) {
      const v = Math.max(0, Math.min(100, Number(pct) || 0));
      return h('div', { class: 'prog ' + (kelas || ''), role: 'progressbar', 'aria-valuenow': String(Math.round(v)), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('i', { style: { width: v + '%' } }));
    },
    kelasWarna: function (w) { return { hijau: 'ok', kuning: 'warn', merah: 'bad' }[w] || ''; },
    warnaPersen: function (p) { return p >= 100 ? 'ok' : p >= 75 ? 'warn' : 'bad'; },
    cincin: function (pct, o) {
      o = o || {};
      const r = 34, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, Number(pct) || 0)), uk = o.ukuran || 88, NS = 'http://www.w3.org/2000/svg';
      const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 80 80'); s.setAttribute('width', uk); s.setAttribute('height', uk);
      const t = document.createElementNS(NS, 'circle'); [['cx', 40], ['cy', 40], ['r', r], ['fill', 'none'], ['stroke', o.track || 'rgba(255,255,255,.2)'], ['stroke-width', 8]].forEach(function (a) { t.setAttribute(a[0], a[1]); });
      const p = document.createElementNS(NS, 'circle'); [['cx', 40], ['cy', 40], ['r', r], ['fill', 'none'], ['stroke', o.warna || '#4ADE80'], ['stroke-width', 8], ['stroke-linecap', 'round'], ['stroke-dasharray', c], ['stroke-dashoffset', c * (1 - v / 100)]].forEach(function (a) { p.setAttribute(a[0], a[1]); });
      s.appendChild(t); s.appendChild(p);
      return h('div', { class: 'ring', style: { width: uk + 'px', height: uk + 'px', color: o.teks || 'inherit' } }, s, h('div', { class: 'rv' }, pct === '' || pct === null || pct === undefined ? '–' : F.angka(pct) + '%', o.label ? h('small', null, o.label) : null));
    },
    // ---------- Grafik SVG ringan ----------
    svg: function (w, hgt) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt); s.setAttribute('class', 'chart'); s.setAttribute('role', 'img'); return s; },
    el: function (tag, at, teks) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(at).forEach(function (k) { e.setAttribute(k, at[k]); }); if (teks !== undefined) e.textContent = teks; return e; },
    grafikBatang: function (data, o) {
      o = o || {}; const W = 640, H = o.tinggi || 240, L = 36, B = 44, T = 14, maks = o.maks || 100;
      const s = UI.svg(W, H); s.setAttribute('aria-label', o.label || 'Grafik batang');
      [0, 25, 50, 75, 100].forEach(function (g) { const y = T + (H - T - B) * (1 - g / maks); s.appendChild(UI.el('line', { x1: L, x2: W, y1: y, y2: y, class: 'grid-l' })); s.appendChild(UI.el('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }, g)); });
      if (o.garis) { const y = T + (H - T - B) * (1 - o.garis / maks); s.appendChild(UI.el('line', { x1: L, x2: W, y1: y, y2: y, stroke: '#16A34A', 'stroke-dasharray': '4 4' })); }
      const bw = (W - L) / Math.max(data.length, 1);
      data.forEach(function (d, i) {
        const v = Math.max(0, Math.min(maks, Number(d.nilai) || 0)), x = L + i * bw + bw * 0.22, w = bw * 0.56, hh = (H - T - B) * v / maks, y = H - B - hh;
        const rect = UI.el('rect', { x: x, y: y, width: w, height: Math.max(hh, d.nilai === '' ? 0 : 1), rx: 5, fill: d.warna || '#2563EB' });
        rect.appendChild(UI.el('title', {}, d.label + ': ' + (d.nilai === '' ? 'belum dipetakan' : F.angka(d.nilai) + (o.satuan || '%'))));
        s.appendChild(rect);
        if (d.nilai !== '') s.appendChild(UI.el('text', { x: x + w / 2, y: y - 5, 'text-anchor': 'middle', 'font-weight': '600' }, F.angka(d.nilai, 0)));
        s.appendChild(UI.el('text', { x: x + w / 2, y: H - B + 16, 'text-anchor': 'middle' }, String(d.label).slice(0, 10)));
      });
      return s;
    },
    grafikGaris: function (labels, seri, o) {
      o = o || {}; const W = 640, H = o.tinggi || 220, L = 36, B = 36, T = 14, R = 16, maks = o.maks || 100;
      const s = UI.svg(W, H); s.setAttribute('aria-label', o.label || 'Grafik garis');
      [0, 25, 50, 75, 100].forEach(function (g) { const y = T + (H - T - B) * (1 - g / maks); s.appendChild(UI.el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid-l' })); s.appendChild(UI.el('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }, g)); });
      const xs = function (i) { return labels.length < 2 ? (L + W - R) / 2 : L + (W - L - R) * i / (labels.length - 1); };
      labels.forEach(function (l, i) { s.appendChild(UI.el('text', { x: xs(i), y: H - 10, 'text-anchor': 'middle' }, l)); });
      seri.forEach(function (sr) {
        const pts = sr.titik.map(function (v, i) { return v === '' || v === null || v === undefined ? null : [xs(i), T + (H - T - B) * (1 - Math.min(maks, v) / maks), v]; });
        const d = pts.filter(Boolean).map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
        if (d) s.appendChild(UI.el('path', { d: d, fill: 'none', stroke: sr.warna, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        pts.forEach(function (p) { if (!p) return; const c = UI.el('circle', { cx: p[0], cy: p[1], r: 4.5, fill: sr.warna, stroke: '#fff', 'stroke-width': 2 }); c.appendChild(UI.el('title', {}, sr.nama + ': ' + F.angka(p[2]))); s.appendChild(c); });
      });
      return s;
    },
    donat: function (segmen, o) {
      o = o || {}; const total = segmen.reduce(function (a, s) { return a + (Number(s.nilai) || 0); }, 0), r = 15.9155, s = UI.svg(42, 42);
      s.style.width = (o.ukuran || 140) + 'px'; s.setAttribute('class', 'donat-svg'); s.setAttribute('aria-label', o.label || 'Grafik donat');
      s.appendChild(UI.el('circle', { cx: 21, cy: 21, r: r, fill: 'none', stroke: 'var(--soft)', 'stroke-width': 5 }));
      let off = 25;
      segmen.forEach(function (sg) {
        const p = total ? (Number(sg.nilai) || 0) / total * 100 : 0; if (!p) return;
        const c = UI.el('circle', { cx: 21, cy: 21, r: r, fill: 'none', stroke: sg.warna, 'stroke-width': 5, 'stroke-dasharray': p + ' ' + (100 - p), 'stroke-dashoffset': off });
        c.appendChild(UI.el('title', {}, sg.label + ': ' + sg.nilai)); s.appendChild(c); off = off - p;
      });
      s.appendChild(UI.el('text', { x: 21, y: 22.5, 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 700, class: 't1' }, o.tengah !== undefined ? o.tengah : total));
      s.appendChild(UI.el('text', { x: 21, y: 28, 'text-anchor': 'middle', 'font-size': 3.4 }, o.sub || ''));
      return h('div', { class: 'row gap-lg wrap' }, s, h('div', { class: 'col' }, segmen.map(function (sg) { return h('div', { class: 'small' }, h('i', { style: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: sg.warna, marginRight: '8px' } }), sg.label + ': ', h('b', null, sg.nilai)); })));
    },
    // ---------- Tabel: cari, urut, paginasi 25, kolom pertama lengket ----------
    tabel: function (o) {
      const per = o.per || 25; let hal = 1, kata = '', urut = o.urut || null, arah = 1;
      const wrap = h('div'), tbody = h('tbody'), info = h('span', { class: 'small muted' }), nav = h('div', { class: 'hal' });
      const thead = h('thead', null, h('tr', null, o.kolom.map(function (k, i) {
        const th = h('th', { class: (k.urut !== false ? 'urut ' : '') + (i === 0 && o.lengket !== false ? 'sticky1' : ''), scope: 'col' }, k.label);
        if (k.urut !== false) th.addEventListener('click', function () { if (urut === k.k) arah = -arah; else { urut = k.k; arah = 1; } gambar(); });
        return th;
      })));
      function teksSel(b, k) { const v = k.teks ? k.teks(b) : b[k.k]; return v === undefined || v === null ? '' : String(v); }
      function gambar() {
        let arr = o.baris.slice();
        if (kata) { const q = kata.toLowerCase(); arr = arr.filter(function (b) { return o.kolom.some(function (k) { return teksSel(b, k).toLowerCase().indexOf(q) > -1; }); }); }
        if (urut) { const k = o.kolom.filter(function (x) { return x.k === urut; })[0] || { k: urut }; arr.sort(function (a, b) { const x = teksSel(a, k), y = teksSel(b, k), nx = parseFloat(x), ny = parseFloat(y); return (!isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y, 'id')) * arah; }); }
        const n = arr.length, maxHal = Math.max(1, Math.ceil(n / per)); if (hal > maxHal) hal = maxHal;
        const potong = arr.slice((hal - 1) * per, hal * per);
        tbody.replaceChildren.apply(tbody, potong.length ? potong.map(function (b) {
          const tr = h('tr', { class: o.onRow ? 'klik' : '' }, o.kolom.map(function (k, i) {
            const v = k.fmt ? k.fmt(b[k.k], b) : (b[k.k] === '' || b[k.k] === undefined || b[k.k] === null ? '–' : b[k.k]);
            return h('td', { class: (i === 0 && o.lengket !== false ? 'sticky1 ' : '') + (k.kelas || '') }, v);
          }));
          if (o.onRow) tr.addEventListener('click', function (e) { if (!e.target.closest('button,a,input,select')) o.onRow(b); });
          return tr;
        }) : [h('tr', null, h('td', { colspan: o.kolom.length }, UI.kosong(o.kosong || 'Belum ada data.')))]);
        info.textContent = n ? 'Menampilkan ' + ((hal - 1) * per + 1) + '–' + Math.min(hal * per, n) + ' dari ' + n : '';
        const tombol = [];
        const tb = function (lbl, ke, on, aria) { return h('button', { type: 'button', class: on ? 'on' : '', 'aria-label': aria || ('Halaman ' + lbl), onclick: function () { hal = ke; gambar(); } }, lbl); };
        if (maxHal > 1) {
          if (hal > 1) tombol.push(tb('‹', hal - 1, false, 'Sebelumnya'));
          for (let i = Math.max(1, hal - 2); i <= Math.min(maxHal, hal + 2); i++) tombol.push(tb(String(i), i, i === hal));
          if (hal < maxHal) tombol.push(tb('›', hal + 1, false, 'Berikutnya'));
        }
        nav.replaceChildren.apply(nav, tombol);
      }
      const alat = (o.cari !== false || o.alat) ? h('div', { class: 'tbl-alat' },
        o.cari !== false ? h('div', { class: 'cari' }, ic('search'), h('input', { type: 'search', placeholder: o.placeholder || 'Cari…', 'aria-label': 'Cari dalam tabel', oninput: function (e) { kata = e.target.value; hal = 1; gambar(); } })) : null,
        o.alat || null) : null;
      wrap.append(alat || '', h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, thead, tbody)), h('div', { class: 'paging' }, info, nav));
      gambar();
      wrap.perbarui = function (baris) { o.baris = baris; gambar(); };
      return wrap;
    },
    // ---------- Chip pilihan cepat ----------
    chips: function (o) {
      let nilai = o.multi ? [].concat(o.nilai || []) : o.nilai;
      const wrap = h('div', { class: 'chips', role: o.multi ? 'group' : 'radiogroup', 'aria-label': o.label || '' });
      function gambar() {
        wrap.replaceChildren.apply(wrap, o.opsi.map(function (op) {
          const v = typeof op === 'object' ? op.v : op, lbl = typeof op === 'object' ? op.l : op, ikon = typeof op === 'object' ? op.i : null;
          const on = o.multi ? nilai.indexOf(v) > -1 : nilai === v;
          return h('button', { type: 'button', class: 'chip ' + (o.kelas || '') + (on ? ' on' : ''), role: o.multi ? 'checkbox' : 'radio', 'aria-checked': on ? 'true' : 'false', disabled: o.disabled,
            onclick: function () {
              if (o.multi) nilai = on ? nilai.filter(function (x) { return x !== v; }) : nilai.concat([v]); else nilai = v;
              gambar(); if (o.onChange) o.onChange(nilai);
            } }, ikon ? ic(ikon, 's') : (o.multi && on ? ic('check', 's') : null), lbl);
        }));
      }
      gambar();
      wrap.nilai = function () { return nilai; };
      wrap.atur = function (v) { nilai = o.multi ? [].concat(v || []) : v; gambar(); };
      return wrap;
    },
    // ---------- Formulir ----------
    fld: function (label, kontrol, o) {
      o = o || {};
      const id = kontrol.id || ('f' + Math.random().toString(36).slice(2, 8)); kontrol.id = id;
      return h('div', { class: 'fld ' + (o.kelas || '') }, label ? h('label', { for: id, class: o.wajib ? 'req' : '' }, label) : null, kontrol, o.bantuan ? h('span', { class: 'help' }, o.bantuan) : null);
    },
    inp: function (a) { return h('input', Object.assign({ class: 'inp', type: 'text' }, a)); },
    area: function (a) { return h('textarea', Object.assign({ class: 'inp' }, a)); },
    pilih: function (opsi, nilai, a) {
      return h('select', Object.assign({ class: 'inp' }, a), (a && a.kosong !== undefined ? [h('option', { value: '' }, a.kosong)] : []).concat(opsi.map(function (op) {
        const v = typeof op === 'object' ? op.v : op, l = typeof op === 'object' ? op.l : op;
        return h('option', { value: v, selected: String(v) === String(nilai) }, l);
      })));
    },
    bacaForm: function (form) {
      const o = {};
      form.querySelectorAll('[name]').forEach(function (el) {
        if (el.type === 'checkbox') o[el.name] = el.checked;
        else if (el.multiple) o[el.name] = Array.from(el.selectedOptions).map(function (x) { return x.value; });
        else o[el.name] = el.value.trim();
      });
      return o;
    },
    sandi: function (a) {
      const i = h('input', Object.assign({ class: 'inp', type: 'password', autocomplete: 'current-password' }, a));
      const b = h('button', { type: 'button', class: 'ibtn', 'aria-label': 'Tampilkan sandi', onclick: function () { i.type = i.type === 'password' ? 'text' : 'password'; b.replaceChildren(ic(i.type === 'password' ? 'eye' : 'eyeOff')); } }, ic('eye'));
      const w = h('div', { class: 'pw-wrap' }, i, b); w.input = i; return w;
    },
    tabs: function (daftar, aktif, onPilih) {
      const w = h('div', { class: 'tabs', role: 'tablist' });
      function gambar() {
        w.replaceChildren.apply(w, daftar.filter(Boolean).map(function (t) {
          return h('button', { type: 'button', role: 'tab', class: t.id === aktif ? 'on' : '', 'aria-selected': t.id === aktif ? 'true' : 'false', onclick: function () { aktif = t.id; gambar(); onPilih(t.id); } },
            t.ikon ? ic(t.ikon, 's') : null, t.label, t.n ? h('span', { class: 'n' }, t.n) : null);
        }));
      }
      gambar(); return w;
    },
    seg: function (daftar, aktif, onPilih) {
      const w = h('div', { class: 'seg', role: 'tablist' });
      function gambar() { w.replaceChildren.apply(w, daftar.map(function (t) { return h('button', { type: 'button', class: t.id === aktif ? 'on' : '', onclick: function () { aktif = t.id; gambar(); onPilih(t.id); } }, t.label); })); }
      gambar(); return w;
    },
    stepper: function (tahap, pilih, onKlik) {
      return h('div', { class: 'stepper' }, tahap.map(function (t, i) {
        const st = t.status;
        return h('button', { type: 'button', class: 'step ' + st + (pilih === i ? ' pilih' : ''), onclick: function () { onKlik(i); } },
          h('span', { class: 'no' }, st === 'selesai' ? ic('check', 's') : String(i + 1)),
          h('span', { class: 'st' }, st === 'selesai' ? 'Tuntas' : st === 'berjalan' ? 'Berjalan' : 'Belum'),
          h('b', null, (i + 1) + '. ' + t.nama), h('small', null, t.ket || ''));
      }));
    },
    kosong: function (pesan, ikon) { return h('div', { class: 'kosong' }, ic(ikon || 'inbox'), h('div', null, pesan)); },
    galatKartu: function (pesan, ulang) {
      return h('div', { class: 'card kosong' }, ic('alertCircle'), h('b', null, 'Data belum bisa dimuat'), h('div', { class: 'small' }, pesan), ulang ? h('button', { class: 'btn kecil', onclick: ulang }, ic('refresh', 's'), 'Coba lagi') : null);
    },
    kerangka: function (jenis) {
      if (jenis === 'daftar') return h('div', { class: 'stack' }, h('div', { class: 'sk', style: { height: '40px', width: '40%' } }), [1, 2, 3, 4, 5].map(function () { return h('div', { class: 'sk', style: { height: '64px' } }); }));
      return h('div', { class: 'stack' }, h('div', { class: 'sk', style: { height: '150px', borderRadius: '16px' } }), h('div', { class: 'grid g4' }, [1, 2, 3, 4].map(function () { return h('div', { class: 'sk sk-card' }); })), h('div', { class: 'grid g2' }, h('div', { class: 'sk', style: { height: '260px' } }), h('div', { class: 'sk', style: { height: '260px' } })));
    },
    kepala: function (judul, sub, aksi) { return h('div', { class: 'page-h' }, h('div', null, h('h1', null, judul), sub ? h('p', null, sub) : null), aksi ? h('div', { class: 'aksi' }, aksi) : null); },
    // ---------- Berkas ----------
    kompres: function (file) {
      return new Promise(function (res) {
        if (!/^image\/(jpeg|png)$/.test(file.type)) return res(file);
        const img = new Image(), url = URL.createObjectURL(file);
        img.onload = function () {
          const sk = Math.min(1, 1600 / img.width); if (sk >= 1 && file.size < 600000) { URL.revokeObjectURL(url); return res(file); }
          const c = document.createElement('canvas'); c.width = Math.round(img.width * sk); c.height = Math.round(img.height * sk);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { URL.revokeObjectURL(url); res(new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', 0.82);
        };
        img.onerror = function () { res(file); }; img.src = url;
      });
    },
    keBase64: function (file) { return new Promise(function (res, rej) { const r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(file); }); },
    /** Kotak unggah: kembalikan elemen dengan .ids() daftar file_id terunggah. */
    unggah: function (modul, o) {
      o = o || {}; const ids = [].concat(o.awal || []); const daftar = h('div', { class: 'col' });
      const input = h('input', { type: 'file', class: 'sr', accept: o.accept || '.pdf,.jpg,.jpeg,.png,.docx,.xlsx,.pptx', multiple: !!o.banyak });
      const kotak = h('label', { class: 'drop' }, input, ic('cloudUp', 'l'), h('b', null, o.label || 'Pilih berkas'), h('span', { class: 'xs' }, 'PDF, JPG, PNG, DOCX, XLSX, PPTX · maks. 10 MB · foto dikompres otomatis'));
      function gambar() {
        daftar.replaceChildren.apply(daftar, ids.map(function (x, i) {
          return h('div', { class: 'berkas-item' }, ic(/image/.test(x.mime || '') ? 'image' : 'file'), h('span', { class: 'grow trunc' }, x.nama || x.file_id),
            x.ukuran ? h('span', { class: 'xs muted' }, F.ukuran(x.ukuran)) : null,
            h('button', { type: 'button', class: 'btn ghost kecil ikon', 'aria-label': 'Hapus dari daftar', onclick: function () { ids.splice(i, 1); gambar(); } }, ic('x', 's')));
        }));
        kotak.classList.toggle('hide', !o.banyak && ids.length > 0);
      }
      input.addEventListener('change', async function () {
        for (const f0 of Array.from(input.files)) {
          if (f0.size > 10 * 1024 * 1024) { toast(f0.name + ' lebih dari 10 MB.', 'bad'); continue; }
          const f = await UI.kompres(f0);
          const tempat = h('div', { class: 'berkas-item' }, h('span', { class: 'putar' }), h('span', { class: 'grow trunc' }, 'Mengunggah ' + f.name + '…'));
          daftar.appendChild(tempat);
          const r = await Api.call('berkas.unggah', { nama: f.name, base64: await UI.keBase64(f), modul: modul });
          tempat.remove();
          if (r.ok) { ids.push(r.data); if (!o.banyak) ids.splice(0, ids.length - 1); gambar(); if (o.onChange) o.onChange(ids); }
          else toast(r.error, 'bad');
        }
        input.value = '';
      });
      gambar();
      const w = h('div', { class: 'col' }, kotak, daftar);
      w.ids = function () { return ids.map(function (x) { return x.file_id; }); };
      w.data = function () { return ids; };
      return w;
    },
    /** Buka berkas: tautan Drive (bila dibagikan) atau lewat server (privat, base64). */
    bukaBerkas: async function (fileId, o) {
      o = o || {};
      if (o.url) { window.open(o.url, '_blank', 'noopener'); return; }
      const t = toastMemuat('Membuka berkas…');
      const r = await Api.call(o.aksi || 'berkas.buka', Object.assign({ file_id: fileId }, o.data || {}));
      t.remove();
      if (!r.ok) { toast(r.error, 'bad'); return; }
      UI.tampilBase64(r.data.nama, r.data.mime, r.data.base64);
    },
    tampilBase64: function (nama, mime, b64) {
      const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr], { type: mime }));
      const unduh = h('a', { class: 'btn pri', href: url, download: nama }, ic('download', 's'), 'Unduh');
      const pratinjau = /pdf/.test(mime) ? h('iframe', { src: url, title: nama, style: { width: '100%', height: '70vh', border: '0', borderRadius: '8px' } })
        : /image/.test(mime) ? h('img', { src: url, alt: nama, style: { width: '100%', borderRadius: '8px' } }) : h('p', { class: 'muted' }, 'Pratinjau tidak tersedia untuk jenis berkas ini. Gunakan tombol Unduh.');
      modal({ judul: nama, lebar: true, isi: h('div', { class: 'col' }, pratinjau, h('div', { class: 'row' }, unduh)), tanpaFokus: true, onTutup: function () { setTimeout(function () { URL.revokeObjectURL(url); }, 1000); } });
    },
    unduhTeks: function (nama, isi, mime) { const a = h('a', { href: URL.createObjectURL(new Blob([isi], { type: mime || 'text/plain' })), download: nama }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  };
  function toastMemuat(p) { let w = document.querySelector('.toasts'); if (!w) { w = h('div', { class: 'toasts' }); document.body.appendChild(w); } const t = h('div', { class: 'toast' }, h('span', { class: 'putar' }), p); w.appendChild(t); return t; }
  window.UI = UI;
})();

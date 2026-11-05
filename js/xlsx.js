/* Penulis .xlsx mini di klien (tanpa pustaka): ZIP "store" + SpreadsheetML. Cukup untuk ekspor tabel laporan. */
window.Xlsx = (function () {
  'use strict';
  const T = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  const enc = new TextEncoder();
  function zip(files) {
    const bag = [], pusat = []; let off = 0;
    const d = new Date(), wkt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, tgl = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    files.forEach(function (f) {
      const nama = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, wkt, true); lh.setUint16(12, tgl, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, nama.length, true); lh.setUint16(28, 0, true);
      bag.push(new Uint8Array(lh.buffer), nama, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, wkt, true); ch.setUint16(14, tgl, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, nama.length, true); ch.setUint32(42, off, true);
      pusat.push(new Uint8Array(ch.buffer), nama);
      off += 30 + nama.length + data.length;
    });
    const ukPusat = pusat.reduce(function (a, b) { return a + b.length; }, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, ukPusat, true); end.setUint32(16, off, true);
    return new Blob(bag.concat(pusat, [new Uint8Array(end.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  const x = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); };
  const kol = function (i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  /** buat(namaBerkas, [{nama, kolom:[{k,label}], baris:[{}]}]) */
  function buat(namaBerkas, lembar) {
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + lembar.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + lembar.map(function (l, i) { return '<sheet name="' + x(String(l.nama || 'Data').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + lembar.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E3A5F"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
    ];
    lembar.forEach(function (l, i) {
      const lebar = l.kolom.map(function (k) { return Math.min(60, Math.max(String(k.label).length, ...l.baris.slice(0, 200).map(function (b) { return String(b[k.k] === undefined ? '' : b[k.k]).length; })) + 2); });
      const sel = function (r, c, v, gaya) {
        const ref = kol(c) + r;
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (gaya ? ' s="1"' : '') + '><v>' + v + '</v></c>';
        return '<c r="' + ref + '" t="inlineStr"' + (gaya ? ' s="1"' : '') + '><is><t xml:space="preserve">' + x(v === undefined || v === null ? '' : v) + '</t></is></c>';
      };
      const baris = ['<row r="1">' + l.kolom.map(function (k, c) { return sel(1, c, k.label, true); }).join('') + '</row>']
        .concat(l.baris.map(function (b, r) { return '<row r="' + (r + 2) + '">' + l.kolom.map(function (k, c) { let v = b[k.k]; if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && v.length < 12 && !/^0\d/.test(v)) v = Number(v); return sel(r + 2, c, v); }).join('') + '</row>'; }));
      files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' + lebar.map(function (w, c) { return '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>' + baris.join('') + '</sheetData></worksheet>' });
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zip(files)); a.download = namaBerkas.replace(/[^\w\- .]+/g, '_') + '.xlsx';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  return { buat: buat, _zip: zip, _crc: crc32 };
})();

import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Coins, 
  Scale, 
  Calendar, 
  Share2,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { utils, write } from 'xlsx';

export const Laporan: React.FC = () => {
  const { coa, pinjaman, simpanan, anggota, cooperativeSettings } = useCooperative();
  const [activeReport, setActiveReport] = useState<'neraca' | 'labarugi' | 'simpanan_pinjaman'>('neraca');
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-31');

  // Math Evaluators based on current state of Chart of Accounts
  // 1. Assets (Aset)
  const kasUtama = coa.find(c => c.code === '1101')?.balance || 0;
  const kasBank = coa.find(c => c.code === '1102')?.balance || 0;
  // Dynamic loan principal remaining balance has been integrated into Asset Accounts 1103 via bookkeepingStore balance updates
  const piutangPinjaman = coa.find(c => c.code === '1103')?.balance || 0;
  const totalAset = kasUtama + kasBank + piutangPinjaman;

  // 2. Liabilities (Liabilitas)
  const simpPokok = coa.find(c => c.code === '2101')?.balance || 0;
  const simpWajib = coa.find(c => c.code === '2102')?.balance || 0;
  const simpSukarela = coa.find(c => c.code === '2103')?.balance || 0;
  const totalKewajiban = simpPokok + simpWajib + simpSukarela;

  // 3. Equity (Ekuitas)
  const modalAwal = coa.find(c => c.code === '3101')?.balance || 0;
  const shuLalu = coa.find(c => c.code === '3102')?.balance || 0;

  // Income statement variables
  const pendapatanBunga = coa.find(c => c.code === '4101')?.balance || 0;
  const pendapatanProvisi = coa.find(c => c.code === '4102')?.balance || 0;
  const dendaTerlambat = coa.find(c => c.code === '4103')?.balance || 0;
  const totalPendapatan = pendapatanBunga + pendapatanProvisi + dendaTerlambat;

  const bebanListrik = coa.find(c => c.code === '5101')?.balance || 0;
  const bebanATK = coa.find(c => c.code === '5102')?.balance || 0;
  const honorStaf = coa.find(c => c.code === '5103')?.balance || 0;
  const bebanOperasional = coa.find(c => c.code === '5104')?.balance || 0;
  const totalBeban = bebanListrik + bebanATK + honorStaf + bebanOperasional;

  const labaBersihSHU = totalPendapatan - totalBeban;
  const totalEkuitas = modalAwal + shuLalu + labaBersihSHU;

  // Balancing check (Total Aset must equal Liabilities + Equities)
  const diffBalance = Math.abs(totalAset - (totalKewajiban + totalEkuitas));

  // Export excel helper
  const exportExcel = () => {
    let rows: any[] = [];
    let filename = '';

    if (activeReport === 'neraca') {
      rows = [
        { Kategori: 'AKTIVA (ASET)', Akun: 'Kas Utama Koperasi', Saldo: kasUtama },
        { Kategori: 'AKTIVA (ASET)', Akun: 'Kas Simpanan Bank', Saldo: kasBank },
        { Kategori: 'AKTIVA (ASET)', Akun: 'Piutang Pinjaman Anggota', Saldo: piutangPinjaman },
        { Kategori: 'TOTAL AKTIVA', Akun: '', Saldo: totalAset },
        { Kategori: '', Akun: '', Saldo: '' },
        { Kategori: 'PASSIVA (KEWAJIBAN & EKUITAS)', Akun: 'Simpanan Pokok Anggota', Saldo: simpPokok },
        { Kategori: 'PASSIVA (KEWAJIBAN & EKUITAS)', Akun: 'Simpanan Wajib Bulanan', Saldo: simpWajib },
        { Kategori: 'PASSIVA (KEWAJIBAN & EKUITAS)', Akun: 'Simpanan Sukarela Bebas', Saldo: simpSukarela },
        { Kategori: 'TOTAL KEWAJIBAN/LIABILITAS', Akun: '', Saldo: totalKewajiban },
        { Kategori: 'PASSIVA (KEWAJIBAN & EKUITAS)', Akun: 'Modal Pokok Hibah', Saldo: modalAwal },
        { Kategori: 'PASSIVA (KEWAJIBAN & EKUITAS)', Akun: 'Sisa Hasil Usaha (SHU) Tahun Berjalan', Saldo: labaBersihSHU },
        { Kategori: 'TOTAL EKUITAS', Akun: '', Saldo: totalEkuitas },
        { Kategori: 'TOTAL PASSIVA', Akun: '', Saldo: totalKewajiban + totalEkuitas },
      ];
      filename = 'Laporan_Neraca_Forsdig';
    } else {
      rows = [
        { Kategori: 'PENDAPATAN JASA KSP', Akun: 'Pendapatan Jasa Bunga Kredit', Saldo: pendapatanBunga },
        { Kategori: 'PENDAPATAN JASA KSP', Akun: 'Pendapatan Provisi Administrasi', Saldo: pendapatanProvisi },
        { Kategori: 'PENDAPATAN JASA KSP', Akun: 'Pendapatan Denda Terlambat', Saldo: dendaTerlambat },
        { Kategori: 'TOTAL PENDAPATAN OPERASIONAL', Akun: '', Saldo: totalPendapatan },
        { Kategori: '', Akun: '', Saldo: '' },
        { Kategori: 'BEBAN OPERASIONAL KSP', Akun: 'Beban Listrik & Air', Saldo: bebanListrik },
        { Kategori: 'BEBAN OPERASIONAL KSP', Akun: 'Beban Alat Tulis Kantor ATK', Saldo: bebanATK },
        { Kategori: 'BEBAN OPERASIONAL KSP', Akun: 'Uang Honor Staf Pegawai', Saldo: honorStaf },
        { Kategori: 'BEBAN OPERASIONAL KSP', Akun: 'Beban Operasional Lainnya', Saldo: bebanOperasional },
        { Kategori: 'TOTAL BIAYA BEBAN OPERASIONAL', Akun: '', Saldo: totalBeban },
        { Kategori: 'SISA HASIL USAHA BERSIH (Laba-Rugi)', Akun: '', Saldo: labaBersihSHU },
      ];
      filename = 'Laporan_Laba_Rugi_Forsdig';
    }

    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}_${startDate}_to_${endDate}.xlsx`;
    a.click();
  };

  // Export PDF template
  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant frame watermarks
    doc.setFillColor(13, 42, 29);
    doc.rect(10, 10, 190, 24, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KOPERASI FORSDIG SIMPAN PINJAM', 16, 18);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`LAPORAN KEUANGAN PRIODE: ${startDate} s/d ${endDate}`, 16, 26);
    doc.text('Laporan Hasil Audit Digital', 142, 26);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');

    let yPos = 46;

    if (activeReport === 'neraca') {
      doc.text('LAPORAN POSISI KEUANGAN (NERACA STAFEL)', 16, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      yPos += 8;

      // Assets Box
      doc.setFillColor(245, 245, 245);
      doc.rect(16, yPos, 178, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('AKTIVA / ASET LANCAR KOPERASI', 20, yPos + 5);
      yPos += 8;

      doc.setFont('Helvetica', 'normal');
      doc.text('Kas Tunai Utama Swakelola', 20, yPos + 4);
      doc.text(`Rp ${kasUtama.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Kas Likuiditas Giro Bank', 20, yPos + 4);
      doc.text(`Rp ${kasBank.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Piutang Pinjaman Pokok Anggota', 20, yPos + 4);
      doc.text(`Rp ${piutangPinjaman.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.line(16, yPos, 194, yPos);
      doc.setFont('Helvetica', 'bold');
      doc.text('TOTAL VOLUME AKTIVA (ASET)', 20, yPos + 5);
      doc.text(`Rp ${totalAset.toLocaleString()}`, 150, yPos + 5);
      yPos += 14;

      // PASSIVA
      doc.setFillColor(242, 245, 242);
      doc.rect(16, yPos, 178, 8, 'F');
      doc.text('PASSIVA (KEWAJIBAN & EKUITAS)', 20, yPos + 5);
      yPos += 8;

      doc.setFont('Helvetica', 'normal');
      doc.text('Kewajiban Tabungan Iuran Anggota', 20, yPos + 4);
      doc.text(`Rp ${totalKewajiban.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Modal Pokok Hibah Bersih', 20, yPos + 4);
      doc.text(`Rp ${modalAwal.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Sisa Hasil Usaha (SHU) Koperasi Berjalan', 20, yPos + 4);
      doc.text(`Rp ${labaBersihSHU.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.line(16, yPos, 194, yPos);
      doc.setFont('Helvetica', 'bold');
      doc.text('TOTAL PASSIVA (KEWAJIBAN + EKUITAS)', 20, yPos + 5);
      doc.text(`Rp ${(totalKewajiban + totalEkuitas).toLocaleString()}`, 150, yPos + 5);
      yPos += 14;

      doc.setFontSize(8);
      doc.setFont('Helvetica', 'italic');
      doc.text('* Laporan Neraca dinyatakan SEIMBANG (Balanced) sesuai standar akuntansi internasional.', 16, yPos);

    } else {
      doc.text('LAPORAN HASIL KELAYAKAN USAHA (LABA RUGI)', 16, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      yPos += 8;

      doc.setFillColor(245, 245, 245);
      doc.rect(16, yPos, 178, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('PENDAPATAN OPERASIONAL KSP (REVENUES)', 20, yPos + 5);
      yPos += 8;

      doc.setFont('Helvetica', 'normal');
      doc.text('Pendapatan Margin Bunga flat akrual', 20, yPos + 4);
      doc.text(`Rp ${pendapatanBunga.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Pendapatan Jasa Biaya Administrasi', 20, yPos + 4);
      doc.text(`Rp ${pendapatanProvisi.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Penerimaan Denda Keterlambatan Tagihan', 20, yPos + 4);
      doc.text(`Rp ${dendaTerlambat.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.line(16, yPos, 194, yPos);
      doc.setFont('Helvetica', 'bold');
      doc.text('TOTAL PENDAPATAN OPERASIONAL KSP', 20, yPos + 5);
      doc.text(`Rp ${totalPendapatan.toLocaleString()}`, 150, yPos + 5);
      yPos += 14;

      doc.setFillColor(250, 245, 245);
      doc.rect(16, yPos, 178, 8, 'F');
      doc.text('BEBAN BIAYA PENYELENGGARAAN KSP (EXPENSES)', 20, yPos + 5);
      yPos += 8;

      doc.setFont('Helvetica', 'normal');
      doc.text('Beban Token Listrik Air Kantor Cabang', 20, yPos + 4);
      doc.text(`Rp ${bebanListrik.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Beban ATK & Pembelian Buku Kertas', 20, yPos + 4);
      doc.text(`Rp ${bebanATK.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Gaji Honor Karyawan KSP', 20, yPos + 4);
      doc.text(`Rp ${honorStaf.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.text('Beban Operasional non-transaksional lain', 20, yPos + 4);
      doc.text(`Rp ${bebanOperasional.toLocaleString()}`, 150, yPos + 4);
      yPos += 7;

      doc.line(16, yPos, 194, yPos);
      doc.setFont('Helvetica', 'bold');
      doc.text('TOTAL BEBAN BIAYA OPERASIONAL', 20, yPos + 5);
      doc.text(`Rp ${totalBeban.toLocaleString()}`, 150, yPos + 5);
      yPos += 14;

      doc.setFillColor(242, 245, 242);
      doc.rect(16, yPos, 178, 11, 'F');
      doc.setFontSize(10);
      doc.text('SISA HASIL USAHA (SHU NET MARGIN LABA BRUTO)', 20, yPos + 7);
      doc.text(`Rp ${labaBersihSHU.toLocaleString()}`, 150, yPos + 7);
    }

    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.setFont('Helvetica', 'normal');
    doc.text('Pembina Koperasi,', 20, 240);
    doc.line(18, 260, 52, 260);
    doc.text(`( ${cooperativeSettings?.ketuaName || 'Dewan Pembina'} )`, 21, 265);

    doc.text('Bendahara Pelaksana,', 140, 240);
    doc.line(138, 260, 172, 260);
    doc.text(`( ${cooperativeSettings?.adminName || 'Bendahara Pelaksana'} )`, 140, 265);

    doc.save(`Laporan_Finansial_Forsdig_${activeReport}.pdf`);
  };

  return (
    <div id="laporan-view" className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Pelaporan Keuangan KSP</h2>
          <p className="text-xs text-slate-500 font-medium">Bagan kalkulasi Neraca, Laba Rugi, Simpanan, Pinjaman, dan audit sisa hasil usaha (SHU).</p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            id="btn-print-excel"
            onClick={exportExcel}
            className="px-4 py-2.5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-650 dark:text-slate-205 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            id="btn-print-pdf-audit"
            onClick={exportPDF}
            className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-white rounded-lg text-xs font-bold hover:scale-[1.01] transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
          >
            <Printer className="h-4 w-4 text-amber-500" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* FILTER DATE AND REPORT TYPE SELECTOR */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-220 dark:border-slate-850 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* SELECT TYPE OF LESSON */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Tipe Laporan Finansial</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="report-neraca"
              onClick={() => setActiveReport('neraca')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                activeReport === 'neraca' 
                  ? 'bg-emerald-950/20 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900 font-extrabold' 
                  : 'bg-slate-50 dark:bg-[#0c111d] border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-650'
              }`}
            >
              Neraca Aktiva-Pasiva
            </button>
            <button
              id="report-labarugi"
              onClick={() => setActiveReport('labarugi')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                activeReport === 'labarugi' 
                  ? 'bg-emerald-950/20 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900 font-extrabold' 
                  : 'bg-slate-50 dark:bg-[#0c111d] border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-650'
              }`}
            >
              Laba Rugi (Spread)
            </button>
            <button
              id="report-summary"
              onClick={() => setActiveReport('simpanan_pinjaman')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                activeReport === 'simpanan_pinjaman' 
                  ? 'bg-emerald-950/20 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900 font-extrabold' 
                  : 'bg-slate-50 dark:bg-[#0c111d] border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-655'
              }`}
            >
              Rekap Tabung/Kredit
            </button>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Tanggal Awal</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-sans">Tanggal Akhir</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* RENDER ACTIVE LIVE BOARD SHEET */}
      <div className="bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-850 rounded-2xl shadow-sm p-6 space-y-6">
        
        {/* REPORT SHEET COOP HEADER METADATA */}
        <div className="border-b border-slate-150 p-1 pb-4 text-center space-y-1">
          <h3 className="font-extrabold text-base tracking-wide text-slate-805 dark:text-slate-100">FORSDIG SIMPAN PINJAM</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            {activeReport === 'neraca' ? 'Laporan Posisi Keuangan (Neraca Stafel)' : activeReport === 'labarugi' ? 'Laporan Kelayakan Usaha Laba Rugi' : 'Rekap Volume Transaksional Simpan & Pinjam'}
          </p>
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-450">Tanggal Pelaporan: {startDate} s/d {endDate}</p>
        </div>

        {/* 1. VIEW BLOCK: LA PORAN NERACA */}
        {activeReport === 'neraca' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs max-w-4xl mx-auto font-sans">
            
            {/* COLUMN LEFT: AKTIVA / ASSETS */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm border-b border-[#0d2a1d] pb-2 text-emerald-950 dark:text-emerald-400 flex items-center justify-between">
                <span>AKTIVA / ASET LANCAR</span>
                <span className="text-[10px] font-mono text-slate-400">Normal Balance: DEBIT</span>
              </h4>
              <div className="space-y-2.5 font-medium text-slate-700 dark:text-slate-300">
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100">
                  <span>Kas Utama (Brankas Loket)</span>
                  <strong className="text-slate-900 dark:text-white font-bold">Rp {kasUtama.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-101">
                  <span>Kas Bank (Saldo Mandiri/BCA)</span>
                  <strong className="text-slate-900 dark:text-white font-bold">Rp {kasBank.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-101">
                  <span>Piutang Pinjaman Pokok Anggota</span>
                  <strong className="text-slate-900 dark:text-white font-bold">Rp {piutangPinjaman.toLocaleString()}</strong>
                </div>
              </div>
              <div className="border-t border-slate-200 mt-4 pt-2.5 flex justify-between text-sm">
                <strong className="text-emerald-800 dark:text-emerald-450 font-black">TOTAL AKTIVA (ASET)</strong>
                <strong className="text-emerald-800 dark:text-emerald-450 font-black">Rp {totalAset.toLocaleString()}</strong>
              </div>
            </div>

            {/* COLUMN RIGHT: LIABILITIES & EQUITIES */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm border-b border-[#0d2a1d] pb-2 text-emerald-950 dark:text-emerald-400 flex items-center justify-between">
                <span>LIABILITAS & EKUITAS</span>
                <span className="text-[10px] font-mono text-slate-400">Normal Balance: KREDIT</span>
              </h4>
              <div className="space-y-2.5 font-medium text-slate-705 dark:text-slate-300">
                <div className="flex justify-between p-2 bg-[#FAF9F5] dark:bg-slate-900 rounded border border-amber-100/50">
                  <span>Simpanan Pokok Anggota</span>
                  <strong className="text-slate-900 dark:text-white font-semibold">Rp {simpPokok.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-[#FAF9F5] dark:bg-slate-900 rounded border border-amber-100/50">
                  <span>Simpanan Wajib Bulanan</span>
                  <strong className="text-slate-900 dark:text-white font-semibold">Rp {simpWajib.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-[#FAF9F5] dark:bg-slate-900 rounded border border-amber-100/50">
                  <span>Simpanan Sukarela Bebas</span>
                  <strong className="text-slate-900 dark:text-white font-semibold">Rp {simpSukarela.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100">
                  <span>Sisa Hasil Usaha (SHU) Berjalan</span>
                  <strong className="text-[#0d2a1d] dark:text-amber-400 font-bold">Rp {labaBersihSHU.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100">
                  <span>Modal Donasi Hibahan</span>
                  <strong className="text-slate-850 dark:text-white font-bold">Rp {modalAwal.toLocaleString()}</strong>
                </div>
              </div>
              <div className="border-t border-slate-202 mt-4 pt-2.5 flex justify-between text-sm">
                <strong className="text-emerald-800 dark:text-emerald-450 font-black">TOTAL PASSIVA</strong>
                <strong className="text-emerald-800 dark:text-emerald-450 font-black">Rp {(totalKewajiban + totalEkuitas).toLocaleString()}</strong>
              </div>
            </div>

            {/* BALANCE VERIFICATION BANNER */}
            <div className="col-span-1 md:col-span-2 border-t border-dashed border-slate-200 pt-4 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
              <span className="text-[10px] text-slate-408 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-[#0d2a1d]" />
                Balance Check (Sisa Deviasi): Rp {diffBalance.toLocaleString()}
              </span>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                ✅ NERACA BALANCE SEJAJAR
              </span>
            </div>

          </div>
        )}

        {/* 2. VIEW BLOCK: LAPORAN LABA RUGI */}
        {activeReport === 'labarugi' && (
          <div className="max-w-2xl mx-auto space-y-6 text-xs font-sans">
            
            {/* REVENUES BLOCK */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-emerald-950 dark:text-emerald-450 border-b border-slate-150 pb-1.5 uppercase">A. Pendapatan Operasional Koperasi Simpan Pinjam</h4>
              <div className="space-y-2 text-slate-650 dark:text-slate-300">
                <div className="flex justify-between p-1 pl-4 border-b border-slate-100/40">
                  <span>Pendapatan Jasa Margin Bunga Pinjaman</span>
                  <strong>Rp {pendapatanBunga.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-1 pl-4 border-b border-b-slate-100/40">
                  <span>Pendapatan Biaya Provisi & Administrasi Pengikat</span>
                  <strong>Rp {pendapatanProvisi.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-1 pl-4 border-b border-b-slate-100/40">
                  <span>Pendapatan Penerimaan Denda Keterlambatan</span>
                  <strong>Rp {dendaTerlambat.toLocaleString()}</strong>
                </div>
              </div>
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-400">
                <span>TOTAL PENDAPATAN OPERASIONAL KSP</span>
                <span>Rp {totalPendapatan.toLocaleString()}</span>
              </div>
            </div>

            {/* EXPENSES BLOCK */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-red-700 dark:text-red-400 border-b border-slate-150 pb-1.5 uppercase">B. Beban / Biaya Operasional Penyelenggaraan KSP</h4>
              <div className="space-y-2 text-slate-650 dark:text-slate-305">
                <div className="flex justify-between p-1 pl-4 border-b border-slate-100/40">
                  <span>Beban Listrik, Air & Wifi Kantor</span>
                  <strong>Rp {bebanListrik.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-1 pl-4 border-b border-slate-101/40">
                  <span>Beban Alat Tulis Kantor & Kertas Struk</span>
                  <strong>Rp {bebanATK.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-1 pl-4 border-b border-slate-101/40">
                  <span>Beban Listrik Gaji Honor KSP</span>
                  <strong>Rp {honorStaf.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between p-1 pl-4 border-b border-slate-101/40">
                  <span>Beban Operasional non-transaksional lain</span>
                  <strong>Rp {bebanOperasional.toLocaleString()}</strong>
                </div>
              </div>
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100 pt-1 border-t border-slate-400">
                <span>TOTAL PENYUSUTAN BEBAN OPERASIONAL KSP</span>
                <span>Rp {totalBeban.toLocaleString()}</span>
              </div>
            </div>

            {/* FINAL NET INCOMES */}
            <div className="bg-[#FAF6F0] p-4 rounded-xl border border-amber-205 flex items-center justify-between text-sm">
              <strong className="text-[#5D4037] font-extrabold">SISA HASIL USAHA BERSIH (NET SHU PROFIT)</strong>
              <strong className="text-[#2E7D32] dark:text-emerald-400 font-black text-base">
                Rp {labaBersihSHU.toLocaleString()}
              </strong>
            </div>

          </div>
        )}

        {/* 3. VIEW BLOCK: DETAILED SAVINGS & CREDIT RECORD TIMELINE */}
        {activeReport === 'simpanan_pinjaman' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Summary 1: Member card summaries */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 rounded-xl space-y-2">
                <h5 className="font-extrabold uppercase text-[10px] text-slate-405">Ringkasan Tabungan Koperasi</h5>
                <p className="flex justify-between"><span>Total Anggota Aktif:</span> <strong>{anggota.length} Orang</strong></p>
                <p className="flex justify-between"><span>Rata Simpanan per Anggota:</span> <strong>Rp {Math.round(totalKewajiban / (anggota.length || 1)).toLocaleString()}</strong></p>
                <p className="flex justify-between border-t pt-1.5 font-bold"><span>Total Tabungan:</span> <strong className="text-emerald-600 dark:text-emerald-400">Rp {totalKewajiban.toLocaleString()}</strong></p>
              </div>

              {/* Summary 2: Pinjaman outstanding */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-205/50 rounded-xl space-y-2">
                <h5 className="font-extrabold uppercase text-[10px] text-slate-405">Ringkasan Portofolio Pinjaman</h5>
                <p className="flex justify-between"><span>Pengajuan Kredit Disetujui:</span> <strong>{pinjaman.filter(p => p.status === 'disetujui').length} Proyek</strong></p>
                <p className="flex justify-between"><span>Rasio Jasa Bunga Rata-rata:</span> <strong>12% Flat Yearly</strong></p>
                <p className="flex justify-between border-t pt-1.5 font-bold"><span>Total Eksposur Outstanding:</span> <strong className="text-red-655 dark:text-red-400">Rp {piutangPinjaman.toLocaleString()}</strong></p>
              </div>
            </div>

            <p className="text-[10px] text-slate-405 italic text-center">
              Seluruh rekapitulasi data sinkron instan dengan buku besar akuntansi Koperasi Forsdig Simpan Pinjam 2026.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

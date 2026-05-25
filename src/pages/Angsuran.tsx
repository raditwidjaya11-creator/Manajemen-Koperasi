import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { Angsuran as AngsuranType } from '../types';
import { 
  Plus, 
  Search, 
  Coins, 
  Check, 
  X, 
  Printer, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  FileText,
  BadgeAlert
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';

export const Angsuran: React.FC = () => {
  const { 
    angsuran, 
    payAngsuran, 
    currentUser,
    pinjaman,
    cooperativeSettings
  } = useCooperative();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  
  // Repayment Modals State
  const [payModalOpen, setPayModalOpen] = useState<AngsuranType | null>(null);
  const [receiptOpen, setReceiptOpen] = useState<AngsuranType | null>(null);
  const [manualInputModalOpen, setManualInputModalOpen] = useState(false);

  // Form states
  const [penalty, setPenalty] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [collectorName, setCollectorName] = useState(cooperativeSettings?.collectorName || '');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Manual payment modal form states
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
  const [manualPenalty, setManualPenalty] = useState('0');
  const [manualCollector, setManualCollector] = useState(cooperativeSettings?.collectorName || '');
  const [manualError, setManualError] = useState('');

  // Sync with store settings when loaded
  React.useEffect(() => {
    if (cooperativeSettings?.collectorName) {
      setCollectorName(cooperativeSettings.collectorName);
      setManualCollector(cooperativeSettings.collectorName);
    }
  }, [cooperativeSettings]);

  // Tables pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Filter & Search
  const filteredAngsuran = angsuran.filter(a => {
    const matchesSearch = a.memberName.toLowerCase().includes(search.toLowerCase()) || 
                          a.memberNumber.toLowerCase().includes(search.toLowerCase()) || 
                          a.loanId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAngsuran.length / itemsPerPage);
  const displayedAngsuran = filteredAngsuran.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Auto calculate late denda based on date comparison
  const calculateSuggestedLateFee = (dueDateStr: string): number => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    if (today.getTime() > dueDate.getTime() + (24 * 60 * 60 * 1000)) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * 5000; // Rp 5.000 denda per hari terlambat
    }
    return 0;
  };

  const handleOpenPay = (item: AngsuranType) => {
    const suggestedFee = calculateSuggestedLateFee(item.date);
    setPenalty(String(suggestedFee));
    setCollectorName('');
    setPayModalOpen(item);
    setErrorForm('');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalOpen) return;

    const penaltyVal = Number(penalty) || 0;
    if (penaltyVal < 0) {
      setErrorForm('Denda penalti tidak boleh bernilai negatif.');
      return;
    }

    payAngsuran(
      payModalOpen.id,
      penaltyVal,
      currentUser?.name || 'Kasir Loket',
      collectorName.trim() || '-'
    );

    setPayModalOpen(null);
  };

  const handleLoanChange = (loanId: string) => {
    setSelectedLoanId(loanId);
    const loanUnpaid = angsuran.filter(a => a.loanId === loanId && a.status === 'unpaid');
    if (loanUnpaid.length > 0) {
      // Sort by installment number to pick the oldest scheduled installment first
      const sorted = [...loanUnpaid].sort((a, b) => a.installmentNumber - b.installmentNumber);
      const nextInst = sorted[0];
      setSelectedInstallmentId(nextInst.id);
      const sugPenalty = calculateSuggestedLateFee(nextInst.date);
      setManualPenalty(String(sugPenalty));
    } else {
      setSelectedInstallmentId('');
      setManualPenalty('0');
    }
  };

  const handleInstallmentChange = (instId: string) => {
    setSelectedInstallmentId(instId);
    const inst = angsuran.find(a => a.id === instId);
    if (inst) {
      const sugPenalty = calculateSuggestedLateFee(inst.date);
      setManualPenalty(String(sugPenalty));
    } else {
      setManualPenalty('0');
    }
  };

  const handleSaveManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      setManualError('Silakan pilih pinjaman anggota terlebih dahulu.');
      return;
    }
    if (!selectedInstallmentId) {
      setManualError('Anggota ini tidak memiliki tagihan aktif yang belum dibayar.');
      return;
    }

    const penaltyVal = Number(manualPenalty) || 0;
    if (penaltyVal < 0) {
      setManualError('Denda penalti tidak boleh bernilai negatif.');
      return;
    }

    payAngsuran(
      selectedInstallmentId,
      penaltyVal,
      currentUser?.name || 'Kasir Loket',
      manualCollector.trim() || '-'
    );

    // After payment, open the receipt modal instantly to print or view!
    const paidItem = angsuran.find(a => a.id === selectedInstallmentId);
    if (paidItem) {
      setReceiptOpen({
        ...paidItem,
        status: 'paid',
        penalty: penaltyVal,
        paymentDate: new Date().toISOString().split('T')[0],
        collectorName: manualCollector.trim() || '-'
      });
    }

    setManualInputModalOpen(false);
    setSelectedLoanId('');
    setSelectedInstallmentId('');
    setManualPenalty('0');
    setManualCollector('');
    setManualError('');
  };

  // Receipt PDF Download wizard
  const handleDownloadPDF = async (arg: AngsuranType) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    // Border Frame
    doc.setDrawColor(20, 80, 50);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 138, 200);

    // Green Header bar
    doc.setFillColor(13, 42, 29);
    doc.rect(5, 5, 138, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FORSDIG SIMPAN PINJAM', 10, 14);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Kuitansi Bukti Pembayaran Angsuran Pembiayaan', 10, 21);

    // Invoice Ref
    doc.setFontSize(8);
    doc.text(`KWITANSI: ANG-PAID-${arg.id.substring(8, 15).toUpperCase()}`, 88, 15);

    doc.setTextColor(50, 50, 50);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KUITANSI PEMBAYARAN ANGSURAN', 10, 42);

    doc.setDrawColor(220, 220, 220);
    doc.line(10, 45, 138, 45);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);

    doc.text('ID Pinjaman Ref', 10, 54);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${arg.loanId}`, 45, 54);

    doc.setFont('Helvetica', 'normal');
    doc.text('Anggota Pembayar', 10, 62);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${arg.memberName} (${arg.memberNumber})`, 45, 62);

    doc.setFont('Helvetica', 'normal');
    doc.text('Angsuran Cicilan Ke', 10, 70);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: #${arg.installmentNumber}`, 45, 70);

    doc.setFont('Helvetica', 'normal');
    doc.text('Tanggal Jatuh Tempo', 10, 78);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${arg.date}`, 45, 78);

    doc.setFont('Helvetica', 'normal');
    doc.text('Tanggal Pembayaran', 10, 86);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${arg.paymentDate || '-'}`, 45, 86);

    doc.setFont('Helvetica', 'normal');
    doc.text('Karyawan Penagih', 10, 94);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${arg.collectorName || '-'}`, 45, 94);

    doc.setDrawColor(220, 220, 220);
    doc.line(10, 100, 138, 100);

    // Breakdown ledger box
    doc.setFont('Helvetica', 'normal');
    doc.text('Rincian Pembayaran:', 10, 106);
    
    doc.text('- Pokok Kredit Tetap', 15, 114);
    doc.text(`Rp ${arg.principal.toLocaleString()}`, 90, 114);

    doc.text('- Margin Jasa Bunga', 15, 122);
    doc.text(`Rp ${arg.interest.toLocaleString()}`, 90, 122);

    doc.text('- Denda Keterlambatan', 15, 130);
    doc.text(`Rp ${(arg.penalty || 0).toLocaleString()}`, 90, 130);

    // Sum total
    doc.setFillColor(242, 245, 242);
    doc.rect(10, 136, 128, 14, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 42, 29);
    doc.text('TOTAL YANG DIBAYAR', 15, 145);
    doc.text(`Rp ${(arg.amount + (arg.penalty || 0)).toLocaleString()}`, 90, 145);

    // Generate QR Code containing verification data
    try {
      const qrText = `KOPERASI FORESYNDO COOP\n` +
                     `ID ANGSURAN: ${arg.id}\n` +
                     `REF PINJAM : ${arg.loanId}\n` +
                     `ANGGOTA    : ${arg.memberName} (${arg.memberNumber})\n` +
                     `CICILAN KE : #${arg.installmentNumber}\n` +
                     `POKOK      : Rp ${arg.principal.toLocaleString()}\n` +
                     `JASA/BUNGA : Rp ${arg.interest.toLocaleString()}\n` +
                     `DENDA      : Rp ${(arg.penalty || 0).toLocaleString()}\n` +
                     `TOTAL BAYAR: Rp ${(arg.amount + (arg.penalty || 0)).toLocaleString()}\n` +
                     `TGL BAYAR  : ${arg.paymentDate || '-'}\n` +
                     `PENAGIH    : ${arg.collectorName || '-'}\n` +
                     `STATUS     : REKOM REKONSILIASI KAS LUNAS`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 62, 163, 24, 24);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 100, 100);
      doc.text('PINDAI VERIFIKASI', 74, 161, { align: 'center' });
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
    }

    // Signatures footer blocks
    doc.setTextColor(80, 80, 80);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    // Left side: User signature
    doc.text('Tanda Tangan Anggota,', 20, 168);
    doc.line(15, 185, 45, 185);
    doc.text(`( ${arg.memberName.split(' ')[0]} )`, 18, 190);

    // Right side: Cashier/Supervisor
    doc.text('Penerima Petugas Koperasi,', 90, 168);
    doc.line(85, 185, 115, 185);
    doc.text(`( ${arg.createdBy || cooperativeSettings?.adminName || 'Bendahara'} )`, 88, 190);

    doc.save(`Kuitansi_Angsuran_Ke_${arg.installmentNumber}_${arg.id}.pdf`);
  };

  const handleDownloadDailyReport = (dateStr: string) => {
    const dailyPayments = angsuran.filter(a => a.status === 'paid' && a.paymentDate === dateStr);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const printW = pageW - (margin * 2);

    // Decorative Header Band (Emerald)
    doc.setFillColor(6, 78, 59); // Emerald-800
    doc.rect(margin, 15, printW, 22, 'F');

    // Accent line (Gold)
    doc.setFillColor(212, 175, 55); // #D4AF37 Gold
    doc.rect(margin, 37, printW, 1.5, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('KOPERASI FORESYNDO COOP', margin + 5, 23);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(220, 245, 230);
    doc.text('Sistem Informasi Keuangan Koperasi Foresyndo Coop Mandiri', margin + 5, 29);
    doc.text(`Dicetak Oleh: ${currentUser?.name || 'Admin'} | Tanggal Cetak: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`, margin + 5, 33);

    // Document Title
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('LAPORAN HARIAN SETORAN PINJAMAN ANGGOTA', margin, 48);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Periode Setoran: ${dateStr}`, margin, 53);

    // Table Header
    let y = 60;
    doc.setFillColor(241, 245, 249); // light grey
    doc.rect(margin, y, printW, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + printW, y);
    doc.line(margin, y + 8, margin + printW, y + 8);

    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);

    // Column Headers position
    // No(8), Anggota(40), ID Kredit(20), Cic(10), Pokok(21), Jasa(21), Denda(16), Total(22), Penagih(22)
    const colX = {
      no: margin + 2,
      anggota: margin + 10,
      id: margin + 50,
      cic: margin + 70,
      pokok: margin + 80,
      jasa: margin + 101,
      denda: margin + 122,
      total: margin + 138,
      penagih: margin + 160
    };

    doc.text('No', colX.no, y + 5.5);
    doc.text('Anggota (No)', colX.anggota, y + 5.5);
    doc.text('Ref Pinjam', colX.id, y + 5.5);
    doc.text('Cic ke', colX.cic, y + 5.5);
    doc.text('Pokok Setor', colX.pokok, y + 5.5);
    doc.text('Margin Jasa', colX.jasa, y + 5.5);
    doc.text('Denda', colX.denda, y + 5.5);
    doc.text('Total', colX.total, y + 5.5);
    doc.text('Kary. Penagih', colX.penagih, y + 5.5);

    let sumPokok = 0;
    let sumJasa = 0;
    let sumDenda = 0;
    let sumTotal = 0;

    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);

    if (dailyPayments.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.text('Tidak ada setoran angsuran dari anggota yang dibayarkan/ditagih pada tanggal ini.', margin + 5, y + 10);
      doc.rect(margin, y, printW, 18);
      y += 18;
    } else {
      dailyPayments.forEach((p, idx) => {
        // Draw row line
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, margin + printW, y);

        doc.setTextColor(51, 65, 85);
        doc.text(String(idx + 1), colX.no, y + 5);
        
        // Members
        doc.setFont('Helvetica', 'bold');
        doc.text(p.memberName, colX.anggota, y + 3.5);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(156, 163, 175);
        doc.text(p.memberNumber, colX.anggota, y + 6);
        doc.setFontSize(7.5);

        doc.setTextColor(51, 65, 85);
        doc.text(p.loanId.substring(0, 8).toUpperCase(), colX.id, y + 5);
        doc.text(`#${p.installmentNumber}`, colX.cic, y + 5);
        
        // Financial columns
        doc.text(`Rp ${p.principal.toLocaleString()}`, colX.pokok, y + 5);
        doc.text(`Rp ${p.interest.toLocaleString()}`, colX.jasa, y + 5);
        doc.text(`Rp ${(p.penalty || 0).toLocaleString()}`, colX.denda, y + 5);
        doc.setFont('Helvetica', 'bold');
        doc.text(`Rp ${(p.amount + (p.penalty || 0)).toLocaleString()}`, colX.total, y + 5);
        doc.setFont('Helvetica', 'normal');

        doc.text(p.collectorName || '-', colX.penagih, y + 5);

        // Accumulators
        sumPokok += p.principal;
        sumJasa += p.interest;
        sumDenda += (p.penalty || 0);
        sumTotal += (p.amount + (p.penalty || 0));

        y += 8;
        
        // Handle page overflow just in case
        if (y > 230) {
          doc.addPage();
          y = 20;
          // Redraw header table row quickly
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, y, printW, 8, 'F');
          doc.setTextColor(51, 65, 85);
          doc.setFont('Helvetica', 'bold');
          doc.text('No', colX.no, y + 5.5);
          doc.text('Anggota(No)', colX.anggota, y + 5.5);
          doc.text('Ref Pinjam', colX.id, y + 5.5);
          doc.text('Cic', colX.cic, y + 5.5);
          doc.text('Pokok Setor', colX.pokok, y + 5.5);
          doc.text('Margin', colX.jasa, y + 5.5);
          doc.text('Denda', colX.denda, y + 5.5);
          doc.text('Total', colX.total, y + 5.5);
          doc.text('Kary. Penagih', colX.penagih, y + 5.5);
          y += 8;
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7.5);
        }
      });

      // Bottom Total Row Accents
      doc.setDrawColor(148, 163, 184);
      doc.line(margin, y, margin + printW, y);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, printW, 8, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.text('TOTAL REKAPITULASI HARIAN', colX.anggota, y + 5);

      doc.text(`Rp ${sumPokok.toLocaleString()}`, colX.pokok, y + 5);
      doc.text(`Rp ${sumJasa.toLocaleString()}`, colX.jasa, y + 5);
      doc.text(`Rp ${sumDenda.toLocaleString()}`, colX.denda, y + 5);
      doc.text(`Rp ${sumTotal.toLocaleString()}`, colX.total, y + 5);
      y += 8;
      doc.line(margin, y, margin + printW, y);
    }

    // —— SPECIAL ADDITION: SPECIAL COLLECTOR RECONCILIATION TABLE ——
    const collectorRecap: { [key: string]: { counts: number; principal: number; interest: number; penalty: number; total: number } } = {};
    dailyPayments.forEach(p => {
      const collector = (p.collectorName && p.collectorName !== '-') ? p.collectorName : 'Kantor Loket Utama';
      if (!collectorRecap[collector]) {
        collectorRecap[collector] = { counts: 0, principal: 0, interest: 0, penalty: 0, total: 0 };
      }
      collectorRecap[collector].counts += 1;
      collectorRecap[collector].principal += p.principal;
      collectorRecap[collector].interest += p.interest;
      collectorRecap[collector].penalty += p.penalty || 0;
      collectorRecap[collector].total += (p.amount + (p.penalty || 0));
    });

    const recapRows = Object.keys(collectorRecap).map(name => ({
      name,
      ...collectorRecap[name]
    }));

    // Calculate vertical height needed for recap sections
    const estimatedHeightRecap = 15 + 8 + (recapRows.length * 8) + 8;
    if (y + estimatedHeightRecap > 230) {
      doc.addPage();
      y = 20;
    } else {
      y += 10; // offset spacing
    }

    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('REKAPITULASI REKONSILIASI PER PETUGAS PENAGIH (SUMMARY)', margin, y);
    y += 5;

    // Table Header
    doc.setFillColor(236, 253, 245); // elegant very light emerald green
    doc.rect(margin, y, printW, 7, 'F');
    doc.setDrawColor(167, 243, 208); // emerald-200 border
    doc.line(margin, y, margin + printW, y);
    doc.line(margin, y + 7, margin + printW, y + 7);

    doc.setTextColor(6, 78, 59); // Emerald-800
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);

    const colSumX = {
      nama: margin + 4,
      jml: margin + 54,
      pokok: margin + 74,
      jasa: margin + 102,
      denda: margin + 130,
      total: margin + 154
    };

    doc.text('Petugas Penagih / Petugas Lapangan', colSumX.nama, y + 4.5);
    doc.text('Total Bukti', colSumX.jml, y + 4.5);
    doc.text('Pokok Disetor', colSumX.pokok, y + 4.5);
    doc.text('Margin Jasa', colSumX.jasa, y + 4.5);
    doc.text('Denda', colSumX.denda, y + 4.5);
    doc.text('Total Penerimaan', colSumX.total, y + 4.5);

    y += 7;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    recapRows.forEach((row) => {
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, margin + printW, y);

      doc.setFont('Helvetica', 'bold');
      doc.text(row.name, colSumX.nama, y + 5);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${row.counts} kuitansi`, colSumX.jml, y + 5);
      doc.text(`Rp ${row.principal.toLocaleString()}`, colSumX.pokok, y + 5);
      doc.text(`Rp ${row.interest.toLocaleString()}`, colSumX.jasa, y + 5);
      doc.text(`Rp ${row.penalty.toLocaleString()}`, colSumX.denda, y + 5);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Rp ${row.total.toLocaleString()}`, colSumX.total, y + 5);
      doc.setFont('Helvetica', 'normal');

      y += 8;
    });

    // Recap Table Footer Row
    doc.setDrawColor(167, 243, 208);
    doc.line(margin, y, margin + printW, y);
    doc.setFillColor(240, 253, 250); // teal-50
    doc.rect(margin, y, printW, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    
    doc.text('TOTAL REKONSILIASI KASIR', colSumX.nama, y + 4.5);
    doc.text(`${dailyPayments.length} kuitansi`, colSumX.jml, y + 4.5);
    doc.text(`Rp ${sumPokok.toLocaleString()}`, colSumX.pokok, y + 4.5);
    doc.text(`Rp ${sumJasa.toLocaleString()}`, colSumX.jasa, y + 4.5);
    doc.text(`Rp ${sumDenda.toLocaleString()}`, colSumX.denda, y + 4.5);
    doc.text(`Rp ${sumTotal.toLocaleString()}`, colSumX.total, y + 4.5);

    y += 7;
    doc.line(margin, y, margin + printW, y);

    // Signatures blocks with ADMIN Stamp
    y += 12;
    if (y > 235) {
       doc.addPage();
       y = 25;
    }

    const colWidth = printW / 2;
    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Mengetahui / Memeriksa,', margin + 15, y);
    doc.text('Ketua Koperasi FORSDIG', margin + 15, y + 5);
    
    doc.text('Dibuat & Disahkan Oleh,', margin + colWidth + 15, y);
    doc.text('Admin Koperasi (Bendahara)', margin + colWidth + 15, y + 5);

    // E-Signature Stamp Box for Admin
    const eSignY = y + 10;
    doc.setDrawColor(212, 175, 55); // gold border
    doc.setLineWidth(0.3);
    doc.setFillColor(254, 252, 243); // light gold/cream fill
    doc.rect(margin + colWidth + 10, eSignY, 55, 18, 'F');
    doc.rect(margin + colWidth + 11, eSignY + 1, 53, 16);
    
    doc.setTextColor(13, 80, 45); // Emerald text inside gold stamp
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('E-SIGNED & VERIFIED BY', margin + colWidth + 13, eSignY + 6);
    
    doc.setTextColor(180, 83, 9); // Amber text
    doc.setFontSize(8);
    doc.text('ADMIN FORSDIG', margin + colWidth + 13, eSignY + 11);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text(`SYSTEM CODE: FORSDIG-SEC-${dateStr}`, margin + colWidth + 13, eSignY + 15);

    // Draw traditional lines
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 15, y + 30, margin + 65, y + 30);
    doc.line(margin + colWidth + 15, y + 30, margin + colWidth + 65, y + 30);

    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`( ${cooperativeSettings?.ketuaName || 'M. Yusuf Syahrial, SE'} )`, margin + 18, y + 34);
    doc.text(`( ${cooperativeSettings?.adminName || currentUser?.name || 'Administrator'} )`, margin + colWidth + 18, y + 34);

    doc.save(`Laporan_Setoran_Harian_${dateStr}.pdf`);
  };

  return (
    <div id="angsuran-view" className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">E-Angsuran & Jadwal Cicilan</h2>
          <p className="text-xs text-slate-500 font-medium">Buku pantauan tagihan rincian cicilan amortisasi pinjaman lengkap dengan denda penalti.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-extrabold px-3 py-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-lg inline-block whitespace-nowrap">
            Denda: Rp 5.000 / Hari
          </span>
          <button
            id="btn-trigger-manual-repayment"
            onClick={() => {
              setManualInputModalOpen(true);
              setManualError('');
              const active = pinjaman.filter(l => l.status === 'disetujui' || l.status === 'menunggak');
              if (active.length > 0) {
                handleLoanChange(active[0].id);
              }
            }}
            className="flex items-center justify-center gap-2 bg-[#0d2a1d] hover:bg-emerald-950 active:scale-95 text-white font-extrabold px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 text-[#D4AF37]" />
            Input Setoran Manual
          </button>
        </div>
      </div>

      {/* LAPORAN SETORAN HARIAN & DOWNLOAD SECTION */}
      <div className="p-5 bg-gradient-to-r from-emerald-900/10 to-teal-900/5 dark:from-emerald-950/20 dark:to-teal-950/15 border border-emerald-800/15 dark:border-emerald-850/30 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 rounded-xl border border-emerald-200/40">
            <FileText className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Laporan Setoran Harian (Export PDF)</h3>
            <p className="text-[11px] text-slate-500 max-w-xl">
              Unduh rincian seluruh setoran cicilan pinjaman harian anggota lengkap dengan nama penagih dan kolom tanda tangan admin untuk pertanggungjawaban fisik.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto md:justify-end shrink-0">
          <div className="flex items-center gap-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold shadow-xs">
            <span className="text-slate-400 font-medium">Tanggal:</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 active:outline-none border-0 p-0 text-xs font-extrabold cursor-pointer"
            />
          </div>
          <button
            id="btn-download-daily-report"
            onClick={() => handleDownloadDailyReport(reportDate)}
            className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#bfa032] active:scale-95 text-emerald-950 font-extrabold px-4 py-2.5 rounded-lg text-xs transition-all shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Download Laporan Harian
          </button>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari denda angsuran berdasarkan nama anggota, nomor, kode ID pinjaman..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
          >
            <option value="all">Semua Kondisi Tagihan</option>
            <option value="unpaid">Belum Dibayar (Unpaid)</option>
            <option value="paid">Lunas Diangsur (Paid)</option>
          </select>
        </div>
      </div>

      {/* AMORTIZATION LISTS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-4">Anggota / Pas</th>
                <th className="py-3.5">Ref Pinjaman</th>
                <th className="py-3.5">Cicilan Ke-</th>
                <th className="py-3.5">Jatuh Tempo</th>
                <th className="py-3.5 text-right">Rincian Pokok / Bunga</th>
                <th className="py-3.5 text-right">Denda Keterlambatan</th>
                <th className="py-3.5 text-right pl-4 pr-4">Total Biaya</th>
                <th className="py-3.5">Penagih</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5 text-center pr-4">Layanan Loket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
              {displayedAngsuran.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-450 text-xs">
                    Belum ada antrean jadwal angsuran pinjaman anggota terdaftar.
                  </td>
                </tr>
              ) : (
                displayedAngsuran.map(item => {
                  const isOverdue = item.status === 'unpaid' && new Date(item.date).getTime() < new Date().getTime();
                  const lateFeeValue = item.status === 'paid' ? (item.penalty || 0) : calculateSuggestedLateFee(item.date);
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-4 pl-4 font-bold text-slate-850 dark:text-slate-100">
                        <p>{item.memberName}</p>
                        <span className="text-[10px] text-amber-500 font-bold">{item.memberNumber}</span>
                      </td>
                      <td className="py-4 font-mono text-slate-500 dark:text-slate-400">{item.loanId.substring(0, 10).toUpperCase()}</td>
                      <td className="py-4 font-extrabold text-indigo-600 dark:text-indigo-400 pl-4">
                        #{item.installmentNumber}
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 inline" />
                          {item.date}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2 text-slate-500">
                        <p className="font-bold text-slate-700 dark:text-slate-350">Rp {item.principal.toLocaleString()}</p>
                        <span className="text-[10px] font-medium text-slate-400">Bunga: Rp {item.interest.toLocaleString()}</span>
                      </td>
                      <td className={`py-4 text-right font-bold pr-2 ${lateFeeValue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-430'}`}>
                        Rp {lateFeeValue.toLocaleString()}
                      </td>
                      <td className="py-4 text-right pr-4 font-black">
                        Rp {(item.amount + lateFeeValue).toLocaleString()}
                      </td>
                      <td className="py-4 font-bold text-slate-705 dark:text-slate-300">
                        {item.status === 'paid' ? (item.collectorName || '-') : <span className="text-slate-400 font-normal">-</span>}
                      </td>
                      <td className="py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          item.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                            : isOverdue
                            ? 'bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-pulse'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                        }`}>
                          {item.status === 'paid' ? 'Lunas' : isOverdue ? 'Terlambat' : 'Belum Bayar'}
                        </span>
                      </td>
                      <td className="py-4 text-center pr-4">
                        {item.status === 'paid' ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              id={`btn-receipt-view-${item.id}`}
                              onClick={() => setReceiptOpen(item)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-200"
                              title="Lihat Kwitansi"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              id={`btn-receipt-print-pdf-${item.id}`}
                              onClick={() => handleDownloadPDF(item)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-2e0/30"
                              title="Download Kwitansi PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          currentUser?.role !== 'anggota' ? (
                            <button
                              id={`btn-pay-installment-${item.id}`}
                              onClick={() => handleOpenPay(item)}
                              className="p-1 px-3 bg-[#0d2a1d] hover:bg-[#153e2b] text-white rounded text-[10px] font-extrabold"
                            >
                              BAYAR CICILAN
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 justify-center">
                              <BadgeAlert className="h-3.5 w-3.5" /> Tagihan
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button
                id="btn-page-prev-angsuran"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-xs font-semibold"
              >
                Kembali
              </button>
              <button
                id="btn-page-next-angsuran"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-xs font-semibold"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* —— POPUP MODAL: PAYMENT ENTRY FORM (KASIR COLECTS CICILAN) —— */}
      <AnimatePresence>
        {payModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <Coins className="h-4.5 w-4.5 text-amber-500" />
                  Konfirmasi Bayar Angsuran
                </h3>
                <button
                  id="btn-close-pay-panel"
                  onClick={() => setPayModalOpen(null)}
                  className="p-1 rounded bg-[#133726] text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorForm && (
                <div className="m-4 p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg animate-fade-in">
                  {errorForm}
                </div>
              )}

              <form onSubmit={handleSavePayment} className="p-5 space-y-4 font-sans text-xs">
                
                {/* Meta details */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <p className="flex justify-between font-medium text-slate-500">Anggota: <strong className="text-slate-850 dark:text-white font-bold">{payModalOpen.memberName}</strong></p>
                  <p className="flex justify-between font-medium text-slate-500">Tagihan Cicilan Ke: <strong className="text-[#0d2a1d] dark:text-amber-400 font-black">#{payModalOpen.installmentNumber}</strong></p>
                  <p className="flex justify-between font-medium text-slate-500">Pokok Kredit: <strong className="text-slate-850 dark:text-white font-bold">Rp {payModalOpen.principal.toLocaleString()}</strong></p>
                  <p className="flex justify-between font-medium text-slate-500">Margin Jasa Bunga: <strong className="text-slate-850 dark:text-white font-bold">Rp {payModalOpen.interest.toLocaleString()}</strong></p>
                  <p className="flex justify-between font-medium text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-1.5 font-bold">Base Cicilan: <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">Rp {payModalOpen.amount.toLocaleString()}</strong></p>
                </div>

                {/* EDITABLE PENALTY FEE (LATE FEE) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Koreksi Denda Penalti Keterlambatan (Rupiah)</label>
                  <input
                    type="number"
                    min={0}
                    value={penalty}
                    onChange={(e) => setPenalty(e.target.value)}
                    placeholder="Sugesti otomatis denda jika ada..."
                    className="w-full px-3 py-2 bg-slate-150 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-red-650"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Denda terlewat dihitung otomatis dari sisa tenggat hari.</span>
                </div>

                {/* DEBT COLLECTOR (KARYAWAN PENAGIH HUTANG) FIELD */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Nama Karyawan Penagih Hutang</label>
                  <div className="flex gap-1.5">
                    <select
                      value={(cooperativeSettings?.collectors || []).some(c => c.name === collectorName) ? collectorName : ""}
                      onChange={(e) => setCollectorName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-750"
                    >
                      <option value="">-- Pilih Penagih Resmi / Tanpa Penagih --</option>
                      {(cooperativeSettings?.collectors || []).map((col) => (
                        <option key={col.id} value={col.name}>
                          [{col.id}] - {col.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                      placeholder="Atau ketik..."
                      className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-750"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Pilih dari daftar petugas resmi atau ketik langsung nama petugas penagih.</span>
                </div>

                {/* FINAL CASH DRAW SCHEME */}
                <div className="p-3.5 bg-emerald-50/40 dark:bg-[#06150e] rounded-xl text-center border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bersih yang Diterima</span>
                  <strong className="text-xl font-black text-emerald-800 dark:text-emerald-400 block mt-1">
                    Rp {(payModalOpen.amount + (Number(penalty) || 0)).toLocaleString()}
                  </strong>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-pay-panel"
                    type="button"
                    onClick={() => setPayModalOpen(null)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-register-payment"
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
                  >
                    <Check className="h-4 w-4" />
                    Posting Pembayaran
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* —— POPUP MODAL: VIEW AMORTIZATION REPAYMENT INV SCREEN —— */}
      <AnimatePresence>
        {receiptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative p-5 space-y-4"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-105">
                <span className="font-extrabold text-[11px] uppercase text-emerald-800 dark:text-emerald-400 tracking-wider">Kuitansi Pembayaran Angsuran</span>
                <button
                  id="btn-close-receipt"
                  onClick={() => setReceiptOpen(null)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5 text-slate-400" />
                </button>
              </div>

              {/* CASH BILL BODY */}
              <div className="p-4 bg-amber-50/20 dark:bg-emerald-950/10 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3 relative overflow-hidden">
                <div className="h-2 w-full bg-[#0d2a1d] absolute top-0 left-0 right-0" />
                
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-slate-400">ANG-PAID-{receiptOpen.id.substring(13, 20).toUpperCase()}</span>
                  <span className="text-[9px] font-bold text-slate-500">Bayar: {receiptOpen.paymentDate}</span>
                </div>

                <div className="space-y-1 text-xs text-slate-750 dark:text-slate-300">
                  <p className="flex justify-between"><span className="text-slate-450 font-medium">Id Pinjaman Ref:</span> <strong className="font-mono">{receiptOpen.loanId}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-450 font-medium">Anggota Pembayar:</span> <strong className="text-slate-800 dark:text-white">{receiptOpen.memberName}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-450 font-medium font-bold text-indigo-700">Angsuran Ke:</span> <strong>#{receiptOpen.installmentNumber}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-450 font-medium">Pokok Angsuran:</span> <strong>Rp {receiptOpen.principal.toLocaleString()}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-450 font-medium">Margin Bunga:</span> <strong>Rp {receiptOpen.interest.toLocaleString()}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-450 font-medium">Beban Penalti:</span> <strong>Rp {(receiptOpen.penalty || 0).toLocaleString()}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-450 font-medium">Karyawan Penagih:</span> <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{receiptOpen.collectorName || '-'}</strong></p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg text-center border border-slate-200/50 dark:border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">Total Dana Disetor</span>
                  <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    Rp {(receiptOpen.amount + (receiptOpen.penalty || 0)).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex gap-2 justify-end text-xs font-bold leading-none">
                <button
                  id="btn-cancel-receipt-view"
                  onClick={() => setReceiptOpen(null)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Tutup
                </button>
                <button
                  id="btn-download-amort-pdf"
                  onClick={() => handleDownloadPDF(receiptOpen)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg flex items-center gap-1 shadow-md shadow-emerald-900/10"
                >
                  <Printer className="h-4 w-4 text-amber-400 inline" />
                  Print / Download PDF
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* —— POPUP MODAL: MANUAL PAYMENT INPUT FORM —— */}
      <AnimatePresence>
        {manualInputModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <Coins className="h-4.5 w-4.5 text-amber-500" />
                  Form Setoran Pinjaman Manual
                </h3>
                <button
                  id="btn-close-manual-pay-panel"
                  onClick={() => setManualInputModalOpen(false)}
                  className="p-1 rounded bg-[#133726] text-slate-300 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {manualError && (
                <div className="m-4 p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-bold rounded-lg animate-fade-in">
                  {manualError}
                </div>
              )}

              <form onSubmit={handleSaveManualPayment} className="p-5 space-y-4 font-sans text-xs">
                {/* 1. SELECT ACTIVE LOAN */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Pilih Rekening Pinjaman Anggota</label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => handleLoanChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="">-- Hubungkan Ke Rekening Pinjaman Aktif --</option>
                    {pinjaman
                      .filter(l => l.status === 'disetujui' || l.status === 'menunggak')
                      .map(loan => (
                        <option key={loan.id} value={loan.id}>
                          {loan.memberName} ({loan.memberNumber}) - {loan.type.toUpperCase().replace('_', ' ')} - Sisa: Rp {loan.remainingBalance.toLocaleString()}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {selectedLoanId && (
                  <>
                    {/* 2. SELECT INSTALLMENT PERIOD SCHEDULE */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Pilih Jadwal Cicilan</label>
                      {angsuran.filter(a => a.loanId === selectedLoanId && a.status === 'unpaid').length > 0 ? (
                        <select
                          value={selectedInstallmentId}
                          onChange={(e) => handleInstallmentChange(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        >
                          {angsuran
                            .filter(a => a.loanId === selectedLoanId && a.status === 'unpaid')
                            .sort((a, b) => a.installmentNumber - b.installmentNumber)
                            .map(inst => (
                              <option key={inst.id} value={inst.id}>
                                Cicilan Ke-#{inst.installmentNumber} (Tempo: {inst.date}) - Rp {inst.amount.toLocaleString()}
                              </option>
                            ))
                          }
                        </select>
                      ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200/40 rounded-lg text-xs font-bold text-center">
                          Tidak ditemukan tagihan cicilan aktif (unpaid) pada pinjaman ini.
                        </div>
                      )}
                    </div>

                    {/* 3. SHOW PRE-FILLED AMOUNTS */}
                    {selectedInstallmentId && (() => {
                      const selectedInst = angsuran.find(a => a.id === selectedInstallmentId);
                      if (!selectedInst) return null;
                      return (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2 border border-slate-100 dark:border-slate-800 animate-fade-in text-[11px]">
                          <div className="flex justify-between font-medium text-slate-500">
                            <span>Pokok Setoran:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Rp {selectedInst.principal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-medium text-slate-500">
                            <span>Margin Jasa Bunga:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Rp {selectedInst.interest.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-850 pt-2 text-[#0d2a1d] dark:text-emerald-400">
                            <span>Base Angsuran Pokok:</span>
                            <span>Rp {selectedInst.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. PENALTY OVERRIDE */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Denda Keterlambatan (Rupiah)</label>
                      <input
                        type="number"
                        min={0}
                        value={manualPenalty}
                        onChange={(e) => setManualPenalty(e.target.value)}
                        placeholder="Masukkan denda penalti jika terlambat..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-red-600 dark:text-red-400"
                      />
                    </div>

                     {/* 5. COLLECTOR/PENAGIH EMP NAME */}
                     <div>
                       <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Nama Karyawan Penagih Hutang</label>
                       <div className="flex gap-1.5 mb-1.5">
                         <select
                           value={(cooperativeSettings?.collectors || []).some(c => c.name === manualCollector) ? manualCollector : ""}
                           onChange={(e) => setManualCollector(e.target.value)}
                           className="flex-1 px-3 py-2 bg-amber-500/5 focus:bg-white dark:bg-[#0c111d] border border-amber-500/20 focus:border-emerald-700 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-100"
                         >
                           <option value="">-- Pilih Penagih Resmi --</option>
                           {(cooperativeSettings?.collectors || []).map((col) => (
                             <option key={col.id} value={col.name}>
                               [{col.id}] - {col.name}
                             </option>
                           ))}
                         </select>
                         <input
                           type="text"
                           value={manualCollector}
                           onChange={(e) => setManualCollector(e.target.value)}
                           required
                           placeholder="Atau ketik..."
                           className="w-1/3 px-3 py-2 bg-amber-500/5 focus:bg-white dark:bg-[#0c111d] border border-amber-500/20 focus:border-emerald-700 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-100"
                         />
                       </div>
                       <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">Wajib dipilih atau diisi untuk pembukuan laporan rekapitulasi harian kasir penagih.</span>
                     </div>

                    {/* 6. REALTIME DISBURSE SUM */}
                    {selectedInstallmentId && (() => {
                      const selectedInst = angsuran.find(a => a.id === selectedInstallmentId);
                      if (!selectedInst) return null;
                      return (
                        <div className="p-3.5 bg-emerald-50/40 dark:bg-[#06150e] rounded-xl text-center border border-emerald-100 dark:border-emerald-950/20">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pembayaran Manual</span>
                          <strong className="text-xl font-black text-emerald-800 dark:text-emerald-400 block mt-1">
                            Rp {(selectedInst.amount + (Number(manualPenalty) || 0)).toLocaleString()}
                          </strong>
                        </div>
                      );
                    })()}
                  </>
                )}

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-manual-pay"
                    type="button"
                    onClick={() => setManualInputModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-register-manual-payment"
                    type="submit"
                    disabled={!selectedInstallmentId}
                    className="disabled:opacity-50 px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/10 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Posting Setoran Manual
                  </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

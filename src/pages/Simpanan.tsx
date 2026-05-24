import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { Simpanan as SimpananType } from '../types';
import { 
  Plus, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Printer, 
  FileText, 
  Check, 
  X,
  Wallet,
  Coins,
  BadgeCent
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

export const Simpanan: React.FC = () => {
  const { 
    anggota, 
    simpanan, 
    addSimpanan, 
    currentUser,
    cooperativeSettings
  } = useCooperative();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pokok' | 'wajib' | 'sukarela'>('all');
  const [mutationFilter, setMutationFilter] = useState<'all' | 'setor' | 'tarik'>('all');
  
  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState<SimpananType | null>(null);

  // Form states
  const [memberId, setMemberId] = useState('');
  const [type, setType] = useState<'pokok' | 'wajib' | 'sukarela'>('sukarela');
  const [mutation, setMutation] = useState<'setor' | 'tarik'>('setor');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errorForm, setErrorForm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Calculators: Aggregate cumulative savings of each member dynamically for display & input guard
  const getMemberBalanceMap = () => {
    const map: Record<string, { pokok: number, wajib: number, sukarela: number, total: number }> = {};
    
    // Set up placeholders
    anggota.forEach(m => {
      map[m.id] = { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
    });

    // Populate balances from savings timeline
    simpanan.forEach(s => {
      if (!map[s.memberId]) {
        map[s.memberId] = { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
      }
      const val = s.mutation === 'setor' ? s.amount : -s.amount;
      map[s.memberId][s.type] += val;
      map[s.memberId].total += val;
    });

    return map;
  };

  const balanceMap = getMemberBalanceMap();

  const filteredSimpanan = simpanan.filter(s => {
    const matchesSearch = s.memberName.toLowerCase().includes(search.toLowerCase()) || 
                          s.memberNumber.toLowerCase().includes(search.toLowerCase()) ||
                          s.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    const matchesMutation = mutationFilter === 'all' || s.mutation === mutationFilter;
    return matchesSearch && matchesType && matchesMutation;
  });

  const totalPages = Math.ceil(filteredSimpanan.length / itemsPerPage);
  const displayedSimpanan = filteredSimpanan.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Auto handle form submit
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !amount || Number(amount) <= 0) {
      setErrorForm('Harap pilih anggota dan tentukan jumlah nominal transaksi valid.');
      return;
    }

    const value = Number(amount);
    const memberObj = anggota.find(m => m.id === memberId);
    if (!memberObj) return;

    // Boundary rules check: Check if pulling money exceeds existing savings caps
    if (mutation === 'tarik') {
      const currentMemberSavings = balanceMap[memberId] || { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
      const currentCategorySavings = currentMemberSavings[type] || 0;
      if (value > currentCategorySavings) {
        setErrorForm(`Penarikan gagal. Saldo Simpanan ${type.toUpperCase()} milik ${memberObj.name} hanya tersisa Rp ${currentCategorySavings.toLocaleString()}`);
        return;
      }
    }

    addSimpanan({
      memberId,
      date: new Date().toISOString().split('T')[0],
      type,
      mutation,
      amount: value,
      description: description || `${mutation === 'setor' ? 'Setoran' : 'Penarikan'} Simpanan ${type}`,
      createdBy: currentUser?.name || 'Kasir Utama'
    });

    setModalOpen(false);
    // Reset Form
    setMemberId('');
    setAmount('');
    setDescription('');
    setErrorForm('');
  };

  // Receipt PDF Download via jsPDF
  const handleDownloadPDF = (trx: SimpananType) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' // A5 voucher slip size is beautiful
    });

    // Outer Border Box
    doc.setDrawColor(20, 80, 50);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 138, 200);

    // Decorative Header
    doc.setFillColor(13, 42, 29);
    doc.rect(5, 5, 138, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('FORSDIG SIMPAN PINJAM', 12, 14);
    
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Tanda Terima Bukti Mutasi Simpanan Koperasi', 12, 21);

    // Dynamic ref
    doc.setFontSize(9);
    doc.text(`NO. REFE: SMP-TX-${trx.id.substring(4, 11).toUpperCase()}`, 90, 15);

    // Invoice Meta rows
    doc.setTextColor(50, 50, 50);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BUKTI MUTASI KAS', 12, 42);

    doc.setDrawColor(220, 220, 220);
    doc.line(12, 45, 136, 45);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    
    // Columns layout
    doc.text('Tanggal Transaksi', 12, 55);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${trx.date}`, 45, 55);

    doc.setFont('Helvetica', 'normal');
    doc.text('Tipe Mutasi Keuangan', 12, 65);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: SIMPANAN ${trx.type.toUpperCase()} (${trx.mutation === 'setor' ? 'SETORAN' : 'PENARIKAN'})`, 45, 65);

    doc.setFont('Helvetica', 'normal');
    doc.text('Nomor Anggota', 12, 75);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${trx.memberNumber}`, 45, 75);

    doc.setFont('Helvetica', 'normal');
    doc.text('Nama Lengkap', 12, 85);
    doc.setFont('Helvetica', 'bold');
    doc.text(`: ${trx.memberName}`, 45, 85);

    doc.setDrawColor(220, 220, 220);
    doc.line(12, 95, 136, 95);

    // Amount box
    doc.setFillColor(245, 245, 240);
    doc.rect(12, 105, 124, 20, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`Jumlah Nominal: Rp ${trx.amount.toLocaleString()}`, 18, 118);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Terbilang', 12, 138);
    doc.setFont('Helvetica', 'italic');
    doc.text(`: Rupiah (${trx.amount.toLocaleString()})`, 45, 138);

    doc.setFont('Helvetica', 'normal');
    doc.text('Catatan', 12, 148);
    doc.text(`: ${trx.description}`, 45, 148);

    // Signature Block
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    // Left side: User signature
    doc.text('Penyetor / Penerima,', 20, 168);
    doc.line(15, 185, 45, 185);
    doc.text(`( ${trx.memberName.split(' ')[0]} )`, 18, 190);

    // Right side: Cashier
    doc.text('Kasir Koperasi,', 90, 168);
    doc.line(85, 185, 115, 185);
    doc.text(`( ${trx.createdBy || cooperativeSettings?.adminName || 'Kasir'} )`, 88, 190);

    doc.save(`Kuitansi_Simpanan_${trx.memberNumber}_${trx.id}.pdf`);
  };

  const getSimpananTypeLabel = (v: string) => {
    switch (v) {
      case 'pokok': return 'Pokok';
      case 'wajib': return 'Wajib';
      case 'sukarela': return 'Sukarela';
      default: return v;
    }
  };

  return (
    <div id="simpanan-view" className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Modul Simpanan Anggota</h2>
          <p className="text-xs text-slate-500 font-medium">Pengumpulan dana modal, iuran bulanan wajib, dan penarikan tabungan fleksibel.</p>
        </div>
        <div>
          {currentUser?.role !== 'anggota' && (
            <button
              id="btn-add-simpanan"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <Plus className="h-4 w-4 text-amber-500" />
              <span>Input Mutasi Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH RIGS AND ADVANCED FILTERS */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama anggota, nomor, deskripsi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="pokok">Simpanan Pokok</option>
            <option value="wajib">Simpanan Wajib</option>
            <option value="sukarela">Simpanan Sukarela</option>
          </select>
          <select
            value={mutationFilter}
            onChange={(e) => { setMutationFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
          >
            <option value="all">Semua Mutasi</option>
            <option value="setor">Setoran (Masuk)</option>
            <option value="tarik">Penarikan (Keluar)</option>
          </select>
        </div>
      </div>

      {/* TIMELINE OF MUTATION HISTORY */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-4">Tanggal</th>
                <th className="py-3.5">Nama Anggota</th>
                <th className="py-3.5">Kategori Simpanan</th>
                <th className="py-3.5">Arah Mutasi</th>
                <th className="py-3.5 text-right">Nominal Suku</th>
                <th className="py-3.5 pl-10 pr-4">Deskripsi / Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
              {displayedSimpanan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-450 text-xs">
                    Belum ada rekaman histori transaksional simpanan koperasi.
                  </td>
                </tr>
              ) : (
                displayedSimpanan.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 pl-4 text-slate-500 dark:text-slate-400">{item.date}</td>
                    <td className="py-3.5">
                      <p className="font-extrabold text-slate-850 dark:text-slate-100">{item.memberName}</p>
                      <p className="text-[10px] text-amber-500 font-bold">{item.memberNumber}</p>
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Simpanan {getSimpananTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.mutation === 'setor'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-red-50 text-red-850 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {item.mutation === 'setor' ? <ArrowDownLeft className="h-3 w-3 inline text-emerald-600" /> : <ArrowUpRight className="h-3 w-3 inline text-red-500" />}
                        {item.mutation === 'setor' ? 'Setoran' : 'Penarikan'}
                      </span>
                    </td>
                    <td className={`py-3.5 text-right font-black ${item.mutation === 'setor' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
                      Rp {item.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-10 pr-4 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-500 dark:text-slate-405 truncate max-w-[200px]" title={item.description}>
                        {item.description}
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          id={`btn-receipt-view-${item.id}`}
                          onClick={() => setReceiptOpen(item)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-200 rounded-lg"
                          title="Lihat Kuitansi Layar"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-receipt-pdf-${item.id}`}
                          onClick={() => handleDownloadPDF(item)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-950"
                          title="Unduh Slip Kuitansi PDF"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button
                id="btn-page-prev-simpanan"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border border-slate-150 rounded text-xs font-semibold"
              >
                Kembali
              </button>
              <button
                id="btn-page-next-simpanan"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border border-slate-150 rounded text-xs font-semibold"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* —— POPUP MODAL: CREATE NEW SAVINGS MUTATION —— */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <Coins className="h-4.5 w-4.5 text-amber-400" />
                  Pencatatan Simpanan Baru
                </h3>
                <button
                  id="btn-close-form"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded bg-[#133726] hover:bg-slate-750 text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorForm && (
                <div className="m-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-350 border border-red-200 dark:border-red-950 text-xs font-bold rounded-lg">
                  {errorForm}
                </div>
              )}

              <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
                
                {/* SELECT REGISTERED MEMBERS WITH BALANCES INDICATORS */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Anggota Koperasi Peminta *</label>
                  <select
                    required
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                  >
                    <option value="">-- Hubungkan Ke Anggota --</option>
                    {anggota.filter(m => m.status === 'active').map(mb => {
                      const curB = balanceMap[mb.id] || { total: 0 };
                      return (
                        <option key={mb.id} value={mb.id}>
                          {mb.name} ({mb.memberNumber}) — Total: Rp {curB.total.toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* CATEGORY POKOK/WAJIB/SUKARELA */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Kategori Simpanan</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      <option value="pokok">Pokok (Modal Awal)</option>
                      <option value="wajib">Wajib (Iuran Bulanan)</option>
                      <option value="sukarela">Sukarela (Tabungan Bebas)</option>
                    </select>
                  </div>

                  {/* DIRMUT: SETOR OR DEPOSIT TARIK */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Jenis Operasi</label>
                    <select
                      value={mutation}
                      onChange={(e) => setMutation(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      <option value="setor">Setoran (Masuk)</option>
                      <option value="tarik">Penarikan (Keluar)</option>
                    </select>
                  </div>
                </div>

                {/* NOMINAL SUKU RUPIAH */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Jumlah Nominal (Rupiah) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-extrabold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      placeholder="Nominal transaksi, misal 500000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* MEMO REMARKS */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Deskripsi Transaksi (Memo)</label>
                  <textarea
                    rows={2}
                    placeholder="Ditulis manual untuk catatan kuitansi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-modal"
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-submit-mutation"
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1 shadow-md shadow-emerald-900/10"
                  >
                    <Check className="h-4 w-4" />
                    Simpan Transaksi
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* —— POPUP EMBEDDED: RECEIPT VOUCHER DIALOG SCREEN —— */}
      <AnimatePresence>
        {receiptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl relative p-5 space-y-4"
            >
              
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-105 dark:border-slate-800">
                <span className="font-extrabold text-[11px] uppercase text-emerald-800 dark:text-emerald-500 tracking-wider">Kuitansi Voucher Digital</span>
                <button
                  id="btn-close-receipt"
                  onClick={() => setReceiptOpen(null)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5 text-slate-400" />
                </button>
              </div>

              {/* Printable Cash Voucher Pass Layout */}
              <div className="p-4 bg-amber-50/20 dark:bg-emerald-950/10 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3.5 relative overflow-hidden">
                <div className="h-2 w-full bg-[#0d2a1d] absolute top-0 left-0 right-0" />
                
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-slate-400">SMP-TX-{receiptOpen.id.substring(4, 9).toUpperCase()}</span>
                  <span className="text-[9px] font-bold text-slate-500">{receiptOpen.date}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-750 dark:text-slate-205">
                  <p className="flex justify-between"><span className="text-slate-400 font-medium">Anggota:</span> <strong className="text-slate-800 dark:text-white">{receiptOpen.memberName}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-400 font-medium">No Pas:</span> <strong className="font-mono">{receiptOpen.memberNumber}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-400 font-medium">Jenis Akun:</span> <strong>Simpanan {getSimpananTypeLabel(receiptOpen.type)}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-400 font-medium">Arah Mutasi:</span> <strong className="font-bold text-amber-500 uppercase">{receiptOpen.mutation === 'setor' ? 'SETORAN MASUK' : 'PENARIKAN KAS'}</strong></p>
                </div>

                <div className="my-2 p-3 bg-white dark:bg-slate-950 rounded-lg text-center border border-slate-200/50 dark:border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-1">Nominal Mutasi</span>
                  <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400">Rp {receiptOpen.amount.toLocaleString()}</strong>
                </div>

                <p className="text-[10px] text-slate-400 italic text-center select-text">"{receiptOpen.description}"</p>
              </div>

              <div className="flex gap-2 justify-end text-xs font-bold leading-none">
                <button
                  id="btn-close-receipt"
                  onClick={() => setReceiptOpen(null)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Tutup
                </button>
                <button
                  id="btn-download-pdf"
                  onClick={() => handleDownloadPDF(receiptOpen)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg flex items-center gap-1 shadow-md shadow-emerald-900/10"
                >
                  <Printer className="h-4 w-4 text-amber-400 inline" />
                  Unduh / Print PDF
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

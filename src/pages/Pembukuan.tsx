import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { 
  BookOpen, 
  PlusCircle, 
  Search, 
  X, 
  Check, 
  ArrowLeftRight, 
  FolderSearch,
  BadgeAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Pembukuan: React.FC = () => {
  const { coa, jurnal, addJurnalManual, currentUser } = useCooperative();
  const [activeTab, setActiveTab] = useState<'coa' | 'jurnal'>('coa');
  const [search, setSearch] = useState('');

  // Manual Journal Entry Voucher state
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // Form states
  const [desc, setDesc] = useState('');
  const [debitCode, setDebitCode] = useState('');
  const [creditCode, setCreditCode] = useState('');
  const [amount, setAmount] = useState('');

  // Filter COA & Journals
  const filteredCOA = coa.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.includes(search) || 
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredJurnal = jurnal.filter(j => 
    j.description.toLowerCase().includes(search.toLowerCase()) || 
    j.accountName.toLowerCase().includes(search.toLowerCase()) || 
    j.accountCode.includes(search)
  );

  const handleCreateManualJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitCode || !creditCode || !amount || Number(amount) <= 0 || !desc) {
      setErrorForm('Harap lengkapi deskripsi, pilih akun debit-kredit, dan isikan nominal bulat.');
      return;
    }
    if (debitCode === creditCode) {
      setErrorForm('Akun Debit dan Kredit tidak boleh sama untuk menjaga keseimbangan neraca.');
      return;
    }

    addJurnalManual({
      date: new Date().toISOString().split('T')[0],
      description: desc,
      debitCode,
      creditCode,
      amount: Number(amount)
    });

    setJournalModalOpen(false);
    // Reset inputs
    setDesc('');
    setDebitCode('');
    setCreditCode('');
    setAmount('');
    setErrorForm('');
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'aset': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'liabilitas': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400';
      case 'ekuitas': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      case 'pendapaten': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'beban': return 'bg-red-100 text-red-850 dark:bg-red-950/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div id="pembukuan-view" className="space-y-6">
      
      {/* MODULE HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Akuntansi & Bagan Jurnal</h2>
          <p className="text-xs text-slate-500 font-medium">Buku Jurnal Umum double-entry otomatis mencatat sirkulasi kas masuk-keluar secara balance.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-[#0c111d] p-1 rounded-xl self-end md:self-auto border border-slate-200 dark:border-slate-800">
          <button
            id="tab-coa"
            onClick={() => { setActiveTab('coa'); setSearch(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'coa' ? 'bg-[#0d2a1d] text-white shadow-sm' : 'text-slate-650 hover:text-slate-850 dark:text-slate-300'}`}
          >
            Bagan Akun (COA)
          </button>
          <button
            id="tab-jurnal"
            onClick={() => { setActiveTab('jurnal'); setSearch(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'jurnal' ? 'bg-[#0d2a1d] text-white shadow-sm' : 'text-slate-650 hover:text-slate-850 dark:text-slate-300'}`}
          >
            Buku Jurnal Umum
          </button>
        </div>
      </div>

      {/* FILTER SEARCH CRITERIA */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'coa' ? "Cari bagan akun berdasarkan sandi akun (misal: 1101), deskripsi..." : "Cari baris jurnal berdasarkan keterangan, nama COA..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-220 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
          />
        </div>
        {activeTab === 'jurnal' && currentUser?.role !== 'anggota' && currentUser?.role !== 'kasir' && (
          <button
            id="btn-journal-manual"
            onClick={() => setJournalModalOpen(true)}
            className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
          >
            <PlusCircle className="h-4 w-4 text-amber-500" />
            <span>Posting Jurnal Manual</span>
          </button>
        )}
      </div>

      {/* RENDER VIEW BLOCKS: 1. CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-220 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 pl-4">Sandi Akun (Code)</th>
                  <th className="py-3.5">Nama Bagan Akun (COA)</th>
                  <th className="py-3.5">Klasifikasi Kategori</th>
                  <th className="py-3.5">Ketentuan Debit/Kredit</th>
                  <th className="py-3.5 text-right pr-4">Saldo Buku Real-time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
                {filteredCOA.map(item => (
                  <tr key={item.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 pl-4 font-black text-[#0d2a1d] dark:text-amber-400 font-mono tracking-wide">{item.code}</td>
                    <td className="py-3.5 font-extrabold text-slate-850 dark:text-slate-100">{item.name}</td>
                    <td className="py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getCategoryTheme(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-450 uppercase">{item.normalBalance}Increase</td>
                    <td className="py-3.5 text-right pr-4 font-black text-slate-900 dark:text-slate-100">
                      Rp {item.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW BLOCKS: 2. GENERAL LEDGER JOURNALS (DOUBLE ENTRY SYSTEM REWIND) */}
      {activeTab === 'jurnal' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 pl-4">Tanggal Jurnal</th>
                  <th className="py-3.5">ID Ref Posting</th>
                  <th className="py-3.5">Nomor & Nama COA</th>
                  <th className="py-3.5 pl-5">Keterangan Penjelasan</th>
                  <th className="py-3.5 text-right">Debit (Masuk)</th>
                  <th className="py-3.5 text-right pr-4">Kredit (Keluar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
                {filteredJurnal.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-450 font-semibold">
                      Belum ditemukan histori transaksi keuangan terposting.
                    </td>
                  </tr>
                ) : (
                  filteredJurnal.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-805/20">
                      <td className="py-3.5 pl-4 text-slate-500 dark:text-slate-400">{item.date}</td>
                      <td className="py-3.5 text-slate-405 font-mono">TX-{item.id.substring(4, 10).toUpperCase()}</td>
                      <td className="py-3.5">
                        <span className="font-mono text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded mr-1.5">{item.accountCode}</span>
                        <strong className="text-slate-800 dark:text-slate-100">{item.accountName}</strong>
                      </td>
                      <td className="py-3.5 pl-5 text-slate-550 dark:text-slate-350">{item.description}</td>
                      <td className="py-3.5 text-right font-black text-emerald-600 dark:text-emerald-450">
                        {item.debit > 0 ? `Rp ${item.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3.5 text-right pr-4 font-black text-red-650 dark:text-red-400">
                        {item.kredit > 0 ? `Rp ${item.kredit.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* —— POPUP MODAL: MAKE MANUAL BOOKKEEPING ENTRY (POSTING JOURNAL VOUCHER SLIP) —— */}
      <AnimatePresence>
        {journalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <ArrowLeftRight className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  Buat Jurnal Ledger Manual
                </h3>
                <button
                  id="btn-close-journal-form"
                  onClick={() => setJournalModalOpen(false)}
                  className="p-1 rounded bg-[#133726] text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorForm && (
                <div className="m-4 p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg leading-snug">
                  {errorForm}
                </div>
              )}

              <form onSubmit={handleCreateManualJournal} className="p-5 space-y-4 font-sans text-xs">
                
                {/* DESCRIPTS */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Keterangan / Deskripsi Transaksi *</label>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Contoh: Pembalian Lampu Kantor / Bayar Transportasi"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* SELECT DEBIT ACCOUNT CODE */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-404 mb-1.5">Debet Akun Yang Bertambah (Debit) *</label>
                  <select
                    required
                    value={debitCode}
                    onChange={(e) => setDebitCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-805 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="">-- Sandi Debet COA --</option>
                    {coa.map(item => (
                      <option key={item.code} value={item.code}>[{item.code}] {item.name}</option>
                    ))}
                  </select>
                </div>

                {/* SELECT CREDIT ACCOUNT CODE */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-404 mb-1.5">Kredit Akun Yang Berkurang / Berubah (Kredit) *</label>
                  <select
                    required
                    value={creditCode}
                    onChange={(e) => setCreditCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-805 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="">-- Sandi Kredit COA --</option>
                    {coa.map(item => (
                      <option key={item.code} value={item.code}>[{item.code}] {item.name}</option>
                    ))}
                  </select>
                </div>

                {/* AMOUNT VALUE NOMINAL BULAT */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Jumlah Nominal Uang (Rupiah) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-extrabold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={100}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nominal rupiah, misal 150000"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-journal-modal"
                    type="button"
                    onClick={() => setJournalModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-submit-manual-journal"
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1 shadow-md shadow-emerald-900/10"
                  >
                    <Check className="h-4 w-4" />
                    Posting Jurnal Buku
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

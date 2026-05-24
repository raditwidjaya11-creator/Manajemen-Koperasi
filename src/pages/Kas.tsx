import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { KasEntry as KasType } from '../types';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  X, 
  Check, 
  Info,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Kas: React.FC = () => {
  const { kas, addKasNonTransactional, currentUser } = useCooperative();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'masuk' | 'keluar'>('all');

  // Input Cash modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  // Form states
  const [type, setType] = useState<'masuk' | 'keluar'>('keluar');
  const [category, setCategory] = useState('listrik'); // listrik, atk, gaji, transport, operasional, hibahan
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Table pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Calculators
  const totalIn = kas.filter(k => k.type === 'masuk').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = kas.filter(k => k.type === 'keluar').reduce((acc, curr) => acc + curr.amount, 0);
  const netOperatingCash = totalIn - totalOut;

  const filteredKas = kas.filter(k => 
    k.description.toLowerCase().includes(search.toLowerCase()) || 
    k.category.toLowerCase().includes(search.toLowerCase()) ||
    k.createdBy.toLowerCase().includes(search.toLowerCase())
  ).filter(k => typeFilter === 'all' || k.type === typeFilter);

  const totalPages = Math.ceil(filteredKas.length / itemsPerPage);
  const displayedKas = filteredKas.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSaveCashEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description) {
      setErrorForm('Harap lengkapi semua deskripsi memo, kategori, dan nominal pengeluaran kas.');
      return;
    }

    addKasNonTransactional({
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      amount: Number(amount),
      description,
      createdBy: currentUser?.name || 'Bendahara Kas'
    });

    setModalOpen(false);
    // Reset inputs
    setAmount('');
    setDescription('');
    setErrorForm('');
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'listrik': return 'Beban Listrik & Air';
      case 'atk': return 'ATK & Kantor';
      case 'gaji': return 'Gaji Pokok Staff';
      case 'transport': return 'Beban Transportasi';
      case 'operasional': return 'Beban Operasional Lain';
      case 'hibahan': return 'Sponsor / Hibahan Masuk';
      default: return cat;
    }
  };

  return (
    <div id="kas-view" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Buku Kas & Biaya Operasional</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Pencatatan kas masuk & keluar non-transaksional anggota (misal: listrik, ATK, operasional).</p>
        </div>
        <div>
          {currentUser?.role !== 'anggota' && currentUser?.role !== 'kasir' && (
            <button
              id="btn-add-kas-voucher"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <Plus className="h-4 w-4 text-amber-500" />
              <span>Input Arus Kas Non-Anggota</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK CASH METRIC DECK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* METRIC 1: SUMMARY IN */}
        <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Total Kas Masuk Terpakar</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">Rp {totalIn.toLocaleString()}</h4>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* METRIC 2: SUMMARY OUT */}
        <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Total Kas Keluar Operasional</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">Rp {totalOut.toLocaleString()}</h4>
          </div>
          <div className="p-2.5 bg-red-50 dark:bg-red-955/20 text-red-600 rounded-lg">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        {/* METRIC 3: NET RUNS */}
        <div className="p-4 bg-emerald-950 text-white rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-300">Net Operasi Kas Bersih</span>
            <h4 className="text-xl font-black text-amber-400 mt-1">Rp {netOperatingCash.toLocaleString()}</h4>
          </div>
          <div className="p-2.5 bg-emerald-900 text-amber-500 rounded-lg">
            <Coins className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari voucher kas non-anggota berdasarkan memo penjelasan, penginput..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-220 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:outline-none"
          >
            <option value="all">Semua Aliran Kas</option>
            <option value="masuk">Kas Masuk (Inflow)</option>
            <option value="keluar">Kas Keluar (Expenses)</option>
          </select>
        </div>
      </div>

      {/* OPERATIONS HISTORY TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-4">Tanggal Jurnal</th>
                <th className="py-3.5">ID Ref Aliran</th>
                <th className="py-3.5">Kategori Beban</th>
                <th className="py-3.5">Jenis Aliran</th>
                <th className="py-3.5 pl-5">Memo Keterangan Penggunaan</th>
                <th className="py-3.5 text-right">Nominal Jurnal</th>
                <th className="py-3.5 text-center pr-4">Otorisator Buku</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
              {displayedKas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-450 text-xs">
                    Belum ada bukti rekaman mutasi arus kas non-transaksional.
                  </td>
                </tr>
              ) : (
                displayedKas.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 pl-4 text-slate-550 dark:text-slate-400">{item.date}</td>
                    <td className="py-3.5 font-mono text-slate-450">OP-TX-{item.id.substring(4, 9).toUpperCase()}</td>
                    <td className="py-3.5 text-slate-800 dark:text-slate-200 font-bold">{getCategoryLabel(item.category)}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        item.type === 'masuk'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100'
                          : 'bg-red-50 text-red-800 dark:bg-red-955/20 dark:text-red-400 border border-red-100'
                      }`}>
                        {item.type === 'masuk' ? <ArrowDownLeft className="h-3 w-3 inline text-emerald-650" /> : <ArrowUpRight className="h-3 w-3 inline text-red-600" />}
                        {item.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-5 text-slate-550 dark:text-slate-355 text-[11px] truncate max-w-[240px]" title={item.description}>{item.description}</td>
                    <td className={`py-3.5 text-right font-black ${item.type === 'masuk' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
                      Rp {item.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 text-center pr-4 font-bold text-slate-400">{item.createdBy.split(' ')[0]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button
                id="btn-page-prev-kas"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-xs font-semibold"
              >
                Kembali
              </button>
              <button
                id="btn-page-next-kas"
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

      {/* —— POPUP MODAL: ENTER NON-TRANSACTIONAL INFLOW/EXPENSES —— */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <DollarSign className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                  Ralat Pengeluaran / Pemasukan Kas
                </h3>
                <button
                  id="btn-close-kas-form"
                  onClick={() => setModalOpen(false)}
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

              <form onSubmit={handleSaveCashEntry} className="p-5 space-y-4 font-sans text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  {/* DIR */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Arah Aliran Kas</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      <option value="keluar">Keluar (Pengeluaran)</option>
                      <option value="masuk">Masuk (Pemasukan)</option>
                    </select>
                  </div>

                  {/* KATEGORI */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-404 mb-1.5">Kategori Voucher</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      {type === 'keluar' ? (
                        <>
                          <option value="listrik">Listrik & Air Kantor</option>
                          <option value="atk">Alat Tulis Kantor (ATK)</option>
                          <option value="gaji">Gaji / Honor Pengurus</option>
                          <option value="transport">Beban Transportasi</option>
                          <option value="operasional">Beban Operasional Lain</option>
                        </>
                      ) : (
                        <>
                          <option value="hibahan">Sponsor / Dana Hibah</option>
                          <option value="operasional">Penerimaan Non-Operasional</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* NOMINAL MASUK */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Jumlah Nominal (Rupiah) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-extrabold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={500}
                      placeholder="Masukkan nominal angka bulat"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {/* MEMO DESCRIPTION */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Deskripsi Detail Memo *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Contoh: Pembayaran Token Listrik bulan Mei 2026 untuk gedung Koperasi."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-slate-900 rounded-lg text-[10px] text-slate-450 flex items-start gap-1.5 leading-snug">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Entri kas non-transaksional ini secara otomatis mendelegasikan entri double-entry pada akun beban/pendapatan di Jurnal Umum.</span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-kas-form"
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-submit-kas"
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1 shadow-md shadow-emerald-900/10"
                  >
                    <Check className="h-4 w-4" />
                    Posting Kas
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

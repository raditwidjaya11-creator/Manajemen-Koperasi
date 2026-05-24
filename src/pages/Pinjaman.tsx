import React, { useState, useEffect } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { Pinjaman as PinjamanType } from '../types';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  HandCoins, 
  FileText, 
  Calculator, 
  TrendingUp, 
  AlertTriangle,
  Upload,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Pinjaman: React.FC = () => {
  const { 
    anggota, 
    pinjaman, 
    applyPinjaman, 
    approvePinjaman, 
    rejectPinjaman, 
    currentUser 
  } = useCooperative();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'disetujui' | 'lunas' | 'menunggak' | 'ditolak'>('all');
  
  // Custom Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  
  // Form application
  const [memberId, setMemberId] = useState('');
  const [type, setType] = useState<'pendidikan' | 'modal_usaha' | 'konsumtif' | 'darurat'>('modal_usaha');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('12'); // e.g. 12% yearly
  const [tenor, setTenor] = useState('12'); // months
  const [purpose, setPurpose] = useState('');
  const [guaranteeName, setGuaranteeName] = useState('');
  const [installmentFrequency, setInstallmentFrequency] = useState<'monthly' | 'daily'>('monthly');
  const [errorForm, setErrorForm] = useState('');

  // Tables pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const filteredPinjaman = pinjaman.filter(l => {
    const matchesSearch = l.memberName.toLowerCase().includes(search.toLowerCase()) || 
                          l.memberNumber.toLowerCase().includes(search.toLowerCase()) || 
                          l.guaranteeName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPinjaman.length / itemsPerPage);
  const displayedPinjaman = filteredPinjaman.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Quick simulation calculation on type
  const calculateSimulationValues = (amtVal: number, intrVal: number, tnrVal: number, freqVal: 'monthly' | 'daily' = 'monthly') => {
    const isDaily = freqVal === 'daily';
    const divisor = isDaily ? 360 : 12;
    const principal = amtVal / tnrVal;
    const interestRateCalc = (intrVal / 100) / divisor;
    const interest = amtVal * interestRateCalc;
    const installment = Math.round(principal + interest);
    const totalRepayment = installment * tnrVal;

    return {
      principal: Math.round(principal),
      interest: Math.round(interest),
      installment,
      total: totalRepayment
    };
  };

  const simVal = calculateSimulationValues(
    Number(amount) || 5000000, 
    Number(interestRate) || 12, 
    Number(tenor) || 12,
    installmentFrequency
  );

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !amount || !guaranteeName) {
      setErrorForm('Harap pilih anggota, jumlah pinjaman, dan nama jaminan *');
      return;
    }

    applyPinjaman({
      memberId,
      date: new Date().toISOString().split('T')[0],
      type,
      amount: Number(amount),
      interestRate: Number(interestRate),
      tenor: Number(tenor),
      purpose: purpose || 'Modal kerja koperasi',
      guaranteeName,
      guaranteeFile: 'jaminan_dokumen_upload.pdf',
      installmentFrequency
    });

    setModalOpen(false);
    // Reset Form
    setMemberId('');
    setAmount('');
    setPurpose('');
    setGuaranteeName('');
    setInstallmentFrequency('monthly');
    setErrorForm('');
  };

  const isCommitteeMember = currentUser?.role === 'super_admin' || 
                            currentUser?.role === 'bendahara' || 
                            currentUser?.role === 'admin';

  return (
    <div id="pinjaman-view" className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight font-sans">Kredit & Pinjaman Anggota</h2>
          <p className="text-xs text-slate-500 font-medium">Pengajuan kredit usaha dan kebutuhan personal terjangkau dengan denda fleksibel.</p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            id="btn-open-sim"
            onClick={() => setSimulationOpen(true)}
            className="px-4 py-2.5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Calculator className="h-4 w-4 text-emerald-600" />
            <span>Kalkulator Simulasi</span>
          </button>
          
          {currentUser?.role !== 'anggota' && (
            <button
              id="btn-apply-pinjaman"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-white rounded-lg text-xs font-bold hover:scale-[1.01] transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <Plus className="h-4 w-4 text-amber-500" />
              <span>Pengajuan Kredit</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER SEARCH TOOLS */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pinjaman berdasarkan nama anggota, no anggota, nama jaminan barang..."
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
            <option value="all">Semua Status Pinjaman</option>
            <option value="pending">Review (Pending)</option>
            <option value="disetujui">Cicilan Aktif (Disetujui)</option>
            <option value="lunas">Selesai (Lunas)</option>
            <option value="menunggak">Bandel (Menunggak)</option>
            <option value="ditolak">Batal (Ditolak)</option>
          </select>
        </div>
      </div>

      {/* DETAILED LOANS LIST TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-4">Pengaju / Kode</th>
                <th className="py-3.5">Kategori</th>
                <th className="py-3.5">Besaran Kredit</th>
                <th className="py-3.5">Bunga & Tenor</th>
                <th className="py-3.5">Cicilan per Bulan</th>
                <th className="py-3.5">Aset Jaminan</th>
                <th className="py-3.5">Sisa Hutang</th>
                <th className="py-3.5">Kondisi</th>
                <th className="py-3.5 text-center pr-4">Review Panitia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
              {displayedPinjaman.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-450 text-xs">
                    Belum ditemukan histori pengajuan pinjaman kredit anggota.
                  </td>
                </tr>
              ) : (
                displayedPinjaman.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 pl-4">
                      <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{item.memberName}</p>
                      <span className="text-[10px] text-slate-400 font-mono block">ID: {item.id.substring(3, 10).toUpperCase()}</span>
                    </td>
                    <td className="py-4 text-emerald-800 dark:text-emerald-400 capitalize font-bold leading-none">
                      {item.type.replace('_', ' ')}
                    </td>
                    <td className="py-4 font-black">
                      Rp {item.amount.toLocaleString()}
                    </td>
                    <td className="py-4 text-slate-550 dark:text-slate-350">
                      <span className="font-bold text-amber-500">{item.interestRate}% Flat</span>
                      <span className="block text-[10px] font-semibold text-slate-400">{item.tenor} {item.installmentFrequency === 'daily' ? 'Hari' : 'Bulan'} tenor</span>
                    </td>
                    <td className="py-4 font-bold text-slate-900 dark:text-slate-105">
                      Rp {item.monthlyInstallment.toLocaleString()} / {item.installmentFrequency === 'daily' ? 'Hari' : 'Bln'}
                    </td>
                    <td className="py-4 font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={item.guaranteeName}>
                      {item.guaranteeName}
                    </td>
                    <td className="py-4 font-extrabold text-red-600 dark:text-red-400">
                      Rp {item.remainingBalance.toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        item.status === 'pending'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border border-slate-200'
                          : item.status === 'disetujui'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                          : item.status === 'lunas'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100'
                          : item.status === 'menunggak'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 animate-pulse'
                          : 'bg-zinc-150 text-zinc-600'
                      }`}>
                        {item.status === 'disetujui' ? 'Cicilan' : item.status}
                      </span>
                    </td>
                    <td className="py-4 text-center pr-4">
                      {item.status === 'pending' ? (
                        isCommitteeMember ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              id={`btn-approve-${item.id}`}
                              onClick={() => approvePinjaman(item.id, currentUser?.name || 'Committee')}
                              className="p-1 px-2.5 bg-emerald-700 hover:bg-emerald-850 text-white rounded text-[10px] font-extrabold shadow-sm hover:cursor-pointer transition-all"
                              title="Setujui / Cairkan Pinjaman Sekarang"
                            >
                              SETUJUI
                            </button>
                            <button
                              id={`btn-reject-${item.id}`}
                              onClick={() => rejectPinjaman(item.id)}
                              className="p-1 px-2 text-red-605 hover:bg-red-900 hover:text-white rounded text-[10px] font-semibold border border-red-500/20"
                            >
                              TOLAK
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold italic">Menunggu Review</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[90px] block" title={`Oleh: ${item.approvedBy || '-'}`}>
                          {item.approvedBy ? `${item.approvedBy.split(' ')[0]}` : '-'}
                        </span>
                      )}
                    </td>
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
                id="btn-page-prev-pinjaman"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-xs font-semibold"
              >
                Kembali
              </button>
              <button
                id="btn-page-next-pinjaman"
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

      {/* —— POPUP MODAL: SUBMIT NEW LOAN APPLICATION —— */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <HandCoins className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                  Membuka Pengajuan Kredit Baru
                </h3>
                <button
                  id="btn-close-loan-form"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded bg-[#133726]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorForm && (
                <div className="m-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-950 text-xs font-bold rounded-lg">
                  {errorForm}
                </div>
              )}

              <form onSubmit={handleApply} className="p-5 grid grid-cols-2 gap-4">
                
                {/* MEMBER SELECT */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Anggota Pengusul *</label>
                  <select
                    required
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                  >
                    <option value="">-- Hubungkan Ke Anggota Aktif --</option>
                    {anggota.filter(m => m.status === 'active').map(mb => (
                      <option key={mb.id} value={mb.id}>{mb.name} ({mb.memberNumber})</option>
                    ))}
                  </select>
                </div>

                {/* LIMIT NOMINAL & CATEGORY */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Kategori Pinjaman</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                  >
                    <option value="modal_usaha">Modal Usaha (Ekspansi)</option>
                    <option value="darurat">Keperluan Darurat (Kesehatan)</option>
                    <option value="pendidikan">Dana Pendidikan / Kuliah</option>
                    <option value="konsumtif">Kredit Barang Konsumtif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Besaran Pinjaman (Rupiah) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-extrabold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={100000}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nominal pinjaman"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {/* SIKLUS FREKUENSI CICILAN */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Skema Frekuensi Cicilan</label>
                  <select
                    value={installmentFrequency}
                    onChange={(e) => {
                      const val = e.target.value as 'monthly' | 'daily';
                      setInstallmentFrequency(val);
                      setTenor(val === 'daily' ? '30' : '12');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-400"
                  >
                    <option value="monthly">Siklus Bulanan (Standar Pembukuan)</option>
                    <option value="daily">Siklus Harian (Cicilan Harian Lapangan)</option>
                  </select>
                </div>

                {/* RATE INTERESTS & TENOR */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Bunga Jasa (% per Tahun)</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="Bunga Flat Tahunan (e.g. 12)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Tenor Pembayaran ({installmentFrequency === 'daily' ? 'Hari' : 'Bulan'})</label>
                  <select
                    value={tenor}
                    onChange={(e) => setTenor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                  >
                    {installmentFrequency === 'daily' ? (
                      <>
                        <option value="7">7 Hari (1 Minggu)</option>
                        <option value="14">14 Hari (2 Minggu)</option>
                        <option value="30">30 Hari (1 Bulan)</option>
                        <option value="60">60 Hari (2 Bulan)</option>
                        <option value="90">90 Hari (3 Bulan)</option>
                      </>
                    ) : (
                      <>
                        <option value="3">3 Bulan</option>
                        <option value="6">6 Bulan</option>
                        <option value="12">12 Bulan (1 Tahun)</option>
                        <option value="24">24 Bulan (2 Tahun)</option>
                        <option value="36">36 Bulan (3 Tahun)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* GUARANTEE DECS */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Aset Jaminan Penentu (Collateral) *</label>
                  <input
                    type="text"
                    required
                    value={guaranteeName}
                    onChange={(e) => setGuaranteeName(e.target.value)}
                    placeholder="Contoh: BPKB Mobil Toyota Avanza / Sertifikat Tanah No. 901"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium"
                  />
                </div>

                {/* MEMO PURPOSE & SIMULATION SNIPPED */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Tujuan Penggunaan Dana</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Mengapa meminjam dana koperasi?"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium"
                  />
                </div>

                {/* LIVE SIMULATION CARD SNIPPED */}
                <div className="col-span-2 bg-[#FAF8F5] dark:bg-slate-900 p-4 border border-amber-200/50 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-455 block">Simulasi Amortisasi Cicilan {installmentFrequency === 'daily' ? 'Harian' : 'Bulanan'}</span>
                  <div className="grid grid-cols-3 gap-2 mt-2.5 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-medium">Pokok Angsuran</span>
                      <strong className="text-slate-800 dark:text-white">Rp {simVal.principal.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-medium">Bunga Flat</span>
                      <strong className="text-slate-800 dark:text-white">Rp {simVal.interest.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-600 block uppercase font-bold">Total Cicilan / {installmentFrequency === 'daily' ? 'Hari' : 'Bln'}</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">Rp {simVal.installment.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-apply-modal"
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-apply-submit"
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1 shadow-md shadow-emerald-900/10"
                  >
                    <Check className="h-4 w-4" />
                    Simpan Pengajuan
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* —— SIMULATION OVERLAY DRAWER (STANDALONE CALCULATOR) —— */}
      <AnimatePresence>
        {simulationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <div className="px-5 py-4 bg-emerald-950 text-white flex justify-between items-center border-b border-emerald-900">
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Calculator className="h-4.5 w-4.5 text-white" />
                  Kalkulator Simulasi Kredit
                </h3>
                <button
                  id="btn-close-sim-panel"
                  onClick={() => setSimulationOpen(false)}
                  className="p-1 rounded bg-[#103723]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Nominal Pinjaman (Rupiah)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 10000000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold"
                  />
                </div>
                
                {/* FREKUENSI SELECTOR FOR STANDALONE CALCULATOR */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Skema Frekuensi Cicilan</label>
                  <select
                    value={installmentFrequency}
                    onChange={(e) => {
                      const val = e.target.value as 'monthly' | 'daily';
                      setInstallmentFrequency(val);
                      setTenor(val === 'daily' ? '30' : '12');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-400"
                  >
                    <option value="monthly">Siklus Bulanan (Standar Pembukuan)</option>
                    <option value="daily">Siklus Harian (Cicilan Harian Lapangan)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Jasa Bunga (% Flat)</label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold text-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Tenor ({installmentFrequency === 'daily' ? 'Hari' : 'Bulan'})</label>
                    <input
                      type="number"
                      value={tenor}
                      onChange={(e) => setTenor(e.target.value)}
                      placeholder={installmentFrequency === 'daily' ? 'Hari' : 'Months'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {/* RESULT SCHEME */}
                <div className="p-4 bg-amber-50/50 dark:bg-emerald-950/15 border border-amber-250 dark:border-slate-850 rounded-xl space-y-3 font-sans">
                  <h4 className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 inline text-emerald-600" />
                    Rincian Beban Pembayaran
                  </h4>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-450">Pokok Cicilan {installmentFrequency === 'daily' ? 'Harian' : 'Bulanan'}:</span>
                      <strong className="text-slate-850 dark:text-slate-200">Rp {simVal.principal.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Beban Bunga {installmentFrequency === 'daily' ? 'Harian' : 'Bulanan'}:</span>
                      <strong className="text-slate-850 dark:text-slate-200">Rp {simVal.interest.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/50 pt-2 text-sm">
                      <span className="text-slate-800 dark:text-slate-300 font-bold">Total Cicilan / {installmentFrequency === 'daily' ? 'Hari' : 'Bulan'}:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-black">Rp {simVal.installment.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-200/50 pt-2 text-[11px] text-slate-400">
                      <span>Total Biaya Pengembalian:</span>
                      <span>Rp {simVal.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-slate-400 flex items-start gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 inline mt-0.5" />
                    <span>Perhitungan menggunakan bunga flat-interest standar koperasi per {installmentFrequency === 'daily' ? 'hari' : 'bulan'}. Silakan simpan kuitansi real untuk cicilan denda keterlambatan denda.</span>
                  </p>
                </div>

                <div className="flex gap-2 justify-end text-xs font-bold mt-4 pt-4 border-t border-slate-100">
                  <button
                    id="btn-close-sim-panel-sub"
                    onClick={() => setSimulationOpen(false)}
                    className="px-4 py-2.5 bg-emerald-750 hover:bg-emerald-850 text-white rounded-lg w-full text-center font-sans"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

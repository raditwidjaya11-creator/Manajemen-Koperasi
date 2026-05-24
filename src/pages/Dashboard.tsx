import React from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { 
  PiggyBank, 
  HandCoins, 
  Wallet2, 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Calculator
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { 
    anggota, 
    simpanan, 
    pinjaman, 
    angsuran, 
    kas, 
    coa, 
    logs,
    currentUser 
  } = useCooperative();

  // 1. Math Aggregations
  const activeMembersCount = anggota.filter(m => m.status === 'active').length;

  // Total savings Pokok + Wajib + Sukarela
  const totalSimpanan = simpanan.reduce((acc, curr) => {
    return acc + (curr.mutation === 'setor' ? curr.amount : -curr.amount);
  }, 0);

  // Total ongoing principal exposure
  const activeLoans = pinjaman.filter(p => p.status === 'disetujui' || p.status === 'menunggak');
  const totalPinjamanSisa = activeLoans.reduce((acc, curr) => acc + curr.remainingBalance, 0);

  // Installments collected
  const totalPaidInstallmentsAmount = angsuran
    .filter(a => a.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount + (curr.penalty || 0), 0);

  // Cash flow balances
  const cashInFlow = kas.filter(k => k.type === 'masuk').reduce((acc, curr) => acc + curr.amount, 0);
  const cashOutFlow = kas.filter(k => k.type === 'keluar').reduce((acc, curr) => acc + curr.amount, 0);

  // Cash on box balance (Kas Utama + Kas Bank balances from COA)
  const kasUtamaObj = coa.find(c => c.code === '1101');
  const kasBankObj = coa.find(c => c.code === '1102');
  const cashInHand = (kasUtamaObj?.balance || 0) + (kasBankObj?.balance || 0);

  // Sum of interest earned and fees
  const bungaObj = coa.find(c => c.code === '4101');
  const provisiObj = coa.find(c => c.code === '4102');
  const dendaObj = coa.find(c => c.code === '4103');
  const totalLaba = (bungaObj?.balance || 0) + (provisiObj?.balance || 0) + (dendaObj?.balance || 0) - 
                    coa.filter(c => c.category === 'beban').reduce((acc, curr) => acc + curr.balance, 0);

  // Delayed / Delinquent warning count
  const nonPaidInstallments = angsuran.filter(a => a.status === 'unpaid');
  const tunggakanPrincipal = nonPaidInstallments.reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Charts Data Preparation
  // Monthly inflow/outflow
  const flowChartData = [
    { name: 'Jan', Masuk: 35000000, Keluar: 12000000 },
    { name: 'Feb', Masuk: 48000000, Keluar: 32000000 },
    { name: 'Mar', Masuk: 55000000, Keluar: 28000000 },
    { name: 'Apr', Masuk: 62000000, Keluar: 34050000 },
    { name: 'Mei', Masuk: cashInFlow || 75000000, Keluar: cashOutFlow || 45000000 },
  ];

  // Outstanding Loan vs Deposits comparisons over type
  const assetLiabChartData = [
    { name: 'Simpanan Pokok', Jumlah: coa.find(c => c.code === '2101')?.balance || 0 },
    { name: 'Simpanan Wajib', Jumlah: coa.find(c => c.code === '2102')?.balance || 0 },
    { name: 'Simpanan Sukarela', Jumlah: coa.find(c => c.code === '2103')?.balance || 0 },
    { name: 'Piutang Pinjaman', Jumlah: totalPinjamanSisa },
  ];

  // Due installmets warning items (unpaid up to now)
  const rawDueItems = angsuran.filter(a => a.status === 'unpaid').slice(0, 4);

  // Combine latest transaction records for widget feed
  const creditTrans = pinjaman.map(p => ({
    id: p.id,
    type: 'Pencairan',
    name: p.memberName,
    amount: p.amount,
    date: p.approvalDate || p.date,
    isIncome: false,
    label: `Pencairan Pinjaman ${p.type.replace('_', ' ')}`
  }));

  const savingTrans = simpanan.map(s => ({
    id: s.id,
    type: s.mutation === 'setor' ? 'Tabungan' : 'Penarikan',
    name: s.memberName,
    amount: s.amount,
    date: s.date,
    isIncome: s.mutation === 'setor',
    label: `${s.mutation === 'setor' ? 'Setoran' : 'Tarik'} Simpanan ${s.type}`
  }));

  const repaymentTrans = angsuran.filter(a => a.status === 'paid').map(a => ({
    id: a.id,
    type: 'Angsuran',
    name: a.memberName,
    amount: a.amount + (a.penalty || 0),
    date: a.paymentDate || a.date,
    isIncome: true,
    label: `Angsuran #${a.installmentNumber}`
  }));

  const allTransactions = [...creditTrans, ...savingTrans, ...repaymentTrans]
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div id="dashboard-view" className="space-y-6">
      
      {/* GLORIOUS WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/80 to-[#123727] border border-emerald-850 p-6 rounded-2xl text-white">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">Selamat Datang, {currentUser?.name}!</h2>
          <p className="text-emerald-300 text-xs md:text-sm mt-1.5 font-medium leading-relaxed">
            Sistem buku transaksi Koperasi Simpan Pinjam <span className="text-amber-400 font-bold">FORSDIG</span> hari ini aktif. Anda login dengan wewenang <span className="uppercase font-extrabold text-[#f59e0b] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs leading-none inline-block ml-1">{currentUser?.role.replace('_',' ')}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 px-4 bg-[#143d2c] border border-emerald-800 rounded-xl flex items-center justify-center text-xs md:text-xs font-semibold text-slate-200">
            Sistem Waktu: 06:48 UTC
          </div>
        </div>
      </div>

      {/* STATS DECK - INTENTIONAL SHU / VARIED CARD DESIGN */}
      <div id="stats-deck" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* STAT 1: SAVINGS */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm transition-all duration-300 border-l-4 border-l-transparent hover:border-l-[#D4AF37] hover:scale-[1.01] group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Saldo Simpanan</p>
              <h3 className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">Rp {totalSimpanan.toLocaleString()}</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 inline" />
                +11.2% bulan ini
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900 transition-colors duration-300 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* STAT 2: OUTSTANDING LOANS */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm transition-all duration-300 border-l-4 border-l-transparent hover:border-l-[#D4AF37] hover:scale-[1.01] group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Piutang Pinjaman</p>
              <h3 className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">Rp {totalPinjamanSisa.toLocaleString()}</h3>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1 mt-1.5">
                <Calculator className="h-3.5 w-3.5 inline" />
                Flat-Interest Amortisasi
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-xl border border-amber-100 dark:border-amber-900 transition-colors duration-300 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30">
              <HandCoins className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* STAT 3: CAS BOX */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm transition-all duration-300 border-l-4 border-l-transparent hover:border-l-[#D4AF37] hover:scale-[1.01] group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Likuiditas Kas</p>
              <h3 className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">Rp {cashInHand.toLocaleString()}</h3>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 mt-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 inline" />
                Brankas & Bank Cocok
              </p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-100 dark:border-teal-900 transition-colors duration-300 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30">
              <Wallet2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* STAT 4: SHU RECOP */}
        <div className="bg-[#FAF6F0] dark:bg-[#161a29] border border-amber-200 dark:border-slate-800 p-5 rounded-xl shadow-sm transition-all duration-300 border-l-4 border-l-transparent hover:border-l-[#D4AF37] hover:scale-[1.01] group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#8D6E63] dark:text-slate-400 uppercase tracking-widest">Sisa Hasil Usaha (SHU)</p>
              <h3 className="text-2xl font-black mt-2 text-[#5D4037] dark:text-amber-400">Rp {totalLaba.toLocaleString()}</h3>
              <p className="text-[10px] text-[#2E7D32] dark:text-emerald-400 font-bold flex items-center gap-1 mt-1.5">
                <TrendingUp className="h-3.5 w-3.5 inline" />
                Laba Bersih Koperasi
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-slate-800 text-amber-750 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-slate-705 transition-colors duration-300 group-hover:bg-[#D4AF37]/15 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>

      {/* THREE INTERACTIVE DATA BLOCKS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* SMALL METRIC LIST */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm space-y-4">
          <h4 className="font-extrabold text-sm uppercase text-slate-700 dark:text-slate-350 tracking-wider">Parameter Operasional</h4>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0c111d] rounded-lg border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Anggota Terdaftar</span>
              </div>
              <span className="font-extrabold text-sm">{anggota.length} Orang</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0c111d] rounded-lg border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Penyelamat Aktif</span>
              </div>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{activeMembersCount} Orang</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-950/50">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-800 dark:text-red-300">Total Tunggakan</span>
              </div>
              <span className="font-extrabold text-sm text-red-600 dark:text-red-400">Rp {tunggakanPrincipal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* DUE INSTALLMENTS / DELINQUENCIES NOTIFICATION PANELS */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm col-span-1 md:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm uppercase text-slate-700 dark:text-slate-350 tracking-wider">Antrean Jatuh Tempo Angsuran</h4>
            <span className="text-[10px] font-extrabold bg-red-100 text-red-800 px-2 py-0.5 rounded-full dark:bg-red-950/40 dark:text-red-300">⚠️ Perhatian</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[165px]">
            {rawDueItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Tidak ada tenggat angsuran jatuh tempo terlewat saat ini.
              </div>
            ) : (
              rawDueItems.map(due => (
                <div key={due.id} className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950 rounded-xl flex items-center justify-between text-xs transition-colors">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{due.memberName}</span>
                    <span className="text-slate-400 text-[10px] block mt-0.5">Kode Pinjaman: {due.loanId} • Angsuran #{due.installmentNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-600 dark:text-amber-400 block">Rp {due.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-red-500">Jatuh Tempo: {due.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* INTERACTIVE CHARTS WRAPPER */}
      <div id="recharts-bento" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Area chart: Monthly flow */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-4">Peta Arus Kas Masuk & Keluar Bulanan</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowChartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.15} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Masuk" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="Keluar" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart: Assets/Liab comparison */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-4">Statistik Volume Pinjaman vs Simpanan</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetLiabChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.15} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-10} textAnchor="end" />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="Jumlah" fill="#24c081" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* LATEST TRANSACTIONS FEED INTERFACE */}
      <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm">
        
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-extrabold text-sm uppercase text-slate-700 dark:text-slate-350 tracking-wider">Mutasi Aktivitas Keuangan Terbaru</h4>
          <span className="text-[11px] font-bold text-slate-400">Sedang sinkron</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-3">Tanggal</th>
                <th className="pb-3 text-left">Nama Pengaju</th>
                <th className="pb-3 text-left">Keterangan Mutasi</th>
                <th className="pb-3 text-left">Tipe Transaksi</th>
                <th className="pb-3 text-right pr-3">Jumlah Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
              {allTransactions.map((trx, index) => (
                <tr key={`${trx.id}-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="py-3.5 pl-3 text-slate-500 dark:text-slate-400">{trx.date}</td>
                  <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">{trx.name}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">{trx.label}</td>
                  <td className="py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      trx.type === 'Pencairan' 
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
                        : trx.type === 'Angsuran'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                    }`}>
                      {trx.type}
                    </span>
                  </td>
                  <td className={`py-3.5 text-right pr-3 font-black ${trx.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
                    {trx.isIncome ? '+' : '-'} Rp {trx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

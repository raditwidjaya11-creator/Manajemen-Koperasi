import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { 
  Settings, 
  User, 
  CloudSun, 
  Moon, 
  Download, 
  Upload, 
  Users, 
  Check, 
  ShieldAlert, 
  Database,
  Trash2,
  Phone,
  Mail,
  Send,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Pengaturan: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    exportBackup, 
    importBackup, 
    resetCooperativeToSeed,
    cooperativeSettings,
    updateCooperativeSettings,
    anggota,
    angsuran,
    pinjaman
  } = useCooperative();
  
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [pasteBackupText, setPasteBackupText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [adminNameInput, setAdminNameInput] = useState(cooperativeSettings?.adminName || '');
  const [ketuaNameInput, setKetuaNameInput] = useState(cooperativeSettings?.ketuaName || '');
  const [collectorNameInput, setCollectorNameInput] = useState(cooperativeSettings?.collectorName || '');

  const [newCollectorId, setNewCollectorId] = useState('');
  const [newCollectorName, setNewCollectorName] = useState('');
  const [newCollectorPhone, setNewCollectorPhone] = useState('');
  const [newCollectorEmail, setNewCollectorEmail] = useState('');

  // Modal Send states
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<any>(null);
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'billing' | 'payments'>('billing');

  const handleAddCollector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectorId.trim() || !newCollectorName.trim() || !newCollectorPhone.trim() || !newCollectorEmail.trim()) {
      setErrorMsg('Semua data penagih (ID, Nama, No. HP, dan Email) wajib diisi.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const idCleanObj = newCollectorId.trim();
    const nameCleanObj = newCollectorName.trim();
    const phoneCleanObj = newCollectorPhone.trim();
    const emailCleanObj = newCollectorEmail.trim();

    const existingList = cooperativeSettings?.collectors || [];
    if (existingList.some(col => col.id.toLowerCase() === idCleanObj.toLowerCase())) {
      setErrorMsg(`Nomor ID Karyawan "${idCleanObj}" sudah terdaftar.`);
      setTimeout(() => setErrorMsg(''), 4050);
      return;
    }

    const updated = [...existingList, { id: idCleanObj, name: nameCleanObj, phone: phoneCleanObj, email: emailCleanObj }];
    updateCooperativeSettings({
      collectors: updated
    });

    setNewCollectorId('');
    setNewCollectorName('');
    setNewCollectorPhone('');
    setNewCollectorEmail('');
    setSuccessMsg(`Berhasil menambahkan penagih baru: ${nameCleanObj}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteCollector = (id: string) => {
    const existingList = cooperativeSettings?.collectors || [];
    const updated = existingList.filter(col => col.id !== id);
    updateCooperativeSettings({
      collectors: updated
    });
    setSuccessMsg('Karyawan penagih berhasil dihapus.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const [copied, setCopied] = useState(false);
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- CALCULATIONS FOR NOTIFICATION / SEND TARGET DATA ---
  const getBillingText = (col: any, date: string) => {
    if (!col) return '';
    // Unpaid due on date
    const unpaidList = angsuran.filter(a => a.status === 'unpaid' && a.date === date);
    let totalSum = 0;
    let listContent = '';
    
    unpaidList.forEach((a, idx) => {
      const mb = anggota.find(m => m.id === a.memberId);
      const phone = mb?.phone || '-';
      const addr = mb?.address || '-';
      totalSum += a.amount;
      listContent += `${idx + 1}. [Cicilan #${a.installmentNumber}] ${a.memberName}\n   - Tagihan: Rp ${a.amount.toLocaleString()}\n   - Alamat: ${addr}\n   - No HP: ${phone}\n   - Ref Pinjam: ${a.loanId.substring(0,8).toUpperCase()}\n\n`;
    });

    if (unpaidList.length === 0) {
      listContent = '(Tidak ada jadwal tagihan jatuh tempo pada tanggal ini)\n\n';
    }

    return `*KOPERASI SIMPAN PINJAM FORSDIG*\n*TUGAS TAGIHAN LAPANGAN HARIAN*\n-----------------------------------------------\nStaf Penagih: ${col.name} (${col.id})\nTanggal Penugasan: ${date}\n\nDaftar Anggota Wajib Ditagih:\n${listContent}-----------------------------------------------\n*TOTAL TARGET PENERIMAAN: Rp ${totalSum.toLocaleString()} (${unpaidList.length} Tagihan)*\n-----------------------------------------------\n_Harap tagih secara persuasif, sopan, dan cetak kuitansi resmi setelah menerima setoran dana._`;
  };

  const getPaymentsText = (col: any, date: string) => {
    if (!col) return '';
    // Paid on date collected by col
    const paidList = angsuran.filter(a => a.status === 'paid' && a.paymentDate === date && (a.collectorName?.toLowerCase() === col.name.toLowerCase()));
    let sumPokok = 0;
    let sumJasa = 0;
    let sumDenda = 0;
    let sumTotal = 0;
    let listContent = '';

    paidList.forEach((a, idx) => {
      const pen = a.penalty || 0;
      const tot = a.amount + pen;
      sumPokok += a.principal;
      sumJasa += a.interest;
      sumDenda += pen;
      sumTotal += tot;
      listContent += `${idx + 1}. [Kuitansi #${a.installmentNumber}] ${a.memberName}\n   - Pokok: Rp ${a.principal.toLocaleString()}\n   - Jasa: Rp ${a.interest.toLocaleString()}\n   - Denda: Rp ${pen.toLocaleString()}\n   - Subtotal: Rp ${tot.toLocaleString()}\n\n`;
    });

    if (paidList.length === 0) {
      listContent = '(Belum ada realisasi pembayaran yang diinput atas nama penagih ini pada tanggal ini)\n\n';
    }

    return `*KOPERASI SIMPAN PINJAM FORSDIG*\n*LAPORAN REKONSILIASI KASIR LAPANGAN*\n-----------------------------------------------\nStaf Penagih: ${col.name} (${col.id})\nTanggal Setoran: ${date}\n\nRincian Penerimaan Kasir Lapangan:\n${listContent}-----------------------------------------------\n*REKAP REALISASI SETORAN KASIR:*\n- Total Pokok: Rp ${sumPokok.toLocaleString()}\n- Total Margin Jasa: Rp ${sumJasa.toLocaleString()}\n- Total Denda Masuk: Rp ${sumDenda.toLocaleString()}\n\n*TOTAL NET SETOR KE BENDAHARA: Rp ${sumTotal.toLocaleString()} (${paidList.length} Lembar Kuitansi)*\n-----------------------------------------------\nData laporan ditarik langsung dari aplikasi real-time Forsdig Mandiri.`;
  };

  const handleSendWhatsApp = (col: any, text: string) => {
    if (!col?.phone) return;
    let cleaned = col.phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    const url = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSuccessMsg('Membuka browser ke WhatsApp Web / API...');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSendEmail = (col: any, text: string, typeName: string) => {
    if (!col?.email) return;
    const subject = `Laporan KSP Forsdig - ${typeName} (${targetDate})`;
    const url = `mailto:${col.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSuccessMsg('Membuka aplikasi Webmail / Email Default...');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Switch sandbox role
  const handleSwitchUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      setSuccessMsg(`Berhasil beralih identitas sebagai [${targetUser.role.toUpperCase()}] — ${targetUser.name}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Perform JSON local backup file download
  const handleDownloadBackup = () => {
    try {
      const backupString = exportBackup();
      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_forsdig_coop_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setSuccessMsg('Berkas backup basis data berhasil diunduh ke galeri lokal.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Gagal memicu eksport backup.');
    }
  };

  // Handle restoring database via pasting string
  const handleImportBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteBackupText) {
      setErrorMsg('Silakan paste string backup JSON yang sesuai.');
      return;
    }

    try {
      const ok = importBackup(pasteBackupText);
      if (ok) {
        setSuccessMsg('Basis data Koperasi Forsdig berhasil dipulihkan!');
        setPasteBackupText('');
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Gagal memulihkan. Format JSON tidak sesuai dengan skema!');
      }
    } catch (err) {
      setErrorMsg('String JSON rusak / bermasalah!');
    }
  };

  // Reset to seed data
  const handleResetToSeed = () => {
    if (window.confirm('Yakin ingin mereset seluruh database Koperasi Forsdig ke data contoh bawaan? Seluruh transaksi manual Anda akan hilang.')) {
      resetCooperativeToSeed();
      setSuccessMsg('Kembali ke setelan awal (seeding) sukses!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const toggleMockTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    
    // Toggle dark class in html to test actual tailwind support if implemented
    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    setSuccessMsg(`Mode visual beralih ke: ${nextTheme.toUpperCase()}`);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleSaveCooperativeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNameInput.trim() || !ketuaNameInput.trim() || !collectorNameInput.trim()) {
      setErrorMsg('Semua nama penandatangan / penagih harus diisi.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    updateCooperativeSettings({
      adminName: adminNameInput.trim(),
      ketuaName: ketuaNameInput.trim(),
      collectorName: collectorNameInput.trim()
    });

    setSuccessMsg('Pengaturan nama pejabat/staf koperasi sukses disimpan.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div id="pengaturan-view" className="space-y-6">
      
      {/* HEADER TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight font-sans">Sandbox Control & Pengaturan</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Uji coba peran (Multi-Peran), ekspor data backup rahasia, serta kustomisasi visual web.</p>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-150 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-50 text-red-705 border border-red-150 rounded-xl text-xs font-bold leading-none"
          >
            <span>⚠️ {errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* BLOCK 1: SANDBOX USER PERAN SWITCHER */}
        <div className="p-5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-850 rounded-xl shadow-xs space-y-4">
          <h4 className="font-extrabold text-xs uppercase text-slate-450 tracking-wider flex items-center gap-1">
            <Users className="h-4 w-4 text-[#0d2a1d]" />
            Sandbox Multi-Peran Switcher
          </h4>
          <p className="text-xs text-slate-500 select-text leading-relaxed">
            Klik profil dibawah untuk beralih identitas simulasi tanpa login kembali. Sifat menu/tombol aksi akan berubah otomatis menyesuaikan wewenang wajar:
          </p>

          <div className="space-y-2.5">
            {users.map(u => {
              const isActive = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  id={`btn-settings-user-${u.id}`}
                  onClick={() => handleSwitchUser(u.id)}
                  className={`w-full p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
                    isActive 
                      ? 'border-[#0d2a1d] bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-amber-400 font-extrabold scale-[1.01]' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#0d2a1d] text-amber-400 flex items-center justify-center font-black uppercase text-xs">
                      {u.name.substring(0, 2)}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{u.name}</h5>
                      <span className="text-[10px] text-slate-450 font-semibold uppercase">{u.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded border border-emerald-900 leading-none">ACTIVE</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold hover:text-slate-900 uppercase">BERALIH</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* BLOCK 2: SECURE SYSTEM BACKUP & RESTORE CHEST */}
        <div className="space-y-5">
          
          {/* Form Pengaturan Pejabat & Staff Koperasi */}
          <form onSubmit={handleSaveCooperativeSettings} className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs space-y-4">
            <h4 className="font-extrabold text-xs uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Pengaturan Penandatangan & Staf Lapangan
            </h4>
            <p className="text-xs text-slate-500 leading-normal select-text">
              Atur nama Ketua Koperasi, Admin Utama/Bendahara, dan default Petugas Penagih yang dicetak otomatis pada tanda terima kuitansi dan laporan rekonsiliasi.
            </p>
            
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Ketua Koperasi (Tanda Tangan Laporan)</label>
                <input
                  type="text"
                  value={ketuaNameInput}
                  onChange={(e) => setKetuaNameInput(e.target.value)}
                  placeholder="Nama Ketua Koperasi..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold font-sans focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Admin Koperasi / Bendahara (Kasir Utama)</label>
                <input
                  type="text"
                  value={adminNameInput}
                  onChange={(e) => setAdminNameInput(e.target.value)}
                  placeholder="Nama Admin / Kasir..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold font-sans focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Karyawan Penagih (Default Lapangan)</label>
                <input
                  type="text"
                  value={collectorNameInput}
                  onChange={(e) => setCollectorNameInput(e.target.value)}
                  placeholder="Nama Petugas Penagih..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold font-sans focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              id="btn-save-coop-signers"
              type="submit"
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-black text-center flex items-center justify-center gap-1 transition-all"
            >
              <span>Simpan Nama Pejabat & Staff</span>
            </button>
          </form>

          {/* Form Pengelolaan Daftar Karyawan Penagih Lapangan */}
          <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Kelola Daftar Karyawan Penagih Lapangan
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black rounded-full uppercase">
                Aktif {(cooperativeSettings?.collectors || []).length} Staf
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-normal select-text">
              Daftarkan nomor HP (WhatsApp) dan email staf penagih lapangan. Admin atau Bendahara dapat langsung memilih petugas untuk mengekspor atau mengirimkan data penugasan harian.
            </p>

            {/* List Table */}
            <div className="border border-slate-150 dark:border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <th className="p-2.5 pl-3">ID Karyawan</th>
                    <th className="p-2.5">Nama Lengkap</th>
                    <th className="p-2.5">No. HP / WA</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5 pr-3 text-right">Kirim Data & Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {(!cooperativeSettings?.collectors || cooperativeSettings.collectors.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        Belum ada petugas penagih yang terdaftar.
                      </td>
                    </tr>
                  ) : (
                    cooperativeSettings.collectors.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                        <td className="p-2.5 pl-3 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">{col.id}</td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200 font-semibold">{col.name}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{col.phone || '-'}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 font-sans">{col.email || '-'}</td>
                        <td className="p-2.5 pr-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Action to Send Tagihan Harian */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCollector(col);
                                setReportType('billing');
                                setSendModalOpen(true);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/55 text-amber-700 dark:text-amber-300 rounded text-[10px] font-black flex items-center gap-1 transition-all"
                              title="Kirim Tugas Tagihan Lapangan Hari Ini"
                            >
                              <Send className="h-2.5 w-2.5" />
                              <span>Tagihan</span>
                            </button>

                            {/* Action to Send Laporan Pembayaran harian */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCollector(col);
                                setReportType('payments');
                                setSendModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-55 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/55 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-black flex items-center gap-1 transition-all"
                              title="Kirim Rekonsiliasi Realisasi Pembayaran"
                            >
                              <Check className="h-2.5 w-2.5" />
                              <span>Laporan</span>
                            </button>

                            {/* Divider */}
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

                            {/* Danger action */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCollector(col.id)}
                              className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Hapus Penagih"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add New Collector Form Card */}
            <form onSubmit={handleAddCollector} className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">Tambah Petugas Penagih Baru</span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">ID Karyawan (Unik)</label>
                  <input
                    type="text"
                    value={newCollectorId}
                    onChange={(e) => setNewCollectorId(e.target.value)}
                    required
                    placeholder="Contoh: COLL-003"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Nama Lengkap Penagih</label>
                  <input
                    type="text"
                    value={newCollectorName}
                    onChange={(e) => setNewCollectorName(e.target.value)}
                    required
                    placeholder="Contoh: Ahmad Hidayat"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={newCollectorPhone}
                    onChange={(e) => setNewCollectorPhone(e.target.value)}
                    required
                    placeholder="Contoh: 0812XXXXXXXX"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Alamat Email Resmi</label>
                  <input
                    type="email"
                    value={newCollectorEmail}
                    onChange={(e) => setNewCollectorEmail(e.target.value)}
                    required
                    placeholder="Contoh: ahmad@forsdig.com"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0d2a1d] hover:bg-[#153e2b] dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white rounded-lg text-xs font-black text-center flex items-center justify-center gap-1 transition-all shadow-xs"
              >
                <span>+ Daftarkan Karyawan Penagih Baru</span>
              </button>
            </form>
          </div>

          {/* Theme custom & web setup */}
          <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-xs space-y-4">
            <h4 className="font-extrabold text-xs uppercase text-slate-450 tracking-wider flex items-center gap-1">
              <CloudSun className="h-4 w-4 text-[#0d2a1d]" />
              Kustomisasi Tampilan Visual
            </h4>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mode Layar</span>
              <button
                id="btn-toggle-theme-pengaturan"
                onClick={toggleMockTheme}
                className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-amber-400 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all"
              >
                {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <CloudSun className="h-4 w-4" />}
                <span>Ganti Ke {themeMode === 'light' ? 'DARK MODE' : 'LIGHT MODE'}</span>
              </button>
            </div>
          </div>

          {/* Database Backup operations */}
          <div className="p-5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-850 rounded-xl shadow-xs space-y-4">
            <h4 className="font-extrabold text-xs uppercase text-slate-405 tracking-wider flex items-center gap-1">
              <Database className="h-4 w-4 text-[#0d2a1d]" />
              Ekspor / Impor Backup Basis Data
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Keluarkan draf dump database KSP Forsdig dalam bentuk file teks JSON terenkripsi lokal untuk mengamankan data transaksi agar dapat disinkronkan kemudian.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-download-json-backup"
                onClick={handleDownloadBackup}
                className="p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-205 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1"
              >
                <Download className="h-5 w-5 text-emerald-600 mb-1" />
                <span>Unduh File backup</span>
              </button>
              <button
                id="btn-trigger-reset-seed"
                onClick={handleResetToSeed}
                className="p-3.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1"
                title="Seka semua draf kembali ke awal mula"
              >
                <Trash2 className="h-5 w-5 text-red-650 mb-1" />
                <span>Reset ke Seed Bawaan</span>
              </button>
            </div>

            {/* PASTE STRING RESTORE FORM */}
            <form onSubmit={handleImportBackupSubmit} className="space-y-3.5 pt-2 border-t border-slate-150">
              <label className="block text-[10px] font-black uppercase text-slate-405">Pasang String Import Backup</label>
              <textarea
                rows={2}
                value={pasteBackupText}
                onChange={(e) => setPasteBackupText(e.target.value)}
                placeholder="Paste JSON string backup disini..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono focus:outline-none"
              />
              <button
                id="btn-submit-restoration"
                type="submit"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1"
              >
                <Upload className="h-4 w-4" />
                <span>Simpan Pemulihan Data</span>
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* MODAL DIALOG: KIRIM DATA LAPANGAN / REKONSILIASI PENAGIH */}
      <AnimatePresence>
        {sendModalOpen && selectedCollector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs select-text">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    Kirim Data Penagih Lapangan
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold font-sans">
                    Petugas: {selectedCollector.name} ({selectedCollector.id})
                  </p>
                </div>
                <button
                  onClick={() => setSendModalOpen(false)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 text-xl font-bold p-1 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all"
                >
                  &times;
                </button>
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* 1. Select Report Type Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setReportType('billing')}
                    className={`flex-1 py-2 rounded-md text-xs font-extrabold transition-all ${
                      reportType === 'billing'
                        ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    1. Data Tagihan Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('payments')}
                    className={`flex-1 py-2 rounded-md text-xs font-extrabold transition-all ${
                      reportType === 'payments'
                        ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    2. Laporan Pembayaran Harian
                  </button>
                </div>

                {/* 2. Choose Target Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                    Pilih Tanggal Rujukan Data
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-bold font-sans text-slate-750 dark:text-slate-205"
                    />
                  </div>
                </div>

                {/* 3. Live Preview of Compiled Text Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                      Pratinjau Draft Pesan Notifikasi
                    </label>
                    <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase">
                      Format Teks Bersih
                    </span>
                  </div>
                  <textarea
                    readOnly
                    rows={8}
                    value={
                      reportType === 'billing'
                        ? getBillingText(selectedCollector, targetDate)
                        : getPaymentsText(selectedCollector, targetDate)
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-205 dark:border-slate-800 rounded-lg font-mono text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = reportType === 'billing'
                      ? getBillingText(selectedCollector, targetDate)
                      : getPaymentsText(selectedCollector, targetDate);
                    handleCopyToClipboard(text);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                      : 'bg-white hover:bg-slate-50 text-slate-750 border-slate-205 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-205 dark:border-slate-750'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>{copied ? 'Tersalin!' : 'Salin Draft Teks'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = reportType === 'billing'
                      ? getBillingText(selectedCollector, targetDate)
                      : getPaymentsText(selectedCollector, targetDate);
                    handleSendWhatsApp(selectedCollector, text);
                  }}
                  className="py-2 bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Phone className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = reportType === 'billing'
                      ? getBillingText(selectedCollector, targetDate)
                      : getPaymentsText(selectedCollector, targetDate);
                    handleSendEmail(
                      selectedCollector,
                      text,
                      reportType === 'billing' ? 'Tugas Tagihan Lapangan' : 'Laporan Realisasi Pembayaran'
                    );
                  }}
                  className="py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span>Kirim Email</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

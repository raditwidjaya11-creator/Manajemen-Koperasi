import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { Anggota as AnggotaType } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  UserPlus, 
  CreditCard, 
  Download, 
  Printer, 
  Check,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { utils, write } from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

export const Anggota: React.FC = () => {
  const { anggota, addAnggota, updateAnggota, deleteAnggota, currentUser } = useCooperative();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState<AnggotaType | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [photoUrl, setPhotoUrl] = useState('');
  const [errorForm, setErrorForm] = useState('');

  // Table pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Filter & Search
  const filteredAnggota = anggota.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.nik.includes(search) || 
                          m.memberNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAnggota.length / itemsPerPage);
  const displayedAnggota = filteredAnggota.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const resetForm = () => {
    setName('');
    setNik('');
    setAddress('');
    setPhone('');
    setOccupation('');
    setStatus('active');
    setPhotoUrl('');
    setEditingId(null);
    setErrorForm('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (item: AnggotaType) => {
    setName(item.name);
    setNik(item.nik);
    setAddress(item.address);
    setPhone(item.phone);
    setOccupation(item.occupation);
    setStatus(item.status);
    setPhotoUrl(item.photoUrl);
    setEditingId(item.id);
    setFormOpen(true);
    setErrorForm('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nik || !phone || !address) {
      setErrorForm('Harap lengkapi semua field yang diberi tanda bintang (*).');
      return;
    }
    if (nik.length !== 16 || isNaN(Number(nik))) {
      setErrorForm('Format NIK harus tepat 16 digit angka.');
      return;
    }

    const payload = {
      name,
      nik,
      address,
      phone,
      occupation: occupation || 'Umum',
      status,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      joinDate: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      updateAnggota(editingId, payload);
    } else {
      addAnggota(payload);
    }

    setFormOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteAnggota(id);
    setConfirmDeleteId(null);
  };

  // Export excel helper
  const exportToExcel = () => {
    const rows = filteredAnggota.map(m => ({
      'No Anggota': m.memberNumber,
      'Nama': m.name,
      'NIK': m.nik,
      'No Telp': m.phone,
      'Pekerjaan': m.occupation,
      'Alamat': m.address,
      'Tanggal Bergabung': m.joinDate,
      'Status': m.status === 'active' ? 'Aktif' : 'Nonaktif'
    }));

    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Anggota');
    
    // Save locally
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Anggota_Forsdig_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
  };

  // Native HTML Card print
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div id="anggota-view" className="space-y-6">
      
      {/* ACTION TOPBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Manajemen Keanggotaan</h2>
          <p className="text-xs text-slate-500 font-medium">Tambah, kelola hak cetak kartu anggota terenkripsi, filter dan ekspor basis data.</p>
        </div>
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            id="btn-export-excel"
            onClick={exportToExcel}
            className="px-4 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all"
          >
            Ekspor Excel
          </button>
          
          {currentUser?.role !== 'anggota' && currentUser?.role !== 'kasir' && (
            <button
              id="btn-add-anggota"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-[#0d2a1d] hover:bg-[#153e2b] text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <UserPlus className="h-4 w-4 text-amber-400" />
              <span>Registrasi Anggota</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER & REALTIME SEARCH FRAME */}
      <div className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIK, atau nomor anggota koperasi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none font-bold"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-4">No. Anggota</th>
                <th className="py-3.5">Profil</th>
                <th className="py-3.5">NIK</th>
                <th className="py-3.5">Telepon</th>
                <th className="py-3.5">Pekerjaan</th>
                <th className="py-3.5">Mulai Bergabung</th>
                <th className="py-3.5">Status</th>
                <th className="py-3.5 text-center pr-4">Opsi Layanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/45 font-medium">
              {displayedAnggota.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-450 dark:text-slate-500 text-xs font-semibold">
                    Tidak ditemukan kecocokan data keanggotaan dalam database.
                  </td>
                </tr>
              ) : (
                displayedAnggota.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-4 pl-4 font-bold text-[#0d2a1d] dark:text-amber-400">
                      {item.memberNumber}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={item.photoUrl} 
                          alt="avatar" 
                          referrerPolicy="no-referrer"
                          className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 dark:border-emerald-900"
                        />
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{item.name}</p>
                          <p className="text-[10px] text-slate-450 truncate max-w-[130px] leading-tight">{item.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300 font-mono">{item.nik}</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 font-medium">{item.phone}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{item.occupation}</td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">{item.joinDate}</td>
                    <td className="py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                          : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                      }`}>
                        {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-4 text-center pr-4 space-x-1.5">
                      <button
                        id={`btn-card-${item.id}`}
                        onClick={() => setCardOpen(item)}
                        title="Lihat / Cetak Kartu Anggota Koperasi"
                        className="p-1.5 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-700 dark:text-amber-400 inline-block transition-all"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>

                      {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
                        <>
                          <button
                            id={`btn-edit-${item.id}`}
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Anggota"
                            className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-350 inline-block border border-slate-205 dark:border-slate-700 transition-all"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-delete-prompt-${item.id}`}
                            onClick={() => setConfirmDeleteId(item.id)}
                            title="Hapus Anggota"
                            className="p-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400 inline-block border border-red-200 dark:border-red-950/20 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION RIG */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button
                id="btn-page-prev"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-850 rounded text-xs font-semibold disabled:opacity-40"
              >
                Kembali
              </button>
              <button
                id="btn-page-next"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-155 dark:border-slate-850 rounded text-xs font-semibold disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* —— POPUP MODAL: CREATE / EDIT MEMBERS —— */}
      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative"
            >
              
              <div className="px-5 py-4 bg-[#0d2a1d] text-white flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <UserPlus className="h-4.5 w-4.5 text-amber-400" />
                  {editingId ? 'Edit Anggota Terdaftar' : 'Registrasi Anggota Baru'}
                </h3>
                <button
                  id="btn-close-form"
                  onClick={() => setFormOpen(false)}
                  className="p-1 rounded bg-[#133726] hover:bg-red-955 text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorForm && (
                <div className="m-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-950 text-xs font-bold rounded-lg">
                  {errorForm}
                </div>
              )}

              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Nama Lengkap Sesuai KTP *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi Gunawan"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">NIK (KTP) *</label>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      placeholder="16 Digit NIK"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">No WhatsApp/HP *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812XXXXXXXX"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Profesi Pekerjaan</label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="Wirausaha / PNS"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Status Keanggotaan</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif (Suspend)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Alamat Tinggal Tetap *</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat lengkap sesuai KTP"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">URL Foto (Profil Anggota)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 select-all"
                    />
                    <button
                      id="btn-photo-preset"
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-200 text-[10px] font-extrabold rounded-lg hover:cursor-pointer transition-all border border-slate-200 dark:border-slate-700 h-8"
                      title="Gunakan DP Preset"
                    >
                      <ImageIcon className="h-4 w-4 inline mr-1" />
                      PRESET
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-end gap-2 text-xs">
                  <button
                    id="btn-cancel-form"
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-submit-anggota"
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg font-bold flex items-center gap-1 shadow-md shadow-emerald-900/10"
                  >
                    <Check className="h-4.5 w-4.5 text-amber-400 inline" />
                    Simpan Anggota
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* —— PRINT PASS: MEMBERSHIP DIGITAL CARD (GOLD THEME WITH BARCODE / QR) —— */}
      <AnimatePresence>
        {cardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden border border-amber-200 dark:border-slate-850 flex flex-col shadow-2xl relative"
            >
              
              <div className="px-5 py-3.5 border-b border-light-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-[#0c111d]">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Pratinjau Kartu Anggota</h3>
                <button
                  id="btn-close-card"
                  onClick={() => setCardOpen(null)}
                  className="p-1 rounded hover:bg-slate-205 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* CARD ELEMENT FOR PRINT */}
              <div className="p-6 flex justify-center bg-slate-100 dark:bg-slate-950">
                
                {/* GOLD FINTECH COOP CARD */}
                <div 
                  id="printable-member-card"
                  className="w-80 h-48 bg-gradient-to-br from-[#0d2a1d] via-[#113a27] to-[#16442e] rounded-2xl relative p-5 shadow-2xl border-2 border-amber-400/40 text-white flex flex-col justify-between overflow-hidden"
                >
                  
                  {/* Watermark decors */}
                  <div className="absolute top-[-30%] right-[-20%] w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-[-20%] left-[-20%] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

                  {/* Header space */}
                  <div className="flex items-center justify-between border-b border-[#1b4e37] pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-amber-400 rounded-lg flex items-center justify-center">
                        <span className="font-black text-xs text-emerald-950">F</span>
                      </div>
                      <div>
                        <h5 className="font-black text-[10px] tracking-tight text-white leading-none">FORSDIG COOP</h5>
                        <span className="text-[7px] text-amber-400 font-bold tracking-widest leading-none">MEMBER PASS</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[6px] uppercase tracking-widest text-[#a3b899] font-black block">Status Pas</span>
                      <span className="text-[7px] uppercase font-bold text-emerald-300">verified</span>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="flex items-center gap-3.5 my-3 relative">
                    <img 
                      src={cardOpen.photoUrl} 
                      alt="member avatar" 
                      className="h-14 w-14 rounded-xl object-cover border border-amber-400/30 shrink-0"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="font-extrabold text-[13px] tracking-tight text-white truncate max-w-[130px] leading-tight select-all">{cardOpen.name}</h4>
                      <p className="text-[9px] text-amber-300 font-mono font-bold leading-none select-all">{cardOpen.memberNumber}</p>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0 text-[7px] text-slate-300 leading-none pt-1">
                        <div>
                          <span className="text-[6px] text-slate-450 block uppercase font-bold">Gabung</span>
                          <span className="font-semibold">{cardOpen.joinDate}</span>
                        </div>
                        <div>
                          <span className="text-[6px] text-slate-450 block uppercase font-bold">NIK</span>
                          <span className="font-semibold truncate max-w-[45px] block">{cardOpen.nik.slice(0,6)}...</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code integration right side */}
                    <div className="ml-auto bg-white p-1 rounded-lg border-2 border-amber-400 flex items-center justify-center shrink-0">
                      {/* Generates a stylized SVG representing a security QR Code */}
                      <svg className="h-10 w-10" viewBox="0 0 100 100">
                        <path fill="#0d2a1d" d="M0 0h30v30H0zm40 0h20v20H40zm30 0h30v30H70zM0 40h20v20H0zm35 15h15v15H35zM0 70h30v30H0zm40 60h20v20H40zM70 70h30v30H70z" />
                        <rect x="10" y="10" width="10" height="10" fill="#f59e0b" />
                        <rect x="80" y="10" width="10" height="10" fill="#f59e0b" />
                        <rect x="10" y="80" width="10" height="10" fill="#f59e0b" />
                        {/* Dot Matrix representing dynamic token ID */}
                        <rect x="45" y="45" width="10" height="10" fill="#10b981" />
                        <rect x="35" y="35" width="10" height="5" fill="#0d2a1d" />
                        <rect x="55" y="35" width="5" height="15" fill="#0d2a1d" />
                      </svg>
                    </div>
                  </div>

                  {/* Barcode bottom overlay */}
                  <div className="flex items-center justify-between border-t border-[#1b4e37] pt-2">
                    <span className="text-[6px] text-[#a3b899] font-black uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="h-2.5 w-2.5 text-amber-400 inline" />
                      Foresyndo Secure Network
                    </span>
                    
                    {/* Simulated vector Barcode lines */}
                    <div className="flex gap-px h-3 items-center">
                      {[1,3,1,2,1,4,1,3,2,1,3,1,2,4,1,3].map((val, idx) => (
                        <span 
                          key={idx} 
                          className="bg-white shrink-0 block" 
                          style={{ width: `${val * 0.4}px`, height: '100%' }} 
                        />
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Action operations */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-850 flex gap-2 justify-end text-xs font-bold leading-none">
                <button
                  id="btn-print-card-sys"
                  onClick={handlePrintCard}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 rounded-lg flex items-center gap-1.5 shadow-xs border border-slate-200 dark:border-slate-700"
                >
                  <Printer className="h-4 w-4" />
                  <span>Kirim ke Printer</span>
                </button>
                <button
                  id="btn-save-as-png-placeholder"
                  onClick={() => alert('Fitur download kartu ke galeri sebagai PNG berhasil dipicu. (Mocks file)')}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-850 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh PNG</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* —— CONFIRM DELETE MODAL CHECK —— */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-220 dark:border-slate-800 rounded-xl overflow-hidden max-w-sm w-full shadow-2xl relative p-5"
            >
              <h3 className="font-extrabold text-sm uppercase text-red-600 tracking-wide">Peringatan Penghapusan</h3>
              <p className="text-slate-500 text-xs mt-2 select-text">
                Apakah Anda benar-benar yakin ingin menghapus anggota ini dari pendaftaran koperasi? Seluruh transaksi yang terkait tidak akan terhapus namun status keanggotaan dilepas. Tindakan ini bersifat permanen.
              </p>
              <div className="mt-5 flex gap-2 justify-end text-xs font-bold">
                <button
                  id="btn-cancel-delete"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Batalkan
                </button>
                <button
                  id="btn-confirm-delete"
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-800 text-white rounded-lg transition-colors border border-red-700"
                >
                  Ya, Hapus Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

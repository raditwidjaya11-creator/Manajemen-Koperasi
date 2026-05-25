import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { ShieldAlert, BookOpenCheck, KeyRound, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login, loginGoogle, users } = useCooperative();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Default mock password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick Demo Login helper
  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    const success = await login(demoEmail);
    setLoading(false);
    if (!success) {
      setError('Gagal masuk sebagai pengguna demo tersebut.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Masukkan alamat email login Anda.');
      return;
    }
    setLoading(true);
    setError('');
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      setError('Email pembukuan tidak terdaftar atau dinonaktifkan.');
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await loginGoogle();
    } catch (e) {
      setError('Koneksi Google Sign-In terganggu atau divalidasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabelInIndo = (role: string) => {
    switch(role) {
      case 'super_admin': return 'Super Admin (Radit)';
      case 'admin': return 'Admin Pengelola';
      case 'bendahara': return 'Bendahara Keuangan';
      case 'kasir': return 'Kasir Pembukuan';
      case 'anggota': return 'Anggota Koperasi';
      default: return role;
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col md:flex-row bg-[#030712] relative overflow-hidden">
      
      {/* BACKGROUND FLOATING DECOR */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-950/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[45%] bg-sky-950/20 rounded-full blur-[100px] pointer-events-none" />
 
      {/* LEFT COLUMN: BRAND PROMOTION */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-blue-950/40 relative z-10">
        
        {/* Top brand marquee */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-amber-400 to-sky-400 rounded-xl flex items-center justify-center font-black text-[#030712]">
            F
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight">FORESYNDO</span>
            <span className="block text-xs font-bold text-sky-450 uppercase tracking-widest leading-none">Coop & Simpan Pinjam</span>
          </div>
        </div>
 
        {/* Dynamic content center */}
        <div className="my-10 md:my-auto max-w-md">
          <span className="inline-block px-3 py-1 bg-[#0f172a] border border-blue-900/60 text-sky-400 text-[11px] font-bold tracking-wider rounded-full mb-4 uppercase">
            Aplikasi Koperasi Fintech Pro
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Pembukuan Kerja <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-400">Transparan & Realtime</span>
          </h1>
          <p className="mt-4 text-slate-300 text-sm md:text-base leading-relaxed">
            Sistem akuntansi terintegrasi simpanan pokok-wajib-sukarela, pinjaman amortisasi bunga, pencatatan kas masuk-keluar otomatis ke jurnal besar koperasi.
          </p>
 
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-950/25 border border-blue-900/30 rounded-xl">
              <span className="text-amber-400 font-extrabold text-xl">100%</span>
              <p className="text-xs text-slate-400 mt-1 font-medium">Tertutup Enskripsi Aman</p>
            </div>
            <div className="p-4 bg-blue-950/25 border border-blue-900/30 rounded-xl">
              <span className="text-sky-400 font-extrabold text-xl">0.1s</span>
              <p className="text-xs text-slate-400 mt-1 font-medium">Automatic Journal Posting</p>
            </div>
          </div>
        </div>
 
        {/* Footnote */}
        <div className="text-xs text-slate-500">
          Foresyndo Coop v1.2.0 © 2026 • Platform Indonesia Sejahtera.
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE LOGIN INTERFACES */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10 bg-[#020617]/85">
        
        <div className="w-full max-w-md bg-[#0f172a] border border-blue-900/35 p-8 rounded-2xl shadow-2xl">
          
          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Kredensial Autentikasi</h2>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">Silakan masuk menggunakan akun terdaftar atau panel akses instan.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 p-3 bg-red-950/80 border border-red-900 text-red-200 text-xs font-semibold rounded-lg flex items-center gap-2.5"
            >
              <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* CRED LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5">Alamat Email Pengenal</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@foresyndo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#020617] border border-blue-900/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-300 tracking-wider mb-1.5">Kata Sandi (Password)</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#020617] border border-blue-900/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm tracking-wide hover:scale-[1.01] active:scale-[0.99] rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? 'Validasi Kredensial...' : 'Masuk Aplikasi Sekarang'}
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-blue-900/30" />
            <span className="relative bg-[#0f172a] px-3.5 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              Akses Simulasi Cepat
            </span>
          </div>

          {/* DEMO ACCOUNTS DRAWER */}
          <div className="grid grid-cols-2 gap-2.5">
            {users.slice(0, 4).map(demoUser => (
              <button
                id={`demo-login-${demoUser.role}`}
                key={demoUser.id}
                onClick={() => handleQuickLogin(demoUser.email)}
                className="p-2.5 bg-[#020617] hover:bg-blue-950/65 border border-blue-900/80 hover:border-sky-505/50 rounded-lg text-left transition-all group shrink-0"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-sky-400 rounded-full group-hover:scale-125 transition-transform" />
                  <span className="text-[11px] font-bold text-sky-450">{getRoleLabelInIndo(demoUser.role)}</span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium truncate mt-1">{demoUser.name.split(' ')[0]}</p>
                <p className="text-[8px] text-slate-400 truncate mt-0.5">{demoUser.email}</p>
              </button>
            ))}
          </div>

          <button
            id="btn-google-login-dummy"
            onClick={handleGoogleAuth}
            className="w-full mt-4 py-2.5 px-4 bg-transparent border border-blue-900/60 hover:bg-blue-950 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z" fillRule="evenodd" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Masuk Menggunakan Google Auth
          </button>

          <div className="mt-6 flex justify-center gap-2 text-[10px] text-slate-500">
            <BookOpenCheck className="h-3.5 w-3.5 text-blue-500" />
            <span>Kode Pembukuan Sandi Enkripsi Tersertifikasi</span>
          </div>

        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { useCooperative } from '../store/cooperativeStore';
import { 
  Building2, 
  Users, 
  PiggyBank, 
  HandCoins, 
  CalendarCheck, 
  BookOpen, 
  Coins, 
  FileText, 
  Settings2, 
  ShieldCheck, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  view: string;
  allowedRoles: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', icon: Building2, view: 'dashboard', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir', 'anggota'] },
  { name: 'Anggota Koperasi', icon: Users, view: 'anggota', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir'] },
  { name: 'Modul Simpanan', icon: PiggyBank, view: 'simpanan', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir', 'anggota'] },
  { name: 'Modul Pinjaman', icon: HandCoins, view: 'pinjaman', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir', 'anggota'] },
  { name: 'Modul Angsuran', icon: CalendarCheck, view: 'angsuran', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir', 'anggota'] },
  { name: 'Kas Masuk & Keluar', icon: Coins, view: 'kas', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir'] },
  { name: 'Pembukuan & COA', icon: BookOpen, view: 'pembukuan', allowedRoles: ['super_admin', 'bendahara'] },
  { name: 'Laporan Pembukuan', icon: FileText, view: 'laporan', allowedRoles: ['super_admin', 'admin', 'bendahara', 'kasir', 'anggota'] },
  { name: 'Manajemen Akses', icon: ShieldCheck, view: 'users', allowedRoles: ['super_admin'] },
  { name: 'Pengaturan & System', icon: Settings2, view: 'pengaturan', allowedRoles: ['super_admin', 'admin', 'bendahara'] },
];

interface DashboardLayoutProps {
  currentView?: string;
  setCurrentView?: (view: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  currentView: propsView, 
  setCurrentView: propsSetView, 
  children 
}) => {
  const { currentUser, logout, darkMode, toggleDarkMode, currentTab, setCurrentTab } = useCooperative();
  const currentView = propsView || currentTab || 'dashboard';
  const setCurrentView = propsSetView || setCurrentTab;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter menu items by current logged-in user role
  const userRole = currentUser?.role || 'anggota';
  const filteredNavItems = SIDEBAR_ITEMS.filter(item => item.allowedRoles.includes(userRole));

  const roleLabels: Record<string, { label: string, color: string }> = {
    super_admin: { label: 'SUPER ADMIN', color: 'bg-emerald-600 text-white' },
    admin: { label: 'ADMINISTRATOR', color: 'bg-indigo-600 text-white' },
    bendahara: { label: 'BENDAHARA', color: 'bg-amber-500 text-white' },
    kasir: { label: 'KASIR UTAMA', color: 'bg-teal-500 text-white' },
    anggota: { label: 'ANGGOTA KOP', color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' }
  };

  const currentRoleInfo = roleLabels[userRole] || { label: 'PENGUNJUNG', color: 'bg-gray-400 text-white' };

  if (!currentUser) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900">{children}</div>;

  return (
    <div id="layout-root" className="min-h-screen flex bg-slate-50 dark:bg-[#0c111d] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* SIDEBAR ON DESKTOP */}
      <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-72 bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] border-r border-blue-900/40 text-white shrink-0">
        
        {/* Logo and Brand */}
        <div className="p-6 border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center font-bold text-blue-950 text-xl shadow-md">
              <span className="font-extrabold text-xl text-blue-950">F</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Foresyndo</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">Coop & Simpan Pinjam</p>
            </div>
          </div>
        </div>

        {/* Current profile info box */}
        <div className="p-4 mx-4 my-3 bg-blue-950/45 rounded-xl border border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-850/60 text-[#D4AF37] rounded-full flex items-center justify-center font-bold border border-[#D4AF37]/40 shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-slate-100 truncate">{currentUser.name}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${currentRoleInfo.color}`}>
                {currentRoleInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav id="desktop-nav" className="flex-1 py-4 overflow-y-auto space-y-1">
          <div className="px-6 py-2 text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-60">Main Menu</div>
          {filteredNavItems.map(item => {
            const IconComponent = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                id={`nav-${item.view}`}
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3.5 px-6 py-3 border-l-4 transition-all ${
                  isActive 
                    ? 'bg-white/15 border-l-4 border-[#D4AF37] text-white font-semibold' 
                    : 'border-l-transparent text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <IconComponent className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-blue-200/80'}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Workspace Footer and Session */}
        <div className="p-4 border-t border-blue-900/50 space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-200/80 px-2 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              06:59 UTC
            </span>
            <span className="text-[#D4AF37] font-bold tracking-wider animate-pulse">LIVE SYNC</span>
          </div>
          <button
            id="btn-logout-desktop"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-950/60 hover:bg-blue-950/80 text-slate-300 hover:text-white border border-blue-900/40 hover:border-blue-900 text-xs font-semibold transition-all mt-1"
          >
            <LogOut className="h-4 w-4 text-[#D4AF37]" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & SLIDEBAR MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            {/* Slide menu */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] border-r border-blue-900/40 text-white z-50 flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center font-bold text-blue-950 text-xl shadow-md">
                    <span className="font-extrabold text-xl text-blue-950">F</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-base leading-tight">Foresyndo</h1>
                    <span className="text-[10px] font-bold tracking-wider text-[#D4AF37]">COOP & SIMPAN PINJAM</span>
                  </div>
                </div>
                <button
                  id="btn-close-mobile-menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-blue-900 text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Profile */}
              <div className="p-4 mx-4 my-2.5 bg-blue-900/40 rounded-xl flex items-center gap-3 border border-blue-800/30">
                <div className="h-9 w-9 bg-blue-800/60 rounded-full flex items-center justify-center font-bold text-[#D4AF37]">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-xs text-white truncate">{currentUser.name}</p>
                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${currentRoleInfo.color}`}>
                    {currentRoleInfo.label}
                  </span>
                </div>
              </div>

              {/* Nav menu links */}
              <nav id="mobile-nav" className="flex-1 py-3 overflow-y-auto space-y-1">
                <div className="px-6 py-2 text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-60">Main Menu</div>
                {filteredNavItems.map(item => {
                  const IconComponent = item.icon;
                  const isActive = currentView === item.view;
                  return (
                    <button
                      id={`nav-mobile-${item.view}`}
                      key={item.view}
                      onClick={() => {
                        setCurrentView(item.view);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-6 py-2.5 border-l-4 transition-all ${
                        isActive 
                          ? 'bg-white/15 border-l-4 border-[#D4AF37] text-white font-semibold' 
                          : 'border-l-transparent text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <IconComponent className={`h-4.5 w-4.5 text-blue-200 ${isActive ? 'text-[#D4AF37]' : 'text-blue-200/80'}`} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-blue-800/50 gap-2 flex flex-col">
                <button
                  id="btn-logout-mobile"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-950/60 hover:bg-blue-950/80 text-slate-300 font-medium text-sm border border-blue-800/20 shadow-xs"
                >
                  <LogOut className="h-4 w-4 text-[#D4AF37]" />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* VIEW WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              id="btn-open-mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <span className="font-bold text-blue-700 dark:text-sky-400">Foresyndo Coop</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="capitalize font-semibold text-slate-800 dark:text-slate-100">{currentView.replace('_', ' ')}</span>
            </div>
            <div className="lg:hidden">
              <span className="font-extrabold text-blue-700 dark:text-sky-400 text-base">Foresyndo Coop</span>
            </div>
          </div>

          {/* RIGHT ACTION RIGS */}
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Status indicators */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 inline" />
                {currentUser.branch || 'Cabang Utama'}
              </span>
            </div>

            {/* Dark mode button */}
            <button
              id="btn-toggle-dark"
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
              title="Ganti Tema Visual"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
            </button>

            {/* Quick Profile Panel */}
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-slate-850">
              <div className="h-8.5 w-8.5 bg-gradient-to-tr from-blue-600 to-blue-800 rounded-full flex items-center justify-center font-bold text-amber-300 shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[9px] font-bold tracking-wider text-slate-400 truncate uppercase mt-0.5">{currentUser.role.replace('_',' ')}</p>
              </div>
            </div>

          </div>
        </header>

        {/* COMPONENT RENDER SPACE */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-7xl mx-auto">
          <motion.div
            id="workspace-transition"
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

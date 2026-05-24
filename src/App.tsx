import React, { useEffect } from 'react';
import { useCooperative } from './store/cooperativeStore';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Anggota } from './pages/Anggota';
import { Simpanan } from './pages/Simpanan';
import { Pinjaman } from './pages/Pinjaman';
import { Angsuran } from './pages/Angsuran';
import { Kas } from './pages/Kas';
import { Pembukuan } from './pages/Pembukuan';
import { Laporan } from './pages/Laporan';
import { Pengaturan } from './pages/Pengaturan';

export default function App() {
  const { currentUser, currentTab } = useCooperative();

  // Handle Dark mode initial class synchronization
  useEffect(() => {
    // Initial check on load
    const root = window.document.documentElement;
    // For sandbox comfort, let's keep it safe
    root.classList.remove('dark');
  }, []);

  // 1. Guard check: Authenticate
  if (!currentUser) {
    return <Login />;
  }

  // 2. Tab select mapper
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'anggota':
        return <Anggota />;
      case 'simpanan':
        return <Simpanan />;
      case 'pinjaman':
        return <Pinjaman />;
      case 'angsuran':
        return <Angsuran />;
      case 'kas':
        return <Kas />;
      case 'pembukuan':
        return <Pembukuan />;
      case 'laporan':
        return <Laporan />;
      case 'pengaturan':
        return <Pengaturan />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout>
      {renderTabContent()}
    </DashboardLayout>
  );
}

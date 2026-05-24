import { 
  Anggota, 
  Simpanan, 
  Pinjaman, 
  Angsuran, 
  AccountCOA, 
  JurnalEntry, 
  KasEntry, 
  ActivityLog, 
  AppUser 
} from '../types';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-1',
    name: 'Radit Widjaya (Super Admin)',
    email: 'raditwidjaya11@gmail.com',
    role: 'super_admin',
    phone: '081234567890',
    branch: 'Cabang Utama',
    status: 'active'
  },
  {
    id: 'usr-2',
    name: 'Budi Santoso (Admin Toko)',
    email: 'admin@forsdig.com',
    role: 'admin',
    phone: '081299998888',
    branch: 'Cabang Utama',
    status: 'active'
  },
  {
    id: 'usr-3',
    name: 'Retno Putri (Bendahara)',
    email: 'bendahara@forsdig.com',
    role: 'bendahara',
    phone: '081377776666',
    branch: 'Cabang Utama',
    status: 'active'
  },
  {
    id: 'usr-4',
    name: 'Heri Kurniawan (Kasir)',
    email: 'kasir@forsdig.com',
    role: 'kasir',
    phone: '081555554444',
    branch: 'Cabang Utama',
    status: 'active'
  },
  {
    id: 'anggota-1',
    name: 'Adi Wijaya (Anggota)',
    email: 'adi.wijaya@gmail.com',
    role: 'anggota',
    phone: '081211112222',
    branch: 'Cabang Utama',
    status: 'active'
  }
];

export const INITIAL_COA: AccountCOA[] = [
  // Aset (1000 - 1999)
  { code: '1101', name: 'Kas Utama (Brankas)', category: 'aset', balance: 45000000 },
  { code: '1102', name: 'Kas Bank Mandiri', category: 'aset', balance: 125000000 },
  { code: '1201', name: 'Piutang Pinjaman Anggota', category: 'aset', balance: 58000000 },
  { code: '1301', name: 'Peralatan dan Dokumen Kantor', category: 'aset', balance: 15000000 },
  
  // Kewajiban (2000 - 2999)
  { code: '2101', name: 'Simpanan Pokok Anggota', category: 'kewajiban', balance: 50000000 },
  { code: '2102', name: 'Simpanan Wajib Anggota', category: 'kewajiban', balance: 75000000 },
  { code: '2103', name: 'Simpanan Sukarela Anggota', category: 'kewajiban', balance: 88000000 },
  { code: '2201', name: 'Dana Titipan Sosial', category: 'kewajiban', balance: 5000000 },

  // Ekuitas (3000 - 3999)
  { code: '3101', name: 'Modal Pendirian Koperasi', category: 'ekuitas', balance: 20000000 },
  { code: '3201', name: 'Cadangan Umum Koperasi', category: 'ekuitas', balance: 5000000 },
  { code: '3301', name: 'Sisa Hasil Usaha (SHU)', category: 'ekuitas', balance: 0 }, // recalculated

  // Pendapatan (4000 - 4999)
  { code: '4101', name: 'Pendapatan Jasa Bunga Pinjaman', category: 'pendapatan', balance: 6800000 },
  { code: '4102', name: 'Pendapatan Provisi / Admin', category: 'pendapatan', balance: 1200000 },
  { code: '4103', name: 'Pendapatan Denda Keterlambatan', category: 'pendapatan', balance: 350000 },

  // Beban (5000 - 5999)
  { code: '5101', name: 'Beban Gaji Pengelola', category: 'beban', balance: 2500000 },
  { code: '5102', name: 'Beban Perlengkapan & ATK', category: 'beban', balance: 450000 },
  { code: '5103', name: 'Beban Listrik, Air & Internet', category: 'beban', balance: 300000 }
];

export const INITIAL_ANGGOTA: Anggota[] = [
  {
    id: 'agt-001',
    memberNumber: 'FSP-2026-0001',
    name: 'Adi Wijaya',
    nik: '3273012405880002',
    address: 'Jl. Diponegoro No. 45, Bandung',
    phone: '081211112222',
    occupation: 'Wirausaha Kuliner',
    joinDate: '2026-01-10',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'agt-002',
    memberNumber: 'FSP-2026-0002',
    name: 'Siti Rahmawati',
    nik: '3174092506920001',
    address: 'Jl. Merdeka Barat No. 12, Jakarta',
    phone: '081344445555',
    occupation: 'Pegawai Negeri Sipil',
    joinDate: '2026-01-15',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'agt-003',
    memberNumber: 'FSP-2026-0003',
    name: 'Bambang Triyono',
    nik: '3374110309780005',
    address: 'Jl. Pemuda No. 89, Semarang',
    phone: '085733332222',
    occupation: 'Petani Modern',
    joinDate: '2026-02-01',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'agt-004',
    memberNumber: 'FSP-2026-0004',
    name: 'Dewi Lestari',
    nik: '3578021408890003',
    address: 'Jl. Gajah Mada No. 104, Surabaya',
    phone: '081288889999',
    occupation: 'Karyawan Swasta',
    joinDate: '2026-02-12',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'agt-005',
    memberNumber: 'FSP-2026-0005',
    name: 'Eko Prasetyo',
    nik: '3471032811820001',
    address: 'Jl. Malioboro No. 3, Yogyakarta',
    phone: '081566667777',
    occupation: 'Desainer Grafis',
    joinDate: '2026-03-05',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'inactive'
  }
];

export const INITIAL_SIMPANAN: Simpanan[] = [
  // Member 1 - Adi
  {
    id: 'smp-1',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-01-10',
    type: 'pokok',
    mutation: 'setor',
    amount: 10000000,
    description: 'Setoran Awal Simpanan Pokok Anggota Baru',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'smp-2',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-01-10',
    type: 'wajib',
    mutation: 'setor',
    amount: 250000,
    description: 'Setoran Simpanan Wajib Bulan Januari',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'smp-3',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-02-10',
    type: 'wajib',
    mutation: 'setor',
    amount: 250000,
    description: 'Setoran Simpanan Wajib Bulan Februari',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'smp-4',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-02-15',
    type: 'sukarela',
    mutation: 'setor',
    amount: 5000000,
    description: 'Setoran Simpanan Sukarela',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'smp-5',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-03-02',
    type: 'sukarela',
    mutation: 'tarik',
    amount: 1500000,
    description: 'Penarikan Simpanan Sukarela untuk Modal Dagang',
    createdBy: 'Heri Kurniawan'
  },
  
  // Member 2 - Siti
  {
    id: 'smp-6',
    memberId: 'agt-002',
    memberName: 'Siti Rahmawati',
    memberNumber: 'FSP-2026-0002',
    date: '2026-01-15',
    type: 'pokok',
    mutation: 'setor',
    amount: 10000000,
    description: 'Setoran Awal Simpanan Pokok Anggota Baru',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'smp-7',
    memberId: 'agt-002',
    memberName: 'Siti Rahmawati',
    memberNumber: 'FSP-2026-0002',
    date: '2026-01-15',
    type: 'wajib',
    mutation: 'setor',
    amount: 250000,
    description: 'Setoran Simpanan Wajib Bulan Januari',
    createdBy: 'Heri Kurniawan'
  }
];

export const INITIAL_PINJAMAN: Pinjaman[] = [
  {
    id: 'pj-1',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-02-05',
    type: 'modal_usaha',
    amount: 30000000,
    interestRate: 12, // 12% per tahun
    tenor: 12, // 12 bulan
    purpose: 'Ekspansi Warung Nasi Goreng Spesial',
    guaranteeName: 'BPKB Motor Honda Vario 2023',
    guaranteeFile: 'akta_bpkb_vario_2023.pdf',
    monthlyInstallment: 2800000, // pokok 2.500.000 + bunga 300.000
    remainingBalance: 24400000, // setelah diangsur 2 kali (+bunga)
    status: 'disetujui',
    approvedBy: 'Retno Putri (Bendahara)',
    approvalDate: '2026-02-06'
  },
  {
    id: 'pj-2',
    memberId: 'agt-002',
    memberName: 'Siti Rahmawati',
    memberNumber: 'FSP-2026-0002',
    date: '2026-02-20',
    type: 'pendidikan',
    amount: 12000000,
    interestRate: 10,
    tenor: 6,
    purpose: 'Biaya Semesteran Kuliah S2 Anak Pertama',
    guaranteeName: 'Ijazah S1 & Sertifikat Kompetensi',
    guaranteeFile: 'ijazah_siti_anak.pdf',
    monthlyInstallment: 2100000, // pokok 2.000.000 + bunga 100.000
    remainingBalance: 8000000, // sesudah diangsur 2 kali
    status: 'disetujui',
    approvedBy: 'Retno Putri (Bendahara)',
    approvalDate: '2026-02-21'
  },
  {
    id: 'pj-3',
    memberId: 'agt-003',
    memberName: 'Bambang Triyono',
    memberNumber: 'FSP-2026-0003',
    date: '2026-05-15',
    type: 'darurat',
    amount: 5000000,
    interestRate: 12,
    tenor: 3,
    purpose: 'Biaya Berobat Rumah Sakit Keluarga',
    guaranteeName: 'Laptop Asus Core i5 2022',
    guaranteeFile: 'kuitansi_laptop_asus.pdf',
    monthlyInstallment: 1716666,
    remainingBalance: 5000000,
    status: 'pending'
  }
];

export const INITIAL_ANGSURAN: Angsuran[] = [
  // Pinjaman 1 - Adi Wijaya (Angsuran Ke-1, ke-2 dibayar)
  {
    id: 'ang-1',
    loanId: 'pj-1',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-03-05',
    installmentNumber: 1,
    amount: 2800000,
    principal: 2500000,
    interest: 300000,
    penalty: 0,
    paymentDate: '2026-03-04',
    status: 'paid',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'ang-2',
    loanId: 'pj-1',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-04-05',
    installmentNumber: 2,
    amount: 2800000,
    principal: 2500000,
    interest: 300000,
    penalty: 50000, // Terlambat bayar
    paymentDate: '2026-04-08',
    status: 'paid',
    createdBy: 'Heri Kurniawan'
  },
  // Angsuran Ke-3 belum dibayar (Jatuh tempo 2026-05-05) - status "unpaid" (menunggak)
  {
    id: 'ang-3',
    loanId: 'pj-1',
    memberId: 'agt-001',
    memberName: 'Adi Wijaya',
    memberNumber: 'FSP-2026-0001',
    date: '2026-05-05',
    installmentNumber: 3,
    amount: 2800000,
    principal: 2500000,
    interest: 300000,
    penalty: 150000, // Penalti menunggak terus bertambah
    status: 'unpaid'
  },
  
  // Pinjaman 2 - Siti Rahmawati (Angsuran Ke-1, ke-2 dibayar)
  {
    id: 'ang-4',
    loanId: 'pj-2',
    memberId: 'agt-002',
    memberName: 'Siti Rahmawati',
    memberNumber: 'FSP-2026-0002',
    date: '2026-03-20',
    installmentNumber: 1,
    amount: 2100000,
    principal: 2000000,
    interest: 100000,
    penalty: 0,
    paymentDate: '2026-03-20',
    status: 'paid',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'ang-5',
    loanId: 'pj-2',
    memberId: 'agt-002',
    memberName: 'Siti Rahmawati',
    memberNumber: 'FSP-2026-0002',
    date: '2026-04-20',
    installmentNumber: 2,
    amount: 2100000,
    principal: 2000000,
    interest: 100000,
    penalty: 0,
    paymentDate: '2026-04-20',
    status: 'paid',
    createdBy: 'Heri Kurniawan'
  },
  // Angsuran Ke-3 belum dibayar (jatuh tempo 2026-05-20) - unpaid (baru terlewat dikit)
  {
    id: 'ang-6',
    loanId: 'pj-2',
    memberId: 'agt-002',
    memberName: 'Siti Rahmawati',
    memberNumber: 'FSP-2026-0002',
    date: '2026-05-20',
    installmentNumber: 3,
    amount: 2100000,
    principal: 2000000,
    interest: 100000,
    penalty: 10000,
    status: 'unpaid'
  }
];

export const INITIAL_KAS: KasEntry[] = [
  {
    id: 'kas-1',
    date: '2026-01-02',
    type: 'masuk',
    category: 'Penerimaan Modal Pendirian',
    amount: 20000000,
    description: 'Penerimaan dana hibah pemrakarsa pendirian Koperasi Forsdig',
    createdBy: 'Retno Putri'
  },
  {
    id: 'kas-2',
    date: '2026-02-15',
    type: 'keluar',
    category: 'Membeli ATK & Alat Tulis',
    amount: 450000,
    description: 'Pembelian kertas, pulpen, kuitansi, stempel koperasi',
    createdBy: 'Heri Kurniawan'
  },
  {
    id: 'kas-3',
    date: '2026-03-01',
    type: 'keluar',
    category: 'Membeli Peralatan Kantor',
    amount: 15000000,
    description: 'Pembelian Meja, Kursi, Lemari Arsip Besi',
    createdBy: 'Retno Putri'
  },
  {
    id: 'kas-4',
    date: '2026-04-01',
    type: 'keluar',
    category: 'Membayar Gaji Karyawan',
    amount: 2500000,
    description: 'Pembayaran gaji pengelola koperasi bulan Maret',
    createdBy: 'Retno Putri'
  },
  {
    id: 'kas-5',
    date: '2026-04-28',
    type: 'keluar',
    category: 'Operasional Bulanan',
    amount: 300000,
    description: 'Bayar Wifi Speedy & Abonemen Listrik PLN',
    createdBy: 'Heri Kurniawan'
  }
];

export const INITIAL_JURNAL: JurnalEntry[] = [
  {
    id: 'jr-1',
    date: '2026-01-02',
    refNumber: 'JU-2026-0001',
    description: 'Mencatat modal hibah pendirian koperasi',
    items: [
      { accountCode: '1101', accountName: 'Kas Utama (Brankas)', debit: 20000000, credit: 0 },
      { accountCode: '3101', name: 'Modal Pendirian Koperasi', debit: 0, credit: 20000000 }
    ] as any,
    createdBy: 'Retno Putri'
  },
  {
    id: 'jr-2',
    date: '2026-01-10',
    refNumber: 'JU-2026-0002',
    description: 'Mencatat setoran Simpanan Pokok Adi Wijaya',
    items: [
      { accountCode: '1101', accountName: 'Kas Utama (Brankas)', debit: 10000000, credit: 0 },
      { accountCode: '2101', name: 'Simpanan Pokok Anggota', debit: 0, credit: 10000000 }
    ] as any,
    createdBy: 'Retno Putri'
  },
  {
    id: 'jr-3',
    date: '2026-02-15',
    refNumber: 'JU-2026-0003',
    description: 'Mencatat pembelian ATK Kantor secara tunai',
    items: [
      { accountCode: '5102', accountName: 'Beban Perlengkapan & ATK', debit: 450000, credit: 0 },
      { accountCode: '1101', name: 'Kas Utama (Brankas)', debit: 0, credit: 450000 }
    ] as any,
    createdBy: 'Retno Putri'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-24T06:00:00Z',
    userId: 'usr-1',
    userName: 'Radit Widjaya',
    userRole: 'super_admin',
    action: 'Inisialisasi Sistem',
    details: 'Melakukan backup periodik database koperasi automatik.'
  },
  {
    id: 'log-2',
    timestamp: '2026-05-24T06:15:00Z',
    userId: 'usr-3',
    userName: 'Retno Putri',
    userRole: 'bendahara',
    action: 'Acc Pinjaman',
    details: 'Meyetujui pengajuan pinjaman modal usaha Adi Wijaya senilai Rp 30.000.000.'
  }
];

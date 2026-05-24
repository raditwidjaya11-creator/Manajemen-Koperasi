/**
 * Core types for Forsdig Simpan Pinjam
 */

export type UserRole = 'super_admin' | 'admin' | 'bendahara' | 'kasir' | 'anggota';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  branch?: string;
  status: 'active' | 'inactive';
}

export interface Anggota {
  id: string;
  memberNumber: string;
  name: string;
  nik: string;
  address: string;
  phone: string;
  occupation: string;
  joinDate: string;
  photoUrl: string;
  status: 'active' | 'inactive';
}

export type SimpananType = 'pokok' | 'wajib' | 'sukarela';
export type MutationType = 'setor' | 'tarik';

export interface Simpanan {
  id: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  date: string;
  type: SimpananType;
  mutation: MutationType;
  amount: number;
  description: string;
  createdBy: string;
}

export type PinjamanType = 'pendidikan' | 'modal_usaha' | 'konsumtif' | 'darurat';
export type PinjamanStatus = 'pending' | 'disetujui' | 'lunas' | 'menunggak' | 'ditolak';

export interface Pinjaman {
  id: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  date: string;
  type: PinjamanType;
  amount: number;
  interestRate: number; // yearly rate e.g. 12 for 12%
  tenor: number; // months
  purpose: string;
  guaranteeName: string;
  guaranteeFile?: string; // base64 or mock filename
  monthlyInstallment: number;
  remainingBalance: number;
  status: PinjamanStatus;
  approvedBy?: string;
  approvalDate?: string;
  installmentFrequency?: 'monthly' | 'daily';
}

export interface Angsuran {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  date: string; // schedule or payment date
  installmentNumber: number;
  amount: number;
  principal: number;
  interest: number;
  penalty: number;
  paymentDate?: string; // date of actual payment
  status: 'paid' | 'unpaid';
  createdBy?: string;
  collectorName?: string;
}

export interface AccountCOA {
  code: string;
  name: string;
  category: 'aset' | 'kewajiban' | 'ekuitas' | 'pendapatan' | 'beban';
  balance: number;
}

export interface JurnalItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JurnalEntry {
  id: string;
  date: string;
  refNumber: string;
  description: string;
  items: JurnalItem[];
  createdBy: string;
}

export interface KasEntry {
  id: string;
  date: string;
  type: 'masuk' | 'keluar';
  category: string;
  amount: number;
  description: string;
  attachment?: string;
  createdBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface CooperativeSummary {
  totalSimpanan: number;
  totalPinjaman: number;
  totalAngsuran: number;
  totalKasMasuk: number;
  totalKasKeluar: number;
  totalDenda: number;
  labaRugi: number;
  jumlahAnggotaAktif: number;
  totalTunggakan: number;
}

export interface Collector {
  id: string; // Nomor ID Karyawan Penagih
  name: string; // Nama Lengkap Penagih
  phone: string; // Nomor HP Penagih
  email: string; // Email Penagih
}

export interface CooperativeSettings {
  adminName: string;
  ketuaName: string;
  collectorName: string;
  collectors?: Collector[];
}

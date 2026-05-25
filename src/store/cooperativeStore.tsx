import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AppUser, 
  Anggota, 
  Simpanan, 
  Pinjaman, 
  Angsuran, 
  AccountCOA, 
  JurnalEntry, 
  KasEntry, 
  ActivityLog,
  UserRole,
  CooperativeSettings
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_COA, 
  INITIAL_ANGGOTA, 
  INITIAL_SIMPANAN, 
  INITIAL_PINJAMAN, 
  INITIAL_ANGSURAN, 
  INITIAL_KAS, 
  INITIAL_JURNAL, 
  INITIAL_LOGS 
} from '../utils/seedData';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError, testConnection } from '../firebase/firebase';

interface CooperativeContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  anggota: Anggota[];
  simpanan: Simpanan[];
  pinjaman: Pinjaman[];
  angsuran: Angsuran[];
  coa: AccountCOA[];
  jurnal: JurnalEntry[];
  kas: KasEntry[];
  logs: ActivityLog[];
  darkMode: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  addKasNonTransactional: (data: Omit<KasEntry, 'id'>) => void;
  
  // Auth actions
  login: (email: string, password?: string) => Promise<boolean>;
  loginGoogle: () => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: AppUser | null) => void;
  
  // Theme
  toggleDarkMode: () => void;
  
  // Members CRUD
  addAnggota: (data: Omit<Anggota, 'id' | 'memberNumber'>) => void;
  updateAnggota: (id: string, data: Partial<Anggota>) => void;
  deleteAnggota: (id: string) => void;
  
  // Simpanan transactions
  addSimpanan: (data: Omit<Simpanan, 'id' | 'memberName' | 'memberNumber'>) => void;
  
  // Pinjaman transactions
  applyPinjaman: (data: Omit<Pinjaman, 'id' | 'memberName' | 'memberNumber' | 'monthlyInstallment' | 'remainingBalance' | 'status'>) => void;
  approvePinjaman: (id: string, approvedBy: string) => void;
  rejectPinjaman: (id: string) => void;
  
  // Angsuran payments
  payAngsuran: (angsuranId: string, penalty: number, createdBy: string, collectorName?: string) => void;
  
  // Kas CRUD
  addKas: (data: Omit<KasEntry, 'id'>) => void;
  
  // COA & Manual Jurnal
  addJurnalEntry: (entry: Omit<JurnalEntry, 'id'>) => void;
  
  // User Management
  addUser: (data: Omit<AppUser, 'id'>) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  
  // System backups
  backupDatabase: () => string;
  restoreDatabase: (json: string) => boolean;
  clearDatabase: () => void;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  resetCooperativeToSeed: () => void;

  // Cooperative administrative settings
  cooperativeSettings: CooperativeSettings;
  updateCooperativeSettings: (settings: Partial<CooperativeSettings>) => void;
}

const CooperativeContext = createContext<CooperativeContextType | undefined>(undefined);

export const CooperativeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local persistent values for user and dark mode UI
  const [currentUser, setCurrentUserUI] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('fsp_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fsp_dark_mode') === 'true';
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Firestore sync targets
  const [users, setUsers] = useState<AppUser[]>([]);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [simpanan, setSimpanan] = useState<Simpanan[]>([]);
  const [pinjaman, setPinjaman] = useState<Pinjaman[]>([]);
  const [angsuran, setAngsuran] = useState<Angsuran[]>([]);
  const [coa, setCoa] = useState<AccountCOA[]>([]);
  const [jurnal, setJurnal] = useState<JurnalEntry[]>([]);
  const [kas, setKas] = useState<KasEntry[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [cooperativeSettings, setCooperativeSettings] = useState<CooperativeSettings>({
    adminName: 'Retno Putri',
    ketuaName: 'M. Yusuf Syahrial, SE',
    collectorName: 'Budi Santoso',
    collectors: [
      { id: 'COLL-001', name: 'Budi Santoso', phone: '081234567891', email: 'budi.santoso@forsdig.com' },
      { id: 'COLL-002', name: 'Rian Wijaya', phone: '081234567892', email: 'rian.wijaya@forsdig.com' }
    ]
  });

  // Test connection and auto seed if empty
  useEffect(() => {
    const initializeData = async () => {
      try {
        await testConnection();
        const coaSnap = await getDocs(collection(db, 'coa'));
        if (coaSnap.empty) {
          console.log('Firestore is empty. Initializing with seed data...');
          const seedJobs = [
            { path: 'users', list: INITIAL_USERS },
            { path: 'anggota', list: INITIAL_ANGGOTA },
            { path: 'simpanan', list: INITIAL_SIMPANAN },
            { path: 'pinjaman', list: INITIAL_PINJAMAN },
            { path: 'angsuran', list: INITIAL_ANGSURAN },
            { path: 'coa', list: INITIAL_COA },
            { path: 'jurnal', list: INITIAL_JURNAL },
            { path: 'kas', list: INITIAL_KAS },
            { path: 'logs', list: INITIAL_LOGS },
          ];

          for (const job of seedJobs) {
            for (const item of job.list) {
              const docId = (item as any).id || (item as any).code;
              await setDoc(doc(db, job.path, docId), item);
            }
          }

          const initialSettings = {
            adminName: 'Retno Putri',
            ketuaName: 'M. Yusuf Syahrial, SE',
            collectorName: 'Budi Santoso',
            collectors: [
              { id: 'COLL-001', name: 'Budi Santoso', phone: '081234567891', email: 'budi.santoso@forsdig.com' },
              { id: 'COLL-002', name: 'Rian Wijaya', phone: '081234567892', email: 'rian.wijaya@forsdig.com' }
            ]
          };
          await setDoc(doc(db, 'settings', 'cooperative'), initialSettings);
        }
      } catch (error) {
        console.error('Initial seeding or connection test failed:', error);
      }
    };
    initializeData();
  }, []);

  // Set up real-time bidirectional listeners to synchronize data automatically
  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'users'), (snap) => {
        const data: AppUser[] = [];
        snap.forEach(d => data.push(d.data() as AppUser));
        if (data.length > 0) setUsers(data);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users')),

      onSnapshot(collection(db, 'anggota'), (snap) => {
        const data: Anggota[] = [];
        snap.forEach(d => data.push(d.data() as Anggota));
        setAnggota(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'anggota')),

      onSnapshot(collection(db, 'simpanan'), (snap) => {
        const data: Simpanan[] = [];
        snap.forEach(d => data.push(d.data() as Simpanan));
        setSimpanan(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'simpanan')),

      onSnapshot(collection(db, 'pinjaman'), (snap) => {
        const data: Pinjaman[] = [];
        snap.forEach(d => data.push(d.data() as Pinjaman));
        setPinjaman(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'pinjaman')),

      onSnapshot(collection(db, 'angsuran'), (snap) => {
        const data: Angsuran[] = [];
        snap.forEach(d => data.push(d.data() as Angsuran));
        setAngsuran(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'angsuran')),

      onSnapshot(collection(db, 'coa'), (snap) => {
        const data: AccountCOA[] = [];
        snap.forEach(d => data.push(d.data() as AccountCOA));
        if (data.length > 0) {
          setCoa(data.sort((a, b) => a.code.localeCompare(b.code)));
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'coa')),

      onSnapshot(collection(db, 'jurnal'), (snap) => {
        const data: JurnalEntry[] = [];
        snap.forEach(d => data.push(d.data() as JurnalEntry));
        setJurnal(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'jurnal')),

      onSnapshot(collection(db, 'kas'), (snap) => {
        const data: KasEntry[] = [];
        snap.forEach(d => data.push(d.data() as KasEntry));
        setKas(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'kas')),

      onSnapshot(collection(db, 'logs'), (snap) => {
        const data: ActivityLog[] = [];
        snap.forEach(d => data.push(d.data() as ActivityLog));
        setLogs(data.sort((a, b) => b.id.localeCompare(a.id)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'logs')),

      onSnapshot(doc(db, 'settings', 'cooperative'), (snap) => {
        if (snap.exists()) {
          setCooperativeSettings(snap.data() as CooperativeSettings);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/cooperative')),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // UI state persistence
  useEffect(() => {
    localStorage.setItem('fsp_current_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fsp_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const updateCooperativeSettings = async (newSettings: Partial<CooperativeSettings>) => {
    try {
      const updated = {
        ...cooperativeSettings,
        ...newSettings
      };
      await setDoc(doc(db, 'settings', 'cooperative'), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/cooperative');
    }
  };

  const addLog = async (action: string, details: string) => {
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Guest User',
      userRole: currentUser?.role || 'anggota',
      action,
      details
    };
    try {
      await setDoc(doc(db, 'logs', logId), newLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `logs/${logId}`);
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && found.status === 'active') {
      setCurrentUserUI(found);
      await addLog('Login', `User ${found.name} login via email/password`);
      return true;
    }
    return false;
  };

  const loginGoogle = async (): Promise<boolean> => {
    setCurrentUserUI(INITIAL_USERS[0]);
    await addLog('Login Google', `User ${INITIAL_USERS[0].name} melakukan login Google Auth`);
    return true;
  };

  const logout = () => {
    addLog('Logout', `User ${currentUser?.name} keluar dari sistem`);
    setCurrentUserUI(null);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Helper to adjust COA balances in Firestore
  const adjustCOABalance = async (code: string, debitAmount: number, creditAmount: number) => {
    const account = coa.find(a => a.code === code);
    if (!account) return;
    let change = 0;
    if (account.category === 'aset' || account.category === 'beban') {
      change = debitAmount - creditAmount;
    } else {
      change = creditAmount - debitAmount;
    }
    try {
      await updateDoc(doc(db, 'coa', code), {
        balance: account.balance + change
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `coa/${code}`);
    }
  };

  // Post dynamic Journal entries automatically from operations
  const postAutoJournal = async (
    description: string, 
    debits: {code: string, name: string, amount: number}[], 
    credits: {code: string, name: string, amount: number}[]
  ) => {
    const journalId = `jr-${Date.now()}`;
    const refNum = `JU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const items = [
      ...debits.map(d => ({ accountCode: d.code, accountName: d.name, debit: d.amount, credit: 0 })),
      ...credits.map(c => ({ accountCode: c.code, accountName: c.name, debit: 0, credit: c.amount }))
    ];

    const newEntry: JurnalEntry = {
      id: journalId,
      date: new Date().toISOString().split('T')[0],
      refNumber: refNum,
      description,
      items,
      createdBy: currentUser?.name || 'Sistem Otomatis'
    };

    try {
      await setDoc(doc(db, 'jurnal', journalId), newEntry);
      
      // Apply adjustments standard double entry bookkeeping
      for (const d of debits) {
        await adjustCOABalance(d.code, d.amount, 0);
      }
      for (const c of credits) {
        await adjustCOABalance(c.code, 0, c.amount);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `jurnal/${journalId}`);
    }
  };

  // —— MEMBERS CONTROLLER ——
  const addAnggota = async (data: Omit<Anggota, 'id' | 'memberNumber'>) => {
    const newId = `agt-${Date.now()}`;
    const dateObj = new Date();
    const formattedYear = dateObj.getFullYear();
    const countStr = String(anggota.length + 1).padStart(4, '0');
    const memberNo = `FSP-${formattedYear}-${countStr}`;

    const newMember: Anggota = {
      ...data,
      id: newId,
      memberNumber: memberNo,
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    };

    try {
      await setDoc(doc(db, 'anggota', newId), newMember);
      await addLog('Tambah Anggota', `Mendaftarkan anggota baru ${data.name} dengan No Anggota ${memberNo}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `anggota/${newId}`);
    }
  };

  const updateAnggota = async (id: string, data: Partial<Anggota>) => {
    try {
      await updateDoc(doc(db, 'anggota', id), data);
      const target = anggota.find(m => m.id === id);
      await addLog('Edit Anggota', `Memperbarui data anggota ${target?.name || id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `anggota/${id}`);
    }
  };

  const deleteAnggota = async (id: string) => {
    try {
      const target = anggota.find(m => m.id === id);
      await deleteDoc(doc(db, 'anggota', id));
      await addLog('Hapus Anggota', `Menghapus anggota ${target?.name || id} dari database`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `anggota/${id}`);
    }
  };

  // —— SAVINGS (SIMPANAN) CONTROLLER ——
  const addSimpanan = async (data: Omit<Simpanan, 'id' | 'memberName' | 'memberNumber'>) => {
    const memberObj = anggota.find(m => m.id === data.memberId);
    if (!memberObj) return;

    const newId = `smp-${Date.now()}`;
    const newTransaction: Simpanan = {
      ...data,
      id: newId,
      memberName: memberObj.name,
      memberNumber: memberObj.memberNumber
    };

    try {
      await setDoc(doc(db, 'simpanan', newId), newTransaction);

      const amountVal = data.amount;
      const isSetor = data.mutation === 'setor';
      
      let coaTargetCode = '2103'; // sukarela default
      let coaTargetName = 'Simpanan Sukarela Anggota';
      if (data.type === 'pokok') {
        coaTargetCode = '2101';
        coaTargetName = 'Simpanan Pokok Anggota';
      } else if (data.type === 'wajib') {
        coaTargetCode = '2102';
        coaTargetName = 'Simpanan Wajib Anggota';
      }

      if (isSetor) {
        await postAutoJournal(
          `Setoran Simpanan ${data.type.toUpperCase()} - ${memberObj.name}`,
          [{ code: '1101', name: 'Kas Utama (Brankas)', amount: amountVal }],
          [{ code: coaTargetCode, name: coaTargetName, amount: amountVal }]
        );
        
        const newKas: KasEntry = {
          id: `kas-${Date.now()}`,
          date: data.date,
          type: 'masuk',
          category: `Setoran Simpanan ${data.type}`,
          amount: amountVal,
          description: `Setoran simpanan ${data.type} oleh ${memberObj.name} (${memberObj.memberNumber})`,
          createdBy: data.createdBy
        };
        await setDoc(doc(db, 'kas', newKas.id), newKas);
      } else {
        await postAutoJournal(
          `Penarikan Simpanan ${data.type.toUpperCase()} - ${memberObj.name}`,
          [{ code: coaTargetCode, name: coaTargetName, amount: amountVal }],
          [{ code: '1101', name: 'Kas Utama (Brankas)', amount: amountVal }]
        );

        const newKas: KasEntry = {
          id: `kas-${Date.now()}`,
          date: data.date,
          type: 'keluar',
          category: `Penarikan Simpanan ${data.type}`,
          amount: amountVal,
          description: `Penarikan simpanan ${data.type} oleh ${memberObj.name} (${memberObj.memberNumber})`,
          createdBy: data.createdBy
        };
        await setDoc(doc(db, 'kas', newKas.id), newKas);
      }

      await addLog('Setoran/Penarikan', `Mencatat mutasi ${data.mutation} Rp ${data.amount.toLocaleString()} untuk simpanan ${data.type} atas nama ${memberObj.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `simpanan/${newId}`);
    }
  };

  // —— LOANS (PINJAMAN) CONTROLLER ——
  const applyPinjaman = async (
    data: Omit<Pinjaman, 'id' | 'memberName' | 'memberNumber' | 'monthlyInstallment' | 'remainingBalance' | 'status'>
  ) => {
    const memberObj = anggota.find(m => m.id === data.memberId);
    if (!memberObj) return;

    const isDaily = data.installmentFrequency === 'daily';
    const rate = isDaily
      ? (data.interestRate / 100) / 360
      : (data.interestRate / 100) / 12;
    const principal = data.amount / data.tenor;
    const interest = data.amount * rate;
    const installment = Math.round(principal + interest);

    const newId = `pj-${Date.now()}`;
    const newLoan: Pinjaman = {
      ...data,
      id: newId,
      memberName: memberObj.name,
      memberNumber: memberObj.memberNumber,
      monthlyInstallment: installment,
      remainingBalance: data.amount,
      status: 'pending'
    };

    try {
      await setDoc(doc(db, 'pinjaman', newId), newLoan);
      await addLog('Pengajuan Pinjaman', `Mengajukan pinjaman ${data.type.replace('_',' ')} senilai Rp ${data.amount.toLocaleString()} oleh ${memberObj.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pinjaman/${newId}`);
    }
  };

  const approvePinjaman = async (id: string, approvedBy: string) => {
    const loan = pinjaman.find(l => l.id === id);
    if (!loan) return;

    const updatedLoan = {
      ...loan,
      status: 'disetujui' as const,
      approvedBy,
      approvalDate: new Date().toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, 'pinjaman', id), updatedLoan);

      await postAutoJournal(
        `Pencairan Pinjaman ${loan.type.toUpperCase()} - ${loan.memberName}`,
        [{ code: '1201', name: 'Piutang Pinjaman Anggota', amount: loan.amount }],
        [{ code: '1101', name: 'Kas Utama (Brankas)', amount: loan.amount }]
      );

      const cKas: KasEntry = {
        id: `kas-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'keluar',
        category: 'Pencairan Pinjaman Anggota',
        amount: loan.amount,
        description: `Pencairan dana pinjaman untuk ${loan.memberName} (${loan.memberNumber})`,
        createdBy: approvedBy
      };
      await setDoc(doc(db, 'kas', cKas.id), cKas);

      const isDaily = loan.installmentFrequency === 'daily';
      const divisor = isDaily ? 360 : 12;
      const principal = loan.amount / loan.tenor;
      const interest = loan.amount * ((loan.interestRate / 100) / divisor);

      for (let i = 1; i <= loan.tenor; i++) {
        const dueDate = new Date();
        if (isDaily) {
          dueDate.setDate(dueDate.getDate() + i);
        } else {
          dueDate.setMonth(dueDate.getMonth() + i);
        }
        
        const instId = `ang-sch-${loan.id}-${i}`;
        const newInstallment: Angsuran = {
          id: instId,
          loanId: loan.id,
          memberId: loan.memberId,
          memberName: loan.memberName,
          memberNumber: loan.memberNumber,
          date: dueDate.toISOString().split('T')[0],
          installmentNumber: i,
          amount: loan.monthlyInstallment,
          principal: Math.round(principal),
          interest: Math.round(interest),
          penalty: 0,
          status: 'unpaid'
        };
        await setDoc(doc(db, 'angsuran', instId), newInstallment);
      }

      await addLog('Persetujuan Pinjaman', `Menyetujui pinjaman Rp ${loan.amount.toLocaleString()} milik ${loan.memberName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pinjaman/${id}`);
    }
  };

  const rejectPinjaman = async (id: string) => {
    try {
      await updateDoc(doc(db, 'pinjaman', id), { status: 'ditolak' });
      const target = pinjaman.find(l => l.id === id);
      await addLog('Penolakan Pinjaman', `Menolak pengajuan pinjaman Rp ${target?.amount.toLocaleString()} milik ${target?.memberName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `pinjaman/${id}`);
    }
  };

  // —— REPAYMENT (ANGSURAN) CONTROLLER ——
  const payAngsuran = async (angsuranId: string, penalty: number, createdBy: string, collectorName?: string) => {
    const target = angsuran.find(item => item.id === angsuranId);
    if (!target) return;

    const affectedLoanId = target.loanId;
    const memberNameSaved = target.memberName;
    const totalAmt = target.amount + penalty;

    const debits = [{ code: '1101', name: 'Kas Utama (Brankas)', amount: totalAmt }];
    const credits = [
      { code: '1201', name: 'Piutang Pinjaman Anggota', amount: target.principal },
      { code: '4101', name: 'Pendapatan Jasa Bunga Pinjaman', amount: target.interest }
    ];
    if (penalty > 0) {
      credits.push({ code: '4103', name: 'Pendapatan Denda Keterlambatan', amount: penalty });
    }

    try {
      await postAutoJournal(
        `Bayar Angsuran #${target.installmentNumber} - ${target.memberName}` + (collectorName ? ` (Ditagih: ${collectorName})` : ''),
        debits,
        credits
      );

      const cKas: KasEntry = {
        id: `kas-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'masuk',
        category: 'Pembayaran Angsuran Pinjaman',
        amount: totalAmt,
        description: `Pembayaran angsuran ke-${target.installmentNumber} untuk pinjaman ${target.memberName} (${target.memberNumber})` + (collectorName ? ` (Karyawan Penagih: ${collectorName})` : ''),
        createdBy
      };
      await setDoc(doc(db, 'kas', cKas.id), cKas);

      const updatedInstallment: Angsuran = {
        ...target,
        penalty,
        totalPaid: totalAmt,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'paid',
        createdBy,
        collectorName: collectorName || '-'
      };

      await setDoc(doc(db, 'angsuran', angsuranId), updatedInstallment);

      if (affectedLoanId) {
        const loan = pinjaman.find(l => l.id === affectedLoanId);
        if (loan) {
          const principalReduction = target.principal;
          const newRemaining = Math.max(0, loan.remainingBalance - principalReduction);
          
          const brotherInstallments = angsuran.filter(x => x.loanId === affectedLoanId && x.id !== angsuranId);
          const allPaid = brotherInstallments.every(x => x.status === 'paid');

          await updateDoc(doc(db, 'pinjaman', affectedLoanId), {
            remainingBalance: newRemaining,
            status: (newRemaining <= 0 || allPaid) ? 'lunas' : 'disetujui'
          });
        }
      }

      await addLog('Pembayaran Angsuran', `Melakukan input pembayaran cicilan untuk ${memberNameSaved} senilai Rp ${totalAmt.toLocaleString()}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `angsuran/${angsuranId}`);
    }
  };

  // —— CASH FLOW (KAS MOVEMENTS) ——
  const addKas = async (data: Omit<KasEntry, 'id'>) => {
    const newId = `kas-${Date.now()}`;
    const newKas: KasEntry = {
      ...data,
      id: newId
    };

    try {
      await setDoc(doc(db, 'kas', newId), newKas);

      if (data.type === 'masuk') {
        await postAutoJournal(
          `Kas Masuk: ${data.category} - ${data.description}`,
          [{ code: '1101', name: 'Kas Utama (Brankas)', amount: data.amount }],
          [{ code: '4102', name: 'Pendapatan Operasional Lainnya', amount: data.amount }]
        );
      } else {
        await postAutoJournal(
          `Kas Keluar: ${data.category} - ${data.description}`,
          [{ code: '5102', name: 'Beban Operasional Lainnya', amount: data.amount }],
          [{ code: '1101', name: 'Kas Utama (Brankas)', amount: data.amount }]
        );
      }

      await addLog('Kas Baru', `Memasukkan kas ${data.type} Rp ${data.amount.toLocaleString()} dengan kategori ${data.category}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `kas/${newId}`);
    }
  };

  // —— GENERAL BOOKKEEPING COA & JOURNAL ——
  const addJurnalEntry = async (entry: Omit<JurnalEntry, 'id'>) => {
    const newId = `jr-${Date.now()}`;
    const newEntry: JurnalEntry = {
      ...entry,
      id: newId
    };

    try {
      await setDoc(doc(db, 'jurnal', newId), newEntry);

      for (const item of entry.items) {
        await adjustCOABalance(item.accountCode, item.debit, item.credit);
      }

      await addLog('Transaksi Jurnal', `Menuliskan entri jurnal manual: "${entry.description}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `jurnal/${newId}`);
    }
  };

  // —— USER MANAGEMENT ——
  const addUser = async (data: Omit<AppUser, 'id'>) => {
    const newId = `usr-${Date.now()}`;
    const newUser: AppUser = {
      id: newId,
      ...data
    };
    try {
      await setDoc(doc(db, 'users', newId), newUser);
      await addLog('Tambah User', `Menambahkan pengguna sistem baru: ${data.name} (${data.role})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${newId}`);
    }
  };

  const updateUser = async (id: string, data: Partial<AppUser>) => {
    try {
      await updateDoc(doc(db, 'users', id), data);
      const target = users.find(u => u.id === id);
      await addLog('Edit User', `Mengubah profil pengguna: ${target?.name || id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) return;
    try {
      const target = users.find(u => u.id === id);
      await deleteDoc(doc(db, 'users', id));
      await addLog('Hapus User', `Menghapus akses user: ${target?.name || id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  // —— SYSTEM AND DATA UTILITIES (BACKUP & RESTORE) ——
  const backupDatabase = () => {
    const fullBackup = {
      users,
      anggota,
      simpanan,
      pinjaman,
      angsuran,
      coa,
      jurnal,
      kas,
      logs
    };
    addLog('Backup', 'Melakukan ekspor backup database koperasi lengkap');
    return JSON.stringify(fullBackup, null, 2);
  };

  const restoreDatabase = (json: string): boolean => {
    const performRestore = async () => {
      try {
        const data = JSON.parse(json);
        if (data.anggota && data.simpanan && data.pinjaman && data.coa) {
          const collections = ['users', 'anggota', 'simpanan', 'pinjaman', 'angsuran', 'coa', 'jurnal', 'kas', 'logs'];
          for (const col of collections) {
            const snap = await getDocs(collection(db, col));
            for (const docItem of snap.docs) {
              await deleteDoc(doc(db, col, docItem.id));
            }
          }

          const restores = [
            { name: 'users', list: data.users || [] },
            { name: 'anggota', list: data.anggota || [] },
            { name: 'simpanan', list: data.simpanan || [] },
            { name: 'pinjaman', list: data.pinjaman || [] },
            { name: 'angsuran', list: data.angsuran || [] },
            { name: 'coa', list: data.coa || [] },
            { name: 'jurnal', list: data.jurnal || [] },
            { name: 'kas', list: data.kas || [] },
            { name: 'logs', list: data.logs || [] },
          ];

          for (const r of restores) {
            for (const item of r.list) {
              const docId = item.id || item.code || `item-${Date.now()}-${Math.random()}`;
              await setDoc(doc(db, r.name, docId), item);
            }
          }

          await addLog('Restore', 'Berhasil memulihkan / restore database koperasi dari file backup luar');
        }
      } catch (e) {
        console.error('Database restore error:', e);
      }
    };
    performRestore();
    return true;
  };

  const clearDatabase = async () => {
    try {
      const collections = ['users', 'anggota', 'simpanan', 'pinjaman', 'angsuran', 'coa', 'jurnal', 'kas', 'logs'];
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        for (const docItem of snap.docs) {
          await deleteDoc(doc(db, col, docItem.id));
        }
      }

      for (const user of INITIAL_USERS) {
        await setDoc(doc(db, 'users', user.id), user);
      }
      for (const c of INITIAL_COA) {
        await setDoc(doc(db, 'coa', c.code), c);
      }

      await addLog('Reset Sistem', 'Menghapus bersih seluruh data dinamis dan menyetel ulang ke bawaan');
    } catch (error) {
      console.error('Database clear failed:', error);
    }
  };

  return (
    <CooperativeContext.Provider value={{
      currentUser,
      users,
      anggota,
      simpanan,
      pinjaman,
      angsuran,
      coa,
      jurnal,
      kas,
      logs,
      darkMode,
      currentTab,
      setCurrentTab,
      addKasNonTransactional: addKas,
      login,
      loginGoogle,
      logout,
      setCurrentUser: setCurrentUserUI,
      toggleDarkMode,
      addAnggota,
      updateAnggota,
      deleteAnggota,
      addSimpanan,
      applyPinjaman,
      approvePinjaman,
      rejectPinjaman,
      payAngsuran,
      addKas,
      addJurnalEntry,
      addUser,
      updateUser,
      deleteUser,
      backupDatabase,
      restoreDatabase,
      clearDatabase,
      exportBackup: backupDatabase,
      importBackup: restoreDatabase,
      resetCooperativeToSeed: clearDatabase,
      cooperativeSettings,
      updateCooperativeSettings
    }}>
      {children}
    </CooperativeContext.Provider>
  );
};

export const useCooperative = () => {
  const context = useContext(CooperativeContext);
  if (context === undefined) {
    throw new Error('useCooperative must be used within a CooperativeProvider');
  }
  return context;
};

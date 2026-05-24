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

  // Cooperative administrative settings (Chairman, Admin, Collector lists)
  cooperativeSettings: CooperativeSettings;
  updateCooperativeSettings: (settings: Partial<CooperativeSettings>) => void;
}

const CooperativeContext = createContext<CooperativeContextType | undefined>(undefined);

export const CooperativeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Primary States with LocalStorage Hydration
  const [currentUser, setCurrentUserUI] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('fsp_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Auto log in as Super Admin for demonstration (Radit Widjaya)
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('fsp_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [anggota, setAnggota] = useState<Anggota[]>(() => {
    const saved = localStorage.getItem('fsp_anggota');
    return saved ? JSON.parse(saved) : INITIAL_ANGGOTA;
  });

  const [simpanan, setSimpanan] = useState<Simpanan[]>(() => {
    const saved = localStorage.getItem('fsp_simpanan');
    return saved ? JSON.parse(saved) : INITIAL_SIMPANAN;
  });

  const [pinjaman, setPinjaman] = useState<Pinjaman[]>(() => {
    const saved = localStorage.getItem('fsp_pinjaman');
    return saved ? JSON.parse(saved) : INITIAL_PINJAMAN;
  });

  const [angsuran, setAngsuran] = useState<Angsuran[]>(() => {
    const saved = localStorage.getItem('fsp_angsuran');
    return saved ? JSON.parse(saved) : INITIAL_ANGSURAN;
  });

  const [coa, setCoa] = useState<AccountCOA[]>(() => {
    const saved = localStorage.getItem('fsp_coa');
    return saved ? JSON.parse(saved) : INITIAL_COA;
  });

  const [jurnal, setJurnal] = useState<JurnalEntry[]>(() => {
    const saved = localStorage.getItem('fsp_jurnal');
    return saved ? JSON.parse(saved) : INITIAL_JURNAL;
  });

  const [kas, setKas] = useState<KasEntry[]>(() => {
    const saved = localStorage.getItem('fsp_kas');
    return saved ? JSON.parse(saved) : INITIAL_KAS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('fsp_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fsp_dark_mode') === 'true';
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [cooperativeSettings, setCooperativeSettings] = useState<CooperativeSettings>(() => {
    const saved = localStorage.getItem('fsp_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.collectors) {
          parsed.collectors = [
            { id: 'COLL-001', name: 'Budi Santoso', phone: '081234567891', email: 'budi.santoso@forsdig.com' },
            { id: 'COLL-002', name: 'Rian Wijaya', phone: '081234567892', email: 'rian.wijaya@forsdig.com' }
          ];
        } else {
          // Backward compatibility check to ensure existing cached collectors have phone/email fields
          parsed.collectors = parsed.collectors.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '081234567890',
            email: c.email || `${c.name.toLowerCase().replace(/\s+/g, '.')}@forsdig.com`
          }));
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      adminName: 'Retno Putri',
      ketuaName: 'M. Yusuf Syahrial, SE',
      collectorName: 'Budi Santoso',
      collectors: [
        { id: 'COLL-001', name: 'Budi Santoso', phone: '081234567891', email: 'budi.santoso@forsdig.com' },
        { id: 'COLL-002', name: 'Rian Wijaya', phone: '081234567892', email: 'rian.wijaya@forsdig.com' }
      ]
    };
  });

  // Track & Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('fsp_settings', JSON.stringify(cooperativeSettings));
  }, [cooperativeSettings]);

  const updateCooperativeSettings = (newSettings: Partial<CooperativeSettings>) => {
    setCooperativeSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Track & Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('fsp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fsp_anggota', JSON.stringify(anggota));
  }, [anggota]);

  useEffect(() => {
    localStorage.setItem('fsp_simpanan', JSON.stringify(simpanan));
  }, [simpanan]);

  useEffect(() => {
    localStorage.setItem('fsp_pinjaman', JSON.stringify(pinjaman));
  }, [pinjaman]);

  useEffect(() => {
    localStorage.setItem('fsp_angsuran', JSON.stringify(angsuran));
  }, [angsuran]);

  useEffect(() => {
    localStorage.setItem('fsp_coa', JSON.stringify(coa));
  }, [coa]);

  useEffect(() => {
    localStorage.setItem('fsp_jurnal', JSON.stringify(jurnal));
  }, [jurnal]);

  useEffect(() => {
    localStorage.setItem('fsp_kas', JSON.stringify(kas));
  }, [kas]);

  useEffect(() => {
    localStorage.setItem('fsp_logs', JSON.stringify(logs));
  }, [logs]);

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

  // Global logging helper
  const addLog = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Guest User',
      userRole: currentUser?.role || 'anggota',
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Login handlers
  const login = async (email: string, password?: string): Promise<boolean> => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && found.status === 'active') {
      setCurrentUserUI(found);
      addLog('Login', `User ${found.name} login via email/password`);
      return true;
    }
    return false;
  };

  const loginGoogle = async (): Promise<boolean> => {
    // For local fallback and testing, log in with main profile or create random
    setCurrentUserUI(INITIAL_USERS[0]);
    addLog('Login Google', `User ${INITIAL_USERS[0].name} melakukan login Google Auth`);
    return true;
  };

  const logout = () => {
    addLog('Logout', `User ${currentUser?.name} keluar dari sistem`);
    setCurrentUserUI(null);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Helper to adjust COA accounts ledger balances
  const adjustCOABalance = (code: string, debitAmount: number, creditAmount: number) => {
    setCoa(prevCoa => {
      return prevCoa.map(account => {
        if (account.code === code) {
          let change = 0;
          // Normal balance rules:
          // assets & expenses (aset & beban): + with Debits, - with Credits
          // liabilities, equity & revenues (kewajiban, ekuitas, pendapatan): + with Credits, - with Debits
          if (account.category === 'aset' || account.category === 'beban') {
            change = debitAmount - creditAmount;
          } else {
            change = creditAmount - debitAmount;
          }
          return {
            ...account,
            balance: account.balance + change
          };
        }
        return account;
      });
    });
  };

  // Post dynamic Journal entries automatically from operations
  const postAutoJournal = (description: string, debits: {code: string, name: string, amount: number}[], credits: {code: string, name: string, amount: number}[]) => {
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

    setJurnal(prev => [newEntry, ...prev]);

    // Apply adjustments to balance sheets under standard double entry accounting
    debits.forEach(d => adjustCOABalance(d.code, d.amount, 0));
    credits.forEach(c => adjustCOABalance(c.code, 0, c.amount));
  };

  // —— MEMBERS CONTROLLER ——
  const addAnggota = (data: Omit<Anggota, 'id' | 'memberNumber'>) => {
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

    setAnggota(prev => [newMember, ...prev]);
    addLog('Tambah Anggota', `Mendaftarkan anggota baru ${data.name} dengan No Anggota ${memberNo}`);
  };

  const updateAnggota = (id: string, data: Partial<Anggota>) => {
    setAnggota(prev => prev.map(m => m.id === id ? { ...m, ...data } as Anggota : m));
    const target = anggota.find(m => m.id === id);
    addLog('Edit Anggota', `Memperbarui data anggota ${target?.name || id}`);
  };

  const deleteAnggota = (id: string) => {
    const target = anggota.find(m => m.id === id);
    setAnggota(prev => prev.filter(m => m.id !== id));
    addLog('Hapus Anggota', `Menghapus anggota ${target?.name || id} dari database`);
  };

  // —— SAVINGS (SIMPANAN) CONTROLLER ——
  const addSimpanan = (data: Omit<Simpanan, 'id' | 'memberName' | 'memberNumber'>) => {
    const memberObj = anggota.find(m => m.id === data.memberId);
    if (!memberObj) return;

    const newId = `smp-${Date.now()}`;
    const newTransaction: Simpanan = {
      ...data,
      id: newId,
      memberName: memberObj.name,
      memberNumber: memberObj.memberNumber
    };

    setSimpanan(prev => [newTransaction, ...prev]);

    // Create automatically formatted bookkeeping journal entry & update cash register log
    const amountVal = data.amount;
    const isSetor = data.mutation === 'setor';
    
    // Choose specific account depending on type
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
      // Setor Simpanan: Debits Kas, Credits Simpanan Liabilities
      postAutoJournal(
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
      setKas(prev => [newKas, ...prev]);
    } else {
      // Penarikan Simpanan: Debits Simpanan Liabilities, Credits Kas
      postAutoJournal(
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
      setKas(prev => [newKas, ...prev]);
    }

    addLog('Setoran/Penarikan', `Mencatat mutasi ${data.mutation} Rp ${data.amount.toLocaleString()} untuk simpanan ${data.type} atas nama ${memberObj.name}`);
  };

  // —— LOANS (PINJAMAN) CONTROLLER ——
  const applyPinjaman = (data: Omit<Pinjaman, 'id' | 'memberName' | 'memberNumber' | 'monthlyInstallment' | 'remainingBalance' | 'status'>) => {
    const memberObj = anggota.find(m => m.id === data.memberId);
    if (!memberObj) return;

    // Standard annuity calculation: interest is simple flat interest monthly or daily
    // e.g. yearly rate = 12%. Flat interest rate = 1% per month or daily flat rate.
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

    setPinjaman(prev => [newLoan, ...prev]);
    addLog('Pengajuan Pinjaman', `Mengajukan pinjaman ${data.type.replace('_',' ')} senilai Rp ${data.amount.toLocaleString()} oleh ${memberObj.name}`);
  };

  const approvePinjaman = (id: string, approvedBy: string) => {
    const loan = pinjaman.find(l => l.id === id);
    if (!loan) return;

    const updatedLoan = {
      ...loan,
      status: 'disetujui' as const,
      approvedBy,
      approvalDate: new Date().toISOString().split('T')[0]
    };

    // Auto Post Journal on Pinjaman Disbursement (Cair):
    // Debits Piutang Pinjaman Anggota (1201), Credits Kas (1101)
    postAutoJournal(
      `Pencairan Pinjaman ${loan.type.toUpperCase()} - ${loan.memberName}`,
      [{ code: '1201', name: 'Piutang Pinjaman Anggota', amount: loan.amount }],
      [{ code: '1101', name: 'Kas Utama (Brankas)', amount: loan.amount }]
    );

    // Auto-insert Kas Keluar
    const cKas: KasEntry = {
      id: `kas-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'keluar',
      category: 'Pencairan Pinjaman Anggota',
      amount: loan.amount,
      description: `Pencairan dana pinjaman untuk ${loan.memberName} (${loan.memberNumber})`,
      createdBy: approvedBy
    };
    setKas(prev => [cKas, ...prev]);

    // Multi-month/day Installments generated dynamically so she can pay them on Angsuran UI!
    const generatedInstallments: Angsuran[] = [];
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
      
      generatedInstallments.push({
        id: `ang-sch-${loan.id}-${i}`,
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
      });
    }

    setPinjaman(prevLoans => prevLoans.map(l => l.id === id ? updatedLoan : l));
    setAngsuran(prev => {
      const filtered = prev.filter(a => a.loanId !== id);
      return [...generatedInstallments, ...filtered];
    });
    addLog('Persetujuan Pinjaman', `Menyetujui pinjaman Rp ${loan.amount.toLocaleString()} milik ${loan.memberName}`);
  };

  const rejectPinjaman = (id: string) => {
    setPinjaman(prev => prev.map(l => l.id === id ? { ...l, status: 'ditolak' } : l));
    const target = pinjaman.find(l => l.id === id);
    addLog('Penolakan Pinjaman', `Menolak pengajuan pinjaman Rp ${target?.amount.toLocaleString()} milik ${target?.memberName}`);
  };

  // —— REPAYMENT (ANGSURAN) CONTROLLER ——
  const payAngsuran = (angsuranId: string, penalty: number, createdBy: string, collectorName?: string) => {
    const target = angsuran.find(item => item.id === angsuranId);
    if (!target) return;

    const affectedLoanId = target.loanId;
    const memberNameSaved = target.memberName;
    const totalAmt = target.amount + penalty;

    // Perform Bookkeeping Double-Entry Accounting outside the updater call!
    const debits = [{ code: '1101', name: 'Kas Utama (Brankas)', amount: totalAmt }];
    const credits = [
      { code: '1201', name: 'Piutang Pinjaman Anggota', amount: target.principal },
      { code: '4101', name: 'Pendapatan Jasa Bunga Pinjaman', amount: target.interest }
    ];
    if (penalty > 0) {
      credits.push({ code: '4103', name: 'Pendapatan Denda Keterlambatan', amount: penalty });
    }

    postAutoJournal(
      `Bayar Angsuran #${target.installmentNumber} - ${target.memberName}` + (collectorName ? ` (Ditagih: ${collectorName})` : ''),
      debits,
      credits
    );

    // Add cash received record
    const cKas: KasEntry = {
      id: `kas-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'masuk',
      category: 'Pembayaran Angsuran Pinjaman',
      amount: totalAmt,
      description: `Pembayaran angsuran ke-${target.installmentNumber} untuk pinjaman ${target.memberName} (${target.memberNumber})` + (collectorName ? ` (Karyawan Penagih: ${collectorName})` : ''),
      createdBy
    };
    setKas(prev => [cKas, ...prev]);

    const updatedInstallment: Angsuran = {
      ...target,
      penalty,
      totalPaid: totalAmt,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      createdBy,
      collectorName: collectorName || '-'
    };

    setAngsuran(prevAmort => prevAmort.map(item => item.id === angsuranId ? updatedInstallment : item));

    if (affectedLoanId) {
      setPinjaman(prevLoans => {
        return prevLoans.map(loan => {
          if (loan.id === affectedLoanId) {
            const principalReduction = target.principal;
            const newRemaining = Math.max(0, loan.remainingBalance - principalReduction);
            
            // Recheck if all installments of this loan are paid (assumed that this one is paid as well)
            const brotherInstallments = angsuran.filter(x => x.loanId === affectedLoanId && x.id !== angsuranId);
            const allPaid = brotherInstallments.every(x => x.status === 'paid');

            return {
              ...loan,
              remainingBalance: newRemaining,
              status: (newRemaining <= 0 || allPaid) ? ('lunas' as const) : ('disetujui' as const)
            };
          }
          return loan;
        });
      });
    }

    addLog('Pembayaran Angsuran', `Melakukan input pembayaran cicilan untuk ${memberNameSaved} senilai Rp ${totalAmt.toLocaleString()}`);
  };

  // —— CASH FLOW (KAS MOVEMENTS) ——
  const addKas = (data: Omit<KasEntry, 'id'>) => {
    const newId = `kas-${Date.now()}`;
    const newKas: KasEntry = {
      ...data,
      id: newId
    };

    setKas(prev => [newKas, ...prev]);

    // Manual Posting into COA & Journals
    // If Kas masuk: Debits Kas (1101), Credits corresponding category of Equity/Income
    // If Kas keluar: Debits corresponding category Expense/Asset, Credits Kas (1101)
    if (data.type === 'masuk') {
      postAutoJournal(
        `Kas Masuk: ${data.category} - ${data.description}`,
        [{ code: '1101', name: 'Kas Utama (Brankas)', amount: data.amount }],
        [{ code: '4102', name: 'Pendapatan Operasional Lainnya', amount: data.amount }] // mock operational pendapatan
      );
    } else {
      postAutoJournal(
        `Kas Keluar: ${data.category} - ${data.description}`,
        [{ code: '5102', name: 'Beban Operasional Lainnya', amount: data.amount }], // mock general beban
        [{ code: '1101', name: 'Kas Utama (Brankas)', amount: data.amount }]
      );
    }

    addLog('Kas Baru', `Memasukkan kas ${data.type} Rp ${data.amount.toLocaleString()} dengan kategori ${data.category}`);
  };

  // —— GENERAL BOOKKEEPING COA & JOURNAL ——
  const addJurnalEntry = (entry: Omit<JurnalEntry, 'id'>) => {
    const newId = `jr-${Date.now()}`;
    const newEntry: JurnalEntry = {
      ...entry,
      id: newId
    };

    setJurnal(prev => [newEntry, ...prev]);

    // Update balances of targeted accounts accordingly
    entry.items.forEach(item => {
      adjustCOABalance(item.accountCode, item.debit, item.credit);
    });

    addLog('Transaksi Jurnal', `Menuliskan entri jurnal manual: "${entry.description}"`);
  };

  // —— USER MANAGEMENT ——
  const addUser = (data: Omit<AppUser, 'id'>) => {
    const newId = `usr-${Date.now()}`;
    const newUser: AppUser = {
      id: newId,
      ...data
    };
    setUsers(prev => [...prev, newUser]);
    addLog('Tambah User', `Menambahkan pengguna sistem baru: ${data.name} (${data.role})`);
  };

  const updateUser = (id: string, data: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } as AppUser : u));
    const target = users.find(u => u.id === id);
    addLog('Edit User', `Mengubah profil pengguna: ${target?.name || id}`);
  };

  const deleteUser = (id: string) => {
    if (id === currentUser?.id) return; // Forbid deleting oneself
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    addLog('Hapus User', `Menghapus akses user: ${target?.name || id}`);
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
    try {
      const data = JSON.parse(json);
      if (data.anggota && data.simpanan && data.pinjaman && data.coa) {
        if (data.users) setUsers(data.users);
        if (data.anggota) setAnggota(data.anggota);
        if (data.simpanan) setSimpanan(data.simpanan);
        if (data.pinjaman) setPinjaman(data.pinjaman);
        if (data.angsuran) setAngsuran(data.angsuran);
        if (data.coa) setCoa(data.coa);
        if (data.jurnal) setJurnal(data.jurnal);
        if (data.kas) setKas(data.kas);
        if (data.logs) setLogs(data.logs);
        
        addLog('Restore', 'Berhasil memulihkan / restore database koperasi dari file backup luar');
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const clearDatabase = () => {
    setUsers(INITIAL_USERS);
    setAnggota([]);
    setSimpanan([]);
    setPinjaman([]);
    setAngsuran([]);
    setCoa(INITIAL_COA);
    setJurnal([]);
    setKas([]);
    setLogs([]);
    addLog('Reset Sistem', 'Menghapus bersih seluruh data dinamis dan menyetel ulang ke bawaan');
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

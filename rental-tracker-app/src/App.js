import React, { useState, useEffect, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, query, where, writeBatch, doc } from 'firebase/firestore';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Building, DollarSign, Receipt, Download, ListTodo, Mail as MailIcon, Eye, EyeOff, Menu, Moon, Sun, BarChart3 } from 'lucide-react';

// Import our new organized files
import { AppContext } from './context/AppContext';
import { Toast } from './components/Shared';
import Dashboard from './pages/Dashboard';
import PropertyManager from './pages/PropertyManager';
import RentTracker from './pages/RentTracker';
import ExpenseManager from './pages/ExpenseManager';
import ReportsAnalytics from './pages/ReportsAnalytics';
import KanbanTaskManager from './pages/KanbanTaskManager';
import ExportManager from './pages/ExportManager';

// --- Auth Screen Component ---
const AuthScreen = () => {
  const { auth } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setToast(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        setToast({ msg: 'Account created!', type: 'success' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setToast({ msg: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 text-primary"><Building size={32} /></div>
            <h2 className="text-2xl font-black">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-xs text-base-content/60">Rental Property Management</p>
          </div>
          <div className="form-control gap-3">
            <label className="input input-bordered flex items-center gap-2"><MailIcon size={16} className="opacity-70"/><input type="email" placeholder="Email" className="grow" value={email} onChange={e=>setEmail(e.target.value)} /></label>
            <label className="input input-bordered flex items-center gap-2"><input type={showPass ? "text" : "password"} placeholder="Password" className="grow" value={password} onChange={e=>setPassword(e.target.value)} /><button onClick={()=>setShowPass(!showPass)} type="button"><Eye size={16} className="opacity-70"/></button></label>
            <button className="btn btn-primary w-full mt-2" onClick={handleAuth} disabled={loading}>{loading && <span className="loading loading-spinner"/>}{isRegistering ? 'Sign Up' : 'Login'}</button>
          </div>
          <div className="divider text-xs">OR</div>
          <p className="text-center text-sm">{isRegistering ? 'Have an account?' : 'New here?'} <button onClick={()=>setIsRegistering(!isRegistering)} className="link link-primary font-bold ml-1">{isRegistering ? 'Login' : 'Register'}</button></p>
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
};

// --- Main Layout Shell ---
const AppShell = () => {
    const { auth } = useContext(AppContext);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'winter');
    const location = useLocation();

    useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);

    const navItems = [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/properties', icon: Building, label: 'Properties' },
      { path: '/rent', icon: DollarSign, label: 'Rent' },
      { path: '/expenses', icon: Receipt, label: 'Expenses' },
      { path: '/reports', icon: BarChart3, label: 'Reports' },
      { path: '/tasks', icon: ListTodo, label: 'Tasks' },
      { path: '/export', icon: Download, label: 'Export' },
    ];

    return (
      <div className="drawer lg:drawer-open font-sans text-base-content bg-base-200 min-h-screen">
        <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <div className="navbar bg-base-100 shadow-sm sticky top-0 z-30 px-4">
            <div className="flex-none lg:hidden"><label htmlFor="nav-drawer" className="btn btn-square btn-ghost"><Menu size={24}/></label></div>
            <div className="flex-1"><h1 className="text-xl font-black text-primary tracking-tight hidden lg:flex items-center gap-2"><Building/> RentalTracker</h1><span className="lg:hidden font-bold text-lg ml-2 capitalize">{location.pathname.replace('/','')}</span></div>
            <div className="flex-none gap-2"><label className="swap swap-rotate btn btn-ghost btn-circle"><input type="checkbox" onChange={()=>setTheme(theme==='winter'?'night':'winter')} checked={theme==='night'} /><Sun className="swap-on w-5 h-5"/><Moon className="swap-off w-5 h-5"/></label><button className="btn btn-ghost btn-circle" onClick={()=>signOut(auth)}><img src={`https://ui-avatars.com/api/?name=User&background=random`} alt="av" className="w-8 h-8 rounded-full"/></button></div>
          </div>
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto"><div className="max-w-7xl mx-auto animate-fade-in">
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/properties" element={<PropertyManager />} />
                    <Route path="/rent" element={<RentTracker />} />
                    <Route path="/expenses" element={<ExpenseManager />} />
                    <Route path="/reports" element={<ReportsAnalytics />} />
                    <Route path="/tasks" element={<KanbanTaskManager />} />
                    <Route path="/export" element={<ExportManager />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div></main>
        </div>
        <div className="drawer-side z-40"><label htmlFor="nav-drawer" className="drawer-overlay"></label><ul className="menu p-4 w-72 min-h-full bg-base-100 text-base-content shadow-xl gap-2"><div className="mb-6 px-4 py-2 flex items-center gap-2 text-primary"><Building size={28}/> <span className="font-black text-2xl tracking-tighter">Tracker</span></div>{navItems.map(item => (<li key={item.path}><NavLink to={item.path} className={({ isActive }) => isActive ? 'active font-bold' : 'font-medium'} onClick={() => document.getElementById('nav-drawer').checked = false}><item.icon size={20}/> {item.label}</NavLink></li>))}</ul></div>
      </div>
    );
};

// --- App Container ---
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type) => setToast({ msg, type });

  const firebaseConfig = useMemo(() => ({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  }), []);

  const __app_id = firebaseConfig.projectId;

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    setDb(getFirestore(app));
    setAuth(getAuth(app));
    onAuthStateChanged(getAuth(app), (user) => { setUserId(user?.uid || null); setReady(true); });
  }, [firebaseConfig]);

  useEffect(() => {
    if (!db || !userId) return;
    const checkRecurring = async () => {
        const today = new Date(); const currentMonth = today.toISOString().slice(0, 7); 
        const recurringRef = collection(db, `artifacts/${__app_id}/users/${userId}/recurringExpenses`);
        const expenseRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
        const snap = await getDocs(recurringRef); const rules = snap.docs.map(d => ({id: d.id, ...d.data()}));
        let createdCount = 0; const batch = writeBatch(db);
        for (const rule of rules) {
            const q = query(expenseRef, where("recurrenceId", "==", rule.id), where("date", ">=", `${currentMonth}-01`), where("date", "<=", `${currentMonth}-31`));
            const existsSnap = await getDocs(q);
            if (existsSnap.empty) {
                batch.set(doc(expenseRef), { propertyName: rule.propertyName, propertyId: rule.propertyId, amount: rule.amount, category: rule.category, reason: rule.reason, date: new Date().toISOString().slice(0,10), recurrenceId: rule.id, isAutoGenerated: true, createdAt: new Date().toISOString() });
                createdCount++;
            }
        }
        if (createdCount > 0) { await batch.commit(); showToast(`Auto-generated ${createdCount} expenses`, 'info'); }
    };
    checkRecurring();
  }, [db, userId, __app_id]);

  const generateRentRecordsForUnit = async (unitData, propertyData) => {
      if (!db || !userId) return;
      const recRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
      const q = query(recRef, where("unitId", "==", unitData.id));
      const snaps = await getDocs(q); snaps.forEach(d => deleteDoc(d.ref));
      const moveIn = new Date(unitData.moveInDate); const today = new Date(); let start = new Date(moveIn.getFullYear(), moveIn.getMonth(), 1);
      const promises = [];
      while (start <= today) {
          const mStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}`;
          const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
          const dueDay = Math.min(moveIn.getDate(), lastDay);
          const dueDateStr = new Date(start.getFullYear(), start.getMonth(), dueDay).toISOString().split('T')[0];
          promises.push(addDoc(recRef, { propertyId: propertyData.id, propertyName: propertyData.name, unitId: unitData.id, unitNumber: unitData.number, tenantName: unitData.tenantName, amount: parseFloat(unitData.rentAmount), monthYear: mStr, dueDate: dueDateStr, isPaid: false, amountReceived: 0, createdAt: new Date().toISOString() }));
          start.setMonth(start.getMonth() + 1);
      }
      await Promise.all(promises);
  };

  if (!ready) return <div className="h-screen flex items-center justify-center bg-base-200"><span className="loading loading-ring loading-lg text-primary"/></div>;

  return (
    <AppContext.Provider value={{ db, auth, userId, __app_id, showToast, generateRentRecordsForUnit }}>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.7.2/dist/full.min.css" rel="stylesheet" /><script src="https://cdn.tailwindcss.com"></script>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55); } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes bounceIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
      {!userId ? <AuthScreen /> : <BrowserRouter><AppShell /></BrowserRouter>}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </AppContext.Provider>
  );
};
export default App;
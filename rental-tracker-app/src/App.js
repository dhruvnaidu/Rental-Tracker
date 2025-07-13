import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import {
  Home,
  Building,
  DollarSign,
  Receipt,
  Bell,
  Download,
  PlusCircle,
  Edit,
  Trash2,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  XCircle,
  User,
  Info,
  History,
  ClipboardCheck,
  ClipboardX,
  ListTodo,
  Phone,
  Mail as MailIcon,
  UserPlus,
  LogOut,
  LogIn,
  UserPlus as SignUpIcon
} from 'lucide-react';

// Context for Firebase and User
const AppContext = createContext(null);

// Utility function to format date for display
// eslint-disable-next-line no-unused-vars
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Utility function to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Utility function to format currency
const formatCurrency = (amount) => {
  // Ensure amount is a number, default to 0 if not
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(numericAmount);
};

// Reusable Modal Component
const Modal = ({ title, children, onClose, isOpen, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative bg-white rounded-lg shadow-xl ${maxWidth} w-full mx-auto p-6 animate-fade-in-up`}>
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// AuthScreen Component for Login/Signup
const AuthScreen = () => {
  const { auth } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        // Using a custom message box instead of alert()
        const messageBox = document.createElement('div');
        messageBox.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg z-50 animate-fade-in-up';
        messageBox.textContent = 'Registration successful! You are now logged in.';
        document.body.appendChild(messageBox);
        setTimeout(() => messageBox.remove(), 3000);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Using a custom message box instead of alert()
        const messageBox = document.createElement('div');
        messageBox.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg z-50 animate-fade-in-up';
        messageBox.textContent = 'Login successful!';
        document.body.appendChild(messageBox);
        setTimeout(() => messageBox.remove(), 3000);
      }
    } catch (e) {
      console.error("Auth Error:", e.message);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          {isRegistering ? "Register" : "Login"} to Rental Tracker
        </h2>
        <p className="text-center text-gray-600">
          {isRegistering ? "Create your account to manage properties." : "Sign in to access your data."}
        </p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md" role="alert">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            placeholder="your.email@example.com"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            placeholder="********"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleAuthAction}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isRegistering ? (
            <><SignUpIcon size={20} className="mr-2" /> Register</>
          ) : (
            <><LogIn size={20} className="mr-2" /> Login</>
          )}
        </button>

        <p className="text-center text-gray-600">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200"
            disabled={isLoading}
          >
            {isRegistering ? "Login here" : "Register here"}
          </button>
        </p>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAQJm88i3gwaGzvhJMxONzUr78tZqBRfXs",
    authDomain: "rentaltrackerapp.firebaseapp.com",
    projectId: "rentaltrackerapp",
    storageBucket: "rentaltrackerapp.firebasestorage.app",
    messagingSenderId: "341920558561",
    appId: "1:341920558561:web:1466c2166c1c2b1a5e76a0",
    measurementId: "G-VXF4GW40FK"
  };

  const __app_id = firebaseConfig.projectId;

// Firebase Initialization and Authentication
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user && !user.isAnonymous) {
          setUserId(user.uid);
        } else {
          setUserId(null);
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      setIsAuthReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        setUserId(null);
        setActiveTab('dashboard');
        // Using a custom message box instead of alert()
        const messageBox = document.createElement('div');
        messageBox.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg z-50 animate-fade-in-up';
        messageBox.textContent = 'You have been logged out.';
        document.body.appendChild(messageBox);
        setTimeout(() => messageBox.remove(), 3000);
      } catch (error) {
        console.error("Error logging out:", error);
        // Using a custom message box instead of alert()
        const messageBox = document.createElement('div');
        messageBox.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-md shadow-lg z-50 animate-fade-in-up';
        messageBox.textContent = 'Failed to log out: ' + error.message;
        document.body.appendChild(messageBox);
        setTimeout(() => messageBox.remove(), 3000);
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading application...</div>
      </div>
    );
  }

  // If user is not logged in (or is anonymous), show AuthScreen
  if (!userId || (auth.currentUser && auth.currentUser.isAnonymous)) {
    return (
      <AppContext.Provider value={{ db, auth, userId, isAuthReady, __app_id, formatDate, formatDateForInput, formatCurrency }}>
        <AuthScreen />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{ db, auth, userId, isAuthReady, __app_id, formatDate, formatDateForInput, formatCurrency }}>
      <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Rental Tracker</h1>
          <div className="flex items-center">
            {userId && (
              <div className="flex items-center text-sm text-gray-600 mr-4">
                <User size={16} className="mr-1" />
                User ID: <span className="font-mono ml-1">{userId}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200"
            >
              <LogOut size={20} className="mr-2" /> Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-gray-800 text-white p-4 shadow-lg">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <Home size={20} className="mr-3" /> Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'properties' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <Building size={20} className="mr-3" /> Properties & Units
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('rent')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'rent' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <DollarSign size={20} className="mr-3" /> Monthly Rent Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'expenses' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <Receipt size={20} className="mr-3" /> Expense Logger
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'tasks' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <ListTodo size={20} className="mr-3" /> Task Manager
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'reminders' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <Bell size={20} className="mr-3" /> Reminders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${activeTab === 'export' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  <Download size={20} className="mr-3" /> Export Data
                </button>
              </li>
            </ul>
          </nav>

          {/* Content Area */}
          <main className="flex-1 p-6 bg-gray-50 overflow-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'properties' && <PropertyManager />}
            {activeTab === 'rent' && <MonthlyRentTracker />}
            {activeTab === 'expenses' && <ExpenseLogger />}
            {activeTab === 'tasks' && <TaskManager />}
            {activeTab === 'reminders' && <Reminders />}
            {activeTab === 'export' && <ExportSystem />}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

// --- Dashboard Component ---
const Dashboard = () => {
  const { db, userId, isAuthReady, __app_id, formatDate, formatCurrency } = useContext(AppContext);
  const [properties, setProperties] = useState([]);
  const [rentRecords, setRentRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
    const userRentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
    const userExpensesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);

    const unsubscribeProperties = onSnapshot(userPropertiesCollectionRef, async (snapshot) => {
      const fetchedProperties = [];
      for (const doc of snapshot.docs) {
        const propertyData = { id: doc.id, ...doc.data(), units: [] };
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${doc.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        propertyData.units = unitSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
        fetchedProperties.push(propertyData);
      }
      setProperties(fetchedProperties);
    }, (error) => console.error("Error fetching properties:", error));

    const unsubscribeRentRecords = onSnapshot(userRentRecordsCollectionRef, (snapshot) => {
      setRentRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching rent records:", error));

    const unsubscribeExpenses = onSnapshot(userExpensesCollectionRef, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching expenses:", error));

    return () => {
      unsubscribeProperties();
      unsubscribeRentRecords();
      unsubscribeExpenses();
    };
  }, [db, userId, isAuthReady, __app_id]);

  const filteredRentRecords = useMemo(() => {
    return rentRecords.filter(record => {
      // Use the actual due date for filtering if available, otherwise monthYear
      const recordDateString = record.dueDate || record.monthYear;
      if (!recordDateString) return false;

      const recordDate = new Date(recordDateString);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the end date in the range

      const matchesDateRange = recordDate >= start && recordDate < end;
      const matchesProperty = selectedPropertyId === 'all' || record.propertyId === selectedPropertyId;
      return matchesDateRange && matchesProperty;
    });
  }, [rentRecords, startDate, endDate, selectedPropertyId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);

      const matchesDateRange = expenseDate >= start && expenseDate < end;
      const matchesProperty = selectedPropertyId === 'all' || expense.propertyId === selectedPropertyId;
      return matchesDateRange && matchesProperty;
    });
  }, [expenses, startDate, endDate, selectedPropertyId]);

  const totalRentCollected = filteredRentRecords
    .filter(record => record.isPaid)
    .reduce((sum, record) => sum + (record.amountReceived || record.amount || 0), 0); // Use amountReceived if available

  const totalUnpaidRent = filteredRentRecords
    .filter(record => !record.isPaid)
    .reduce((sum, record) => sum + (record.amount || 0) - (record.amountReceived || 0), 0); // Calculate remaining due for unpaid

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const netIncome = totalRentCollected - totalExpenses;

  const hasUnpaidRentAlert = filteredRentRecords.some(record => !record.isPaid && ((record.amount || 0) - (record.amountReceived || 0) > 0));

  const historicalNetIncome = useMemo(() => {
    const monthlyData = {};
    const today = new Date();

    // Initialize data for last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthYearKey] = { rent: 0, expenses: 0, net: 0, label: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }) };
    }

    rentRecords.forEach(record => {
      const recordMonthYear = record.monthYear; // This is YYYY-MM
      if (monthlyData[recordMonthYear]) {
        if (record.isPaid) {
          monthlyData[recordMonthYear].rent += (record.amountReceived || record.amount || 0); // Use amountReceived
        }
      }
    });

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonthYear = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[expenseMonthYear]) {
        monthlyData[expenseMonthYear].expenses += (expense.amount || 0);
      }
    });

    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].net = monthlyData[key].rent - monthlyData[key].expenses;
    });

    return Object.keys(monthlyData)
      .sort() // Sort by monthYearKey to ensure correct order
      .map(key => monthlyData[key])
      .filter(item => item !== undefined && item !== null); // Ensure no undefined or null items
  }, [rentRecords, expenses]);

  const profitLossByProperty = useMemo(() => {
    const pnl = {};
    properties.forEach(prop => {
      pnl[prop.id] = { name: prop.name, income: 0, expenses: 0, net: 0 };
    });

    filteredRentRecords.filter(r => r.isPaid).forEach(record => {
      if (pnl[record.propertyId]) {
        pnl[record.propertyId].income += (record.amountReceived || record.amount || 0); // Use amountReceived
      }
    });

    filteredExpenses.forEach(expense => {
      if (pnl[expense.propertyId]) {
        pnl[expense.propertyId].expenses += (expense.amount || 0);
      }
    });

    Object.values(pnl).forEach(item => {
      item.net = item.income - item.expenses;
    });

    return Object.values(pnl);
  }, [filteredRentRecords, filteredExpenses, properties]);

  const expenseBreakdownByCategory = useMemo(() => {
    const categories = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + (expense.amount || 0);
    });
    return Object.entries(categories).sort(([, a], [, b]) => b - a);
  }, [filteredExpenses]);

  const upcomingLeaseExpirations = useMemo(() => {
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const expiringLeases = [];
    properties.forEach(property => {
      property.units.forEach(unit => {
        if (unit.leaseEndDate) {
          const leaseEndDate = new Date(unit.leaseEndDate);
          if (leaseEndDate > today && leaseEndDate <= ninetyDaysFromNow) {
            const daysRemaining = Math.ceil((leaseEndDate - today) / (1000 * 60 * 60 * 24));
            expiringLeases.push({
              propertyName: property.name,
              unitNumber: unit.number,
              tenantName: unit.tenantName,
              leaseEndDate: unit.leaseEndDate,
              daysRemaining: daysRemaining,
            });
          }
        }
      });
    });
    return expiringLeases.sort((a, b) => new Date(a.leaseEndDate) - new Date(b.leaseEndDate));
  }, [properties]);


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Summary</h2>

      {hasUnpaidRentAlert && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm flex items-center" role="alert">
          <Info size={24} className="mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">Unpaid Rent Alert!</p>
            <p>You have unpaid rent records within the selected date range.</p>
          </div>
        </div>
      )}

      {upcomingLeaseExpirations.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-sm" role="alert">
          <div className="flex items-center mb-2">
            <Info size={24} className="mr-3 flex-shrink-0" />
            <p className="font-bold">Upcoming Lease Expirations!</p>
          </div>
          <ul className="list-disc list-inside text-sm">
            {upcomingLeaseExpirations.map((lease, index) => (
              <li key={index}>
                <span className="font-semibold">{lease.tenantName}</span> in {lease.propertyName}, Unit {lease.unitNumber} -
                Lease ends on {formatDate(lease.leaseEndDate)} (in {lease.daysRemaining} days).
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        </div>
        <div>
          <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">Filter by Property</label>
          <select
            id="property-select"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Rent Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRentCollected)}</p>
          </div>
          <ArrowUpCircle size={36} className="text-green-500" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Unpaid Rent</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaidRent)}</p>
          </div>
          <XCircle size={36} className="text-red-500" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <ArrowDownCircle size={36} className="text-orange-500" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Net Income</p>
            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </p>
          </div>
          <Wallet size={36} className="text-blue-500" />
        </div>
      </div>

      {/* Historical Net Income Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Net Income (Last 12 Months)</h3>
        <div className="relative h-64 w-full">
          {historicalNetIncome.length > 0 && historicalNetIncome.some(d => Math.abs(d.net || 0) > 0) ? (
            <div className="flex h-full items-end justify-around border-b border-l border-gray-300 pt-4">
              {historicalNetIncome.map((data, index) => (
                <div
                  key={data.label}
                  className="flex flex-col items-center justify-end h-full mx-1"
                  style={{ width: `${100 / historicalNetIncome.length - 2}%`, height: `${Math.max(0, Math.abs(data.net || 0) / Math.max(...historicalNetIncome.map(d => Math.abs(d.net || 0)), 1) * 90)}%` }}
                  title={`${data.label}: ${formatCurrency(data.net)}`}
                >
                  <div
                    className={`w-full rounded-t-md ${data.net >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ height: '100%' }} // Bar height is controlled by parent div's height
                  ></div>
                  <span className="text-xs text-gray-600 mt-1">{data.label}</span>
                </div>
              ))}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
                <span>{formatCurrency(Math.max(...historicalNetIncome.map(d => Math.abs(d.net || 0))))}</span>
                <span>0</span>
                <span>{formatCurrency(-Math.max(...historicalNetIncome.map(d => Math.abs(d.net || 0))))}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-10">No historical data available to display chart.</p>
          )}
        </div>
      </div>

      {/* Profit & Loss by Property */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Profit & Loss by Property (Selected Period)</h3>
        {profitLossByProperty.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No data to display Profit & Loss by Property.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profitLossByProperty.map(pnlItem => (
                  <tr key={pnlItem.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pnlItem.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(pnlItem.income)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(pnlItem.expenses)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${pnlItem.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(pnlItem.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Breakdown by Category */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Expense Breakdown by Category (Selected Period)</h3>
        {expenseBreakdownByCategory.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No expense data for category breakdown.</p>
        ) : (
          <div className="relative h-64 w-full flex items-end justify-around border-b border-l border-gray-300 pt-4">
            {expenseBreakdownByCategory.map(([category, amount]) => (
              <div
                key={category}
                className="flex flex-col items-center justify-end h-full mx-1"
                style={{ width: `${100 / expenseBreakdownByCategory.length - 2}%`, height: `${Math.max(0, amount / Math.max(...expenseBreakdownByCategory.map(([, a]) => a), 1) * 90)}%` }}
                title={`${category}: ${formatCurrency(amount)}`}
              >
                <div
                  className="w-full rounded-t-md bg-orange-500"
                  style={{ height: '100%' }} // Bar height is controlled by parent div's height
                ></div>
                <span className="text-xs text-gray-600 mt-1 text-center">{category}</span>
              </div>
            ))}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
              <span>{formatCurrency(Math.max(...expenseBreakdownByCategory.map(([, a]) => a)))}</span>
              <span>0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Property & Unit Manager Component ---
const PropertyManager = () => {
  // Destructure formatDate and formatDateForInput from AppContext
  const { db, userId, isAuthReady, __app_id, formatDate, formatDateForInput } = useContext(AppContext);
  const [properties, setProperties] = useState([]);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyNotes, setNewPropertyNotes] = useState('');
  const [newPropertyImageUrl, setNewPropertyImageUrl] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);

  const [selectedPropertyForUnit, setSelectedPropertyForUnit] = useState(null);
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newRentAmount, setNewRentAmount] = useState('');
  const [newMoveInDate, setNewMoveInDate] = useState('');
  const [newUnitNotes, setNewUnitNotes] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmergencyContactName, setNewEmergencyContactName] = useState('');
  const [newEmergencyContactPhone, setNewEmergencyContactPhone] = useState('');
  const [newLeaseStartDate, setNewLeaseStartDate] = useState('');
  const [newLeaseEndDate, setNewLeaseEndDate] = useState('');
  const [newSecurityDepositAmount, setNewSecurityDepositAmount] = useState('');
  const [newLeaseTerm, setNewLeaseTerm] = '';
  // New fields for rent increment amount and effective date
  const [newRentIncrementAmount, setNewRentIncrementAmount] = useState('');
  const [newRentIncrementEffectiveDate, setNewRentIncrementEffectiveDate] = useState('');


  const [editingUnit, setEditingUnit] = useState(null);

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [showTenantHistoryModal, setShowTenantHistoryModal] = useState(false);
  const [currentTenantHistory, setCurrentTenantHistory] = useState([]);
  const [currentUnitForHistory, setCurrentUnitForHistory] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const placeholderImage = "https://placehold.co/100x75/aabbcc/ffffff?text=No+Image";

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);

    const unsubscribe = onSnapshot(userPropertiesCollectionRef, async (snapshot) => {
      const fetchedProperties = [];
      for (const doc of snapshot.docs) {
        const propertyData = { id: doc.id, ...doc.data(), units: [] };
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${doc.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        propertyData.units = unitSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
        fetchedProperties.push(propertyData);
      }
      setProperties(fetchedProperties);
    }, (error) => console.error("Error fetching properties with units:", error));

    return () => unsubscribe();
  }, [db, userId, isAuthReady, __app_id]);

  const handleAddEditProperty = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !newPropertyName.trim()) {
      setFeedbackMessage("Property name is required.");
      return;
    }
    setFeedbackMessage('');
    try {
      if (editingProperty) {
        const propertyDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties`, editingProperty.id);
        await updateDoc(propertyDocRef, {
          name: newPropertyName,
          notes: newPropertyNotes,
          imageUrl: newPropertyImageUrl,
        });
        setFeedbackMessage("Property updated successfully!");
      } else {
        const propertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
        await addDoc(propertiesCollectionRef, {
          name: newPropertyName,
          notes: newPropertyNotes,
          imageUrl: newPropertyImageUrl,
          createdAt: new Date().toISOString(),
        });
        setFeedbackMessage("Property added successfully!");
      }
      setNewPropertyName('');
      setNewPropertyNotes('');
      setNewPropertyImageUrl('');
      setEditingProperty(null);
      setShowPropertyModal(false);
    } catch (e) {
      console.error("Error adding/updating property: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openEditPropertyModal = (property) => {
    setEditingProperty(property);
    setNewPropertyName(property.name);
    setNewPropertyNotes(property.notes || '');
    setNewPropertyImageUrl(property.imageUrl || '');
    setFeedbackMessage('');
    setShowPropertyModal(true);
  };

  const openAddPropertyModal = () => {
    setEditingProperty(null);
    setNewPropertyName('');
    setNewPropertyNotes('');
    setNewPropertyImageUrl('');
    setFeedbackMessage('');
    setShowPropertyModal(true);
  };

  const handleAddEditUnit = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !selectedPropertyForUnit || !newUnitNumber.trim() || !newTenantName.trim() || !newRentAmount || !newMoveInDate) {
      setFeedbackMessage("All required unit fields are missing (Unit #, Tenant Name, Rent Amount, Move-in Date).");
      return;
    }
    setFeedbackMessage('');
    try {
      const unitData = {
        propertyId: selectedPropertyForUnit.id,
        propertyName: selectedPropertyForUnit.name,
        number: newUnitNumber,
        tenantName: newTenantName,
        rentAmount: parseFloat(newRentAmount),
        moveInDate: newMoveInDate,
        notes: newUnitNotes,
        phoneNumber: newPhoneNumber,
        email: newEmail,
        emergencyContactName: newEmergencyContactName,
        emergencyContactPhone: newEmergencyContactPhone,
        leaseStartDate: newLeaseStartDate,
        leaseEndDate: newLeaseEndDate,
        securityDepositAmount: parseFloat(newSecurityDepositAmount || 0),
        leaseTerm: newLeaseTerm,
        // New fields for rent increment
        rentIncrementAmount: parseFloat(newRentIncrementAmount || 0),
        rentIncrementEffectiveDate: newRentIncrementEffectiveDate || null,
      };

      if (editingUnit) {
        const unitDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties/${selectedPropertyForUnit.id}/units`, editingUnit.id);
        await updateDoc(unitDocRef, unitData);
        setFeedbackMessage("Unit updated successfully!");
      } else {
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${selectedPropertyForUnit.id}/units`);
        await addDoc(unitsCollectionRef, {
          ...unitData,
          createdAt: new Date().toISOString(),
        });
        setFeedbackMessage("Unit added successfully!");
      }
      setNewUnitNumber('');
      setNewTenantName('');
      setNewRentAmount('');
      setNewMoveInDate('');
      setNewUnitNotes('');
      setNewPhoneNumber('');
      setNewEmail('');
      setNewEmergencyContactName('');
      setNewEmergencyContactPhone('');
      setNewLeaseStartDate('');
      setNewLeaseEndDate('');
      setNewSecurityDepositAmount('');
      setNewLeaseTerm('');
      setNewRentIncrementAmount('');
      setNewRentIncrementEffectiveDate('');
      setEditingUnit(null);
      setShowUnitModal(false);
    } catch (e) {
      console.error("Error adding/updating unit: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openAddUnitModal = (property) => {
    setSelectedPropertyForUnit(property);
    setEditingUnit(null);
    setNewUnitNumber('');
    setNewTenantName('');
    setNewRentAmount('');
    setNewMoveInDate('');
    setNewUnitNotes('');
    setNewPhoneNumber('');
    setNewEmail('');
    setNewEmergencyContactName('');
    setNewEmergencyContactPhone('');
    setNewLeaseStartDate('');
    setNewLeaseEndDate('');
    setNewSecurityDepositAmount('');
    setNewLeaseTerm('');
    setNewRentIncrementAmount('');
    setNewRentIncrementEffectiveDate('');
    setFeedbackMessage('');
    setShowUnitModal(true);
  };

  const openEditUnitModal = (property, unit) => {
    setSelectedPropertyForUnit(property);
    setEditingUnit(unit);
    setNewUnitNumber(unit.number);
    setNewTenantName(unit.tenantName);
    setNewRentAmount(unit.rentAmount);
    // Use formatDateForInput for all date fields when editing
    setNewMoveInDate(formatDateForInput(unit.moveInDate));
    setNewUnitNotes(unit.notes || '');
    setNewPhoneNumber(unit.phoneNumber || '');
    setNewEmail(unit.email || '');
    setNewEmergencyContactName(unit.emergencyContactName || '');
    setNewEmergencyContactPhone(unit.emergencyContactPhone || '');
    setNewLeaseStartDate(formatDateForInput(unit.leaseStartDate));
    setNewLeaseEndDate(formatDateForInput(unit.leaseEndDate));
    setNewSecurityDepositAmount(unit.securityDepositAmount || '');
    setNewLeaseTerm(unit.leaseTerm || '');
    setNewRentIncrementAmount(unit.rentIncrementAmount || '');
    setNewRentIncrementEffectiveDate(formatDateForInput(unit.rentIncrementEffectiveDate));
    setFeedbackMessage('');
    setShowUnitModal(true);
  };

  const handleDelete = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !confirmDeleteModal) return;
    setFeedbackMessage('');
    try {
      if (confirmDeleteModal.type === 'property') {
        const propertyDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties`, confirmDeleteModal.id);
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${confirmDeleteModal.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        const deleteUnitPromises = unitSnapshot.docs.map(unitDoc => deleteDoc(unitDoc.ref));
        await Promise.all(deleteUnitPromises);
        await deleteDoc(propertyDocRef);
        setFeedbackMessage("Property and its units deleted successfully!");
      } else if (confirmDeleteModal.type === 'unit') {
        const unitDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties/${confirmDeleteModal.propertyId}/units`, confirmDeleteModal.id);
        await deleteDoc(unitDocRef);
        setFeedbackMessage("Unit deleted successfully!");
      }
      setConfirmDeleteModal(null);
    } catch (e) {
            console.error("Error deleting: ", e);
            setFeedbackMessage(`Error: ${e.message}`);
        }
    };

  const openConfirmDeleteModal = (type, id, nameOrNumber, propertyId = null) => {
    setConfirmDeleteModal({ type, id, nameOrNumber, propertyId });
    setFeedbackMessage('');
  };

  const viewTenantHistory = async (unitId, unitNumber, tenantName) => {
    if (!db || !userId || !isAuthReady || !__app_id) return;
    setFeedbackMessage('');
    try {
      const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`), where("unitId", "==", unitId));
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.monthYear) - new Date(a.monthYear));
      setCurrentTenantHistory(history);
      setCurrentUnitForHistory({ unitNumber, tenantName });
      setShowTenantHistoryModal(true);
    } catch (e) {
      console.error("Error fetching tenant history:", e);
      setFeedbackMessage(`Error fetching history: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Property & Unit Manager</h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md ${feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all duration-300`}>
          {feedbackMessage}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={openAddPropertyModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          No properties added yet. Click "Add New Property" to get started!
        </div>
      ) : (
        <div className="space-y-8">
          {properties.map(property => (
            <div key={property.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                  {property.imageUrl && (
                    <img
                      src={property.imageUrl}
                      alt={property.name}
                      className="w-20 h-15 rounded-md object-cover mr-4"
                      onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                    />
                  )}
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">{property.name}</h3>
                    {property.notes && <p className="text-gray-600 text-sm italic">{property.notes}</p>}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openAddUnitModal(property)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-3 rounded-md flex items-center transition-colors duration-200"
                  >
                    <PlusCircle size={16} className="mr-1" /> Add Unit
                  </button>
                  <button
                    onClick={() => openEditPropertyModal(property)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 px-3 rounded-md flex items-center transition-colors duration-200"
                  >
                    <Edit size={16} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => openConfirmDeleteModal('property', property.id, property.name)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-3 rounded-md flex items-center transition-colors duration-200"
                  >
                    <Trash2 size={16} className="mr-1" /> Delete
                  </button>
                </div>
              </div>

              {property.units.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No units added for this property yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Move-in Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease End</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {property.units.map(unit => (
                        <tr key={unit.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.tenantName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(unit.rentAmount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(unit.moveInDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {unit.phoneNumber && <div className="flex items-center text-xs text-gray-600"><Phone size={12} className="mr-1" /> {unit.phoneNumber}</div>}
                            {unit.email && <div className="flex items-center text-xs text-gray-600"><MailIcon size={12} className="mr-1" /> {unit.email}</div>}
                            {unit.emergencyContactName && <div className="flex items-center text-xs text-gray-600"><UserPlus size={12} className="mr-1" /> {unit.emergencyContactName}</div>}
                            {unit.emergencyContactPhone && <div className="flex items-center text-xs text-gray-600"><Phone size={12} className="mr-1" /> {unit.emergencyContactPhone}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(unit.leaseEndDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewTenantHistory(unit.id, unit.number, unit.tenantName)}
                                className="text-purple-600 hover:text-purple-900"
                                title="View Tenant History"
                              >
                                <History size={18} />
                              </button>
                              <button
                                onClick={() => openEditUnitModal(property, unit)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Unit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => openConfirmDeleteModal('unit', unit.id, unit.number, property.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Unit"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Property Modal (Add/Edit) - Adjusted maxWidth */}
      <Modal isOpen={showPropertyModal} title={editingProperty ? "Edit Property" : "Add New Property"} onClose={() => setShowPropertyModal(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700">Property Name</label>
            <input
              type="text"
              id="propertyName"
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Main Street Apartments"
            />
          </div>
          <div>
            <label htmlFor="propertyImageUrl" className="block text-sm font-medium text-gray-700">Property Image URL (Optional)</label>
            <input
              type="url"
              id="propertyImageUrl"
              value={newPropertyImageUrl}
              onChange={(e) => setNewPropertyImageUrl(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., https://example.com/property.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">Provide a direct URL to an image. No file uploads.</p>
          </div>
          <div>
            <label htmlFor="propertyNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="propertyNotes"
              value={newPropertyNotes}
              onChange={(e) => setNewPropertyNotes(e.target.value)}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any specific details about the property..."
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowPropertyModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditProperty}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {editingProperty ? "Update Property" : "Add Property"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unit Modal (Add/Edit) */}
      <Modal isOpen={showUnitModal} title={editingUnit ? `Edit Unit for ${selectedPropertyForUnit?.name}` : `Add New Unit to ${selectedPropertyForUnit?.name}`} onClose={() => setShowUnitModal(false)} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">Unit Number</label>
            <input
              type="text"
              id="unitNumber"
              value={newUnitNumber}
              onChange={(e) => setNewUnitNumber(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Apt 3B"
            />
          </div>
          <div>
            <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">Tenant Name</label>
            <input
              type="text"
              id="tenantName"
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">Rent Amount</label>
            <input
              type="number"
              id="rentAmount"
              value={newRentAmount}
              onChange={(e) => setNewRentAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1200.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">Move-in Date</label>
            <input
              type="date"
              id="moveInDate"
              value={newMoveInDate}
              onChange={(e) => setNewMoveInDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tenant Contact Information */}
          <div className="col-span-full border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Tenant Contact & Lease Info</h4>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phoneNumber"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., +15551234567"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <input
              type="email"
              id="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., tenant@example.com"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">Emergency Contact Name (Optional)</label>
            <input
              type="text"
              id="emergencyContactName"
              value={newEmergencyContactName}
              onChange={(e) => setNewEmergencyContactName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., John Smith"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">Emergency Contact Phone (Optional)</label>
            <input
              type="tel"
              id="emergencyContactPhone"
              value={newEmergencyContactPhone}
              onChange={(e) => setNewEmergencyContactPhone(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., +15559876543"
            />
          </div>

          {/* Lease Details */}
          <div>
            <label htmlFor="leaseStartDate" className="block text-sm font-medium text-gray-700">Lease Start Date (Optional)</label>
            <input
              type="date"
              id="leaseStartDate"
              value={newLeaseStartDate}
              onChange={(e) => setNewLeaseStartDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="leaseEndDate" className="block text-sm font-medium text-gray-700">Lease End Date (Optional)</label>
            <input
              type="date"
              id="leaseEndDate"
              value={newLeaseEndDate}
              onChange={(e) => setNewLeaseEndDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="securityDepositAmount" className="block text-sm font-medium text-gray-700">Security Deposit Amount (Optional)</label>
            <input
              type="number"
              id="securityDepositAmount"
              value={newSecurityDepositAmount}
              onChange={(e) => setNewSecurityDepositAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1200.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="leaseTerm" className="block text-sm font-medium text-gray-700">Lease Term (Optional)</label>
            <input
              type="text"
              id="leaseTerm"
              value={newLeaseTerm}
              onChange={(e) => setNewLeaseTerm(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 12 months, Month-to-month"
            />
          </div>

          {/* Rent Increment Details */}
          <div className="col-span-full border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Rent Increment (Optional)</h4>
          </div>
          <div>
            <label htmlFor="rentIncrementAmount" className="block text-sm font-medium text-gray-700">Increment Amount</label>
            <input
              type="number"
              id="rentIncrementAmount"
              value={newRentIncrementAmount}
              onChange={(e) => setNewRentIncrementAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 50.00"
              min="0"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">Amount to increase rent by.</p>
          </div>
          <div>
            <label htmlFor="rentIncrementEffectiveDate" className="block text-sm font-medium text-gray-700">Increment Effective Date</label>
            <input
              type="date"
              id="rentIncrementEffectiveDate"
              value={newRentIncrementEffectiveDate}
              onChange={(e) => setNewRentIncrementEffectiveDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Date from which this increment applies.</p>
          </div>

          <div className="col-span-full">
            <label htmlFor="unitNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="unitNotes"
              value={newUnitNotes}
              onChange={(e) => setNewUnitNotes(e.target.value)}
              rows="2"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any specific details about the unit or tenant..."
            ></textarea>
          </div>

          <div className="col-span-full flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowUnitModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditUnit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {editingUnit ? "Update Unit" : "Add Unit"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Delete Modal */}
      <Modal isOpen={!!confirmDeleteModal} title={`Confirm Delete ${confirmDeleteModal?.type === 'property' ? 'Property' : 'Unit'}`} onClose={() => setConfirmDeleteModal(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{confirmDeleteModal?.nameOrNumber}</span>?
            {confirmDeleteModal?.type === 'property' && (
              <span className="font-bold text-red-600"> This will also delete all associated units!</span>
            )}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDeleteModal(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Tenant History Modal */}
      <Modal isOpen={showTenantHistoryModal} title={`Rent History for Unit ${currentUnitForHistory?.unitNumber} (${currentUnitForHistory?.tenantName})`} onClose={() => setShowTenantHistoryModal(false)}>
        <div className="space-y-4">
          {currentTenantHistory.length === 0 ? (
            <p className="text-gray-600">No rent history found for this unit.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month Due</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason for Difference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTenantHistory.map(record => (
                    <tr key={record.id} className={record.isPaid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(record.monthYear).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amountReceived)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.paymentDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {record.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.partialReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

// --- Monthly Rent Tracker Component ---
const MonthlyRentTracker = () => {
  const { db, userId, isAuthReady, __app_id, formatDate, formatCurrency } = useContext(AppContext);
  const [properties, setProperties] = useState([]);
  const [rentRecords, setRentRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [selectedRentRecords, setSelectedRentRecords] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [confirmDeleteRentModal, setConfirmDeleteRentModal] = useState(null);

  // State for Edit Rent Payment Modal
  const [showEditRentPaymentModal, setShowEditRentPaymentModal] = useState(false);
  const [currentRentRecordToEdit, setCurrentRentRecordToEdit] = useState(null);
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editIsFullPayment, setEditIsFullPayment] = useState(true);
  const [editAmountReceived, setEditAmountReceived] = useState('');
  const [editPartialReason, setEditPartialReason] = useState('');

  // State for bulk delete in arrears
  const [selectedArrearsRecords, setSelectedArrearsRecords] = useState([]);
  const [confirmBulkDeleteArrearsModal, setConfirmBulkDeleteArrearsModal] = useState(false);


  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
    const userRentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);

    const unsubscribeProperties = onSnapshot(userPropertiesCollectionRef, async (snapshot) => {
      const fetchedProperties = [];
      for (const doc of snapshot.docs) {
        const propertyData = { id: doc.id, ...doc.data(), units: [] };
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${doc.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        propertyData.units = unitSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
        fetchedProperties.push(propertyData);
      }
      setProperties(fetchedProperties);
    }, (error) => console.error("Error fetching properties for rent tracker:", error));

    const unsubscribeRentRecords = onSnapshot(userRentRecordsCollectionRef, (snapshot) => {
      setRentRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching rent records:", error));

    return () => {
      unsubscribeProperties();
      unsubscribeRentRecords();
    };
  }, [db, userId, isAuthReady, __app_id]);

  // Logic to auto-generate rent records and apply rent increments
  useEffect(() => {
    if (!db || !userId || !isAuthReady || properties.length === 0 || !__app_id) return;

    const generateAndIncrementRecords = async () => {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      for (const property of properties) {
        for (const unit of property.units) {
          const moveInDate = new Date(unit.moveInDate);
          if (isNaN(moveInDate.getTime())) {
            console.warn(`Invalid moveInDate for unit ${unit.id}: ${unit.moveInDate}`);
            continue;
          }

          // Determine the rent due day from move-in date
          const rentDueDay = moveInDate.getDate();

          // Iterate for past months up to current month to ensure all records are generated
          // Start from the month after move-in or the current year's January, whichever is later
          const startMonth = Math.max(1, moveInDate.getMonth() + 1);
          const startYear = moveInDate.getFullYear();

          for (let year = startYear; year <= currentYear; year++) {
            let monthToStart = (year === startYear) ? startMonth : 1;
            let monthToEnd = (year === currentYear) ? currentMonth : 12;

            for (let month = monthToStart; month <= monthToEnd; month++) {
              const targetDate = new Date(year, month - 1, rentDueDay); // Use rentDueDay
              const targetMonthYearString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

              // Only generate if the target month/year is not in the future
              if (targetDate > today) continue;

              // Check if rent record for this unit and target month already exists
              const existingRecord = rentRecords.find(
                r => r.unitId === unit.id && r.monthYear === targetMonthYearString
              );

              if (!existingRecord) {
                let currentUnitRent = parseFloat(unit.rentAmount || 0);
                const rentIncrementAmount = parseFloat(unit.rentIncrementAmount || 0);
                const rentIncrementEffectiveDate = unit.rentIncrementEffectiveDate ? new Date(unit.rentIncrementEffectiveDate) : null;

                // Apply rent increment if applicable for this period
                if (rentIncrementAmount > 0 && rentIncrementEffectiveDate && targetDate >= rentIncrementEffectiveDate) {
                  // Check if the increment should be applied for this specific rent record's month
                  const incrementAppliedForThisRecord = (
                    rentIncrementEffectiveDate.getFullYear() < year ||
                    (rentIncrementEffectiveDate.getFullYear() === year && rentIncrementEffectiveDate.getMonth() + 1 <= month)
                  );

                  // To avoid applying increment repeatedly for past months,
                  // we only apply it if the unit's stored rentAmount is the base rent
                  // and the increment effective date is met in the current generation cycle.
                  // A more robust way would be to calculate rent based on a rent history.
                  // For simplicity, we'll apply it once the effective date is reached for the first time.
                  // We need to fetch the latest unit data to ensure we're not using stale rentAmount.
                  const latestUnitDoc = await getDocs(query(collection(db, `artifacts/${__app_id}/users/${userId}/properties/${property.id}/units`), where('id', '==', unit.id)));
                  const latestUnitData = latestUnitDoc.docs[0]?.data();
                  if (latestUnitData) {
                    currentUnitRent = parseFloat(latestUnitData.rentAmount || 0);
                    // If the increment effective date is met AND the current rent amount in Firestore
                    // does not yet reflect this specific increment amount, then apply it.
                    // This relies on the assumption that `rentIncrementAmount` is a one-time addition.
                    if (incrementAppliedForThisRecord &&
                        (currentUnitRent < (parseFloat(unit.rentAmount) + rentIncrementAmount))) { // Check if original rent + increment is greater than current
                        currentUnitRent = parseFloat(unit.rentAmount) + rentIncrementAmount;
                        // Update the unit's base rent in Firestore to reflect the increment
                        const unitDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties/${property.id}/units`, unit.id);
                        await updateDoc(unitDocRef, {
                            rentAmount: currentUnitRent,
                            // Optionally, clear or update rentIncrementAmount/EffectiveDate if it's a one-time application
                            // For annual, you'd keep it and just update rentAmount.
                        });
                        console.log(`Applied rent increment for unit ${unit.number}. New rent: ${currentUnitRent}`);
                    }
                  }
                }

                // Calculate the exact due date for the current month's rent
                // Handle cases where moveInDate day is > days in target month (e.g., Feb 30th)
                const lastDayOfTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
                const finalRentDueDay = Math.min(rentDueDay, lastDayOfTargetMonth);
                const rentDueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), finalRentDueDay).toISOString().slice(0, 10);

                console.log(`Generating rent record for ${unit.number} (${unit.tenantName}) for ${targetMonthYearString}, Due: ${rentDueDate}`);
                try {
                  await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`), {
                    propertyId: property.id,
                    propertyName: property.name,
                    unitId: unit.id,
                    unitNumber: unit.number,
                    tenantName: unit.tenantName,
                    amount: currentUnitRent, // Use the potentially incremented rent
                    monthYear: targetMonthYearString,
                    isPaid: false,
                    dueDate: rentDueDate, // Store the specific due date
                    paymentDate: null, // New field
                    amountReceived: 0, // New field
                    isPartialPayment: false, // New field
                    partialReason: '', // New field
                    createdAt: new Date().toISOString(),
                  });
                } catch (e) {
                  console.error("Error auto-generating rent record: ", e);
                }
              }
            }
          }
        }
      }
    };

    if (properties.length > 0) {
        generateAndIncrementRecords();
    }

  }, [db, userId, isAuthReady, properties, rentRecords, __app_id]); // Added rentRecords to dependencies to re-run when new records appear

  const filteredRentRecords = useMemo(() => {
    return rentRecords.filter(record => {
      const recordMonth = parseInt(record.monthYear.split('-')[1]);
      const recordYear = parseInt(record.monthYear.split('-')[0]);
      const matchesMonth = recordMonth === selectedMonth;
      const matchesYear = recordYear === selectedYear;
      const matchesProperty = selectedPropertyId === 'all' || record.propertyId === selectedPropertyId;
      return matchesMonth && matchesYear && matchesProperty;
    }).sort((a, b) => {
      // Sort by unit number, then by tenant name
      const unitComparison = a.unitNumber.localeCompare(b.unitNumber);
      if (unitComparison !== 0) return unitComparison;
      return a.tenantName.localeCompare(b.tenantName);
    });
  }, [rentRecords, selectedMonth, selectedYear, selectedPropertyId]);

  const arrearsRecords = useMemo(() => {
    const today = new Date();

    return rentRecords.filter(record => {
      // A record is in arrears if:
      // 1. It's not fully paid (amount due > amount received)
      // 2. The due date has passed
      const amountRemaining = (record.amount || 0) - (record.amountReceived || 0);
      if (amountRemaining <= 0) return false; // Fully paid or overpaid

      const dueDate = record.dueDate ? new Date(record.dueDate) : new Date(record.monthYear);
      dueDate.setHours(23, 59, 59, 999); // Set to end of day for accurate overdue check

      return dueDate < today; // Overdue if due date is in the past
    }).map(record => {
      const dueDate = record.dueDate ? new Date(record.dueDate) : new Date(record.monthYear);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const amountRemaining = (record.amount || 0) - (record.amountReceived || 0);
      return { ...record, daysOverdue: daysOverdue > 0 ? daysOverdue : 0, amountRemaining };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [rentRecords]);

  const openEditRentPaymentModal = (record) => {
    setCurrentRentRecordToEdit(record);
    setEditPaymentDate(record.paymentDate || new Date().toISOString().slice(0, 10));
    setEditAmountReceived(record.amountReceived || record.amount || '');
    setEditIsFullPayment((record.amountReceived || 0) >= (record.amount || 0)); // Determine full payment based on amounts
    setEditPartialReason(record.partialReason || '');
    setFeedbackMessage('');
    setShowEditRentPaymentModal(true);
  };

  const handleUpdateRentPayment = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !currentRentRecordToEdit) return;

    const expectedAmount = currentRentRecordToEdit.amount;
    let finalAmountReceived = parseFloat(editAmountReceived);
    let finalIsPaid = false; // Default to false
    let finalPartialReason = editPartialReason.trim();

    if (isNaN(finalAmountReceived)) {
      setFeedbackMessage("Error: Amount Received must be a valid number.");
      return;
    }

    // Determine if it's a full payment
    if (finalAmountReceived >= expectedAmount) {
      finalIsPaid = true;
      finalPartialReason = ''; // Clear reason if full payment
      finalAmountReceived = expectedAmount; // Cap at expected amount for full payment
    } else {
      // It's a partial payment
      finalIsPaid = false;
      if (!finalPartialReason) {
        setFeedbackMessage("Error: Reason for difference is required for partial payments.");
        return;
      }

      // If the reason is 'Maintenance', consider it fully paid for rent tracking
      // and log the difference as an expense.
      if (finalPartialReason.toLowerCase() === 'maintenance') {
        finalIsPaid = true; // Mark rent as paid
        const maintenanceAmount = expectedAmount - finalAmountReceived;
        finalAmountReceived = expectedAmount; // Treat as if full amount received for rent record
        finalPartialReason = 'Maintenance deduction'; // Standardize reason

        // Add to expense tracker under "Maintenance"
        try {
          await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`), {
            date: editPaymentDate,
            propertyId: currentRentRecordToEdit.propertyId,
            propertyName: currentRentRecordToEdit.propertyName,
            unitId: currentRentRecordToEdit.unitId, // Ensure unitId is captured for expenses
            unitNumber: currentRentRecordToEdit.unitNumber, // Ensure unitNumber is captured for expenses
            amount: maintenanceAmount,
            reason: `Maintenance deduction from rent for Unit ${currentRentRecordToEdit.unitNumber}`,
            category: 'Maintenance', // This is correct
            notes: `Original rent: ${formatCurrency(expectedAmount)}, Received: ${formatCurrency(editAmountReceived)}. Maintenance cost: ${formatCurrency(maintenanceAmount)}`,
            createdAt: new Date().toISOString(),
          });
          setFeedbackMessage("Rent record updated and Maintenance expense added!");
        } catch (e) {
          console.error("Error adding maintenance expense:", e);
          setFeedbackMessage(`Error updating rent and adding expense: ${e.message}`);
          return; // Stop if expense logging fails
        }
      }
    }


    setFeedbackMessage('');
    try {
      const recordDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/rentRecords`, currentRentRecordToEdit.id);
      await updateDoc(recordDocRef, {
        isPaid: finalIsPaid,
        paymentDate: editPaymentDate,
        amountReceived: finalAmountReceived,
        isPartialPayment: !finalIsPaid, // True if not full payment
        partialReason: finalPartialReason,
      });
      setFeedbackMessage("Rent record updated successfully!");
      setShowEditRentPaymentModal(false);
      setCurrentRentRecordToEdit(null);
    } catch (e) {
      console.error("Error updating rent payment:", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const handleDeleteRentRecord = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !confirmDeleteRentModal) return;
    setFeedbackMessage('');
    try {
      const recordDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/rentRecords`, confirmDeleteRentModal.id);
      await deleteDoc(recordDocRef);
      setFeedbackMessage("Rent record deleted successfully!");
      setConfirmDeleteRentModal(null);
    } catch (e) {
      console.error("Error deleting rent record: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openConfirmDeleteRentModal = (id, propertyName, unitNumber, monthYear) => {
    setConfirmDeleteRentModal({ id, propertyName, unitNumber, monthYear });
    setFeedbackMessage('');
  };

  const handleSelectRentRecord = (recordId) => {
    setSelectedRentRecords(prev =>
      prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
    );
  };

  const handleSelectAllRentRecords = () => {
    if (selectedRentRecords.length === filteredRentRecords.length) {
      setSelectedRentRecords([]);
    } else {
      setSelectedRentRecords(filteredRentRecords.map(record => record.id));
    }
  };

  const handleBulkUpdateRentStatus = async (isPaidStatus) => {
    if (!db || !userId || !isAuthReady || !__app_id || selectedRentRecords.length === 0) {
      setFeedbackMessage("No records selected for bulk update.");
      return;
    }
    setFeedbackMessage('');
    try {
      const updatePromises = selectedRentRecords.map(recordId => {
        const recordToUpdate = filteredRentRecords.find(r => r.id === recordId);
        const recordDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/rentRecords`, recordId);
        const amount = recordToUpdate?.amount || 0;
        const paymentDate = new Date().toISOString().slice(0, 10); // Current date for bulk update

        return updateDoc(recordDocRef, {
          isPaid: isPaidStatus,
          paymentDate: isPaidStatus ? paymentDate : null,
          amountReceived: isPaidStatus ? amount : 0,
          isPartialPayment: false,
          partialReason: '',
        });
      });
      await Promise.all(updatePromises);
      setFeedbackMessage(`Bulk update successful: marked ${selectedRentRecords.length} records as ${isPaidStatus ? 'Paid' : 'Unpaid'}.`);
      setSelectedRentRecords([]);
    } catch (e) {
      console.error("Error performing bulk update:", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  // Arrears Bulk Delete Logic
  const handleSelectArrearsRecord = (recordId) => {
    setSelectedArrearsRecords(prev =>
      prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
    );
  };

  const handleSelectAllArrearsRecords = () => {
    if (selectedArrearsRecords.length === arrearsRecords.length) {
      setSelectedArrearsRecords([]);
    } else {
      setSelectedArrearsRecords(arrearsRecords.map(record => record.id));
    }
  };

  const handleBulkDeleteArrearsRecords = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || selectedArrearsRecords.length === 0) {
      setFeedbackMessage("No arrears records selected for bulk deletion.");
      return;
    }
    setFeedbackMessage('');
    try {
      const deletePromises = selectedArrearsRecords.map(recordId => {
        const recordDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/rentRecords`, recordId);
        return deleteDoc(recordDocRef);
      });
      await Promise.all(deletePromises);
      setFeedbackMessage(`Successfully deleted ${selectedArrearsRecords.length} arrears records.`);
      setSelectedArrearsRecords([]);
      setConfirmBulkDeleteArrearsModal(false);
    } catch (e) {
      console.error("Error performing bulk delete on arrears:", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Monthly Rent Tracker</h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md ${feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all duration-300`}>
          {feedbackMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="month-select-rent" className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
          <select
            id="month-select-rent"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year-select-rent" className="block text-sm font-medium text-gray-700 mb-1">Select Year</label>
          <select
            id="year-select-rent"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="property-select-rent" className="block text-sm font-medium text-gray-700 mb-1">Filter by Property</label>
          <select
            id="property-select-rent"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredRentRecords.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap gap-3 items-center">
          <p className="text-gray-700 font-semibold mr-2">Bulk Actions:</p>
          <button
            onClick={() => handleBulkUpdateRentStatus(true)}
            disabled={selectedRentRecords.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardCheck size={18} className="mr-2" /> Mark Selected Paid ({selectedRentRecords.length})
          </button>
          <button
            onClick={() => handleBulkUpdateRentStatus(false)}
            disabled={selectedRentRecords.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardX size={18} className="mr-2" /> Mark Selected Unpaid ({selectedRentRecords.length})
          </button>
        </div>
      )}

      {filteredRentRecords.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          No rent records found for the selected period.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    checked={selectedRentRecords.length === filteredRentRecords.length && filteredRentRecords.length > 0}
                    onChange={handleSelectAllRentRecords}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason for Difference</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRentRecords.map(record => (
                <tr key={record.id} className={record.isPaid ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                      checked={selectedRentRecords.includes(record.id)}
                      onChange={() => handleSelectRentRecord(record.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.propertyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.unitNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.tenantName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amountReceived)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.paymentDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {record.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.partialReason || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditRentPaymentModal(record)}
                        className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center transition-colors duration-200"
                      >
                        <Edit size={14} className="mr-1" /> Edit Payment
                      </button>
                      <button
                        onClick={() => openConfirmDeleteRentModal(record.id, record.propertyName, record.unitNumber, record.monthYear)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Rent Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Arrears Report */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Unpaid & Overdue Rent (Arrears)</h3>
        {arrearsRecords.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setConfirmBulkDeleteArrearsModal(true)}
              disabled={selectedArrearsRecords.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={20} className="mr-2" /> Bulk Delete Selected ({selectedArrearsRecords.length})
            </button>
          </div>
        )}
        {arrearsRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
            No unpaid or overdue rent records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                      checked={selectedArrearsRecords.length === arrearsRecords.length && arrearsRecords.length > 0}
                      onChange={handleSelectAllArrearsRecords}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit #</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month Due</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Remaining</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {arrearsRecords.map(record => (
                  <tr key={record.id} className="bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        checked={selectedArrearsRecords.includes(record.id)}
                        onChange={() => handleSelectArrearsRecord(record.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.propertyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.unitNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.tenantName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.monthYear).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.amountReceived)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 font-semibold">{formatCurrency(record.amountRemaining)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 font-semibold">
                      {record.daysOverdue} {record.daysOverdue === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditRentPaymentModal(record)}
                          className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center transition-colors duration-200"
                        >
                          <CheckCircle size={14} className="mr-1" /> Update Payment
                        </button>
                        <button
                          onClick={() => openConfirmDeleteRentModal(record.id, record.propertyName, record.unitNumber, record.monthYear)}
                          className="text-red-600 hover:text-red-900 ml-2"
                          title="Delete Rent Record"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Rent Payment Modal */}
      <Modal isOpen={showEditRentPaymentModal} title="Edit Rent Payment" onClose={() => setShowEditRentPaymentModal(false)}>
        {currentRentRecordToEdit && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Editing payment for: <span className="font-semibold">{currentRentRecordToEdit.propertyName} - Unit {currentRentRecordToEdit.unitNumber} ({new Date(currentRentRecordToEdit.monthYear).toLocaleString('en-US', { month: 'long', year: 'numeric' })})</span>
            </p>
            <p className="text-gray-700">
              Amount Due: <span className="font-semibold">{formatCurrency(currentRentRecordToEdit.amount)}</span>
            </p>

            <div>
              <label htmlFor="editPaymentDate" className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input
                type="date"
                id="editPaymentDate"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="editAmountReceived" className="block text-sm font-medium text-gray-700">Amount Received</label>
              <input
                type="number"
                id="editAmountReceived"
                value={editAmountReceived}
                onChange={(e) => {
                  setEditAmountReceived(e.target.value);
                  const received = parseFloat(e.target.value);
                  // Automatically set full payment if received amount is >= expected
                  setEditIsFullPayment(received >= currentRentRecordToEdit.amount);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <input
                id="editIsFullPayment"
                name="editIsFullPayment"
                type="checkbox"
                checked={editIsFullPayment}
                onChange={(e) => {
                    setEditIsFullPayment(e.target.checked);
                    if (e.target.checked) {
                        setEditAmountReceived(currentRentRecordToEdit.amount);
                        setEditPartialReason('');
                    } else {
                        // If unchecking full payment, set amount received to current value if already less, else 0
                        setEditAmountReceived(prev => (parseFloat(prev) < currentRentRecordToEdit.amount ? prev : '0'));
                    }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="editIsFullPayment" className="ml-2 block text-sm text-gray-900">
                Full Amount Paid
              </label>
            </div>

            {!editIsFullPayment && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700">Difference: {formatCurrency(currentRentRecordToEdit.amount - (parseFloat(editAmountReceived) || 0))}</p>
                <div>
                  <label htmlFor="editPartialReason" className="block text-sm font-medium text-gray-700">Reason for Difference</label>
                  <select
                    id="editPartialReason"
                    value={editPartialReason}
                    onChange={(e) => setEditPartialReason(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a reason</option>
                    <option value="Late Payment">Late Payment</option>
                    <option value="Partial Payment">Partial Payment</option>
                    <option value="Maintenance">Maintenance</option>
                    {/* Add more options as needed */}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select "Maintenance" if the difference is due to maintenance work, it will be logged as an expense.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditRentPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRentPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Update Payment
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Delete Rent Record Modal */}
      <Modal isOpen={!!confirmDeleteRentModal} title="Confirm Delete Rent Record" onClose={() => setConfirmDeleteRentModal(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the rent record for{' '}
            <span className="font-semibold">{confirmDeleteRentModal?.propertyName} - Unit {confirmDeleteRentModal?.unitNumber} ({confirmDeleteRentModal?.monthYear})</span>?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDeleteRentModal(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRentRecord}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Bulk Delete Arrears Modal */}
      <Modal isOpen={confirmBulkDeleteArrearsModal} title="Confirm Bulk Delete Arrears" onClose={() => setConfirmBulkDeleteArrearsModal(false)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{selectedArrearsRecords.length}</span> selected arrears records? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmBulkDeleteArrearsModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDeleteArrearsRecords}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete Selected
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Expense Logger Component ---
const ExpenseLogger = () => {
  const { db, userId, isAuthReady, __app_id, formatDate, formatCurrency } = useContext(AppContext);
  const [properties, setProperties] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExpensePropertyId, setNewExpensePropertyId] = useState('');
  const [newExpenseUnitId, setNewExpenseUnitId] = useState(''); // New state for unit ID
  const [newExpenseUnitNumber, setNewExpenseUnitNumber] = useState(''); // New state for unit number
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseReason, setNewExpenseReason] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newExpenseNotes, setNewExpenseNotes] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteCategoryModal, setConfirmDeleteCategoryModal] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
    const userExpensesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
    const userCategoriesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenseCategories`);

    const unsubscribeProperties = onSnapshot(userPropertiesCollectionRef, async (snapshot) => {
      const fetchedProperties = [];
      for (const doc of snapshot.docs) {
        const propertyData = { id: doc.id, ...doc.data(), units: [] };
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${doc.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        propertyData.units = unitSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
        fetchedProperties.push(propertyData);
      }
      setProperties(fetchedProperties);
    }, (error) => console.error("Error fetching properties for expense logger:", error));

    const unsubscribeExpenses = onSnapshot(userExpensesCollectionRef, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching expenses:", error));

    const unsubscribeCategories = onSnapshot(userCategoriesCollectionRef, (snapshot) => {
      setExpenseCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching expense categories:", error));

    return () => {
      unsubscribeProperties();
      unsubscribeExpenses();
      unsubscribeCategories();
    };
  }, [db, userId, isAuthReady, __app_id]);

  // Helper to find units for a selected property
  const getUnitsForProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.units : [];
  };

  const handleAddEditExpense = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !newExpenseDate.trim() || !newExpenseAmount || !newExpenseReason.trim() || !newExpenseCategory || !newExpensePropertyId) {
      setFeedbackMessage("All expense fields (Date, Property, Amount, Reason, Category) are required.");
      return;
    }

    const selectedProperty = properties.find(p => p.id === newExpensePropertyId);
    if (!selectedProperty) {
      setFeedbackMessage("Selected property not found.");
      return;
    }

    // Unit number is now mandatory if a property is selected
    if (newExpensePropertyId && !newExpenseUnitId) {
      setFeedbackMessage("Unit Number is required for the selected property.");
      return;
    }

    setFeedbackMessage('');
    try {
      const expenseData = {
        date: newExpenseDate,
        propertyId: newExpensePropertyId,
        propertyName: selectedProperty.name,
        unitId: newExpenseUnitId, // Include unitId (now mandatory if property selected)
        unitNumber: newExpenseUnitNumber, // Include unitNumber (now mandatory if property selected)
        amount: parseFloat(newExpenseAmount),
        reason: newExpenseReason,
        category: newExpenseCategory,
        notes: newExpenseNotes,
      };

      if (editingExpense) {
        const expenseDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/expenses`, editingExpense.id);
        await updateDoc(expenseDocRef, expenseData);
        setFeedbackMessage("Expense updated successfully!");
      } else {
        const expensesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
        await addDoc(expensesCollectionRef, {
          ...expenseData,
          createdAt: new Date().toISOString(),
        });
        setFeedbackMessage("Expense added successfully!");
      }
      setNewExpenseDate(new Date().toISOString().slice(0, 10));
      setNewExpensePropertyId('');
      setNewExpenseUnitId('');
      setNewExpenseUnitNumber('');
      setNewExpenseAmount('');
      setNewExpenseReason('');
      setNewExpenseCategory('');
      setNewExpenseNotes('');
      setEditingExpense(null);
      setShowExpenseModal(false);
    } catch (e) {
      console.error("Error adding/updating expense: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setNewExpenseDate(new Date().toISOString().slice(0, 10));
    setNewExpensePropertyId(properties.length > 0 ? properties[0].id : '');
    setNewExpenseUnitId('');
    setNewExpenseUnitNumber('');
    setNewExpenseAmount('');
    setNewExpenseReason('');
    setNewExpenseCategory('');
    setNewExpenseNotes('');
    setFeedbackMessage('');
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setNewExpenseDate(expense.date);
    setNewExpensePropertyId(expense.propertyId);
    setNewExpenseUnitId(expense.unitId || ''); // Ensure unitId is set for editing
    setNewExpenseUnitNumber(expense.unitNumber || ''); // Ensure unitNumber is set for editing
    setNewExpenseAmount(expense.amount);
    setNewExpenseReason(expense.reason);
    setNewExpenseCategory(expense.category || '');
    setNewExpenseNotes(expense.notes || '');
    setFeedbackMessage('');
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !confirmDeleteModal) return;
    setFeedbackMessage('');
    try {
      const expenseDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/expenses`, confirmDeleteModal.id);
      await deleteDoc(expenseDocRef);
      setFeedbackMessage("Expense deleted successfully!");
      setConfirmDeleteModal(null);
    } catch (e) {
      console.error("Error deleting expense: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openConfirmDeleteModal = (id, reason) => {
    setConfirmDeleteModal({ id, reason });
    setFeedbackMessage('');
  };

  const handleAddEditCategory = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !newCategoryName.trim()) {
      setFeedbackMessage("Category name is required.");
      return;
    }
    setFeedbackMessage('');
    try {
      if (editingCategory) {
        const categoryDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/expenseCategories`, editingCategory.id);
        await updateDoc(categoryDocRef, { name: newCategoryName });
        setFeedbackMessage("Category updated!");
      } else {
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/expenseCategories`), {
          name: newCategoryName,
          createdAt: new Date().toISOString(),
        });
        setFeedbackMessage("Category added!");
      }
      setNewCategoryName('');
      setEditingCategory(null);
      setShowCategoryModal(false);
    } catch (e) {
      console.error("Error adding/editing category:", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setFeedbackMessage('');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setFeedbackMessage('');
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !confirmDeleteCategoryModal) return;
    setFeedbackMessage('');
    try {
      const categoryDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/expenseCategories`, confirmDeleteCategoryModal.id);
      await deleteDoc(categoryDocRef);
      setFeedbackMessage("Category deleted!");
      setConfirmDeleteCategoryModal(null);
    } catch (e) {
      console.error("Error deleting category:", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openConfirmDeleteCategoryModal = (id, name) => {
    setConfirmDeleteCategoryModal({ id, name });
    setFeedbackMessage('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Expense Logger</h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md ${feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all duration-300`}>
          {feedbackMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={openAddExpenseModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Expense
        </button>
        <button
          onClick={openAddCategoryModal}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200"
        >
          <Edit size={20} className="mr-2" /> Manage Categories
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          No expenses added yet. Click "Add New Expense" to record one!
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit #</th> {/* New column */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.propertyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.unitNumber || '-'}</td> {/* Display unit number */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.category || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.notes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditExpenseModal(expense)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Expense"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => openConfirmDeleteModal(expense.id, expense.reason)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Expense"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense Modal (Add/Edit) */}
      <Modal isOpen={showExpenseModal} title={editingExpense ? "Edit Expense" : "Add New Expense"} onClose={() => setShowExpenseModal(false)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="expenseDate"
              value={newExpenseDate}
              onChange={(e) => setNewExpenseDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="expenseProperty" className="block text-sm font-medium text-gray-700">Property</label>
            <select
              id="expenseProperty"
              value={newExpensePropertyId}
              onChange={(e) => {
                setNewExpensePropertyId(e.target.value);
                setNewExpenseUnitId(''); // Reset unit when property changes
                setNewExpenseUnitNumber('');
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required // Make property selection required
            >
              <option value="">Select a Property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
          {newExpensePropertyId && (
            <div>
              <label htmlFor="expenseUnit" className="block text-sm font-medium text-gray-700">Unit Number</label>
              <select
                id="expenseUnit"
                value={newExpenseUnitId}
                onChange={(e) => {
                  const selectedUnit = getUnitsForProperty(newExpensePropertyId).find(unit => unit.id === e.target.value);
                  setNewExpenseUnitId(e.target.value);
                  setNewExpenseUnitNumber(selectedUnit ? selectedUnit.number : ''); // Set unit number
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                required // Make unit selection required if property is selected
              >
                <option value="">Select a Unit</option>
                {getUnitsForProperty(newExpensePropertyId).map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.number} ({unit.tenantName})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              id="expenseAmount"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 150.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="expenseReason" className="block text-sm font-medium text-gray-700">Reason</label>
            <input
              type="text"
              id="expenseReason"
              value={newExpenseReason}
              onChange={(e) => setNewExpenseReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Plumbing Repair"
              required
            />
          </div>
          <div>
            <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              id="expenseCategory"
              value={newExpenseCategory}
              onChange={(e) => setNewExpenseCategory(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a Category</option>
              {expenseCategories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="expenseNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="expenseNotes"
              value={newExpenseNotes}
              onChange={(e) => setNewExpenseNotes(e.target.value)}
              rows="2"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the expense..."
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowExpenseModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditExpense}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {editingExpense ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Delete Expense Modal */}
      <Modal isOpen={!!confirmDeleteModal} title="Confirm Delete Expense" onClose={() => setConfirmDeleteModal(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the expense for{' '}
            <span className="font-semibold">{confirmDeleteModal?.reason}</span>?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDeleteModal(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteExpense}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Management Modal */}
      <Modal isOpen={showCategoryModal} title={editingCategory ? "Edit Category" : "Manage Expense Categories"} onClose={() => setShowCategoryModal(false)}>
        <div className="space-y-4">
          <div className="flex mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={editingCategory ? "Update category name" : "New category name"}
            />
            <button
              onClick={handleAddEditCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md transition-colors duration-200"
            >
              {editingCategory ? "Update" : "Add"}
            </button>
          </div>

          {expenseCategories.length === 0 ? (
            <p className="text-gray-600 text-center">No custom categories yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
              {expenseCategories.map(category => (
                <li key={category.id} className="flex justify-between items-center py-2 px-3">
                  <span className="text-gray-900">{category.name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditCategoryModal(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => openConfirmDeleteCategoryModal(category.id, category.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* Confirmation Delete Category Modal */}
      <Modal isOpen={!!confirmDeleteCategoryModal} title="Confirm Delete Category" onClose={() => setConfirmDeleteCategoryModal(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the category{' '}
            <span className="font-semibold">{confirmDeleteCategoryModal?.name}</span>?
            This will NOT delete expenses already assigned to this category.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDeleteCategoryModal(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCategory}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Task Manager Component ---
const TaskManager = () => {
  const { db, userId, isAuthReady, __app_id, formatDate } = useContext(AppContext);
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPropertyId, setNewTaskPropertyId] = useState('');
  const [newTaskUnitId, setNewTaskUnitId] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('Open');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const taskStatuses = ['Open', 'In Progress', 'Completed'];

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
    const userTasksCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/tasks`);

    const unsubscribeProperties = onSnapshot(userPropertiesCollectionRef, async (snapshot) => {
      const fetchedProperties = [];
      for (const doc of snapshot.docs) {
        const propertyData = { id: doc.id, ...doc.data(), units: [] };
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${doc.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        propertyData.units = unitSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
        fetchedProperties.push(propertyData);
      }
      setProperties(fetchedProperties);
    }, (error) => console.error("Error fetching properties for tasks:", error));

    const unsubscribeTasks = onSnapshot(userTasksCollectionRef, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching tasks:", error));

    return () => {
      unsubscribeProperties();
      unsubscribeTasks();
    };
  }, [db, userId, isAuthReady, __app_id]);

  const handleAddEditTask = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !newTaskDescription.trim() || !newTaskStatus) {
      setFeedbackMessage("Task description and status are required.");
      return;
    }

    const selectedProperty = properties.find(p => p.id === newTaskPropertyId);
    const selectedUnit = selectedProperty?.units.find(u => u.id === newTaskUnitId);
    setFeedbackMessage('');
    try {
      const taskData = {
        description: newTaskDescription,
        dueDate: newTaskDueDate || null,
        propertyId: newTaskPropertyId || null,
        propertyName: selectedProperty?.name || null,
        unitId: newTaskUnitId || null,
        unitNumber: selectedUnit?.number || null,
        status: newTaskStatus,
        notes: newTaskNotes,
      };

      if (editingTask) {
        const taskDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/tasks`, editingTask.id);
        await updateDoc(taskDocRef, taskData);
        setFeedbackMessage("Task updated successfully!");
      } else {
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/tasks`), {
          ...taskData,
          createdAt: new Date().toISOString(),
        });
        setFeedbackMessage("Task added successfully!");
      }
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskPropertyId('');
      setNewTaskUnitId('');
      setNewTaskStatus('Open');
      setNewTaskNotes('');
      setEditingTask(null);
      setShowTaskModal(false);
    } catch (e) {
      console.error("Error adding/updating task: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openAddTaskModal = () => {
    setEditingTask(null);
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setNewTaskPropertyId('');
    setNewTaskUnitId('');
    setNewTaskStatus('Open');
    setNewTaskNotes('');
    setFeedbackMessage('');
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setNewTaskDescription(task.description);
    setNewTaskDueDate(task.dueDate || '');
    setNewTaskPropertyId(task.propertyId || '');
    setNewTaskUnitId(task.unitId || '');
    setNewTaskStatus(task.status);
    setNewTaskNotes(task.notes || '');
    setFeedbackMessage('');
    setShowTaskModal(true);
  };

  const handleDeleteTask = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !confirmDeleteModal) return;
    setFeedbackMessage('');
    try {
      const taskDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/tasks`, confirmDeleteModal.id);
      await deleteDoc(taskDocRef);
      setFeedbackMessage("Task deleted successfully!");
      setConfirmDeleteModal(null);
    } catch (e) {
      console.error("Error deleting task: ", e);
      setFeedbackMessage(`Error: ${e.message}`);
    }
  };

  const openConfirmDeleteModal = (id, description) => {
    setConfirmDeleteModal({ id, description });
    setFeedbackMessage('');
  };

  const getUnitsForSelectedProperty = useMemo(() => {
    const selectedProp = properties.find(p => p.id === newTaskPropertyId);
    return selectedProp ? selectedProp.units : [];
  }, [properties, newTaskPropertyId]);

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPropertyId, setFilterPropertyId] = useState('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
      const matchesProperty = filterPropertyId === 'all' || task.propertyId === filterPropertyId;
      return matchesStatus && matchesProperty;
    }).sort((a, b) => {
      const statusOrder = { 'Open': 1, 'In Progress': 2, 'Completed': 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.dueDate && b.dueDate) {
        if (a.status === 'Completed' && b.status === 'Completed') {
          return new Date(b.dueDate) - new Date(a.dueDate);
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [tasks, filterStatus, filterPropertyId]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Task Manager</h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md ${feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all duration-300`}>
          {feedbackMessage}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={openAddTaskModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center transition-colors duration-200"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="All">All Statuses</option>
            {taskStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterProperty" className="block text-sm font-medium text-gray-700 mb-1">Filter by Property</label>
          <select
            id="filterProperty"
            value={filterPropertyId}
            onChange={(e) => setFilterPropertyId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
          No tasks found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.dueDate ? formatDate(task.dueDate) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.propertyName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.unitNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'Open' ? 'bg-red-100 text-red-800' :
                      task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.notes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Task"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => openConfirmDeleteModal(task.id, task.description)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Task"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal (Add/Edit) */}
      <Modal isOpen={showTaskModal} title={editingTask ? "Edit Task" : "Add New Task"} onClose={() => setShowTaskModal(false)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              id="taskDescription"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Fix leaky faucet"
            />
          </div>
          <div>
            <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
            <input
              type="date"
              id="taskDueDate"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="taskProperty" className="block text-sm font-medium text-gray-700">Property (Optional)</label>
            <select
              id="taskProperty"
              value={newTaskPropertyId}
              onChange={(e) => {
                setNewTaskPropertyId(e.target.value);
                setNewTaskUnitId('');
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a Property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
          {newTaskPropertyId && (
            <div>
              <label htmlFor="taskUnit" className="block text-sm font-medium text-gray-700">Unit (Optional)</label>
              <select
                id="taskUnit"
                value={newTaskUnitId}
                onChange={(e) => setNewTaskUnitId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a Unit</option>
                {getUnitsForSelectedProperty.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.number}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="taskStatus"
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {taskStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="taskNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              id="taskNotes"
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              rows="2"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the task..."
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowTaskModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {editingTask ? "Update Task" : "Add Task"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Delete Task Modal */}
      <Modal isOpen={!!confirmDeleteModal} title="Confirm Delete Task" onClose={() => setConfirmDeleteModal(null)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the task:{' '}
            <span className="font-semibold">{confirmDeleteModal?.description}</span>?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDeleteModal(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTask}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


// --- Reminders Component ---
const Reminders = () => {
  const [senderGmailEmail, setSenderGmailEmail] = useState(''); // Your Gmail
  const [recipientEmail, setRecipientEmail] = useState(''); // Where reminders are sent
  const [appPassword, setAppPassword] = useState('');
  const [reminderFrequency, setReminderFrequency] = useState('monthly');
  const [reminderDay, setReminderDay] = useState(1);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSaveSettings = () => {
    if (!senderGmailEmail.trim() || !recipientEmail.trim() || !appPassword.trim()) {
      setFeedbackMessage("Error: All email settings fields are required.");
      return;
    }
    setFeedbackMessage('');
    // In a real application, you would securely store these settings in Firestore
    // For now, we'll just log them and provide a success message.
    console.log("Reminder settings saved (placeholder):", {
      senderGmailEmail,
      recipientEmail,
      reminderFrequency,
      reminderDay,
      // appPassword should NOT be logged or stored client-side in a real app
    });
    setFeedbackMessage("Reminder settings saved! (Note: Actual email sending requires a separate backend setup or local script with Task Scheduler/Cron Job.)");
  };

  const handleSendTestEmail = () => {
    setFeedbackMessage('');
    if (!senderGmailEmail.trim() || !recipientEmail.trim() || !appPassword.trim()) {
      setFeedbackMessage("Error: Please fill in all email settings before sending a test email.");
      return;
    }
    console.log("Sending test email (placeholder)...");
    setFeedbackMessage("Test email sent! (Note: This is a placeholder. Actual email sending requires a separate backend setup or local script.)");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Reminders</h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md ${feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all duration-300`}>
          {feedbackMessage}
        </div>
      )}

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-sm flex items-start" role="alert">
        <Info size={24} className="mr-3 flex-shrink-0 mt-1" />
        <div>
          <p className="font-bold">Important Note on Email Reminders:</p>
          <p className="text-sm">
            Direct email sending from a client-side web application is **not secure or practical**.
            To enable automated email reminders, you would typically need a separate **backend service**
            (e.g., using Node.js, Python, or Firebase Cloud Functions) that runs independently.
            This script would then be triggered by your operating system's Task Scheduler (Windows) or Cron Jobs (macOS/Linux),
            or by a cloud service.
            <br/><br/>
            The **backend script** would be responsible for:
            <ul className="list-disc list-inside ml-4 mt-2">
                <li>Reading your configured email settings (sender, recipient, app password).</li>
                <li>Querying your Firestore database for rent records where `isPaid` is `false` for the current month.</li>
                <li>Composing and sending emails only for the unpaid records.</li>
            </ul>
            <br/>
            This application provides the UI for you to **configure** these email settings, but the actual email sending mechanism
            needs to be implemented **externally**.
            <br/><br/>
            If you choose to implement email sending, consider using <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-yellow-800 underline">Google App Passwords</a>
            instead of your main Gmail password for security.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-5">
        <h3 className="text-xl font-semibold text-gray-800">Email Reminder Settings</h3>

        <div>
          <label htmlFor="senderGmailEmail" className="block text-sm font-medium text-gray-700">Your Gmail Address (Sender)</label>
          <input
            type="email"
            id="senderGmailEmail"
            value={senderGmailEmail}
            onChange={(e) => setSenderGmailEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="your.email@gmail.com"
          />
        </div>

        <div>
          <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700">Recipient Email Address (Where reminders are sent)</label>
          <input
            type="email"
            id="recipientEmail"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="reminders@example.com or your.email@gmail.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            This is the email address that will receive the rent reminders.
          </p>
        </div>

        <div>
          <label htmlFor="appPassword" className="block text-sm font-medium text-gray-700">Gmail App Password (for Sender Email)</label>
          <input
            type="password"
            id="appPassword"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., xxxx xxxx xxxx xxxx (from Google App Passwords)"
          />
          <p className="mt-1 text-xs text-gray-500">
            This is NOT your main Gmail password. Generate an App Password in your Google Account security settings.
          </p>
        </div>

        <div>
          <label htmlFor="reminderFrequency" className="block text-sm font-medium text-gray-700">Reminder Frequency</label>
          <select
            id="reminderFrequency"
            value={reminderFrequency}
            onChange={(e) => setReminderFrequency(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {reminderFrequency === 'monthly' && (
          <div>
            <label htmlFor="reminderDay" className="block text-sm font-medium text-gray-700">Day of Month for Reminder</label>
            <input
              type="number"
              id="reminderDay"
              value={reminderDay}
              onChange={(e) => setReminderDay(Math.max(1, Math.min(31, Number(e.target.value))))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="31"
            />
            <p className="mt-1 text-xs text-gray-500">
              e.g., 1 for the 1st of the month.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleSendTestEmail}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center"
          >
            <MailIcon size={18} className="mr-2" /> Send Test Email
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Export System Component ---
const ExportSystem = () => {
  const { db, userId, isAuthReady, __app_id } = useContext(AppContext);
  const [properties, setProperties] = useState([]);
  const [rentRecords, setRentRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
    const userRentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
    const userExpensesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
    const userTasksCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/tasks`);

    const unsubscribeProperties = onSnapshot(userPropertiesCollectionRef, async (snapshot) => {
      const fetchedProperties = [];
      for (const doc of snapshot.docs) {
        const propertyData = { id: doc.id, ...doc.data(), units: [] };
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${doc.id}/units`);
        const unitSnapshot = await getDocs(unitsCollectionRef);
        propertyData.units = unitSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
        fetchedProperties.push(propertyData);
      }
      setProperties(fetchedProperties);
    }, (error) => console.error("Error fetching properties for export:", error));

    const unsubscribeRentRecords = onSnapshot(userRentRecordsCollectionRef, (snapshot) => {
      setRentRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching rent records for export:", error));

    const unsubscribeExpenses = onSnapshot(userExpensesCollectionRef, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching expenses for export:", error));

    const unsubscribeTasks = onSnapshot(userTasksCollectionRef, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching tasks for export:", error));

    return () => {
      unsubscribeProperties();
      unsubscribeRentRecords();
      unsubscribeExpenses();
      unsubscribeTasks();
    };
  }, [db, userId, isAuthReady, __app_id]);

  const convertToCsv = (data, headers) => {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header] !== undefined ? row[header] : '';
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const downloadCsv = (csvString, filename) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedbackMessage(`Successfully exported ${filename}`);
    } else {
      setFeedbackMessage("Error: Your browser does not support automatic CSV download. Please copy the data manually.");
    }
  };

  const handleExportRent = () => {
    if (rentRecords.length === 0) {
      setFeedbackMessage("No rent records to export.");
      return;
    }
    // Updated headers for rent records
    const headers = ['id', 'propertyId', 'propertyName', 'unitId', 'unitNumber', 'tenantName', 'amount', 'amountReceived', 'monthYear', 'isPaid', 'paymentDate', 'dueDate', 'isPartialPayment', 'partialReason', 'createdAt'];
    const csv = convertToCsv(rentRecords, headers);
    downloadCsv(csv, 'rent_records.csv');
  };

  const handleExportExpenses = () => {
    if (expenses.length === 0) {
      setFeedbackMessage("No expense records to export.");
      return;
    }
    // Updated headers for expenses to include unitId and unitNumber
    const headers = ['id', 'date', 'propertyId', 'propertyName', 'unitId', 'unitNumber', 'amount', 'reason', 'category', 'notes', 'createdAt'];
    const csv = convertToCsv(expenses, headers);
    downloadCsv(csv, 'expense_records.csv');
  };

  const handleExportPropertiesAndUnits = () => {
    if (properties.length === 0) {
      setFeedbackMessage("No property or unit data to export.");
      return;
    }

    const allUnits = properties.flatMap(prop => prop.units.map(unit => ({
      ...unit,
      propertyName: prop.name,
      propertyImageUrl: prop.imageUrl || '',
      propertyNotes: prop.notes || '',
    })));

    // Updated headers for properties and units
    const headers = [
      'id', 'propertyId', 'propertyName', 'propertyImageUrl', 'propertyNotes',
      'number', 'tenantName', 'rentAmount', 'moveInDate', 'notes',
      'phoneNumber', 'email', 'emergencyContactName', 'emergencyContactPhone',
      'leaseStartDate', 'leaseEndDate', 'securityDepositAmount', 'leaseTerm',
      'rentIncrementAmount', 'rentIncrementEffectiveDate', 'createdAt' // Updated increment fields
    ];
    const csv = convertToCsv(allUnits, headers);
    downloadCsv(csv, 'properties_units_data.csv');
  };

  const handleExportTasks = () => {
    if (tasks.length === 0) {
      setFeedbackMessage("No tasks to export.");
      return;
    }
    const headers = ['id', 'description', 'dueDate', 'propertyId', 'propertyName', 'unitId', 'unitNumber', 'status', 'notes', 'createdAt'];
    const csv = convertToCsv(tasks, headers);
    downloadCsv(csv, 'tasks_data.csv');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Export Data</h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md ${feedbackMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-all duration-300`}>
          {feedbackMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md space-y-5">
        <p className="text-gray-700">
          Export your rental property data to CSV files. These files can be opened in spreadsheet software for analysis, accounting, or backup purposes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleExportRent}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 w-full"
          >
            <Download size={20} className="mr-2" /> Rent Data
          </button>
          <button
            onClick={handleExportExpenses}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 w-full"
          >
            <Download size={20} className="mr-2" /> Expense Data
          </button>
          <button
            onClick={handleExportPropertiesAndUnits}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 w-full"
          >
            <Download size={20} className="mr-2" /> Properties & Units
          </button>
          <button
            onClick={handleExportTasks}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 w-full"
          >
            <Download size={20} className="mr-2" /> Task Data
          </button>
        </div>

        <div className="mt-6 text-gray-600 text-sm space-y-2">
          <p>
            <span className="font-semibold">Rent Data Fields:</span> ID, Property ID, Property Name, Unit ID, Unit Number, Tenant Name, Amount Due, Amount Received, Month/Year, Is Paid, Payment Date, Due Date, Is Partial Payment, Partial Reason, Created At.
          </p>
          <p>
            <span className="font-semibold">Expense Data Fields:</span> ID, Date, Property ID, Property Name, Unit ID, Unit Number, Amount, Reason, Category, Notes, Created At.
          </p>
          <p>
            <span className="font-semibold">Properties & Units Data Fields:</span> ID, Property ID, Property Name, Property Image URL, Property Notes, Unit Number, Tenant Name, Rent Amount, Move-in Date, Unit Notes, Phone Number, Email, Emergency Contact Name, Emergency Contact Phone, Lease Start Date, Lease End Date, Security Deposit Amount, Lease Term, Rent Increment Amount, Rent Increment Effective Date, Created At.
          </p>
          <p>
            <span className="font-semibold">Task Data Fields:</span> ID, Description, Due Date, Property ID, Property Name, Unit ID, Unit Number, Status, Notes, Created At.
          </p>
        </div>
      </div>
    </div>
  );
};

// Tailwind CSS Configuration (included for completeness, typically in index.html or a build process)
// This is a placeholder and assumes Tailwind is loaded via CDN in the HTML.
// <script src="https://cdn.tailwindcss.com"></script>
// <style>
//   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
//   body { font-family: 'Inter', sans-serif; }
//   /* Custom animation for modal */
//   @keyframes fade-in-up {
//     from { opacity: 0; transform: translateY(20px); }\
//     to { opacity: 1; transform: translateY(0); }
//   }
//   .animate-fade-in-up {
//     animation: fade-in-up 0.3s ease-out forwards;
//   }
// </style>

export default App;

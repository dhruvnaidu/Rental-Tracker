import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'; // Added sendPasswordResetEmail
import { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, setDoc, getDoc } from 'firebase/firestore';
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
  UserPlus as SignUpIcon,
  Eye, // Added for password visibility toggle
  EyeOff // Added for password visibility toggle
} from 'lucide-react';

// Context for Firebase and User
const AppContext = createContext(null);

// Utility function to format date for display (timezone-safe)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  // Appending 'T00:00:00' explicitly tells the browser to parse the string as local time at midnight
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Utility function to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  let dateObj;
  // If the string is just YYYY-MM-DD, parse it as local time at midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    dateObj = new Date(dateString + 'T00:00:00');
  } else {
    // Otherwise, assume it's a full date string (e.g., ISO string) and parse directly
    dateObj = new Date(dateString);
  }

  if (isNaN(dateObj.getTime())) return '';

  // Now, format this local date object back to YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
      <div className={`relative bg-base-200 rounded-lg shadow-xl ${maxWidth} w-full mx-auto p-6 animate-fade-in-up`}> {/* Changed bg-white to bg-base-200 */}
        <div className="flex justify-between items-center pb-3 border-b border-base-300 mb-4"> {/* Changed border-gray-200 to border-base-300 */}
          <h3 className="text-xl font-semibold text-base-content">{title}</h3> {/* Changed text-gray-900 to text-base-content */}
          <button
            onClick={onClose}
            className="text-base-content/70 hover:text-base-content transition-colors duration-200" /* Adjusted text color for dark theme */
          >
            <XCircle size={24} />
          </button>
        </div>
        {/* Added this div for scrollable content with max height */}
        <div className="modal-content-scrollable max-h-[70vh] overflow-y-auto pr-2"> {/* pr-2 for scrollbar */}
          {children}
        </div>
      </div>
    </div>
  );
};

// Custom Message Box Component
const MessageBox = ({ message, type, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const titleText = type === 'error' ? 'Error' : 'Success';
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white p-3 rounded-md shadow-lg z-50 animate-fade-in-up flex items-center`}>
      <div className="mr-2 font-bold">{titleText}:</div>
      <div>{message}</div>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-100">
        <XCircle size={16} />
      </button>
    </div>
  );
};


// AuthScreen Component for Login/Signup
const AuthScreen = () => {
  const { auth } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  // const [error, setError] = useState(''); // Removed unused error state
  const [isLoading, setIsLoading] = useState(false);
  const [messageBox, setMessageBox] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const showMessage = (message, type) => {
    setMessageBox({ message, type });
  };

  const handleAuthAction = async () => {
    // setError(''); // Removed unused setError
    setMessageBox(null); // Clear previous messages
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        showMessage('Registration successful! You are now logged in.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful!', 'success');
      }
    } catch (e) {
      console.error("Auth Error:", e.message);
      // setError(e.message); // Removed unused setError
      showMessage(e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showMessage('Please enter your email address to reset password.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage('Password reset email sent! Check your inbox.', 'success');
    } catch (e) {
      console.error("Password Reset Error:", e.message);
      showMessage(`Failed to send reset email: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Changed background to match dashboard's main content background (bg-base-100)
    <div className="flex items-center justify-center min-h-screen p-4 bg-base-100">
      {/* Changed bg-white to bg-base-300 for a darker card, adjusted text colors for readability */}
      <div className="bg-base-300 p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6 transform transition-all duration-300 hover:scale-105">
        {/* Reduced font size for main title */}
        <h2 className="text-3xl font-extrabold text-center text-base-content"> {/* Updated text color to base-content */}
          {isRegistering ? "Join Rental Tracker" : "Welcome Back!"}
        </h2>
        {/* Adjusted paragraph text size */}
        <p className="text-center text-base-content text-base"> {/* Updated text color to base-content */}
          {isRegistering ? "Create your account to manage properties with ease." : "Sign in to access your property data."}
        </p>

        {messageBox && <MessageBox message={messageBox.message} type={messageBox.type} onClose={() => setMessageBox(null)} />}

        <div>
          {/* Adjusted label text size */}
          <label htmlFor="email" className="block text-sm font-semibold text-base-content mb-1">Email Address</label> {/* Updated text color to base-content */}
          <div className="relative">
            <MailIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Adjusted border color, focus ring/border color, and text color for dark background
              className="w-full pl-10 pr-4 py-2 border border-base-content/20 rounded-lg focus:ring-[#007BFF] focus:border-[#007BFF] transition duration-200 text-base-content bg-base-200"
              placeholder="your.email@example.com"
              disabled={isLoading}
              aria-label="Email Address"
            />
          </div>
        </div>
        <div>
          {/* Adjusted label text size */}
          <label htmlFor="password" className="label text-sm font-semibold text-base-content mb-1">Password</label> {/* Updated text color to base-content */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Adjusted border color, focus ring/border color, and text color for dark background
              className="w-full pl-4 pr-10 py-2 border border-base-content/20 rounded-lg focus:ring-[#007BFF] focus:border-[#007BFF] transition duration-200 text-base-content bg-base-200"
              placeholder="••••••••"
              disabled={isLoading}
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!isRegistering && (
            <div className="text-right mt-2">
              <button
                onClick={handleForgotPassword}
                // Updated text color for link
                className="text-[#007BFF] hover:text-blue-400 text-sm font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        {/* Adjusted button padding and font size */}
        <button
          onClick={handleAuthAction}
          className="w-full btn py-2 px-3 rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white text-base"
          style={{ backgroundColor: '#007BFF', borderColor: '#007BFF' }} // Inline style for exact color match
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner text-white mr-3"></span>
          ) : isRegistering ? (
            <><SignUpIcon size={20} className="mr-2" /> Register</>
          ) : (
            <><LogIn size={20} className="mr-2" /> Login</>
          )}
        </button>

        {/* Adjusted paragraph text size */}
        <p className="text-center text-base-content text-sm"> {/* Updated text color to base-content */}
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            // Updated text color for link
            className="text-[#007BFF] hover:text-blue-400 font-semibold transition duration-200"
            disabled={isLoading}
          >
            {isRegistering ? "Login here" : "Register here"}
          </button>
        </p>
      </div>
      {messageBox && <MessageBox message={messageBox.message} type={messageBox.type} onClose={() => setMessageBox(null)} />}
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
  const [messageBox, setMessageBox] = useState(null);

  const showMessage = (message, type) => {
    setMessageBox({ message, type });
  };

  // Your web app's Firebase configuration
  const firebaseConfig = useMemo(() => ({
    apiKey: "AIzaSyAQJm88i3gwaGzvhJMxONzUr78tZqBRfXs",
    authDomain: "rentaltrackerapp.firebaseapp.com",
    projectId: "rentaltrackerapp",
    storageBucket: "rentaltrackerapp.firebaseapp.com",
    messagingSenderId: "341920558561",
    appId: "1:341920558561:web:1466c2166c1c2b1a5e76a0",
    measurementId: "G-VXF4GW40FK"
  }), []);

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
  }, [firebaseConfig]);

  // Function to generate/regenerate rent records for a specific unit
  const generateRentRecordsForUnit = async (unitData, propertyData) => {
    if (!db || !userId || !__app_id) {
        console.error("Firebase not initialized or userId missing for rent record generation.");
        return;
    }

    const rentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
    const unitRentQuery = query(rentRecordsCollectionRef, where("unitId", "==", unitData.id));

    // 1. Delete existing rent records for this unit
    try {
        const existingRentRecordsSnapshot = await getDocs(unitRentQuery);
        const deletePromises = existingRentRecordsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} old rent records for unit ${unitData.unitNumber}.`);
    } catch (error) {
        console.error("Error deleting old rent records:", error);
        showMessage(`Error deleting old rent records: ${error.message}`, 'error');
        return; // Stop if deletion fails
    }

    // 2. Generate new rent records from move-in date up to current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moveInDateParts = unitData.moveInDate.split('-');
    if (moveInDateParts.length !== 3) {
        console.warn(`Invalid moveInDate format for unit ${unitData.id}: ${unitData.moveInDate}. Skipping rent generation.`);
        return;
    }

    const moveInYear = parseInt(moveInDateParts[0], 10);
    const moveInMonth = parseInt(moveInDateParts[1], 10); // 1-indexed month
    const moveInDay = parseInt(moveInDateParts[2], 10);

    const moveInDateObj = new Date(moveInYear, moveInMonth - 1, moveInDay);
    if (isNaN(moveInDateObj.getTime())) {
        console.warn(`Invalid moveInDate for unit ${unitData.id}: ${unitData.moveInDate}. Skipping rent generation.`);
        return;
    }

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const generationPromises = [];

    const unitBaseRentAmount = parseFloat(unitData.rentAmount || 0);
    const unitRentIncrementAmount = parseFloat(unitData.rentIncrementAmount || 0);
    const unitRentIncrementEffectiveDate = unitData.rentIncrementEffectiveDate ? new Date(unitData.rentIncrementEffectiveDate + 'T00:00:00') : null;


    for (let year = moveInYear; year <= currentYear; year++) {
        const loopStartMonth = (year === moveInYear) ? moveInMonth : 1;
        const loopEndMonth = (year === currentYear) ? currentMonth : 12;

        for (let month = loopStartMonth; month <= loopEndMonth; month++) {
            const targetDate = new Date(year, month - 1, moveInDay);
            if (targetDate > today) {
                continue; // Don't generate for future months
            }

            const targetMonthYearString = `${year}-${String(month).padStart(2, '0')}`;
            const docId = `${unitData.id}_${targetMonthYearString}`;

            const lastDayOfTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
            const finalRentDueDay = Math.min(moveInDay, lastDayOfTargetMonth);
            const rentDueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), finalRentDueDay).toISOString().slice(0, 10);

            let rentAmountForThisRecord = unitBaseRentAmount;
            if (unitRentIncrementEffectiveDate && targetDate >= unitRentIncrementEffectiveDate) {
                rentAmountForThisRecord = unitBaseRentAmount + unitRentIncrementAmount;
            }

            generationPromises.push(
                (async () => {
                    const docRef = doc(rentRecordsCollectionRef, docId);
                    const existingDoc = await getDoc(docRef); // Fetch existing document

                    let rentRecordData = {
                        propertyId: propertyData.id,
                        propertyName: propertyData.name,
                        unitId: unitData.id,
                        unitNumber: unitData.number,
                        tenantName: unitData.tenantName,
                        amount: rentAmountForThisRecord, // Use the dynamically determined amount
                        monthYear: targetMonthYearString,
                        dueDate: rentDueDate,
                        createdAt: new Date().toISOString(),
                    };

                    if (existingDoc.exists()) {
                        const existingData = existingDoc.data();
                        // Preserve payment status if already paid
                        if (existingData.isPaid) {
                            rentRecordData = {
                                ...rentRecordData,
                                isPaid: existingData.isPaid,
                                paymentDate: existingData.paymentDate,
                                amountReceived: existingData.amountReceived,
                                isPartialPayment: existingData.isPartialPayment,
                                partialReason: existingData.partialReason,
                            };
                        } else {
                            // If not paid, or new, default to unpaid
                            rentRecordData = {
                                ...rentRecordData,
                                isPaid: false,
                                paymentDate: null,
                                amountReceived: 0,
                                isPartialPayment: false,
                                partialReason: '',
                            };
                        }
                    } else {
                        // New record, default to unpaid
                        rentRecordData = {
                            ...rentRecordData,
                            isPaid: false,
                            paymentDate: null,
                            amountReceived: 0,
                            isPartialPayment: false,
                            partialReason: '',
                        };
                    }
                    await setDoc(docRef, rentRecordData); // No merge needed if we explicitly construct the data
                })()
            );
        }
    }
    try {
        await Promise.all(generationPromises);
        console.log(`Generated/updated ${generationPromises.length} rent records for unit ${unitData.unitNumber}.`);
    } catch (error) {
        console.error("Error generating new rent records:", error);
        showMessage(`Error generating new rent records: ${error.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        setUserId(null);
        setActiveTab('dashboard');
        showMessage('You have been logged out.', 'success');
      } catch (error) {
        console.error("Error logging out:", error);
        showMessage('Failed to log out: ' + error.message, 'error');
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <div className="text-xl font-semibold text-gray-700 ml-3">Loading application...</div>
      </div>
    );
  }

  // If user is not logged in (or is anonymous), show AuthScreen
  if (!userId || (auth.currentUser && auth.currentUser.isAnonymous)) {
    return (
      <AppContext.Provider value={{ db, auth, userId, isAuthReady, __app_id, formatDate, formatDateForInput, formatCurrency, generateRentRecordsForUnit }}>
        {/* DaisyUI and Tailwind CSS CDN links - ideally in public/index.html */}
        <link href="https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.css" rel="stylesheet" type="text/css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          html, body {
            height: 100%; /* Ensure html and body take full height */
            margin: 0;
            padding: 0;
            /* Removed gradient from body to match dashboard's flat background */
            font-family: 'Inter', sans-serif;
          }
          #root { /* If your React app mounts to a #root div, ensure it also takes full height */
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .modal-content-scrollable::-webkit-scrollbar {
            width: 8px;
          }
          .modal-content-scrollable::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .modal-content-scrollable::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .modal-content-scrollable::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          `}
        </style>
        <AuthScreen />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{ db, auth, userId, isAuthReady, __app_id, formatDate, formatDateForInput, formatCurrency, generateRentRecordsForUnit }}>
      {/* DaisyUI and Tailwind CSS CDN links - ideally in public/index.html */}
      <link href="https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        html, body {
          height: 100%; /* Ensure html and body take full height */
          margin: 0;
          padding: 0;
          /* Removed gradient from body to match dashboard's flat background */
          font-family: 'Inter', sans-serif;
        }
        #root { /* If your React app mounts to a #root div, ensure it also takes full height */
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .modal-content-scrollable::-webkit-scrollbar {
          width: 8px;
        }
        .modal-content-scrollable::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .modal-content-scrollable::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .modal-content-scrollable::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        `}
      </style>

      <div className="min-h-screen bg-base-100 flex flex-col font-inter">
        {/* Header */}
        <header className="navbar bg-base-200 shadow-md px-6 py-4">
          <div className="flex-1">
            {/* Reduced header title size */}
            <h1 className="text-2xl font-extrabold text-gray-800">Rental Tracker</h1>
          </div>
          <div className="flex-none">
            {userId && (
              <div className="flex items-center text-sm text-gray-600 mr-4">
                <User size={16} className="mr-1" />
                User ID: <span className="font-mono ml-1">{userId}</span>
              </div>
            )}
            {/* Adjusted logout button size */}
            <button
              onClick={handleLogout}
              className="btn btn-error btn-sm"
            >
              <LogOut size={20} className="mr-2" /> Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-base-300 text-base-content p-4 shadow-lg">
            <ul className="menu p-2 w-full space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={activeTab === 'dashboard' ? 'active' : ''}
                >
                  <Home size={20} /> Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={activeTab === 'properties' ? 'active' : ''}
                >
                  <Building size={20} /> Properties & Units
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('rent')}
                  className={activeTab === 'rent' ? 'active' : ''}
                >
                  <DollarSign size={20} /> Monthly Rent Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={activeTab === 'expenses' ? 'active' : ''}
                >
                  <Receipt size={20} /> Expense Logger
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={activeTab === 'tasks' ? 'active' : ''}
                >
                  <ListTodo size={20} /> Task Manager
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={activeTab === 'reminders' ? 'active' : ''}
                >
                  <Bell size={20} /> Reminders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('export')}
                  className={activeTab === 'export' ? 'active' : ''}
                >
                  <Download size={20} /> Export Data
                </button>
              </li>
            </ul>
          </nav>

          {/* Content Area */}
          <main className="flex-1 p-6 bg-base-100 overflow-auto">
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
      {messageBox && <MessageBox message={messageBox.message} type={messageBox.type} onClose={() => setMessageBox(null)} />}
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
    if (!db || !userId || !isAuthReady || !__app_id) {
      console.log("Dashboard useEffect: Firebase not ready or userId missing.");
      return;
    }

    console.log("Dashboard useEffect: Setting up Firestore listeners.");
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
      console.log("Dashboard: Properties updated", fetchedProperties.length);
    }, (error) => console.error("Error fetching properties:", error));

    const unsubscribeRentRecords = onSnapshot(userRentRecordsCollectionRef, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRentRecords(fetchedRecords);
      console.log("Dashboard: Rent Records updated", fetchedRecords.length);
    }, (error) => console.error("Error fetching rent records:", error));

    const unsubscribeExpenses = onSnapshot(userExpensesCollectionRef, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(fetchedExpenses);
      console.log("Dashboard: Expenses updated", fetchedExpenses.length);
    }, (error) => console.error("Error fetching expenses:", error));

    return () => {
      console.log("Dashboard useEffect: Cleaning up Firestore listeners.");
      unsubscribeProperties();
      unsubscribeRentRecords();
      unsubscribeExpenses();
    };
  }, [db, userId, isAuthReady, __app_id]);

  const filteredRentRecords = useMemo(() => {
    console.log("Dashboard: Recalculating filteredRentRecords");
    const filtered = rentRecords.filter(record => {
      const recordDateString = record.dueDate || record.monthYear;
      if (!recordDateString) return false;

      const recordDate = new Date(recordDateString);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the end date fully

      const matchesDateRange = recordDate >= start && recordDate < end;
      const matchesProperty = selectedPropertyId === 'all' || record.propertyId === selectedPropertyId;
      return matchesDateRange && matchesProperty;
    });
    console.log("Filtered Rent Records:", filtered);
    return filtered;
  }, [rentRecords, startDate, endDate, selectedPropertyId]);

  const filteredExpenses = useMemo(() => {
    console.log("Dashboard: Recalculating filteredExpenses");
    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the end date fully

      const matchesDateRange = expenseDate >= start && expenseDate < end;
      const matchesProperty = selectedPropertyId === 'all' || expense.propertyId === selectedPropertyId;
      return matchesDateRange && matchesProperty;
    });
    console.log("Filtered Expenses:", filtered);
    return filtered;
  }, [expenses, startDate, endDate, selectedPropertyId]);

  const totalRentCollected = filteredRentRecords
    .filter(record => record.isPaid)
    .reduce((sum, record) => sum + (record.amountReceived || record.amount || 0), 0);

  const totalUnpaidRent = filteredRentRecords
    .filter(record => !record.isPaid)
    .reduce((sum, record) => sum + (record.amount || 0) - (record.amountReceived || 0), 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const netIncome = totalRentCollected - totalExpenses;

  const hasUnpaidRentAlert = filteredRentRecords.some(record => !record.isPaid && ((record.amount || 0) - (record.amountReceived || 0) > 0));

  const historicalNetIncome = useMemo(() => {
    console.log("Dashboard: Recalculating historicalNetIncome");
    const monthlyData = {};
    const today = new Date();

    // Initialize data for last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthYearKey] = {
        rent: 0,
        expenses: 0,
        net: 0,
        label: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        sortKey: monthYearKey // Add a sort key for reliable sorting
      };
    }

    rentRecords.forEach(record => {
      const recordDate = new Date(record.monthYear + '-01'); // Use 'YYYY-MM-01' for consistent month parsing
      const recordMonthYear = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[recordMonthYear]) {
        if (record.isPaid) {
          monthlyData[recordMonthYear].rent += (record.amountReceived || record.amount || 0);
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

    // Convert to array and sort chronologically using the sortKey
    return Object.values(monthlyData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [rentRecords, expenses]);

  const profitLossByProperty = useMemo(() => {
    console.log("Dashboard: Recalculating profitLossByProperty");
    const pnl = {};
    properties.forEach(prop => {
      pnl[prop.id] = { name: prop.name, income: 0, expenses: 0, net: 0 };
    });

    console.log("P&L - Initial properties object:", JSON.parse(JSON.stringify(pnl)));

    filteredRentRecords.filter(r => r.isPaid).forEach(record => {
      if (pnl[record.propertyId]) {
        pnl[record.propertyId].income += (record.amountReceived || record.amount || 0);
        console.log(`P&L - Added income for ${record.propertyName} (${record.unitNumber}): ${record.amountReceived || record.amount || 0}. Current income: ${pnl[record.propertyId].income}`);
      } else {
        console.warn(`P&L - Rent record for unknown propertyId: ${record.propertyId}`, record);
      }
    });

    filteredExpenses.forEach(expense => {
      if (pnl[expense.propertyId]) {
        pnl[expense.propertyId].expenses += (expense.amount || 0);
        console.log(`P&L - Added expense for ${expense.propertyName} (${expense.unitNumber || 'N/A'}): ${expense.amount || 0}. Current expenses: ${pnl[expense.propertyId].expenses}`);
      } else {
        console.warn(`P&L - Expense record for unknown propertyId: ${expense.propertyId}`, expense);
      }
    });

    Object.keys(pnl).forEach(propertyId => {
      pnl[propertyId].net = pnl[propertyId].income - pnl[propertyId].expenses;
      console.log(`P&L - Final net for ${pnl[propertyId].name}: Income ${pnl[propertyId].income}, Expenses ${pnl[propertyId].expenses}, Net ${pnl[propertyId].net}`);
    });

    return Object.values(pnl);
  }, [filteredRentRecords, filteredExpenses, properties]);

  const expenseBreakdownByCategory = useMemo(() => {
    console.log("Dashboard: Recalculating expenseBreakdownByCategory");
    const categories = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + (expense.amount || 0);
    });
    return Object.entries(categories).sort(([, a], [, b]) => b - a);
  }, [filteredExpenses]);

  const upcomingLeaseExpirations = useMemo(() => {
    console.log("Dashboard: Recalculating upcomingLeaseExpirations");
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
    <div className="space-y-8 p-4">
      {/* Reduced main heading size */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Dashboard Summary</h2>

      {hasUnpaidRentAlert && (
        <div className="alert alert-error shadow-lg animate-fade-in-up">
          <Info size={24} />
          <div>
            <h3 className="font-bold">Unpaid Rent Alert!</h3>
            <div className="text-sm">You have unpaid rent records within the selected date range. Please review the Monthly Rent Tracker.</div>
          </div>
        </div>
      )}

      {upcomingLeaseExpirations.length > 0 && (
        <div className="alert alert-warning shadow-lg animate-fade-in-up">
          <Info size={24} />
          <div>
            <h3 className="font-bold">Upcoming Lease Expirations!</h3>
            <ul className="list-disc list-inside text-sm">
              {upcomingLeaseExpirations.map((lease, index) => (
                <li key={index}>
                  <span className="font-semibold">{lease.tenantName}</span> in {lease.propertyName}, Unit {lease.unitNumber} -
                  Lease ends on {formatDate(lease.leaseEndDate)} (in {lease.daysRemaining} days).
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card bg-base-200 shadow-xl p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Filter Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="label">
              <span className="label-text">Start Date</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="label">
              <span className="label-text">End Date</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="property-select" className="label">
              <span className="label-text">Filter by Property</span>
            </label>
            <select
              id="property-select"
              className="select select-bordered w-full"
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-400 to-green-600 text-white shadow-xl p-6 flex flex-col items-center justify-center rounded-xl transform transition-transform duration-200 hover:scale-105">
          {/* Reduced icon size */}
          <ArrowUpCircle size={32} className="mb-2" />
          <p className="text-base font-medium opacity-90">Rent Collected</p>
          {/* Reduced metric value font size */}
          <p className="text-3xl font-bold">{formatCurrency(totalRentCollected)}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-400 to-red-600 text-white shadow-xl p-6 flex flex-col items-center justify-center rounded-xl transform transition-transform duration-200 hover:scale-105">
          {/* Reduced icon size */}
          <ArrowDownCircle size={32} className="mb-2" />
          <p className="text-base font-medium opacity-90">Total Expenses</p>
          {/* Reduced metric value font size */}
          <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl p-6 flex flex-col items-center justify-center rounded-xl transform transition-transform duration-200 hover:scale-105">
          {/* Reduced icon size */}
          <XCircle size={32} className="mb-2" />
          <p className="text-base font-medium opacity-90">Unpaid Rent</p>
          {/* Reduced metric value font size */}
          <p className="text-3xl font-bold">{formatCurrency(totalUnpaidRent)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-xl p-6 flex flex-col items-center justify-center rounded-xl transform transition-transform duration-200 hover:scale-105">
          {/* Reduced icon size */}
          <Wallet size={32} className="mb-2" />
          <p className="text-base font-medium opacity-90">Net Income</p>
          {/* Reduced metric value font size */}
          <p className="text-3xl font-bold">
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl p-6 rounded-xl">
        {/* Reduced heading size */}
        <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Monthly Net Income (Last 12 Months)</h3>
        <div className="relative h-72 w-full">
          {historicalNetIncome.length > 0 && historicalNetIncome.some(d => Math.abs(d.net || 0) > 0) ? (
            <div className="flex h-full items-end justify-around border-b-2 border-l-2 border-gray-300 pt-4 pb-2 px-2">
              {historicalNetIncome.map((data, index) => {
                const maxAbsNet = Math.max(...historicalNetIncome.map(d => Math.abs(d.net || 0)), 1);
                const heightPercentage = Math.max(0, Math.abs(data.net || 0) / maxAbsNet * 90);
                return (
                  <div
                    key={data.label}
                    className="flex flex-col items-center justify-end h-full mx-1 group relative"
                    style={{ width: `${100 / historicalNetIncome.length - 2}%` }}
                  >
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${data.net >= 0 ? 'bg-blue-500' : 'bg-red-500'} group-hover:opacity-80`}
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2 font-medium">{data.label}</span>
                    <div className="absolute bottom-full mb-2 p-1 px-2 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {formatCurrency(data.net)}
                    </div>
                  </div>
                );
              })}
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12 pr-2 py-2">
                <span className="text-right">{formatCurrency(Math.max(...historicalNetIncome.map(d => Math.abs(d.net || 0))))}</span>
                <span className="text-right">0</span>
                <span className="text-right">{formatCurrency(-Math.max(...historicalNetIncome.map(d => Math.abs(d.net || 0))))}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-10 text-base">No historical data available to display chart for the last 12 months.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-200 shadow-xl p-6 rounded-xl">
          {/* Reduced heading size */}
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Profit & Loss by Property (Selected Period)</h3>
          {profitLossByProperty.length === 0 ? (
            <p className="text-gray-600 text-center py-4 text-base">No data to display Profit & Loss by Property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full table-zebra text-base"> {/* Adjusted table text size */}
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {profitLossByProperty.map(pnlItem => (
                    <tr key={pnlItem.name}>
                      <td className="font-medium text-gray-800">{pnlItem.name}</td>
                      <td className="text-green-600">{formatCurrency(pnlItem.income)}</td>
                      <td className="text-red-600">{formatCurrency(pnlItem.expenses)}</td>
                      <td className={`${pnlItem.net >= 0 ? 'text-blue-600' : 'text-red-600'} font-bold`}>
                        {formatCurrency(pnlItem.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card bg-base-200 shadow-xl p-6 rounded-xl">
          {/* Reduced heading size */}
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Expense Breakdown by Category (Selected Period)</h3>
          {expenseBreakdownByCategory.length === 0 ? (
            <p className="text-gray-600 text-center py-4 text-base">No expense data for category breakdown.</p>
          ) : (
            <div className="relative h-72 w-full flex items-end justify-around border-b-2 border-l-2 border-gray-300 pt-4 pb-2 px-2">
              {expenseBreakdownByCategory.map(([category, amount]) => {
                const maxAmount = Math.max(...expenseBreakdownByCategory.map(([, amt]) => amt), 1);
                const heightPercentage = Math.max(0, amount / maxAmount * 90);
                return (
                  <div
                    key={category}
                    className="flex flex-col items-center justify-end h-full mx-1 group relative"
                    style={{ width: `${100 / expenseBreakdownByCategory.length - 2}%` }}
                  >
                    <div
                      className="w-full rounded-t-md bg-orange-500 transition-all duration-300 group-hover:opacity-80"
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2 font-medium text-center">{category}</span>
                    <div className="absolute bottom-full mb-2 p-1 px-2 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                );
              })}
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12 pr-2 py-2">
                <span className="text-right">{formatCurrency(Math.max(...expenseBreakdownByCategory.map(([, amt]) => amt)))}</span>
                <span className="text-right">0</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Property & Unit Manager Component ---
const PropertyManager = () => {
  const { db, userId, isAuthReady, __app_id, formatDate, formatDateForInput, formatCurrency, generateRentRecordsForUnit } = useContext(AppContext);
  const [properties, setProperties] = useState([]);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
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
  const [newLeaseTerm, setNewLeaseTerm] = useState('');
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

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !__app_id) return;

    const unsubscribes = [];
    const propertyUnitsUnsubscribes = new Map(); // To store unsubscribe functions for each property's units

    const userPropertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);

    const unsubscribeProperties = onSnapshot(userPropertiesCollectionRef, (propertiesSnapshot) => {
      const fetchedProperties = [];
      const newPropertyIds = new Set();

      propertiesSnapshot.docs.forEach(propertyDoc => {
        newPropertyIds.add(propertyDoc.id);
        const propertyData = { id: propertyDoc.id, ...propertyDoc.data(), units: [] };
        fetchedProperties.push(propertyData);

        // If we don't already have a listener for this property's units, set one up
        if (!propertyUnitsUnsubscribes.has(propertyDoc.id)) {
          const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${propertyDoc.id}/units`);
          const unsubscribeUnits = onSnapshot(unitsCollectionRef, (unitsSnapshot) => {
            const units = unitsSnapshot.docs.map(unitDoc => ({ id: unitDoc.id, ...unitDoc.data() }));
            setProperties(prevProperties => {
              // Find the property and update its units
              return prevProperties.map(p =>
                p.id === propertyDoc.id ? { ...p, units: units } : p
              );
            });
          }, (error) => console.error(`Error fetching units for property ${propertyDoc.id}:`, error));
          propertyUnitsUnsubscribes.set(propertyDoc.id, unsubscribeUnits);
        }
      });

      // Clean up listeners for properties that no longer exist
      propertyUnitsUnsubscribes.forEach((unsub, propId) => {
        if (!newPropertyIds.has(propId)) {
          unsub(); // Unsubscribe from units of deleted property
          propertyUnitsUnsubscribes.delete(propId);
        }
      });

      // Set the initial properties (units will be populated by their own listeners)
      setProperties(fetchedProperties);

    }, (error) => console.error("Error fetching properties:", error));

    unsubscribes.push(unsubscribeProperties);

    return () => {
      console.log("PropertyManager useEffect: Cleaning up all Firestore listeners.");
      unsubscribes.forEach(unsub => unsub());
      propertyUnitsUnsubscribes.forEach(unsub => unsub()); // Clean up all unit listeners
    };
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
          address: newPropertyAddress,
        });
        setFeedbackMessage("Property updated successfully!");
      } else {
        const propertiesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
        await addDoc(propertiesCollectionRef, {
          name: newPropertyName,
          address: newPropertyAddress,
          createdAt: new Date().toISOString(),
        });
        setFeedbackMessage("Property added successfully!");
      }
      setNewPropertyName('');
      setNewPropertyAddress('');
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
    setNewPropertyAddress(property.address || '');
    setFeedbackMessage('');
    setShowPropertyModal(true);
  };

  const openAddPropertyModal = () => {
    setEditingProperty(null);
    setNewPropertyName('');
    setNewPropertyAddress('');
    setFeedbackMessage('');
    setShowPropertyModal(true);
  };

  const handleAddEditUnit = async () => {
    if (!db || !userId || !isAuthReady || !selectedPropertyForUnit || !newUnitNumber.trim() || !newTenantName.trim() || !newMoveInDate) {
      setFeedbackMessage("All required unit fields are missing (Unit #, Tenant Name, Move-in Date).");
      return;
    }

    const parsedRentAmount = parseFloat(newRentAmount);
    if (isNaN(parsedRentAmount) || parsedRentAmount < 0) {
      setFeedbackMessage("Rent Amount must be a valid non-negative number.");
      return;
    }

    const parsedSecurityDepositAmount = parseFloat(newSecurityDepositAmount || 0);
    if (isNaN(parsedSecurityDepositAmount) || parsedSecurityDepositAmount < 0) {
      setFeedbackMessage("Security Deposit Amount must be a valid non-negative number.");
      return;
    }

    const parsedRentIncrementAmount = parseFloat(newRentIncrementAmount || 0);
    if (isNaN(parsedRentIncrementAmount) || parsedRentIncrementAmount < 0) {
      setFeedbackMessage("Rent Increment Amount must be a valid non-negative number.");
      return;
    }

    // const oldMoveInDate = editingUnit ? editingUnit.moveInDate : null; // Removed unused variable

    setFeedbackMessage('');

    const unitData = {
      propertyId: selectedPropertyForUnit.id,
      propertyName: selectedPropertyForUnit.name,
      number: newUnitNumber,
      tenantName: newTenantName,
      rentAmount: parsedRentAmount, // This is the base rent, increment applied at record level
      moveInDate: newMoveInDate,
      notes: newUnitNotes,
      phoneNumber: newPhoneNumber,
      email: newEmail,
      emergencyContactName: newEmergencyContactName,
      emergencyContactPhone: newEmergencyContactPhone,
      leaseStartDate: newLeaseStartDate,
      leaseEndDate: newLeaseEndDate,
      securityDepositAmount: parsedSecurityDepositAmount,
      leaseTerm: newLeaseTerm,
      rentIncrementAmount: parseFloat(newRentIncrementAmount || 0), // Always save increment details
      rentIncrementEffectiveDate: newRentIncrementEffectiveDate || null, // Always save increment details
    };

    let successMessage = editingUnit ? "Unit updated successfully!" : "Unit added successfully!";
    // If increment details are provided, append a message about scheduling/application
    if (newRentIncrementAmount && newRentIncrementEffectiveDate) {
        const effectiveDate = new Date(newRentIncrementEffectiveDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        if (effectiveDate <= today) {
            successMessage += " Rent increment applied to current and future records.";
        } else {
            successMessage += " Rent increment scheduled for future records.";
        }
    }

    try {
      // let unitIdToUse = editingUnit ? editingUnit.id : null; // Removed unused variable
      let propertyIdToUse = selectedPropertyForUnit.id;
      let actualUnitDataSaved = { ...unitData }; // This will hold the data actually saved to Firestore

      if (editingUnit) {
        const unitDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties/${propertyIdToUse}/units`, editingUnit.id);
        await updateDoc(unitDocRef, unitData);
        actualUnitDataSaved = { ...unitData, id: editingUnit.id }; // Ensure ID is present for regeneration
      } else {
        const unitsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${propertyIdToUse}/units`);
        const docRef = await addDoc(unitsCollectionRef, {
          ...unitData,
          createdAt: new Date().toISOString(),
        });
        // unitIdToUse = docRef.id; // Removed unused variable
        actualUnitDataSaved = { ...unitData, id: docRef.id };
      }

      // After unit is added/updated, handle rent records
      const currentUnitForRentGeneration = { ...actualUnitDataSaved }; // Use the actual saved data
      // Always regenerate rent records if the unit data (especially rent-related fields) changes.
      await generateRentRecordsForUnit(currentUnitForRentGeneration, selectedPropertyForUnit);
      
      setFeedbackMessage(successMessage);


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
        const deleteUnitPromises = unitSnapshot.docs.map(unitDoc => {
            // Also delete associated rent records when deleting a unit
            const unitIdToDelete = unitDoc.id;
            const rentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
            const unitRentQuery = query(rentRecordsCollectionRef, where("unitId", "==", unitIdToDelete));
            getDocs(unitRentQuery).then(rentSnapshot => {
                rentSnapshot.docs.forEach(rentDoc => deleteDoc(rentDoc.ref));
            });
            return deleteDoc(unitDoc.ref);
        });
        await Promise.all(deleteUnitPromises);
        await deleteDoc(propertyDocRef);
        setFeedbackMessage("Property and its units deleted successfully!");
      } else if (confirmDeleteModal.type === 'unit') {
        const unitDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties/${confirmDeleteModal.propertyId}/units`, confirmDeleteModal.id);
        // Delete associated rent records for the unit
        const rentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
        const unitRentQuery = query(rentRecordsCollectionRef, where("unitId", "==", confirmDeleteModal.id));
        const rentSnapshot = await getDocs(unitRentQuery);
        const deleteRentPromises = rentSnapshot.docs.map(rentDoc => deleteDoc(rentDoc.ref));
        await Promise.all(deleteRentPromises);

        await deleteDoc(unitDocRef);
        setFeedbackMessage("Unit and its rent records deleted successfully!");
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
      {/* Reduced main heading size */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Property & Unit Manager</h2>

      {feedbackMessage && (
        <div className={`alert ${feedbackMessage.startsWith('Error') ? 'alert-error' : 'alert-success'} shadow-lg`}>
          {feedbackMessage.startsWith('Error') ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="flex justify-end mb-4">
        {/* Adjusted button size */}
        <button
          onClick={openAddPropertyModal}
          className="btn btn-primary btn-md"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="card bg-base-200 shadow-md p-6 text-center text-gray-600 text-base">
          No properties added yet. Click "Add New Property" to get started!
        </div>
      ) : (
        <div className="space-y-8">
          {properties.map(property => (
            <div key={property.id} className="card bg-base-200 shadow-md p-6 rounded-xl border border-base-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-300">
                <div className="flex-grow mb-3 sm:mb-0">
                  {/* Adjusted property name size */}
                  <h3 className="text-xl font-semibold text-gray-800">{property.name}</h3>
                  {property.address && <p className="text-gray-600 text-sm italic">{property.address}</p>}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {/* Adjusted button sizes */}
                  <button
                    onClick={() => openAddUnitModal(property)}
                    className="btn btn-success btn-sm"
                  >
                    <PlusCircle size={16} /> <span className="hidden sm:inline">Add Unit</span>
                  </button>
                  <button
                    onClick={() => openEditPropertyModal(property)}
                    className="btn btn-warning btn-sm"
                  >
                    <Edit size={16} /> <span className="hidden sm:inline">Edit Property</span>
                  </button>
                  <button
                    onClick={() => openConfirmDeleteModal('property', property.id, property.name)}
                    className="btn btn-error btn-sm"
                  >
                    <Trash2 size={16} /> <span className="hidden sm:inline">Delete Property</span>
                  </button>
                </div>
              </div>

              {property.units.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-base">No units added for this property yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full table-zebra text-base">
                    <thead>
                      <tr>
                        <th>Unit #</th>
                        <th>Tenant Name</th>
                        <th>Rent Amount</th>
                        <th>Move-in Date</th>
                        <th>Contact</th>
                        <th>Lease End</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.units.map(unit => (
                        <tr key={unit.id}>
                          <td className="font-medium text-gray-800">{unit.number}</td>
                          <td>{unit.tenantName}</td>
                          <td>{formatCurrency(unit.rentAmount)}</td>
                          <td>{formatDate(unit.moveInDate)}</td>
                          <td>
                            {unit.phoneNumber && <div className="flex items-center text-xs text-gray-600"><Phone size={12} className="mr-1" /> {unit.phoneNumber}</div>}
                            {unit.email && <div className="flex items-center text-xs text-gray-600"><MailIcon size={12} className="mr-1" /> {unit.email}</div>}
                            {unit.emergencyContactName && <div className="flex items-center text-xs text-gray-600"><UserPlus size={12} className="mr-1" /> {unit.emergencyContactName}</div>}
                            {unit.emergencyContactPhone && <div className="flex items-center text-xs text-gray-600"><Phone size={12} className="mr-1" /> {unit.emergencyContactPhone}</div>}
                          </td>
                          <td>{formatDate(unit.leaseEndDate)}</td>
                          <td>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewTenantHistory(unit.id, unit.number, unit.tenantName)}
                                className="btn btn-ghost btn-sm btn-circle tooltip tooltip-top"
                                data-tip="View Tenant History"
                              >
                                <History size={18} />
                              </button>
                              <button
                                onClick={() => openEditUnitModal(property, unit)}
                                className="btn btn-ghost btn-sm btn-circle tooltip tooltip-top"
                                data-tip="Edit Unit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => openConfirmDeleteModal('unit', unit.id, unit.number, property.id)}
                                className="btn btn-ghost btn-sm btn-circle text-error tooltip tooltip-top"
                                data-tip="Delete Unit"
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

      <Modal isOpen={showPropertyModal} title={editingProperty ? "Edit Property" : "Add New Property"} onClose={() => setShowPropertyModal(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label htmlFor="propertyName" className="label">
              <span className="label-text">Property Name</span>
            </label>
            <input
              type="text"
              id="propertyName"
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., Main Street Apartments"
            />
          </div>
          <div>
            <label htmlFor="propertyAddress" className="label">
              <span className="label-text">Address</span>
            </label>
            <textarea
              id="propertyAddress"
              value={newPropertyAddress}
              onChange={(e) => setNewPropertyAddress(e.target.value)}
              rows="3"
              className="textarea textarea-bordered w-full"
              placeholder="e.g., 123 Main St, Anytown, USA"
            ></textarea>
          </div>
          <div className="modal-action">
            <button
              onClick={() => setShowPropertyModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditProperty}
              className="btn btn-primary"
            >
              {editingProperty ? "Update Property" : "Add Property"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUnitModal} title={editingUnit ? `Edit Unit for ${selectedPropertyForUnit?.name}` : `Add New Unit to ${selectedPropertyForUnit?.name}`} onClose={() => setShowUnitModal(false)} maxWidth="max-w-3xl"> {/* Changed maxWidth to max-w-3xl */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="unitNumber" className="label">
              <span className="label-text">Unit Number</span>
            </label>
            <input
              type="text"
              id="unitNumber"
              value={newUnitNumber}
              onChange={(e) => setNewUnitNumber(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., Apt 3B"
            />
          </div>
          <div>
            <label htmlFor="tenantName" className="label">
              <span className="label-text">Tenant Name</span>
            </label>
            <input
              type="text"
              id="tenantName"
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="rentAmount" className="label">
              <span className="label-text">Rent Amount</span>
            </label>
            <input
              type="number"
              id="rentAmount"
              value={newRentAmount}
              onChange={(e) => setNewRentAmount(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., 1200.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="moveInDate" className="label">
              <span className="label-text">Move-in Date</span>
            </label>
            <input
              type="date"
              id="moveInDate"
              value={newMoveInDate}
              onChange={(e) => setNewMoveInDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div className="col-span-full border-t border-base-300 pt-4 mt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Tenant Contact & Lease Info</h4>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="label">
              <span className="label-text">Phone Number (Optional)</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., +15551234567"
            />
          </div>
          <div>
            <label htmlFor="email" className="label">
              <span className="label-text">Email (Optional)</span>
            </label>
            <input
              type="email"
              id="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., tenant@example.com"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactName" className="label">
              <span className="label-text">Emergency Contact Name (Optional)</span>
            </label>
            <input
              type="text"
              id="emergencyContactName"
              value={newEmergencyContactName}
              onChange={(e) => setNewEmergencyContactName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., John Smith"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="label">
              <span className="label-text">Emergency Contact Phone (Optional)</span>
            </label>
            <input
              type="tel"
              id="emergencyContactPhone"
              value={newEmergencyContactPhone}
              onChange={(e) => setNewEmergencyContactPhone(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., +15559876543"
            />
          </div>

          <div>
            <label htmlFor="leaseStartDate" className="label">
              <span className="label-text">Lease Start Date (Optional)</span>
            </label>
            <input
              type="date"
              id="leaseStartDate"
              value={newLeaseStartDate}
              onChange={(e) => setNewLeaseStartDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="leaseEndDate" className="label">
              <span className="label-text">Lease End Date (Optional)</span>
            </label>
            <input
              type="date"
              id="leaseEndDate"
              value={newLeaseEndDate}
              onChange={(e) => setNewLeaseEndDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="securityDepositAmount" className="label">
              <span className="label-text">Security Deposit Amount (Optional)</span>
            </label>
            <input
              type="number"
              id="securityDepositAmount"
              value={newSecurityDepositAmount}
              onChange={(e) => setNewSecurityDepositAmount(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., 1200.00"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="leaseTerm" className="label">
              <span className="label-text">Lease Term (Optional)</span>
            </label>
            <input
              type="text"
              id="leaseTerm"
              value={newLeaseTerm}
              onChange={(e) => setNewLeaseTerm(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., 12 months, Month-to-month"
            />
          </div>

          <div className="col-span-full border-t border-base-300 pt-4 mt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Rent Increment (Optional)</h4>
          </div>
          <div>
            <label htmlFor="rentIncrementAmount" className="label">
              <span className="label-text">Increment Amount</span>
            </label>
            <input
              type="number"
              id="rentIncrementAmount"
              value={newRentIncrementAmount}
              onChange={(e) => setNewRentIncrementAmount(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., 50.00"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">Amount to increase rent by.</p>
          </div>
          <div>
            <label htmlFor="rentIncrementEffectiveDate" className="label">
              <span className="label-text">Increment Effective Date</span>
            </label>
            <input
              type="date"
              id="rentIncrementEffectiveDate"
              value={newRentIncrementEffectiveDate}
              onChange={(e) => setNewRentIncrementEffectiveDate(e.target.value)}
              className="input input-bordered w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Date from which this increment applies.</p>
          </div>

          <div className="col-span-full">
            <label htmlFor="unitNotes" className="label">
              <span className="label-text">Notes (Optional)</span>
            </label>
            <textarea
              id="unitNotes"
              value={newUnitNotes}
              onChange={(e) => setNewUnitNotes(e.target.value)}
              rows="2"
              className="textarea textarea-bordered w-full"
              placeholder="Any specific details about the unit or tenant..."
            ></textarea>
          </div>

          <div className="modal-action col-span-full">
            <button
              onClick={() => setShowUnitModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditUnit}
              className="btn btn-primary"
            >
              {editingUnit ? "Update Unit" : "Add Unit"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteModal} title={`Confirm Delete ${confirmDeleteModal?.type === 'property' ? 'Property' : 'Unit'}`} onClose={() => setConfirmDeleteModal(null)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-gray-700 text-base">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{confirmDeleteModal?.nameOrNumber}</span>?
            {confirmDeleteModal?.type === 'property' && (
              <span className="font-bold text-error"> This will also delete all associated units!</span>
            )}
          </p>
          <div className="modal-action">
            <button
              onClick={() => setConfirmDeleteModal(null)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-error"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTenantHistoryModal} title={`Rent History for Unit ${currentUnitForHistory?.unitNumber} (${currentUnitForHistory?.tenantName})`} onClose={() => setShowTenantHistoryModal(false)} maxWidth="max-w-3xl">
        <div className="space-y-4">
          {currentTenantHistory.length === 0 ? (
            <p className="text-gray-600 text-base">No rent history found for this unit.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full table-zebra text-base">
                <thead>
                  <tr>
                    <th>Month Due</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                    <th>Reason for Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTenantHistory.map(record => (
                    <tr key={record.id} className={record.isPaid ? 'bg-success-content/10' : 'bg-error-content/10'}>
                      <td>
                        {new Date(record.monthYear).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td>{formatCurrency(record.amount)}</td>
                      <td>{formatCurrency(record.amountReceived)}</td>
                      <td>{formatDate(record.paymentDate)}</td>
                      <td>
                        <span className={`badge ${record.isPaid ? 'badge-success' : 'badge-error'}`}>
                          {record.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="text-gray-500">{record.partialReason || '-'}</td>
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

// --- Monthly Rent Tracker Component (Corrected) ---
const MonthlyRentTracker = () => {
  const { db, userId, isAuthReady, __app_id, formatDate, formatCurrency, formatDateForInput } = useContext(AppContext);
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
      console.log("Firestore onSnapshot: properties updated. Total:", fetchedProperties.length, "Properties:", fetchedProperties);
    }, (error) => console.error("Error fetching properties for rent tracker:", error));

    const unsubscribeRentRecords = onSnapshot(userRentRecordsCollectionRef, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRentRecords(fetchedRecords);
      console.log("Firestore onSnapshot: rentRecords updated. Total:", fetchedRecords.length, "Records:", fetchedRecords);
    }, (error) => console.error("Error fetching rent records:", error));

    return () => {
      unsubscribeProperties();
      unsubscribeRentRecords();
    };
  }, [db, userId, isAuthReady, __app_id]);

  // Logic to auto-generate rent records and apply rent increments
  useEffect(() => {
    if (!db || !userId || !isAuthReady || properties.length === 0 || !__app_id) return;

    const autoGenerateRentRecords = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const rentRecordsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
      const generationPromises = [];

      for (const property of properties) {
        for (const unit of property.units) {
          if (!unit.moveInDate) {
            continue;
          }
          
          const moveInDateParts = unit.moveInDate.split('-');
          if (moveInDateParts.length !== 3) {
            console.warn(`Invalid moveInDate format for unit ${unit.id}: ${unit.moveInDate}. Skipping rent generation.`);
            continue;
          }

          const moveInYear = parseInt(moveInDateParts[0], 10);
          const moveInMonth = parseInt(moveInDateParts[1], 10) - 1;
          const moveInDay = parseInt(moveInDateParts[2], 10);
          
          const moveInDateObj = new Date(moveInYear, moveInMonth, moveInDay);
          if (isNaN(moveInDateObj.getTime())) {
            console.warn(`Invalid moveInDate for unit ${unit.id}: ${unit.moveInDate}. Skipping rent generation.`);
            continue;
          }

          const rentDueDay = moveInDateObj.getDate();
          const startYearForGeneration = moveInDateObj.getFullYear();
          const startMonthForGeneration = moveInDateObj.getMonth() + 1;

          const unitBaseRentAmount = parseFloat(unit.rentAmount || 0);
          const unitRentIncrementAmount = parseFloat(unit.rentIncrementAmount || 0);
          const unitRentIncrementEffectiveDate = unit.rentIncrementEffectiveDate ? new Date(unit.rentIncrementEffectiveDate + 'T00:00:00') : null;


          for (let year = startYearForGeneration; year <= currentYear; year++) {
            let monthToStart = (year === startYearForGeneration) ? startMonthForGeneration : 1;
            let monthToEnd = (year === currentYear) ? currentMonth : 12;

            for (let month = monthToStart; month <= monthToEnd; month++) {
              const targetDate = new Date(year, month - 1, rentDueDay);
              if (targetDate > today) {
                continue;
              }

              const targetMonthYearString = `${year}-${String(month).padStart(2, '0')}`;
              const docId = `${unit.id}_${targetMonthYearString}`; // Unique ID for the rent record

              const lastDayOfTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
              const finalRentDueDay = Math.min(rentDueDay, lastDayOfTargetMonth);
              const rentDueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), finalRentDueDay).toISOString().slice(0, 10);

              let rentAmountForThisRecord = unitBaseRentAmount;
              if (unitRentIncrementEffectiveDate && targetDate >= unitRentIncrementEffectiveDate) {
                  rentAmountForThisRecord = unitBaseRentAmount + unitRentIncrementAmount;
              }

              generationPromises.push(
                (async () => {
                    const docRef = doc(rentRecordsCollectionRef, docId);
                    const existingDoc = await getDoc(docRef); // Fetch existing document

                    let rentRecordData = {
                        propertyId: property.id,
                        propertyName: property.name,
                        unitId: unit.id,
                        unitNumber: unit.number,
                        tenantName: unit.tenantName,
                        amount: rentAmountForThisRecord, // Use the dynamically determined amount
                        monthYear: targetMonthYearString,
                        dueDate: rentDueDate,
                        createdAt: new Date().toISOString(),
                    };

                    if (existingDoc.exists()) {
                        const existingData = existingDoc.data();
                        // Preserve payment status if already paid
                        if (existingData.isPaid) {
                            rentRecordData = {
                                ...rentRecordData,
                                isPaid: existingData.isPaid,
                                paymentDate: existingData.paymentDate,
                                amountReceived: existingData.amountReceived,
                                isPartialPayment: existingData.isPartialPayment,
                                partialReason: existingData.partialReason,
                            };
                        } else {
                            // If not paid, or new, default to unpaid
                            rentRecordData = {
                                ...rentRecordData,
                                isPaid: false,
                                paymentDate: null,
                                amountReceived: 0,
                                isPartialPayment: false,
                                partialReason: '',
                            };
                        }
                    } else {
                        // New record, default to unpaid
                        rentRecordData = {
                            ...rentRecordData,
                            isPaid: false,
                            paymentDate: null,
                            amountReceived: 0,
                            isPartialPayment: false,
                            partialReason: '',
                        };
                    }
                    await setDoc(docRef, rentRecordData);
                })()
              );
            }
          }
        }
      }
      try {
        await Promise.all(generationPromises);
        console.log(`Auto-generated/updated ${generationPromises.length} rent records.`);
      } catch (e) {
        console.error("Error auto-generating rent records: ", e);
      }
    };

    if (properties.length > 0) {
        autoGenerateRentRecords();
    }

  },
  [db, userId, isAuthReady, properties, __app_id]);


  const filteredRentRecords = useMemo(() => {
    return rentRecords.filter(record => {
      const recordMonth = parseInt(record.monthYear.split('-')[1]);
      const recordYear = parseInt(record.monthYear.split('-')[0]);
      const matchesMonth = recordMonth === selectedMonth;
      const matchesYear = recordYear === selectedYear;
      const matchesProperty = selectedPropertyId === 'all' || record.propertyId === selectedPropertyId;
      return matchesMonth && matchesYear && matchesProperty;
    }).sort((a, b) => {
      const unitComparison = a.unitNumber.localeCompare(b.unitNumber);
      if (unitComparison !== 0) return unitComparison;
      return a.tenantName.localeCompare(b.tenantName);
    });
  }, [rentRecords, selectedMonth, selectedYear, selectedPropertyId]);

  const arrearsRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rentRecords.filter(record => {
      // Primary filter: if it's marked as paid, it's not in arrears.
      if (record.isPaid) return false;

      const unit = properties.flatMap(p => p.units).find(u => u.id === record.unitId);
      if (!unit || !unit.moveInDate) {
        return false;
      }

      const moveInDateParts = unit.moveInDate.split('-');
      if (moveInDateParts.length !== 3) {
        return false;
      }
      const moveInYear = parseInt(moveInDateParts[0], 10);
      const moveInMonth = parseInt(moveInDateParts[1], 10) - 1;
      const moveInDay = parseInt(moveInDateParts[2], 10);
      
      const moveInDateObj = new Date(moveInYear, moveInMonth, moveInDay);
      if (isNaN(moveInDateObj.getTime())) {
          return false;
      }

      const moveInMonthStart = new Date(moveInDateObj.getFullYear(), moveInDateObj.getMonth(), 1);

      const recordDate = new Date(record.monthYear + '-01T00:00:00');
      recordDate.setHours(0, 0, 0, 0);

      if (recordDate < moveInMonthStart) {
        return false;
      }

      const amountRemaining = (record.amount || 0) - (record.amountReceived || 0);
      
      // Log for debugging arrears
      if (amountRemaining > 0) { // Only log if there's an amount remaining
        const dueDate = record.dueDate ? new Date(record.dueDate + 'T00:00:00') : new Date(record.monthYear + '-01T00:00:00');
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) { // Only log if it's overdue
          console.log("Arrears candidate:", {
            id: record.id,
            amount: record.amount,
            amountReceived: record.amountReceived,
            isPaid: record.isPaid,
            amountRemaining: amountRemaining,
            dueDate: record.dueDate,
            today: today.toISOString().slice(0, 10),
            reason: record.partialReason
          });
        }
      }

      // If it's not paid, and there's an amount remaining, and it's overdue
      const dueDate = record.dueDate ? new Date(record.dueDate + 'T00:00:00') : new Date(record.monthYear + '-01T00:00:00');
      dueDate.setHours(0, 0, 0, 0);

      return amountRemaining > 0 && dueDate < today;
    }).map(record => {
      const dueDate = record.dueDate ? new Date(record.dueDate + 'T00:00:00') : new Date(record.monthYear + '-01T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const amountRemaining = (record.amount || 0) - (record.amountReceived || 0);
      return { ...record, daysOverdue: daysOverdue > 0 ? daysOverdue : 0, amountRemaining };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [rentRecords, properties]);

  const openEditRentPaymentModal = (record) => {
    setCurrentRentRecordToEdit(record);
    setEditPaymentDate(record.paymentDate ? formatDateForInput(record.paymentDate) : new Date().toISOString().slice(0, 10));
    setEditAmountReceived(record.amountReceived || record.amount || '');
    // Set editIsFullPayment based on whether amount received equals amount due
    setEditIsFullPayment(parseFloat(record.amountReceived || 0) >= parseFloat(record.amount || 0));
    setEditPartialReason(record.partialReason || '');
    setFeedbackMessage('');
    setShowEditRentPaymentModal(true);
  };

  const handleUpdateRentPayment = async () => {
    if (!db || !userId || !isAuthReady || !__app_id || !currentRentRecordToEdit) return;

    const expectedAmount = parseFloat(currentRentRecordToEdit.amount || 0);
    let finalAmountReceived = parseFloat(editAmountReceived);
    let finalIsPaid = false;
    let finalPartialReason = editPartialReason.trim();

    if (isNaN(finalAmountReceived)) {
      setFeedbackMessage("Error: Amount Received must be a valid number.");
      return;
    }

    if (editIsFullPayment || finalAmountReceived >= expectedAmount) {
      finalIsPaid = true;
      finalPartialReason = '';
      finalAmountReceived = expectedAmount; // Ensure full amount is recorded if marked as full payment
    } else { // Partial payment
      finalIsPaid = false;
      if (!finalPartialReason) {
        setFeedbackMessage("Error: Reason for difference is required for partial payments.");
        return;
      }

      if (finalPartialReason === 'Maintenance') {
        const maintenanceAmount = expectedAmount - finalAmountReceived;
        if (maintenanceAmount < 0) {
          setFeedbackMessage("Error: Maintenance deduction cannot result in overpayment. Adjust amount received.");
          return;
        }
        finalIsPaid = true; // Mark as paid because the difference is accounted for by expense
        finalAmountReceived = expectedAmount; // Record full expected amount as received
        finalPartialReason = 'Maintenance deduction';

        try {
          await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`), {
            date: editPaymentDate,
            propertyId: currentRentRecordToEdit.propertyId,
            propertyName: currentRentRecordToEdit.propertyName,
            unitId: currentRentRecordToEdit.unitId,
            unitNumber: currentRentRecordToEdit.unitNumber,
            amount: maintenanceAmount,
            reason: `Maintenance deduction for Unit ${currentRentRecordToEdit.unitNumber} (${currentRentRecordToEdit.tenantName}) - ${currentRentRecordToEdit.monthYear} rent`,
            category: 'Maintenance',
            notes: `Original rent: ${expectedAmount}, Received: ${editAmountReceived}. Maintenance cost: ${maintenanceAmount}.`,
            createdAt: new Date().toISOString(),
          });
          setFeedbackMessage("Rent record updated and Maintenance expense added!");
        } catch (e) {
          console.error("Error adding maintenance expense:", e);
          setFeedbackMessage(`Error updating rent and adding expense: ${e.message}`);
          return;
        }
      }
    }

    console.log("Updating rent payment (values to be saved):", {
      recordId: currentRentRecordToEdit.id,
      expectedAmount: expectedAmount,
      inputAmountReceived: editAmountReceived,
      finalAmountReceived: finalAmountReceived,
      finalIsPaid: finalIsPaid,
      finalPartialReason: finalPartialReason,
      paymentDate: finalIsPaid ? editPaymentDate : null,
    });


    setFeedbackMessage('');
    try {
      const recordDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/rentRecords`, currentRentRecordToEdit.id);
      await updateDoc(recordDocRef, {
        isPaid: finalIsPaid,
        paymentDate: finalIsPaid ? editPaymentDate : null, // Set paymentDate only if paid
        amountReceived: finalAmountReceived,
        isPartialPayment: !finalIsPaid, // If finalIsPaid is true, then it's not a partial payment
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

  const openConfirmDeleteRentModal = (record) => {
    setConfirmDeleteRentModal(record);
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
        const paymentDate = new Date().toISOString().slice(0, 10);

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

  const expectedAmount = currentRentRecordToEdit ? parseFloat(currentRentRecordToEdit.amount || 0) : 0;
  const currentAmountReceived = parseFloat(editAmountReceived || 0);
  const difference = expectedAmount - currentAmountReceived;


  return (
    <div className="space-y-8 p-4">
      {/* Reduced main heading size */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Monthly Rent Tracker</h2>

      {feedbackMessage && (
        <div className={`alert ${feedbackMessage.startsWith('Error') ? 'alert-error' : 'alert-success'} shadow-lg animate-fade-in-up`}>
          {feedbackMessage.startsWith('Error') ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="card bg-base-200 shadow-xl p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Filter Rent Records</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="month-select-rent" className="label">
              <span className="label-text">Select Month</span>
            </label>
            <select
              id="month-select-rent"
              className="select select-bordered w-full"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="year-select-rent" className="label">
              <span className="label-text">Select Year</span>
            </label>
            <select
              id="year-select-rent"
              className="select select-bordered w-full"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="property-select-rent" className="label">
              <span className="label-text">Filter by Property</span>
            </label>
            <select
              id="property-select-rent"
              className="select select-bordered w-full"
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
      </div>

      {filteredRentRecords.length > 0 && (
        <div className="card bg-base-200 shadow-xl p-6 rounded-xl flex flex-wrap gap-4 items-center justify-between">
          <p className="font-semibold text-base text-gray-800">Bulk Actions for Selected Records:</p>
          <div className="flex flex-wrap gap-3">
            {/* Adjusted button size */}
            <button
              onClick={() => handleBulkUpdateRentStatus(true)}
              disabled={selectedRentRecords.length === 0}
              className="btn btn-success btn-md"
            >
              <ClipboardCheck size={20} /> Mark Selected Paid ({selectedRentRecords.length})
            </button>
            {/* Adjusted button size */}
            <button
              onClick={() => handleBulkUpdateRentStatus(false)}
              disabled={selectedRentRecords.length === 0}
              className="btn btn-warning btn-md"
            >
              <ClipboardX size={20} /> Mark Selected Unpaid ({selectedRentRecords.length})
            </button>
          </div>
        </div>
      )}

      {filteredRentRecords.length === 0 ? (
        <div className="card bg-base-200 shadow-xl p-6 text-center text-gray-600 text-base">
          No rent records found for the selected period.
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-200 shadow-xl rounded-xl">
          <table className="table w-full table-zebra text-base">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectedRentRecords.length === filteredRentRecords.length && filteredRentRecords.length > 0}
                    onChange={handleSelectAllRentRecords}
                  />
                </th>
                <th>Property</th>
                <th>Unit #</th>
                <th>Tenant Name</th>
                <th>Amount Due</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Reason for Difference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentRecords.map(record => (
                <tr key={record.id} className={record.isPaid ? 'hover:bg-success-content/5' : 'hover:bg-error-content/5'}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedRentRecords.includes(record.id)}
                      onChange={() => handleSelectRentRecord(record.id)}
                    />
                  </td>
                  <td className="font-medium text-gray-800">{record.propertyName}</td>
                  <td>{record.unitNumber}</td>
                  <td>{record.tenantName}</td>
                  <td className="font-semibold">{formatCurrency(record.amount)}</td>
                  <td className="text-green-600 font-semibold">{formatCurrency(record.amountReceived)}</td>
                  <td>{formatDate(record.paymentDate)}</td>
                  <td>
                    <span className={`badge ${record.isPaid ? 'badge-success' : 'badge-error'} font-bold`}>
                      {record.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="text-gray-500">{record.partialReason || '-'}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditRentPaymentModal(record)}
                        className="btn btn-info btn-sm tooltip tooltip-top"
                        data-tip="Edit Payment"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openConfirmDeleteRentModal(record)}
                        className="btn btn-ghost btn-sm btn-circle text-error tooltip tooltip-top"
                        data-tip="Delete Record"
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

      <div className="card bg-base-200 shadow-xl p-6 rounded-xl mt-8">
        {/* Reduced heading size */}
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Unpaid & Overdue Rent (Arrears)</h3>
        {arrearsRecords.length > 0 && (
          <div className="flex justify-end mb-4">
            {/* Adjusted button size */}
            <button
              onClick={() => setConfirmBulkDeleteArrearsModal(true)}
              disabled={selectedArrearsRecords.length === 0}
              className="btn btn-error btn-md"
            >
              <Trash2 size={20} /> Bulk Delete Selected ({selectedArrearsRecords.length})
            </button>
          </div>
        )}
        {arrearsRecords.length === 0 ? (
          <div className="text-center text-gray-600 p-4 text-base">
            No unpaid or overdue rent records found. Great job!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full table-zebra text-base">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedArrearsRecords.length === arrearsRecords.length && arrearsRecords.length > 0}
                      onChange={() => handleSelectAllArrearsRecords()}
                    />
                  </th>
                  <th>Property</th>
                  <th>Unit #</th>
                  <th>Tenant Name</th>
                  <th>Month Due</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Amount Remaining</th>
                  <th>Days Overdue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {arrearsRecords.map(record => (
                  <tr key={record.id} className="bg-error-content/10 hover:bg-error-content/20">
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={selectedArrearsRecords.includes(record.id)}
                        onChange={() => handleSelectArrearsRecord(record.id)}
                      />
                    </td>
                    <td className="font-medium text-gray-800">{record.propertyName}</td>
                    <td>{record.unitNumber}</td>
                    <td>{record.tenantName}</td>
                    <td>
                      {new Date(record.monthYear + '-01T00:00:00').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    <td>{formatCurrency(record.amount)}</td>
                    <td>{formatCurrency(record.amountReceived)}</td>
                    <td className="text-error font-extrabold">{formatCurrency(record.amountRemaining)}</td>
                    <td className="text-error font-extrabold">
                      {record.daysOverdue} {record.daysOverdue === 1 ? 'day' : 'days'}
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditRentPaymentModal(record)}
                          className="btn btn-success btn-sm tooltip tooltip-top"
                          data-tip="Update Payment"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => openConfirmDeleteRentModal(record)}
                          className="btn btn-ghost btn-sm btn-circle text-error tooltip tooltip-top"
                          data-tip="Delete Record"
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

      <Modal isOpen={showEditRentPaymentModal} title={`Edit Payment for ${currentRentRecordToEdit?.tenantName} (Unit ${currentRentRecordToEdit?.unitNumber})`} onClose={() => setShowEditRentPaymentModal(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg font-semibold text-gray-800 p-2 bg-base-100 rounded-md">
            <span>Amount Due:</span>
            <span>{formatCurrency(expectedAmount)}</span>
          </div>
          <div>
            <label htmlFor="editPaymentDate" className="label">
              <span className="label-text">Payment Date</span>
            </label>
            <input type="date" id="editPaymentDate" value={editPaymentDate} onChange={(e) => setEditPaymentDate(e.target.value)} className="input input-bordered w-full"/>
          </div>
          <div>
            <label htmlFor="editAmountReceived" className="label">
              <span className="label-text">Amount Received</span>
            </label>
            <input
              type="number"
              id="editAmountReceived"
              value={editAmountReceived}
              onChange={(e) => {
                setEditAmountReceived(e.target.value);
                // Automatically set to full payment if received amount is >= expected
                setEditIsFullPayment(parseFloat(e.target.value || 0) >= expectedAmount);
              }}
              className="input input-bordered w-full"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex justify-between items-center text-base font-medium p-2 bg-base-100 rounded-md">
            <span>Difference:</span>
            <span className={difference > 0 ? 'text-error font-bold' : 'text-success font-bold'}>
              {formatCurrency(difference)}
            </span>
          </div>

          {editIsFullPayment ? (
            <div className="alert alert-success mt-4">
              <CheckCircle size={20} />
              <span>Full Amount Paid</span>
            </div>
          ) : (
            <div>
              <label htmlFor="editPartialReason" className="label">
                <span className="label-text">Reason for Difference</span>
              </label>
              <select
                id="editPartialReason"
                value={editPartialReason}
                onChange={(e) => setEditPartialReason(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select a reason</option>
                <option value="Late Payment">Late Payment</option>
                <option value="Partial Payment">Partial Payment</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              {editPartialReason === 'Maintenance' && (
                <p className="text-xs text-gray-500 mt-1">
                  Select "Maintenance" if the difference is due to maintenance work; it will be logged as an expense.
                </p>
              )}
            </div>
          )}
          <div className="modal-action">
            <button onClick={() => setShowEditRentPaymentModal(false)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleUpdateRentPayment} className="btn btn-primary">Update Payment</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteRentModal} title="Confirm Delete Rent Record" onClose={() => setConfirmDeleteRentModal(null)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-base">Are you sure you want to delete <strong>{confirmDeleteRentModal?.tenantName}</strong> for <strong>{confirmDeleteRentModal?.monthYear}</strong>?</p>
          <div className="modal-action">
            <button onClick={() => setConfirmDeleteRentModal(null)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleDeleteRentRecord} className="btn btn-error">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmBulkDeleteArrearsModal} title="Confirm Bulk Delete" onClose={() => setConfirmBulkDeleteArrearsModal(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-gray-700 text-base">
            Are you sure you want to delete <span className="font-semibold">{selectedArrearsRecords.length}</span> selected arrears records? This action cannot be undone.
          </p>
          <div className="modal-action">
            <button
              onClick={() => setConfirmBulkDeleteArrearsModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDeleteArrearsRecords}
              className="btn btn-error"
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
  const [newExpenseUnitId, setNewExpenseUnitId] = useState('');
  // const [newExpenseUnitNumber, setNewExpenseUnitNumber] = useState(''); // Removed unused state
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

    const selectedUnit = newExpenseUnitId ? getUnitsForProperty(newExpensePropertyId).find(u => u.id === newExpenseUnitId) : null;

    if (newExpensePropertyId && newExpenseUnitId && !selectedUnit) {
      setFeedbackMessage("Selected unit does not belong to the selected property.");
      return;
    }


    setFeedbackMessage('');
    try {
      const expenseData = {
        date: newExpenseDate,
        propertyId: newExpensePropertyId,
        propertyName: selectedProperty.name,
        unitId: newExpenseUnitId || null, // Allow null for property-level expenses
        unitNumber: selectedUnit?.number || null, // Get unit number if unitId is present
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
      setNewExpensePropertyId(properties.length > 0 ? properties[0].id : ''); // Reset to first property or empty
      setNewExpenseUnitId('');
      // setNewExpenseUnitNumber(''); // Removed unused state
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
    // setNewExpenseUnitNumber(''); // Removed unused state
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
    setNewExpenseUnitId(expense.unitId || '');
    // setNewExpenseUnitNumber(expense.unitNumber || ''); // Removed unused state
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
      {/* Reduced main heading size */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Expense Logger</h2>

      {feedbackMessage && (
        <div className={`alert ${feedbackMessage.startsWith('Error') ? 'alert-error' : 'alert-success'} shadow-lg`}>
          {feedbackMessage.startsWith('Error') ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        {/* Adjusted button size */}
        <button
          onClick={openAddExpenseModal}
          className="btn btn-primary btn-md"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Expense
        </button>
        {/* Adjusted button size */}
        <button
          onClick={openAddCategoryModal}
          className="btn btn-neutral btn-md"
        >
          <Edit size={20} className="mr-2" /> Manage Categories
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="card bg-base-200 shadow-md p-6 text-center text-gray-600 text-base">
          No expenses added yet. Click "Add New Expense" to record one!
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-200 shadow-md rounded-xl">
          <table className="table w-full table-zebra text-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Property</th>
                <th>Unit #</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Category</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                <tr key={expense.id}>
                  <td className="font-medium text-gray-800">{formatDate(expense.date)}</td>
                  <td>{expense.propertyName}</td>
                  <td>{expense.unitNumber || '-'}</td>
                  <td className="font-semibold">{formatCurrency(expense.amount)}</td>
                  <td>{expense.reason}</td>
                  <td>{expense.category || 'N/A'}</td>
                  <td className="text-gray-500">{expense.notes || '-'}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditExpenseModal(expense)}
                        className="btn btn-ghost btn-sm btn-circle tooltip tooltip-top"
                        data-tip="Edit Expense"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => openConfirmDeleteModal(expense.id, expense.reason)}
                        className="btn btn-ghost btn-sm btn-circle text-error tooltip tooltip-top"
                        data-tip="Delete Expense"
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

      <Modal isOpen={showExpenseModal} title={editingExpense ? "Edit Expense" : "Add New Expense"} onClose={() => setShowExpenseModal(false)} maxWidth="max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="expenseDate" className="label">
              <span className="label-text">Date</span>
            </label>
            <input
              type="date"
              id="expenseDate"
              value={newExpenseDate}
              onChange={(e) => setNewExpenseDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="expenseProperty" className="label">
              <span className="label-text">Property</span>
            </label>
            <select
              id="expenseProperty"
              value={newExpensePropertyId}
              onChange={(e) => {
                setNewExpensePropertyId(e.target.value);
                setNewExpenseUnitId('');
              }}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select a Property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
          {newExpensePropertyId && (
            <div>
              <label htmlFor="expenseUnit" className="label">
                <span className="label-text">Unit Number</span>
              </label>
              <select
                id="expenseUnit"
                value={newExpenseUnitId}
                onChange={(e) => {
                  setNewExpenseUnitId(e.target.value);
                }}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select a Unit</option>
                {getUnitsForProperty(newExpensePropertyId).map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.number} ({unit.tenantName})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="expenseAmount" className="label">
              <span className="label-text">Amount</span>
            </label>
            <input
              type="number"
              id="expenseAmount"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., 150.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="expenseReason" className="label">
              <span className="label-text">Reason</span>
            </label>
            <input
              type="text"
              id="expenseReason"
              value={newExpenseReason}
              onChange={(e) => setNewExpenseReason(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., Plumbing Repair"
              required
            />
          </div>
          <div>
            <label htmlFor="expenseCategory" className="label">
              <span className="label-text">Category</span>
            </label>
            <select
              id="expenseCategory"
              value={newExpenseCategory}
              onChange={(e) => setNewExpenseCategory(e.target.value)}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select a Category</option>
              {expenseCategories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-full">
            <label htmlFor="expenseNotes" className="label">
              <span className="label-text">Notes (Optional)</span>
            </label>
            <textarea
              id="expenseNotes"
              value={newExpenseNotes}
              onChange={(e) => setNewExpenseNotes(e.target.value)}
              rows="2"
              className="textarea textarea-bordered w-full"
              placeholder="Detailed description of the expense..."
            ></textarea>
          </div>
          <div className="modal-action col-span-full">
            <button
              onClick={() => setShowExpenseModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditExpense}
              className="btn btn-primary"
            >
              {editingExpense ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteModal} title="Confirm Delete Expense" onClose={() => setConfirmDeleteModal(null)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-gray-700 text-base">
            Are you sure you want to delete the expense for{' '}
            <span className="font-semibold">{confirmDeleteModal?.reason}</span>?
          </p>
          <div className="modal-action">
            <button
              onClick={() => setConfirmDeleteModal(null)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteExpense}
              className="btn btn-error"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCategoryModal} title={editingCategory ? "Edit Category" : "Manage Expense Categories"} onClose={() => setShowCategoryModal(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input input-bordered w-full rounded-r-none"
              placeholder={editingCategory ? "Update category name" : "New category name"}
            />
            <button
              onClick={handleAddEditCategory}
              className="btn btn-primary rounded-l-none"
            >
              {editingCategory ? "Update" : "Add"}
            </button>
          </div>

          {expenseCategories.length === 0 ? (
            <p className="text-gray-600 text-center text-base">No custom categories yet.</p>
          ) : (
            <ul className="menu bg-base-100 w-full rounded-box border border-base-300 text-base">
              {expenseCategories.map(category => (
                <li key={category.id}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">{category.name}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="btn btn-ghost btn-sm btn-circle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openConfirmDeleteCategoryModal(category.id, category.name)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteCategoryModal} title="Confirm Delete Category" onClose={() => setConfirmDeleteCategoryModal(null)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-gray-700 text-base">
            Are you sure you want to delete the category{' '}
            <span className="font-semibold">{confirmDeleteCategoryModal?.name}</span>?
            This will NOT delete expenses already assigned to this category.
          </p>
          <div className="modal-action">
            <button
              onClick={() => setConfirmDeleteCategoryModal(null)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCategory}
              className="btn btn-error"
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
      {/* Reduced main heading size */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Task Manager</h2>

      {feedbackMessage && (
        <div className={`alert ${feedbackMessage.startsWith('Error') ? 'alert-error' : 'alert-success'} shadow-lg`}>
          {feedbackMessage.startsWith('Error') ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="flex justify-end mb-4">
        {/* Adjusted button size */}
        <button
          onClick={openAddTaskModal}
          className="btn btn-primary btn-md"
        >
          <PlusCircle size={20} className="mr-2" /> Add New Task
        </button>
      </div>

      <div className="card bg-base-200 shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl">
        <div>
          <label htmlFor="filterStatus" className="label">
            <span className="label-text">Filter by Status</span>
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="All">All Statuses</option>
            {taskStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterProperty" className="label">
            <span className="label-text">Filter by Property</span>
          </label>
            <select
              id="filterProperty"
              value={filterPropertyId}
              onChange={(e) => setFilterPropertyId(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">All Properties</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
        </div>

      {filteredTasks.length === 0 ? (
        <div className="card bg-base-200 shadow-md p-6 text-center text-gray-600 text-base">
          No tasks found.
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-200 shadow-md rounded-xl">
          <table className="table w-full table-zebra text-base">
            <thead>
              <tr>
                <th>Description</th>
                <th>Due Date</th>
                <th>Property</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td className="font-medium text-gray-800">{task.description}</td>
                  <td>{task.dueDate ? formatDate(task.dueDate) : '-'}</td>
                  <td>{task.propertyName || '-'}</td>
                  <td>{task.unitNumber || '-'}</td>
                  <td>
                    <span className={`badge ${
                      task.status === 'Open' ? 'badge-error' :
                      task.status === 'In Progress' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="text-gray-500">{task.notes || '-'}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="btn btn-ghost btn-sm btn-circle tooltip tooltip-top"
                        data-tip="Edit Task"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => openConfirmDeleteModal(task.id, task.description)}
                        className="btn btn-ghost btn-sm btn-circle text-error tooltip tooltip-top"
                        data-tip="Delete Task"
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

      <Modal isOpen={showTaskModal} title={editingTask ? "Edit Task" : "Add New Task"} onClose={() => setShowTaskModal(false)} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label htmlFor="taskDescription" className="label">
              <span className="label-text">Description</span>
            </label>
            <input
              type="text"
              id="taskDescription"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="input input-bordered w-full"
              placeholder="e.g., Fix leaky faucet"
            />
          </div>
          <div>
            <label htmlFor="taskDueDate" className="label">
              <span className="label-text">Due Date (Optional)</span>
            </label>
            <input
              type="date"
              id="taskDueDate"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="taskProperty" className="label">
              <span className="label-text">Property (Optional)</span>
            </label>
            <select
              id="taskProperty"
              value={newTaskPropertyId}
              onChange={(e) => {
                setNewTaskPropertyId(e.target.value);
                setNewTaskUnitId('');
              }}
              className="select select-bordered w-full"
            >
              <option value="">Select a Property</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
          {newTaskPropertyId && (
            <div>
              <label htmlFor="taskUnit" className="label">
                <span className="label-text">Unit (Optional)</span>
              </label>
              <select
                id="taskUnit"
                value={newTaskUnitId}
                onChange={(e) => setNewTaskUnitId(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select a Unit</option>
                {getUnitsForSelectedProperty.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.number}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="taskStatus" className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              id="taskStatus"
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
              className="select select-bordered w-full"
            >
              {taskStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="taskNotes" className="label">
              <span className="label-text">Notes (Optional)</span>
            </label>
            <textarea
              id="taskNotes"
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              rows="2"
              className="textarea textarea-bordered w-full"
              placeholder="Detailed description of the task..."
            ></textarea>
          </div>
          <div className="modal-action">
            <button
              onClick={() => setShowTaskModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEditTask}
              className="btn btn-primary"
            >
              {editingTask ? "Update Task" : "Add Task"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteModal} title="Confirm Delete Task" onClose={() => setConfirmDeleteModal(null)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-gray-700 text-base">
            Are you sure you want to delete the task:{' '}
            <span className="font-semibold">{confirmDeleteModal?.description}</span>?
          </p>
          <div className="modal-action">
            <button
              onClick={() => setConfirmDeleteModal(null)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTask}
              className="btn btn-error"
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
  const [senderGmailEmail, setSenderGmailEmail] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
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
    console.log("Reminder settings saved (placeholder):", {
      senderGmailEmail,
      recipientEmail,
      reminderFrequency,
      reminderDay,
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
      {/* Reduced main heading size */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Reminders</h2>

      {feedbackMessage && (
        <div className={`alert ${feedbackMessage.startsWith('Error') ? 'alert-error' : 'alert-success'} shadow-lg`}>
          {feedbackMessage.startsWith('Error') ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="alert alert-warning shadow-lg">
        <Info size={24} />
        <div>
          <h3 className="font-bold">Important Note on Email Reminders:</h3>
          {/* Adjusted text size for readability */}
          <div className="text-base">
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
            If you choose to implement email sending, consider using <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="link link-hover text-warning-content">Google App Passwords</a>
            instead of your main Gmail password for security.
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-md p-6 space-y-5 rounded-xl">
        <h3 className="text-xl font-semibold text-gray-800">Email Reminder Settings</h3>

        <div>
          <label htmlFor="senderGmailEmail" className="label">
            <span className="label-text">Your Gmail Address (Sender)</span>
          </label>
          <input
            type="email"
            id="senderGmailEmail"
            value={senderGmailEmail}
            onChange={(e) => setSenderGmailEmail(e.target.value)}
            className="input input-bordered w-full"
            placeholder="your.email@gmail.com"
          />
        </div>

        <div>
          <label htmlFor="recipientEmail" className="label">
            <span className="label-text">Recipient Email Address (Where reminders are sent)</span>
          </label>
          <input
            type="email"
            id="recipientEmail"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="input input-bordered w-full"
            placeholder="reminders@example.com or your.email@gmail.com"
          />
          <p className="text-sm text-gray-500 mt-1">
            This is the email address that will receive the rent reminders.
          </p>
        </div>

        <div>
          <label htmlFor="appPassword" className="label">
            <span className="label-text">Gmail App Password (for Sender Email)</span>
          </label>
          <input
            type="password"
            id="appPassword"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            className="input input-bordered w-full"
            placeholder="e.g., xxxx xxxx xxxx xxxx (from Google App Passwords)"
          />
          <p className="text-sm text-gray-500 mt-1">
            This is NOT your main Gmail password. Generate an App Password in your Google Account security settings.
          </p>
        </div>

        <div>
          <label htmlFor="reminderFrequency" className="label">
            <span className="label-text">Reminder Frequency</span>
            </label>
            <select
              id="reminderFrequency"
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {reminderFrequency === 'monthly' && (
            <div>
              <label htmlFor="reminderDay" className="label">
                <span className="label-text">Day of Month for Reminder</span>
              </label>
              <input
                type="number"
                id="reminderDay"
                value={reminderDay}
                onChange={(e) => setReminderDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="input input-bordered w-full"
                min="1"
                max="31"
              />
              <p className="text-sm text-gray-500 mt-1">
                e.g., 1 for the 1st of the month.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {/* Adjusted button size */}
            <button
              onClick={handleSendTestEmail}
              className="btn btn-ghost btn-md"
            >
              <MailIcon size={18} className="mr-2" /> Send Test Email
            </button>
            {/* Adjusted button size */}
            <button
              onClick={handleSaveSettings}
              className="btn btn-primary btn-md"
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
      }, (error) => console.error("Error fetching expenses:", error));

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
      const headers = ['id', 'propertyId', 'propertyName', 'unitId', 'unitNumber', 'tenantName', 'amount', 'amountReceived', 'monthYear', 'isPaid', 'paymentDate', 'dueDate', 'isPartialPayment', 'partialReason', 'createdAt'];
      const csv = convertToCsv(rentRecords, headers);
      downloadCsv(csv, 'rent_records.csv');
    };

    const handleExportExpenses = () => {
      if (expenses.length === 0) {
        setFeedbackMessage("No expense records to export.");
        return;
      }
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
        propertyAddress: prop.address || '',
      })));

      const headers = [
        'id', 'propertyId', 'propertyName', 'propertyAddress',
        'number', 'tenantName', 'rentAmount', 'moveInDate', 'notes',
        'phoneNumber', 'email', 'emergencyContactName', 'emergencyContactPhone',
        'leaseStartDate', 'leaseEndDate', 'securityDepositAmount', 'leaseTerm',
        'rentIncrementAmount', 'rentIncrementEffectiveDate', 'createdAt'
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
        {/* Reduced main heading size */}
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">Export Data</h2>

        {feedbackMessage && (
          <div className={`alert ${feedbackMessage.startsWith('Error') ? 'alert-error' : 'alert-success'} shadow-lg`}>
            {feedbackMessage.startsWith('Error') ? <XCircle size={20} /> : <CheckCircle size={20} />}
            <span>{feedbackMessage}</span>
          </div>
        )}

        <div className="card bg-base-200 shadow-md p-6 space-y-5 rounded-xl">
          <p className="text-gray-700 text-base">
            Export your rental property data to CSV files. These files can be opened in spreadsheet software for analysis, accounting, or backup purposes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Adjusted button sizes */}
            <button
              onClick={handleExportRent}
              className="btn btn-success btn-md"
            >
              <Download size={20} className="mr-2" /> Rent Data
            </button>
            <button
              onClick={handleExportExpenses}
              className="btn btn-secondary btn-md"
            >
              <Download size={20} className="mr-2" /> Expense Data
            </button>
            <button
              onClick={handleExportPropertiesAndUnits}
              className="btn btn-info btn-md"
            >
              <Download size={20} className="mr-2" /> Properties & Units
            </button>
            <button
              onClick={handleExportTasks}
              className="btn btn-warning btn-md"
            >
              <Download size={20} className="mr-2" /> Task Data
            </button>
          </div>

          <div className="mt-6 text-gray-600 text-base space-y-2">
            <p>
              <span className="font-semibold text-gray-800">Rent Data Fields:</span> ID, Property ID, Property Name, Unit ID, Unit Number, Tenant Name, Amount Due, Amount Received, Month/Year, Is Paid, Payment Date, Due Date, Is Partial Payment, Partial Reason, Created At.
            </p>
            <p>
              <span className="font-semibold text-gray-800">Expense Data Fields:</span> ID, Date, Property ID, Property Name, Unit ID, Unit Number, Amount, Reason, Category, Notes, Created At.
            </p>
            <p>
              <span className="font-semibold text-gray-800">Properties & Units Data Fields:</span> ID, Property ID, Property Name, Property Address, Unit Number, Tenant Name, Rent Amount, Move-in Date, Unit Notes, Phone Number, Email, Emergency Contact Name, Emergency Contact Phone, Lease Start Date, Lease End Date, Security Deposit Amount, Lease Term, Rent Increment Amount, Rent Increment Effective Date, Created At.
            </p>
            <p>
              <span className="font-semibold text-gray-800">Task Data Fields:</span> ID, Description, Due Date, Property ID, Property Name, Unit ID, Unit Number, Status, Notes, Created At.
            </p>
          </div>
        </div>
      </div>
    );
  };

  export default App;
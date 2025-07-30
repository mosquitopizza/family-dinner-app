import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Google Font & CSS for background pattern ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #fef3c7; /* amber-100 */
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40' width='80' height='40'%3E%3Cpath fill='%237dd3fc' fill-opacity='0.2' d='M0 40c20 0 20-40 40-40s20 40 40 40v-40H0v40z'%3E%3C/path%3E%3C/svg%3E");
        }
        .font-poppins {
            font-family: 'Poppins', sans-serif;
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);


// --- Icon Imports (using inline SVGs for simplicity) ---
const CalendarDays = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
const Sun = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12"x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);
const PlusCircle = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="16" /><line x1="8" x2="16" y1="12" y2="12" />
    </svg>
);
const Trash2 = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
    </svg>
);


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyC4ivOi7TL5F3Tp23y1XmmZJuRVcMdosw0",
  authDomain: "beach-dinner-signup.firebaseapp.com",
  projectId: "beach-dinner-signup",
  storageBucket: "beach-dinner-signup.firebasestorage.app",
  messagingSenderId: "47314255862",
  appId: "1:47314255862:web:1954797f2680e77fcd91d7"
};

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Main App Component ---
const App = () => {
    // --- State Management ---
    const [schedule, setSchedule] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-dinner-signup';

    // --- Authentication Effect ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (err) {
                    console.error("Authentication Error:", err);
                    setError("Could not connect to the service. Please refresh the page.");
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Firestore Data Subscription Effect ---
    useEffect(() => {
        if (!userId) return; 

        const scheduleCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedule');
        
        const initialDates = [
            { id: '2025-08-02', date: 'August 2', day: 'Saturday' },
            { id: '2025-08-03', date: 'August 3', day: 'Sunday' },
            { id: '2025-08-04', date: 'August 4', day: 'Monday' },
            { id: '2025-08-05', date: 'August 5', day: 'Tuesday' },
            { id: '2025-08-06', date: 'August 6', day: 'Wednesday' },
            { id: '2025-08-07', date: 'August 7', day: 'Thursday' },
            { id: '2025-08-08', date: 'August 8', day: 'Friday' },
            { id: '2025-08-09', date: 'August 9', day: 'Saturday' },
        ];

        const unsubscribe = onSnapshot(scheduleCollectionRef, (snapshot) => {
            const signupData = {};
            snapshot.forEach(doc => {
                signupData[doc.id] = doc.data();
            });

            const updatedSchedule = initialDates.map(day => ({
                ...day,
                ...signupData[day.id]
            }));
            
            setSchedule(updatedSchedule);
            setLoading(false);
        }, (err) => {
            console.error("Firestore Snapshot Error:", err);
            setError("Failed to load schedule data.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, appId]);

    // --- Event Handlers ---
    const handleSignup = async (dayId, name, entree, sides) => {
        if (!name.trim() || !entree.trim()) {
            return;
        }
        try {
            const dayRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedule', dayId);
            await setDoc(dayRef, {
                personName: name,
                entree: entree,
                sides: sides,
                isTaken: true,
                signupUserId: userId
            });
        } catch (err) {
            console.error("Error signing up:", err);
            setError("Could not save your signup. Please try again.");
        }
    };

    const handleRemove = async (dayId) => {
        try {
            const dayRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedule', dayId);
            await deleteDoc(dayRef);
        } catch (err) {
            console.error("Error removing signup:", err);
            setError("Could not remove your signup. Please try again.");
        }
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-amber-100">
                <GlobalStyles />
                <div className="text-center">
                    <CalendarDays className="h-12 w-12 text-sky-500 mx-auto animate-spin" />
                    <p className="text-xl text-stone-600 mt-4 font-poppins">Loading Dinner Schedule...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-red-50"><p className="text-xl text-red-600 font-poppins">{error}</p></div>;
    }

    return (
        <div className="min-h-screen font-poppins p-4 sm:p-6 lg:p-8">
            <GlobalStyles />
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <div className="inline-block bg-white/60 p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
                        <div className="bg-orange-400 p-4 rounded-full">
                           <Sun className="h-12 w-12 text-white"/>
                        </div>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-bold text-cyan-900 mt-4">2025 Family Beach Trip!</h1>
                    <p className="text-lg text-cyan-800 mt-2">Dinner Schedule: Aug 2nd - 9th, 2025</p>
                    <p className="text-xl text-orange-600 font-semibold mt-4">Pick a night to be the chef!</p>
                </header>
                <div className="space-y-5">
                    {schedule.map(day => (
                        <DayCard 
                            key={day.id} 
                            day={day} 
                            currentUserId={userId}
                            onSignup={handleSignup}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
                 <footer className="text-center mt-10 text-cyan-800/70 text-sm">
                    <p>Have fun in the sun! ☀️🦀🌊</p>
                </footer>
            </div>
        </div>
    );
};

// --- Day Card Component ---
const DayCard = ({ day, currentUserId, onSignup, onRemove }) => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [name, setName] = useState('');
    const [entree, setEntree] = useState('');
    const [sides, setSides] = useState('');

    const isTaken = day.isTaken;
    const isOwner = isTaken && day.signupUserId === currentUserId;

    const handleSignupClick = () => setIsSigningUp(true);
    const handleCancel = () => setIsSigningUp(false);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSignup(day.id, name, entree, sides);
        setIsSigningUp(false);
    };

    return (
        <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${isTaken ? 'border-l-8 border-sky-400' : 'border-l-8 border-orange-400'}`}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-sm font-semibold text-sky-600 uppercase tracking-wider">{day.day}</p>
                        <h2 className="text-3xl font-bold text-cyan-900">{day.date}</h2>
                    </div>
                    {!isTaken && !isSigningUp && (
                        <button onClick={handleSignupClick} className="flex items-center gap-2 bg-orange-400 text-white font-bold py-2 px-5 rounded-full hover:bg-orange-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                            <PlusCircle className="h-5 w-5"/>
                            I'll Cook!
                        </button>
                    )}
                    {isOwner && (
                         <button onClick={() => onRemove(day.id)} className="flex items-center gap-2 bg-rose-400 text-white font-bold py-2 px-5 rounded-full hover:bg-rose-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                            <Trash2 className="h-5 w-5"/>
                            Cancel
                        </button>
                    )}
                </div>

                {isSigningUp ? (
                    <form onSubmit={handleSubmit} className="border-t border-amber-200 pt-4 animate-fade-in">
                        <div className="space-y-4">
                             <div>
                                <label htmlFor={`name-${day.id}`} className="block text-sm font-semibold text-cyan-800 mb-1">Chef's Name</label>
                                <input type="text" id={`name-${day.id}`} value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-white/70 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Sandy Cheeks" required />
                            </div>
                             <div>
                                <label htmlFor={`entree-${day.id}`} className="block text-sm font-semibold text-cyan-800 mb-1">Main Dish</label>
                                <input type="text" id={`entree-${day.id}`} value={entree} onChange={e => setEntree(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-white/70 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Freshly Grilled Fish" required />
                            </div>
                             <div>
                                <label htmlFor={`sides-${day.id}`} className="block text-sm font-semibold text-cyan-800 mb-1">Sides (optional)</label>
                                <input type="text" id={`sides-${day.id}`} value={sides} onChange={e => setSides(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-white/70 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g., Pineapple Salad" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={handleCancel} className="font-semibold text-stone-600 py-2 px-4 rounded-lg hover:bg-amber-100/70 transition-colors">
                                Nevermind
                            </button>
                            <button type="submit" className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors shadow-sm">
                                Save My Spot
                            </button>
                        </div>
                    </form>
                ) : isTaken ? (
                    <div className="border-t border-amber-200 pt-4">
                        <div className="flex items-center gap-3">
                            <Sun className="h-6 w-6 text-orange-500"/>
                            <p className="text-lg font-bold text-cyan-900">{day.personName} is cooking:</p>
                        </div>
                        <div className="mt-3 pl-9 text-cyan-800">
                           <p><span className="font-semibold">Main:</span> {day.entree}</p>
                           {day.sides && <p className="mt-1"><span className="font-semibold">Sides:</span> {day.sides}</p>}
                        </div>
                    </div>
                ) : <div className="text-center text-orange-500/80 pt-4 border-t border-dashed border-amber-300">This night is up for grabs!</div>}
            </div>
        </div>
    );
};

export default App;

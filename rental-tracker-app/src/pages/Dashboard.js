import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Wallet, Receipt, PieChart, PlusCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { SkeletonCard } from '../components/Shared';

const Dashboard = () => {
    const { db, userId, __app_id } = useContext(AppContext);
    const [metrics, setMetrics] = useState({ collected: 0, total: 0, expenses: 0, propCount: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    useEffect(() => {
        if(!db) return;
        const nowStr = new Date().toISOString().slice(0,7);
        const u1 = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/properties`), s => { setMetrics(p => ({ ...p, propCount: s.docs.length })); setLoading(false); });
        const u2 = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`), s => {
            let col = 0, tot = 0; s.docs.forEach(d => { const r=d.data(); if(r.monthYear===nowStr) { tot+=(r.amount||0); col+=(r.amountReceived||0); }});
            setMetrics(p => ({ ...p, collected: col, total: tot }));
        });
        const u3 = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`), s => {
            let exp = 0; s.docs.forEach(d => { const e=d.data(); if(e.date.startsWith(nowStr)) exp+=(e.amount||0); });
            setMetrics(p => ({ ...p, expenses: exp }));
        });
        return () => { u1(); u2(); u3(); };
    }, [db, userId, __app_id]);

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>;
    
    if (metrics.propCount === 0) return (
        <div className="hero bg-base-100 rounded-3xl border border-base-200 py-12 text-center">
            <div className="max-w-md">
                <h1 className="text-4xl font-black text-primary mb-4">Welcome!</h1>
                <p className="py-4">Let's get setup. Add your first property to start tracking.</p>
                <button onClick={() => navigate('/properties')} className="btn btn-primary btn-lg"><PlusCircle/> Add Property</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stats shadow bg-base-100 border border-base-200"><div className="stat"><div className="stat-figure text-success bg-success/10 p-3 rounded-full"><Wallet size={24}/></div><div className="stat-title">Collected</div><div className="stat-value text-success">{formatCurrency(metrics.collected)}</div><div className="stat-desc">of {formatCurrency(metrics.total)} due</div></div></div>
                <div className="stats shadow bg-base-100 border border-base-200"><div className="stat"><div className="stat-figure text-error bg-error/10 p-3 rounded-full"><Receipt size={24}/></div><div className="stat-title">Expenses</div><div className="stat-value text-error">{formatCurrency(metrics.expenses)}</div><div className="stat-desc">This Month</div></div></div>
                <div className="stats shadow bg-base-100 border border-base-200"><div className="stat"><div className="stat-figure text-info bg-info/10 p-3 rounded-full"><PieChart size={24}/></div><div className="stat-title">Net Income</div><div className="stat-value text-info">{formatCurrency(metrics.collected - metrics.expenses)}</div><div className="stat-desc">Cash Flow</div></div></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{l:'Add Property',i:PlusCircle,c:'text-primary',a:'/properties'},{l:'Log Payment',i:CheckCircle,c:'text-success',a:'/rent'},{l:'Add Expense',i:Receipt,c:'text-error',a:'/expenses'},{l:'Analytics',i:BarChart3,c:'text-info',a:'/reports'}].map(x=><button key={x.l} onClick={()=>navigate(x.a)} className="btn h-auto py-4 flex flex-col gap-2 bg-base-100 shadow"><x.i size={24} className={x.c}/><span>{x.l}</span></button>)}
            </div>
        </div>
    );
};
export default Dashboard;
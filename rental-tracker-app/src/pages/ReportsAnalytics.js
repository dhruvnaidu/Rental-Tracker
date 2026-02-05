import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { AppContext } from '../context/AppContext';
import { SimpleBarChart, SimplePieChart, SkeletonCard } from '../components/Shared';

const ReportsAnalytics = () => {
    const { db, userId, __app_id } = useContext(AppContext);
    const [cashFlowData, setCashFlowData] = useState([]);
    const [expenseData, setExpenseData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(!db) return;
        const fetchData = async () => {
            const rentSnap = await getDocs(collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`));
            const expSnap = await getDocs(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`));
            
            const monthlyStats = {};
            const today = new Date();
            for(let i=5; i>=0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth()-i, 1);
                const k = d.toISOString().slice(0,7);
                monthlyStats[k] = { label: d.toLocaleString('default', {month:'short'}), income: 0, expense: 0 };
            }

            rentSnap.docs.forEach(d => { const r = d.data(); if(monthlyStats[r.monthYear]) monthlyStats[r.monthYear].income += (r.amountReceived || 0); });
            expSnap.docs.forEach(d => { const e = d.data(); const k = e.date.slice(0,7); if(monthlyStats[k]) monthlyStats[k].expense += (e.amount || 0); });

            const cats = {}; let totalExp = 0;
            expSnap.docs.forEach(d => { const e = d.data(); const c = e.category || 'Uncategorized'; if(!cats[c]) cats[c] = 0; cats[c] += (e.amount || 0); totalExp += (e.amount || 0); });

            const pieData = Object.keys(cats).map((k, i) => ({ label: k, value: cats[k], percent: (cats[k]/totalExp)*100, color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'][i%5] })).sort((a,b) => b.value - a.value);

            setCashFlowData(Object.values(monthlyStats)); setExpenseData(pieData); setLoading(false);
        };
        fetchData();
    }, [db, userId, __app_id]);

    if(loading) return <SkeletonCard/>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow border border-base-200"><div className="card-body"><h3 className="card-title text-sm uppercase opacity-50">Cash Flow (6 Mo)</h3><SimpleBarChart data={cashFlowData} /></div></div>
                <div className="card bg-base-100 shadow border border-base-200"><div className="card-body"><h3 className="card-title text-sm uppercase opacity-50">Expenses</h3>{expenseData.length > 0 ? <SimplePieChart data={expenseData} /> : <div className="opacity-50">No Data</div>}</div></div>
            </div>
        </div>
    );
};
export default ReportsAnalytics;
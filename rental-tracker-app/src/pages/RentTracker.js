import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { ListTodo, Calendar as CalendarIcon } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';

const RentTracker = () => {
    const { db, userId, __app_id, showToast } = useContext(AppContext);
    const [records, setRecords] = useState([]);
    const [view, setView] = useState('list');
    const [month, setMonth] = useState(new Date().toISOString().slice(0,7));

    useEffect(() => {
        const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`), where("monthYear", "==", month));
        const unsub = onSnapshot(q, s => setRecords(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.unitNumber.localeCompare(b.unitNumber))));
        return () => unsub();
    }, [db, userId, __app_id, month]);

    const togglePaid = async (r) => { await updateDoc(doc(db, `artifacts/${__app_id}/users/${userId}/rentRecords`, r.id), { isPaid: !r.isPaid, amountReceived: !r.isPaid ? r.amount : 0, paymentDate: !r.isPaid ? new Date().toISOString() : null }); showToast('Updated', 'success'); };
    const stats = records.reduce((acc, r) => ({ total: acc.total + r.amount, paid: acc.paid + (r.amountReceived || 0) }), { total: 0, paid: 0 });

    const CalendarView = () => {
        const d = new Date(month + '-01');
        const days = Array.from({length: new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()}, (_, i) => i+1);
        const offset = Array.from({length: new Date(d.getFullYear(), d.getMonth(), 1).getDay()}, (_, i) => i);
        return (
            <div className="bg-base-100 rounded-xl shadow border border-base-200 p-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2 font-bold text-xs opacity-50 uppercase">{['S','M','T','W','T','F','S'].map(d=><div key={d}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1 auto-rows-fr">{offset.map(i=><div key={`e-${i}`}></div>)}{days.map(day => {
                    const dateStr = `${month}-${String(day).padStart(2,'0')}`; const due = records.filter(r => r.dueDate === dateStr || (!r.dueDate && day===1));
                    return (<div key={day} className={`min-h-[80px] border border-base-200 rounded p-1 flex flex-col ${due.length?'bg-base-200/30':''}`}><span className="text-xs font-bold opacity-50 mb-1">{day}</span>{due.map(r => <div key={r.id} onClick={()=>togglePaid(r)} className={`cursor-pointer text-[10px] p-1 rounded font-bold truncate mb-1 ${r.isPaid ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>{r.unitNumber}</div>)}</div>);
                })}</div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4"><div className="flex items-center gap-4"><h2 className="text-3xl font-bold">Rent</h2><div className="join"><button className={`join-item btn btn-sm ${view==='list'?'btn-primary':''}`} onClick={()=>setView('list')}><ListTodo size={16}/></button><button className={`join-item btn btn-sm ${view==='cal'?'btn-primary':''}`} onClick={()=>setView('cal')}><CalendarIcon size={16}/></button></div></div><input type="month" className="input input-bordered input-sm" value={month} onChange={e=>setMonth(e.target.value)} /></div>
            <div className="card bg-base-100 shadow border border-base-200 p-4 flex-row items-center justify-between"><div><div className="text-xs uppercase font-bold opacity-50">Collected</div><div className="text-2xl font-black text-success">{formatCurrency(stats.paid)}</div></div><div><div className="text-xs uppercase font-bold opacity-50 text-right">Pending</div><div className="text-2xl font-black text-error text-right">{formatCurrency(stats.total - stats.paid)}</div></div></div>
            {view === 'list' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{records.map(r => <div key={r.id} className={`card bg-base-100 shadow-sm border-l-4 ${r.isPaid ? 'border-success' : 'border-warning'}`}><div className="card-body p-4"><div className="flex justify-between items-start"><div><div className="font-bold text-lg">Unit {r.unitNumber}</div><div className="text-sm opacity-60">{r.tenantName}</div></div><div className={`badge ${r.isPaid ? 'badge-success' : 'badge-warning'}`}>{r.isPaid ? 'Paid' : 'Pending'}</div></div><div className="flex justify-between items-center mt-4"><div className="font-mono font-bold">{formatCurrency(r.amount)}</div><button className={`btn btn-sm ${r.isPaid ? 'btn-ghost' : 'btn-success'}`} onClick={()=>togglePaid(r)}>{r.isPaid ? 'Undo' : 'Pay'}</button></div></div></div>)}</div> : <CalendarView />}
        </div>
    );
};
export default RentTracker;
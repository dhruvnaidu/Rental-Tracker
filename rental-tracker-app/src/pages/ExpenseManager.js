import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { PlusCircle, Trash2, UploadCloud, FileText } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Modal } from '../components/Shared';

const ExpenseManager = () => {
    const { db, userId, __app_id, showToast } = useContext(AppContext);
    const [list, setList] = useState([]);
    const [props, setProps] = useState([]);
    const [form, setForm] = useState({ amount: '', reason: '', category: 'Maintenance', date: new Date().toISOString().slice(0,10), propertyId: '', isRecurring: false });
    const [modalOpen, setModalOpen] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    useEffect(() => {
        const u1 = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/properties`), s => setProps(s.docs.map(d=>({id:d.id, ...d.data()}))));
        const u2 = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`), s => setList(s.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=>new Date(b.date)-new Date(a.date))));
        return () => { u1(); u2(); };
    }, [db, userId, __app_id]);

    const addExp = async () => {
        if(!form.amount || !form.propertyId) return showToast('Details required', 'error');
        const p = props.find(x => x.id === form.propertyId);
        const payload = { ...form, amount: parseFloat(form.amount), propertyName: p.name };
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`), payload);
        if (form.isRecurring) { await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/recurringExpenses`), { ...payload, recurrenceId: 'rule_'+Date.now(), createdAt: new Date().toISOString() }); showToast('Recurring rule created', 'info'); }
        setForm({ ...form, amount: '', reason: '', isRecurring: false }); setUploadedFiles([]); setModalOpen(false); showToast('Expense saved', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-bold">Expenses</h2><button className="btn btn-primary" onClick={()=>setModalOpen(true)}><PlusCircle/> Add</button></div>
            <div className="bg-base-100 rounded-xl shadow border border-base-200 overflow-hidden"><table className="table"><thead><tr className="bg-base-200/50"><th>Date</th><th>Category</th><th>Details</th><th className="text-right">Amount</th><th></th></tr></thead><tbody>
                {list.map(x => ( <tr key={x.id} className="hover:bg-base-200/50"><td className="font-mono text-xs opacity-70">{formatDate(x.date)}</td><td><div className="badge badge-sm badge-ghost">{x.category}</div></td><td><div className="font-medium">{x.propertyName}</div><div className="text-xs opacity-60">{x.reason}</div></td><td className="text-right font-bold text-error">{formatCurrency(x.amount)}</td><td><button className="btn btn-xs btn-ghost text-error" onClick={()=>deleteDoc(doc(db,`artifacts/${__app_id}/users/${userId}/expenses`,x.id))}><Trash2 size={14}/></button></td></tr>))}
            </tbody></table></div>
            <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title="New Expense">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><label className="form-control"><span className="label-text">Date</span><input type="date" className="input input-bordered" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></label><label className="form-control"><span className="label-text">Amount</span><input type="number" className="input input-bordered" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></label></div>
                    <label className="form-control"><span className="label-text">Property</span><select className="select select-bordered" value={form.propertyId} onChange={e=>setForm({...form,propertyId:e.target.value})}><option value="">Select...</option>{props.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
                    <label className="form-control"><span className="label-text">Category</span><select className="select select-bordered" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['Maintenance','Utilities','Mortgage','Tax','Insurance','Other'].map(c=><option key={c} value={c}>{c}</option>)}</select></label>
                    <label className="form-control"><span className="label-text">Description</span><input className="input input-bordered" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} /></label>
                    <div className="form-control"><label className="label cursor-pointer justify-start gap-4"><input type="checkbox" className="checkbox checkbox-primary" checked={form.isRecurring} onChange={e=>setForm({...form, isRecurring: e.target.checked})} /><span className="label-text font-bold">Recurring Monthly?</span></label></div>
                    <div className="bg-base-200 p-4 rounded-lg border-2 border-dashed border-base-300 text-center cursor-pointer relative hover:border-primary transition-colors"><input type="file" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={(e)=>e.target.files[0] && setUploadedFiles([e.target.files[0].name])} /><UploadCloud className="mx-auto mb-2 opacity-50"/><p className="text-xs font-bold">Upload Receipt</p>{uploadedFiles.length > 0 && <div className="mt-2 text-left text-xs bg-base-100 p-2 rounded flex items-center gap-2"><FileText size={12}/> {uploadedFiles[0]}</div>}</div>
                    <button className="btn btn-primary w-full" onClick={addExp}>Save Expense</button>
                </div>
            </Modal>
        </div>
    );
};
export default ExpenseManager;
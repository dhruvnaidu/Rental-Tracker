import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc } from 'firebase/firestore';
import { PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const KanbanTaskManager = () => {
    const { db, userId, __app_id } = useContext(AppContext);
    const [tasks, setTasks] = useState([]);
    const [desc, setDesc] = useState('');
    useEffect(() => { const u = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/tasks`), s => setTasks(s.docs.map(d=>({id:d.id, ...d.data()})))); return () => u(); }, [db, userId, __app_id]);
    const addTask = async (e) => { e.preventDefault(); if(!desc) return; await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/tasks`), { description: desc, status: 'Open', createdAt: new Date().toISOString() }); setDesc(''); };
    const Column = ({ title, status, color }) => (<div className="flex-1 min-w-[300px] bg-base-100/50 rounded-xl border border-base-200 p-4"><h3 className={`font-bold uppercase text-xs mb-4 ${color}`}>{title} ({tasks.filter(t=>t.status===status).length})</h3><div className="flex flex-col gap-3">{tasks.filter(t => t.status === status).map(t => <div key={t.id} className="card bg-base-100 shadow-sm border border-base-200 p-3"><p className="text-sm font-medium mb-2">{t.description}</p><div className="flex justify-between"><button onClick={()=>deleteDoc(doc(db,`artifacts/${__app_id}/users/${userId}/tasks`,t.id))} className="btn btn-xs btn-ghost text-error"><Trash2 size={12}/></button><button onClick={()=>updateDoc(doc(db,`artifacts/${__app_id}/users/${userId}/tasks`,t.id),{status:status==='Open'?'Done':'Open'})} className="btn btn-xs btn-ghost"><ArrowRight size={12}/></button></div></div>)}</div></div>);
    return (<div className="space-y-6"><div className="flex justify-between items-center"><h2 className="text-3xl font-bold">Tasks</h2><form onSubmit={addTask} className="flex gap-2"><input className="input input-bordered shadow-sm" placeholder="Add task..." value={desc} onChange={e=>setDesc(e.target.value)} /><button className="btn btn-primary"><PlusCircle/></button></form></div><div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4"><Column title="To Do" status="Open" color="text-error" /><Column title="Done" status="Done" color="text-success" /></div></div>);
};
export default KanbanTaskManager;
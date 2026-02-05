import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc } from 'firebase/firestore';
import { PlusCircle, Trash2, ArrowRight, ArrowLeft, Building, CheckCircle, AlignLeft } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Modal } from '../components/Shared';

const KanbanTaskManager = () => {
    const { db, userId, __app_id, showToast } = useContext(AppContext);
    const [tasks, setTasks] = useState([]);
    const [properties, setProperties] = useState([]);
    
    // Modal State - Added 'details' field
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ description: '', details: '', propertyId: '', status: 'Open' });

    useEffect(() => {
        // Fetch Tasks
        const unsubTasks = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/tasks`), s => 
            setTasks(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)))
        );
        // Fetch Properties (for the dropdown)
        const unsubProps = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/properties`), s => 
            setProperties(s.docs.map(d => ({id: d.id, ...d.data()})))
        );
        return () => { unsubTasks(); unsubProps(); };
    }, [db, userId, __app_id]);

    const handleAddTask = async () => {
        if (!form.description) return showToast('Task title is required', 'error');
        
        try {
            // Find property name for display
            const prop = properties.find(p => p.id === form.propertyId);
            const propertyName = prop ? prop.name : 'General';

            await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/tasks`), { 
                description: form.description,  // Main Title
                details: form.details || '',    // Detailed Notes
                status: form.status, 
                propertyId: form.propertyId || '',
                propertyName: propertyName,
                createdAt: new Date().toISOString() 
            });
            
            showToast('Task added successfully', 'success');
            setForm({ description: '', details: '', propertyId: '', status: 'Open' });
            setModalOpen(false);
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    const updateStatus = async (task, direction) => {
        const flow = ['Open', 'In Progress', 'Completed'];
        const currentIndex = flow.indexOf(task.status);
        if (currentIndex === -1) return;

        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < flow.length) {
            await updateDoc(doc(db, `artifacts/${__app_id}/users/${userId}/tasks`, task.id), { status: flow[nextIndex] });
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Delete this task?")) {
            await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/tasks`, id));
            showToast('Task deleted', 'success');
        }
    };

    const Column = ({ title, status, color, borderColor }) => (
        <div className={`flex-1 min-w-[300px] bg-base-100 rounded-xl border-t-4 ${borderColor} shadow-sm border-x border-b border-base-200 p-4`}>
            <h3 className={`font-bold uppercase text-xs mb-4 flex items-center gap-2 ${color}`}>
                <div className={`w-2 h-2 rounded-full bg-current`}></div> 
                {title} <span className="opacity-50">({tasks.filter(t => t.status === status).length})</span>
            </h3>
            
            <div className="flex flex-col gap-3 min-h-[200px]">
                {tasks.filter(t => t.status === status).map(t => (
                    <div key={t.id} className="card bg-base-200/50 hover:bg-base-200 transition-colors p-3 border border-base-300">
                        <div className="flex justify-between items-start mb-2">
                            <div className="w-full">
                                <p className="font-bold text-sm">{t.description}</p>
                                
                                {/* Display Details if they exist */}
                                {t.details && (
                                    <p className="text-xs opacity-70 mt-1 mb-2 whitespace-pre-wrap border-l-2 border-base-300 pl-2">
                                        {t.details}
                                    </p>
                                )}

                                {t.propertyName && (
                                    <div className="badge badge-ghost badge-xs mt-1 gap-1">
                                        <Building size={8} /> {t.propertyName}
                                    </div>
                                )}
                            </div>
                            <button className="btn btn-ghost btn-xs text-base-content/30 hover:text-error" onClick={() => handleDelete(t.id)}>
                                <Trash2 size={14}/>
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-base-content/5">
                            {status !== 'Open' ? (
                                <button className="btn btn-xs btn-circle btn-ghost" onClick={() => updateStatus(t, -1)} title="Move Back">
                                    <ArrowLeft size={14}/>
                                </button>
                            ) : <div></div>}
                            
                            {status !== 'Completed' ? (
                                <button className="btn btn-xs btn-circle btn-ghost text-primary" onClick={() => updateStatus(t, 1)} title="Move Forward">
                                    <ArrowRight size={14}/>
                                </button>
                            ) : <CheckCircle size={16} className="text-success opacity-50"/>}
                        </div>
                    </div>
                ))}
                {tasks.filter(t => t.status === status).length === 0 && (
                    <div className="text-center py-10 opacity-30 text-xs italic">No tasks</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <h2 className="text-3xl font-bold">Task Board</h2>
                 <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    <PlusCircle size={20}/> Add New Task
                 </button>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
                <Column title="Open" status="Open" color="text-error" borderColor="border-error" />
                <Column title="In Progress" status="In Progress" color="text-warning" borderColor="border-warning" />
                <Column title="Completed" status="Completed" color="text-success" borderColor="border-success" />
            </div>

            {/* --- ADD TASK MODAL --- */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Task">
                <div className="space-y-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text font-bold">Task Title</span></label>
                        <input 
                            className="input input-bordered w-full font-bold" 
                            placeholder="e.g. Fix Leaking Tap" 
                            value={form.description} 
                            onChange={e => setForm({...form, description: e.target.value})} 
                        />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text flex items-center gap-2"><AlignLeft size={16}/> Description / Notes</span></label>
                        <textarea 
                            className="textarea textarea-bordered h-24" 
                            placeholder="Add details (e.g., The tap is in the kitchen, needs a 15mm washer...)" 
                            value={form.details} 
                            onChange={e => setForm({...form, details: e.target.value})} 
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Property</span></label>
                            <select 
                                className="select select-bordered w-full" 
                                value={form.propertyId} 
                                onChange={e => setForm({...form, propertyId: e.target.value})}
                            >
                                <option value="">General Task</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Status</span></label>
                            <select 
                                className="select select-bordered w-full" 
                                value={form.status} 
                                onChange={e => setForm({...form, status: e.target.value})}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAddTask}>Save Task</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default KanbanTaskManager;
import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Building, PlusCircle, Edit } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { Modal } from '../components/Shared';

const PropertyManager = () => {
    const { db, userId, __app_id, showToast, generateRentRecordsForUnit } = useContext(AppContext);
    const [props, setProps] = useState([]);
    const [modal, setModal] = useState({ open: false, type: '', parent: null, data: null });
    const [form, setForm] = useState({});

    useEffect(() => {
        const u = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/properties`), s => {
            const list = s.docs.map(d => ({ id: d.id, ...d.data(), units: [] }));
            setProps(list);
            list.forEach(p => onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/properties/${p.id}/units`), us => setProps(prev => prev.map(cur => cur.id===p.id ? {...cur, units: us.docs.map(u=>({id: u.id, ...u.data()}))} : cur))));
        });
        return () => u();
    }, [db, userId, __app_id]);

    const handleSave = async () => {
        try {
            if (modal.type === 'property') {
                const ref = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
                if (modal.data) await updateDoc(doc(ref, modal.data.id), form); else await addDoc(ref, form);
            } else {
                const ref = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${modal.parent.id}/units`);
                let uid = modal.data?.id;
                if (uid) await updateDoc(doc(ref, uid), form); else { const res = await addDoc(ref, form); uid = res.id; }
                await generateRentRecordsForUnit({ id: uid, ...form }, modal.parent);
            }
            showToast('Saved!', 'success'); setModal({ open: false });
        } catch (e) { showToast(e.message, 'error'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-bold">Properties</h2><button className="btn btn-primary" onClick={()=>{setForm({}); setModal({open:true, type:'property'});}}><PlusCircle/> Add</button></div>
            <div className="grid grid-cols-1 gap-6">
                {props.map(p => (
                    <div key={p.id} className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-5">
                            <div className="flex justify-between items-start">
                                <div><h3 className="card-title"><Building className="text-primary"/> {p.name}</h3><p className="text-sm opacity-60">{p.address}</p></div>
                                <div className="flex gap-2"><button className="btn btn-sm btn-ghost" onClick={()=>{setForm(p); setModal({open:true, type:'property', data:p});}}><Edit size={16}/></button></div>
                            </div>
                            <div className="overflow-x-auto mt-4"><table className="table table-sm"><thead><tr className="bg-base-200/50"><th>Unit</th><th>Tenant</th><th>Rent</th><th>Actions</th></tr></thead><tbody>
                                {p.units.map(u => <tr key={u.id}><td className="font-bold">{u.number}</td><td>{u.tenantName}</td><td>{formatCurrency(u.rentAmount)}</td><td><button className="btn btn-xs btn-ghost text-primary" onClick={()=>{setForm(u); setModal({open:true, type:'unit', parent:p, data:u});}}><Edit size={12}/></button></td></tr>)}
                            </tbody></table></div>
                            {p.units.length===0 && <div className="text-center py-2 opacity-50 text-sm">No units.</div>}
                            <button className="btn btn-sm btn-outline border-dashed mt-2" onClick={()=>{setForm({}); setModal({open:true, type:'unit', parent:p});}}><PlusCircle size={16}/> Add Unit</button>
                        </div>
                    </div>
                ))}
            </div>
            <Modal isOpen={modal.open} onClose={()=>setModal({open:false})} title={modal.type==='property'?'Property':'Unit'}>
                <div className="flex flex-col gap-4">
                    {modal.type === 'property' ? <><input className="input input-bordered" placeholder="Name" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/><input className="input input-bordered" placeholder="Address" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></>
                    : <><div className="grid grid-cols-2 gap-4"><input className="input input-bordered" placeholder="Unit #" value={form.number||''} onChange={e=>setForm({...form,number:e.target.value})}/><input type="number" className="input input-bordered" placeholder="Rent" value={form.rentAmount||''} onChange={e=>setForm({...form,rentAmount:e.target.value})}/></div><input className="input input-bordered" placeholder="Tenant" value={form.tenantName||''} onChange={e=>setForm({...form,tenantName:e.target.value})}/><input type="date" className="input input-bordered" value={form.moveInDate||''} onChange={e=>setForm({...form,moveInDate:e.target.value})}/></>}
                    <button className="btn btn-primary" onClick={handleSave}>Save</button>
                </div>
            </Modal>
        </div>
    );
};
export default PropertyManager;
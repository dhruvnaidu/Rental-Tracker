import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, addDoc, updateDoc, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Building, PlusCircle, Edit, Trash2, User, Phone, Mail, Calendar, TrendingUp } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';
import { Modal } from '../components/Shared';

const PropertyManager = () => {
    const { db, userId, __app_id, showToast, generateRentRecordsForUnit } = useContext(AppContext);
    const [props, setProps] = useState([]);
    const [modal, setModal] = useState({ open: false, type: '', parent: null, data: null });
    const [form, setForm] = useState({});

    useEffect(() => {
        let unsubscribes = [];

        const unsubProps = onSnapshot(collection(db, `artifacts/${__app_id}/users/${userId}/properties`), s => {
            // Clean up old unit listeners
            unsubscribes.forEach(unsub => unsub());
            unsubscribes = [];

            const list = s.docs.map(d => ({ id: d.id, ...d.data(), units: [] }));
            setProps(list);

            // Subscribe to each property's units
            list.forEach(p => {
                const unsubUnits = onSnapshot(
                    collection(db, `artifacts/${__app_id}/users/${userId}/properties/${p.id}/units`),
                    us => setProps(prev => prev.map(cur =>
                        cur.id === p.id
                            ? { ...cur, units: us.docs.map(u => ({ id: u.id, ...u.data() })) }
                            : cur
                    ))
                );
                unsubscribes.push(unsubUnits);
            });
        });

        return () => {
            unsubProps();
            unsubscribes.forEach(unsub => unsub());
        };
    }, [db, userId, __app_id]);

    const handleSave = async () => {
        try {
            if (modal.type === 'unit' && (!form.number || !form.rentAmount)) {
                return showToast('Unit Number and Rent Amount are required.', 'error');
            }
            if (modal.type === 'property' && !form.name) {
                return showToast('Property Name is required.', 'error');
            }

            if (modal.type === 'property') {
                const ref = collection(db, `artifacts/${__app_id}/users/${userId}/properties`);
                if (modal.data) await updateDoc(doc(ref, modal.data.id), form);
                else await addDoc(ref, form);
            } else {
                const ref = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${modal.parent.id}/units`);
                
                const unitPayload = {
                    number: form.number,
                    rentAmount: parseFloat(form.rentAmount),
                    tenantName: form.tenantName || '',
                    tenantPhone: form.tenantPhone || '',
                    tenantEmail: form.tenantEmail || '',
                    moveInDate: form.moveInDate || '',
                    rentIncrementAmount: parseFloat(form.rentIncrementAmount || 0),
                    rentIncrementDate: form.rentIncrementDate || '',
                };

                let uid = modal.data?.id;
                if (uid) {
                    await updateDoc(doc(ref, uid), unitPayload);
                } else {
                    const res = await addDoc(ref, unitPayload);
                    uid = res.id;
                }
                
                if (form.moveInDate) {
                    await generateRentRecordsForUnit({ id: uid, ...unitPayload }, modal.parent);
                }
            }
            
            showToast('Saved successfully!', 'success');
            setModal({ open: false, type: '', parent: null, data: null });
            setForm({});
        } catch (e) { 
            showToast(e.message, 'error'); 
        }
    };

    // --- CLEANUP FUNCTIONS ---

    // 1. Delete Unit & Related Rent Records
    const handleDeleteUnit = async (unit, propertyId) => {
        if (!window.confirm(`Are you sure you want to delete Unit ${unit.number}? This will remove all associated rent history.`)) return;
        try {
            const batch = writeBatch(db);

            // Step 1: Find all rent records for this unit
            const rentRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
            const q = query(rentRef, where("unitId", "==", unit.id));
            const rentSnap = await getDocs(q);

            // Step 2: Delete them
            rentSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Step 3: Delete the unit itself
            const unitRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties/${propertyId}/units`, unit.id);
            batch.delete(unitRef);

            // Commit all changes at once
            await batch.commit();
            showToast('Unit and history deleted.', 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    // 2. Delete Property & ALL Related Data (Units, Rent, Expenses)
    const handleDeleteProperty = async (property) => {
        if (!window.confirm(`Are you sure you want to delete "${property.name}"? This will permanently remove all units, rent history, and expenses linked to it.`)) return;
        try {
            const batch = writeBatch(db);

            // A. Delete all Units
            const unitsRef = collection(db, `artifacts/${__app_id}/users/${userId}/properties/${property.id}/units`);
            const unitsSnap = await getDocs(unitsRef);
            unitsSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // B. Delete all Rent Records
            const rentRef = collection(db, `artifacts/${__app_id}/users/${userId}/rentRecords`);
            const rentQ = query(rentRef, where("propertyId", "==", property.id));
            const rentSnap = await getDocs(rentQ);
            rentSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // C. Delete all Expenses
            const expRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
            const expQ = query(expRef, where("propertyId", "==", property.id));
            const expSnap = await getDocs(expQ);
            expSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // D. Delete the Property itself
            const propRef = doc(db, `artifacts/${__app_id}/users/${userId}/properties`, property.id);
            batch.delete(propRef);

            await batch.commit();
            showToast('Property and all related data deleted.', 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    const openUnitModal = (parent, unit = null) => {
        setForm(unit || {});
        setModal({ open: true, type: 'unit', parent: parent, data: unit });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Property & Unit Manager</h2>
                <button className="btn btn-primary" onClick={() => { setForm({}); setModal({ open: true, type: 'property' }); }}>
                    <PlusCircle /> Add Property
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {props.map(p => (
                    <div key={p.id} className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="card-title text-xl"><Building className="text-primary" /> {p.name}</h3>
                                    <p className="text-sm opacity-60">{p.address}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-ghost" onClick={() => { setForm(p); setModal({ open: true, type: 'property', data: p }); }}>
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteProperty(p)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="divider my-2"></div>

                            <div className="overflow-x-auto">
                                <table className="table table-sm">
                                    <thead>
                                        <tr className="bg-base-200/50">
                                            <th>Unit</th>
                                            <th>Tenant</th>
                                            <th>Rent</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {p.units.map(u => (
                                            <tr key={u.id} className="hover:bg-base-200/50">
                                                <td className="font-bold">{u.number}</td>
                                                <td>{u.tenantName || <span className="opacity-40 italic">Vacant</span>}</td>
                                                <td>{formatCurrency(u.rentAmount)}</td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button className="btn btn-xs btn-ghost text-primary" onClick={() => openUnitModal(p, u)}>
                                                            <Edit size={12} />
                                                        </button>
                                                        <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDeleteUnit(u, p.id)}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {p.units.length === 0 && <div className="text-center py-6 opacity-50 text-sm italic">No units added yet.</div>}
                            
                            <button className="btn btn-sm btn-outline border-dashed w-full mt-4" onClick={() => openUnitModal(p)}>
                                <PlusCircle size={16} /> Add Unit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={modal.open} 
                onClose={() => setModal({ ...modal, open: false })} 
                title={modal.type === 'property' ? 'Add/Edit Property' : (modal.data ? `Edit Unit in ${modal.parent?.name}` : `Add New Unit to ${modal.parent?.name}`)}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    {modal.type === 'property' ? (
                        <>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Property Name</span></label>
                                <input className="input input-bordered" placeholder="e.g. Sunset Apartments" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Address</span></label>
                                <input className="input input-bordered" placeholder="123 Main St" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Unit Number *</span></label>
                                    <input className="input input-bordered" placeholder="e.g. 101" value={form.number || ''} onChange={e => setForm({ ...form, number: e.target.value })} />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Monthly Rent *</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 opacity-50">₹</span>
                                        <input type="number" className="input input-bordered pl-8 w-full" placeholder="0.00" value={form.rentAmount || ''} onChange={e => setForm({ ...form, rentAmount: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="divider text-xs font-bold uppercase opacity-50 my-0">Tenant Contact & Lease Info</div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold flex items-center gap-2"><User size={16}/> Tenant Name</span></label>
                                <input className="input input-bordered" placeholder="Full Name" value={form.tenantName || ''} onChange={e => setForm({ ...form, tenantName: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text flex items-center gap-2"><Phone size={14}/> Phone</span></label>
                                    <input className="input input-bordered" placeholder="+91..." value={form.tenantPhone || ''} onChange={e => setForm({ ...form, tenantPhone: e.target.value })} />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text flex items-center gap-2"><Mail size={14}/> Email</span></label>
                                    <input className="input input-bordered" placeholder="email@example.com" value={form.tenantEmail || ''} onChange={e => setForm({ ...form, tenantEmail: e.target.value })} />
                                </div>
                            </div>
                            
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold flex items-center gap-2"><Calendar size={16}/> Move-In Date</span></label>
                                <input type="date" className="input input-bordered" value={form.moveInDate || ''} onChange={e => setForm({ ...form, moveInDate: e.target.value })} />
                            </div>

                            <div className="divider text-xs font-bold uppercase opacity-50 my-0">Rent Increment (Optional)</div>

                            <div className="bg-base-200 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text text-xs font-bold flex items-center gap-1"><TrendingUp size={12}/> Increase Amount</span></label>
                                    <input type="number" className="input input-bordered input-sm" placeholder="0.00" value={form.rentIncrementAmount || ''} onChange={e => setForm({ ...form, rentIncrementAmount: e.target.value })} />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text text-xs font-bold">Effective Date</span></label>
                                    <input type="date" className="input input-bordered input-sm" value={form.rentIncrementDate || ''} onChange={e => setForm({ ...form, rentIncrementDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-action flex justify-end mt-6 gap-2">
                        <button className="btn btn-ghost" onClick={() => setModal({ ...modal, open: false })}>Cancel</button>
                        <button className="btn btn-primary px-8" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PropertyManager;
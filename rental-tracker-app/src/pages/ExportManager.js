import React, { useContext } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Download } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const ExportManager = () => {
    const { db, userId, __app_id } = useContext(AppContext);
    const download = async (col) => { const s = await getDocs(collection(db, `artifacts/${__app_id}/users/${userId}/${col}`)); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(s.docs.map(x=>x.data()), null, 2)],{type:'application/json'})); a.download = `${col}.json`; a.click(); };
    return (<div className="space-y-6"><h2 className="text-3xl font-bold">Export</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{['rentRecords','expenses','properties'].map(k => <button key={k} onClick={()=>download(k)} className="btn btn-outline h-auto py-6 flex flex-col capitalize"><Download size={24}/> {k}</button>)}</div></div>);
};
export default ExportManager;
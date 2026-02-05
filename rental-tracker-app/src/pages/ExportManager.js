import React, { useContext } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const ExportManager = () => {
    const { db, userId, __app_id } = useContext(AppContext);

    // Helper: Convert Array of Objects to CSV String
    const convertToCSV = (objArray) => {
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        if (array.length === 0) return '';
        
        const header = Object.keys(array[0]).join(',') + '\n';
        const rows = array.map(obj => {
            return Object.values(obj).map(val => {
                // Escape commas and quotes within data
                const stringVal = String(val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            }).join(',');
        }).join('\n');

        return header + rows;
    };

    const download = async (col, format) => {
        const s = await getDocs(collection(db, `artifacts/${__app_id}/users/${userId}/${col}`));
        const data = s.docs.map(x => x.data());
        
        let blob, filename;
        if (format === 'json') {
            blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            filename = `${col}.json`;
        } else {
            const csv = convertToCSV(data);
            blob = new Blob([csv], { type: 'text/csv' });
            filename = `${col}.csv`;
        }

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Data Export</h2>
            <p className="opacity-60">Download your data for tax season or backups.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['rentRecords', 'expenses', 'properties'].map(k => (
                    <div key={k} className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body">
                            <h3 className="card-title capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</h3>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => download(k, 'csv')} className="btn btn-outline btn-success flex-1">
                                    <FileSpreadsheet size={18}/> CSV
                                </button>
                                <button onClick={() => download(k, 'json')} className="btn btn-outline flex-1">
                                    <FileJson size={18}/> JSON
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default ExportManager;
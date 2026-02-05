import React, { useContext, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { User, Save, ShieldAlert } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Settings = () => {
    const { auth, showToast } = useContext(AppContext);
    const [name, setName] = useState(auth.currentUser?.displayName || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateProfile(auth.currentUser, { displayName: name });
            showToast('Profile updated successfully', 'success');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Account Settings</h2>

            {/* Profile Section */}
            <div className="card bg-base-100 shadow border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-lg flex items-center gap-2"><User size={20}/> Profile</h3>
                    <div className="divider my-0"></div>
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text">Display Name</span></label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    <div className="form-control w-full mt-2">
                        <label className="label"><span className="label-text">Email (Read-only)</span></label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full" 
                            value={auth.currentUser?.email} 
                            disabled 
                        />
                    </div>
                    <div className="card-actions justify-end mt-4">
                        <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
                            {loading ? <span className="loading loading-spinner"/> : <Save size={18}/>} Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card bg-base-100 shadow border border-error/20">
                <div className="card-body">
                    <h3 className="card-title text-lg text-error flex items-center gap-2"><ShieldAlert size={20}/> Danger Zone</h3>
                    <div className="divider my-0"></div>
                    <p className="text-sm opacity-70">Once you delete your account or reset data, there is no going back. Please be certain.</p>
                    <div className="card-actions justify-end mt-4">
                        <button className="btn btn-outline btn-error btn-sm" onClick={() => alert("This feature requires re-authentication logic (Firebase security).")}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Settings;
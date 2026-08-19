import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance 

const NBEStagingModule = () => {
    const [stagingList, setStagingList] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null, name: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [selectedIds, setSelectedIds] = useState([]); // Track checked boxes
    const currentUser = localStorage.getItem('userName');

    const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
};

const toggleAll = () => {
    if (selectedIds.length === stagingList.length) {
        setSelectedIds([]);
    } else {
        setSelectedIds(stagingList.map(sh => sh.id));
    }
};

    useEffect(() => { fetchStaging(); }, []);

    const fetchStaging = () => {
        API.get('/api/shareholders/nbe-staging')
             .then(res => setStagingList(res.data))
             .catch(err => console.log(err));
    };

const handleNBEApprove = async () => {
    setIsSubmitting(true);
    try {
        const isBulk = confirmModal.id === 'BULK';
        const url = isBulk 
            ? `${API.defaults.baseURL}/api/shareholders/nbe-bulk-finalize` 
            : `${API.defaults.baseURL}/api/shareholders/${confirmModal.id}/nbe-finalize`;
        
        const payload = isBulk 
            ? { ids: selectedIds, performed_by: currentUser } 
            : { performed_by: currentUser };

        await API({ method: isBulk ? 'post' : 'put', url, data: payload });

        setToast({ show: true, message: isBulk ? `Batch promotion successful!` : `${confirmModal.name} promoted.` });
        setConfirmModal({ show: false, id: null, name: '' });
        setSelectedIds([]); // Clear selection
        fetchStaging();
    } catch (err) {
        alert("Action failed. Check console for details.");
    } finally {
        setIsSubmitting(false);
    }
};

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            {/* 1. SUCCESS TOAST */}
            {toast.show && (
                <div className="fixed bottom-10 right-10 z-[300] bg-[#1a3b70] text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 animate-in slide-in-from-right-5">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center"><CheckCircle size={20}/></div>
                    <div><p className="text-[10px] font-black uppercase text-yellow-400">Registry Updated</p><p className="text-xs font-bold">{toast.message}</p></div>
                </div>
            )}

            {/* 2. HEADER */}
            <div className="bg-white p-8 rounded-[2.5rem] border-l-8 border-orange-500 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-[#1a3b70] uppercase">NBE Staging Registry</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Subscriptions awaiting regulatory clearance</p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
                    <Clock className="text-orange-500" size={18} />
                    <span className="text-[10px] font-black text-orange-600 uppercase">Held in Escrow</span>
                </div>
            </div>

{/* 1. BULK ACTION BAR (Visible only when items selected) */}
{selectedIds.length > 0 && (
    <div className="bg-[#1a3b70] p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-4 mb-6 shadow-2xl">
        <div className="flex items-center gap-4 ml-4">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-black text-[#1a3b70] text-xs">
                {selectedIds.length}
            </div>
            <p className="text-white text-xs font-bold uppercase tracking-widest">Members Selected for Promotion</p>
        </div>
        <button 
            onClick={() => setConfirmModal({ show: true, id: 'BULK', name: `${selectedIds.length} Shareholders` })}
            className="bg-emerald-500 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-emerald-600 transition-all"
        >
            <ShieldCheck size={16} /> Finalize Batch Promotion
        </button>
    </div>
)}

{/* 2. TABLE WITH CHECKBOXES */}
<div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
    <table className="w-full text-left">
        <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b">
            <tr>
                <th className="px-8 py-5 w-10">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.length === stagingList.length && stagingList.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded accent-[#1a3b70]" 
                    />
                </th>
                <th className="px-8 py-5">Subscriber</th>
                <th className="px-8 py-5 text-right">Investment (ETB)</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right px-12">Actions</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {stagingList.map(sh => (
                <tr key={sh.id} className={`${selectedIds.includes(sh.id) ? 'bg-blue-50/50' : ''} hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-600`}>
                    <td className="px-8 py-4">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.includes(sh.id)}
                            onChange={() => toggleSelect(sh.id)}
                            className="w-4 h-4 rounded accent-[#1a3b70]"
                        />
                    </td>
                    <td className="px-8 py-4">
                        <p className="text-slate-800 font-black">{sh.full_name}</p>
                        <p className="text-[9px] text-slate-400 uppercase">{sh.shareholder_id}</p>
                    </td>
                    <td className="px-8 py-4 text-right font-black">
                        {Number(sh.paidup_birr).toLocaleString()}
                    </td>
                    <td className="px-8 py-4 text-center">
                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-orange-100">Post-Cutoff</span>
                    </td>
                    <td className="px-8 py-4 text-right px-12">
                        <button 
                            onClick={() => setConfirmModal({ show: true, id: sh.id, name: sh.full_name })}
                            className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-[#1a3b70] hover:text-white transition-all"
                        >
                            <ShieldCheck size={16} />
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>

            {/* 4. PROFESSIONAL CONFIRMATION MODAL */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[400] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 text-center relative">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} className="text-orange-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Regulatory Clearance</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium mb-8">
                            Are you sure you want to promote <b>{confirmModal.name}</b>? This will officially include their capital in the bank's paid-up registry.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setConfirmModal({ show: false, id: null, name: '' })}
                                className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleNBEApprove}
                                disabled={isSubmitting}
                                className="flex-1 bg-[#1a3b70] text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16} />}
                                Confirm Promotion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NBEStagingModule;
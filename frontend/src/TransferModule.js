import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, Search, User, X, Plus, Loader2, CheckCircle, 
  History, ShieldAlert, FileText, ExternalLink, MoreHorizontal, Edit, Landmark, FileSpreadsheet, 
  Printer, ShieldCheck, Users, BarChart3, PieChart, XCircle, Percent, ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance


// --- HELPER: TOAST NOTIFICATION ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 bg-[#1a3b70] text-white p-5 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
        <CheckCircle size={20} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Registry Alert</p>
        <p className="text-xs font-bold mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-30 hover:opacity-100"><X size={16} /></button>
    </div>
  );
};

// --- HELPER: LIVE SEARCH COMPONENT ---
const ShareholderSearch = ({ label, onSelect, excludeId }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);


    useEffect(() => {
        if (query.length < 2) return setResults([]);
        setSearching(true);
        const timer = setTimeout(() => {
            API.get(`/api/shareholders/search?q=${query}`)
                .then(res => {
                    setResults(res.data.filter(s => s.id !== excludeId));
                    setSearching(false);
                });
        }, 300);
        return () => clearTimeout(timer);
    }, [query, excludeId]);

    if (selected) return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">{label}</label>
            <div className="w-full bg-[#1a3b70] text-white p-4 rounded-2xl flex justify-between items-center shadow-lg animate-in zoom-in-95">
                <div>
                    <p className="text-xs font-black">{selected.full_name}</p>
                    <p className="text-[9px] text-blue-300 uppercase font-bold">{selected.shareholder_id} • {selected.no_of_share} Shares</p>
                </div>
                <button type="button" onClick={() => { setSelected(null); onSelect(null); setQuery(''); }} className="p-1 hover:bg-white/10 rounded-lg"><X size={14}/></button>
            </div>
        </div>
    );

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-300" size={16} />
                <input 
                    type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search Name or ID..."
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 pl-12 text-xs font-bold outline-none focus:border-[#1a3b70]"
                />
                {searching && <Loader2 className="absolute right-4 top-4 animate-spin text-blue-500" size={16} />}
            </div>
            {results.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    {results.map(s => (
                       <div key={s.id} onClick={() => { setSelected(s); onSelect(s); }} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50">
    <div>
        <p className="text-xs font-black text-slate-700">{s.full_name}</p>
        <p className="text-[9px] text-slate-400 uppercase">{s.shareholder_id}</p>
    </div>
    <div className="text-right">
        {/* Requirement 2.4.4.1 Visibility */}
        <p className="text-[10px] font-black text-[#1a3b70]">{(s.no_of_share - (s.pledged_shares || 0))} Available</p>
        {s.is_frozen === 1 && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-black">FROZEN</span>}
    </div>
</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TransferModule = ({ globalSearch, setGlobalSearch }) => {
    const [transfers, setTransfers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
const [formData, setFormData] = useState({ 
    type: 'TRANSFER', 
    transferor_id: '', 
    transferee_id: '', 
    shares_count: '', 
    price: 1000, // Default price per share
    share_class_id: 1, // Default to Ordinary
    reason: 'Sale' ,
    service_fee: 0,
    effective_date: new Date().toISOString().split('T')[0] // Default to today
});
    const [isNewTransferee, setIsNewTransferee] = useState(false);
const [newPersonData, setNewTransfereeData] = useState({
    type: 'Individual', // Default
    full_name: '', 
    phone: '', 
    email: '', 
    id_number: '', 
    gender: 'Male', 
    dob: '', 
    nationality: 'Ethiopian',
    business_reg_no: '', // New
    contact_person: ''   // New
});

    const currentUser = localStorage.getItem('userName') || 'Admin';
    
const [isEditing, setIsEditing] = useState(false);
const [editId, setEditId] = useState(null);
const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectReason, setRejectReason] = useState('');
const [rejectTarget, setRejectTarget] = useState(null); 
const [deedFile, setDeedFile] = useState(null);
const [idFile, setIdFile] = useState(null);
const [instrumentFile, setInstrumentFile] = useState(null);
const [currentBankParValue, setCurrentBankParValue] = useState(1000); 
const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
const [currentPage, setCurrentPage] = useState(1);
const limit = 10;
// --- ADD THIS AT THE TOP OF TransferModule ---
const userRole = localStorage.getItem('userRole');
const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');

// THE SECURITY GATEKEEPER
const can = (permissionKey) => {
    if (userRole === 'Admin') return true; // Admin bypass
    return userPermissions.includes(permissionKey);
};

// Fetch transfers + current par value when the page loads
useEffect(() => { 
    fetchTransfers(); 
    
    API.get('/api/capital/classes')
      .then(res => {
          if (res.data && res.data.length > 0) {
              // This sets the 5,000 ETB (or whatever is in your DB)
              setCurrentBankParValue(Number(res.data[0].par_value));
          }
      })
      .catch(err => console.error("Error fetching par value:", err));
}, []);

const fetchTransfers = () => {
    // Send globalSearch and currentPage to backend
    API.get(`/api/transfers?page=${currentPage}&limit=${limit}&search=${globalSearch}`)
      .then(res => {
          setTransfers(res.data.data || []);
          setPagination(res.data.pagination);
      })
      .catch(err => console.log(err));
};

useEffect(() => { fetchTransfers(); }, [currentPage, globalSearch]);
const showNotification = (msg, type = 'success') => setToast({ show: true, message: msg, type });
const handleInitiate = async (e) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!formData.transferor_id) return showNotification("Please select a Sender", "error");
    if (!isNewTransferee && !formData.transferee_id) return showNotification("Please select a Receiver", "error");
    if (!deedFile) return showNotification("Mandatory Document Missing: Transfer Deed is required.", "error");

    setIsSubmitting(true);
    const data = new FormData();

    // 2. Append standard text fields (Type, Shares, Price, Reason, etc.)
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('performed_by', currentUser);
    
    // 3. Handle Receiver Type logic
    if (isNewTransferee) {
        data.append('transferee_type', 'NEW');
        data.append('new_transferee_data', JSON.stringify(newPersonData));
    } else {
        data.append('transferee_type', 'EXISTING');
    }

    // 4. ALWAYS append files (Requirement 2.4.3) - MOVED OUTSIDE THE IF
    if (deedFile) data.append('transfer_deed', deedFile);
    if (idFile) data.append('id_doc', idFile);
    if (instrumentFile) data.append('legal_instrument', instrumentFile);

    try {
        await API.post('/api/transfers', data, {
            headers: { 'Content-Type': 'multipart/form-data' } // Ensure headers are correct for files
        });
        showNotification("Movement request submitted successfully!");
        setShowModal(false);
        setIsNewTransferee(false);
        // Clear files for next time
        setDeedFile(null);
        setIdFile(null);
        setInstrumentFile(null);
        fetchTransfers();
    } catch (err) { 
        showNotification(err.response?.data?.message || "Transfer Failed", "error"); 
    } finally { 
        setIsSubmitting(false); 
    }
};

const handleApprove = async (id) => {
    try {
        const res = await API.put(`/api/transfers/${id}/approve`, { 
            performed_by: currentUser 
        });
        
        if (res.data.success) {
            showNotification("Movement Approved Successfully!");
            fetchTransfers(); // Refresh the list
        }
    } catch (err) {
        const errMsg = err.response?.data?.message || "Approval failed";
        showNotification(errMsg, "error");
    }
};

    const handleEditClick = (t) => {
    setFormData({ 
        type: t.transfer_type, 
        transferor_id: t.transferor_id, 
        transferee_id: t.transferee_id, 
        shares_count: t.shares_count, 
        reason: t.reason 
    });
    setEditId(t.id);
    setIsEditing(true);
    setShowModal(true);
};

const handleCancel = async (id) => {
    if (window.confirm("Cancel this pending request?")) {
        await API.put(`/api/transfers/${id}/cancel`);
        showNotification("Movement Cancelled");
        fetchTransfers();
    }
};

const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return showNotification("Please enter a reason", "error");
    
    try {
        await API.put(`/api/transfers/${rejectTarget.id}/reject`, { 
            reason: rejectReason, 
            performed_by: currentUser 
        });
        showNotification("Movement Rejected", "error");
        setShowRejectModal(false);
        setRejectTarget(null); // Clear the target
        setRejectReason('');
        fetchTransfers();
    } catch (err) {
        showNotification("Action failed", "error");
    }
};

    return (
        <div className="space-y-8 animate-in fade-in pb-20 relative">
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />}

            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                   <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter">Share Transfers</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Movement Ledger</p>
                </div>
                {/* --- WRAP THIS BUTTON IN can('trans_initiate') --- */}
{can('trans_initiate') && (
   <button 
      onClick={() => { setIsEditing(false); setShowModal(true); }} 
      className="bg-[#1a3b70] text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl"
   >
      <ArrowRightLeft size={18} /> INITIATE NEW MOVEMENT
   </button>
)}
            </div>

            {/* LIST TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-8 py-6">Type</th>
                            <th className="px-8 py-6">Sender</th>
                            <th className="px-8 py-6">Receiver</th>
                            <th className="px-8 py-6 text-center">Shares</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6">Effective Date</th>
                            <th className="px-8 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transfers.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-8 py-5">
                                   <span className={`px-2 py-1 rounded font-black text-[9px] ${t.transfer_type === 'TRANSFER' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                      {t.transfer_type}
                                   </span>
                                </td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-700">{t.transferor_name}</td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-700">
                                   {t.transferee_type === 'NEW' ? (
                                       <div className="flex flex-col">
                                          <span className="text-blue-500 italic text-[9px] font-black uppercase">New Member</span>
                                          <span>{JSON.parse(t.new_transferee_data).full_name}</span>
                                       </div>
                                   ) : t.transferee_name}
                                </td>
                                <td className="px-8 py-5 text-xs font-black text-[#1a3b70] text-center">{t.shares_count.toLocaleString()}</td>
                                <td className="px-8 py-5">
                                   <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase ${t.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                      {t.status}
                                   </span>
                                </td>
<td className="px-8 py-5 text-right flex justify-end gap-3 items-center">
   
   {/* 1. DOCUMENT VIEWING (Requirement: sh_profile or trans_docs) */}
   <div className="flex gap-1 items-center mr-4">
      {t.transfer_deed_path && (
         <a href={`/documents/${t.transfer_deed_path}`} target="_blank" rel="noreferrer" title="View Deed" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
            <FileText size={14}/>
         </a>
      )}
      {t.id_doc_path && (
         <a href={`/documents/${t.id_doc_path}`} target="_blank" rel="noreferrer" title="View ID" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
            <User size={14}/>
         </a>
      )}
   </div>

   {/* 2. CHECKER ACTIONS (Requirement: trans_approve) */}
   {t.status === 'Pending' && can('trans_approve') && (
      <div className="flex gap-2 mr-2">
         <button 
            onClick={() => handleApprove(t.id)} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
         >
            Approve
         </button>
         <button 
            onClick={() => { setRejectTarget(t); setShowRejectModal(true); }} 
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
         >
            Reject
         </button>
      </div>
   )}

   {/* 3. MAKER ACTIONS (Requirement: trans_initiate) */}
   {t.status === 'Pending' && can('trans_initiate') && (
      <div className="flex gap-2">
         <button 
            onClick={() => handleEditClick(t)} 
            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
            title="Edit Movement"
         >
            <Edit size={14}/>
         </button>
         <button 
            onClick={() => handleCancel(t.id)} 
            className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
            title="Cancel Request"
         >
            <X size={14}/>
         </button>
      </div>
   )}
</td>

<td className="px-8 py-5 text-xs font-bold text-slate-500">
    {new Date(t.effective_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
</td>

                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* --- ADD THIS PAGINATION FOOTER --- */}
<div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-12">
  <div className="flex flex-col">
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
        Showing <span className="text-[#1a3b70]">{(currentPage - 1) * limit + 1}</span> to <span className="text-[#1a3b70]">{Math.min(currentPage * limit, pagination.totalRecords)}</span>
     </p>
     <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Movement Ledger: {pagination.totalRecords} Records</p>
  </div>

  <div className="flex items-center gap-3">
    <button 
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className="p-2.5 bg-white border-2 border-slate-100 rounded-xl text-slate-400 disabled:opacity-30 hover:border-yellow-400 hover:text-yellow-600 transition-all shadow-sm"
    >
      <ChevronLeft size={18} />
    </button>

    <div className="flex gap-1.5">
       {[...Array(pagination.totalPages)].map((_, i) => (
         <button
           key={i + 1}
           onClick={() => setCurrentPage(i + 1)}
           className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-[#1a3b70] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
         >
           {i + 1}
         </button>
       )).slice(0, 5)} {/* Shows only first 5 pages to keep it clean */}
    </div>

    <button 
      disabled={currentPage === pagination.totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className="p-2.5 bg-white border-2 border-slate-100 rounded-xl text-slate-400 disabled:opacity-30 hover:border-yellow-400 hover:text-yellow-600 transition-all shadow-sm"
    >
      <ChevronRight size={18} />
    </button>
  </div>
</div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[130] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">New Share Movement</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-white rounded-xl shadow-sm hover:text-red-500 transition-all"><X /></button>
                        </div>
            <form onSubmit={handleInitiate} className="p-10 space-y-8 overflow-y-auto max-h-[75vh]">
                
                {/* 1. MOVEMENT TYPE & DATE (DUPLICATE REMOVED) */}
                <div className="grid grid-cols-2 gap-8">
                    <FormSelect 
                        label="Movement Type" 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})} 
                        options={['TRANSFER', 'TRANSMISSION']} 
                    />
                    <FormInput 
                        label="Legal Effective Date" 
                        type="date" 
                        value={formData.effective_date} 
                        onChange={e => setFormData({...formData, effective_date: e.target.value})} 
                        required 
                    />
                </div>


    <FormInput 
        label="Reason / Description" 
        placeholder="e.g. Inheritance from Father" 
        value={formData.reason} 
        onChange={e => setFormData({...formData, reason: e.target.value})} 
    />

{/* 2. SENDER & RECEIVER BOX */}
                            <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <ShareholderSearch label="Transferor (Sender)" onSelect={(s) => setFormData({...formData, transferor_id: s ? s.id : ''})} />
                                    
                                    <div className="space-y-2">
                                        {!isNewTransferee ? (
                                            <>
                                                <ShareholderSearch label="Transferee (Receiver)" excludeId={formData.transferor_id} onSelect={(s) => setFormData({...formData, transferee_id: s ? s.id : ''})} />
                                                <button type="button" onClick={() => setIsNewTransferee(true)} className="text-[10px] font-black text-blue-600 uppercase ml-2 hover:underline">+ Register New Person</button>
                                            </>
                                        ) : (
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-blue-200">
                                                <p className="text-xs font-black text-[#1a3b70]">REGISTERING NEW MEMBER</p>
                                                <button type="button" onClick={() => setIsNewTransferee(false)} className="text-[10px] font-bold text-slate-400 uppercase">Change</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* --- DYNAMIC NEW MEMBER FIELDS (Now inside the blue box) --- */}
                                {isNewTransferee && (
    <div className="space-y-6 animate-in slide-in-from-top-2">
        <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-blue-100">
            <label className="text-[10px] font-black text-blue-600 uppercase">Receiver Entity Type</label>
            <div className="flex gap-4">
                {['Individual', 'Institutional'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="new_type" 
                            checked={newPersonData.type === t} 
                            onChange={() => setNewTransfereeData({...newPersonData, type: t})}
                            className="accent-[#1a3b70]"
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{t}</span>
                    </label>
                ))}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <FormInput 
                label={newPersonData.type === 'Individual' ? "Full Name" : "Organization Name"} 
                value={newPersonData.full_name} 
                onChange={e => setNewTransfereeData({...newPersonData, full_name: e.target.value})} required 
            />
            <FormInput 
                label={newPersonData.type === 'Individual' ? "ID Number" : "Business Reg. Number"} 
                value={newPersonData.id_number} 
                onChange={e => setNewTransfereeData({...newPersonData, id_number: e.target.value})} required 
            />
        </div>

        {newPersonData.type === 'Individual' ? (
            <div className="grid grid-cols-2 gap-4">
                <FormSelect label="Gender" value={newPersonData.gender} options={['Male', 'Female']} onChange={e => setNewTransfereeData({...newPersonData, gender: e.target.value})} />
                <FormInput label="Date of Birth" type="date" value={newPersonData.dob} onChange={e => setNewTransfereeData({...newPersonData, dob: e.target.value})} />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Contact Person Name" value={newPersonData.contact_person} onChange={e => setNewTransfereeData({...newPersonData, contact_person: e.target.value})} />
                <FormInput label="Business License Info" value={newPersonData.business_reg_no} onChange={e => setNewTransfereeData({...newPersonData, business_reg_no: e.target.value})} />
            </div>
        )}

        <div className="grid grid-cols-3 gap-4">
            <FormInput label="Primary Phone" value={newPersonData.phone} onChange={e => setNewTransfereeData({...newPersonData, phone: e.target.value})} required />
            <FormInput label="Email" value={newPersonData.email} onChange={e => setNewTransfereeData({...newPersonData, email: e.target.value})} />
            <FormInput label="Nationality" value={newPersonData.nationality} onChange={e => setNewTransfereeData({...newPersonData, nationality: e.target.value})} />
        </div>
    </div>
)}

                            </div>

{/* 3. ECONOMICS SECTION (Requirement 2.4.1.2) */}
<div className="grid grid-cols-3 gap-8 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
    <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Landmark size={14}/> Share Movement Economics
    </div>
    
    <FormInput 
        label="Number of Shares" 
        name="shares_count"
        type="number" 
        value={formData.shares_count}
        onChange={e => setFormData({...formData, shares_count: e.target.value})}  
        required 
    />

    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Par Value (Fixed)</label>
        <div className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 text-xs font-black text-slate-400 shadow-inner">
            {currentBankParValue.toLocaleString()} ETB
        </div>
    </div>

    <FormInput 
        label="Agreed Market Price (Sale Price)" 
        name="price"
        type="number" 
        placeholder={currentBankParValue}
        value={formData.price} 
        onChange={e => setFormData({...formData, price: e.target.value})} 
    />

    {/* NEW: SERVICE FEE INPUT */}
    <FormInput 
        label="Bank Service Fee (ETB)" 
        name="service_fee"
        type="number" 
        placeholder="e.g. 500"
        value={formData.service_fee} 
        onChange={e => setFormData({...formData, service_fee: e.target.value})} 
    />

     <div className="col-span-3 p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex justify-between items-center shadow-inner">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                <Percent size={18} />
            </div>
            <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase">Total Transaction Value</p>
                <p className="text-[9px] text-emerald-500 font-medium">Market Price + Bank Service Fee</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-2xl font-black text-emerald-700">
                {( (Number(formData.shares_count) * Number(formData.price || currentBankParValue)) + Number(formData.service_fee || 0) ).toLocaleString()} ETB
            </p>
        </div>
    </div>
</div>

                            {/* --- MULTI-DOCUMENT UPLOAD SECTION (Section 2.4.3) --- */}
<div className="space-y-4 pt-4 border-t border-slate-100">
    <p className="text-[10px] font-black text-[#1a3b70] uppercase tracking-widest mb-4">Required Supporting Documents</p>
    <div className="grid grid-cols-3 gap-6">
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">1. Signed Transfer Deed*</label>
            <input type="file" onChange={(e) => setDeedFile(e.target.files[0])} className="text-[10px] w-full file:bg-[#1a3b70] file:text-white file:rounded-lg file:border-0 file:px-3 file:py-1" required />
        </div>
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">2. Receiver ID (New Members)</label>
            <input type="file" onChange={(e) => setIdFile(e.target.files[0])} className="text-[10px] w-full file:bg-[#1a3b70] file:text-white file:rounded-lg file:border-0 file:px-3 file:py-1" />
        </div>
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">3. Board Res. / Legal Inst.</label>
            <input type="file" onChange={(e) => setInstrumentFile(e.target.files[0])} className="text-[10px] w-full file:bg-[#1a3b70] file:text-white file:rounded-lg file:border-0 file:px-3 file:py-1" />
        </div>
    </div>
</div>

                            <div className="p-8 border-t bg-slate-50 flex justify-end gap-5 -mx-10 -mb-10">
                                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="bg-[#1a3b70] text-white px-12 py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <ArrowRightLeft size={16}/>}
                                    {isSubmitting ? 'Processing...' : 'Submit Movement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* --- REJECTION MODAL --- */}
{showRejectModal && rejectTarget && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter">Reject Movement</h3>
          <button onClick={() => setShowRejectModal(false)} className="text-slate-300 hover:text-red-500"><X /></button>
       </div>

       <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Target Transfer</p>
          <p className="text-xs font-bold text-slate-700">From: {rejectTarget.transferor_name}</p>
          <p className="text-xs font-bold text-slate-700">To: {rejectTarget.transferee_name || JSON.parse(rejectTarget.new_transferee_data).full_name}</p>
       </div>

       <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Rejection</label>
          <textarea 
             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold h-32 outline-none focus:border-red-400 transition-all"
             placeholder="Explain why this transfer is being denied..."
             value={rejectReason}
             onChange={(e) => setRejectReason(e.target.value)}
          ></textarea>
       </div>

       <div className="flex gap-4 mt-8">
          <button onClick={() => setShowRejectModal(false)} className="flex-1 px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
          <button 
             onClick={async () => {
                if(!rejectReason) return alert("Please provide a reason");
                try {
                   await API.put(`/api/transfers/${rejectTarget.id}/reject`, { 
                      reason: rejectReason, 
                      performed_by: currentUser 
                   });
                   showNotification("Movement Rejected Successfully", "error");
                   setShowRejectModal(false);
                   setRejectReason('');
                   fetchTransfers();
                } catch (err) { alert("Action failed"); }
             }}
             className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-red-200 active:scale-95 transition-all"
          >
             Confirm Reject
          </button>
       </div>
    </div>
  </div>
)}
        </div>
    );
};

// HELPERS
const FormInput = ({ label, type = "text", ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all" {...props} />
  </div>
);

const FormSelect = ({ label, options, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer" {...props}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default TransferModule;
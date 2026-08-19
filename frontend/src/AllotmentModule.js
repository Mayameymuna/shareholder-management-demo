import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Plus, Search, User, Landmark, Calculator, 
  CheckCircle, X, ShieldCheck, ArrowUpRight, Printer, Loader2, FileText, History
} from 'lucide-react';
import axios from 'axios';
import AllotmentAdviceTemplate from './AllotmentAdviceTemplate';
import API from './api'; // Use the centralized API instance

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);


  return (
    <div className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 bg-[#1a3b70] text-white p-5 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}><CheckCircle size={20}/></div>
      <div><p className="text-[10px] font-black uppercase text-yellow-400">Registry Alert</p><p className="text-xs font-bold">{message}</p></div>
      <button onClick={onClose} className="ml-4 opacity-30"><X size={16}/></button>
    </div>
  );
};

const AllotmentModule = () => {
  const [allotments, setAllotments] = useState([]);
  const [shareholders, setShareholders] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSH, setSelectedSH] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [shSearch, setShSearch] = useState(''); // Text in the search box
const [shResults, setShResults] = useState([]); // Results from server
const [isSearching, setIsSearching] = useState(false);
const [viewingAdvice, setViewingAdvice] = useState(null);
const [summary, setSummary] = useState({ total_authorized: 0, total_subscribed: 0 });

useEffect(() => {
    fetchData();

    API.get('/api/capital/summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error("Error fetching capital summary:", err));

    API.get('/api/capital/classes')
      .then(res => setClasses(res.data))
      .catch(err => console.error("Error fetching share classes:", err));
}, []);

  // Form State
const [formData, setFormData] = useState({ 
    shares: '', 
    sub_type: 'Initial', 
    class_id: 1, 
    bank: 'Rammis Bank', 
    ref: '', 
    date: new Date().toISOString().split('T')[0], 
    paid: '', 
    payment_status: 'Full' 
});

  const currentUser = localStorage.getItem('userName') || 'Admin';
  const userRole = localStorage.getItem('userRole') || 'Maker';

  const showNotification = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const [classes, setClasses] = useState([]);

useEffect(() => {
    if (shSearch.length < 2) {
        setShResults([]);
        return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
        API.get(`/api/shareholders/search-allotment?q=${shSearch}`)
            .then(res => {
                setShResults(res.data);
                setIsSearching(false);
            })
            .catch(() => setIsSearching(false));
    }, 400); // Wait 400ms after user stops typing to call DB

    return () => clearTimeout(delayDebounceFn);
}, [shSearch]);

// --- MASTER FEATURE: Auto-check for Initial vs Additional ---
useEffect(() => {
    if (selectedSH) {
        // If the selected person has 0 shares, it's 'Initial'. Otherwise 'Additional'.
        const type = Number(selectedSH.no_of_share) === 0 ? 'Initial' : 'Additional';
        
        setFormData(prev => ({ 
            ...prev, 
            sub_type: type 
        }));

        showNotification(`Profile synced: System detected an ${type} subscription request.`);
    }
}, [selectedSH]); 

  const fetchData = () => {
    API.get('/api/allotments')
      .then(res => setAllotments(res.data))
      .catch(err => console.error("Error loading allotments:", err));
  };

  const handleAllotSubmit = async (e) => {
    e.preventDefault();
    // 1. MASTER FEATURE: Fractional Lock (Section 2.7.2.4)
    if (Number(formData.shares) % 1 !== 0) {
        return showNotification("Invalid Quantity: Shares must be whole numbers (no decimals).", "error");
    }

    if (!selectedSH) return showNotification("Please select a shareholder", "error");
    
    setIsSubmitting(true);

        // 2. Get the correct price for the selected class
    const selectedClass = classes.find(c => c.id == formData.class_id);
    const currentPrice = selectedClass ? selectedClass.issue_price : 1000;
    const total_value = formData.shares * currentPrice;

    try {
        await API.post('/api/allotments', { 
            ...formData, 
            total_value, 
            sh_id: selectedSH.id, 
            user: currentUser 
        });
        showNotification("Allotment request initiated successfully!");
        setShowModal(false);
        // Reset local selection states
        setSelectedSH(null);
        setShSearch('');
        fetchData();
    } catch (err) { 
        showNotification(err.response?.data?.message || "Allotment failed", "error"); 
    } finally { setIsSubmitting(false); }
  };

  const handleApprove = async (id) => {
    try {
        await API.put(`/api/allotments/${id}/approve`, { performed_by: currentUser });
        showNotification("Allotment Approved and Registry Updated!");
        fetchData();
    } catch (err) { showNotification("Approval failed", "error"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 relative">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />}

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter uppercase italic">Share Allotment</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section 2.3 • Issuance Management</p>
         </div>
         <button onClick={() => setShowModal(true)} className="bg-yellow-400 hover:bg-yellow-500 text-[#1a3b70] px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> INITIATE NEW ALLOTMENT
         </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
           <thead className="bg-slate-50/50 border-b font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                 <th className="px-8 py-6">Ref Number</th>
                 <th className="px-8 py-6">Shareholder</th>
                 <th className="px-8 py-6">Shares</th>
                 <th className="px-8 py-6">Value (ETB)</th>
                 <th className="px-8 py-6">Status</th>
                 <th className="px-8 py-6 text-right px-12">Action</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
    {allotments.map(a => (
        <tr key={a.id} className="hover:bg-slate-50/30 transition-all text-xs font-bold text-slate-600">
            
            {/* 1. REF NUMBER & EFFECTIVE DATE (Requirement 3.5) */}
            <td className="px-8 py-5">
               <div className="flex flex-col">
                  <span className="text-[#1a3b70] font-black">{a.allotment_ref}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase italic">
                     {a.effective_date 
                        ? new Date(a.effective_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                        : 'Pending Approval'}
                  </span>
               </div>
            </td>

            {/* 2. SHAREHOLDER INFO */}
            <td className="px-8 py-5">
               <p>{a.full_name}</p>
               <p className="text-[9px] text-slate-400 uppercase font-medium">{a.sh_code}</p>
            </td>

            {/* 3. QUANTITY */}
            <td className="px-8 py-5">
                {Number(a.shares_allotted).toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">Units</span>
            </td>

            {/* 4. FINANCIAL VALUE */}
            <td className="px-8 py-5 font-black text-[#1a3b70]">
                {Number(a.total_value).toLocaleString()} <span className="text-[9px] font-normal">ETB</span>
            </td>

            {/* 5. STATUS BADGE */}
            <td className="px-8 py-5">
               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                   a.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                   'bg-amber-50 text-amber-600 border border-amber-100'
               }`}>
                  {a.status}
               </span>
            </td>

            {/* 6. ACTIONS HUB */}
            <td className="px-8 py-5 text-right px-12">
               <div className="flex justify-end gap-2">
                  
                  {/* Checker Authorization (Requirement 2.1) */}
                  {a.status === 'Pending Checker' && userRole !== 'Maker' && (
                     <button 
                        onClick={() => handleApprove(a.id)} 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
                     >
                        Authorize
                     </button>
                  )}

                  {/* Document Generation (Requirement 4.1 & 4.2) */}
                  <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100" title="Print Certificate">
                     <Printer size={14}/>
                  </button>

                  <button 
   onClick={() => setViewingAdvice(a)} // <--- UPDATED
   className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
   title="Print Allotment Advice"
>
   <FileText size={14}/>
</button>
               </div>
            </td>
        </tr>
    ))}

    {/* SHOW THIS IF TABLE IS EMPTY */}
    {allotments.length === 0 && (
        <tr>
            <td colSpan="6" className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">
                No allotment records found.
            </td>
        </tr>
    )}
</tbody>
        </table>
        {allotments.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No allotments recorded yet.</div>}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-lg"><Plus /></div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">New Share Allotment</h3>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-red-500 shadow-sm border transition-all"><X /></button>
              </div>

              <form onSubmit={handleAllotSubmit} className="flex-1 overflow-y-auto p-12 space-y-10">
                {/* 1. SEARCHABLE SHAREHOLDER SELECT */}
<div className="space-y-4 relative">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">1. Search Target Shareholder</label>
    
    {selectedSH ? (
        // SHOW SELECTED MEMBER CARD
        <div className="w-full bg-[#1a3b70] text-white p-5 rounded-[1.5rem] flex justify-between items-center shadow-xl animate-in zoom-in-95">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black">
                 {selectedSH.full_name.charAt(0)}
              </div>
              <div>
                 <p className="text-sm font-black tracking-tight">{selectedSH.full_name}</p>
                 <p className="text-[10px] text-blue-300 font-bold uppercase">{selectedSH.shareholder_id} • {selectedSH.phone}</p>
              </div>
           </div>
           <button 
             onClick={() => { setSelectedSH(null); setShSearch(''); }}
             className="p-2 hover:bg-white/10 rounded-xl transition-all"
           >
              <X size={18} />
           </button>
        </div>
    ) : (
        // SHOW SEARCH INPUT
        <div className="relative">
            <Search className="absolute left-4 top-4 text-slate-300" size={20} />
            <input 
                type="text"
                value={shSearch}
                onChange={(e) => setShSearch(e.target.value)}
                placeholder="Type Shareholder Name, ID, or Phone Number..."
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-4 pl-12 text-xs font-bold outline-none focus:border-yellow-400 transition-all"
            />
            {isSearching && <Loader2 className="absolute right-4 top-4 animate-spin text-blue-500" size={20} />}

            {/* FLOATING SEARCH RESULTS */}
            {shResults.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-[2rem] shadow-2xl border border-slate-100 z-[160] overflow-hidden">
                   <div className="p-3 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">Search Results</div>
                   {shResults.map(s => (
                       <div 
                         key={s.id} 
                         onClick={() => { setSelectedSH(s); setShResults([]); }}
                         className="p-4 hover:bg-yellow-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors"
                       >
                          <div>
                             <p className="text-xs font-black text-slate-700">{s.full_name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">{s.shareholder_id}</p>
                          </div>
                          <p className="text-[10px] font-black text-[#1a3b70]">{s.no_of_share} Shares</p>
                       </div>
                   ))}
                </div>
            )}
        </div>
    )}
</div>

                 {/* 2. ALLOTMENT CALCULATOR */}
                 
<div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 grid grid-cols-2 gap-8">
    <div>
        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Shares to Allot</label>
        <input 
            type="number" 
            onChange={e => setFormData({...formData, shares: e.target.value})} 
            className="w-full p-4 rounded-2xl bg-white border-2 border-blue-100 text-lg font-black" 
        />
        
        {/* NEW: REAL-TIME LIMIT VISIBILITY (Requirement 2.4) */}
        <div className="mt-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">
                Remaining Capacity: <span className="text-blue-600">{(summary.total_authorized - summary.total_subscribed).toLocaleString()} ETB</span>
            </p>
        </div>
    </div>
    
    <div className="flex flex-col justify-end text-right">
       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Investment Value</p>
       <h4 className="text-2xl font-black text-[#1a3b70]">
          {(formData.shares * 1000).toLocaleString()} <span className="text-xs font-normal">ETB</span>
       </h4>
    </div>
</div>

                 {/* SUBSCRIPTION TYPE + CLASS */}
                 <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="space-y-4">
                        <FormSelect 
                           label="Subscription Type" 
                           value={formData.sub_type}
                           onChange={e => setFormData({...formData, sub_type: e.target.value})}
                           options={['Initial', 'Additional']} 
                        />
                        <FormSelect 
                           label="Share Class" 
                           value={formData.class_id}
                           onChange={e => setFormData({...formData, class_id: e.target.value})}
                           options={classes.map(c => ({label: c.class_name, value: c.id}))}
                        />
                    </div>

                    <div className="space-y-4">
                        <FormInput 
                           label="Number of Shares" 
                           type="number" 
                           value={formData.shares}
                           onChange={e => setFormData({...formData, shares: e.target.value})} 
                        />
                        <div className="p-4 bg-[#1a3b70] rounded-2xl text-white">
                           <p className="text-[9px] font-bold opacity-50 uppercase mb-1">Total Allotment Value</p>
                           <p className="text-xl font-black text-yellow-400">
                              {(formData.shares * (classes.find(c => c.id == formData.class_id)?.issue_price || 1000)).toLocaleString()} ETB
                           </p>
                        </div>
                    </div>
                 </div>

                 {/* 3. PAYMENT VERIFICATION */}
                 <div className="grid grid-cols-4 gap-6">
                    <FormInput label="Bank Slip Ref" value={formData.ref} onChange={e => setFormData({...formData, ref: e.target.value})} required />
                    <FormInput label="Amount Paid Now" type="number" value={formData.paid} onChange={e => setFormData({...formData, paid: e.target.value})} required />
                    <FormInput label="Payment Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                    <FormSelect 
                       label="Payment Status" 
                       value={formData.payment_status}
                       onChange={e => setFormData({...formData, payment_status: e.target.value})}
                       options={['Full', 'Partial', 'Unpaid']} 
                    />
                    {/* MASTER FEATURE: Installment Schedule Visibility */}
    {formData.payment_status === 'Partial' && (
       <div className="col-span-3 bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center gap-3 animate-in slide-in-from-left-2">
          <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-700">
             <History size={16} />
          </div>
          <div className="flex-1">
             <p className="text-[10px] font-black text-amber-700 uppercase">Installment Schedule Triggered</p>
             <p className="text-[11px] text-amber-600 font-medium">The system will record a follow-up due date of 30 days from today for the balance.</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase">Balance Due</p>
             <p className="text-xs font-black text-red-500">
                {(Number(formData.shares * 1000) - Number(formData.paid)).toLocaleString()} ETB
             </p>
          </div>
       </div>
    )}
                 </div>
              
              </form>

              <div className="p-8 border-t bg-slate-50 flex justify-end gap-5">
                 <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="bg-[#1a3b70] text-white px-12 py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <ArrowUpRight size={16}/>}
                    Initiate Allotment
                 </button>
              </div>
           </div>
        </div>
      )}

      {viewingAdvice && (
  <AllotmentAdviceTemplate 
    data={viewingAdvice} 
    onClose={() => setViewingAdvice(null)} 
  />
)}

    </div>
  );
};

// HELPER COMPONENTS
const FormInput = ({ label, type = "text", ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input type={type} className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all" {...props} />
    </div>
);


const FormSelect = ({ label, options, ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select 
        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400 appearance-none cursor-pointer" 
        {...props}
      >
        {options.map(opt => {
           // This handles both simple strings and objects like {label, value}
           const val = typeof opt === 'object' ? opt.value : opt;
           const lab = typeof opt === 'object' ? opt.label : opt;
           return <option key={val} value={val}>{lab}</option>
        })}
      </select>
    </div>
);


export default AllotmentModule;
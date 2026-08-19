import React, { useState, useEffect } from 'react';
import { Gavel, Plus, Zap, FileText, CheckCircle, X, Info, TrendingUp, Landmark, Share2, 
    Layers, Users, Printer, ShieldAlert, ShieldCheck, FileSpreadsheet, Loader2, History } from 'lucide-react';
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

const CorporateActionsModule = () => {
  const [actions, setActions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('BONUS_ISSUE');
  const [formData, setFormData] = useState({ ratio_base: 5, ratio_new: 1, record_date: '', effective_date: '', board_res: '', description: '', issue_price: 1000 });
  const currentUser = localStorage.getItem('userName') || 'Admin';
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [viewingRights, setViewingRights] = useState(null);
  const [currentStatus, setCurrentStatus] = useState({ total_shares: 0, par_value: 1000 });
  const [showAuditModal, setShowAuditModal] = useState(false);        // ← ADD
  const [selectedAuditLogs, setSelectedAuditLogs] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectTarget, setRejectTarget] = useState(null);
const [rejectReason, setRejectReason] = useState('');
const [isEditing, setIsEditing] = useState(false);
const [editId, setEditId] = useState(null);

  // FILE STATES
  const [boardFile, setBoardFile] = useState(null);
  const [shFile, setShFile] = useState(null);
  const [regFile, setRegFile] = useState(null);

  // --- ADD THIS AT THE TOP OF CorporateActionsModule ---
const userRole = localStorage.getItem('userRole');
const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');

const can = (permissionKey) => {
    if (userRole === 'Admin') return true; // Admin bypass
    return userPermissions.includes(permissionKey);
};

  useEffect(() => { 
    fetchActions(); 
    API.get('/api/capital/current-status').then(res => setCurrentStatus(res.data));
  }, []);

  const fetchActions = () => API.get('/api/corporate-actions').then(res => setActions(res.data));
  const showNotification = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  

  const handleLaunch = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    data.append('type', type);
    data.append('performed_by', currentUser);

    // FILES ARE NOW PROPERLY LINKED
    if (boardFile) data.append('board_res', boardFile);
    if (shFile) data.append('sh_res', shFile);
    if (regFile) data.append('reg_approval', regFile);

    try {
        await API.post('/api/corporate-actions', data);
        showNotification("Corporate Action Proposal Logged Successfully!");
        setShowModal(false);
        fetchActions();
    } catch (err) { showNotification("Upload failed", "error"); }
  };

const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return showNotification("Please enter a reason", "error");
    
    try {
        // 1. Send the request to the backend
        await API.put(`/api/corporate-actions/${rejectTarget.id}/reject`, { 
            reason: rejectReason, 
            performed_by: currentUser 
        });

        // 2. SUCCESS: Show a GREEN toast (type = 'success')
        showNotification("Corporate Action Proposal Rejected", "success");
        
        // 3. UI Cleanup
        setShowRejectModal(false);
        setRejectTarget(null);
        setRejectReason('');

        // 4. REFRESH: Use the correct function name for this module
        fetchActions(); 

    } catch (err) {
        console.error("Rejection Error:", err);
        showNotification("Critical: System failed to finalize rejection UI.", "error");
    }
};

  return (
    <div className="space-y-8 animate-in fade-in pb-20 relative">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />}
      
{/* --- HEADER SECTION --- */}
<div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
   <div>
      <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter uppercase italic">Capital Restructuring</h2>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section 2.6 • Corporate Actions Engine</p>
   </div>

   {/* --- WRAP THIS BUTTON IN PERMISSION CHECK --- */}
   {can('corp_initiate') && (
      <button 
        onClick={() => setShowModal(true)} 
        className="bg-yellow-400 text-[#1a3b70] px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl active:scale-95 transition-all"
      >
         <Plus size={18} /> INITIATE ACTION
      </button>
   )}
</div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-3 gap-6">
         <ActionStat label="Executed Actions" value={actions.filter(a => a.status === 'Executed').length} icon={<CheckCircle className="text-emerald-500"/>} />
         <ActionStat label="Pending Approval" value={actions.filter(a => a.status === 'Pending Approval').length} icon={<Info className="text-amber-500"/>} />
         <ActionStat label="Drafts" value={actions.filter(a => a.status === 'Draft').length} icon={<FileText className="text-slate-400"/>} />
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
               <tr>
                  <th className="px-8 py-6">Type</th>
                  <th className="px-8 py-6">Ratio</th>
                  <th className="px-8 py-6">Effective Date</th>
                  <th className="px-8 py-6">Docs</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right px-12">Actions</th>
               </tr>
            </thead>
<tbody className="divide-y divide-slate-50">
   {actions.map(a => {
      // --- THE LOGIC IS NOW INSIDE THE LOOP ---
      const isSameUser = a.maker_id === currentUser;

      return (
         <tr key={a.id} className="hover:bg-slate-50/50 transition-all text-xs font-bold text-slate-700">
            <td className="px-8 py-5">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                     {a.action_type === 'BONUS_ISSUE' ? <TrendingUp size={16}/> : <Share2 size={16}/>}
                  </div>
                  {a.action_type.replace('_', ' ')}
               </div>
            </td>
            <td className="px-8 py-5">
    {/* Use parseFloat to remove unnecessary trailing zeros (e.g. 1.00 becomes 1) */}
    {parseFloat(a.ratio_new)} For {parseFloat(a.ratio_base)}
</td>
            <td className="px-8 py-5 text-slate-400">{new Date(a.effective_date).toLocaleDateString()}</td>
            <td className="px-8 py-5">
               <div className="flex gap-1">
                   {a.board_res_path && <a href={`/documents/${a.board_res_path}`} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 rounded text-slate-400 hover:text-blue-500"><FileText size={12}/></a>}
                   {a.reg_approval_path && <a href={`/documents/${a.reg_approval_path}`} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 rounded text-slate-400 hover:text-emerald-500"><ShieldCheck size={12}/></a>}
               </div>
            </td>
            <td className="px-8 py-5">
               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${a.status === 'Executed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
            </td>
<td className="px-8 py-5 text-right px-12">
   <div className="flex justify-end gap-3 items-center">
      
      {/* 1. CHECKER ACTIONS: EXECUTE & REJECT */}
      {a.status === 'Pending Approval' && can('corp_execute') && !isSameUser && (
         <div className="flex gap-2">
            <button 
   onClick={async () => {
     try {
       const res = await API.put(`/api/corporate-actions/${a.id}/execute`, { 
         performed_by: currentUser 
       });
       showNotification(res.data.message);
       
       // --- ADD THESE TWO LINES TO REFRESH THE NUMBERS ---
       const statusRes = await API.get('/api/capital/current-status');
       setCurrentStatus(statusRes.data);
       
       fetchActions(); // Refreshes the table list
     } catch (err) { 
       showNotification("Execution failed.", "error"); 
     }
   }} 
   className="..."
>
   Execute
</button>
            <button 
                  onClick={() => { 
      setRejectTarget(a); // Ensure this is 'a' (the action object)
      setShowRejectModal(true); 
   }} 
               className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg transition-all active:scale-95"
            >
               Reject
            </button>
         </div>
      )}

      {/* 2. SELF-APPROVAL WARNING */}
      {isSameUser && a.status === 'Pending Approval' && (
         <span className="text-[8px] text-slate-400 italic bg-slate-50 px-2 py-1 rounded border border-slate-100">
            Awaiting 2nd Approval
         </span>
      )}

      {/* 3. MAKER STATUS MESSAGE */}
      {a.status === 'Pending Approval' && !can('corp_execute') && (
         <span className="text-[9px] font-black text-amber-500 italic uppercase bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
            Authorization Required
         </span>
      )}

      {/* 4. AUDIT BUTTON */}
      {can('cert_audit') && (
        <button 
            onClick={async () => {
              const res = await API.get(`/api/reports/audit-search`, { params: { certNo: 'GLOBAL' } });
              setSelectedAuditLogs(res.data);
              setShowAuditModal(true);
            }}
            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-[#1a3b70] hover:text-white transition-all"
        >
            <History size={14}/>
        </button>
      )}
   </div>
</td>
         </tr>
      );
   })}
</tbody>
         </table>
      </div>

      {/* INITIATE MODAL */}
      {showModal && (
         <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
               <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Initiate Corporate Action</h3>
                  <X className="cursor-pointer" onClick={() => setShowModal(false)} />
               </div>
               <form onSubmit={handleLaunch} className="p-10 space-y-8 overflow-y-auto max-h-[75vh]">
                  <div className="grid grid-cols-2 gap-8">
                     <FormSelect label="Action Type" value={type} options={['BONUS_ISSUE', 'SHARE_SPLIT', 'CONSOLIDATION', 'RIGHTS_ISSUE']} onChange={(e) => setType(e.target.value)} />
                     <FormInput label="Board Resolution No." onChange={(e) => setFormData({...formData, board_res: e.target.value})} required />
                  </div>
                  
                  {type === 'RIGHTS_ISSUE' && (
                     <div className="animate-in slide-in-from-top-2">
                        <FormInput label="Issue Price (Discounted Rate in ETB)" placeholder="e.g. 800" onChange={e => setFormData({...formData, issue_price: e.target.value})} />
                     </div>
                  )}

                  <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Define Ratio (e.g., 1 For 5)</p>
                     {/* --- FIND THESE INPUTS INSIDE THE BLUE BOX IN THE MODAL --- */}
<div className="flex items-center gap-6">
    <input 
      type="number" 
      step="0.01" // <--- ADD THIS
      placeholder="New" 
      value={formData.ratio_new}
      onChange={e => setFormData({...formData, ratio_new: e.target.value})} 
      className="w-24 p-4 rounded-2xl bg-white border-2 border-blue-200 text-center font-black text-lg" 
    />
    <span className="font-black text-blue-300">FOR</span>
    <input 
      type="number" 
      step="0.01" // <--- ADD THIS
      placeholder="Base" 
      value={formData.ratio_base}
      onChange={e => setFormData({...formData, ratio_base: e.target.value})} 
      className="w-24 p-4 rounded-2xl bg-white border-2 border-blue-200 text-center font-black text-lg" 
    />
</div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <FormInput label="Record Date" type="date" onChange={e => setFormData({...formData, record_date: e.target.value})} required />
                     <FormInput label="Effective Date" type="date" onChange={e => setFormData({...formData, effective_date: e.target.value})} required />
                  </div>

                  {/* --- IMPACT ANALYSIS BOX (Now integrated) --- */}
                  <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6">
                      <div className="flex justify-between items-center"><p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em]">Impact Analysis</p></div>
                      <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-1">
                              <p className="text-[9px] opacity-40 uppercase font-black tracking-widest">Current State</p>
                              <p className="text-2xl font-black">{Number(currentStatus.total_shares).toLocaleString()} <span className="text-xs opacity-50">Shares</span></p>
                              <p className="text-[10px] text-blue-400 font-bold uppercase italic">Par: {currentStatus.par_value} ETB</p>
                          </div>
                          
<div className="text-right space-y-1">
    <p className="text-[9px] opacity-40 uppercase font-black tracking-widest">Projected Registry State</p>
    
    {/* Logic: Only show math if both ratio boxes have numbers, otherwise show '---' */}
    {formData.ratio_new && formData.ratio_base ? (
        <>
            <p className={`text-2xl font-black ${type === 'SHARE_SPLIT' ? 'text-emerald-400' : 'text-orange-400'}`}>
                {Math.floor(currentStatus.total_shares * (formData.ratio_new / formData.ratio_base)).toLocaleString()}
                <span className="text-xs ml-2 font-normal opacity-50">Shares</span>
            </p>
            <p className="text-[10px] text-yellow-400 font-black uppercase italic tracking-tighter">
                New Par: {Math.floor(currentStatus.par_value / (formData.ratio_new / formData.ratio_base)).toLocaleString()} ETB
            </p>
        </>
    ) : (
        <div className="py-2">
            <p className="text-sm font-bold text-slate-500 italic">Enter ratio to see impact...</p>
        </div>
    )}
</div>
                      </div>
                  </div>

                  {/* --- LEGAL DOCS (Now inside the form) --- */}
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Required Legal Documentation</p>
                      <div className="grid grid-cols-3 gap-6">
                          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                              <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-tighter">Board Resolution</label>
                              <input type="file" onChange={e => setBoardFile(e.target.files[0])} className="text-[10px] w-full" />
                          </div>
                          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                              <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-tighter">SH Resolution</label>
                              <input type="file" onChange={e => setShFile(e.target.files[0])} className="text-[10px] w-full" />
                          </div>
                          <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                              <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-tighter">Reg. Approval</label>
                              <input type="file" onChange={e => setRegFile(e.target.files[0])} className="text-[10px] w-full" />
                          </div>
                      </div>
                  </div>

                  <button type="submit" className="w-full bg-[#1a3b70] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2">
                     <Zap size={18} className="text-yellow-400" /> Confirm & Launch Proposal
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* --- RIGHTS ISSUE MANAGEMENT WORKSPACE (Section 2.6.2) --- */}
{viewingRights && (
  <div className="fixed inset-0 bg-[#f8fafc] z-[160] flex flex-col animate-in slide-in-from-right duration-500">
    {/* Header */}
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm">
       <div className="flex items-center gap-4">
          <button onClick={() => setViewingRights(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X /></button>
          <div>
             <h3 className="text-xl font-black text-[#1a3b70] tracking-tighter uppercase">Rights Management</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Action ID: {viewingRights.board_resolution_no}</p>
          </div>
       </div>
       <div className="flex gap-4">
          {/* THE PRINT BUTTON YOU REQUESTED */}
          <button 
            onClick={() => window.print()}
            className="bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-2 text-[#1a3b70] font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
          >
            <Printer size={16}/> Print Offer Notices
          </button>
          
          <button className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-200 active:scale-95 transition-all">
             <CheckCircle size={16} className="inline mr-2"/> Finalize Allotments
          </button>
       </div>
    </header>

    <main className="p-10 flex-1 overflow-y-auto space-y-8">
       <div className="bg-[#1a3b70] p-8 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
          <div className="z-10">
             <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Ratio for Offering</p>
             <h4 className="text-3xl font-black text-yellow-400">{viewingRights.ratio_new} New : {viewingRights.ratio_base} Existing</h4>
          </div>
          <div className="z-10 text-right">
             <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Issue Price</p>
             <h4 className="text-3xl font-black">{viewingRights.issue_price || '1,000'} ETB / Share</h4>
          </div>
          <Landmark size={200} className="absolute -right-10 -bottom-10 opacity-5" />
       </div>

       {/* Placeholder for Application List (Requirement 2.5) */}
       <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center py-24">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Users size={32} className="text-slate-200" />
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Shareholder Applications List</p>
          <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">Fetch the list of eligible members to record who participated and paid for their rights.</p>
       </div>
    </main>
  </div>
)}
{showAuditModal && (
  <div className="fixed inset-0 bg-[#1a3b70]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
       <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
             <Gavel className="text-blue-600" size={20} /> Corporate Action Audit
          </h3>
          <X className="text-slate-300 cursor-pointer" onClick={() => setShowAuditModal(false)} />
       </div>
       <div className="flex-1 overflow-y-auto p-8 space-y-4 max-h-[60vh]">
          {selectedAuditLogs.map((log, i) => (
             <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 w-24 leading-tight uppercase">
                   {new Date(log.created_at).toLocaleDateString()}<br/>
                   {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex-1 border-l-2 border-blue-200 pl-6">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.action_type}</p>
                   <p className="text-xs font-bold text-slate-700 mt-1">
                      {JSON.parse(log.details).event}
                   </p>
                   <div className="mt-2 grid grid-cols-2 gap-2">
                      <p className="text-[9px] text-slate-400">User: <span className="text-[#1a3b70] font-bold">{log.performed_by}</span></p>
                      {JSON.parse(log.details).ratio && <p className="text-[9px] text-slate-400">Ratio: <span className="font-bold">{JSON.parse(log.details).ratio}</span></p>}
                   </div>
                </div>
             </div>
          ))}
       </div>
       <div className="p-8 bg-slate-50 border-t flex justify-end">
          <button onClick={() => setShowAuditModal(false)} className="bg-[#1a3b70] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Close Audit Trail</button>
       </div>
    </div>
  </div>
)}

{showRejectModal && rejectTarget && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter">Reject Corporate Action</h3>
          <button onClick={() => setShowRejectModal(false)} className="text-slate-300 hover:text-red-500"><X /></button>
       </div>

       <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Target Action</p>
          <p className="text-xs font-bold text-slate-700">{rejectTarget.action_type.replace('_', ' ')}</p>
       </div>

       <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Rejection</label>
          <textarea 
             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold h-32 outline-none focus:border-red-400 transition-all"
             placeholder="Explain why this action is being denied..."
             value={rejectReason}
             onChange={(e) => setRejectReason(e.target.value)}
          ></textarea>
       </div>

       <div className="flex gap-4 mt-8">
          <button onClick={() => setShowRejectModal(false)} className="flex-1 px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
          <button 
             onClick={async () => {
                if (!rejectReason.trim()) return showNotification("Please provide a reason", "error");
                try {
                   await API.put(`/api/corporate-actions/${rejectTarget.id}/reject`, { 
                      reason: rejectReason, 
                      performed_by: currentUser 
                   });
                   showNotification("Action Rejected", "error");
                   setShowRejectModal(false);
                   setRejectTarget(null);
                   setRejectReason('');
                   fetchActions();
                } catch (err) {
                   showNotification("Action failed", "error");
                }
             }}
             onClick={handleRejectSubmit}
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

const ActionStat = ({ label, value, icon }) => (
   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#1a3b70] transition-all">
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <p className="text-3xl font-black text-[#1a3b70]">{value}</p>
      </div>
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all">{icon}</div>
   </div>
);

// Reuse helpers from previous modules
const FormInput = ({ label, ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400" {...props} />
    </div>
);
const FormSelect = ({ label, options, ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold appearance-none cursor-pointer" {...props}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
);

export default CorporateActionsModule;
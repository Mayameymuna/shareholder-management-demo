import React, { useState, useEffect } from 'react';
import { Landmark, ShieldCheck, TrendingUp, Plus, FileText, Settings2, Save, X, 
    FileSpreadsheet, CheckCircle, Percent, FileCheck, ArrowRightLeft} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Use the centralized API instance

const CapitalModule = ({ subType }) => {
  const [summary, setSummary] = useState({ total_authorized: 0, total_subscribed: 0, total_paidup: 0, total_outstanding: 0, sub_pending: 0, sub_approved: 0, sub_completed: 0 });
  const [history, setHistory] = useState([]);
  const [classes, setClasses] = useState([]);
  const [issuanceData, setIssuanceData] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ share_class_id: 1, amount: '', board_res: '', sh_res: '', date: '' });
  const currentUser = localStorage.getItem('userName') || 'Admin';
  const [showRightsModal, setShowRightsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [rightsForm, setRightsForm] = useState({});
  const userRole = localStorage.getItem('userRole');
const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
const [showCreateClassModal, setShowCreateClassModal] = useState(false);
const [pendingPayments, setPendingPayments] = useState([]);
const [newClassForm, setNewClassForm] = useState({
    class_name: '', 
    par_value: 1000, 
    issue_price: 1000, 
    voting_rights: '1 Vote per Share', 
    dividend_rights: 'Pro-rata',
    redemption_rights: 'None', 
    conversion_rights: 'None',
    transfer_restrictions: 'Board Approval Required', 
    liquidation_priority: 1
});

const fetchPendingPayments = () => {
    API.get('/api/payments/pending')
      .then(res => setPendingPayments(res.data || []))
      .catch(err => console.error("Error fetching pending payments:", err));
};

useEffect(() => {
    fetchPendingPayments();
}, []);

const handleApprovePayment = async (paymentId) => {
    try {
        const res = await API.put(`/api/payments/${paymentId}/approve`, {
            performed_by: currentUser
        });
        alert(res.data.message);
        fetchPendingPayments(); // Refresh pending table
    } catch (err) {
        alert(err.response?.data?.message || "Approval failed");
    }
};

const handleRejectPayment = async (paymentId) => {
    const reason = window.prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
        await API.put(`/api/payments/${paymentId}/reject`, {
            performed_by: currentUser,
            reason
        });
        alert("Payment rejected.");
        fetchPendingPayments();
    } catch (err) {
        alert("Action failed");
    }
};

const handleApproveChange = async (id) => {
    try {
        await API.put(`/api/capital/history/${id}/approve`, { 
            performed_by: currentUser 
        });
        alert("Authorized: Bank Capital Limit updated.");
        window.location.reload(); // Refresh to update top cards
    } catch (err) { alert("Approval failed"); }
};

const handleRejectChange = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
        await API.put(`/api/capital/history/${id}/reject`, { 
            reason: reason,
            performed_by: currentUser 
        });
        alert("Capital Change Proposal Rejected.");
        window.location.reload();
    } catch (err) { alert("Action failed"); }
};

const can = (key) => {
    if (userRole === 'Admin') return true;
    return userPermissions.includes(key);
};

  useEffect(() => {
    API.get('/api/capital/summary').then(res => setSummary(res.data || {}));
    API.get('/api/capital/classes').then(res => setClasses(res.data || []));
    API.get('/api/capital/history').then(res => setHistory(res.data || []));
    API.get('/api/capital/issuance-report').then(res => setIssuanceData(res.data || []));
  }, [subType]);

const handleUpdateCapital = async (e) => {
    e.preventDefault();
    try {
        const res = await API.post('/api/capital/update', { 
            ...updateForm, 
            performed_by: currentUser 
        });
        
        if (res.data.success) {
            alert("Success: Capital increase proposal has been sent to the Checker.");
            setShowUpdateModal(false);
            window.location.reload(); 
        }
    } catch (err) { 
        // This will now tell you EXACTLY why it failed (e.g. database error)
        alert("Error: " + (err.response?.data?.message || "Update failed")); 
    }
};

  // Safe Percent Calculation (Fixes NaN)
  const calculatePercent = (num, den) => {
      if (!num || !den || den === 0) return "0.0";
      return ((num / den) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- SECTION 1: AUTHORIZED LEDGER --- */}
      {subType === 'Capital-Authorized' && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <CapitalCard title="Total Authorized Capital" value={summary.total_authorized} color="text-slate-800" isMain />
               {/* ROW 1 - RIGHT: ACTION CARD */}
<div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden shadow-2xl">
   <div className="z-10">
      <h3 className="text-2xl font-black tracking-tighter">Amend Capital Structure</h3>
      <p className="text-blue-200 text-xs mt-2 opacity-70 italic">
        Initiate an increase or decrease in authorized limits.
      </p>
   </div>

   {/* Ensure this key matches the 'permission_key' in your DB (cap_amend) */}
   {can('cap_amend') ? (
      <button 
        onClick={() => setShowUpdateModal(true)} 
        className="z-10 mt-8 bg-yellow-400 text-[#1a3b70] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
      >
         Update Structure
      </button>
   ) : (
      <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold text-blue-300 italic">
         Read-only mode for your role
      </div>
   )}
</div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b bg-slate-50/50 font-black text-xs text-[#1a3b70] uppercase">Authorized Capital History</div>
               <table className="w-full text-left">
                  <thead className="bg-slate-50/30 border-b font-black text-[9px] text-slate-400 uppercase tracking-widest">
                     <tr><th className="px-10 py-6">Date</th><th className="px-10 py-6">Event</th><th className="px-10 py-6">Max Shares</th><th className="px-10 py-6">Value (ETB)</th><th className="px-10 py-6 text-right px-12">Resolutions</th></tr>
                  </thead>
<tbody className="divide-y divide-slate-50">
   {history.map((h) => {
      // Logic to prevent self-approval (Standard Banking Security)
      const isSameUser = h.performed_by === currentUser;

      return (
         <tr key={h.id} className="hover:bg-slate-50/50 transition-all group">
            <td className="px-10 py-5 text-xs font-bold text-slate-500">{new Date(h.effective_date).toLocaleDateString()}</td>
            <td className="px-10 py-5">
               <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${
                   h.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                   h.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                   'bg-amber-50 text-amber-600'
               }`}>
                  {h.status}
               </span>
            </td>
            <td className="px-10 py-5 font-black text-[#1a3b70]">{Number(h.authorized_capital).toLocaleString()} ETB</td>
            
            <td className="px-10 py-5 text-right px-12">
               <div className="flex justify-end gap-2 items-center">
                  
                  {/* --- CHECKER ACTIONS (Requirement: cap_pay_approve) --- */}
                  {h.status === 'Pending' && can('cap_pay_approve') && !isSameUser && (
                     <div className="flex gap-2">
                        <button 
                           onClick={() => handleApproveChange(h.id)}
                           className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
                        >
                           Approve
                        </button>
                        <button 
                           onClick={() => handleRejectChange(h.id)}
                           className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
                        >
                           Reject
                        </button>
                     </div>
                  )}

                  {/* Message for the Maker while waiting */}
                  {h.status === 'Pending' && isSameUser && (
                     <span className="text-[8px] text-slate-400 italic bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        Awaiting 2nd Approval
                     </span>
                  )}

                  <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                     <FileText size={14}/>
                  </button>
               </div>
            </td>
         </tr>
      );
   })}
</tbody>
               </table>
            </div>
        </div>
      )}

      {/* --- SECTION 2: ISSUANCE & SUBSCRIPTIONS --- */}
      {subType === 'Capital-Issuance' && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <CapitalCard title="Issued" value={summary.total_subscribed} color="text-blue-600" />
                <CapitalCard title="Paid-up" value={summary.total_paidup} color="text-emerald-600" />
                <CapitalCard title="Outstanding" value={summary.total_outstanding} color="text-orange-500" />
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Collection Rate</p>
                    <p className="text-3xl font-black text-[#1a3b70]">{calculatePercent(summary.total_paidup, summary.total_subscribed)}%</p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b bg-slate-50/50 font-black text-xs text-[#1a3b70] uppercase">Issuance Utilization per Class</div>
               <table className="w-full text-left">
                  <thead className="bg-slate-50/30 border-b font-black text-[9px] text-slate-400 uppercase tracking-widest">
                     <tr><th className="px-10 py-6">Share Class</th><th className="px-10 py-6 text-blue-600">Issued Value</th><th className="px-10 py-6">Utilization</th><th className="px-10 py-6 text-right px-12">Remaining Room</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                     {issuanceData.map((row, i) => (
                        <tr key={i}>
                           <td className="px-10 py-5 font-black text-[#1a3b70]">{row.class_name}</td>
                           <td className="px-10 py-5">{Number(row.issued_active + row.issued_pending).toLocaleString()} ETB</td>
                           <td className="px-10 py-5">{calculatePercent(row.issued_active + row.issued_pending, row.authorized)}%</td>
                           <td className="px-10 py-5 text-right px-12 text-emerald-600">{Number(row.authorized - (row.issued_active + row.issued_pending)).toLocaleString()} ETB</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
        </div>
      )}

      {/* --- SECTION 3: SHARE CLASSES --- */}
{subType === 'Capital-Classes' && (
      <div className="space-y-8">
       <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div>
             <h3 className="text-xl font-black text-[#1a3b70] uppercase">Share Class Management</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase">Define equity tiers and legal rights</p>
          </div>
          {/* SECURE WITH PERMISSION */}
          {can('cap_classes') && (
            <button 
                onClick={() => setShowCreateClassModal(true)}
                className="bg-[#1a3b70] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-blue-900 transition-all"
            >
                <Plus size={16} className="text-yellow-400" /> Add New Class
            </button>
          )}
       </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
       {classes.map(cls => (
           <div key={cls.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative group hover:border-[#1a3b70] transition-all">
              <div className="flex justify-between items-start">
                 <div>
                    <h4 className="text-xl font-black text-slate-800">{cls.class_name} Shares</h4>
                    <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">Liquidation Priority: Level {cls.liquidation_priority}</p>
                 </div>
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 font-black italic">v{cls.version_no}</div>
              </div>

              <div className="mt-8 space-y-4">
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <ShieldCheck size={14} className="text-emerald-500" /> Voting: {cls.voting_rights || 'Undefined'}
                 </div>
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Percent size={14} className="text-blue-500" /> Dividends: {cls.dividend_rights || 'Undefined'}
                 </div>
              </div>

              <button 
                 onClick={() => { setSelectedClass(cls); setRightsForm(cls); setShowRightsModal(true); }}
                 className="mt-10 w-full py-4 bg-slate-50 text-[#1a3b70] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1a3b70] hover:text-white transition-all shadow-sm"
              >
                 Configure Rights & Restrictions
              </button>
           </div>
       ))}
   </div>
   </div>
)}
    
{/* UPDATE MODAL (Section 2.2.1 Compliant) */}
{showUpdateModal && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden">
      
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tighter">Increase Authorized Capital</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section 2.2.1 Compliance</p>
        </div>
        <X className="text-slate-300 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setShowUpdateModal(false)} />
      </div>

      {/* --- ADD THE FORM HERE --- */}
      <form onSubmit={handleUpdateCapital} className="space-y-5">
        
        {/* 1. Share Class Selection */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Share Class</label>
          <select 
            value={updateForm.share_class_id}
            onChange={e => setUpdateForm({...updateForm, share_class_id: e.target.value})}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400 transition-all appearance-none"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </div>

        {/* 2. Amount Input */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Authorized Limit (ETB Amount)</label>
          <input 
            type="number" 
            placeholder="e.g. 2000000000" 
            onChange={e => setUpdateForm({...updateForm, amount: e.target.value})} 
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-black text-[#1a3b70] outline-none focus:border-yellow-400" 
            required 
          />
        </div>

        {/* 3. Resolutions (Board & SH) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Board Res. No.</label>
            <input 
              type="text" 
              placeholder="BR-XXXX"
              onChange={e => setUpdateForm({...updateForm, board_res: e.target.value})} 
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400" 
              required 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SH Resolution No.</label>
            <input 
              type="text" 
              placeholder="SR-XXXX"
              onChange={e => setUpdateForm({...updateForm, sh_res: e.target.value})} 
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400" 
              required 
            />
          </div>
        </div>

        {/* 4. Effective Date */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Effective Date</label>
          <input 
            type="date" 
            onChange={e => setUpdateForm({...updateForm, date: e.target.value})} 
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400" 
            required 
          />
        </div>

        <button type="submit" className="w-full bg-[#1a3b70] hover:bg-blue-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
          <Save size={18} /> Apply Structure Change
        </button>
      </form>
    </div>
  </div>
)}

{/* CAPITAL CHANGE LEDGER */}
<div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mt-10">
   <div className="p-8 border-b bg-slate-50/50">
      <h3 className="font-black text-[#1a3b70] uppercase text-xs tracking-widest">Capital Event Ledger (Section 2.2.7)</h3>
   </div>
   <table className="w-full text-left">
      <thead className="text-[10px] text-slate-400 uppercase font-black border-b border-slate-50">
         <tr>
            <th className="px-10 py-5">Event Type</th>
            <th className="px-10 py-5">New Capital Limit</th>
            <th className="px-10 py-5">Board Reference</th>
            <th className="px-10 py-5">Effective Date</th>
         </tr>
      </thead>
      <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
         <tr className="hover:bg-slate-50">
            <td className="px-10 py-5"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md">INITIAL</span></td>
            <td className="px-10 py-5">2,000,000,000 ETB</td>
            <td className="px-10 py-5 font-mono">BR-2023-001</td>
            <td className="px-10 py-5">01/01/2023</td>
         </tr>
         {/* Later we will map this to the capital_history table */}
      </tbody>
   </table>
</div>

{/* --- PENDING PAYMENTS FOR CHECKER (Requirement 4.1) --- */}
{/* --- PENDING PAYMENTS FOR CHECKER (Requirement 4.1) --- */}
<div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mt-10">
   <div className="p-8 border-b bg-amber-50/50 flex justify-between items-center">
      <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest">
         Payments Awaiting Confirmation ({pendingPayments.length})
      </h3>
   </div>
   <table className="w-full text-left">
      <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b">
         <tr>
            <th className="px-10 py-4">Shareholder</th>
            <th className="px-10 py-4">Amount Paid</th>
            <th className="px-10 py-4">Bank Ref</th>
            <th className="px-10 py-4">Branch</th>
            <th className="px-10 py-4 text-right px-12">Action</th>
         </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
         {pendingPayments.map((p) => (
            <tr key={p.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50">
               <td className="px-10 py-5">
                  <p className="font-black text-slate-800">{p.full_name}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{p.sh_code}</p>
               </td>
               <td className="px-10 py-5 text-emerald-600 font-black">
                  {Number(p.amount_paid).toLocaleString()} ETB
               </td>
               <td className="px-10 py-5 text-slate-500 font-mono text-[10px]">
                  {p.reference_no}
               </td>
               <td className="px-10 py-5 text-slate-400 uppercase text-[10px]">
                  {p.branch_name || 'Main Office'}
               </td>
               <td className="px-10 py-5 text-right px-12">
                  <div className="flex justify-end gap-2">
                     <button 
                        onClick={() => handleApprovePayment(p.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
                     >
                        Confirm & Post
                     </button>
                     <button 
                        onClick={() => handleRejectPayment(p.id)}
                        className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all"
                     >
                        Reject
                     </button>
                  </div>
               </td>
            </tr>
         ))}
         {pendingPayments.length === 0 && (
            <tr>
               <td colSpan="5" className="py-12 text-center text-slate-300 italic text-xs font-bold uppercase">
                  No payments awaiting confirmation.
               </td>
            </tr>
         )}
      </tbody>
   </table>
</div>
      {showRightsModal && selectedClass && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
       <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
    <h3 className="font-black text-[#1a3b70] uppercase text-xs">Issuance Utilization Report</h3>
    
    {/* REQUIREMENT 2.5: Generate Reports */}
    <button 
        onClick={() => window.print()} 
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase hover:bg-[#1a3b70] hover:text-white transition-all shadow-sm"
    >
        <FileSpreadsheet size={14} className="text-emerald-500" /> Export Summary
    </button>
</div>

       <form className="flex-1 overflow-y-auto p-12 space-y-10" onSubmit={async (e) => {
           e.preventDefault();
           await API.put(`/api/capital/classes/${selectedClass.id}/rights`, { ...rightsForm, performed_by: currentUser });
           alert("Legal Rights Updated & History Logged!");
           setShowRightsModal(false);
           window.location.reload();
       }}>
          <div className="grid grid-cols-2 gap-10">
             <RightTextArea label="Voting Rights" value={rightsForm.voting_rights} onChange={e => setRightsForm({...rightsForm, voting_rights: e.target.value})} />
             <RightTextArea label="Dividend Rights" value={rightsForm.dividend_rights} onChange={e => setRightsForm({...rightsForm, dividend_rights: e.target.value})} />
             <RightTextArea label="Redemption Rights" value={rightsForm.redemption_rights} onChange={e => setRightsForm({...rightsForm, redemption_rights: e.target.value})} />
             <RightTextArea label="Conversion Rights" value={rightsForm.conversion_rights} onChange={e => setRightsForm({...rightsForm, conversion_rights: e.target.value})} />
             <RightTextArea label="Transfer Restrictions" value={rightsForm.transfer_restrictions} onChange={e => setRightsForm({...rightsForm, transfer_restrictions: e.target.value})} />
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Liquidation Priority (1=Highest)</label>
                <input type="number" value={rightsForm.liquidation_priority} onChange={e => setRightsForm({...rightsForm, liquidation_priority: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-[#1a3b70]" />
             </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
             <p className="text-xs text-slate-400 font-medium max-w-md italic">Any changes made here will be recorded in the official version history table for regulatory compliance.</p>
             <button type="submit" className="bg-[#1a3b70] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2">
                <Save size={18} /> Update Legal Rights
             </button>
          </div>
       </form>
    </div>
  </div>
)}

{/* --- UPDATED "DEFINE NEW SHARE CLASS" MODAL --- */}
{showCreateClassModal && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
       
       <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-lg font-black italic">R</div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Define New Share Class</h3>
          </div>
          <button onClick={() => setShowCreateClassModal(false)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"><X /></button>
       </div>

       <form className="flex-1 overflow-y-auto p-12 space-y-10" onSubmit={async (e) => {
           e.preventDefault();
           try {
              await API.post('/api/capital/classes', { ...newClassForm, performed_by: currentUser });
              alert("New Share Class Registered Successfully!");
              setShowCreateClassModal(false);
              window.location.reload();
           } catch (err) { alert("Error: Class Name or Code might already exist."); }
       }}>
          
          {/* TOP ROW: PRICING & IDENTITY (Section 2.2.6 Compliance) */}
          {/* --- CORRECTED TOP ROW --- */}
<div className="grid grid-cols-3 gap-6 mb-8">
    <FormInput 
        label="Class Name" 
        placeholder="e.g. Ordinary, Preference, etc."
        value={newClassForm.class_name} 
        onChange={e => setNewClassForm({...newClassForm, class_name: e.target.value})} 
        required 
    />
    <FormInput 
        label="Par Value (ETB)" 
        type="number" 
        value={newClassForm.par_value} 
        onChange={e => setNewClassForm({...newClassForm, par_value: e.target.value})} 
        required 
    />
    <FormInput 
        label="Issue Price (ETB)" 
        type="number" 
        value={newClassForm.issue_price} 
        onChange={e => setNewClassForm({...newClassForm, issue_price: e.target.value})} 
        required 
    />
</div>

          {/* LEGAL CHARACTERISTICS (Section 2.2.5.3 Compliance) */}
          <div className="bg-blue-50/30 p-10 rounded-[2.5rem] border border-blue-100 space-y-8">
             <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2">Legal Characteristics & Rights</div>
             
             <div className="grid grid-cols-2 gap-10">
                <RightTextArea label="Voting Rights" value={newClassForm.voting_rights} onChange={e => setNewClassForm({...newClassForm, voting_rights: e.target.value})} />
                <RightTextArea label="Dividend Rights" value={newClassForm.dividend_rights} onChange={e => setNewClassForm({...newClassForm, dividend_rights: e.target.value})} />
                <RightTextArea label="Redemption Rights" value={newClassForm.redemption_rights} onChange={e => setNewClassForm({...newClassForm, redemption_rights: e.target.value})} />
                <RightTextArea label="Conversion Rights" value={newClassForm.conversion_rights} onChange={e => setNewClassForm({...newClassForm, conversion_rights: e.target.value})} />
                <div className="col-span-2">
                   <RightTextArea label="Transfer Restrictions" value={newClassForm.transfer_restrictions} onChange={e => setNewClassForm({...newClassForm, transfer_restrictions: e.target.value})} />
                </div>
                <div className="w-1/2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Liquidation Priority (1=High)</label>
                    <input type="number" value={newClassForm.liquidation_priority} onChange={e => setNewClassForm({...newClassForm, liquidation_priority: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-black mt-2" />
                </div>
             </div>
          </div>

          <button type="submit" className="w-full bg-[#1a3b70] text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
             Save & Enable Class in Registry
          </button>
       </form>
    </div>
  </div>
)}

    </div>
  );
};

const CapitalCard = ({ title, value, color, isMain }) => (
  <div className={`p-8 rounded-[2.5rem] shadow-sm border border-slate-100 ${isMain ? 'bg-white border-b-4 border-b-emerald-500' : 'bg-white/50'}`}>
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
     <p className={`text-3xl font-black ${color}`}>{Number(value || 0).toLocaleString()} <span className="text-xs font-bold">ETB</span></p>
  </div>
);

const RightInput = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <textarea 
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 h-24 transition-all" 
      {...props} 
    />
  </div>
);

const StatusMiniCard = ({ label, value, color }) => (
  <div className="flex-1 flex flex-col items-center">
     <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
     </div>
     <p className="text-2xl font-black text-slate-800">{value}</p>
  </div>
);

const RightTextArea = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <textarea 
      value={value} 
      onChange={onChange}
      placeholder={`Define ${label.toLowerCase()}...`}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-[#1a3b70] h-28 transition-all"
    />
  </div>
);

const FormInput = ({ label, type = "text", ...props }) => (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type} 
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 focus:bg-white transition-all shadow-sm" 
        {...props} 
      />
    </div>
);


export default CapitalModule;
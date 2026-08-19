import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Printer, FileDown, ShieldAlert, CheckCircle, X, 
  ExternalLink, RefreshCw, FileSpreadsheet, Loader2, History, Eye, Save, ChevronLeft, 
  ChevronRight, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import CertificateTemplate from './CertificateTemplate';
import Api from './api'; // Import the centralized API instance

// --- TOAST NOTIFICATION ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 bg-[#1a3b70] text-white p-5 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}><CheckCircle size={20} className="text-white" /></div>
      <div><p className="text-[10px] font-black uppercase text-yellow-400 leading-none mb-1">Registry Alert</p><p className="text-xs font-bold">{message}</p></div>
      <button onClick={onClose} className="ml-4 opacity-30 hover:opacity-100"><X size={16}/></button>
    </div>
  );
};

const CertificateModule = () => {
  // --- STATES ---
  const [certs, setCerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewCert, setViewCert] = useState(null);
  
  // Re-issue States
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [targetCert, setTargetCert] = useState(null);
  const [reissueForm, setReissueForm] = useState({ reason: 'Lost', reportNo: '' });
  const [policeFile, setPoliceFile] = useState(null);
  const [indemnityFile, setIndemnityFile] = useState(null);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Error in Entry');
  const [sysParams, setSysParams] = useState([]);

  // General UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showNotification = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  const currentUser = localStorage.getItem('userName') || 'Admin';
  
    const [showHistory, setShowHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
const [currentPage, setCurrentPage] = useState(1);
const limit = 10; // Show exactly 10 as requested
// --- ADD THESE STATES AROUND LINE 40 ---
const [showValidator, setShowValidator] = useState(false);
const [verifyInput, setVerifyInput] = useState('');
const [verificationResult, setVerificationResult] = useState(null);
const [isValidating, setIsValidating] = useState(false);

const userRole = localStorage.getItem('userRole');
const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
const [selectedLanguage, setSelectedLanguage] = useState('AMH');

// THE SECURITY GATEKEEPER
const can = (permissionKey) => {
    if (userRole === 'Admin') return true; // Admin bypass
    return userPermissions.includes(permissionKey);
};

  useEffect(() => {
      // Fetch system parameters once when the module loads
      Api.get('/api/parameters')
          .then(res => setSysParams(res.data))
          .catch(err => console.error("Error fetching parameters:", err));
  }, []);

const viewAuditTrail = async (certNo) => {
    try {
        // We now pass the certNo as a query parameter (?certNo=...)
        // This is safe even if the certNo has slashes / / /
        const res = await Api.get(`/api/reports/audit-search`, {
            params: { certNo: certNo }
        });
        
        setAuditLogs(res.data);
        setShowHistory(true);
    } catch (err) { 
        console.error("Fetch Error:", err);
        showNotification("Failed to fetch audit logs. Check console for details.", "error"); 
    }
};
  // --- ACTIONS ---
const fetchCerts = () => {
    Api.get(`/api/certificates?page=${currentPage}&limit=${limit}&search=${searchTerm}&status=${statusFilter}`)
      .then(res => {
          setCerts(res.data.data || []);
          setPagination(res.data.pagination);
      })
      .catch(err => console.log(err));
};


const handleManualVerify = async () => {
    if (!verifyInput.trim()) return showNotification("Please enter a certificate number", "error");
    
    setIsValidating(true);
    setVerificationResult(null);
    try {
        // We use encodeURIComponent because certificate numbers have slashes (/)
        const res = await Api.get(`/api/verify/${encodeURIComponent(verifyInput)}`);
        setVerificationResult(res.data);
        showNotification("Certificate Verified: Authentic Record Found.");
    } catch (err) {
        setVerificationResult({ error: true });
        showNotification("Invalid Certificate: No record found.", "error");
    } finally {
        setIsValidating(false);
    }
};

// Re-fetch when page, search, or status changes
useEffect(() => { fetchCerts(); }, [currentPage, searchTerm, statusFilter]);

  // 1. MAKER: Submit Re-issue Request (Section 2.5.4)
  const handleReissueSubmit = async (e) => {
    e.preventDefault();
    if (!policeFile || !indemnityFile) return showNotification("Upload required legal docs", "error");
    setIsSubmitting(true);
    const data = new FormData();
    data.append('old_cert_id', targetCert.id);
    data.append('shareholder_id', targetCert.shareholder_id);
    data.append('shares_count', targetCert.shares_count);
    data.append('reason', reissueForm.reason);
    data.append('police_report', policeFile);
    data.append('indemnity_form', indemnityFile);
    data.append('performed_by', currentUser);

    try {
        await Api.post('/api/certificates/re-issue-request', data);
        showNotification("Replacement request sent to Checker");
        setShowReissueModal(false);
        fetchCerts();
    } catch (err) { showNotification("Request failed", "error"); }
    finally { setIsSubmitting(false); }
  };

  // 2. MAKER: Request Cancellation (Section 2.5.5)
  const handleCancelRequest = async () => {
      try {
          await Api.put(`/api/certificates/${targetCert.id}/request-cancel`, { 
              reason: cancelReason, 
              user: currentUser 
          });
          showNotification("Cancellation requested successfully");
          setShowCancelModal(false);
          fetchCerts();
      } catch (err) { showNotification("Request failed", "error"); }
  };

  // 3. CHECKER: Final Approval Logic
  const handleFinalApprove = async (c) => {
      const url = c.status === 'Pending Cancellation' 
        ? `/api/certificates/${c.id}/approve-cancel`
        : `/api/certificates/${c.id}/approve-replacement`;
      
      try {
          await Api.put(url, { performed_by: currentUser });
          showNotification("Authorization Successful!");
          fetchCerts();
      } catch (err) { showNotification("Approval failed", "error"); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />}
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
           <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter">Certificate Registry</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section 2.5 Compliance Hub</p>
        </div>
        <div className="flex gap-4">
   {/* NEW VERIFY BUTTON */}
   <button 
      onClick={() => { setVerificationResult(null); setVerifyInput(''); setShowValidator(true); }}
      className="bg-white border-2 border-[#1a3b70] text-[#1a3b70] px-6 py-4 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
   >
      <ShieldCheck size={18} /> VERIFY DOCUMENT
   </button>

   <button onClick={() => window.open('/api/certificates/export', '_blank')} className="...">
      <FileDown size={18} /> EXPORT REGISTER
   </button>
</div>
        
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex gap-4">
         <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-yellow-400 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
  type="text"
  value={searchTerm}
  onChange={(e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  }}
  placeholder="Search by Certificate No or Holder Name..."
  className="bg-transparent border-none outline-none text-sm w-full font-bold text-[#1a3b70]"
/>
         </div>
         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-xl px-6 text-[10px] font-black uppercase text-slate-500 cursor-pointer">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending Approval</option>
            <option value="Cancelled">Cancelled</option>
         </select>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Certificate No</th>
              <th className="px-8 py-6">Holder Details</th>
              <th className="px-8 py-6">Shares</th>
              <th className="px-8 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-right px-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
  {certs.map((c) => (
    <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
      <td className="px-8 py-5 font-black text-[#1a3b70] text-xs underline">{c.certificate_no}</td>
      <td className="px-8 py-5">
          <p className="text-xs font-black text-slate-800">{c.full_name}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase">{c.sh_code}</p>
      </td>
      <td className="px-8 py-5 text-xs font-bold text-slate-600">{Number(c.shares_count).toLocaleString()}</td>
      <td className="px-8 py-5 text-center">
          <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase ${
            c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            c.status.includes('Pending') ? 'bg-amber-50 text-amber-600 border-amber-100' :
            'bg-red-50 text-red-600 border-red-100'
          }`}>{c.status}</span>
      </td>
      <td className="px-8 py-5 text-right px-12 flex justify-end gap-2">
        
        {/* 1. CHECKER BUTTON: Authorize (Secured with cert_approve) */}
        {c.status.includes('Pending') && can('cert_approve') && (
            <button 
              onClick={() => handleFinalApprove(c)} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95"
            >
              Authorize
            </button>
        )}

{/* 2. PRINT BILINGUAL BUTTON */}
{c.status === 'Active' && can('cert_print') && (
    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm">
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="text-[9px] font-black bg-transparent border-none outline-none text-[#1a3b70] cursor-pointer px-1"
        >
            <option value="AMH">AMH/EN</option>
            <option value="ORO">ORO/EN</option>
        </select>
        <button 
          onClick={() => setViewCert(c)} 
          className="p-1.5 bg-[#1a3b70] text-white rounded-lg hover:bg-blue-800 transition-all" 
          title="Generate Official Certificate"
        >
          <Printer size={14}/>
        </button>
    </div>
)}

        {/* 3. RE-ISSUE BUTTON: Secured with cert_reissue */}
        {c.status === 'Active' && can('cert_reissue') && (
            <button 
              onClick={() => { setTargetCert(c); setShowReissueModal(true); }} 
              className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              title="Request Replacement"
            >
              <RefreshCw size={14}/>
            </button>
        )}

        {/* 4. VOID BUTTON: Secured with cert_cancel (Fixed Typo) */}
        {c.status === 'Active' && can('cert_cancel') && (
            <button 
              onClick={() => { setTargetCert(c); setShowCancelModal(true); }} 
              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Void Record"
            >
              <X size={14}/>
            </button>
        )}

        {/* 5. HISTORY BUTTON: Secured with cert_audit */}
        {can('cert_audit') && (
            <button 
              onClick={() => viewAuditTrail(c.certificate_no)} 
              className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
              title="View History"
            >
              <History size={14}/>
            </button>
        )}
      </td>
    </tr>
  ))}
          </tbody>
        </table>

{/* --- ADD THIS PAGINATION FOOTER --- */}
<div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-12">
  <div className="flex flex-col">
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Showing <span className="text-[#1a3b70]">{(currentPage - 1) * limit + 1}</span> to <span className="text-[#1a3b70]">{Math.min(currentPage * limit, pagination.totalRecords)}</span>
     </p>
     <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Total Registry: {pagination.totalRecords} Certificates</p>
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
       )).slice(0, 5)} {/* Slice limits visible numbers if you have 50+ pages */}
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

      {/* --- MODALS --- */}
{viewCert && (
  <CertificateTemplate 
    data={viewCert} 
    params={sysParams} // <--- Pass the fetched params here
    language={selectedLanguage} 
    onClose={() => setViewCert(null)} 
  />
)}
      {/* Re-issue Modal (Section 2.5.4) */}
      {showReissueModal && targetCert && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[130] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Request Replacement</h3>
                 <button onClick={() => setShowReissueModal(false)}><X className="text-slate-300" /></button>
              </div>
              <form onSubmit={handleReissueSubmit} className="p-10 space-y-8 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-6">
                    <FormSelect label="Reason" options={['Lost', 'Stolen', 'Damaged']} onChange={e => setReissueForm({...reissueForm, reason: e.target.value})} />
                    <FormInput label="Police Report No" onChange={e => setReissueForm({...reissueForm, reportNo: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Police Report PDF</label><input type="file" onChange={e => setPoliceFile(e.target.files[0])} className="text-xs" /></div>
                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Indemnity Form PDF</label><input type="file" onChange={e => setIndemnityFile(e.target.files[0])} className="text-xs" /></div>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full bg-[#1a3b70] text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Submit Replacement Request
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Cancellation Modal (Section 2.5.5) */}
      {showCancelModal && targetCert && (
        <div className="fixed inset-0 bg-red-900/20 backdrop-blur-md z-[130] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-black text-slate-800 tracking-tighter mb-4">Void Certificate</h3>
              <p className="text-xs text-slate-400 mb-8 font-medium">Warning: This action will permanently invalidate the document in the master registry.</p>
              <FormSelect label="Reason for Voiding" options={['Error in Entry', 'Share Buy-back', 'Consolidation']} onChange={e => setCancelReason(e.target.value)} />
              <div className="flex gap-4 mt-8 pt-4">
                 <button onClick={() => setShowCancelModal(false)} className="flex-1 text-xs font-black text-slate-400 uppercase tracking-widest">Abort</button>
                 <button onClick={handleCancelRequest} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-red-100 transition-all active:scale-95">Request Void</button>
              </div>
           </div>
        </div>
      )}

      {/* --- AUDIT HISTORY MODAL (Section 2.5.8 Compliance) --- */}
{showHistory && (
  <div className="fixed inset-0 bg-[#1a3b70]/60 backdrop-blur-sm z-[250] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
       <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
             <History className="text-blue-600" size={20} /> Certificate Lifecycle Audit
          </h3>
          <X className="text-slate-300 cursor-pointer hover:text-red-500" onClick={() => setShowHistory(false)} />
       </div>
       <div className="flex-1 overflow-y-auto p-8 space-y-4 max-h-[60vh]">
          {auditLogs.map((log, i) => (
             <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 w-24 leading-tight uppercase">
                   {new Date(log.created_at).toLocaleDateString()}<br/>
                   {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex-1 border-l-2 border-yellow-400 pl-6">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.action_type}</p>
                   <p className="text-xs font-bold text-slate-700 mt-1">
   {/* SAFE PARSING: Handles cases where details might already be an object or a string */}
   {(() => {
      try {
         const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
         return details.event || 'System Action Performed';
      } catch (e) {
         return 'Registry Update Logged';
      }
   })()}
</p>
                   <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Performed by: {log.performed_by}</p>
                </div>
             </div>
          ))}
          {auditLogs.length === 0 && <p className="text-center py-10 text-slate-400 italic">No historical logs found.</p>}
       </div>
       <div className="p-6 bg-slate-50 border-t flex justify-end">
          <button onClick={() => setShowHistory(false)} className="bg-[#1a3b70] text-white px-10 py-3 rounded-xl text-xs font-bold uppercase shadow-lg">Close Audit</button>
       </div>
    </div>
  </div>
)}

{/* --- REGISTRY VALIDATOR MODAL (Requirement 2.5.7) --- */}
{showValidator && (
  <div className="fixed inset-0 bg-[#1a3b70]/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 text-center relative">
       
       <button onClick={() => setShowValidator(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X /></button>

       <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#1a3b70]">
          <ShieldAlert size={40} />
       </div>

       <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Registry Validator</h3>
       <p className="text-xs text-slate-400 mb-8 font-medium">Verify the authenticity of a physical share certificate.</p>
       
       <div className="space-y-4">
          <input 
             type="text" 
             placeholder="Enter Cert No (e.g. CERT/2026/AA/00001)" 
             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-center font-mono font-bold text-lg outline-none focus:border-yellow-400 transition-all"
             value={verifyInput}
             onChange={(e) => setVerifyInput(e.target.value)}
          />

          <button 
            onClick={handleManualVerify}
            disabled={isValidating}
            className="w-full bg-[#1a3b70] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
             {isValidating ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
             Run Authenticity Check
          </button>
       </div>

       {/* RESULTS AREA */}
       {verificationResult && !verificationResult.error && (
          <div className="mt-8 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-in fade-in slide-in-from-bottom-4">
             <p className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-[0.2em]">Verified Authentic Record</p>
             <div className="space-y-2 text-left">
                <div className="flex justify-between border-b border-emerald-100 pb-2">
                   <span className="text-[10px] font-bold text-emerald-800/50 uppercase">Holder</span>
                   <span className="text-xs font-black text-emerald-900">{verificationResult.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-2">
                   <span className="text-[10px] font-bold text-emerald-800/50 uppercase">Shares</span>
                   <span className="text-xs font-black text-emerald-900">{verificationResult.shares_count?.toLocaleString()} Units</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-[10px] font-bold text-emerald-800/50 uppercase">Status</span>
                   <span className="text-[10px] font-black text-white bg-emerald-500 px-2 rounded">ACTIVE</span>
                </div>
             </div>
          </div>
       )}

       {verificationResult?.error && (
          <div className="mt-8 p-6 bg-red-50 rounded-[2rem] border border-red-100 animate-in shake duration-500">
             <p className="text-sm font-black text-red-600 uppercase">Invalid Certificate</p>
             <p className="text-[10px] text-red-400 mt-1 font-bold">This number does not exist in the official Rammis Bank Registry.</p>
          </div>
       )}
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
      <input type={type} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all shadow-sm" {...props} />
    </div>
);
const FormSelect = ({ label, options, ...props }) => (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer shadow-sm" {...props}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
);

export default CertificateModule;
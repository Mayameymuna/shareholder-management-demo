import React, { useState, useEffect } from 'react';
import { 
  Coins, Plus, Calculator, CheckCircle, FileText, Landmark, 
  Wallet, X, ArrowUpRight, Percent, Loader2, ChevronRight, RefreshCw, Download, History
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
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Finance Alert</p>
        <p className="text-xs font-bold mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-30 hover:opacity-100"><X size={16} /></button>
    </div>
  );
};

const DividendModule = () => {
  const [declarations, setDeclarations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedRun, setSelectedRun] = useState(null);
  const [payoutsPreview, setPayoutsPreview] = useState([]);
  const [activeSubView, setActiveSubView] = useState('runs'); // 'runs' or 'register'
const [showAudit, setShowAudit] = useState(false);
const [dividendLogs, setDividendLogs] = useState([]);

  const INITIAL_FORM_STATE = { 
    year: '2025/26', 
    share_class_id: 1, 
    type: 'Final', 
    rate: '', 
    decl_date: new Date().toISOString().split('T')[0], 
    record_date: '', 
    ex_date: '', 
    pay_date: '', 
    tax: 10, 
    board_res: '', 
    sh_res: '' 
  };

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const currentUser = localStorage.getItem('userName') || 'Admin';

  useEffect(() => { fetchDividends(); }, []);
  const fetchDividends = () => API.get('/api/dividends').then(res => setDeclarations(res.data));
  const showNotification = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  const handleDeclare = async (e) => {
    e.preventDefault();
    try {
        await API.post('/api/dividends/declare', { ...formData, performed_by: currentUser });
        showNotification("Dividend Declaration Logged Successfully!");
        setShowModal(false);
        fetchDividends();
    } catch (err) { showNotification("Declaration failed", "error"); }
  };

  const handleApproveRun = async (id) => {
    if (window.confirm("CRITICAL: Approve and lock this dividend run? This will finalize the payment schedule.")) {
        try {
            await API.put(`/api/dividends/${id}/approve`, { performed_by: currentUser });
            showNotification("Dividend Run Approved. Batch file ready.");
            fetchDividends();
        } catch (err) { showNotification("Approval failed", "error"); }
    }
};

  const runCalculation = async (id) => {
    setIsProcessing(true);
    try {
        const res = await API.post(`/api/dividends/${id}/calculate`);
        showNotification(`Success: Calculated entitlements for ${res.data.count} members!`);
        fetchDividends();
    } catch (err) { showNotification("Calculation error", "error"); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 relative">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, show: false})} />}

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter italic">Dividend Management</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section 2.7 • Profit Distribution Hub</p>
         </div>
         <button onClick={() => { setFormData(INITIAL_FORM_STATE); setShowModal(true); }} className="bg-[#1a3b70] text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl active:scale-95 transition-all">
            <Plus size={18} className="text-yellow-400" /> NEW DIVIDEND RUN
         </button>
      </div>

<div className="flex gap-6 mb-8 border-b border-slate-100 pb-2">
   <button 
      onClick={() => setActiveSubView('runs')}
      className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 transition-all ${activeSubView === 'runs' ? 'text-[#1a3b70] border-b-2 border-[#1a3b70]' : 'text-slate-300 hover:text-slate-500'}`}
   >
      1. Declarations & Runs
   </button>
   <button 
      onClick={() => setActiveSubView('register')}
      className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 transition-all ${activeSubView === 'register' ? 'text-[#1a3b70] border-b-2 border-[#1a3b70]' : 'text-slate-300 hover:text-slate-500'}`}
   >
      2. Master Dividend Register
   </button>
</div>

      {/* ACTIVE DIVIDEND RUNS */}
      <div className="grid grid-cols-1 gap-6">
         {declarations.map(d => (
            <div key={d.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-[#1a3b70] transition-all">
               <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-[#1a3b70]">
                     <Coins size={32} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Year {d.financial_year}</p>
                     <h4 className="text-xl font-black text-slate-800">{d.dividend_per_share} ETB <span className="text-xs font-normal text-slate-400">per share</span></h4>
                  </div>
                  <div className="border-l border-slate-100 pl-8">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
                     <span className={`text-[10px] font-black uppercase ${d.status === 'Ready for Approval' ? 'text-blue-600' : 'text-amber-500'}`}>{d.status}</span>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  {d.status === 'Draft' && (
                     <button 
                        onClick={() => runCalculation(d.id)}
                        disabled={isProcessing}
                        className="bg-[#1a3b70] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"
                     >
                        {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <Calculator size={14}/>}
                        Calculate Payouts
                     </button>
                  )}
{d.status === 'Ready for Approval' && (
        <button 
           onClick={() => handleApproveRun(d.id)}
           className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
        >
           Approve & Lock
        </button>
    )}

    {d.status === 'Approved' && (
        <button 
           onClick={() => window.open(`${API.defaults.baseURL}/api/dividends/${d.id}/export-schedule`, '_blank')}
           className="bg-[#1a3b70] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"
        >
           <Download size={14} className="text-yellow-400" /> Download Bank Batch
        </button>
    )}
    <button 
   onClick={async () => {
      const res = await API.get(`${API.defaults.baseURL}/api/dividends/${d.id}/audit`);
      setDividendLogs(res.data);
      setShowAudit(true);
   }}
   className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#1a3b70] hover:text-white transition-all"
   title="View Calculation Audit"
>
   <History size={18}/>
</button>
</div>

            </div>
         ))}
      </div>

      {/* NEW RUN MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[150] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-lg"><Plus /></div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Dividend Declaration</h3>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 bg-white rounded-xl shadow-sm hover:text-red-500"><X /></button>
              </div>
              <form onSubmit={handleDeclare} className="flex-1 overflow-y-auto p-12 space-y-10">
                 <div className="grid grid-cols-3 gap-8">
                    <FormInput label="Financial Year" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="2025/26" required />
                    <FormSelect label="Dividend Type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={['Interim', 'Final', 'Special', 'Bonus']} />
                    <FormInput label="Dividend Rate (ETB)" type="number" step="0.0001" onChange={e => setFormData({...formData, rate: e.target.value})} required />
                 </div>
                 <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-4 gap-6">
                    <FormInput label="Decl. Date" type="date" value={formData.decl_date} onChange={e => setFormData({...formData, decl_date: e.target.value})} />
                    <FormInput label="Record Date" type="date" onChange={e => setFormData({...formData, record_date: e.target.value})} required />
                    <FormInput label="Ex-Div Date" type="date" onChange={e => setFormData({...formData, ex_date: e.target.value})} />
                    <FormInput label="Pay Date" type="date" onChange={e => setFormData({...formData, pay_date: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-3 gap-8">
                    <FormInput label="Board Resolution" onChange={e => setFormData({...formData, board_res: e.target.value})} required />
                    <FormInput label="SH Resolution" onChange={e => setFormData({...formData, sh_res: e.target.value})} />
                    <FormInput label="Tax Rate (%)" type="number" value={formData.tax} onChange={e => setFormData({...formData, tax: e.target.value})} />
                 </div>
              </form>
              <div className="p-8 border-t bg-slate-50 flex justify-end gap-5">
                 <button onClick={() => setShowModal(false)} className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                 <button type="submit" className="bg-[#1a3b70] text-white px-12 py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                    Initialize Dividend Run
                 </button>
              </div>
           </div>
        </div>
      )}

      {selectedRun && (
  <div className="fixed inset-0 bg-[#1a3b70]/90 backdrop-blur-md z-[160] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
       <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <div>
             <h3 className="text-xl font-black text-slate-800 uppercase">Review Dividend Entitlements</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Calculated for {selectedRun.financial_year} • Rate: {selectedRun.dividend_per_share} ETB</p>
          </div>
          <button onClick={() => setSelectedRun(null)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"><X /></button>
       </div>

       <div className="flex-1 overflow-y-auto p-8">
          <table className="w-full text-left">
             <thead className="bg-white sticky top-0 font-black text-[10px] text-slate-400 uppercase tracking-widest border-b">
                <tr>
                   <th className="py-4">Shareholder</th>
                   <th className="py-4">Shares held</th>
                   <th className="py-4">Gross Div.</th>
                   <th className="py-4">Tax (10%)</th>
                   <th className="py-4 text-right">Net Payout</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {payoutsPreview.map(p => (
                   <tr key={p.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50/50">
                      <td className="py-4">{p.full_name}</td>
                      <td className="py-4">{p.shares_at_record_date}</td>
                      <td className="py-4">{Number(p.gross_dividend).toLocaleString()}</td>
                      <td className="py-4 text-red-400">-{Number(p.tax_withheld).toLocaleString()}</td>
                      <td className="py-4 text-right text-emerald-600">{Number(p.net_dividend).toLocaleString()} ETB</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       <div className="p-8 border-t bg-slate-50 flex justify-between items-center">
          <button 
            onClick={() => { runCalculation(selectedRun.id); setSelectedRun(null); }}
            className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase hover:underline"
          >
             <RefreshCw size={14}/> Recalculate (Requirement 2.2.5)
          </button>
          <button onClick={() => setSelectedRun(null)} className="bg-[#1a3b70] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Close Review</button>
       </div>
    </div>
  </div>
)}

{showAudit && (
  <div className="fixed inset-0 bg-[#1a3b70]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
       <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
             <History className="text-blue-600" /> Dividend Lifecycle Audit
          </h3>
          <X className="text-slate-300 cursor-pointer" onClick={() => setShowAudit(false)} />
       </div>
       <div className="flex-1 overflow-y-auto p-8 space-y-4 max-h-[60vh]">
          {dividendLogs.map((log, i) => (
             <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 w-24 leading-tight uppercase">
                   {new Date(log.created_at).toLocaleDateString()}<br/>
                   {new Date(log.created_at).toLocaleTimeString()}
                </div>
                <div className="flex-1 border-l-2 border-yellow-400 pl-6">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.action_type}</p>
                   <p className="text-xs font-bold text-slate-700 mt-1">{JSON.parse(log.details).event}</p>
                   <p className="text-[10px] text-slate-400 mt-1 font-medium italic">By: {log.performed_by}</p>
                </div>
             </div>
          ))}
       </div>
       <div className="p-6 bg-slate-50 border-t flex justify-end">
          <button onClick={() => setShowAudit(false)} className="bg-[#1a3b70] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase shadow-lg">Close Audit</button>
       </div>
    </div>
  </div>
)}
    </div>
  );
};

// --- HELPER COMPONENTS (Single definition) ---
const FormInput = ({ label, type = "text", ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input type={type} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 focus:bg-white transition-all shadow-sm" {...props} />
    </div>
);

const FormSelect = ({ label, options, ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm" {...props}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
);

export default DividendModule;
import React, { useState, useEffect } from 'react';
import { 
  Send, Users, Edit3, Loader2, CheckCircle, XCircle, 
  Play, Square, Save, MessageSquare, History, Search, RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance 

const SMSPortalModule = () => {
    // UI Navigation
    const [activeTab, setActiveTab] = useState('bulk'); // 'bulk', 'templates', 'logs'
    
    // Data States
    const [templates, setTemplates] = useState([]);
    const [shList, setShList] = useState([]);
    const [selectedSh, setSelectedSh] = useState([]);
    const [bulkMsg, setBulkMsg] = useState('');
    
    // Broadcast Engine States
    const [isProcessing, setIsProcessing] = useState(false);
    const [stopRequested, setStopRequested] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ sent: 0, failed: 0 });
    const [failedLogs, setFailedLogs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [shFilter, setShFilter] = useState('all'); // 'all', 'active', 'missing_id', 'has_debt'
    const [activeCampaign, setActiveCampaign] = useState(null);

    const checkProgress = async () => {
    if (!activeCampaign) return;
    const res = await API.get(`/api/sms/campaign-status/${activeCampaign}`);
    setStats(res.data); // e.g. { total: 100, sent: 50, delivered: 20, failed: 2 }
    
    if (res.data.pending === 0) {
        setActiveCampaign(null);
        alert("Campaign Fully Processed!");
    }
};

    const filteredShList = shList.filter(sh => {
    if (shFilter === 'active') return sh.status === 'Active';
    if (shFilter === 'pending_nbe') return sh.status === 'Pending NBE Approval';
    if (shFilter === 'missing_id') return !sh.id_doc_path || !sh.agreement_doc_path;
    if (shFilter === 'has_debt') return (sh.no_of_share_birr - sh.paidup_birr) > 0;
    return true; // 'all'
});

    const currentUser = localStorage.getItem('userName') || 'Admin';

    // 1. Fetch data on load
const fetchLogs = () => {
    API.get('/api/sms/logs').then(res => setLogs(res.data));
};

useEffect(() => {
    let timer;
    if (activeCampaign) {
        timer = setInterval(checkProgress, 3000);
    }
    return () => clearInterval(timer);
}, [activeCampaign]);

// Update your existing useEffect to include fetchLogs
useEffect(() => {
    fetchInitialData();
    fetchLogs(); // Add this
}, []);

    const fetchInitialData = () => {
        API.get('/api/sms/templates').then(res => setTemplates(res.data));
        API.get('/api/shareholders?limit=500').then(res => setShList(res.data.data || []));
    };

    // 2. The Professional Bulk Dispatcher Engine
    const runBroadcast = async () => {
        if (!bulkMsg || selectedSh.length === 0) return alert("Setup message and recipients first.");
        
        setIsProcessing(true);
        setStopRequested(false);
        setStats({ sent: 0, failed: 0 });
        setFailedLogs([]);
        setProgress(0);

        // Prepare the specific list of data
        const res = await API.post('/api/sms/prepare-broadcast', { recipientIds: selectedSh });
        const queue = res.data;

        for (let i = 0; i < queue.length; i++) {
            // Check for emergency stop
            if (stopRequested) {
                console.warn("🛑 Broadcast manually stopped by user.");
                break;
            }

            const person = queue[i];
            const debtAmount = Number(person.no_of_share_birr - person.paidup_birr).toLocaleString();

const personalizedMsg = bulkMsg
    .replace('[NAME]', person.full_name)
    .replace('[AMOUNT]', debtAmount);

            try {
                // Send one by one via the single-route for better tracking
                await API.post('/api/sms/send-single', {
                    phone: person.phone,
                    message: personalizedMsg,
                    sh_id: person.id
                });
                setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
            } catch (err) {
                setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
                setFailedLogs(prev => [...prev, { name: person.full_name, phone: person.phone, error: "Gateway Timeout" }]);
            }

            // Update Progress UI
            setProgress(Math.round(((i + 1) / queue.length) * 100));
            
            // 200ms Delay to avoid gateway flood and account for network latency
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        setIsProcessing(false);
        setSelectedSh([]); // Reset selection
        alert("Broadcast Operation Finished.");
    };

    // 3. Template Update Handler (RESTORED)
    const handleUpdateTemplate = async (id, newBody) => {
        try {
            await API.put(`/api/sms/templates/${id}`, { body: newBody });
            // Flash a quick "Saved" state if you want, or just refresh
            fetchInitialData();
        } catch (err) { alert("Save failed"); }
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            {/* TAB SELECTOR - Professional Rounded Navigation */}
            <div className="flex gap-4 bg-white p-2 rounded-2xl w-fit border border-slate-100 shadow-sm">
                <button 
                    onClick={() => setActiveTab('bulk')} 
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-[#1a3b70] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <Send size={16}/> Bulk Broadcast
                </button>
                <button 
                    onClick={() => setActiveTab('templates')} 
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'templates' ? 'bg-[#1a3b70] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <Edit3 size={16}/> Automated Templates
                </button>

                    <button onClick={() => { setActiveTab('logs'); fetchLogs(); }} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-[#1a3b70] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
        <History size={16}/> Audit Logs
    </button>

            </div>

            {/* TAB CONTENT: BULK BROADCAST */}
            {activeTab === 'bulk' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: COMPOSER & PROGRESS */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6">Campaign Composer</h3>
                            <textarea 
                                disabled={isProcessing}
                                value={bulkMsg}
                                onChange={e => setBulkMsg(e.target.value)}
                                placeholder="Type your broadcast message... Use [NAME] to inject shareholder name."
                                className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-medium outline-none focus:border-[#1a3b70] transition-all"
                            />
                            
                            {/* PROGRESS BAR (Only shows when sending) */}
                            {isProcessing && (
                                <div className="mt-8 p-6 bg-slate-50 rounded-3xl animate-in slide-in-from-top-4 border border-slate-200">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Processing Queue...</p>
                                            <p className="text-3xl font-black text-[#1a3b70]">{progress}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-emerald-500">SENT: {stats.sent}</p>
                                            <p className="text-[10px] font-bold text-red-500">FAILED: {stats.failed}</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                                        <div className="h-full bg-[#1a3b70] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mt-8">
                                {!isProcessing ? (
                                    <button 
                                        onClick={runBroadcast} 
                                        className="flex-1 bg-[#1a3b70] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 hover:bg-blue-900 transition-all active:scale-95"
                                    >
                                        <Play size={18} className="text-yellow-400" /> Dispatch to {selectedSh.length} Members
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setStopRequested(true)} 
                                        className="flex-1 bg-red-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                    >
                                        <Square size={18} /> Stop Dispatch
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* FAILED LISTING */}
                        {failedLogs.length > 0 && (
                            <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 animate-in slide-in-from-bottom-2">
                                <h4 className="text-[10px] font-black text-red-600 uppercase mb-4 tracking-widest flex items-center gap-2">
                                    <XCircle size={14}/> Dispatch Failures
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {failedLogs.map((log, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-bold text-red-800 bg-white p-3 rounded-xl border border-red-100">
                                            <span>{log.name}</span>
                                            <span className="font-mono">{log.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

{/* RIGHT: SMART RECIPIENT SELECTOR */}
<div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[650px]">
    <div className="p-6 border-b bg-slate-50/50 space-y-4">
        <div className="flex justify-between items-center">
            <h4 className="font-black text-xs text-[#1a3b70] uppercase">Registry Selection</h4>
            <div className="flex gap-2">
               <button onClick={() => setSelectedSh(filteredShList.map(s => s.id))} className="text-[8px] font-black text-blue-600 uppercase border border-blue-200 px-2 py-1 rounded-md hover:bg-blue-50">Select Visible</button>
               <button onClick={() => setSelectedSh([])} className="text-[8px] font-black text-red-400 uppercase border border-red-100 px-2 py-1 rounded-md hover:bg-red-50">Clear</button>
            </div>
        </div>

        {/* --- THE SMART FILTER BAR --- */}
        <div className="grid grid-cols-2 gap-2">
            <select 
                value={shFilter} 
                onChange={(e) => { setShFilter(e.target.value); setSelectedSh([]); }}
                className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-[#1a3b70]"
            >
                <option value="all">All Shareholders</option>
                <option value="active">Verified Active Members</option>
                <option value="pending_nbe">Post-Nov 24 (Staging)</option>
                <option value="missing_id">⚠️ Missing National ID/Docs</option>
                <option value="has_debt">💸 Outstanding Balance</option>
            </select>
        </div>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filteredShList.map(sh => (
            <label key={sh.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${selectedSh.includes(sh.id) ? 'bg-[#1a3b70] border-[#1a3b70] text-white' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        checked={selectedSh.includes(sh.id)}
                        onChange={() => {
                            if (selectedSh.includes(sh.id)) setSelectedSh(selectedSh.filter(i => i !== sh.id));
                            else setSelectedSh([...selectedSh, sh.id]);
                        }}
                        className="w-4 h-4 accent-yellow-400"
                    />
                    <div>
                        <p className={`text-xs font-black ${selectedSh.includes(sh.id) ? 'text-white' : 'text-slate-700'}`}>{sh.full_name}</p>
                        <div className="flex gap-2 items-center mt-0.5">
                            <p className={`text-[9px] font-bold ${selectedSh.includes(sh.id) ? 'text-blue-200' : 'text-slate-400'}`}>{sh.phone}</p>
                            {!sh.id_doc_path && <span className="text-[7px] bg-red-500 text-white px-1 rounded">NO ID</span>}
                        </div>
                    </div>
                </div>
            </label>
        ))}
        {filteredShList.length === 0 && (
            <div className="text-center py-10 opacity-30">
                <Search className="mx-auto mb-2" size={24} />
                <p className="text-[10px] font-bold uppercase">No matches found</p>
            </div>
        )}
    </div>
</div>
                </div>
            )}

            {/* TAB CONTENT: AUTOMATED TEMPLATES (RESTORED) */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-[#1a3b70] transition-all">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-black text-[#1a3b70] uppercase">{tpl.template_name}</h4>
                                    <div className="p-2 bg-slate-50 rounded-lg"><MessageSquare size={14} className="text-slate-300"/></div>
                                </div>
                                <textarea 
                                    defaultValue={tpl.message_body}
                                    onBlur={(e) => handleUpdateTemplate(tpl.id, e.target.value)}
                                    className="w-full h-40 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-yellow-400 rounded-3xl p-6 text-xs font-medium text-slate-600 outline-none transition-all"
                                />
                            </div>
                            <div className="mt-6 flex justify-between items-center">
                                <p className="text-[9px] text-slate-300 italic font-bold">Tags: [NAME], [ID], [AMOUNT], [REF]</p>
                                <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle size={10}/> Auto-saved on blur
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

          {activeTab === 'logs' && (
    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-[#1a3b70] uppercase tracking-tighter">Communication Audit Trail</h3>
            <button onClick={fetchLogs} className="p-2 hover:rotate-180 transition-all duration-500 text-slate-400"><RefreshCw size={20}/></button>
        </div>
        
        <table className="w-full text-left">
            <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b">
                <tr>
                    <th className="px-10 py-5">Timestamp</th>
                    <th className="px-10 py-5">Recipient</th>
                    <th className="px-10 py-5">Message Content</th>
                    <th className="px-10 py-5 text-center">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-10 py-4 text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-10 py-4 font-mono text-[#1a3b70]">{log.recipient_phone}</td>
                        <td className="px-10 py-4 max-w-md truncate" title={log.message_text}>
                            {log.message_text}
                        </td>
                        <td className="px-10 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                                log.status === 'SENT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                log.status === 'SIMULATED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                                {log.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {logs.length === 0 && <div className="p-20 text-center text-slate-300 italic uppercase text-xs font-bold">No message history found.</div>}
    </div>
)}  
        </div>
    );
};

export default SMSPortalModule;
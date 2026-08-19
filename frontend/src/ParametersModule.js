import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Landmark, Percent, Database, Loader2, 
  CheckCircle, Edit, X, FileText, UserCheck, Trash2, PlusCircle, ChevronRight, MessageSquare 
} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance 

const ParametersModule = () => {
    const [params, setParams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(null);
    const currentUser = localStorage.getItem('userName') || 'Admin';
    
    const [agents, setAgents] = useState([]);
    const [isEditingAgent, setIsEditingAgent] = useState(false);
    const [editId, setEditId] = useState(null);
    const [newAgent, setNewAgent] = useState({ name: '', code: '', phone: '' });
    const [agentFile, setAgentFile] = useState(null);
    
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', ref: '' });
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchParams();
        fetchAgents();
    }, []);

    const fetchParams = () => {
        API.get('/api/parameters').then(res => {
            setParams(res.data);
            setLoading(false);
        });
    };

    const fetchAgents = () => {
        API.get('/api/agents').then(res => setAgents(res.data));
    };

    const handleUpdate = async (key, value) => {
        setIsSaving(key);
        try {
            await API.post('/api/parameters/update', {
                param_key: key,
                param_value: value,
                performed_by: currentUser
            });
            setTimeout(() => setIsSaving(null), 1000);
        } catch (err) { alert("Update failed"); setIsSaving(null); }
    };

    const handleAgentSubmit = async () => {
        if (!newAgent.name.trim() || !newAgent.code.trim()) {
            alert("Name and Code are required.");
            return;
        }
        const data = new FormData();
        data.append('name', newAgent.name);
        data.append('code', newAgent.code);
        data.append('phone', newAgent.phone);
        if (agentFile) data.append('agreement_doc', agentFile);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (isEditingAgent) {
                await API.put(`/api/agents/${editId}`, data, config);
            } else {
                await API.post('/api/agents', data, config);
            }
            cancelEdit();
            setAgentFile(null);
            fetchAgents();
            alert(isEditingAgent ? "Agent Updated" : "Agent Added");
        } catch (err) { alert(err.response?.data?.error || "Action failed"); }
    };

    const cancelEdit = () => {
        setIsEditingAgent(false);
        setEditId(null);
        setNewAgent({ name: '', code: '', phone: '' });
    };

    const startEdit = (agent) => {
        setIsEditingAgent(true);
        setEditId(agent.id);
        setNewAgent({ name: agent.agent_name, code: agent.agent_code, phone: agent.phone });
    };

    // RESTORED — was present in the old file, missing from the new one, but still
    // referenced by the Trash2 delete button below.
    const handleDeleteAgent = async (id) => {
        if (window.confirm("Are you sure you want to deactivate this agent? They will no longer appear in registration forms.")) {
            try {
                await API.delete(`/api/agents/${id}`);
                fetchAgents();
            } catch (err) {
                alert(err.response?.data?.error || "Failed to deactivate agent");
            }
        }
    };

    const openWithdrawModal = (agent) => {
        setSelectedUser(agent);
        setWithdrawForm({ amount: '', ref: '' });
        setShowWithdrawModal(true);
    };

    const handleConfirmPayout = async () => {
        // RESTORED — old file validated before submitting; new file didn't.
        if (!withdrawForm.amount || isNaN(withdrawForm.amount)) {
            alert("Enter a valid amount.");
            return;
        }
        if (!withdrawForm.ref.trim()) {
            alert("Enter a bank reference / voucher number.");
            return;
        }
        try {
            await API.post('/api/agents/withdraw', {
                agent_id: selectedUser.id,
                amount: withdrawForm.amount,
                ref: withdrawForm.ref,
                user: currentUser
            });
            setShowWithdrawModal(false);
            fetchAgents();
        } catch (err) { alert(err.response?.data?.error || "Withdrawal failed"); }
    };

    // --- GROUPING LOGIC ---
    const categories = ['Finance', 'Accounts', 'Certificate', 'SMS'];

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black tracking-widest uppercase">Initializing Registry Controls...</div>;

    return (
        <div className="space-y-12 animate-in fade-in pb-20">
            {/* HEADER */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#1a3b70] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Bank Configuration</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                           <Database size={12} /> System Parameters & Agent Ledger
                        </p>
                    </div>
                </div>
            </div>

            {/* PARAMETERS ORGANIZED BY CATEGORY */}
            {categories.map(cat => (
                <div key={cat} className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <span className="text-[11px] font-black text-[#1a3b70] uppercase tracking-[0.3em]">{cat} Controls</span>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {params.filter(p => p.category === cat).map(p => (
                            <div key={p.param_key} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-[#1a3b70] transition-all relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{p.display_name}</label>
                                    {isSaving === p.param_key ? <Loader2 className="animate-spin text-blue-500" size={16}/> : <CheckCircle className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" size={16}/>}
                                </div>
                                <div className="relative z-10">
                                    {cat === 'Certificate' ? (
                                        <textarea 
                                            defaultValue={p.param_value}
                                            onBlur={(e) => handleUpdate(p.param_key, e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl p-4 text-xs font-bold text-[#1a3b70] outline-none transition-all h-24"
                                        />
                                    ) : (
                                        <input 
                                            type="text"
                                            defaultValue={p.param_value}
                                            onBlur={(e) => handleUpdate(p.param_key, e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl p-4 text-sm font-black text-[#1a3b70] outline-none transition-all"
                                        />
                                    )}
                                </div>
                                <p className="text-[8px] text-slate-300 font-mono mt-3 uppercase relative z-10">Internal Key: {p.param_key}</p>
                                {cat === 'Accounts' && <Landmark className="absolute -right-4 -bottom-4 text-slate-50" size={80} />}
                            
                            {p.category === 'SMS' && <MessageSquare className="text-orange-500" size={18}/>} {/* ADD THIS */}
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.category}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* AGENT MANAGEMENT SECTION */}
            <div className="mt-16 bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-[#1a3b70] uppercase tracking-tighter italic">Sales Force Registry</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                           <UserCheck size={14} className="text-blue-500" /> Authorized Agents & Commission Balances
                        </p>
                    </div>
                </div>

                <div className="p-10">
                    {/* AGENT REGISTRATION FORM */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12 bg-slate-50 p-6 rounded-[2.5rem] items-end border border-slate-100">
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Agent Name</label>
                        <input placeholder="Full Name..." className="w-full p-3 rounded-2xl border-2 border-white outline-none text-xs font-bold focus:border-yellow-400" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} /></div>
                        
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Internal Code</label>
                        <input placeholder="AG-000" className="w-full p-3 rounded-2xl border-2 border-white outline-none text-xs font-bold focus:border-yellow-400" value={newAgent.code} onChange={e => setNewAgent({...newAgent, code: e.target.value})} /></div>
                        
                        <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase ml-2">Contact Phone</label>
                        <input placeholder="09..." className="w-full p-3 rounded-2xl border-2 border-white outline-none text-xs font-bold focus:border-yellow-400" value={newAgent.phone} onChange={e => setNewAgent({...newAgent, phone: e.target.value})} /></div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Agreement (PDF)</label>
                            <input type="file" onChange={(e) => setAgentFile(e.target.files[0])} className="text-[10px] w-full file:bg-[#1a3b70] file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 cursor-pointer" />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleAgentSubmit} className={`flex-1 ${isEditingAgent ? 'bg-emerald-500' : 'bg-[#1a3b70]'} text-white py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all`}>
                                {isEditingAgent ? 'Update' : 'Add Agent'}
                            </button>
                            {isEditingAgent && <button onClick={cancelEdit} className="p-3 bg-white text-red-500 rounded-2xl border border-red-50 shadow-sm"><X size={16}/></button>}
                        </div>
                    </div>

                    {/* AGENT TABLE */}
                    <div className="overflow-hidden rounded-[2rem] border border-slate-50 shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6">Agent Identity</th>
                                    <th className="px-10 py-6 text-center">Wallet Balance</th>
                                    <th className="px-10 py-6 text-right px-12">Action Hub</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {agents.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-all group text-xs font-bold text-slate-600">
                                        <td className="px-10 py-5">
                                            <p className="font-black text-slate-800">{a.agent_name}</p>
                                            <p className="text-[9px] text-blue-500 font-bold uppercase">Code: {a.agent_code}</p>
                                        </td>
                                        <td className="px-10 py-5 text-center">
                                            <span className="text-sm font-black text-[#1a3b70]">{Number(a.current_balance || 0).toLocaleString()} ETB</span>
                                        </td>
                                        <td className="px-10 py-5 text-right px-12">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openWithdrawModal(a)} className="bg-[#1a3b70] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-900 transition-all shadow-md">Record Payout</button>
                                                {a.agreement_path && <a href={`${API.defaults.baseURL}/documents/${a.agreement_path}`} target="_blank" rel="noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><FileText size={14}/></a>}
                                                <button onClick={() => startEdit(a)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"><Edit size={14}/></button>
                                                <button onClick={() => handleDeleteAgent(a.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* WITHDRAWAL MODAL */}
            {showWithdrawModal && selectedUser && (
                <div className="fixed inset-0 bg-[#1a3b70]/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 relative">
                        <button onClick={() => setShowWithdrawModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X /></button>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Disburse Commission</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-8">Agent: {selectedUser.agent_name}</p>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Payout Amount (ETB)</label>
                                <input type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-[#1a3b70] outline-none" placeholder={`Max: ${selectedUser.current_balance}`} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Bank Reference / Voucher No</label>
                                <input value={withdrawForm.ref} onChange={e => setWithdrawForm({...withdrawForm, ref: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-[#1a3b70] outline-none" placeholder="Enter transaction ID..." />
                            </div>
                            <button onClick={handleConfirmPayout} className="w-full bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl shadow-emerald-200">Confirm Payout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParametersModule;
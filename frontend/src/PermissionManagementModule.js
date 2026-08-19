import React, { useState, useEffect } from 'react';
import { Key, Plus, ShieldCheck, Tag, Box, X, Save } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance   

const PermissionManagementModule = () => {
  const [permissions, setPermissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ key: '', name: '', module: 'Registry' });

  useEffect(() => { fetchPermissions(); }, []);
  const fetchPermissions = () => API.get('/api/permissions').then(res => setPermissions(res.data));

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
        await API.post('/api/permissions', formData);
        setShowModal(false);
        fetchPermissions();
    } catch (err) { alert("Duplicate key or error"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter uppercase">Permission Dictionary</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Master list of controllable system features</p>
         </div>
         <button onClick={() => setShowModal(true)} className="bg-[#1a3b70] text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl hover:bg-blue-900 transition-all">
            <Plus size={18} /> DEFINE NEW PERMISSION
         </button>
      </div>

      {/* PERMISSIONS GRID BY MODULE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {['Registry', 'Certificates', 'Transfers', 'Dividends', 'Analytics', 'Security'].map(module => (
            <div key={module} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-6 bg-slate-50 border-b font-black text-[10px] text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Box size={14}/> {module} Features
               </div>
               <div className="p-6 space-y-3">
                  {permissions.filter(p => p.module_name === module).map(perm => (
                     <div key={perm.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-700">{perm.permission_name}</span>
                           <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">{perm.permission_key}</span>
                        </div>
                        <ShieldCheck size={14} className="text-emerald-500 opacity-40 group-hover:opacity-100" />
                     </div>
                  ))}
                  {permissions.filter(p => p.module_name === module).length === 0 && (
                     <p className="text-[10px] text-slate-300 italic text-center py-4">No features defined yet.</p>
                  )}
               </div>
            </div>
         ))}
      </div>

      {/* ADD MODAL */}
{showModal && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
     <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 relative">
        
        {/* TOP-RIGHT CLOSE BUTTON */}
        <button 
          onClick={() => setShowModal(false)} 
          className="absolute top-8 right-8 p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-8">Define System Feature</h3>
        
        <form onSubmit={handleAdd} className="space-y-6">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Permission Key</label>
              <input placeholder="e.g. cert_bulk_print" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-mono font-bold mt-2 outline-none focus:border-yellow-400" onChange={e => setFormData({...formData, key: e.target.value})} required />
           </div>
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
              <input placeholder="e.g. Bulk Print Certificates" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold mt-2 outline-none focus:border-yellow-400" onChange={e => setFormData({...formData, name: e.target.value})} required />
           </div>
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Module Group</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold mt-2 outline-none appearance-none cursor-pointer" onChange={e => setFormData({...formData, module: e.target.value})}>
                 <option>Registry</option><option>Certificates</option><option>Transfers</option><option>Dividends</option><option>Analytics</option><option>Security</option>
              </select>
           </div>

           <div className="flex gap-4 pt-4">
              {/* BOTTOM CANCEL BUTTON */}
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="flex-[2] bg-[#1a3b70] text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-900 transition-all">
                Save to Dictionary
              </button>
           </div>
        </form>
     </div>
  </div>
)}
    </div>
  );
};

export default PermissionManagementModule;
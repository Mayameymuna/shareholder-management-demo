import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Save, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const RoleManagementModule = () => {
  const [activeRole, setActiveRole] = useState('Maker');
  const [permissions, setPermissions] = useState([]); // This will hold the matrix
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchMatrix(); }, [activeRole]);

  const fetchMatrix = async () => {
    const res = await API.get(`/api/roles/matrix?role=${activeRole}`);
    setPermissions(res.data);
  };

  const handleToggle = (key) => {
    setPermissions(permissions.map(p => 
      p.permission_key === key ? { ...p, is_enabled: p.is_enabled === 1 ? 0 : 1 } : p
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const enabledKeys = permissions.filter(p => p.is_enabled === 1).map(p => p.permission_key);
    try {
      await API.post('/api/roles/permissions', {
        role: activeRole,
        permissions: enabledKeys
      });
      alert(`Permissions for ${activeRole} have been updated in the database.`);
    } catch (err) { alert("Save failed"); }
    finally { setIsSaving(false); }
  };

  // Grouping by Module Name for the UI
  const modules = [...new Set(permissions.map(p => p.module_name))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left: Role Selection */}
      <div className="space-y-2">
        {['Admin', 'Maker', 'Checker', 'Auditor', 'Compliance'].map(role => (
          <div key={role} onClick={() => setActiveRole(role)} className={`p-5 rounded-2xl cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest ${activeRole === role ? 'bg-[#1a3b70] text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>
            {role} Access
          </div>
        ))}
      </div>

      {/* Right: The Dynamic Matrix */}
      <div className="lg:col-span-3 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase">{activeRole} Permissions</h3>
          <button onClick={handleSave} className="bg-emerald-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Save Changes
          </button>
        </div>

        <div className="p-10 grid grid-cols-2 gap-12 h-[60vh] overflow-y-auto">
          {modules.map(mod => (
            <div key={mod} className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2 flex items-center gap-2">
     <Shield size={14}/> {mod} Module
  </h4>
  <div className="grid grid-cols-1 gap-3">
                {permissions.filter(p => p.module_name === mod).map(perm => (
      <label key={perm.permission_key} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-white rounded-xl transition-all">
        <div className="flex items-center gap-3">
            <div 
              onClick={() => handleToggle(perm.permission_key)}
              className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center transition-all ${perm.is_enabled === 1 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 group-hover:border-yellow-400'}`}
            >
               {perm.is_enabled === 1 && <CheckCircle size={12} className="text-white" />}
            </div>
                   <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{perm.permission_name}</span>
        </div>
        <span className="text-[8px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 uppercase">{perm.permission_key}</span>
      </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleManagementModule;
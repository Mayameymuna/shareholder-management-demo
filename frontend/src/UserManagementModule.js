import React, { useState, useEffect } from 'react';
import { 
  UserCog, UserPlus, Shield, Lock, Trash2, CheckCircle, 
  XCircle, ShieldAlert, X, Edit, KeyRound, Save, Loader2 
} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const UserManagementModule = () => {
  // --- STATES ---
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const INITIAL_STATE = { 
    name: '', 
    email: '', 
    password: '', 
    role: 'Maker', 
    branch_name: 'Head Office' 
  };
  const [formData, setFormData] = useState(INITIAL_STATE);
  const currentUser = localStorage.getItem('userName') || 'Admin';

  // --- DATA FETCHING ---
  useEffect(() => { 
    fetchUsers(); 
    // Fetch branches so we can assign users to them
    API.get('/api/branches').then(res => setBranches(res.data.data || []));
  }, []);

  const fetchUsers = () => API.get('/api/users').then(res => setUsers(res.data));

  // --- ACTIONS ---
  
  // 1. Prepare Edit Mode
  const handleEditClick = (user) => {
    setFormData({ 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        branch_name: user.branch_name || 'Head Office', 
        password: '***' // Placeholder
    });
    setEditId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  // 2. Password Reset Logic
  const handleResetPassword = async (user) => {
    if (window.confirm(`Reset security credentials for ${user.name}? They will be forced to change it on next login.`)) {
        try {
            await API.post(`/api/users/${user.id}/reset-password`, { performed_by: currentUser });
            alert("Password has been reset to 'password123'");
        } catch (err) { alert("Reset failed"); }
    }
  };

  // 3. Status Toggle (Active/Disabled)
  const toggleStatus = async (id, currentStatus) => {
    await API.put(`/api/users/${id}/status`, { 
        status: currentStatus === 1 ? 0 : 1, 
        performed_by: currentUser 
    });
    fetchUsers();
  };

  // 4. Integrated Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        if (isEditing) {
            await API.put(`/api/users/${editId}`, { ...formData, performed_by: currentUser });
        } else {
            await API.post('/api/users', { ...formData, performed_by: currentUser });
        }
        setShowModal(false);
        setFormData(INITIAL_STATE);
        setIsEditing(false);
        fetchUsers();
    } catch (err) { 
        alert("Operation failed. Ensure email is unique."); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter uppercase italic">Staff Directory</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage system access & security</p>
         </div>
         <button 
            onClick={() => { setIsEditing(false); setFormData(INITIAL_STATE); setShowModal(true); }} 
            className="bg-yellow-400 text-[#1a3b70] px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl active:scale-95 transition-all"
         >
            <UserPlus size={18} /> REGISTER NEW STAFF
         </button>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Staff Member</th>
              <th className="px-8 py-6 text-center">System Role</th>
              <th className="px-8 py-6 text-center">Branch</th>
              <th className="px-8 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-right px-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-all group text-xs font-bold text-slate-600">
                <td className="px-8 py-5">
                   <p className="font-black text-slate-800">{user.name}</p>
                   <p className="text-[10px] text-slate-400 uppercase">{user.email}</p>
                </td>
                <td className="px-8 py-5 text-center">
                   <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{user.role}</span>
                </td>
                <td className="px-8 py-5 text-center text-slate-400 uppercase text-[10px]">
                    {user.branch_name || 'Main Office'}
                </td>
                <td className="px-8 py-5 text-center">
                   <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase ${user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {user.is_active ? 'Active' : 'Disabled'}
                   </span>
                </td>
                <td className="px-8 py-5 text-right px-12">
                   <div className="flex justify-end gap-2">
                      {/* EDIT BUTTON */}
                      <button onClick={() => handleEditClick(user)} title="Edit Details" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                      
                      {/* RESET PASSWORD BUTTON */}
                      <button onClick={() => handleResetPassword(user)} title="Reset to Default Password" className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"><KeyRound size={16}/></button>
                      
                      {/* ACTIVATE/DEACTIVATE BUTTON */}
                      <button 
                        onClick={() => toggleStatus(user.id, user.is_active)}
                        className={`p-2 rounded-xl transition-all ${user.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                      >
                         {user.is_active ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={20} /></button>
              
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-8 uppercase">
                {isEditing ? 'Update Staff Member' : 'Register Staff User'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                 <FormInput label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                 <FormInput label="Work Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                 
                 {/* Only show password field during creation, not editing */}
                 {!isEditing && (
                    <FormInput label="Initial Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                 )}

                 <div className="grid grid-cols-2 gap-4">
                    <FormSelect label="Assigned Role" value={formData.role} options={['Admin', 'Maker', 'Checker', 'Auditor']} onChange={e => setFormData({...formData, role: e.target.value})} />
                    <FormSelect label="Assigned Branch" value={formData.branch_name} options={branches.map(b => b.branch_name)} onChange={e => setFormData({...formData, branch_name: e.target.value})} />
                 </div>

                 <button type="submit" disabled={isSubmitting} className="w-full bg-[#1a3b70] text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 mt-4 transition-all flex items-center justify-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isEditing ? 'Save Changes' : 'Create System Identity'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// HELPER COMPONENTS
const FormInput = ({ label, type = "text", ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input type={type} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all" {...props} />
    </div>
);

const FormSelect = ({ label, options, ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer" {...props}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
);

export default UserManagementModule;
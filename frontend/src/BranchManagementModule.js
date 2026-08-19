import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Search, X, Edit, Trash2, MapPin, ChevronLeft, ChevronRight, Globe, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Use the centralized API instance

const BranchManagementModule = () => {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const INITIAL_STATE = { branch_name: '', branch_code: '', imal_code: '', region: '', district: '', city: '' };
  const [formData, setFormData] = useState(INITIAL_STATE);
  const limit = 10;

  useEffect(() => { fetchBranches(); }, [currentPage, searchTerm]);

  const fetchBranches = () => {
    API.get(`api/branches?page=${currentPage}&limit=${limit}&search=${searchTerm}`)
      .then(res => {
          setBranches(res.data.data || []);
          setPagination(res.data.pagination || { totalPages: 1 });
      });
  };

  // OPEN EDIT MODAL
  const handleEditClick = (branch) => {
      setFormData(branch);
      setEditId(branch.id);
      setIsEditing(true);
      setShowModal(true);
  };

  // HANDLE DELETE
  const handleDelete = async (id, name) => {
      if (window.confirm(`Are you sure you want to delete the "${name}" branch? This action cannot be undone.`)) {
          try {
              await API.delete(`/api/branches/${id}`);
              fetchBranches();
          } catch (err) { alert("Failed to delete branch. It may have linked shareholders."); }
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        if (isEditing) {
            await API.put(`/api/branches/${editId}`, formData);
        } else {
            await API.post('/api/branches', formData);
        }
        setShowModal(false);
        setFormData(INITIAL_STATE);
        setIsEditing(false);
        fetchBranches();
    } catch (err) {
            const serverMsg = err.response?.data?.message || "Operation failed.";
    alert("Error: " + serverMsg);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-sm"><Globe size={24}/></div>
            <div>
               <h2 className="text-2xl font-black text-[#1a3b70] tracking-tighter uppercase">Branch Directory</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registry of {pagination.totalRecords} Authorized Locations</p>
            </div>
         </div>
         <button onClick={() => { setIsEditing(false); setFormData(INITIAL_STATE); setShowModal(true); }} className="bg-yellow-400 hover:bg-yellow-500 text-[#1a3b70] px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl active:scale-95 transition-all">
            <Plus size={20} /> REGISTER NEW BRANCH
         </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-5 py-3 border-2 border-transparent focus-within:border-yellow-400 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
               type="text" 
               placeholder="Search by Branch Name or Code..." 
               className="bg-transparent border-none outline-none text-sm w-full font-bold text-[#1a3b70]"
               value={searchTerm}
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Code</th>
              <th className="px-8 py-6">Branch Name</th>
              <th className="px-8 py-6">IMAL / System</th>
              <th className="px-8 py-6">Region / District</th>
              <th className="px-8 py-6 text-right px-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {branches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/30 transition-all">
                <td className="px-8 py-5"><span className="bg-[#1a3b70] text-white px-2.5 py-1 rounded-lg font-black text-[10px]">{b.branch_code}</span></td>
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-slate-700">{b.branch_name}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{b.city}</p>
                </td>
                <td className="px-8 py-5 font-mono text-xs text-slate-500 font-bold">{b.imal_code || '---'}</td>
                <td className="px-8 py-5">
                   <p className="text-xs font-bold text-slate-600">{b.region}</p>
                   <p className="text-[9px] text-slate-400 uppercase font-black">{b.district} District</p>
                </td>
                <td className="px-8 py-5 text-right px-12">
                   <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(b)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"><Edit size={14}/></button>
                      <button onClick={() => handleDelete(b.id, b.branch_name)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"><Trash2 size={14}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-12">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Page {currentPage} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"><ChevronLeft size={18} /></button>
            <button disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{isEditing ? 'Update Branch Info' : 'Add New Branch'}</h3>
                 <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <FormInput label="Full Branch Name" value={formData.branch_name} onChange={e => setFormData({...formData, branch_name: e.target.value})} required />
                 </div>
                 <FormInput label="Unique Branch Code" value={formData.branch_code} onChange={e => setFormData({...formData, branch_code: e.target.value})} required />
                 <FormInput label="System IMAL Code" value={formData.imal_code} onChange={e => setFormData({...formData, imal_code: e.target.value})} />
                 <FormInput label="Region" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
                 <FormInput label="District" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                 <div className="col-span-2">
                    <FormInput label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                 </div>
                 <button type="submit" disabled={isSubmitting} className="col-span-2 bg-[#1a3b70] text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 mt-6 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                    {isEditing ? 'Save Branch Changes' : 'Create Branch Identity'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const FormInput = ({ label, ...props }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 transition-all" {...props} />
    </div>
);

export default BranchManagementModule;
import React, { useState, useEffect } from 'react';
import { FileText, Save, Edit3, Type, Layout, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const TemplateModule = () => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ subject: '', body: '', footer: '' });

  useEffect(() => { fetchTemplates(); }, []);
  const fetchTemplates = () => API.get('/api/templates').then(res => setTemplates(res.data));

  const handleEdit = (t) => {
    setEditingTemplate(t);
    setFormData({ subject: t.subject_line, body: t.body_text, footer: t.footer_text });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        await API.put(`/api/templates/${editingTemplate.template_key}`, formData);
        alert("Template Updated!");
        setEditingTemplate(null);
        fetchTemplates();
    } catch (err) { alert("Save failed"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter uppercase italic">Notice Templates</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section 2.11 • Letter & Email Branding</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {templates.map(t => (
            <div key={t.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group hover:border-[#1a3b70] transition-all flex flex-col justify-between">
               <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a3b70] mb-6">
                     <FileText size={28} />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight">{t.template_name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Last Updated: {new Date(t.updated_at).toLocaleDateString()}</p>
               </div>
               <button onClick={() => handleEdit(t)} className="mt-8 w-full py-4 bg-[#1a3b70] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                  <Edit3 size={14}/> Edit Template Text
               </button>
            </div>
         ))}
      </div>

      {/* EDITOR MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Edit {editingTemplate.template_name}</h3>
                 <button onClick={() => setEditingTemplate(null)}><X className="text-slate-300" /></button>
              </div>

              <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Subject / Title</label>
                    <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Content (Body)</label>
                    <textarea value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-xs font-medium text-slate-600 h-48 outline-none focus:border-yellow-400" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Footer</label>
                    <input value={formData.footer} onChange={e => setFormData({...formData, footer: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-[10px] text-slate-400 italic" />
                 </div>

                 <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-100 flex items-center justify-center gap-2">
                    <Save size={18} /> Update Template Dictionary
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TemplateModule;
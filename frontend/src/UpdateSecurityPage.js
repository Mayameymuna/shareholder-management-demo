import React, { useState } from 'react';
import { ShieldAlert, Key, ChevronRight, Lock, User, Database, Wallet, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const UpdateSecurityPage = () => {
  const [newKey, setNewKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const navigate = useNavigate();

const handleUpdate = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (newKey !== confirmKey) {
        return alert("Passwords do not match!");
    }
    if (newKey.length < 6) {
        return alert("Password must be at least 6 characters.");
    }

    // 2. Get the email of the person who just logged in
    const userEmail = localStorage.getItem('userEmail');

    try {
        // 3. Call the rotation API
        const res = await API.post('/api/users/rotate-password', { 
            email: userEmail,
            newPassword: newKey 
        });

        if (res.data.success) {
            alert("Security Credentials Updated Successfully!");
            navigate('/dashboard'); // Move to dashboard
        }
    } catch (err) {
        console.error(err);
        alert("Failed to update security credentials.");
    }
};

  return (
    <div className="flex min-h-screen bg-[#1a3b70] font-sans overflow-hidden">
      {/* LEFT SIDE - SAME BRANDING AS LOGIN */}
      <div className="hidden lg:flex lg:w-1/2 flex-col p-16 justify-between relative">
        <div className="z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
              <span className="text-white font-serif text-3xl font-bold italic">R</span>
            </div>
            <div>
              <h1 className="text-white text-5xl font-black tracking-tighter leading-none">RB MIS</h1>
              <h1 className="text-yellow-400 text-5xl font-black tracking-tighter leading-none">SYSTEM</h1>
            </div>
          </div>
          <p className="text-blue-200 text-[11px] tracking-[0.4em] ml-20 font-bold uppercase opacity-60">Executive Dashboard</p>
        </div>

        <div className="grid grid-cols-2 gap-6 z-10 opacity-40">
           <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem]">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4"><User size={20}/></div>
              <h3 className="text-white font-bold text-sm">CUSTOMER INTEL</h3>
           </div>
           <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[2rem]">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4"><Database size={20}/></div>
              <h3 className="text-white font-bold text-sm">LIQUIDITY</h3>
           </div>
        </div>

        <div className="z-10 flex items-center gap-2 text-[10px] font-bold text-blue-200/50 tracking-widest uppercase">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div> SYSTEM OPERATIONAL
        </div>
      </div>

      {/* RIGHT SIDE - UPDATE SECURITY FORM (Matches Screenshot 2) */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-12 lg:px-32">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-6xl font-black text-slate-800 mb-2 tracking-tighter">Update Security</h2>
          <p className="text-slate-400 mb-8 font-medium">Please rotate your access credentials.</p>

          {/* SECURITY ALERT BOX */}
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4 mb-10">
             <div className="bg-white p-2.5 rounded-xl shadow-sm h-fit">
                <ShieldAlert className="text-blue-600" size={24} />
             </div>
             <div>
                <h4 className="text-blue-900 font-bold text-xs uppercase tracking-tight">Security Alert</h4>
                <p className="text-blue-700 text-[11px] leading-relaxed mt-1">
                    Identity @ verified. Mandatory password rotation required before proceeding.
                </p>
             </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div>
              <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase block mb-3">New Access Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-4 text-slate-300" size={20} />
                <input 
                  type="password" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-200 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Confirm Access Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                <input 
                  type="password" 
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-[#00a884]/30 bg-slate-50/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none text-sm"
                  required
                />
              </div>
              <div className="flex justify-between mt-3">
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Entropy Level</span>
                 <span className="text-[10px] font-bold text-[#00a884] uppercase tracking-widest">Secure</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                 <div className="w-full h-full bg-[#00a884]"></div>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#00a884] hover:bg-[#008f70] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-xs shadow-xl shadow-emerald-100">
              Update Security Credentials
            </button>
          </form>
          
          <div className="flex justify-center gap-6 mt-12 text-[10px] font-bold text-slate-200 tracking-widest uppercase">
             <span>© 2026 Rammis Bank.</span> <span>Developed by Meymuna Ahmed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateSecurityPage;

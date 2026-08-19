import React, { useState } from 'react';
import { User, Lock, Eye, ChevronRight, ShieldCheck, Globe, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from './Rammisbank_logo.png'; // Add this line at the top
import API from './api'; // Import the centralized API instance

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/api/login', { 
        email: email.trim().toLowerCase(), 
        password: password.trim() 
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userName', response.data.name);
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('userEmail', email.trim().toLowerCase());
        localStorage.setItem('userPermissions', JSON.stringify(response.data.permissions));
        
        if (response.data.mustUpdatePassword) {
          navigate('/update-security');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      alert("Unauthorized: Access Denied. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: BRANDED IMPACT AREA */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#1a3b70] flex-col p-16 justify-between relative">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white blur-[120px]"></div>
           <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-yellow-400 blur-[150px]"></div>
        </div>

        <div className="z-10">
          <div className="flex items-center gap-4 mb-12">
<div className="w-12 h-12 flex items-center justify-center">
   <img src={Logo} alt="Rammis Bank Logo" className="w-full h-full object-contain filter drop-shadow-md" />
</div>
            <div>
              <h1 className="text-white text-3xl font-black tracking-tighter leading-tight">RAMMIS <span className="text-yellow-400">SMS</span></h1>
              <p className="text-blue-200 text-[9px] tracking-[0.3em] font-bold uppercase opacity-80">Share Management System</p>
            </div>
          </div>

          <div className="max-w-md">
             <h2 className="text-5xl font-black text-white leading-tight mb-6">
                The Future of <br/> 
                <span className="text-yellow-400 italic">Digital Equity</span> 
                <br/> Management.
             </h2>
             <p className="text-blue-100 text-sm leading-relaxed opacity-70">
                Secure, transparent, and automated registry for Rammis Bank shareholders. 
                Manage allotments, transfers, and dividends with enterprise-grade precision.
             </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="z-10 grid grid-cols-3 gap-4">
           <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <ShieldCheck className="text-yellow-400 mb-2" size={20} />
              <p className="text-white font-bold text-[10px] uppercase tracking-wider">Secure Access</p>
           </div>
           <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <Globe className="text-yellow-400 mb-2" size={20} />
              <p className="text-white font-bold text-[10px] uppercase tracking-wider">Digital Registry</p>
           </div>
           <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <Fingerprint className="text-yellow-400 mb-2" size={20} />
              <p className="text-white font-bold text-[10px] uppercase tracking-wider">Verified Portal</p>
           </div>
        </div>

        <div className="z-10 flex justify-between items-center text-[9px] font-bold text-blue-300 uppercase tracking-[0.2em]">
           <span>© 2026 Rammis Bank</span>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              Network Secure
           </div>
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN LOGIN FORM */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-12 lg:px-24 bg-white">
        <div className="max-w-sm w-full mx-auto">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Sign In</h2>
            <p className="text-slate-400 text-sm font-medium">Please enter your administrative credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a3b70] transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rammisbank.et"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-yellow-400/50 focus:bg-white transition-all text-sm font-semibold text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <a href="#" className="text-[10px] font-bold text-[#1a3b70] hover:text-blue-800 uppercase tracking-widest">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a3b70] transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-yellow-400/50 focus:bg-white transition-all text-sm font-semibold text-slate-700"
                  required
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                  <Eye size={18} />
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#1a3b70] font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-yellow-400/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In To Portal'} 
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                   <Globe size={12} className="text-slate-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Internal System</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                   <ShieldCheck size={12} className="text-slate-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Encrypted</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
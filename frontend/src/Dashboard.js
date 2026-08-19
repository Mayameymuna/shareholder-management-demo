import React, { useState, useEffect } from 'react';
import { 
  Users, Landmark, FileCheck, ArrowLeftRight, 
  Coins, FileText, Settings, Search, Bell, 
  Plus, History, TrendingUp, MoreVertical, LayoutGrid, RefreshCw, Award,
   FileSpreadsheet, Printer, ShieldCheck, ShieldAlert, Zap, Loader2,
    XCircle, Percent, UserCog, CheckCircle, X, PieChart, ArrowRightLeft, Clock, LogOut, Power,
    MessageSquare
} from 'lucide-react';
import axios from 'axios';

// MODULE IMPORTS
import ShareholderModule from './ShareholderModule';
import ReportsModule from './ReportsModule';
import CapitalModule from './CapitalModule';
import CertificateModule from './CertificateModule';
import TransferModule from './TransferModule';
import CorporateActionsModule from './CorporateActionsModule'; 
import DividendModule from './DividendModule'; 
import UserManagementModule from './UserManagementModule';
import RoleManagementModule from './RoleManagementModule';
import TemplateModule from './TemplateModule'; 
import PermissionManagementModule from './PermissionManagementModule';
import Logo from './Rammisbank_logo.png'; 
import AllotmentModule from './AllotmentModule';
import BranchManagementModule from './BranchManagementModule'; 
import YearlyReportsModule from './YearlyReportsModule';
import StaffPerformanceModule from './StaffPerformanceModule';
import TargetManagementModule from './TargetManagementModule';
import ParametersModule from './ParametersModule';
import NBEStagingModule from './NBEStagingModule';
import { useNavigate } from 'react-router-dom';
import SMSPortalModule from './SMSPortalModule';
import API from './api'; // Import the centralized API instance

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false); 
  const [isCapitalOpen, setIsCapitalOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const loggedInUser = localStorage.getItem('userName') || 'System User';
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
const navigate = useNavigate();

const handleLogout = () => {
    // 1. Clear all security data
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPermissions');
    
    // 2. Redirect to login page
    navigate('/');
};

const rawRole = localStorage.getItem('userRole');
const loggedInRole = (rawRole && rawRole !== 'undefined') ? rawRole.toUpperCase() : 'ADMINISTRATOR';
// 1. Pull permissions list (saved during login) from memory
const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
// 2. Helper function to check if the user is allowed to see a feature
const can = (permissionKey) => {
  // If the user is a full Admin, they see everything automatically
  if (localStorage.getItem('userRole') === 'Admin') return true;
  return userPermissions.includes(permissionKey);
};

const getInitials = (name) => {
  if (!name) return "RB";
  const parts = name.split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name[0].toUpperCase();
};

  const fetchStats = () => {
    API.get('/api/stats/summary')
      .then(res => {
          setStats(res.data);
          setRecentActivities(res.data.activities || []);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        // If no token exists, kick them back to login
        navigate('/');
        return;
    }
    fetchStats();
}, [navigate]);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
<div className={`${isMobileExpanded ? 'w-64' : 'w-20 lg:w-64'} h-screen bg-[#1a3b70] text-white flex flex-col transition-all duration-300 border-r border-white/5 overflow-hidden`}>
        <div className="p-6 mb-4">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                  <img src={Logo} alt="Rammis Bank Logo" className="w-full h-full object-contain filter drop-shadow-md" />
               </div>
              <div>
                <h2 className="font-black text-lg tracking-tighter leading-none">RAMMIS <span className="text-yellow-400">SMS</span></h2>
                <p className="text-[8px] text-blue-300 font-bold tracking-[0.2em] uppercase mt-1">Share Management</p>
              </div>
           </div>
        </div>

<nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
  {/* 0. Overview - Usually visible to everyone */}
  <MenuLink 
    icon={<LayoutGrid size={20}/>} 
    label="Dashboard Overview" 
    active={activeTab === 'Overview'} 
    onClick={() => setActiveTab('Overview')} 
    isMobileExpanded={isMobileExpanded}
  />
  
    {/* Define a new tab for agents */}
{localStorage.getItem('userRole') === 'Agent' && (
    <MenuLink 
      icon={<Landmark size={20}/>} 
      label="My Commission Wallet" 
      active={activeTab === 'Agent-Wallet'} 
      onClick={() => setActiveTab('Agent-Wallet')} 
      isMobileExpanded={isMobileExpanded}
    />
)}

{/* Update these labels */}
<div className="hidden lg:block pt-6 pb-2 px-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
    Core Modules
</div>

  {/* 1. Shareholder Registry (Permission: sh_view) */}
  {can('sh_view') && (
    <MenuLink 
      icon={<Users size={20}/>} 
      label="Shareholder Registry" 
      active={activeTab === 'Shareholders'} 
      onClick={() => setActiveTab('Shareholders')} 
      isMobileExpanded={isMobileExpanded}
    />
  )}

  {/* Inside the Sidebar <nav> section of Dashboard.js */}

{can('sh_view') && (
  <MenuLink 
    icon={<Clock size={20}/>} 
    label="NBE Staging Registry" 
    active={activeTab === 'NBE-Staging'} 
    onClick={() => setActiveTab('NBE-Staging')} 
  />
)}

  {/* 2. Share Capital (Permission: cap_view) */}
  {can('cap_view') && (
    <div className="pt-1">
<div 
  onClick={() => setIsCapitalOpen(!isCapitalOpen)} 
  className={`flex items-center justify-center lg:justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all hover:bg-white/5 ${activeTab.startsWith('Capital') ? 'text-yellow-400 font-bold' : 'text-blue-100'}`}
>
    <div className="flex items-center gap-4">
        <Landmark size={20} className="flex-shrink-0" />
        {/* ADD hidden lg:block TO THE SPAN BELOW */}
        <span className="hidden lg:block text-xs uppercase tracking-wider text-nowrap">Share Capital</span>
    </div>
    {/* ADD hidden lg:block TO THE ARROW BELOW */}
    <span className={`hidden lg:block text-[10px] transition-transform ${isCapitalOpen ? 'rotate-180' : ''}`}>▼</span>
</div>
      {isCapitalOpen && (
          <div className="mt-1 ml-10 space-y-1 animate-in slide-in-from-top-2">
              <SubMenuLink label="Authorized Ledger" active={activeTab === 'Capital-Authorized'} onClick={() => setActiveTab('Capital-Authorized')} />
              <SubMenuLink label="Issuance & Subs" active={activeTab === 'Capital-Issuance'} onClick={() => setActiveTab('Capital-Issuance')} />
              <SubMenuLink label="Share Classes" active={activeTab === 'Capital-Classes'} onClick={() => setActiveTab('Capital-Classes')} />
          </div>
      )}
    </div>
  )}

  {/* 3. Securities / Certs (Permission: cert_view) */}
  {can('cert_view') && (
    <MenuLink 
      icon={<Award size={20}/>} 
      label="Securities (Certs)" 
      active={activeTab === 'Certificates'} 
      onClick={() => setActiveTab('Certificates')} 
      isMobileExpanded={isMobileExpanded}
    />
  )}

  {/* 4. Transfers (Permission: trans_view) */}
  {can('trans_view') && (
    <MenuLink 
      icon={<ArrowRightLeft size={20}/>} 
      label="Share Transfers" 
      active={activeTab === 'Transfers'} 
      onClick={() => setActiveTab('Transfers')} 
      isMobileExpanded={isMobileExpanded}
    />
  )}

{/* 5. Corporate Actions (Requirement: corp_view) */}
{can('corp_view') && (
  <MenuLink 
    icon={<Zap size={20}/>} 
    label="Corporate Actions" 
    active={activeTab === 'Actions'} 
    onClick={() => setActiveTab('Actions')} 
    isMobileExpanded={isMobileExpanded}
  />
)}

  {/* 6. Dividends (Permission: div_view) */}
  {can('div_view') && (
    <MenuLink 
      icon={<Coins size={20}/>} 
      label="Dividend Manager" 
      active={activeTab === 'Dividends'} 
      onClick={() => setActiveTab('Dividends')} 
      isMobileExpanded={isMobileExpanded}
    />
  )}

  {/* 7. Allotments (Permission: sh_allot) */}
  {can('sh_allot') && (
    <MenuLink 
      icon={<FileCheck size={20}/>} 
      label="Share Allotments" 
      active={activeTab === 'Allotments'} 
      onClick={() => setActiveTab('Allotments')} 
      isMobileExpanded={isMobileExpanded}
    />
  )}

  {can('sms_view') && (
  <MenuLink 
    icon={<MessageSquare size={20}/>} 
    label="SMS Portal" 
    active={activeTab === 'SMS-Portal'} 
    onClick={() => setActiveTab('SMS-Portal')} 
  />
)}

  <div className="pt-6 pb-2 px-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Administration</div>

  {/* 8. Staff Management (Permission: admin_users) */}
  {can('admin_users') && (
    <div className="pt-1">
 <div 
  onClick={() => {
    setIsStaffOpen(!isStaffOpen);
    if (!isStaffOpen) setIsMobileExpanded(true); // Expand sidebar when opening menu
  }} 
  className={`flex items-center justify-center lg:justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all hover:bg-white/5 ${activeTab.startsWith('Staff') ? 'text-yellow-400 font-bold' : 'text-blue-100'}`}
>
    <div className="flex items-center gap-4">
        {/* ICON ALWAYS VISIBLE */}
        <UserCog size={20} className="flex-shrink-0" />
        
        {/* LABEL HIDDEN ON SMALL SCREENS */}
        <span className="hidden lg:block text-xs uppercase tracking-wider">Staff Management</span>
    </div>
    
    {/* ARROW HIDDEN ON SMALL SCREENS */}
    <span className={`hidden lg:block text-[10px] transition-transform ${isStaffOpen ? 'rotate-180' : ''}`}>▼</span>
</div>
      {isStaffOpen && (
    <div className="mt-2 ml-4 lg:ml-10 space-y-1 animate-in slide-in-from-top-2">
              <SubMenuLink label="Users List" active={activeTab === 'Staff-Users'} onClick={() => setActiveTab('Staff-Users')} />
              <SubMenuLink label="Role Permissions" active={activeTab === 'Staff-Roles'} onClick={() => setActiveTab('Staff-Roles')} />
              <SubMenuLink label="System Permissions" active={activeTab === 'Staff-Permissions'} onClick={() => setActiveTab('Staff-Permissions')} />
              <SubMenuLink label="Document Templates" active={activeTab === 'Staff-Templates'} onClick={() => setActiveTab('Staff-Templates')} />
              <SubMenuLink label="Branch Network" active={activeTab === 'Branch'} onClick={() => setActiveTab('Branch')} />
              <SubMenuLink label="Sales Performance" active={activeTab === 'Staff-Performance'} onClick={() => setActiveTab('Staff-Performance')} />
                <SubMenuLink 
   label="Sales Targets" 
   active={activeTab === 'Staff-Targets'} 
   onClick={() => setActiveTab('Staff-Targets')} 
/>
          </div>
      )}
    </div>
  )}
  
  {can('admin_params') && (
    <MenuLink 
      icon={<Settings size={20}/>} 
      label="System Parameters" 
      active={activeTab === 'Staff-Parameters'} 
      onClick={() => setActiveTab('Staff-Parameters')} 
      isMobileExpanded={isMobileExpanded}
    />
)}

  {/* 9. Analytics Reports (Permission: rpt_sh) */}
  {can('rpt_sh') && (
    <div className="pt-2">
      <div 
        onClick={() => setIsReportsOpen(!isReportsOpen)} 
        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer hover:bg-white/5 ${activeTab.startsWith('Reports') ? 'text-yellow-400 font-bold' : 'text-blue-100'}`}
      >
        <div className="flex items-center gap-4">
          <FileText size={20} />
          <span className="text-xs uppercase tracking-wider">Reports</span>
        </div>
        <span className={`text-[10px] ${isReportsOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {isReportsOpen && (
        <div className="mt-2 ml-10 space-y-1">
          <SubMenuLink label="Registry Summary" active={activeTab === 'Reports-Summary'} onClick={() => setActiveTab('Reports-Summary')} />
          <SubMenuLink label="Certificate Audit" active={activeTab === 'Reports-Certificates'} onClick={() => setActiveTab('Reports-Certificates')} />
          <SubMenuLink label="Movement Log" active={activeTab === 'Reports-Transfers'} onClick={() => setActiveTab('Reports-Transfers')} />
          <SubMenuLink label="Compliance & AML" active={activeTab === 'Reports-Statutory'} onClick={() => setActiveTab('Reports-Statutory')} />
          <SubMenuLink label="Tax Report (WHT)" active={activeTab === 'Reports-Tax'} onClick={() => setActiveTab('Reports-Tax')} />
                <SubMenuLink 
  label="Capital Analytics" 
  active={activeTab === 'Reports-Capital'} 
  onClick={() => setActiveTab('Reports-Capital')} 
/>
                <SubMenuLink 
  label="Payment Ledger" 
  active={activeTab === 'Reports-Payments'} 
  onClick={() => setActiveTab('Reports-Payments')} 
/>
                <SubMenuLink 
  label="Daily Control" 
  active={activeTab === 'Reports-Daily'} 
  onClick={() => setActiveTab('Reports-Daily')} 
/>
                <SubMenuLink 
  label="Weekly Oversight" 
  active={activeTab === 'Reports-Weekly'} 
  onClick={() => setActiveTab('Reports-Weekly')} 
/>
                <SubMenuLink label="Monthly Audit" active={activeTab === 'Reports-Monthly'} onClick={() => setActiveTab('Reports-Monthly')} />
<SubMenuLink 
   label="Quarterly Reports" 
   active={activeTab === 'Reports-Quarterly'} 
   onClick={() => setActiveTab('Reports-Quarterly')} 
/>
<SubMenuLink label="Yearly Reports" active={activeTab === 'Reports-Yearly'} onClick={() => setActiveTab('Reports-Yearly')} />
        </div>
      )}
    </div>
  )}
</nav>

{/* --- UPDATED DYNAMIC PROFILE CHIP --- */}
<div className="p-4 mt-auto border-t border-white/5">
   <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[#1a3b70] text-xs">
             {getInitials(loggedInUser)}
          </div>
          <div className="hidden lg:block overflow-hidden">
             <p className="text-[10px] font-bold truncate text-white">{loggedInUser}</p>
             <p className="text-[8px] text-blue-300 uppercase font-bold tracking-wider">{loggedInRole}</p>
          </div>
      </div>
      
      {/* ADD THIS LOGOUT ICON HERE */}
      <button 
        onClick={handleLogout}
        className="hidden lg:block p-1.5 text-blue-300 hover:text-red-400 transition-colors"
        title="Logout"
      >
         <LogOut size={16} />
      </button>
   </div>
</div>
      </div>

      {/* --- MAIN AREA --- */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
        
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">{activeTab.split('-').pop()}</h2>
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 w-80 border-2 border-transparent focus-within:border-yellow-400 transition-all">
               <Search size={16} className="text-slate-400" />
               <input 
                  value={searchTerm} 
                  onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!activeTab.includes('Shareholders')) setActiveTab('Shareholders');
                  }}
                  placeholder="Global Registry Search..." 
                  className="bg-transparent border-none outline-none text-xs ml-3 w-full font-bold text-[#1a3b70]" 
               />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTab('Shareholders')} className="bg-[#1a3b70] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95">
                <Plus size={16} /> New Registration
             </button>
             <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
             <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl relative border border-slate-100"><Bell size={18} /></button>
             <button onClick={() => window.location.href='/'} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl border border-red-50"><X size={18} /></button>
          </div>
        </header>

            <main className="p-8 space-y-8 flex-1 overflow-y-auto bg-[#f8fafc]">
          {activeTab === 'Overview' && <OverviewContent stats={stats} recentActivities={recentActivities} />}
          {activeTab === 'Shareholders' && <ShareholderModule globalSearch={searchTerm} setGlobalSearch={setSearchTerm} />}
          {activeTab.startsWith('Capital') && <CapitalModule subType={activeTab} />}
          {activeTab === 'Certificates' && <CertificateModule />}
          {activeTab === 'NBE-Staging' && <NBEStagingModule />}
          {activeTab === 'Transfers' && (
    <TransferModule 
        globalSearch={searchTerm} 
        setGlobalSearch={setSearchTerm} 
    />
)}
          {activeTab === 'Actions' && <CorporateActionsModule />}
          {activeTab === 'Dividends' && <DividendModule />}
          {activeTab === 'Allotments' && <AllotmentModule />}
          {activeTab === 'SMS-Portal' && <SMSPortalModule />}

          {activeTab === 'Branch' && <BranchManagementModule />}

                   {/* STAFF & SECURITY */}
          {activeTab === 'Staff-Users' && <UserManagementModule />}
          {activeTab === 'Staff-Roles' && <RoleManagementModule />}
          {activeTab === 'Staff-Permissions' && <PermissionManagementModule />}
          {activeTab === 'Staff-Templates' && <TemplateModule />}
          {activeTab === 'Staff-Performance' && <StaffPerformanceModule />}
          {activeTab === 'Staff-Targets' && <TargetManagementModule />}
          {activeTab === 'Staff-Parameters' && <ParametersModule />}

          {/* --- REPORT VIEWS --- */}
{activeTab.startsWith('Reports') && (
  <ReportsModule 
    subType={activeTab} 
    globalSearch={searchTerm} // <--- ADD THIS LINE
  />
)}
          {activeTab === 'Reports-Yearly' && <YearlyReportsModule />}
        </main>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const OverviewContent = ({ stats, recentActivities }) => {
  // Logic calculations
  const reg = stats?.registry?.[0] || { total: 0, pending_sh: 0, individual_count: 0, institutional_count: 0 };
  const cap = stats?.capital?.[0] || { authorized: 0, subscribed: 0, paidup: 0 };
  const ops = stats?.operations?.[0] || { active_certs: 0, pending_transfers: 0 };
  
  const collectionRate = cap.subscribed > 0 
    ? ((cap.paidup / cap.subscribed) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MasterCard label="Total Shareholders" value={reg.total} subValue={`${reg.pending_sh} Pending`} icon={<Users className="text-blue-600" />} trend="+12%" />
        <MasterCard label="Paid-up Capital" value={`${Number(cap.paidup / 1000000).toFixed(1)}M`} subValue="ETB Total" icon={<Landmark className="text-emerald-600" />} trend={collectionRate + "%"} />
        <MasterCard label="Active Certificates" value={ops.active_certs} subValue="Securities" icon={<Award className="text-yellow-600" />} />
        <MasterCard label="Pending Transfers" value={ops.pending_transfers} subValue="Actions Required" icon={<ArrowRightLeft className="text-purple-600" />} isAlert={ops.pending_transfers > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
           <div className="z-10">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-2">Capital Mobilization</h3>
              <p className="text-xs text-slate-400 font-medium mb-8">Authorized Limit: {Number(cap.authorized).toLocaleString()} ETB</p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2"><span className="text-[10px] font-black text-slate-500 uppercase">Paid-up vs Subscribed</span><span className="text-[10px] font-black text-[#1a3b70]">{collectionRate}%</span></div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#1a3b70] transition-all duration-1000" style={{ width: `${collectionRate}%` }}></div></div>
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Subscribed</p>
                    <p className="text-xl font-black text-slate-700">{Number(cap.subscribed).toLocaleString()} <span className="text-[10px]">ETB</span></p>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Paid-up</p>
                    <p className="text-xl font-black text-emerald-700">{Number(cap.paidup).toLocaleString()} <span className="text-[10px]">ETB</span></p>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* ROW 2 - RIGHT: REGISTRY COMPOSITION (Replaces Module Health) */}
<div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl shadow-blue-900/30 relative overflow-hidden">
   <div className="z-10">
      <h3 className="text-xl font-black tracking-tight mb-2">Shareholder Composition</h3>
      <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-8">Registry Breakdown</p>
      
      <div className="space-y-8">
         {/* Individual Stats */}
         <div className="space-y-3">
            <div className="flex justify-between items-end">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs font-bold text-blue-100">Individual Members</span>
               </div>
               <span className="text-sm font-black">{reg.individual_count}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-yellow-400 transition-all duration-700" 
                  style={{ width: `${(reg.individual_count / (reg.total || 1)) * 100}%` }}
               ></div>
            </div>
         </div>

         {/* Institutional Stats */}
         <div className="space-y-3">
            <div className="flex justify-between items-end">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-bold text-blue-100">Institutional Members</span>
               </div>
               <span className="text-sm font-black">{reg.institutional_count}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-emerald-400 transition-all duration-700" 
                  style={{ width: `${(reg.institutional_count / (reg.total || 1)) * 100}%` }}
               ></div>
            </div>
         </div>
      </div>
   </div>

   {/* Dynamic Summary Note */}
   <div className="z-10 mt-10 pt-6 border-t border-white/10">
      <p className="text-[10px] text-blue-200 leading-relaxed font-medium italic">
         * Individuals represent {((reg.individual_count / (reg.total || 1)) * 100).toFixed(1)}% of total registered stakeholders.
      </p>
   </div>

   {/* Decorative Icon */}
   <PieChart className="absolute -right-10 -bottom-10 opacity-10 text-white" size={200} />
</div>
      </div>

      {/* ROW 3: RECENT LEDGER */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
           <h3 className="font-black text-[#1a3b70] flex items-center gap-3 uppercase text-xs tracking-widest">
              <History size={18} /> Registry Command Log
           </h3>
           <button className="text-[10px] font-black text-blue-500 uppercase hover:underline">View Full Audit</button>
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                 <th className="px-10 py-5">Timestamp</th>
                 <th className="px-10 py-5">Shareholder</th>
                 <th className="px-10 py-5">Transaction Type</th>
                 <th className="px-10 py-5 text-right px-20">System Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {recentActivities.map((act, i) => (
                 <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-5 text-[10px] font-bold text-slate-400">
                       {new Date(act.date).toLocaleDateString()}
                    </td>
                    <td className="px-10 py-5 text-xs font-black text-slate-700">{act.full_name}</td>
                    <td className="px-10 py-5">
                       <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase border border-blue-100">
                          {act.action_type || 'REGISTRATION'}
                       </span>
                    </td>
                    <td className="px-10 py-5 text-right px-20">
                       <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase ${act.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {act.status}
                       </span>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

const MenuLink = ({ icon, label, active, onClick, isMobileExpanded }) => (
  <div 
    onClick={onClick} 
    className={`flex items-center justify-center lg:justify-start gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
      active ? 'bg-yellow-400 text-[#1a3b70] shadow-lg font-bold' : 'text-blue-100 hover:bg-white/5'
    }`}
  >
    <div className="flex-shrink-0">{icon}</div>
    <span className={`${isMobileExpanded ? 'block' : 'hidden lg:block'} text-xs uppercase tracking-wider text-nowrap`}>
      {label}
    </span>
  </div>
);

const SubMenuLink = ({ label, active, onClick }) => (
  <div 
    onClick={onClick} 
    className={`py-2 px-3 lg:px-4 rounded-xl cursor-pointer text-[10px] lg:text-[11px] transition-all flex items-center gap-2 ${
      active ? 'text-yellow-400 font-black' : 'text-blue-200/60 hover:text-white'
    }`}
  >
    <span className="text-lg leading-none">•</span>
    {/* Use a shorter version or keep it visible if it fits */}
    <span className="hidden lg:block truncate">{label}</span>
    {/* Show first 3 letters when minimized so it's not just a dot */}
    <span className="lg:hidden uppercase font-bold">{label.substring(0, 3)}</span>
  </div>
);

const MasterCard = ({ label, value, subValue, icon, trend, isAlert }) => (
  <div className={`p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm group hover:border-yellow-400 transition-all ${isAlert ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
    <div className="flex justify-between items-start mb-4">
       <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-yellow-50 transition-all">{icon}</div>
       {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className="text-3xl font-black text-slate-800 mt-1">{value}</h3>
    <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">{subValue}</p>
  </div>
);

const ProgressItem = ({ label, val, total, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase"><span>{label}</span><span>{val}</span></div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${(val / (total || 1)) * 100}%` }}></div>
        </div>
    </div>
);


export default Dashboard;
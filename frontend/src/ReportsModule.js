import React, { useState, useEffect } from 'react';
import { Landmark, Users, ShieldCheck, BarChart3, FileSpreadsheet, ShieldAlert, 
    X , History, ArrowRightLeft, Percent, TrendingUp, Calendar, ChevronDown, Printer,
   AlertTriangle, Gavel, Lock, Info, ChevronRight, Zap, CheckCircle, Download, ArrowUpRight,
Clock } from 'lucide-react';
    // --- UPDATE THIS LINE AT THE TOP ---
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const getWeeksInMonth = (year, month) => {
    const weeks = [];
    // Get the actual number of days in the month (e.g., 31 for August)
    const totalDays = new Date(year, month, 0).getDate();

    let startDay = 1;
    
    for (let d = 1; d <= totalDays; d++) {
        const currentDate = new Date(year, month - 1, d);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday...

        // If today is Sunday (end of a week) OR it's the last day of the month
        if (dayOfWeek === 0 || d === totalDays) {
            weeks.push({
                label: `Week ${weeks.length + 1}`,
                // Formatting for the Backend SQL (YYYY-MM-DD)
                start: `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
                end: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                // Formatting for the Dropdown UI (Day - Day)
                display: `${startDay} - ${d}`
            });
            // The next week starts on the next day
            startDay = d + 1;
        }
    }
    return weeks;
};

const getEndDate = (startStr) => {
    const d = new Date(startStr);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
};



const ReportsModule = ({ subType, globalSearch }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repQuarter, setRepQuarter] = useState('1');
  const [repMonth, setRepMonth] = useState((new Date().getMonth() + 1).toString());
  const [repYear, setRepYear] = useState(new Date().getFullYear().toString());
 const [repWeekIndex, setRepWeekIndex] = useState(0);
const [repWeek, setRepWeek] = useState('1');
const currentWeeks = getWeeksInMonth(repYear, repMonth);
const activeWeek = currentWeeks[repWeekIndex] || currentWeeks[0]
const [auditStartDate, setAuditStartDate] = useState(new Date().toISOString().split('T')[0]);
const auditEndDate = getEndDate(auditStartDate);
const [repDate, setRepDate] = useState(new Date().toISOString().split('T')[0]);
const [selectedSH, setSelectedSH] = useState(null); // The shareholder being viewed
const [shStatement, setShStatement] = useState([]); // Their specific payment list
const [shSummary, setShSummary] = useState(null);   // Their specific totals (Subscribed vs Paid)

const exportRegistryReport = (reportData) => {
    if (!reportData || !reportData.length) return;
    
    const headers = ["Member ID,Full Name,Type,Phone,Reg Date,Paid-up ETB,Status,Phase\n"];
    const rows = reportData.map(sh => (
        `${sh.shareholder_id},${sh.full_name},${sh.type},${sh.phone},${sh.registration_date},${sh.paidup_birr},${sh.status},${sh.registration_phase}`
    ));
    
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shareholder_Registry_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
};

const handleSHDrillDown = async (shId) => {
    try {
        // 1. Get the list of payments (This part was working)
        const historyRes = await API.get(`/api/shareholders/${shId}/payment-history`);
        setShStatement(historyRes.data);

        // 2. Get the specific profile totals using the NEW profile route
        const summaryRes = await API.get(`/api/shareholders/profile/${shId}`);
        setShSummary(summaryRes.data);

        setSelectedSH(shId);
    } catch (err) {
        console.error("Statement Load Error:", err);
        alert("Could not load shareholder data.");
    }
};

// Generate dynamic years
const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];



useEffect(() => {
    setData(null);
    setLoading(true);

    const reportRoutes = {
      'Reports-Certificates': '/certificate-stats',
      'Reports-Tax':          '/tax-compliance',
      'Reports-Transfers':    '/transfer-stats',
      'Reports-Actions':      '/corporate-action-stats',
      'Reports-Dividends':    '/dividend-stats',
      'Reports-Statutory':    '/statutory-stats',
      'Reports-Capital':      '/capital-analytics',
      'Reports-Quarterly':    '/quarterly-summary',
      'Reports-Monthly':      '/monthly-summary',
      'Reports-Weekly':       '/weekly-oversight',
      'Reports-Daily': '/daily-control',
      'Reports-Payments': '/payment-ledger',
    };

    const path = reportRoutes[subType] || '/shareholder-stats';
    const url = `${API.defaults.baseURL}/api/reports${path}`;

    const queryParams = {};
    if (subType === 'Reports-Quarterly') {
      queryParams.quarter = repQuarter;
      queryParams.year = repYear;
    }
    if (subType === 'Reports-Monthly') {
      queryParams.month = repMonth;
      queryParams.year = repYear;
    }
    // NEW: Send start and end dates for weekly
if (subType === 'Reports-Weekly') {
    queryParams.startDate = auditStartDate;
    queryParams.endDate = auditEndDate;
}

if (subType === 'Reports-Daily') {
    queryParams.date = repDate;
}

if (subType === 'Reports-Payments') {
    queryParams.search = globalSearch; // Reuse your search bar
}
    axios.get(url, { params: queryParams })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`[${subType}] Load Error:`, err);
        alert("Backend Error: " + (err.response?.data?.error || err.message));
        setLoading(false);
      });
      
  // ADD activeWeek.start and end to dependencies so it refreshes when week changes
  }, [subType, repQuarter, repMonth, repYear, auditStartDate, auditEndDate, repDate, globalSearch]);

  // --- ADD THIS FUNCTION INSIDE ReportsModule ---
const handleExport = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    let fileName = `${subType}_Report.csv`;

    // Logic to format different reports
    if (subType === 'Reports-Region') {
      csvContent += "Geographic Region,Member Count\n";
      data.regions?.forEach(r => {
        csvContent += `"${r.address_region || 'Unspecified'}",${r.count}\n`;
      });
    } 
    else if (subType === 'Reports-Certificates') {
      csvContent += "Metric,Total Count\n";
      csvContent += `Active Certificates,${data.summary[0]?.active || 0}\n`;
      csvContent += `Electronic Certificates,${data.summary[0]?.electronic || 0}\n`;
      csvContent += `Cancelled Certificates,${data.summary[0]?.cancelled || 0}\n`;
      csvContent += `Pending Approval,${data.summary[0]?.pending || 0}\n`;
    } 
    else if (subType === 'Reports-KYC') {
      csvContent += "KYC Status,Total Records\n";
      data.kyc?.forEach(k => {
        csvContent += `"${k.kyc_status}",${k.count}\n`;
      });
    }
    else if (subType === 'Reports-Transfers') {
  csvContent += "Type,Sender,Receiver,Shares,Date,Status\n";
  // Since the stats API is aggregate, for a full report we'd usually call the main list API
  // but for the Summary Export:
  csvContent += `Total Movement Requests,${data.summary[0]?.total_requests}\n`;
  csvContent += `Completed Transfers,${data.summary[0]?.completed}\n`;
  csvContent += `Inheritance Volume,${data.inheritance_cases[0]?.total_shares}\n`;
} 
else if (subType === 'Reports-Tax') {
  csvContent += "Financial Year,Type,Gross Dividend,Tax Withheld(10%),Net Payout\n";
  data?.forEach(t => {
    csvContent += `"${t.financial_year}","${t.dividend_type}",${t.total_gross},${t.total_tax_obligation},${t.total_net_payout}\n`;
  });
}
    else if (subType === 'Reports-Capital') {
      // Default: Shareholder Summary
      csvContent += "Shareholder Category,Status,Count\n";
      data.summary?.forEach(s => {
        csvContent += `"${s.type}","${s.status}",${s.count}\n`;
      });
    }

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <BarChart3 size={48} className="animate-bounce mb-4 opacity-20" />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Generating Registry Report...</p>
    </div>
  );

  if (!data) return <div className="p-10 text-center text-red-400 font-bold bg-white rounded-[2rem]">Failed to load report data. Please check backend.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Dynamic Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-sm"><BarChart3 size={28}/></div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tighter capitalize">{subType.replace('Reports-', '').replace('-', ' ')}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time Analytics • {new Date().toLocaleDateString()}</p>
            </div>
         </div>
<button 
   onClick={handleExport} // <--- ADD THIS LINE
   className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg transition-all active:scale-95"
>
   <FileSpreadsheet size={18}/> Exporttt Data
</button>
      </div>

      {/* 1B. FISCAL QUARTER / YEAR SELECTOR (Reports-Quarterly only) */}
      {subType === 'Reports-Quarterly' && (
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 animate-in slide-in-from-top-4">

            {/* 1. SECTION TITLE & ICON */}
            <div className="flex items-center gap-4 pr-8 md:border-r border-slate-100">
                <div className="w-12 h-12 bg-[#1a3b70] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                    <Calendar size={22} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reporting Engine</p>
                    <h3 className="text-sm font-black text-[#1a3b70] mt-1">Period Selection</h3>
                </div>
            </div>

            {/* 2. DYNAMIC FILTERS */}
            <div className="flex flex-1 items-center gap-4 w-full">

                {/* Quarter Select */}
                <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Target Fiscal Quarter</label>
                    <div className="relative group">
                        <select 
                          value={repQuarter} 
                          onChange={(e) => setRepQuarter(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent group-hover:border-blue-100 focus:border-[#1a3b70] rounded-2xl px-5 py-3 text-xs font-black text-[#1a3b70] outline-none cursor-pointer transition-all appearance-none"
                        >
                            <option value="1">Q1 (July - Sept)</option>
                            <option value="2">Q2 (Oct - Dec)</option>
                            <option value="3">Q3 (Jan - Mar)</option>
                            <option value="4">Q4 (Apr - June)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-[#1a3b70]">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                {/* Year Select */}
                <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Fiscal Start Year</label>
                    <div className="relative group">
                        <select 
                          value={repYear} 
                          onChange={(e) => setRepYear(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent group-hover:border-blue-100 focus:border-[#1a3b70] rounded-2xl px-5 py-3 text-xs font-black text-[#1a3b70] outline-none cursor-pointer transition-all appearance-none"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>FY {y} / {parseInt(y) + 1}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-[#1a3b70]">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. LIVE STATUS INDICATOR */}
            <div className="hidden lg:flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Registry Snapshot Active</span>
                </div>
                <p className="text-[8px] font-bold text-slate-300 italic uppercase mr-1">Data synced to current registry</p>
            </div>
        </div>
      )}

      {/* 2. SHAREHOLDER SUMMARY VIEW */}
{/* --- CAPITAL & EQUITY ANALYTICS VIEW (Section 2.2.9) --- */}
{subType === 'Reports-Capital' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
     
     {/* 1. TOP KPI GRID (Requirement 9.2 - 9.6) */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportCard 
           title="Total Subscribed" 
           value={data.equity_mix?.[0]?.subscribed || 0} 
           isMoney color="text-blue-600" 
        />
        <ReportCard 
           title="Total Paid-up" 
           value={data.equity_mix?.[0]?.paid_up || 0} 
           isMoney color="text-emerald-600" 
        />
        <ReportCard 
           title="Share Premium" 
           value={data.equity_mix?.[0]?.premium || 0} 
           isMoney color="text-yellow-600" 
        />
        <ReportCard 
           title="Receivable (Gap)" 
           value={data.equity_mix?.[0]?.outstanding || 0} 
           isMoney color="text-red-500" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. CAPITAL HISTORY TIMELINE (Requirement 9.7 & 9.9) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <History size={16} className="text-blue-500" /> Authorized Capital Timeline
              </h4>
           </div>
           <div className="p-4">
              <div className="space-y-4">
                 {(data.growth_history || []).map((h, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl border-l-4 border-blue-500 transition-all">
                       <div className="text-[10px] font-black text-slate-400 w-24">
                          {h.effective_date ? new Date(h.effective_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-[#1a3b70]">{Number(h.authorized_capital || 0).toLocaleString()} ETB</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Authorized Ceiling Set</p>
                       </div>
                    </div>
                 ))}
                 {(!data.growth_history || data.growth_history.length === 0) && (
                    <p className="text-center py-10 text-slate-300 italic text-xs uppercase font-bold">No history available.</p>
                 )}
              </div>
           </div>
        </div>

        {/* 3. REGULATORY SUMMARY (Requirement 9.10) */}
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden flex flex-col justify-between">
           <div className="z-10">
              <h4 className="text-2xl font-black tracking-tighter leading-tight text-yellow-400">
                 Regulatory Capital<br/>Snapshot
              </h4>
              <div className="mt-10 space-y-6">
                 <div>
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">
                       Capital Adequacy Ratio (Internal)
                    </p>
                    <p className="text-4xl font-black text-white">
                       {data.equity_mix?.[0]?.subscribed > 0 
                         ? ((data.equity_mix[0].paid_up / data.equity_mix[0].subscribed) * 100).toFixed(2) 
                         : "0.00"}%
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                       <p className="text-[9px] font-black opacity-40 uppercase">Total Cash</p>
                       <p className="text-xs font-bold">{Number(data.equity_mix?.[0]?.total_cash_in_hand || 0).toLocaleString()} ETB</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                       <p className="text-[9px] font-black opacity-40 uppercase">NBE Approved</p>
                       <p className="text-xs font-bold">{Number(data.equity_mix?.[0]?.paid_up || 0).toLocaleString()} ETB</p>
                    </div>
                 </div>
              </div>
           </div>
           <ShieldCheck size={200} className="absolute -right-10 -bottom-10 opacity-5 text-white" />
        </div>
     </div>

     {/* 4. NBE STAGING & LIQUIDITY TRANSPARENCY (The 600M vs 500M Logic) */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        
        {/* OFFICIAL APPROVED CAPITAL (Green Card) */}
        <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="z-10 relative">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">NBE Approved Paid-Up Capital</p>
                <h3 className="text-4xl font-black mt-2">
                   {Number(data.equity_mix?.[0]?.paid_up || 0).toLocaleString()} 
                   <span className="text-sm font-normal ml-2">ETB</span>
                </h3>
                <div className="mt-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-200" />
                    <span className="text-[10px] font-bold uppercase">Legally Confirmed by Central Bank</span>
                </div>
            </div>
            <Landmark size={150} className="absolute -right-10 -bottom-10 opacity-10" />
        </div>

        {/* TOTAL BANK LIQUIDITY (Blue Card) */}
        <div className="bg-[#1a3b70] p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="z-10 relative">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Total Bank Liquidity (Inc. Staging)</p>
                <h3 className="text-4xl font-black mt-2 text-yellow-400">
                   {Number(data.equity_mix?.[0]?.total_cash_in_hand || 0).toLocaleString()} 
                   <span className="text-sm font-normal text-white ml-2">ETB</span>
                </h3>
                <div className="mt-4 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase text-blue-200">
                        {Number(data.equity_mix?.[0]?.pending_nbe_amt || 0).toLocaleString()} ETB Awaiting NBE Approval
                    </span>
                </div>
            </div>
        </div>
     </div>
  </div>
)}

      {/* 3. REGIONAL BREAKDOWN VIEW */}
      {subType === 'Reports-Region' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b font-black text-xs text-slate-800 uppercase tracking-widest bg-slate-50/50 flex items-center gap-2">
                <Landmark size={16} className="text-blue-500" /> Geographic Distribution
            </div>
            <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                    {data.regions?.map((reg, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-10 py-5 text-sm font-bold text-slate-700">{reg.address_region || 'Unspecified'}</td>
                            <td className="px-10 py-5 text-right font-black text-[#1a3b70]">{reg.count} Members</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* 4. KYC COMPLIANCE VIEW */}
      {subType === 'Reports-KYC' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-10">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8">KYC Verification Status</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {data.kyc?.map((item, i) => (
                    <div key={i} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.kyc_status} Records</p>
                        <p className={`text-5xl font-black ${item.kyc_status === 'Verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{item.count}</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 5. CERTIFICATE ANALYTICS VIEW */}
{subType === 'Reports-Certificates' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
     
     {/* UPDATE THESE 4 LINES BY ADDING [0] */}
     <div className="grid grid-cols-4 gap-6">
        <ReportCard title="Active" value={data.summary?.[0]?.active} color="text-emerald-500" />
        <ReportCard title="Electronic" value={data.summary?.[0]?.electronic} color="text-blue-500" />
        <ReportCard title="Cancelled" value={data.summary?.[0]?.cancelled} color="text-red-500" />
        <ReportCard title="Pending" value={data.summary?.[0]?.pending} color="text-amber-500" />
     </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">By Class</h4>
                    {data.by_class?.map((item, i) => (
                        <div key={i} className="flex justify-between p-4 bg-slate-50 rounded-2xl mb-2 text-xs font-bold">
                            <span>{item.class_name}</span><span>{item.count}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-[#1a3b70] p-8 rounded-[2.5rem] text-white">
                    <h4 className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-6">Incident Log</h4>
                    {data.issues?.map((item, i) => (
                        <div key={i} className="flex justify-between mb-4 border-b border-white/10 pb-2">
                            <span className="text-xs uppercase">{item.reason || 'Replacement'}</span>
                            <span className="font-black text-yellow-400">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

{/* --- TAX COMPLIANCE REPORT (Section 2.7.4) --- */}
{subType === 'Reports-Tax' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
     
     <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* ... headers ... */}
        <table className="w-full text-left">
           <thead className="bg-slate-50/50 border-b border-slate-100">
              {/* ... table headers ... */}
           </thead>
           <tbody className="divide-y divide-slate-50">
              
              {/* --- ADD Array.isArray(data) CHECK HERE --- */}
              {Array.isArray(data) ? data.map((item, i) => (
                 <tr key={i} className="hover:bg-slate-50 transition-all font-bold text-xs text-slate-600">
                    <td className="px-10 py-5">{item.financial_year} <span className="text-[9px] opacity-40 uppercase ml-2">{item.dividend_type}</span></td>
                    <td className="px-10 py-5">{Number(item.total_gross || 0).toLocaleString()} ETB</td>
                    <td className="px-10 py-5 text-red-500">{Number(item.total_tax_obligation || 0).toLocaleString()} ETB</td>
                    <td className="px-10 py-5 text-right px-10 text-emerald-600">{Number(item.total_net_payout || 0).toLocaleString()} ETB</td>
                 </tr>
              )) : (
                <tr>
                   <td colSpan="4" className="p-10 text-center text-slate-300 italic text-xs">Loading tax data...</td>
                </tr>
              )}
           </tbody>
        </table>
     </div>

     {/* Legal Disclaimer Box */}
     <div className="bg-blue-900 p-10 rounded-[3rem] text-white flex items-start gap-6 shadow-2xl relative overflow-hidden">
        {/* ... contents ... */}
        <div className="z-10">
           <h4 className="text-xl font-black tracking-tight mb-2">Tax Compliance Verified</h4>
           <p className="text-blue-200 text-xs leading-relaxed max-w-xl">
              {/* --- ADD Array.isArray(data) CHECK HERE TOO --- */}
              As per the Proclamation of Ethiopia, the system automatically deducts 10% Withholding Tax. 
              Summary of tax collected from {Array.isArray(data) ? data[0]?.total_shareholders : 0} shareholders.
           </p>
        </div>
     </div>
  </div>
)}

    {/* --- CAPITAL ACTIONS REPORT VIEW (Section 2.6.9) --- */}
{subType === 'Reports-Actions' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
     
     {/* High Level Metrics - Added Safety Guards */}
     <div className="grid grid-cols-3 gap-6">
        <ReportCard 
            title="Total Bonus Issues" 
            value={(data.event_summary || []).find(e => e.action_type === 'BONUS_ISSUE')?.total_events || 0} 
            color="text-emerald-500" 
        />
        <ReportCard 
            title="Total Splits/Consol." 
            value={(data.event_summary || []).filter(e => e.action_type?.includes('SPLIT') || e.action_type?.includes('CONSOLIDATION')).length || 0} 
            color="text-blue-500" 
        />
        <ReportCard 
            title="Executed Proposals" 
            value={(data.event_summary || []).filter(e => e.status === 'Executed').length || 0} 
            color="text-[#1a3b70]" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Par Value Change History - Added Array Guard */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex items-center gap-2">
              <History size={16} className="text-[#1a3b70]" /> 
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Par Value Evolution</h4>
           </div>
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[9px] font-black text-slate-400 uppercase border-b border-slate-50">
                    <th className="px-10 py-4">Date</th>
                    <th className="px-10 py-4">Old Par</th>
                    <th className="px-10 py-4 text-right">New Par</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {(data.par_value_history || []).map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="px-10 py-4 text-xs font-bold text-slate-500">
                          {h.effective_date ? new Date(h.effective_date).toLocaleDateString() : 'N/A'}
                       </td>
                       <td className="px-10 py-4 text-xs font-bold text-slate-400 line-through">{h.old_par_value} ETB</td>
                       <td className="px-10 py-4 text-right font-black text-[#1a3b70]">{h.new_par_value} ETB</td>
                    </tr>
                 ))}
                 {(!data.par_value_history || data.par_value_history.length === 0) && (
                    <tr><td colSpan="3" className="p-10 text-center text-xs text-slate-300 italic uppercase font-bold">No structure changes recorded.</td></tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* Executive Action Summary - Added Array Guard */}
        <div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white flex flex-col justify-between">
           <div>
              <h4 className="text-2xl font-black tracking-tighter leading-tight">Board & Regulatory<br/><span className="text-yellow-400 italic font-serif">Compliance Report</span></h4>
              <div className="mt-8 space-y-4">
                 {(data.event_summary || []).map((e, i) => (
                    <div key={i} className="flex justify-between items-center pb-3 border-b border-white/10">
                       <span className="text-[10px] font-black uppercase text-blue-200">{(e.action_type || '').replace('_',' ')}</span>
                       <span className="text-xs font-bold">{e.total_events} Events</span>
                    </div>
                 ))}
                 {(!data.event_summary || data.event_summary.length === 0) && (
                    <p className="text-xs text-blue-300 italic">No events logged for this period.</p>
                 )}
              </div>
           </div>
           <p className="text-[9px] text-blue-300/50 mt-10 leading-relaxed italic border-t border-white/5 pt-4">
              * This report provides the necessary data for Section 2.6.9, tracking all shareholding changes resulting from mass corporate actions.
           </p>
        </div>
     </div>
  </div>
)} 

{/* --- DIVIDEND ANALYTICS VIEW --- */}
{subType === 'Reports-Dividends' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
     
     {/* FIX: Add safety checks [0] for all summary cards */}
     <div className="grid grid-cols-4 gap-6">
        <ReportCard 
            title="Total Declared" 
            value={data.summary?.[0]?.total_declared_birr} 
            color="text-[#1a3b70]" 
            isMoney 
        />
        <ReportCard 
            title="Total Paid" 
            value={data.summary?.[0]?.total_paid_birr} 
            color="text-emerald-500" 
            isMoney 
        />
        <ReportCard 
            title="Total Unpaid" 
            value={data.summary?.[0]?.total_unpaid_birr} 
            color="text-orange-500" 
            isMoney 
        />
        <ReportCard 
            title="Tax Liability" 
            value={data.tax_report?.reduce((a, b) => a + (parseFloat(b.total_tax) || 0), 0)} 
            color="text-red-500" 
            isMoney 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Payment Status Table */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Payment Execution Status</h4>
           <div className="space-y-4">
              {/* Ensure payment_status is an array before mapping */}
              {Array.isArray(data.payment_status) && data.payment_status.map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${item.payment_status === 'Paid' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                           {item.payment_status}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{item.count} Shareholders</p>
                    </div>
                    <div className="text-right">
                        <span className="block font-black text-[#1a3b70]">{Number(item.amount || 0).toLocaleString()} ETB</span>
                    </div>
                 </div>
              ))}
              {(!data.payment_status || data.payment_status.length === 0) && (
                  <p className="text-center py-10 text-slate-300 italic text-xs uppercase">No payment data available</p>
              )}
           </div>
        </div>

        {/* Unclaimed Funds Alert */}
        <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-200 relative overflow-hidden flex flex-col justify-between">
           <div className="z-10">
              <ShieldAlert size={40} className="text-amber-600 mb-6" />
              <h4 className="text-2xl font-black text-amber-900 tracking-tighter leading-tight">Unclaimed Dividends</h4>
              <p className="text-amber-700 text-xs mt-4 leading-relaxed font-medium">
                 {/* Safety check for the unpaid total */}
                 Total outstanding: <span className="font-black underline">{Number(data.summary?.[0]?.total_unpaid_birr || 0).toLocaleString()} ETB</span>.
              </p>
           </div>
        </div>
     </div>
  </div>
)}

{/* --- STATUTORY & AML REPORT VIEW (Section 2.9) --- */}
{subType === 'Reports-Statutory' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
     
     {/* Concentration Analysis (Requirement 2.9.5) */}
     <div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
           <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-2">Ownership Concentration</p>
           <h4 className="text-4xl font-black tracking-tighter">
              {Number(data.concentration?.[0]?.concentration_ratio || 0).toFixed(2)}%
           </h4>
           <p className="text-blue-200 text-xs mt-2 opacity-70 italic max-w-xs">
              This percentage of total bank capital is held by the top 10 shareholders.
           </p>
        </div>
        <div className="z-10 text-right">
           <p className="text-[10px] font-bold opacity-40 uppercase mb-1">Top 10 Capital</p>
           <p className="text-2xl font-black">{Number(data.concentration?.[0]?.top_10_capital).toLocaleString()} ETB</p>
        </div>
        <Landmark size={200} className="absolute -right-10 -bottom-10 opacity-5" />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Shareholders List (Requirement 2.9.5) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp size={16} className="text-blue-500" /> Top 10 Shareholders
              </h4>
           </div>
           <div className="p-4">
              {data.top_shareholders?.map((sh, i) => (
                 <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors border-b border-slate-50 last:border-0">
                    <div>
                       <span className="text-xs font-black text-slate-700">{sh.full_name}</span>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">{sh.shareholder_id}</p>
                    </div>
                    <div className="text-right">
                       <span className="block text-xs font-black text-[#1a3b70]">{sh.no_of_share.toLocaleString()} Shares</span>
                       <span className="text-[10px] font-bold text-emerald-500">{Number(sh.ownership_pct).toFixed(3)}%</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Beneficial Ownership Disclosure (AML/CFT - Requirement 2.9.4) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-red-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                 <ShieldAlert size={16} /> Beneficial Ownership ({'>'} 2% )
              </h4>
           </div>
           <div className="p-8">
              <p className="text-xs text-slate-500 leading-relaxed mb-6 italic">
                 Regulatory compliance report flagging significant owners for AML/CFT disclosure.
              </p>
              <div className="space-y-3">
                 {data.significant_owners?.map((sh, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between">
                       <span className="text-xs font-bold text-slate-700">{sh.full_name}</span>
                       <span className="text-xs font-black text-red-600">{Number(sh.pct).toFixed(1)}%</span>
                    </div>
                 ))}
                 {data.significant_owners?.length === 0 && (
                    <p className="text-center py-10 text-slate-300 text-xs italic">No shareholders exceed the 2% threshold.</p>
                 )}
              </div>
           </div>
        </div>
     </div>
  </div>
)}

      {/* --- MOVEMENT ANALYTICS VIEW (Section 2.4.10) --- */}
{subType === 'Reports-Transfers' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 pb-20">
     
     {/* 1. High Level Metrics - Added Safety Nets */}
     <div className="grid grid-cols-4 gap-6">
        <ReportCard 
            title="Total Requests" 
            value={data.summary?.[0]?.total_requests || 0} 
            color="text-[#1a3b70]" 
        />
        <ReportCard 
            title="Pending Review" 
            value={data.summary?.[0]?.pending || 0} 
            color="text-amber-500" 
        />
        <ReportCard 
            title="Success Rate" 
            value={data.summary?.[0]?.completed || 0} 
            color="text-emerald-500" 
        />
        <ReportCard 
            title="Inheritance Cases" 
            value={data.inheritance_cases?.[0]?.count || 0} 
            color="text-purple-600" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Movement by Type Table - Added Array Guard */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-nowrap">Movement Categories</h4>
           <div className="space-y-4">
              {(data.by_type || []).map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                        <span className="text-xs font-black text-[#1a3b70] uppercase">{item.transfer_type}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Legal Settlement</p>
                    </div>
                    <div className="text-right">
                        <span className="block font-black text-slate-700">{item.count} Actions</span>
                        <span className="text-[10px] font-bold text-emerald-600">{Number(item.total_shares || 0).toLocaleString()} Shares</span>
                    </div>
                 </div>
              ))}
              {(!data.by_type || data.by_type.length === 0) && (
                  <p className="text-center py-10 text-slate-300 italic text-xs uppercase font-bold">No movements registered yet.</p>
              )}
           </div>
        </div>

        {/* 3. Audit Log Insight - FIXED THE CRASHING LINE */}
        <div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
           <div className="z-10">
              <History size={40} className="text-yellow-400 mb-6 opacity-50" />
              <h4 className="text-2xl font-black tracking-tighter leading-tight">Registry Audit<br/>Transparency</h4>
              <p className="text-blue-200 text-xs mt-4 leading-relaxed opacity-70">
                 {/* FIXED: Changed data.summary[0] to data.summary?.[0] */}
                 All {data.summary?.[0]?.total_requests || 0} movement requests are logged with timestamp, user ID, and legal document hashes to ensure NBE regulatory compliance.
              </p>
           </div>
           
           <button 
              onClick={() => window.open(`${API.defaults.baseURL}/api/reports/export-transfer-audit`, '_blank')}
              className="z-10 mt-8 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl border border-white/5"
           >
              Download Detailed Audit Log
           </button>
           <ArrowRightLeft size={200} className="absolute -right-20 -bottom-20 opacity-5" />
        </div>
     </div>
  </div>
)}

{subType === 'Reports-Quarterly' && data && (
   
  <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">

     {/* 1. REGULATORY KPI GRID */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportCard 
           title="KYC Compliance" 
           value={data.kyc?.[0] ? ((data.kyc[0].compliant / (data.kyc[0].total || 1)) * 100).toFixed(1) : "0.0"} 
           unit="%" 
           status={data.kyc?.[0] && data.kyc[0].compliant < data.kyc[0].total ? "Action Required" : "Secure"}
           color="text-blue-600" 
        />
        <ReportCard 
           title="Quarterly Inflow" 
           value={data.movement?.[0]?.total_inflow || 0} 
           isMoney 
           color="text-emerald-600" 
        />
        <ReportCard 
           title="New Enrollments" 
           value={data.movement?.[0]?.new_members || 0} 
           unit="Members" 
           color="text-[#1a3b70]" 
        />
        <ReportCard 
           title="Ownership Alert" 
           value={data.concentration?.filter(s => s.ownership_percentage > 5).length || 0} 
           unit="Limit Violations" 
           color="text-red-500" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* OWNERSHIP CHART */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Investor Composition</h4>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={data.structure?.length > 0 ? data.structure : [{type: 'No Data', value: 1}]} 
                      innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value" nameKey="type"
                    >
                       <Cell fill="#1a3b70" />
                       <Cell fill="#facc15" />
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-around mt-4">
              {data.structure?.map((s, i) => (
                 <div key={i} className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">{s.type}</p>
                    <p className="text-sm font-bold text-slate-700">{s.count}</p>
                 </div>
              ))}
              {(!data.structure || data.structure.length === 0) && (
                 <p className="text-[10px] text-slate-300 italic">No composition data</p>
              )}
           </div>
        </div>

        {/* NBE CONCENTRATION RISK TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-[#1a3b70] uppercase tracking-widest flex items-center gap-2">
                 <ShieldAlert size={16} className="text-red-500" /> Concentration Risk (NBE 5% Limit)
              </h4>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="text-[9px] font-black text-slate-400 uppercase bg-slate-50">
                    <tr>
                       <th className="px-8 py-4">Shareholder</th>
                       <th className="px-8 py-4">Ownership %</th>
                       <th className="px-8 py-4">Regulatory Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {data.concentration?.map((sh, i) => (
                       <tr key={i} className="text-xs font-bold text-slate-600">
                          <td className="px-8 py-4">{sh.full_name}</td>
                          <td className="px-8 py-4">{Number(sh.ownership_percentage || 0).toFixed(2)}%</td>
                          <td className="px-8 py-4">
                             {sh.ownership_percentage > 5 ? (
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px]">Limit Exceeded</span>
                             ) : (
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px]">Compliant</span>
                             )}
                          </td>
                       </tr>
                    ))}
                    {(!data.concentration || data.concentration.length === 0) && (
                       <tr><td colSpan="3" className="p-10 text-center text-slate-300 italic text-xs">No concentration data available</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
     </div>

     {/* PERFORMANCE PROGRESS */}
     <div className="bg-[#1a3b70] p-10 rounded-[3.5rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
        <div className="z-10 flex-1">
           <h4 className="text-2xl font-black mb-4">Capital Mobilization Goal</h4>
           <p className="text-blue-200 text-xs mb-8 leading-relaxed opacity-70">
              Monitoring the bank's yearly target achievement as per Requirement 8.2.5. 
              Figures include all paid-up capital classes.
           </p>
           <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                 <span>Actual: {Number(data.performance?.[0]?.actual || 0).toLocaleString()} ETB</span>
                 <span>Goal: {Number(data.performance?.[0]?.target || 0).toLocaleString()} ETB</span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]" 
                    style={{ width: `${Math.min(100, ((data.performance?.[0]?.actual || 0) / (data.performance?.[0]?.target || 1)) * 100)}%` }}
                 ></div>
              </div>
           </div>
        </div>
        <div className="z-10 w-48 h-48 bg-white/5 rounded-full border border-white/10 flex flex-col items-center justify-center backdrop-blur-md">
            <p className="text-4xl font-black text-yellow-400">
               {data.performance?.[0]?.target ? (((data.performance[0].actual || 0) / data.performance[0].target) * 100).toFixed(1) : "0.0"}%
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest text-blue-200 mt-2">Achieved</p>
        </div>
     </div>
  </div>
)}

{subType === 'Reports-Monthly' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">
     
     {/* 1. SELECTOR BAR (Unchanged Functionality) */}
     <div className="flex gap-4 mb-8 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 items-center border border-slate-100">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
            <div className="w-10 h-10 bg-[#1a3b70] rounded-xl flex items-center justify-center text-white"><Calendar size={20} /></div>
            <h3 className="text-sm font-black text-[#1a3b70] uppercase">Monthly Closing</h3>
        </div>
        
        <select value={repMonth} onChange={(e) => setRepMonth(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer">
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
            ))}
        </select>

        <select value={repYear} onChange={(e) => setRepYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer">
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        
        <button onClick={() => window.print()} className="ml-auto bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-emerald-100">
           <Printer size={14}/> Print Internal Audit
        </button>
     </div>

     {/* 2. REQUIREMENT 8.3 KPI GRID (Now with Safety Nets) */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 8.3.1 Verified Shareholder Activity */}
        <ReportCard 
            title="Verified Shareholder Registry" 
            value={data.register_activity?.[0]?.new_verified || 0} 
            status={`${Number(data.register_activity?.[0]?.value_added || 0).toLocaleString()} ETB Added`}
            color="text-[#1a3b70]" 
        />
        
        {/* 8.3.4 National ID Compliance - Fixed math safety */}
        <ReportCard 
            title="National ID Compliance" 
            value={
                data.id_compliance?.[0]?.total_members > 0 
                ? ((data.id_compliance[0].with_id / data.id_compliance[0].total_members) * 100).toFixed(1) 
                : "0.0"
            } 
            unit="%" 
            status={`${data.id_compliance?.[0]?.with_id || 0} of ${data.id_compliance?.[0]?.total_members || 0} Documents`}
            color="text-blue-600" 
        />

        {/* 8.3.6 Service Charge Income */}
        <ReportCard 
            title="Service Fee Income" 
            value={data.service_income?.[0]?.total_fees || 0} 
            isMoney 
            status="From Share Movement Processing"
            color="text-emerald-600" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 8.3.2 Capital Increase/Decrease Summary */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Structural Capital Changes</h4>
              <ShieldCheck size={16} className="text-blue-500" />
           </div>
           <div className="p-8">
              {Array.isArray(data.capital_summary) && data.capital_summary.length > 0 ? (
                  data.capital_summary.map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-3">
                          <span className={`px-2 py-1 rounded text-[9px] font-black ${c.event_type === 'INCREASE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                             {c.event_type}
                          </span>
                          <span className="text-sm font-black text-[#1a3b70]">{Number(c.amount).toLocaleString()} ETB</span>
                      </div>
                  ))
              ) : (
                <div className="text-center py-10">
                   <p className="text-xs text-slate-300 italic uppercase font-bold">No structural limit changes this month.</p>
                </div>
              )}
           </div>
        </div>

        {/* 8.3.3 Share Transfers & Inheritance Activity */}
        <div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white">
           <h4 className="text-xl font-black mb-6 uppercase tracking-tight">Movement & Inheritance activity</h4>
           <div className="space-y-4">
              {Array.isArray(data.movements) && data.movements.length > 0 ? (
                 data.movements.map((m, i) => (
                    <div key={i} className="flex justify-between items-center pb-3 border-b border-white/10">
                       <div>
                          <p className="text-xs font-bold uppercase">{m.transfer_type}</p>
                          <p className="text-[9px] text-blue-300">{m.count} Successful Cases</p>
                       </div>
                       <p className="font-black text-yellow-400">{Number(m.total_shares || 0).toLocaleString()} <span className="text-[8px] opacity-50">Shares</span></p>
                    </div>
                 ))
              ) : (
                 <p className="text-xs text-blue-200 italic">No share movements recorded this month.</p>
              )}
           </div>

           {/* 8.3.5 Reconciliation & Adjustment status */}
           <div className="mt-12 p-5 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Reconciliation Status</p>
                 <p className="text-xs font-bold mt-1">{(data.adjustments?.[0]?.count || 0)} Manual Adjustments Logged</p>
              </div>
              <ShieldAlert className="text-yellow-400 opacity-50" />
           </div>
        </div>
     </div>
  </div>
)}

{subType === 'Reports-Weekly' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">
     
      {/* 1. DATE PICKER & SELECTOR BAR */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/30 items-center border border-slate-100 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 pr-8 border-r border-slate-100">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <Calendar size={24} />
              </div>
              <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Audit Start</p>
                  <input 
                    type="date" 
                    value={auditStartDate}
                    onChange={(e) => setAuditStartDate(e.target.value)}
                    className="bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-xl px-4 py-1.5 text-xs font-black text-[#1a3b70] outline-none cursor-pointer transition-all"
                  />
              </div>
          </div>

          <div className="flex-1">
              <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Active Oversight Window</p>
                      <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-[#1a3b70]">{new Date(auditStartDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})}</span>
                          <ChevronRight size={14} className="text-slate-300" />
                          <span className="text-xs font-black text-[#1a3b70]">{new Date(auditEndDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}</span>
                      </div>
                  </div>
                  <div className="hidden lg:block text-[9px] font-bold text-slate-300 uppercase leading-relaxed max-w-[150px]">
                      System is auditing a fixed 7-day operational cycle.
                  </div>
              </div>

              {/* MONTH CROSSING WARNING */}
              {new Date(auditStartDate).getMonth() !== new Date(auditEndDate).getMonth() && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-600 animate-pulse">
                    <AlertTriangle size={10} />
                    <p className="text-[8px] font-black uppercase">Note: This week crosses into a new fiscal month.</p>
                </div>
              )}
          </div>

          {/* QUICK JUMP PRESETS */}
          <div className="flex gap-2">
              <button 
                onClick={() => setAuditStartDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-slate-50 hover:bg-[#1a3b70] hover:text-white rounded-xl text-[9px] font-black uppercase transition-all"
              >
                Today
              </button>
              <button 
                onClick={() => {
                    const lastMon = new Date();
                    lastMon.setDate(lastMon.getDate() - (lastMon.getDay() || 7) + 1);
                    setAuditStartDate(lastMon.toISOString().split('T')[0]);
                }}
                className="px-4 py-2 bg-slate-50 hover:bg-[#1a3b70] hover:text-white rounded-xl text-[9px] font-black uppercase transition-all"
              >
                Current Week
              </button>
          </div>
      </div>

     {/* 2. RISK KPI GRID - ADDED ?. SAFETY NETS */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportCard 
            title="Weekly Share Sales" 
            value={data.weekly_sales?.[0]?.count || 0} 
            status={`${Number(data.weekly_sales?.[0]?.value || 0).toLocaleString()} ETB`}
            color="text-[#1a3b70]" 
        />
        <ReportCard 
            title="Unpaid Balance (Debt)" 
            value={data.partial_payments?.[0]?.total_debt || 0} 
            isMoney color="text-red-500" 
        />
        <ReportCard 
            title="Legal / Frozen" 
            value={data.legal_disputes?.[0]?.count || 0} 
            status="Under Litigation"
            color="text-purple-600" 
        />
        <ReportCard 
            title="Reconciliation Rejects" 
            value={data.exceptions?.[0]?.count || 0} 
            status="Pending Review"
            color="text-orange-600" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* OPERATIONAL RISKS - ADDED ?. SAFETY NETS */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <ShieldAlert size={16} className="text-red-500" /> Operational Exceptions
              </h4>
           </div>
           <div className="p-8 space-y-6">
              <div className="flex justify-between items-center p-5 bg-red-50 rounded-2xl border border-red-100">
                 <div>
                    <p className="text-[10px] font-black text-red-600 uppercase">Incomplete Records</p>
                    <p className="text-xs font-bold text-red-800">Missing National ID or Agreement</p>
                 </div>
                 <span className="text-2xl font-black text-red-600">{data.incomplete_records?.[0]?.count || 0}</span>
              </div>

              <div className="flex justify-between items-center p-5 bg-amber-50 rounded-2xl border border-amber-100">
                 <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase">Restricted Shares</p>
                    <p className="text-xs font-bold text-amber-800">Collateralized / Pledged to Loans</p>
                 </div>
                 <span className="text-2xl font-black text-amber-600">{data.restricted?.[0]?.count || 0}</span>
              </div>
           </div>
        </div>

        {/* LEGAL OVERSIGHT - ADDED ?. SAFETY NETS */}
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden">
           <div className="z-10">
              <Gavel size={40} className="text-yellow-400 mb-6" />
              <h4 className="text-2xl font-black tracking-tight">Legal & Court Case Audit</h4>
              <p className="text-blue-200 text-xs mt-4 leading-relaxed opacity-70">
                 Total of <span className="text-yellow-400 font-bold">{data.legal_disputes?.[0]?.count || 0} accounts</span> are currently flagged with "Is Frozen" or "Under Litigation" status. No transfers or dividends can be processed for these members without Board clearance.
              </p>
           </div>
           <button className="z-10 mt-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              Download Dispute List (PDF)
           </button>
           <Lock size={200} className="absolute -right-10 -bottom-10 opacity-5" />
        </div>
     </div>
  </div>
)}

{subType === 'Reports-Daily' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">
     
     {/* 1. EOD HEADER & DATE PICKER (Old functionality preserved) */}
     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Zap size={28} className="text-yellow-400" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Daily Operational Control</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time Risk Monitoring • End of Day Audit</p>
            </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
           <span className="text-[10px] font-black text-slate-400 uppercase ml-4">Audit Date:</span>
           <input 
             type="date" 
             value={repDate} 
             onChange={(e) => setRepDate(e.target.value)}
             className="bg-white border-none rounded-xl px-4 py-2 text-xs font-black text-[#1a3b70] outline-none cursor-pointer shadow-sm"
           />
        </div>
     </div>

     {/* 2. OPERATIONAL KPI GRID (Safety nets preserved) */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ReportCard 
           title="New Subscriptions" 
           value={data.registrations?.[0]?.count || 0} 
           color="text-[#1a3b70]" 
        />
        <ReportCard 
           title="Daily Cash Received" 
           value={data.payments?.[0]?.total_cash || 0} 
           isMoney color="text-emerald-600" 
        />
        <ReportCard 
           title="Shares Issued (Units)" 
           value={data.allotments?.[0]?.total_shares || 0} 
           color="text-blue-600" 
        />
        <ReportCard 
           title="Restrictions Updated" 
           value={data.restrictions?.[0]?.count || 0} 
           status="Frozen/Pledged" color="text-orange-500" 
        />
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECONCILIATION LEDGER (Added Array Guard) */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={16} className="text-emerald-500" /> Registry vs. Bank Reconciliation
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cash In vs. Equity Out</span>
           </div>
           <table className="w-full text-left">
              <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase">
                 <tr>
                    <th className="px-8 py-4">Transaction Type</th>
                    <th className="px-8 py-4">Reference</th>
                    <th className="px-8 py-4">Status/Branch</th>
                    <th className="px-8 py-4 text-right">Amount (ETB)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {/* FIXED: Added (data.reconciliation_ledger || []) to prevent .map crash */}
                 {(data.reconciliation_ledger || []).map((item, i) => (
                    <tr key={i} className="text-xs font-bold text-slate-600">
                       <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] ${item.type === 'PAYMENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                             {item.type}
                          </span>
                       </td>
                       <td className="px-8 py-4 font-mono text-[10px]">{item.ref}</td>
                       <td className="px-8 py-4 text-slate-400 uppercase text-[9px]">{item.info}</td>
                       <td className={`px-8 py-4 text-right ${item.type === 'PAYMENT' ? 'text-emerald-600' : 'text-[#1a3b70]'}`}>
                          {Number(item.value).toLocaleString()}
                       </td>
                    </tr>
                 ))}
                 {(!data.reconciliation_ledger || data.reconciliation_ledger.length === 0) && (
                    <tr><td colSpan="4" className="p-10 text-center text-slate-300 italic">No activity for this date.</td></tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* SUSPICIOUS ACTIVITY & BLOCKED (Added Array Guard & JSON Safety) */}
        <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 flex flex-col">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <ShieldAlert size={20} />
              </div>
              <h4 className="text-sm font-black text-red-900 uppercase">Risk Control Flags</h4>
           </div>
           
           <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
              {/* FIXED: Added (data.suspicious || []) and safe JSON parsing */}
              {(data.suspicious || []).map((s, i) => {
                 let detailsText = "System Action";
                 try {
                    const parsed = typeof s.details === 'string' ? JSON.parse(s.details) : s.details;
                    detailsText = parsed?.event || parsed?.info || "Rejected Transaction";
                 } catch(e) { detailsText = s.details || "Manual Override Logged"; }

                 return (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-red-50">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-red-600 uppercase">Suspicious Action</span>
                          <span className="text-[8px] text-slate-400">{new Date(s.created_at).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-[11px] font-bold text-slate-700">{detailsText}</p>
                       <p className="text-[9px] text-slate-400 mt-1 italic">Flagged by: {s.performed_by}</p>
                    </div>
                 );
              })}
              {(!data.suspicious || data.suspicious.length === 0) && (
                 <div className="py-20 text-center">
                    <CheckCircle className="mx-auto text-emerald-400 mb-2" size={32} />
                    <p className="text-[10px] font-black text-emerald-600 uppercase">No Risk Alerts Today</p>
                 </div>
              )}
           </div>
        </div>
     </div>
  </div>
)}

{subType === 'Reports-Payments' && data && (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">
     
     {/* 1. COLLECTION PERFORMANCE DASHBOARD */}
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1a3b70] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
           <p className="text-[10px] font-black opacity-50 uppercase">Total Subscribed</p>
           <h3 className="text-2xl font-black mt-1">
              {Number(data.summary?.total_subscribed || 0).toLocaleString()} <span className="text-xs opacity-50">ETB</span>
           </h3>
           <Landmark className="absolute -right-4 -bottom-4 opacity-10" size={80} />
        </div>

        <ReportCard 
           title="Total Cash Collected" 
           value={data.summary?.total_paid || 0} 
           isMoney color="text-emerald-600" 
        />

        <ReportCard 
           title="Remaining Receivables" 
           value={data.summary?.total_outstanding || 0} 
           isMoney color="text-red-500" 
        />

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase">Collection Rate</p>
           <h3 className="text-3xl font-black text-[#1a3b70] mt-1">
              {/* FIX: Check if subscribed > 0 to avoid NaN */}
              {data.summary?.total_subscribed > 0 
                ? ((data.summary.total_paid / data.summary.total_subscribed) * 100).toFixed(1) 
                : "0.0"}%
           </h3>
           <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                 className="h-full bg-[#1a3b70]" 
                 style={{width: `${data.summary?.total_subscribed > 0 ? (data.summary.total_paid / data.summary.total_subscribed) * 100 : 0}%`}}
              ></div>
           </div>
        </div>
     </div>

     {/* 2. MASTER TRANSACTION LEDGER TABLE */}
     <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
           <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <History size={18} className="text-blue-600" /> Master Capital Payment Ledger
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Formal Audit Trail of all Bank Slips</p>
           </div>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">
              <Download size={14}/> Export Ledger
           </button>
        </div>

        <table className="w-full text-left">
           <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase border-b border-slate-100">
              <tr>
                 <th className="px-8 py-5">Value Date</th>
                 <th className="px-8 py-5">Shareholder Identity</th>
                 <th className="px-8 py-5">Reference / Slip No.</th>
                 <th className="px-8 py-5 text-right">Amount (ETB)</th>
                 <th className="px-8 py-5 text-center">Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
              {(data.ledger || []).map((p, i) => (
                 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">{new Date(p.payment_date).toLocaleDateString('en-GB')}</td>
                    <td className="px-8 py-4">
   <button 
      onClick={() => handleSHDrillDown(p.shareholder_id)}
      className="text-left group outline-none"
   >
      <p className="font-black text-slate-800 group-hover:text-blue-600 transition-colors underline decoration-slate-200 underline-offset-4">
         {p.full_name}
      </p>
      <p className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
         {p.sh_code} <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100" />
      </p>
   </button>
</td>
                    <td className="px-8 py-4 font-mono text-blue-600">{p.reference_no}</td>
                    <td className="px-8 py-4 text-right font-black text-[#1a3b70]">{Number(p.amount_paid).toLocaleString()}</td>
                    <td className="px-8 py-4 text-center">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.status}
                       </span>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
        {(!data.ledger || data.ledger.length === 0) && (
           <div className="py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No payment records found.</div>
        )}
     </div>
  </div>
)}

{selectedSH && shSummary && (
  <div className="fixed inset-0 bg-[#1a3b70]/90 backdrop-blur-md z-[300] flex items-center justify-center p-6 no-print-bg">
    
    {/* Use this ID to target for printing */}
    <div id="printable-statement" className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 print:m-0 print:shadow-none print:rounded-none">
      
      {/* STATEMENT HEADER */}
      <div className="p-10 border-b bg-slate-50/50 flex justify-between items-start print:bg-white print:pb-4">
         <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#1a3b70] rounded-[2rem] flex items-center justify-center text-white text-3xl font-black print:text-black print:bg-transparent print:border-2 print:border-black print:w-14 print:h-14">
               {shSummary.full_name.charAt(0)}
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 uppercase print:text-lg">{shSummary.full_name}</h3>
               <p className="text-xs font-bold text-blue-600 uppercase print:text-slate-400">{shSummary.shareholder_id}</p>
            </div>
         </div>
         {/* Mark buttons with "no-print" */}
         <button onClick={() => setSelectedSH(null)} className="p-3 bg-white rounded-2xl text-slate-300 hover:text-red-500 border no-print">
            <X size={24} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 print:p-0 print:overflow-visible print:mt-10">
         {/* SUMMARY GRID */}
         <div className="grid grid-cols-3 gap-6 print:gap-4">
            <div className="bg-slate-900 p-6 rounded-[2rem] text-white print:bg-white print:text-black print:border print:border-slate-200">
               <p className="text-[10px] font-bold opacity-50 uppercase print:opacity-100 print:text-slate-400">Subscribed</p>
               <p className="text-xl font-black">{Number(shSummary.no_of_share_birr).toLocaleString()} ETB</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 print:bg-white">
               <p className="text-[10px] font-black text-emerald-600 uppercase">Total Paid-Up</p>
               <p className="text-xl font-black text-emerald-700 print:text-black">{Number(shSummary.paidup_birr).toLocaleString()} ETB</p>
            </div>
            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 print:bg-white">
               <p className="text-[10px] font-black text-red-600 uppercase">Outstanding</p>
               <p className="text-xl font-black text-red-700 print:text-black">{(shSummary.no_of_share_birr - shSummary.paidup_birr).toLocaleString()} ETB</p>
            </div>
         </div>

         {/* TRANSACTION TABLE */}
         <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest print:text-black">Transaction History</h4>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm print:border-t-2 print:rounded-none">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase print:text-black">
                     <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4 text-right">Credit (ETB)</th>
                        <th className="px-6 py-4 text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
                     {shStatement.map((p, i) => (
                        <tr key={i}>
                           <td className="px-6 py-4">{new Date(p.payment_date).toLocaleDateString('en-GB')}</td>
                           <td className="px-6 py-4 font-mono">{p.reference_no}</td>
                           <td className="px-6 py-4 text-right font-black text-emerald-600 print:text-black">{Number(p.amount_paid).toLocaleString()}</td>
                           <td className="px-6 py-4 text-center uppercase text-[8px]">{p.status}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="p-8 bg-slate-50 border-t flex justify-end gap-4 no-print">
         <button onClick={() => window.print()} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">
            <Printer size={16}/> Print Statement
         </button>
         <button onClick={() => setSelectedSH(null)} className="px-10 py-3 bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase">
            Close
         </button>
      </div>

      <style>{`
        @media print {
          /* 1. Hide specific components that should never print */
          .no-print, button, .w-64, header {
            display: none !important;
          }

          /* 2. Reset fixed positioning of the modal background */
          .fixed.inset-0 {
            position: absolute !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          /* 3. Force the card to the absolute top of the paper */
          #printable-statement {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }

          /* 4. Ensure scrolling content expands for the printer */
          .overflow-y-auto {
            overflow: visible !important;
            height: auto !important;
          }

          /* 5. Clean up A4 page headers and footers */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>

    </div>
  </div>
)}

    </div>
  );
};

const ReportCard = ({ title, value, status, color, isMoney }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-between group hover:border-yellow-400 transition-all">
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
     <div className="flex items-end justify-between">
        <p className={`text-2xl font-black ${color || 'text-[#1a3b70]'}`}>
           {isMoney ? Number(value || 0).toLocaleString() : (value || 0)}
           {isMoney && <span className="text-[10px] ml-1 opacity-40 font-bold">ETB</span>}
        </p>
        {status && <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase ${status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{status}</span>}
     </div>
  </div>
);

export default ReportsModule;
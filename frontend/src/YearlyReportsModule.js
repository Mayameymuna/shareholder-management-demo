import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Calendar, FileCheck, TrendingUp, ShieldAlert, Download, Landmark 
} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const YearlyReportsModule = () => {
  const [data, setData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const handleExportRegister = async () => {
    try {
        // We call the full registry export API we built earlier
        const response = await API.get('/api/shareholders/export/full');
        
        // Trigger download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Rammis_Bank_YearEnd_Register_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        alert("Year-end Register Exported Successfully!");
    } catch (err) {
        alert("Failed to export. Ensure you have registered shareholders for this period.");
    }
};

  // --- 2. FETCH YEARS ON MOUNT ---
  useEffect(() => {
    API.get('/api/reports/available-years')
      .then(res => {
          setAvailableYears(res.data);
          // Set the default selection to the most recent year in the DB
          setSelectedYear(res.data[0].toString());
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/reports/yearly-summary?year=${selectedYear}`)
      .then(res => { setData(res.data); setLoading(false); });
  }, [selectedYear]);

  if (loading || !data) return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-[0.3em]">Building Annual Financial Report...</div>;

  const COLORS = ['#1a3b70', '#e2e8f0'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. REPORT HEADER & YEAR PICKER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-sm"><Calendar size={28}/></div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Yearly Periodic Reports</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">• Fiscal Year {selectedYear}</p>
            </div>
         </div>
         <div className="flex gap-3">
            <select 
  value={selectedYear} 
  onChange={(e) => setSelectedYear(e.target.value)}
  className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-[#1a3b70] outline-none cursor-pointer hover:border-yellow-400 transition-all"
>
   {/* --- DYNAMIC YEAR MAPPING --- */}
   {availableYears.map(year => (
      <option key={year} value={year}>
         Fiscal Year {year}
      </option>
   ))}
</select>
            <button 
   onClick={handleExportRegister} // <--- LINK THE FUNCTION HERE
   className="bg-[#1a3b70] hover:bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl transition-all active:scale-95"
>
   <Download size={20} className="text-yellow-400" /> EXPORT YEAR-END REGISTER
</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 2. INTERACTIVE CAPITAL MOVEMENT CHART (Section 8.1.1) */}
<div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
    <div className="flex justify-between items-center mb-10">
        <div>
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Capital Accumulation Trend</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Monthly Subscribed vs. Paid-up Comparison</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#1a3b70] rounded-full"></div><span className="text-[9px] font-bold text-slate-500 uppercase">Subscribed</span></div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div><span className="text-[9px] font-bold text-slate-500 uppercase">Paid-up</span></div>
        </div>
    </div>
    
    <div className="h-72 w-full">
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.movement} barGap={8}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
             <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fontWeight: 800, fill: '#1a3b70'}} 
                dy={15} 
             />
             <YAxis hide />
             <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '15px'}}
                itemStyle={{fontSize: '12px', fontWeight: '900', textTransform: 'uppercase'}}
             />
             {/* Subscribed Bar */}
             <Bar dataKey="monthly_subscribed" fill="#e2e8f0" radius={[10, 10, 0, 0]} barSize={25} />
             {/* Paid-up Bar */}
             <Bar dataKey="monthly_paidup" fill="#facc15" radius={[10, 10, 0, 0]} barSize={25} />
          </BarChart>
       </ResponsiveContainer>
    </div>
</div>

         {/* 3. REGULATORY COMPLIANCE SUMMARY (Section 8.1.3) */}
         <div className="bg-[#1a3b70] p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="z-10">
               <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="text-yellow-400" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">NBE Compliance Summary</h3>
               </div>
               
               <div className="space-y-8">
                  <div>
                     <p className="text-[10px] opacity-50 uppercase font-bold mb-1">Paid-up vs. Authorized</p>
                     <p className="text-3xl font-black">
   {data.compliance.auth_limit > 0 
     ? ((data.compliance.total_paidup / data.compliance.auth_limit) * 100).toFixed(1) 
     : "0.0"}%
</p>
                  </div>
                  
                  <div className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase">
                        <span>Total Paid-up</span>
                        <span className="text-yellow-400">{Number(data.compliance.total_paidup).toLocaleString()} ETB</span>
                     </div>
                     <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 transition-all duration-1000" style={{width: `${(data.compliance.total_paidup / data.compliance.auth_limit) * 100}%`}}></div>
                     </div>
                     <p className="text-[9px] opacity-40 italic">Regulatory Ceiling: {Number(data.compliance.auth_limit).toLocaleString()} ETB</p>
                  </div>
               </div>
            </div>
            <Landmark className="absolute -right-10 -bottom-10 opacity-5 text-white" size={200} />
         </div>

         {/* 4. STRUCTURAL CAPITAL EVENTS (Requirement 8.3.2) */}
{/* 4. STRUCTURAL CAPITAL EVENTS (Requirement 8.3.2) */}
<div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mt-8">
    <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
        <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Capital Structure Events</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Summary of Authorized Limit Adjustments</p>
        </div>
        <div className="px-4 py-1 bg-blue-100 text-[#1a3b70] rounded-lg text-[10px] font-black uppercase">
            {data.events?.length || 0} Events Logged
        </div>
    </div>
    
    <table className="w-full text-left">
        <thead className="bg-slate-50 font-black text-[9px] text-slate-400 uppercase tracking-widest border-b">
            <tr>
                <th className="px-10 py-5">Event Type</th>
                <th className="px-10 py-5">Resolution No.</th>
                <th className="px-10 py-5">Effective Date</th>
                <th className="px-10 py-5 text-right">Value (ETB)</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {data.events?.map((ev, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${ev.event_type === 'INCREASE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {ev.event_type}
                        </span>
                    </td>
                    <td className="px-10 py-4 text-xs font-mono font-bold text-slate-500">{ev.board_resolution_no}</td>
                    <td className="px-10 py-4 text-xs font-bold text-slate-400">
                        {new Date(ev.effective_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-10 py-4 text-right font-black text-[#1a3b70]">
                        {Number(ev.amount).toLocaleString()}
                    </td>
                </tr>
            ))}
            {(!data.events || data.events.length === 0) && (
                <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-300 italic text-xs uppercase font-bold">No structural capital changes in this fiscal year.</td>
                </tr>
            )}
        </tbody>
    </table>
</div>

      </div>
    </div>
  );
};

export default YearlyReportsModule;
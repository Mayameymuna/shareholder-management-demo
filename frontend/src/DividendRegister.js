import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Filter, Landmark, User, ArrowRight } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const DividendRegister = () => {
  const [register, setRegister] = useState([]);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    API.get(`/api/dividends/master-register?search=${search}&year=${yearFilter}`)
      .then(res => setRegister(res.data))
      .catch(err => console.log(err));
  }, [search, yearFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* REGISTER FILTERS */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-4">
         <div className="flex-1 flex items-center gap-3 bg-slate-50 rounded-2xl px-5 py-3 border-2 border-transparent focus-within:border-yellow-400 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
               type="text" 
               placeholder="Search Register by Name or Member ID..." 
               className="bg-transparent border-none outline-none text-sm w-full font-bold text-[#1a3b70]"
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <select 
            className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-xs font-black text-slate-500 outline-none"
            onChange={(e) => setYearFilter(e.target.value)}
         >
            <option value="">All Years</option>
            <option value="2023/24">2023/24</option>
            <option value="2024/25">2024/25</option>
         </select>
         <button className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2">
            <Download size={16}/> Export Register
         </button>
      </div>

      {/* THE OFFICIAL LEDGER TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Shareholder</th>
              <th className="px-8 py-6">Event</th>
              <th className="px-8 py-6 text-center">Shares</th>
              <th className="px-8 py-6">Gross (ETB)</th>
              <th className="px-8 py-6 text-red-500">Tax (10%)</th>
              <th className="px-8 py-6 text-emerald-600">Net Payout</th>
              <th className="px-8 py-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {register.map((reg) => (
              <tr key={reg.payout_id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5">
                   <p className="text-xs font-black text-slate-700">{reg.full_name}</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase">{reg.sh_code}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-[10px] font-black text-[#1a3b70]">{reg.financial_year}</p>
                   <p className="text-[8px] text-slate-400 uppercase font-bold">Rate: {reg.rate} per share</p>
                </td>
                <td className="px-8 py-5 text-center font-black text-slate-500 text-xs">{reg.eligible_shares.toLocaleString()}</td>
                <td className="px-8 py-5 text-xs font-bold text-slate-600">{Number(reg.gross_dividend).toLocaleString()}</td>
                <td className="px-8 py-5 text-xs font-bold text-red-400">-{Number(reg.tax_withheld).toLocaleString()}</td>
                <td className="px-8 py-5 text-xs font-black text-emerald-600">{Number(reg.net_dividend).toLocaleString()}</td>
                <td className="px-8 py-5">
                   <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase ${reg.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {reg.payment_status}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {register.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No records found in dividend history.</div>}
      </div>
    </div>
  );
};

export default DividendRegister;
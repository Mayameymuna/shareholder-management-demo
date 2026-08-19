import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Trophy, UserCheck, Plus, Save } from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const StaffPerformanceModule = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    API.get('/api/staff/performance').then(res => setData(res.data));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
         <div>
            <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter">Sales Performance</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Staff Targets & Achievements</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {data.map(staff => {
            const progress = staff.target > 0 ? (staff.actual / staff.target) * 100 : 0;
            return (
               <div key={staff.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group hover:border-yellow-400 transition-all">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-[#1a3b70] border border-slate-100">{staff.name.charAt(0)}</div>
                        <div>
                           <h4 className="font-black text-slate-800">{staff.name}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{staff.count_shareholders} Shareholders Recruited</p>
                        </div>
                     </div>
                     {progress >= 100 && <Trophy className="text-yellow-400 animate-bounce" size={24} />}
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-slate-400 text-nowrap">Actual: {Number(staff.actual).toLocaleString()} ETB</span>
                        <span className="text-blue-600">Target: {Number(staff.target).toLocaleString()} ETB</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-[#1a3b70]'}`} 
                           style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                     </div>
                     <p className="text-right text-[10px] font-black text-[#1a3b70]">{progress.toFixed(1)}% Achieved</p>
                  </div>
               </div>
            );
         })}
      </div>
    </div>
  );
};

export default StaffPerformanceModule;
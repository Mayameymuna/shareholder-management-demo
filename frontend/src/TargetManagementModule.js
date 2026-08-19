import React, { useState, useEffect } from 'react';
import { 
  Target, X, UserCheck, Edit, Trash2, History, TrendingUp, 
  Award, Info, LayoutGrid, List, Download
} from 'lucide-react';
import axios from 'axios';
import API from './api'; // Import the centralized API instance

const TargetManagementModule = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [staffData, setStaffData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTargetId, setCurrentTargetId] = useState(null);
const currentYear = new Date().getFullYear();
const dynamicYearRange = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  // 'BSC' = original per-branch scorecard table. 'Matrix' = yearly quarter-by-quarter grid.
  const [viewMode, setViewMode] = useState('BSC');
  const [matrixData, setMatrixData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const currentUser = localStorage.getItem('userName') || 'Admin';

  // Single source of truth for the target-assignment form.
  // start/end are always what actually gets submitted; fiscal_year/quarter
  // are just a convenience UI for auto-filling start/end.
 const [formData, setFormData] = useState({
  amount: '',
  recruitment_target: '5',
  start: '',
  end: '',
  fiscal_year: new Date().getFullYear().toString(), // Dynamic default
  quarter: '1',
  campaign_name: 'General Sales'
});

  const fetchBranches = () => {
    API.get('/api/branches?limit=100').then(res => {
      setBranches(res.data.data || []);
    });
  };

  const fetchStaff = () => {
    if (selectedBranch) {
      API.get(`/api/staff/targets-overview?branch=${encodeURIComponent(selectedBranch)}`)
           .then(res => setStaffData(res.data || []));
    }
  };

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { fetchStaff(); }, [selectedBranch]);

  // Only fetch the matrix when it's actually needed
  useEffect(() => {
    if (selectedBranch && viewMode === 'Matrix') {
      API.get(`/api/staff/performance-matrix?branch=${encodeURIComponent(selectedBranch)}&year=${selectedYear}`)
           .then(res => setMatrixData(res.data || []))
           .catch(err => console.log(err));
    }
  }, [selectedBranch, selectedYear, viewMode]);

  // PROFESSIONAL BSC LOGIC
  const calculateBSC = (actual, target, count, countTarget) => {
    if (!target && !countTarget) return 0;
    const financialScore = target > 0 ? (actual / target) * 70 : 0;
    const recruitmentGoal = countTarget || 5;
    const growthScore = (count / recruitmentGoal) * 30;
    const total = parseFloat(financialScore) + parseFloat(growthScore);
    return Math.min(100, total).toFixed(1);
  };

  const getStatus = (score) => {
    if (score >= 90) return { label: 'Elite Performer', color: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' };
    if (score >= 70) return { label: 'On Track', color: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' };
    if (score >= 40) return { label: 'Improving', color: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' };
    return { label: 'Critical Review', color: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
  };

  // Ethiopian-bank-context quarter → calendar date mapping
// Ethiopian/Banking Fiscal Quarter → calendar date mapping
const getQuarterDates = (q, year) => {
    const yr = parseInt(year);
    const nextYr = yr + 1;

    const dates = {
      // Q1 & Q2 are in the starting year
      '1': { start: `${yr}-07-01`, end: `${yr}-09-30` },
      '2': { start: `${yr}-10-01`, end: `${yr}-12-31` },
      // Q3 & Q4 are in the following calendar year
      '3': { start: `${nextYr}-01-01`, end: `${nextYr}-03-31` },
      '4': { start: `${nextYr}-04-01`, end: `${nextYr}-06-30` },
    };
    return dates[q];
};

  // Called by the quarter/year pickers in the modal to auto-fill start/end
  const applyQuarter = (quarter, fiscalYear) => {
    const { start, end } = getQuarterDates(quarter, fiscalYear);
    setFormData(prev => ({ ...prev, quarter, fiscal_year: fiscalYear, start, end }));
  };

  const calculateBalancedScore = (actual, target, count, countTarget) => {
    if (!target && !countTarget) return 0;
    const financialScore = target > 0 ? (actual / target) * 70 : 0;
    const recruitmentGoal = countTarget || 5;
    const growthScore = (count / recruitmentGoal) * 30;
    return (parseFloat(financialScore) + parseFloat(growthScore)).toFixed(1);
};

const calculateYearly = (staff) => {
    const q1T = Number(staff.q1_target) || 0;
    const q2T = Number(staff.q2_target) || 0;
    const q3T = Number(staff.q3_target) || 0;
    const q4T = Number(staff.q4_target) || 0;

    const q1A = Number(staff.q1_actual) || 0;
    const q2A = Number(staff.q2_actual) || 0;
    const q3A = Number(staff.q3_actual) || 0;
    const q4A = Number(staff.q4_actual) || 0;

    const totalTarget = q1T + q2T + q3T + q4T;
    const totalActual = q1A + q2A + q3A + q4A;

    // Prefer summing per-quarter recruitment (matches the #2 fields) so the
    // yearly count is always consistent with what's shown in each cell.
    // Falls back to the flat recruitment_count field if the backend hasn't
    // added quarterly recruitment yet.
    const hasQuarterlyRecruitment = ['q1_recruitment','q2_recruitment','q3_recruitment','q4_recruitment']
        .some(k => staff[k] !== undefined);

    const totalRecruitment = hasQuarterlyRecruitment
        ? (Number(staff.q1_recruitment) || 0) + (Number(staff.q2_recruitment) || 0)
          + (Number(staff.q3_recruitment) || 0) + (Number(staff.q4_recruitment) || 0)
        : Number(staff.recruitment_count) || 0;

    const recruitmentGoal = Number(staff.recruitment_target) || 0;

    const balancedScore = calculateBalancedScore(totalActual, totalTarget, totalRecruitment, recruitmentGoal);

    return {
        totalTarget,
        totalActual,
        totalRecruitment,
        pct: balancedScore // true balanced score, can exceed 100 → Elite badge works
    };
};

  const handleEditClick = (staff) => {
    setIsEditing(true);
    setCurrentTargetId(staff.target_id);
    setSelectedUser({ id: staff.user_id, name: staff.name, branch_name: staff.branch_name, role: staff.role });
    setFormData(prev => ({
      ...prev,
      amount: staff.current_target,
      recruitment_target: staff.recruitment_target || 5,
      start: staff.start_date?.split('T')[0] || '',
      end: staff.end_date?.split('T')[0] || '',
      campaign_name: staff.campaign_name || 'General Sales'
    }));
    setShowModal(true);
  };

  const handleDeleteTarget = async (id) => {
    if (window.confirm("CRITICAL: Remove this target record?")) {
      try {
        await API.delete(`/api/staff/targets/${id}`);
        fetchStaff();
      } catch (err) { alert("Action failed"); }
    }
  };

  const viewHistory = async (user) => {
    setSelectedUser(user);
    const res = await API.get(`/api/staff/targets/history/${user.user_id}`);
    setHistoryData(res.data);
    setShowHistory(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing
      ? `/api/staff/targets/${currentTargetId}`
      : '/api/staff/set-target';
    try {
      await API({
        method: isEditing ? 'put' : 'post',
        url,
        data: { ...formData, user_id: selectedUser.id, admin: currentUser }
      });
      setShowModal(false);
      fetchStaff();
      setIsEditing(false);
    } catch (err) { alert("Action failed"); }
  };

  const getAchievementLevel = (pct) => {
    const p = parseFloat(pct);
    if (p >= 120) return { icon: <Award className="text-yellow-500" size={16} />, label: 'ELITE', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (p >= 100) return { icon: <Award className="text-emerald-500" size={16} />, label: 'TARGET MET', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (p >= 75) return { icon: <TrendingUp className="text-blue-500" size={16} />, label: 'PROFORMER', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    return { icon: null, label: 'IN PROGRESS', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' };
};

const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Personnel,Role,Q1 Actual,Q1 Target,Q2 Actual,Q2 Target,Q3 Actual,Q3 Target,Q4 Actual,Q4 Target,Yearly Total,Yearly Goal,Percentage\n";

    matrixData.forEach(s => {
        const yearly = calculateYearly(s);
        const row = [
            s.name, s.role,
            s.q1_actual, s.q1_target,
            s.q2_actual, s.q2_target,
            s.q3_actual, s.q3_target,
            s.q4_actual, s.q4_target,
            yearly.totalActual, yearly.totalTarget, `${yearly.pct}%`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FY${selectedYear}_Performance_Matrix_${selectedBranch}.csv`);
    document.body.appendChild(link);
    link.click();
};

const calculateBranchMetrics = () => {
    const totals = {
        q1A: 0, q1T: 0, q2A: 0, q2T: 0, q3A: 0, q3T: 0, q4A: 0, q4T: 0,
        yearlyA: 0, yearlyT: 0, recruitment: 0, recruitmentTarget: 0
    };

    matrixData.forEach(staff => {
        totals.q1A += Number(staff.q1_actual || 0);
        totals.q1T += Number(staff.q1_target || 0);
        totals.q2A += Number(staff.q2_actual || 0);
        totals.q2T += Number(staff.q2_target || 0);
        totals.q3A += Number(staff.q3_actual || 0);
        totals.q3T += Number(staff.q3_target || 0);
        totals.q4A += Number(staff.q4_actual || 0);
        totals.q4T += Number(staff.q4_target || 0);
        
        // Using the same 70/30 weight logic for the branch
        totals.recruitment += Number(staff.recruitment_count || 0);
        totals.recruitmentTarget += Number(staff.recruitment_target || 5);
    });

    totals.yearlyA = totals.q1A + totals.q2A + totals.q3A + totals.q4A;
    totals.yearlyT = totals.q1T + totals.q2T + totals.q3T + totals.q4T;
    
    const financialScore = totals.yearlyT > 0 ? (totals.yearlyA / totals.yearlyT) * 70 : 0;
    const growthScore = totals.recruitmentTarget > 0 ? (totals.recruitment / totals.recruitmentTarget) * 30 : 0;
    totals.finalScore = Math.min(100, (financialScore + growthScore)).toFixed(1);

    return totals;
};

  return (
    <div className="space-y-8 animate-in fade-in pb-20">

      {/* 1. BRANDED HEADER */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#1a3b70] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
                <Award size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter uppercase italic">Performance Intelligence</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                  <TrendingUp size={12} className="text-emerald-500" /> Balanced Scorecard (BSC) Framework
               </p>
            </div>
         </div>

         <div className="flex items-center gap-4">
            {/* VIEW TOGGLE */}
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex items-center gap-2">
               <button
                  onClick={() => setViewMode('BSC')}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'BSC' ? 'bg-[#1a3b70] text-white shadow-md' : 'text-slate-400'}`}
               >
                  <List size={14}/> Current Period
               </button>
               <button
                  onClick={() => setViewMode('Matrix')}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'Matrix' ? 'bg-[#1a3b70] text-white shadow-md' : 'text-slate-400'}`}
               >
                  <LayoutGrid size={14}/> Yearly Matrix
               </button>
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-xs font-black text-[#1a3b70] outline-none min-w-[200px] shadow-sm cursor-pointer"
            >
               <option value="">Choose Branch...</option>
               {branches.map(b => <option key={b.id} value={b.branch_name}>{b.branch_name}</option>)}
            </select>

            {viewMode === 'Matrix' && (
               <select 
   value={selectedYear} 
   onChange={e => setSelectedYear(e.target.value)} 
   className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-xs font-bold text-[#1a3b70] outline-none shadow-sm"
>
   {dynamicYearRange.map(year => (
      <option key={year} value={year}>Year {year}</option>
   ))}
</select>
            )}
         </div>
      </div>

      {/* 2. KPI LEGEND */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
              <Info size={20} className="text-blue-600" />
              <p className="text-[9px] font-bold text-blue-800 uppercase tracking-tighter leading-relaxed">
                  Financial Weighting (70%): Performance is measured against total capital collection (Birr).
              </p>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
              <UserCheck size={20} className="text-emerald-600" />
              <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-tighter leading-relaxed">
                  Growth Weighting (30%): Performance is measured by new shareholder recruitment counts.
              </p>
          </div>
      </div>

{/* ACHIEVEMENT LEGEND */}
<div className="flex flex-wrap gap-4 mb-6">
    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-xl">
        <Award className="text-yellow-500" size={14} />
        <span className="text-[9px] font-black text-yellow-700 uppercase">120%+ Elite Achievement</span>
    </div>
    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
        <Award className="text-emerald-500" size={14} />
        <span className="text-[9px] font-black text-emerald-700 uppercase">100% Target Master</span>
    </div>
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
        <TrendingUp className="text-blue-500" size={14} />
        <span className="text-[9px] font-black text-blue-700 uppercase">75% High Performer</span>
    </div>
</div>

      {/* 3A. BSC VIEW (original single-period table) */}
      {viewMode === 'BSC' && selectedBranch && (
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase tracking-[0.2em]">
                  <tr>
                     <th className="px-10 py-8">Personnel Identity</th>
                     <th className="px-10 py-8 text-center">Financial Performance (70%)</th>
                     <th className="px-10 py-8 text-center">Growth Index (30%)</th>
                     <th className="px-10 py-8 text-center">Final BSC Score</th>
                     <th className="px-10 py-8 text-right px-12">Action Hub</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {staffData.map(staff => {
                     const score = calculateBSC(staff.actual_sales, staff.current_target, staff.recruitment_count, staff.recruitment_target);
                     const status = getStatus(score);

                     return (
                        <tr key={staff.user_id} className="hover:bg-slate-50/80 transition-all duration-300">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">{staff.name.charAt(0)}</div>
                                  <div>
                                      <p className="text-sm font-black text-slate-800 tracking-tight">{staff.name}</p>
                                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{staff.role}</span>
                                  </div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-center">
                              <p className="text-xs font-black text-slate-700">
                                 {Number(staff.actual_sales).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {Number(staff.current_target || 0).toLocaleString()}</span>
                              </p>
                              <div className="w-32 h-1.5 bg-slate-100 rounded-full mx-auto mt-3 overflow-hidden">
                                 <div className="h-full bg-[#1a3b70]" style={{width: `${Math.min(100, (staff.actual_sales / (staff.current_target || 1)) * 100)}%`}}></div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-center">
                              <p className="text-xs font-black text-slate-700">{staff.recruitment_count} <span className="text-[10px] text-slate-400 font-normal">Members</span></p>
                              <p className="text-[9px] text-emerald-600 font-black mt-1 uppercase tracking-tighter">
                                 {staff.target_id ? `Goal: ${staff.recruitment_target}` : 'No Goal Set'}
                              </p>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex flex-col items-center">
                                 <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black shadow-sm flex items-center gap-2 ${status.light} ${status.text}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${status.color}`}></div>
                                    {score}% Score
                                 </div>
                                 <p className="text-[8px] font-black text-slate-300 uppercase mt-2 tracking-widest">{status.label}</p>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right px-12">
                              <div className="flex justify-end gap-3 items-center">
                                 <button onClick={() => viewHistory(staff)} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-[#1a3b70] hover:text-white transition-all border border-transparent hover:shadow-lg"><History size={16}/></button>

                                 {staff.target_id ? (
                                    <>
                                       <button onClick={() => handleEditClick(staff)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"><Edit size={16}/></button>
                                       <button onClick={() => handleDeleteTarget(staff.target_id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"><Trash2 size={16}/></button>
                                    </>
                                 ) : (
                                    <button onClick={() => { setIsEditing(false); setSelectedUser({id: staff.user_id, name: staff.name, branch_name: staff.branch_name, role: staff.role}); setShowModal(true); }} className="bg-[#1a3b70] text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-900 shadow-xl transition-all flex items-center gap-2">
                                       <Target size={14} className="text-yellow-400" /> Assign Goal
                                    </button>
                                 )}
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      )}

{/* BRANCH EXECUTIVE SUMMARY */}
{selectedBranch && matrixData.length > 0 && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-top-4">
        <div className="bg-[#1a3b70] p-6 rounded-[2rem] text-white shadow-xl">
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Branch Consolidated Actual</p>
            <h3 className="text-2xl font-black mt-1">{Number(calculateBranchMetrics().yearlyA).toLocaleString()} <span className="text-xs opacity-50">ETB</span></h3>
            <p className="text-[9px] text-yellow-400 font-bold mt-2 uppercase">Vs Goal: {Number(calculateBranchMetrics().yearlyT).toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Growth Index</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{calculateBranchMetrics().recruitment} <span className="text-xs text-slate-400">Shareholders</span></h3>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, (calculateBranchMetrics().recruitment / calculateBranchMetrics().recruitmentTarget) * 100)}%`}}></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-[#1a3b70] shadow-xl flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black text-[#1a3b70] uppercase tracking-widest">Branch Overall KPI</p>
                <h3 className="text-3xl font-black text-[#1a3b70] mt-1">{calculateBranchMetrics().finalScore}%</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a3b70]">
                <TrendingUp size={28} />
            </div>
        </div>
    </div>
)}
      {/* 3B. YEARLY MATRIX VIEW */}
      {viewMode === 'Matrix' && selectedBranch && (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
          <div className="flex justify-end p-4 border-b border-slate-50">
             <button onClick={exportToCSV}
                className="bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 px-5 py-3"
             >
                <Download size={16}/> Export Annual Report
             </button>
          </div>
          <table className="w-full text-left min-w-[1000px]">
             <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase tracking-widest">
  <tr>
     <th className="px-8 py-6 sticky left-0 bg-slate-50">Personnel</th>
     <th className="px-8 py-6 text-center border-l border-slate-100">Q1 (Jul-Sep)</th>
     <th className="px-8 py-6 text-center border-l border-slate-100">Q2 (Oct-Dec)</th>
     <th className="px-8 py-6 text-center border-l border-slate-100">Q3 (Jan-Mar)</th>
     <th className="px-8 py-6 text-center border-l border-slate-100">Q4 (Apr-Jun)</th>
     <th className="px-8 py-6 text-right bg-blue-50/30 text-blue-600">FY {selectedYear} Total</th>
  </tr>
</thead>
             <tbody className="divide-y divide-slate-50">
                {matrixData.map(staff => {
                   const yearly = calculateYearly(staff);
                   return (
                      <tr key={staff.user_id} className="hover:bg-slate-50/50 transition-all group">
                         <td className="px-8 py-5 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.02)]">
                            <p className="text-sm font-black text-slate-700">{staff.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{staff.role}</p>
                         </td>

                         {[1,2,3,4].map(q => {
    const target = staff[`q${q}_target`] || 0;
    const actual = staff[`q${q}_actual`] || 0;
    const count = staff[`q${q}_recruitment`] || 0;
    const pct = target > 0 ? (actual / target) * 100 : 0;
    return (
        <td key={q} className="px-8 py-5 text-center border-l border-slate-50">
           <p className="text-[10px] font-black text-slate-600 mb-1">{Number(actual).toLocaleString()} ETB</p>
           <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">{count} Shareholders</p>
           <div className="w-20 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className={`h-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-400'}`} style={{width: `${Math.min(100, pct)}%`}}></div>
           </div>
           <p className={`text-[8px] font-bold mt-1 ${pct >= 100 ? 'text-emerald-500' : 'text-slate-300'}`}>
               {target > 0 ? pct.toFixed(1) + '%' : '---'}
           </p>
        </td>
    )
})}

                        {/* YEARLY TOTAL COLUMN */}

<td className="px-8 py-5 text-right bg-blue-50/20 relative overflow-hidden">
    {/* Background Achievement Badge for 100%+ performers */}
    {yearly.pct >= 100 && (
        <Award className="absolute -right-2 -bottom-2 text-blue-500/5 rotate-12" size={80} />
    )}

    <p className="text-sm font-black text-[#1a3b70]">
        {Number(yearly.totalActual).toLocaleString()}
    </p>
    <p className="text-[9px] text-blue-400 font-bold uppercase mb-2">
        Goal: {Number(yearly.totalTarget).toLocaleString()}
    </p>
    
    <div className="flex flex-col items-end gap-1.5">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border shadow-sm transition-all ${getAchievementLevel(yearly.pct).bg} ${getAchievementLevel(yearly.pct).border}`}>
            {getAchievementLevel(yearly.pct).icon}
            <span className={`text-[10px] font-black ${getAchievementLevel(yearly.pct).color}`}>
                {yearly.pct}% FYTD
            </span>
        </div>
        {/* Sub-label for status */}
        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mr-1">
            {getAchievementLevel(yearly.pct).label}
        </span>
    </div>
</td>
                      </tr>
                   )
                })}
                {matrixData.length === 0 && (
                   <tr>
                      <td colSpan="6" className="text-center py-16 text-slate-300 font-bold uppercase tracking-widest text-xs">No quarterly data for this branch/year</td>
                   </tr>
                )}

                {/* CONSOLIDATED TOTALS ROW */}
{matrixData.length > 0 && (
    <tr className="bg-slate-900 text-white font-black">
        <td className="px-8 py-6 sticky left-0 bg-slate-900 z-10">
            <p className="text-sm uppercase tracking-tighter">BRANCH CONSOLIDATED</p>
            <p className="text-[8px] text-blue-300 uppercase opacity-60">Total {matrixData.length} Personnel</p>
        </td>

        {[1,2,3,4].map(q => {
            const actual = calculateBranchMetrics()[`q${q}A`];
            const target = calculateBranchMetrics()[`q${q}T`];
            const pct = target > 0 ? (actual / target) * 100 : 0;
            return (
                <td key={q} className="px-8 py-6 text-center border-l border-white/10">
                    <p className="text-xs">{Number(actual).toLocaleString()}</p>
                    <p className={`text-[8px] mt-1 ${pct >= 100 ? 'text-emerald-400' : 'text-blue-300'}`}>
                        {target > 0 ? pct.toFixed(1) + '%' : '---'}
                    </p>
                </td>
            )
        })}

        <td className="px-8 py-6 text-right bg-slate-800 relative">
            <p className="text-sm">{Number(calculateBranchMetrics().yearlyA).toLocaleString()}</p>
            <p className="text-[9px] text-blue-300 opacity-60">GOAL: {Number(calculateBranchMetrics().yearlyT).toLocaleString()}</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/20">
                <Award size={12} className="text-yellow-400" />
                <span className="text-[10px] text-yellow-400">{calculateBranchMetrics().finalScore}% TOTAL</span>
            </div>
        </td>
    </tr>
)}
             </tbody>
          </table>
        </div>
      )}

{matrixData.length === 0 && (
        <tr>
           <td colSpan="6" className="text-center py-16 text-slate-300 font-bold uppercase tracking-widest text-xs">No quarterly data for this branch/year</td>
        </tr>
     )}

      {/* 4. MODALS (BSC ASSIGNMENT & HISTORY) */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-[#1a3b70]/90 backdrop-blur-md z-[250] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 relative border border-white/20">
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X /></button>

              <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-[#1a3b70]">
                      <Target size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{isEditing ? 'Revise Performance Quota' : 'Set Balanced Scorecard'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedUser.name} • {selectedUser.branch_name}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <FormInput label="Financial Target (ETB)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="Enter Birr amount..." />
                 <FormInput label="Shareholder Count Goal" type="number" value={formData.recruitment_target} onChange={e => setFormData({...formData, recruitment_target: e.target.value})} required />
                 <FormInput label="Campaign Name (Optional)" value={formData.campaign_name} onChange={e => setFormData({...formData, campaign_name: e.target.value})} />

                 {/* Quick quarter picker — auto-fills the dates below */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick-Fill by Quarter</label>
                    <div className="grid grid-cols-5 gap-2">
                       <select
   value={formData.fiscal_year}
   onChange={e => applyQuarter(formData.quarter, e.target.value)}
   className="col-span-2 bg-slate-50 border-2 border-slate-50 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none"
>
   {dynamicYearRange.map(year => (
      <option key={year} value={year}>{year}</option>
   ))}
</select>
                       {[1,2,3,4].map(q => (
                          <button
                             type="button"
                             key={q}
                             onClick={() => applyQuarter(String(q), formData.fiscal_year)}
                             className={`rounded-xl text-[10px] font-black uppercase transition-all ${formData.quarter === String(q) ? 'bg-[#1a3b70] text-white' : 'bg-slate-50 text-slate-400'}`}
                          >
                             Q{q}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Start Date" type="date" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} required />
                    <FormInput label="End Date" type="date" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} required />
                 </div>

                 <button type="submit" className="w-full bg-[#1a3b70] text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-2xl active:scale-95 transition-all mt-6">
                    {isEditing ? 'Authorize Target Revision' : 'Establish Performance Record'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[260] flex items-center justify-center p-6 font-sans">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
              <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
                 <div>
                    <h3 className="font-black text-2xl text-[#1a3b70] uppercase tracking-tighter italic">Lifecycle Performance Audit</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel: {selectedUser?.name}</p>
                 </div>
                 <button onClick={() => setShowHistory(false)} className="p-3 bg-white rounded-2xl text-slate-300 hover:text-red-500 shadow-sm transition-all"><X /></button>
              </div>
              <div className="p-10 max-h-[50vh] overflow-y-auto space-y-5">
                 {historyData.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-[#1a3b70] transition-colors">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <TrendingUp size={14} className="text-[#1a3b70]" />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Period</p>
                          </div>
                          <p className="text-sm font-black text-slate-800">{new Date(h.start_date).toLocaleDateString()} — {new Date(h.end_date).toLocaleDateString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-[#1a3b70]">{Number(h.target_amount_birr).toLocaleString()} <span className="text-[10px] font-normal">ETB</span></p>
                          <span className="text-[8px] font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded uppercase">Created by {h.created_by}</span>
                       </div>
                    </div>
                 ))}
                 {historyData.length === 0 && <p className="text-center py-10 text-slate-300 italic uppercase text-[10px] font-bold">No historical data records found.</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const FormInput = ({ label, type = "text", ...props }) => (
    <div className="space-y-2 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input type={type} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 focus:bg-white transition-all shadow-inner" {...props} />
    </div>
);

export default TargetManagementModule;
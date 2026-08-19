import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, UserPlus,
  Save, X, Landmark, MapPin, CheckCircle, Briefcase,
  FileCheck, Loader2, FileUp, Download, ChevronLeft, ChevronRight,
  Edit, Trash2, Eye, ExternalLink, File, History, Award, FileText, 
  FileSpreadsheet, Printer, ShieldCheck, ShieldAlert, ArrowRightLeft, Users, BarChart3, 
  PieChart, XCircle, Coins, Percent, UserCheck
} from 'lucide-react';
import axios from 'axios';
import PaymentReceiptTemplate from './PaymentReceiptTemplate';
import API from './api'; // Use the centralized API instance

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-10 right-10 z-[9999] flex items-center gap-4 bg-[#1a3b70] text-white p-5 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}><CheckCircle size={20}/></div>
      <div><p className="text-[10px] font-black uppercase text-yellow-400">System Notification</p><p className="text-xs font-bold">{message}</p></div>
      <button onClick={onClose} className="ml-4 opacity-30"><X size={16}/></button>
    </div>
  );
};

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  // This takes "1995-11-05T..." and returns "1995-11-05"
  return new Date(dateStr).toISOString().split('T')[0];
};

const ShareholderModule = ({ globalSearch, setGlobalSearch }) => {
  // --- STATES ---
  const [shareholders, setShareholders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const [idFile, setIdFile] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedShareholder, setSelectedShareholder] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // shareholder currently being rejected
  const [rejectReason, setRejectReason] = useState('');
  const currentUser = localStorage.getItem('userName') || 'System Admin';
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const userRole = localStorage.getItem('userRole');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', ref: '', method: 'Bank Transfer', date: new Date().toISOString().split('T')[0] });
  const [currentBankParValue, setCurrentBankParValue] = useState(1000); // Default fallback
  const [branches, setBranches] = useState([]);
  const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  const [shareClasses, setShareClasses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [modalError, setModalError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [agents, setAgents] = useState([]);
  

const handleViewProfile = async (sh) => {
    setSelectedShareholder(sh);
    setShowProfileModal(true);
    
    try {
        // Fetch the payment ledger for this specific person
        const res = await API.get(`/api/shareholders/${sh.id}/payment-history`);
        setPaymentHistory(res.data);
    } catch (err) {
        console.error("Failed to load ledger:", err);
    }
};

  const can = (permissionKey) => {
  // 1. MASTER BYPASS: If the user is an Admin, they see all buttons
  if (userRole === 'Admin') return true; 
  
  // 2. Otherwise, check the specific permissions list
  return userPermissions.includes(permissionKey);
};

const checkDuplicateRealTime = async (field, value) => {
    if (!value) return;
    try {
        const res = await API.get(`/api/shareholders/check-exists?field=${field}&value=${value}`);
        if (res.data.exists) {
            showNotification(`${field.replace('_',' ')} already exists in registry!`, "error");
        }
    } catch (e) { console.log(e); }
};

  const INITIAL_FORM_STATE = { 
    first_name: '',
    father_name: '',
    grand_father_name: '',
    type: 'Individual', full_name: '', gender: 'Male', dob: '', nationality: 'Ethiopian', 
    occupation: '', id_type: 'Kebele ID', id_number: '', national_id_no: '', tin: '', phone: '', alt_phone: '', 
    email: '', address_region: '', address_city: '', address_subcity: '', address_woreda: '', 
    kebele: '', postal_address: '', emergency_contact: '', business_reg_no: '', 
    license_info: '', auth_rep_details: '', contact_person: '', bank_name: 'Rammis Bank', branch_name: 'Head Office',
    bank_account: '', no_of_share: 0, no_of_share_birr: 0, paidup_share: 0, paidup_birr: 0, 
    payment_method: 'Bank Transfer', payment_status: 'Unpaid', subscription_ref_no: '', introduced_by: '', service_charge_amt: 0,      // From the previous step
    is_agent_sale: 0,           // 0 for No, 1 for Yes
    agent_id: '',               // The ID of the selected agent
    agent_commission_amt: 0,     // Calculated 2.5% value
    introducer_name_manual: '', // Stores the typed name
    is_manual_introducer: false  // UI toggle state
  };

  // NOTE: searchTerm state removed because we use globalSearch prop

const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // --- API ACTIONS ---
  const fetchShareholders = (page = 1, search = '', status = '') => {
    API.get(`/api/shareholders?page=${page}&limit=${limit}&search=${search}&status=${status}`)
      .then(res => {
        setShareholders(res.data.data || []);
        setPagination(res.data.pagination);
      })
      .catch(err => console.log(err));
};
const [viewingReceipt, setViewingReceipt] = useState(null);
const handlePrintReceipt = async (paymentId) => {
    try {
        const res = await API.get(`/api/payments/${paymentId}/receipt-data`);
        setViewingReceipt(res.data); // This now works because the state is defined
    } catch (err) {
        showNotification("Failed to load receipt data", "error");
    }
};

// Add this near your other useStates
const [bankConfig, setBankConfig] = useState({ servicePct: 5, agentPct: 2.5 });

// Fetch these values from the database when the page loads
useEffect(() => {
    API.get('/api/parameters').then(res => {
        const data = res.data;
        const config = {
            servicePct: parseFloat(data.find(p => p.param_key === 'service_charge_pct')?.param_value || 5),
            capitalAccount: data.find(p => p.param_key === 'capital_account_no')?.param_value,
            serviceAccount: data.find(p => p.param_key === 'service_account_no')?.param_value
        };
        setBankConfig(config);
    });
}, []);

useEffect(() => {
    // 1. Fetch Agents List
    API.get('/api/agents')
        .then(res => setAgents(res.data))
        .catch(err => console.error("Agent fetch error:", err));

    // 2. Fetch Bank Parameters (Rates and Accounts)
    API.get('/api/parameters').then(res => {
        const data = res.data;
        setBankConfig({
            servicePct: parseFloat(data.find(p => p.param_key === 'service_charge_pct')?.param_value || 5),
            agentPct: parseFloat(data.find(p => p.param_key === 'agent_commission_pct')?.param_value || 2.5),
            capitalAccount: data.find(p => p.param_key === 'capital_account_no')?.param_value,
            serviceAccount: data.find(p => p.param_key === 'service_account_no')?.param_value
        });
    });
}, []);

// --- 1. INITIALIZATION: Fetch static data once when the component mounts ---
useEffect(() => {
    // A. Fetch Dynamic Share Classes
    API.get('/api/capital/classes')
      .then(res => {
          setShareClasses(res.data || []);
          if(res.data && res.data.length > 0) setCurrentBankParValue(res.data[0].par_value);
      });

    // B. Fetch All Staff Members (for the Introducer logic)
    API.get('/api/users')
      .then(res => setStaffList(res.data || []))
      .catch(err => console.error("Staff fetch error:", err));

    // C. FETCH BRANCHES FROM DB (This fixes your empty dropdown)
API.get('/api/branches')
  .then(res => {
      // FIX: Access the .data property inside the response
      // because the backend now sends { data: [...], pagination: {...} }
      const branchArray = res.data.data || []; 
      setBranches(branchArray);
      
      if(branchArray.length > 0) {
          setFormData(prev => ({ ...prev, branch_name: branchArray[0].branch_name }));
      }
  })
  .catch(err => console.error("Branch fetch error:", err));
}, []); // Runs only once

// --- 2. DYNAMIC LIST: Refresh table when filters or page change ---
useEffect(() => { 
    fetchShareholders(currentPage, globalSearch, statusFilter); 
}, [currentPage, globalSearch, statusFilter]);

  const showNotification = (msg, type = 'success') => setToast({ show: true, message: msg, type });

const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 1. Handle value based on input type (Checkbox vs Text/Select)
    // This allows the "is_agent_sale" tickbox to work
    let val = type === 'checkbox' ? (checked ? 1 : 0) : value;

        // If user switches to manual, clear the dropdown selection and vice versa
    if (name === 'is_manual_introducer') {
        setFormData(prev => ({
            ...prev,
            is_manual_introducer: checked,
            introduced_by: '',
            introducer_name_manual: ''
        }));
        return;
    }
    setFormData(prev => ({ ...prev, [name]: val }));

    let updatedData = { ...formData, [name]: val };

        if (['first_name', 'father_name', 'grand_father_name'].includes(name)) {
        const first = name === 'first_name' ? value : formData.first_name;
        const father = name === 'father_name' ? value : formData.father_name;
        const grand = name === 'grand_father_name' ? value : formData.grand_father_name;
        
        // Clean spaces and combine
        updatedData.full_name = `${first.trim()} ${father.trim()} ${grand.trim()}`.trim();
    }

    // 2. Find the current par value for the selected class (Existing Logic)
    const selectedClass = shareClasses.find(c => c.id == updatedData.share_class_id);
    const par = selectedClass ? Number(selectedClass.par_value) : 1000;

    // 3. Calculate Subscribed Total (Existing Logic)
    if (name === 'no_of_share' || name === 'share_class_id') {
        updatedData.no_of_share_birr = (parseInt(updatedData.no_of_share) || 0) * par;
    }

    // 4. Calculate Paid-up Total (Existing Logic)
    if (name === 'paidup_share' || name === 'share_class_id') {
        updatedData.paidup_birr = (parseInt(updatedData.paidup_share) || 0) * par;
    }

    // 5. Auto-update status if fully paid (Existing Logic)
    if (updatedData.paidup_birr >= updatedData.no_of_share_birr && updatedData.no_of_share_birr > 0) {
        updatedData.subscription_status = 'Completed';
    }

    // 6. Reset introducer if branch changes (Existing Logic)
    if (name === 'branch_name') {
        updatedData.introduced_by = ''; 
    }

    // 7. DYNAMIC BANK SERVICE CHARGE (Existing Logic)
    // Uses the 5% (or dynamic pct) for the bank's portion
    const serviceFee = (parseFloat(updatedData.paidup_birr) * (bankConfig.servicePct / 100));
    updatedData.service_charge_amt = serviceFee;

    // 8. NEW: AGENT COMMISSION CALCULATION
    // If the tickbox is checked, calculate 2.5% (or dynamic agentPct)
    if (updatedData.is_agent_sale === 1) {
        const agentRate = parseFloat(bankConfig.agentPct || 2.5);
        updatedData.agent_commission_amt = (parseFloat(updatedData.paidup_birr) * (agentRate / 100));
    } else {
        // If unchecked, reset agent selection and commission to zero
        updatedData.agent_id = ''; 
        updatedData.agent_commission_amt = 0;
    }

    setFormData(updatedData);
};

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return showNotification("Please select a file", "error");
    const fileData = new FormData();
    fileData.append('file', selectedFile);
    try {
      const res = await API.post('/api/shareholders/import', fileData);
      showNotification(`${res.data.count} Imported successfully!`);
      setShowImportModal(false);
      setSelectedFile(null);
      fetchShareholders(1, '');
    } catch (err) { showNotification("Import failed", "error"); }
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    // --- DATA VALIDATION (BRD Section 7) ---
    
    // 1. Mandatory Fields
    if (!formData.full_name || !formData.phone || !formData.id_number) {
        return showNotification("Full Name, Phone, and ID Number are mandatory", "error");
    }

    // 2. Phone Validation (Ethiopian Format)
    const phoneRegex = /^(09|07)\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
        return showNotification("Invalid Phone: Use 09... or 07... (10 digits)", "error");
    }

    // 3. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
        return showNotification("Please enter a valid email address", "error");
    }

    // 4. Financial Logic Check
    if (parseFloat(formData.paidup_birr) > parseFloat(formData.no_of_share_birr)) {
        return showNotification("Paid-up amount cannot exceed Subscribed amount", "error");
    }

        const mandatoryFields = [
        { key: 'phone', label: 'Primary Phone' },
        { key: 'bank_account', label: 'Rammis Bank Account' },
        { key: 'no_of_share', label: 'Number of Shares' },
        { key: 'branch_name', label: 'Assigned Branch' }
    ];

    // 2. CHECK COMMON FIELDS
    for (let field of mandatoryFields) {
        if (!formData[field.key] || formData[field.key] === '' || formData[field.key] === 0) {
            return showNotification(`${field.label} is mandatory!`, "error");
        }
    }

    // 3. CHECK CONDITIONAL NAME FIELDS
    if (formData.type === 'Individual') {
        if (!formData.first_name || !formData.father_name || !formData.grand_father_name) {
            return showNotification("Individual Name (First, Father, Grandfather) is mandatory!", "error");
        }
    } else {
        if (!formData.full_name) {
            return showNotification("Organization Name is mandatory!", "error");
        }
    }

    // 4. CHECK IDENTIFICATION (Must have at least one ID)
    if (!formData.id_number && !formData.national_id_no) {
        return showNotification("At least one form of Identification (Local or National) is required!", "error");
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append('performed_by', currentUser);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (idFile) data.append('id_doc', idFile);
    if (agreementFile) data.append('agreement_doc', agreementFile);
    if (paymentFile) data.append('payment_doc', paymentFile);

    try {
      const url = isEditing ? `${API.defaults.baseURL}/api/shareholders/${currentId}` : `${API.defaults.baseURL}/api/shareholders`;
      const method = isEditing ? 'put' : 'post';
      const res = await API[method](url, data);

      showNotification(isEditing ? "Updated successfully!" : "Draft saved!");
      setShowModal(false);
      fetchShareholders(currentPage, globalSearch);
    } catch (err) { 
      // Handle the "Duplicate" error from backend
      const errMsg = err.response?.data?.message || "Operation failed";
      showNotification(errMsg, "error"); 
    } finally { 
      setIsSubmitting(false); 
    }
};

const handleEdit = (sh) => {
    // 1. Format the date so the input box can read it
    const cleanDate = sh.dob ? formatDateForInput(sh.dob) : '';

    // 2. Set the form data
    setFormData({ 
        ...sh, 
        dob: cleanDate 
    });
    
    setCurrentId(sh.id);
    setIsEditing(true);
    setShowModal(true);

    // 3. Clear any selected files from previous actions
    setIdFile(null);
    setAgreementFile(null);
    setPaymentFile(null);
};

  
  const handleDelete = async (id) => {
    if (window.confirm("CRITICAL: Delete this record permanently?")) {
      try {
        await API.delete(`/api/shareholders/${id}`);
        showNotification("Record deleted successfully");
        fetchShareholders(currentPage, globalSearch); // Updated to globalSearch
      } catch (err) { showNotification("Delete failed", "error"); }
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/api/shareholders/${id}/approve`, { 
          performed_by: currentUser 
      });
      showNotification("Member Activated!");
      fetchShareholders(currentPage, globalSearch); // Updated to globalSearch
    } catch (err) { showNotification("Approval failed", "error"); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return showNotification("Please enter a rejection reason", "error");
    try {
      await API.put(`/api/shareholders/${rejectTarget.id}/reject`, { 
          reason: rejectReason,
          performed_by: currentUser
      });
      showNotification("Rejected successfully");
      setRejectTarget(null);
      setRejectReason('');
      fetchShareholders(currentPage, globalSearch);
    } catch (err) {
      showNotification(err.response?.data?.message || "Reject failed", "error");
    }
  };

const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError(''); // Clear old errors

    try {
        const res = await API.post('/api/payments', { 
            ...paymentForm, 
            sh_id: selectedShareholder.id, 
            branch: selectedShareholder.branch_name,
            user: currentUser 
        });

        showNotification(res.data.message);
        setShowPaymentModal(false);
        fetchShareholders(currentPage, globalSearch, statusFilter);
    } catch (err) {
        // GET THE MESSAGE FROM BACKEND
        const errMsg = err.response?.data?.error || "Transaction Failed: Check Reference Number";
        
        // SHOW IT INSIDE THE MODAL
        setPaymentError(errMsg); 
        
        // Also show the toast as a secondary alert
        showNotification(errMsg, "error"); 
    }
};

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
           <h2 className="text-3xl font-black text-[#1a3b70] tracking-tighter">Shareholder Registry</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Management Portal</p>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setShowImportModal(true)} className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all">
                <FileUp size={18} /> BULK IMPORT
            </button>
{can('sh_create') && (
   <button 
      onClick={() => { setIsEditing(false); setFormData(INITIAL_FORM_STATE); setShowModal(true); }} 
      className="bg-yellow-400 hover:bg-yellow-500 text-[#1a3b70] px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl"
   >
      <UserPlus size={20} /> NEW REGISTRATION
   </button>
)}
        </div>
      </div>

{/* SEARCH & FILTER BAR */}
<div className="space-y-4">
  <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex gap-4">
     <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 border-2 border-transparent focus-within:border-yellow-400 transition-all">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          value={globalSearch} 
          onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }} 
          placeholder="Search by Name, ID, TIN, or National ID..." 
          className="bg-transparent border-none outline-none text-sm w-full font-bold text-[#1a3b70]" 
        />
     </div>
     
     {/* Status Quick Filter */}
     <select 
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        className="bg-slate-50 border-2 border-slate-50 rounded-xl px-4 text-xs font-black text-slate-500 outline-none focus:border-[#1a3b70] cursor-pointer"
     >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Pending">Pending</option>
        <option value="Rejected">Rejected</option>
     </select>

     <button 
        onClick={() => setShowFilterOptions(!showFilterOptions)} 
        className={`px-6 py-3 border-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-all ${showFilterOptions ? 'bg-[#1a3b70] border-[#1a3b70] text-white' : 'border-slate-50 text-slate-400'}`}
     >
        <Filter size={18} /> Advanced
     </button>
  </div>

  {/* ADVANCED FILTER DRAWER (Hidden by default) */}
  {showFilterOptions && (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-5">
       <div className="grid grid-cols-3 gap-6">
          <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Registration Date From</label>
             <input type="date" className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold text-[#1a3b70] border-none outline-none" />
          </div>
          <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Registration Date To</label>
             <input type="date" className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold text-[#1a3b70] border-none outline-none" />
          </div>
          <div className="flex items-end">
             <button 
                onClick={() => { setStatusFilter(''); setGlobalSearch(''); }}
                className="w-full py-3 text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-colors"
             >
                Clear All Filters
             </button>
          </div>
       </div>
    </div>
  )}
</div>
{selectedIds.length > 0 && (
  <div className="bg-[#1a3b70] p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-4">
     <p className="text-white text-xs font-bold ml-4">{selectedIds.length} Shareholders Selected</p>
{/* UPDATE THE BATCH BUTTON CLICK HANDLER */}
<button 
   onClick={async () => {
      // Use a custom state if you want a branded confirm, 
      // but for now, let's at least fix the success notification:
      if (window.confirm(`Issue certificates for ${selectedIds.length} shareholders?`)) {
         setIsSubmitting(true);
         try {
            for (let id of selectedIds) {
               await API.post('/api/certificates/generate', { 
                  shareholder_id: id, 
                  user: currentUser 
               });
            }
            // --- FIXED: USE Branded Notification instead of alert ---
            showNotification(`Success: ${selectedIds.length} certificates have been added to the registry.`);
            setSelectedIds([]);
            fetchShareholders(currentPage, globalSearch);
         } catch (err) {
            showNotification("Batch issuance failed. Please try again.", "error");
         } finally {
            setIsSubmitting(false);
         }
      }
   }}
   className="bg-yellow-400 text-[#1a3b70] px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2"
>
   {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <Award size={14}/>}
   Generate Batch Certificates
</button>
  </div>
)}

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member ID</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest px-12">Actions</th>
              <th className="px-8 py-6 w-10">
   <input 
     type="checkbox" 
     onChange={(e) => {
       if (e.target.checked) setSelectedIds(shareholders.map(s => s.id));
       else setSelectedIds([]);
     }}
     className="w-4 h-4 rounded border-slate-300 accent-[#1a3b70]"
   />
</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {shareholders.map((sh) => (
              <tr key={sh.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5 font-black text-[#1a3b70] text-xs">{sh.shareholder_id}</td>
                <td className="px-8 py-5">
   <p className="text-xs font-black text-slate-800">{sh.full_name}</p>
   <div className="flex items-center gap-2 mt-1">
      <p className="text-[10px] text-slate-400 font-bold uppercase">{sh.phone}</p>
      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{sh.branch_name}</span>
   </div>
</td>
                <td className="px-8 py-5">
                   <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase ${
                     sh.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                     sh.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                     'bg-amber-50 text-amber-600 border-amber-100'
                   }`}>
                      {sh.status}{sh.action_type === 'EDIT' ? ' (Edit)' : sh.action_type === 'CREATE' ? ' (New)' : ''}
                   </span>
                </td>
<td className="px-8 py-5 text-right flex justify-end gap-2 items-center">
  
  {/* 1. APPROVE/REJECT BUTTONS (Requirement: sh_approve) */}
  {(sh.status === 'Pending' || sh.action_type === 'EDIT' || sh.action_type === 'CREATE') && can('sh_approve') && (
    <div className="flex gap-2 animate-in fade-in zoom-in-95 mr-2">
      <button 
        onClick={() => handleApprove(sh.id)} 
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
      >
        Approve
      </button>
      <button 
        onClick={() => setRejectTarget(sh)} 
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95"
      >
        Reject
      </button>
    </div>
  )}

  {/* 2. VIEW PROFILE (Always visible or wrap with can('sh_view')) */}
  <button 
    onClick={() => { setSelectedShareholder(sh); setShowProfileModal(true); }} 
    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-[#1a3b70] hover:text-white transition-all"
    title="View Profile"
  >
    <Eye size={14}/>
  </button>

 {/* 3. COLLECT PAYMENT (Show only if balance remains) */}
{Number(sh.paidup_birr) < Number(sh.no_of_share_birr) && can('sh_edit') && (
  <button 
    onClick={() => { setSelectedShareholder(sh); setShowPaymentModal(true); }}
    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
    title="Collect Installment Payment"
  >
    <Landmark size={14}/>
    {/* Optional: Add a tool-tip or visual hint */}
    <span className="sr-only">Collect Payment</span>
  </button>
)}

{/* Visual feedback for fully paid members (Optional) */}
{Number(sh.paidup_birr) >= Number(sh.no_of_share_birr) && (
  <div className="p-2 text-emerald-400 opacity-40 cursor-default" title="Full Capital Paid">
    <CheckCircle size={14} />
  </div>
)}

  {/* 4. EDIT & DELETE (Only show if no action is pending AND user has permission) */}
  {!sh.action_type && (
    <div className="flex gap-2">
      {can('sh_edit') && (
        <button 
          onClick={() => handleEdit(sh)} 
          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          title="Edit Record"
        >
          <Edit size={14}/>
        </button>
      )}
      
      {can('sh_delete') && (
        <button 
          onClick={() => handleDelete(sh.id)} 
          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
          title="Delete Record"
        >
          <Trash2 size={14}/>
        </button>
      )}
    </div>
  )}
</td>

<td className="px-8 py-5">
   <input 
     type="checkbox" 
     checked={selectedIds.includes(sh.id)}
     onChange={() => {
       if (selectedIds.includes(sh.id)) setSelectedIds(selectedIds.filter(id => id !== sh.id));
       else setSelectedIds([...selectedIds, sh.id]);
     }}
     className="w-4 h-4 rounded border-slate-300 accent-[#1a3b70]"
   />
</td>
              </tr>
            ))}
            {shareholders.length === 0 && (
                <tr>
                    <td colSpan="4" className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-xs">No records found matching search</td>
                </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION FOOTER */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-12">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing <span className="text-[#1a3b70]">{(currentPage - 1) * limit + 1}</span> to <span className="text-[#1a3b70]">{Math.min(currentPage * limit, pagination.totalRecords)}</span> of {pagination.totalRecords}
          </p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
               {[...Array(pagination.totalPages)].map((_, i) => (
                 <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-[#1a3b70] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
                   {i + 1}
                 </button>
               ))}
            </div>
            <button disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (REGISTER/EDIT) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[60] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4"><div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-[#1a3b70] shadow-lg"><UserPlus /></div><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{isEditing ? 'Update Shareholder Record' : 'Registration Form'}</h3></div>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-white rounded-2xl text-slate-300 hover:text-red-500 border border-slate-100"><X /></button>
              </div>
             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 space-y-12">
   
   {/* SECTION 1: DYNAMIC PROFILE INFO */}
<section className="grid grid-cols-3 gap-8">
  <div className="col-span-3 text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
     <Briefcase size={14}/> {formData.type === 'Individual' ? 'Personal Profile' : 'Organization Profile'}
  </div>
  
  <FormSelect label="Shareholder Type" name="type" value={formData.type} onChange={handleChange} options={['Individual', 'Institutional']} />
  
  
{/* --- BRANCH SELECTION --- */}
<FormSelect 
    label="Assigned Branch" 
    name="branch_name" 
    value={formData.branch_name} 
    onChange={handleChange} 
    // FIX: Map the objects to show the name and use the name as value
    options={(branches || []).map(b => ({ label: b.branch_name, value: b.branch_name }))} 
/>

{/* --- DYNAMIC INTRODUCER SELECTION (Upgraded to Hybrid) --- */}
<div className="space-y-2">
    <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Introduced By
        </label>
        
        {/* Toggle to switch between Dropdown and Manual Entry */}
        <label className="flex items-center gap-2 cursor-pointer">
            <input 
                type="checkbox" 
                name="is_manual_introducer"
                checked={formData.is_manual_introducer}
                onChange={handleChange}
                className="w-3 h-3 accent-[#1a3b70]"
            />
            <span className="text-[8px] font-bold text-slate-400 uppercase">Manual Entry</span>
        </label>
    </div>

    {formData.is_manual_introducer ? (
        /* 1. MANUAL ENTRY OPTION */
        <FormInput 
            label="Type Introducer Name" 
            name="introducer_name_manual" 
            value={formData.introducer_name_manual} 
            onChange={handleChange}
            placeholder="Enter full name..."
        />
    ) : (
        /* 2. YOUR ORIGINAL STAFF DROPDOWN OPTION */
        <FormSelect 
            label="Select Registered Staff" 
            name="introduced_by" 
            value={formData.introduced_by} 
            onChange={handleChange} 
            options={staffList
                .filter(u => u.branch_name === formData.branch_name) 
                .map(u => ({ label: u.name, value: u.id }))
            } 
        />
    )}
</div>

{/* --- SMART NAME SECTION --- */}
{formData.type === 'Individual' ? (
    /* 1. IF INDIVIDUAL: SHOW 3-PART NAME */
    <div className="col-span-3 grid grid-cols-3 gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <FormInput 
            label={
        <>
            First Name <span className="text-red-500">*</span>
        </>
    }
            name="first_name" 
            value={formData.first_name} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Werkit"
        />
        <FormInput 
                   label={
        <>
            Father's Name <span className="text-red-500">*</span>
        </>
    }
           
            name="father_name" 
            value={formData.father_name} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Mohammed"
        />
        <FormInput 
                           label={
        <>
            Grandfather's Name <span className="text-red-500">*</span>
        </>
    }
            name="grand_father_name" 
            value={formData.grand_father_name} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Sulyman"
        />
        
        {/* Helper: Show the combined name that will go on the certificate */}
        <div className="col-span-3 px-3 py-1 bg-white/50 rounded-lg border border-dashed border-slate-200">
            <p className="text-[8px] font-black text-slate-400 uppercase">System Combined Name: <span className="text-[#1a3b70]">{formData.full_name || '---'}</span></p>
        </div>
    </div>
) : (
    /* 2. IF INSTITUTIONAL: SHOW ORIGINAL SINGLE BOX */
    <div className="col-span-3">
        <FormInput 
            label="Organization Name" 
            name="full_name" 
            value={formData.full_name} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Rammis Investment Group"
        />
    </div>
)}

      {formData.type === 'Individual' ? (
         <>
            <FormSelect label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={['Male', 'Female']} />
            <FormInput label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
            <FormInput label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
         </>
      ) : (
         <>
            <FormInput label="Business Reg. Number" name="business_reg_no" value={formData.business_reg_no} onChange={handleChange} />
            <FormInput label="License Information" name="license_info" value={formData.license_info} onChange={handleChange} />
            <FormInput label="Contact Person Name" name="contact_person" value={formData.contact_person} onChange={handleChange} />
         </>
      )}
      <FormInput label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
   </section>

   {/* SECTION 2: IDENTITY & EXTENDED CONTACT */}
   <section className="grid grid-cols-3 gap-8">
      <div className="col-span-3 text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
         <FileCheck size={14}/> KYC Identification Repository
      </div>
      <FormSelect label="ID Type" name="id_type" value={formData.id_type} onChange={handleChange} options={['Kebele ID', 'Passport', 'Driving License', 'Work ID']} />
      <FormInput label="ID Number" name="id_number" value={formData.id_number} onChange={handleChange} />
        {/* FIELD 2: NATIONAL DIGITAL ID (DEDICATED) */}
        <div className="space-y-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                <p className="text-[9px] font-black text-[#1a3b70] uppercase tracking-tighter">
                    2. National Digital ID (Fayda)
                </p>
                <span className="text-[7px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black">OFFICIAL</span>
            </div>
            <FormInput 
                label="National ID Number" 
                name="national_id_no" 
                value={formData.national_id_no} 
                onChange={handleChange} 
                placeholder="Enter FAN or FIN Number..."
            />
            <p className="text-[8px] text-slate-400 italic font-medium leading-tight">
                * Leave blank if the shareholder does not yet possess a Fayda Digital ID.
            </p>
        </div>
    
          <FormInput label="TIN" name="tin" value={formData.tin} onChange={handleChange} />
      <FormInput label="Primary Phone" name="phone" value={formData.phone} onChange={handleChange} />
      <FormInput label="Alternative Phone" name="alt_phone" value={formData.alt_phone} onChange={handleChange} />
      <FormInput label="Email Address" name="email" value={formData.email} onChange={handleChange} />
      
      {formData.type === 'Institutional' && (
         <div className="col-span-3">
            <FormInput label="Authorized Representative Details (Name, Role, ID)" name="auth_rep_details" value={formData.auth_rep_details} onChange={handleChange} />
         </div>
      )}
   </section>

   {/* SECTION 3: DETAILED ADDRESS */}
   <section className="grid grid-cols-4 gap-8">
      <div className="col-span-4 text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
         <MapPin size={14}/> Location & Postal Details
      </div>
 <FormSelect 
    label="Rammis Bank Branch" 
    name="branch_name" 
    value={formData.branch_name} 
    onChange={handleChange} 
    // FIX: Map here as well
    options={(branches || []).map(b => ({ label: b.branch_name, value: b.branch_name }))} 
/>
      <FormInput label="Region" name="address_region" value={formData.address_region} onChange={handleChange} />
      <FormInput label="City" name="address_city" value={formData.address_city} onChange={handleChange} />
      <FormInput label="Sub-City" name="address_subcity" value={formData.address_subcity} onChange={handleChange} />
      <FormInput label="Woreda" name="address_woreda" value={formData.address_woreda} onChange={handleChange} />
      <FormInput label="Kebele" name="kebele" value={formData.kebele} onChange={handleChange} />
      <FormInput label="P.O. Box (Postal)" name="postal_address" value={formData.postal_address} onChange={handleChange} />
      <div className="col-span-2">
         <FormInput label="Emergency Contact (Optional)" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
      </div>
   </section>


{/* UPDATED SECTION: SHARE SUBSCRIPTION (6 Fields for full tracking) */}
{/* --- UPDATED SHARE SUBSCRIPTION SECTION --- */}
<section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
    <div className="text-[10px] font-black text-[#1a3b70] uppercase tracking-widest flex items-center gap-2">
       <Landmark size={14}/> Share Subscription & Service Fees
    </div>
    
    <div className="grid grid-cols-3 gap-6">
       <FormSelect 
          label="Target Share Class" 
          name="share_class_id" 
          value={formData.share_class_id} 
          onChange={handleChange} 
          options={shareClasses.map(c => ({ label: c.class_name, value: c.id }))} 
       />
       <FormInput label="Shares Subscribed" name="no_of_share" type="number" value={formData.no_of_share} onChange={handleChange} />
       <FormInput label="Shares Paid Now" name="paidup_share" type="number" value={formData.paidup_share} onChange={handleChange} />
    </div>

    {/* --- BANK FINANCE BREAKDOWN BOX --- */}
    <div className="grid grid-cols-2 gap-6 pt-4">
        {/* Capital Portion */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Share Capital Portion</p>
                    <p className="text-xl font-black text-[#1a3b70]">{Number(formData.paidup_birr).toLocaleString()} ETB</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-bold text-blue-500 uppercase">GL Account</p>
                    <p className="text-[10px] font-mono font-bold text-slate-400">{bankConfig.capitalAccount}</p>
                </div>
            </div>
            <Landmark size={60} className="absolute -right-4 -bottom-4 text-slate-50" />
        </div>

        {/* Service Charge Portion */}
        <div className="p-5 bg-blue-900 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-[9px] font-black text-blue-300 uppercase">{bankConfig.servicePct}% Service Charge</p>
                    <p className="text-xl font-black text-yellow-400">{Number(formData.service_charge_amt || 0).toLocaleString()} ETB</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-bold text-blue-300 uppercase">Income Account</p>
                    <p className="text-[10px] font-mono font-bold text-blue-200/50">{bankConfig.serviceAccount}</p>
                </div>
            </div>
            <Percent size={60} className="absolute -right-4 -bottom-4 text-white/5" />
        </div>
    </div>

    <div className="bg-[#1a3b70] p-4 rounded-xl text-center">
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total Amount to be Collected from Shareholder</p>
        <p className="text-2xl font-black text-white">
            {Number(parseFloat(formData.paidup_birr || 0) + parseFloat(formData.service_charge_amt || 0)).toLocaleString()} ETB
        </p>
    </div>

    {/* AGENT SALE TOGGLE */}
    <div className="col-span-3 grid grid-cols-2 gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
        <label className="flex items-center gap-3 cursor-pointer">
            <input 
                type="checkbox" 
                name="is_agent_sale" 
                checked={formData.is_agent_sale === 1} 
                onChange={handleChange}
                className="w-6 h-6 accent-[#1a3b70]" 
            />
            <span className="text-xs font-black text-[#1a3b70] uppercase">Sold via Agent</span>
        </label>
        
        {formData.is_agent_sale === 1 && (
            <FormSelect 
                label="Select Agent" 
                name="agent_id" 
                value={formData.agent_id} 
                onChange={handleChange}
                options={agents.map(a => ({ label: a.agent_name, value: a.id }))} 
            />
        )}
    </div>

</section>

{/* SECTION 5: DOCUMENT UPLOAD (BRD Section 6) */}
<section className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 space-y-6">
    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
        <FileCheck size={14}/> Supporting Documents (Scanned PDF/Images)
    </div>
    <div className="grid grid-cols-3 gap-8">
        {/* ID Document */}
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identification Document</label>
            <input type="file" onChange={e => setIdFile(e.target.files[0])} className="w-full text-[10px] file:bg-[#1a3b70] file:text-white file:rounded-lg file:border-0 file:px-4 file:py-2" />
            {isEditing && formData.id_doc_path && (
                <div className="flex items-center gap-1 text-[#1a3b70] mt-2 bg-white/50 p-1.5 rounded-lg border border-blue-100">
                    <CheckCircle size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-bold italic truncate w-full">Current: {formData.id_doc_path}</span>
                </div>
            )}
        </div>

        {/* Agreement */}
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subscription Agreement</label>
            <input type="file" onChange={e => setAgreementFile(e.target.files[0])} className="w-full text-[10px] file:bg-[#1a3b70] file:text-white file:rounded-lg file:border-0 file:px-4 file:py-2" />
            {isEditing && formData.agreement_doc_path && (
                <div className="flex items-center gap-1 text-[#1a3b70] mt-2 bg-white/50 p-1.5 rounded-lg border border-blue-100">
                    <CheckCircle size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-bold italic truncate w-full">Current: {formData.agreement_doc_path}</span>
                </div>
            )}
        </div>

        {/* Payment Proof */}
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proof of Payment</label>
            <input type="file" onChange={e => setPaymentFile(e.target.files[0])} className="w-full text-[10px] file:bg-[#1a3b70] file:text-white file:rounded-lg file:border-0 file:px-4 file:py-2" />
            {isEditing && formData.payment_doc_path && (
                <div className="flex items-center gap-1 text-[#1a3b70] mt-2 bg-white/50 p-1.5 rounded-lg border border-blue-100">
                    <CheckCircle size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-bold italic truncate w-full">Current: {formData.payment_doc_path}</span>
                </div>
            )}
        </div>
    </div>
</section>

                 <section className="grid grid-cols-2 gap-8 pb-10">
    <div className="col-span-2 text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
       <Landmark size={14}/> Financial & Payout Details
    </div>
    
    <FormSelect 
       label="Payment Method" 
       name="payment_method" 
       value={formData.payment_method} 
       onChange={handleChange} 
       options={['Bank Transfer', 'Cash Deposit', 'Cheque', 'Mobile Money']} 
    />
    
    <FormSelect 
       label="Payment Status" 
       name="payment_status" 
       value={formData.payment_status} 
       onChange={handleChange} 
       options={['Unpaid', 'Partial', 'Full']} 
    />

    <FormInput label="Subscription Ref No." name="subscription_ref_no" value={formData.subscription_ref_no} onChange={handleChange} placeholder="e.g. AG-2024-X" />
    <FormInput label="Account Number" name="bank_account" value={formData.bank_account} onChange={handleChange} />
</section>
              </form>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-5">
                 <button onClick={() => setShowModal(false)} className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                 <button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1a3b70] text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase flex items-center gap-2 shadow-2xl">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                    {isEditing ? 'Save Changes' : 'Save Draft (Maker)'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* IMPORT MODAL */}
{showImportModal && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[70] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
       
       {/* 1. Modal Header */}
       <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tighter">Bulk Migration</h3>
          <X className="text-slate-300 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setShowImportModal(false)} />
       </div>

       {/* 2. ADD THE NEW CODE HERE (Notice Section) */}
       <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Notice: Required CSV Headers</p>
          <div className="h-24 overflow-y-auto bg-white/50 p-3 rounded-xl border border-blue-50">
              <code className="text-[9px] text-blue-800 leading-relaxed break-all font-bold">
                  full_name, type, gender, dob, nationality, occupation, id_type, id_number, tin, phone, alt_phone, email, address_region, address_city, address_subcity, address_woreda, kebele, postal_address, emergency_contact, business_reg_no, license_info, auth_rep_details, contact_person, bank_account, no_of_share, no_of_share_birr, paidup_share, paidup_birr, payment_method, payment_status
              </code>
          </div>
          <p className="text-[9px] text-blue-400 mt-2 italic">* Leave columns empty if not applicable, but headers must exist.</p>
       </div>

       {/* 3. File Input */}
       <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => setSelectedFile(e.target.files[0])} 
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-yellow-400 file:text-[#1a3b70] cursor-pointer" 
       />
       
       <div className="mt-10">
          <button onClick={handleFileUpload} className="w-full bg-[#1a3b70] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Start Migration</button>
       </div>
    </div>
  </div>
)}

{showPaymentModal && selectedShareholder && (
  <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[130] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 relative">
       
       <button onClick={() => setShowPaymentModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500">
          <X size={24} />
       </button>

       <h3 className="text-xl font-black text-slate-800 tracking-tighter mb-2">Record Capital Payment</h3>
       <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">Member: {selectedShareholder.full_name}</p>

       {/* --- ATTACH THE SUBMIT HANDLER HERE --- */}
<form className="space-y-5" onSubmit={handlePaymentSubmit}>
   <FormInput 
      label="Amount Paid (ETB)" 
      type="number" 
      value={paymentForm.amount}
      onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
      required 
   />
   <FormInput 
      label="Reference (Slip No.)" 
      value={paymentForm.ref}
      onChange={e => setPaymentForm({...paymentForm, ref: e.target.value})} 
      required 
   />
   <FormSelect 
      label="Method" 
      value={paymentForm.method}
      options={['Bank Transfer', 'Cash Deposit', 'Mobile Money']} 
      onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} 
   />
   <FormInput 
      label="Payment Date" 
      type="date" 
      value={paymentForm.date} 
      onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} 
   />


     {paymentError && (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
         <XCircle className="text-red-500 flex-shrink-0" size={18} />
         <p className="text-[11px] font-bold text-red-700 leading-tight">
            {paymentError}
         </p>
      </div>
   )}


   <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl mt-4 active:scale-95 transition-all">
      Submit Payment Record
   </button>
</form>
    </div>
  </div>
)}

{/* --- REJECT REASON MODAL --- */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-[#1a3b70]/80 backdrop-blur-md z-[90] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 tracking-tighter mb-2">Reject {rejectTarget.full_name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
              {rejectTarget.action_type === 'EDIT' ? 'This will discard the pending edits and keep the original record.' : 'This will mark the registration as rejected.'}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-red-400 h-28"
            />
            <div className="flex gap-4 mt-8">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
              <button onClick={handleReject} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}


      {/* --- VIEW PROFILE MODAL --- */}
{showProfileModal && selectedShareholder && (
  <div className="fixed inset-0 bg-[#1a3b70]/90 backdrop-blur-md z-[80] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
      
      {/* Modal Header */}
      <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#1a3b70] rounded-2xl flex items-center justify-center text-white text-2xl font-black">
            {selectedShareholder.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{selectedShareholder.full_name}</h3>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{selectedShareholder.shareholder_id}</p>
          </div>
        </div>
        <button onClick={() => setShowProfileModal(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-red-500 shadow-sm border border-slate-100"><X /></button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-10 space-y-10">
        
      

    {/* SHOW AGENT INFO ONLY IF IT WAS AN AGENT SALE */}
    {selectedShareholder.is_agent_sale === 1 && (
        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex justify-between items-center animate-in fade-in">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <UserCheck size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Authorized Sales Agent</p>
                 <p className="text-sm font-black text-slate-800">{selectedShareholder.agent_name || 'Agent Linked'}</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Commission Earned</p>
              <p className="text-sm font-black text-emerald-600">{Number(selectedShareholder.agent_commission_amt).toLocaleString()} ETB</p>
           </div>
        </div>
    )} 

        {/* 1. Profile & Contact Grid */}
        <div className="grid grid-cols-3 gap-8">
           <ProfileData label="Type" value={selectedShareholder.type} />
           <ProfileData label="Gender" value={selectedShareholder.gender || 'N/A'} />
           <ProfileData label="Phone" value={selectedShareholder.phone} />
           <ProfileData label="Email" value={selectedShareholder.email || 'N/A'} />
           <ProfileData label="Occupation" value={selectedShareholder.occupation || 'N/A'} />
           <ProfileData label="Nationality" value={selectedShareholder.nationality} />
<ProfileData label="Introduced By" value={selectedShareholder.introducer_name || 'Direct / Walk-in'} />
        </div>

{/* 2. Financial Standing & Commitment Tracking */}
<div className="bg-[#1a3b70] p-8 rounded-[2.5rem] text-white grid grid-cols-4 gap-6 relative overflow-hidden">
   
   {/* Subscribed Column */}
   <div className="space-y-1 z-10">
      <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Subscribed</p>
      <p className="text-xl font-black">{Number(selectedShareholder.no_of_share_birr).toLocaleString()} ETB</p>
      {/* ADDED THIS LINE BELOW */}
      <p className="text-[10px] font-bold text-yellow-400 opacity-80 uppercase italic">
         Qty: {selectedShareholder.no_of_share?.toLocaleString()} Shares
      </p>
   </div>

   {/* Paid-up Column */}
   <div className="space-y-1 border-l border-white/10 pl-6 z-10">
      <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Paid-up</p>
      <p className="text-xl font-black text-emerald-400">{Number(selectedShareholder.paidup_birr).toLocaleString()} ETB</p>
      {/* ADDED THIS LINE BELOW */}
      <p className="text-[10px] font-bold text-emerald-200 opacity-80 uppercase italic">
         Qty: {selectedShareholder.paidup_share?.toLocaleString()} Shares
      </p>
   </div>
   
   {/* Outstanding Balance */}
   <div className="space-y-1 border-l border-white/10 pl-6 z-10">
      <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Outstanding</p>
      <p className={`text-xl font-black ${selectedShareholder.no_of_share_birr - selectedShareholder.paidup_birr > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
         {Math.max(0, Number(selectedShareholder.no_of_share_birr) - Number(selectedShareholder.paidup_birr)).toLocaleString()} ETB
      </p>
   </div>

   {/* Subscription Status */}
   <div className="space-y-1 border-l border-white/10 pl-6 z-10">
      <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Sub. Status</p>
      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
          selectedShareholder.subscription_status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
      }`}>
         {selectedShareholder.subscription_status || 'Active'}
      </span>
   </div>
</div>
 
 {selectedShareholder.status === 'Active' && (
  <div className="mt-6 flex justify-between items-center bg-yellow-50 p-6 rounded-[2rem] border border-yellow-100 animate-in slide-in-from-top-4">
     <div>
        <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Registry Action</p>
        <p className="text-xs font-bold text-[#1a3b70]">This member is eligible for an official share certificate.</p>
     </div>
     <button 
        onClick={async () => {
           try {
              const res = await API.post('/api/certificates/generate', {
                 shareholder_id: selectedShareholder.id,
                 shares_count: selectedShareholder.no_of_share,
                 user: currentUser
              });
              showNotification(`Certificate ${res.data.certificate_no} Issued Successfully!`);
              setShowProfileModal(false);
           } catch (err) {
              showNotification(err.response?.data?.message || "Issuance Failed", "error");
           }
        }}
        className="bg-[#1a3b70] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-900 transition-all flex items-center gap-2"
     >
        <Award size={16} className="text-yellow-400" /> Issue Certificate
     </button>

     <button 
    onClick={() => {
        // Logic to generate a simple PDF/Digital Statement
        window.print(); 
    }}
    className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2"
>
    <FileText size={16} /> Digital Statement
</button>

  </div>
)}

 
{/* --- MAKER-CHECKER COMPARISON VIEW --- */}
{selectedShareholder.action_type === 'EDIT' && selectedShareholder.pending_data && (
  <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-8 space-y-6 animate-pulse">
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-700">
          <Edit size={16} />
       </div>
       <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest">
          Pending Edit: Review Proposed Changes
       </h4>
    </div>
    
    <div className="grid grid-cols-1 gap-3">
       {Object.entries(
         typeof selectedShareholder.pending_data === 'string' 
           ? JSON.parse(selectedShareholder.pending_data) 
           : selectedShareholder.pending_data
       ).map(([key, newVal]) => {
         // Only show fields that actually changed
         const oldVal = selectedShareholder[key];
         if (String(oldVal) !== String(newVal) && key !== 'pending_data') {
            return (
              <div key={key} className="flex items-center justify-between bg-white/50 p-4 rounded-xl border border-amber-100">
                 <span className="text-[10px] font-black text-slate-400 uppercase w-1/3">{key.replace(/_/g, ' ')}</span>
                 <span className="text-xs text-slate-400 line-through w-1/3">{String(oldVal || 'None')}</span>
                 <span className="text-xs text-emerald-600 font-black w-1/3 text-right">→ {String(newVal)}</span>
              </div>
            );
         }
         return null;
       })}
    </div>
  </div>
)}

        {/* 3. Address & Documents */}
        <div className="grid grid-cols-2 gap-10">
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Location Details</h4>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                 {selectedShareholder.address_city}, {selectedShareholder.address_region}<br/>
                 Sub-city: {selectedShareholder.address_subcity}, Woreda: {selectedShareholder.address_woreda}<br/>
                 Kebele: {selectedShareholder.kebele || 'N/A'}
              </p>
           </div>
           
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">KYC Documents</h4>
              <div className="flex flex-col gap-2">
                 <DocLink label="Identity Document" path={selectedShareholder.id_doc_path} />
                 <DocLink label="Subscription Agreement" path={selectedShareholder.agreement_doc_path} />
                 <DocLink label="Payment Proof" path={selectedShareholder.payment_doc_path} />
              </div>
           </div>
        </div>

        {/* SECTION 6: SYSTEM AUDIT TRAIL (Section 9) */}
        <div className="pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <History size={14}/> Registry Audit Trail
            </h4>
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Registered By</p>
                    <p className="text-xs font-bold text-[#1a3b70] mt-1">{selectedShareholder.created_by || 'N/A'}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                        On: {selectedShareholder.registration_date ? new Date(selectedShareholder.registration_date).toLocaleString() : 'N/A'}
                    </p>
                </div>
                {selectedShareholder.approved_by && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase">Last Approved By</p>
                        <p className="text-xs font-bold text-emerald-700 mt-1">{selectedShareholder.approved_by}</p>
                        <p className="text-[9px] text-emerald-400 mt-0.5">
                            On: {selectedShareholder.updated_at ? new Date(selectedShareholder.updated_at).toLocaleString() : 'N/A'}
                        </p>
                    </div>
                )}
            </div>
        </div>

{/* --- CAPITAL PAYMENT HISTORY --- */}
<div className="pt-10 border-t border-slate-100">
   <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
         <Landmark size={20} />
      </div>
      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Installment History</h4>
   </div>
   
   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
      <table className="w-full text-left text-[10px]">
         <thead>
            <tr className="text-slate-400 uppercase font-black border-b border-slate-200">
               <th className="pb-3">Date</th>
               <th className="pb-3">Ref No.</th>
               <th className="pb-3 text-right">Amount (ETB)</th>
               <th className="pb-3 text-center">Status</th>
               <th className="pb-3 text-right">Receipt</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
            {paymentHistory.map((p, i) => (
               <tr key={i} className="group">
                  <td className="py-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="py-3 font-mono">{p.reference_no}</td>
                  <td className="py-3 text-right">{Number(p.amount_paid).toLocaleString()}</td>
                  <td className="py-3 text-center">
                     <span className={`px-2 py-0.5 rounded text-[8px] font-black ${p.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status}
                     </span>
                  </td>
                  <td className="py-3 text-right">
                     {/* THE LOCK LOGIC: Button only appears if Approved */}
                     {p.status === 'Approved' ? (
                        <button 
                          onClick={() => handlePrintReceipt(p.id)}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-[#1a3b70] hover:text-white transition-all shadow-sm"
                        >
                           <Printer size={12} />
                        </button>
                     ) : (
                        <span className="text-[8px] text-slate-300 italic">Locked</span>
                     )}
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
   </div>
</div>

        {/* --- ADD TRANSACTION HISTORY TAB (Section 2.4 Audit) --- */}
{/* --- DIVIDEND HISTORY (Requirement 2.7.3.5) --- */}
<div className="pt-10 border-t border-slate-100">
   <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
         <Coins size={20} />
      </div>
      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dividend Payout History</h4>
   </div>
   
   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
      <table className="w-full text-left text-[10px]">
         <thead>
            <tr className="text-slate-400 uppercase font-black">
               <th className="pb-3">Financial Year</th>
               <th className="pb-3 text-right">Net Received (ETB)</th>
               <th className="pb-3 text-right">Status</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
            {/* Later we will map through the specific payout history for this user */}
            <tr className="group">
               <td className="py-3">2024/25 Interim</td>
               <td className="py-3 text-right text-emerald-600">12,500.00</td>
               <td className="py-3 text-right"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px]">PAID</span></td>
            </tr>
         </tbody>
      </table>
   </div>
</div>

{/* --- PROFESSIONAL TRANSACTION LEDGER (Requirement 8.5) --- */}
<div className="pt-10 border-t border-slate-100">
   <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-[#1a3b70] rounded-xl flex items-center justify-center text-white shadow-lg">
            <History size={20} />
         </div>
         <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Investment Ledger</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Historical Payment Activity</p>
         </div>
      </div>
      
      {/* Professional "Download Statement" Button */}
      <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-[#1a3b70] hover:text-white transition-all shadow-sm">
         <FileText size={14} /> Download Statement
      </button>
   </div>

   <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
      <table className="w-full text-left">
         <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase">
            <tr>
               <th className="px-6 py-4">Value Date</th>
               <th className="px-6 py-4">Reference / Slip</th>
               <th className="px-6 py-4 text-right">Principal (ETB)</th>
               <th className="px-6 py-4 text-right">Service Fee</th>
               <th className="px-6 py-4 text-center">Status</th>
               <th className="px-6 py-4 text-right">Receipt</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-600">
            {paymentHistory.map((p, i) => (
               <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                     {new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#1a3b70]">{p.reference_no}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-700">
                     {Number(p.amount_paid).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">
                     {Number(p.service_charge_collected).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        p.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                     }`}>
                        {p.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     {/* THE "PRINT" BUTTON LIVES HERE NOW */}
                     {p.status === 'Approved' ? (
                        <button 
                           onClick={() => handlePrintReceipt(p.id)}
                           className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-[#1a3b70] hover:text-white transition-all shadow-sm"
                           title="Print Official Slip"
                        >
                           <Printer size={14} />
                        </button>
                     ) : (
                        <span className="text-[8px] text-slate-300 italic">Locked</span>
                     )}
                  </td>
               </tr>
            ))}
            {paymentHistory.length === 0 && (
               <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-300 italic font-bold uppercase tracking-widest text-[10px]">
                     No financial activity found in registry.
                  </td>
               </tr>
            )}
         </tbody>
      </table>
   </div>
</div>

      </div>

      <div className="p-8 bg-slate-50 border-t flex justify-end">
         <button onClick={() => setShowProfileModal(false)} className="bg-[#1a3b70] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Close Profile</button>
      </div>
    </div>
  </div>
)}

{viewingReceipt && (
        <PaymentReceiptTemplate 
          data={viewingReceipt} 
          onClose={() => setViewingReceipt(null)} 
        />
      )}

    </div>
  );
};

// HELPERS
const FormInput = ({ label, type = "text", ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <input type={type} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 focus:bg-white transition-all shadow-sm" {...props} />
  </div>
);

// --- UPDATED SMART SELECT HELPER ---
// --- MASTER COMPONENT: SMART SELECT HELPER ---
const FormSelect = ({ label, options, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="relative group">
      <select 
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:border-yellow-400 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-50" 
        {...props}
      >
        {/* Default 'Select' option if no value is set */}
        {!props.value && <option value="">Please Select {label}...</option>}

        {/* 
            SAFE MAPPING: 
            1. (options || []) prevents crash if options is undefined/null.
            2. Handles both simple strings ['AA', 'BB'] and objects [{label: 'AA', value: 1}].
        */}
        {(options || []).map((opt, index) => {
          const isObject = typeof opt === 'object' && opt !== null;
          const displayLabel = isObject ? opt.label : opt;
          const valueAttr = isObject ? opt.value : opt;

          return (
            <option key={isObject ? (opt.value || index) : index} value={valueAttr}>
              {displayLabel}
            </option>
          );
        })}
      </select>

      {/* CUSTOM DROPDOWN ARROW ICON */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within:text-yellow-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  </div>
);

const ProfileData = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value}</p>
  </div>
);

const DocLink = ({ label, path }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="flex items-center gap-3">
       <File size={16} className="text-[#1a3b70]" />
       <span className="text-[10px] font-bold text-slate-600">{label}</span>
    </div>
    {path ? (
       <a 
         href={`${API.defaults.baseURL}/documents/${path}`} 
         target="_blank" 
         rel="noreferrer"
         className="text-[#1a3b70] hover:text-blue-800 transition-colors"
       >
          <ExternalLink size={14} />
       </a>
    ) : (
       <span className="text-[10px] text-slate-300 italic">Not Uploaded</span>
    )}
  </div>
);

export default ShareholderModule;
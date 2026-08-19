import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, XCircle, Landmark } from 'lucide-react';
import axios from 'axios';
import Logo from './Rammisbank_logo.png';
import API from './api'; // Import the centralized API instance

const VerifyPortal = () => {
    const { certNo } = useParams();
    const [status, setStatus] = useState('loading'); // loading, valid, invalid
    const [certData, setCertData] = useState(null);

    useEffect(() => {
        API.get(`/api/verify/${certNo}`)
            .then(res => {
                setCertData(res.data);
                setStatus('valid');
            })
            .catch(() => setStatus('invalid'));
    }, [certNo]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="bg-[#1a3b70] p-10 flex flex-col items-center text-center">
                    <img src={Logo} alt="Logo" className="w-20 mb-4" />
                    <h2 className="text-white font-black tracking-widest uppercase text-xs">Registry Verification</h2>
                </div>
                
                <div className="p-10 text-center">
                    {status === 'loading' && <p className="text-slate-400 animate-pulse font-bold">Querying Blockchain Registry...</p>}
                    
                    {status === 'valid' && (
                        <div className="animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={40} className="text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">Authentic Record</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Status: Active & Verified</p>
                            
                            <div className="mt-8 p-6 bg-slate-50 rounded-3xl text-left space-y-3">
                                <Detail label="Holder" value={certData.full_name} />
                                <Detail label="Certificate" value={certData.certificate_no} />
                                <Detail label="Shares" value={certData.shares_count} />
                                <Detail label="Issue Date" value={new Date(certData.issue_date).toLocaleDateString()} />
                            </div>
                        </div>
                    )}

                    {status === 'invalid' && (
                        <div className="animate-in shake duration-500">
                            <XCircle size={60} className="text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-800">Invalid Certificate</h3>
                            <p className="text-slate-500 text-sm mt-2">The scanned document is not recognized by Rammis Bank Registry.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Detail = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
        <span className="text-xs font-bold text-[#1a3b70]">{value}</span>
    </div>
);

export default VerifyPortal;
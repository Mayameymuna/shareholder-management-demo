import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import Logo from './Rammisbank_logo.png';
import { toEthiopianDate, numberToWordsLocal } from './utils/converters';

const PaymentReceiptTemplate = ({ data, onClose }) => {
  // Logic: 5% service fee is usually calculated on the paid amount
  const serviceFee = data.amount_paid * 0.05;
  const ethDates = toEthiopianDate(data.created_at);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto no-print-bg">
      <div id="receipt-paper" className="bg-white w-[800px] min-h-[1000px] p-10 shadow-2xl relative border-t-[12px] border-[#1a3b70] print:m-0 print:shadow-none">
        
        {/* WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
           <img src={Logo} alt="watermark" className="w-96 grayscale" />
        </div>

        {/* 1. HEADER */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8">
           <div className="flex items-center gap-4">
              <img src={Logo} alt="Logo" className="w-16" />
              <div>
                 <h1 className="text-xl font-black text-[#1a3b70] leading-none">RAMMİS BANK S.C.</h1>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Share Management Department</p>
              </div>
           </div>
           <div className="text-right">
              <h2 className="text-sm font-black text-slate-800">SHARE SALES RECEIPT</h2>
              <h2 className="text-[10px] font-serif font-bold text-slate-500">የአክሲዮን ሽያጭ ደረሰኝ / Nagahee Gurgurtaa</h2>
              <p className="text-xs font-mono font-bold text-blue-600 mt-2">No: {data.reference_no}</p>
           </div>
        </div>

        {/* 2. DATE & SHAREHOLDER INFO */}
        <div className="flex justify-between text-[11px] mb-10">
            <div className="space-y-1">
                <p className="text-slate-400 uppercase font-black text-[9px]">Shareholder / ባለአክሲዮን:</p>
                <p className="text-lg font-black text-slate-800 underline underline-offset-4">{data.full_name}</p>
                <p className="text-slate-500 font-bold">ID: {data.shareholder_id}</p>
            </div>
            <div className="text-right space-y-1 font-serif">
                <p><b>Date/ቀን:</b> {new Date(data.created_at).toLocaleDateString('en-GB')} G.C</p>
                <p><b>የኢትዮጵያ ቀን:</b> {ethDates.amh}</p>
            </div>
        </div>

        {/* 3. CORE FINANCIAL CONTENT */}
        <div className="space-y-8 text-[12px] leading-loose font-serif">
            
            {/* Subscribed Details */}
            <div className="border-l-4 border-slate-200 pl-6 space-y-2">
                <p>
                   Aksiyoonaa Galmaa’e / የተመዘገበ የአክሲዮን ብዛት: 
                   <b className="mx-2 text-sm">{data.no_of_share}</b> 
                   ({numberToWordsLocal(data.no_of_share, 'ORO')} / {numberToWordsLocal(data.no_of_share, 'AMH')})
                </p>
                <p>
                   Maallaqaan / በገንዘብ: 
                   <b className="mx-2 text-sm">Birr {Number(data.no_of_share_birr).toLocaleString()}</b> 
                   ({numberToWordsLocal(data.no_of_share_birr, 'EN')} Birr)
                </p>
            </div>

            {/* Current Payment */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[#1a3b70] font-black uppercase text-[10px] mb-4 tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} /> Current Transaction Details
                </p>
                <div className="space-y-4">
                    <p>
                       Amount Paid now / በዚህ ደረሰኝ የተከፈለ: 
                       <b className="mx-2 text-lg text-emerald-600">Birr {Number(data.amount_paid).toLocaleString()}</b>
                    </p>
                    <p className="text-[11px] italic text-slate-500">
                       ({numberToWordsLocal(data.amount_paid, 'ORO')} / {numberToWordsLocal(data.amount_paid, 'AMH')} ብር)
                    </p>
                    
                    <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center">
                        <p className="font-bold text-slate-600">5% Service Fee / የአገልግሎት ክፍያ:</p>
                        <p className="text-lg font-black text-[#1a3b70]">Birr {serviceFee.toLocaleString()}.00</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. BANK DEPOSIT TABLE */}
        <div className="mt-10">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Deposit Verification / የባንክ ማረጋገጫ</p>
            <table className="w-full border-collapse border border-slate-200 text-[10px]">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black">
                    <tr>
                        <th className="border border-slate-200 p-3 text-left">Bank Name / የባንኩ ስም</th>
                        <th className="border border-slate-200 p-3 text-left">Account No / የሂሳብ ቁጥር</th>
                        <th className="border border-slate-200 p-3 text-left">Transaction Ref / ማጣቀሻ</th>
                        <th className="border border-slate-200 p-3 text-right">Date / ቀን</th>
                    </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                    <tr>
                        <td className="border border-slate-200 p-3">{data.bank_name || 'Rammis Bank'}</td>
                        <td className="border border-slate-200 p-3 font-mono">{data.bank_account || '---'}</td>
                        <td className="border border-slate-200 p-3 font-mono">{data.reference_no}</td>
                        <td className="border border-slate-200 p-3 text-right">{new Date(data.payment_date).toLocaleDateString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* 5. SIGNATURES */}
        <div className="grid grid-cols-2 gap-20 mt-16 pb-10">
            <div className="text-center space-y-2">
                <div className="h-12 border-b-2 border-slate-200 flex items-end justify-center pb-1 text-slate-300 italic text-[10px]">Processed Digitally</div>
                <p className="text-[10px] font-black text-[#1a3b70]">Recorder / መዝጋቢው</p>
                <p className="text-[9px] text-slate-400 font-bold">{data.maker_id || 'System User'}</p>
            </div>
            <div className="text-center space-y-2">
                <div className="h-12 border-b-2 border-slate-200"></div>
                <p className="text-[10px] font-black text-[#1a3b70]">Authorized / ያረጋገጠው</p>
                <p className="text-[9px] text-slate-400 font-bold italic">Stamp & Signature Required</p>
            </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-10 left-10 right-10 text-[8px] text-center text-slate-300 border-t border-slate-50 pt-4 uppercase tracking-[0.3em]">
           Rammis Bank SMS • Payment Instrument • Internal Copy
        </div>

        {/* CONTROLS */}
        <div className="absolute top-6 right-6 flex gap-2 no-print">
          <button onClick={() => window.print()} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all"><Printer size={20}/></button>
          <button onClick={onClose} className="p-3 bg-white/10 text-white rounded-xl backdrop-blur-md hover:bg-red-500 transition-all"><X size={20}/></button>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          #receipt-paper { border: none !important; width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default PaymentReceiptTemplate;
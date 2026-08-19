import React from 'react';
import { X, Printer, Award, ShieldCheck } from 'lucide-react';
import Logo from './Rammisbank_logo.png';
import { toEthiopianDate, numberToWordsLocal } from './utils/converters';

const CertificateTemplate = ({ data, onClose, language = 'AMH', params = [] }) => {
  const isAmharic = language === 'AMH';
  const isOromo = language === 'ORO';
  const certValue = data.shares_count * 1000;

  // 1. Helper: Find value from System Parameters
  const getTemplate = (key) => params.find(p => p.param_key === key)?.param_value;

  // 2. Prepare dynamic values for the Template Engine
  const sharesWordsLocal = numberToWordsLocal(data.shares_count, language);
  const sharesWordsEN = numberToWordsLocal(data.shares_count, 'EN');
  const moneyWordsLocal = numberToWordsLocal(certValue, language);
  const moneyWordsEN = numberToWordsLocal(certValue, 'EN');
  const ethDates = toEthiopianDate(data.issue_date);
  const displayDateLocal = isAmharic ? ethDates.amh : ethDates.oro;

  // 3. THE TEMPLATE ENGINE: Replaces tags with actual data
  const injectData = (tpl) => {
    if (!tpl) return "";
    return tpl
      .replace(/\[NAME\]/g, data.full_name)
      .replace(/\[SHARES\]/g, data.shares_count)
      .replace(/\[SHARES_WORDS\]/g, sharesWordsLocal)
      .replace(/\[SHARES_WORDS_EN\]/g, sharesWordsEN)
      .replace(/\[VALUE\]/g, certValue.toLocaleString())
      .replace(/\[VALUE_WORDS\]/g, moneyWordsLocal)
      .replace(/\[VALUE_WORDS_EN\]/g, moneyWordsEN)
      .replace(/\[FROM\]/g, data.numbered_from || '---')
      .replace(/\[TO\]/g, data.numbered_to || '---')
      .replace(/\[MEMO_DATE\]/g, isAmharic ? 'መስከረም 18 ቀን 2015' : 'Fulbaana 18, 2015')
      .replace(/\[ISSUE_DATE\]/g, displayDateLocal);
  };

  // 4. Fetch the dynamic texts (CLEANED UP)
  const headerLocal = getTemplate(isAmharic ? 'cert_header_am' : 'cert_header_oro');
  const headerEN = getTemplate('cert_header_en');
  const bodyLocal = injectData(getTemplate(isAmharic ? 'cert_body_am' : 'cert_body_oro'));
  const bodyEN = injectData(getTemplate('cert_body_en'));
  const footerLocal = getTemplate(isAmharic ? 'cert_footer_am' : 'cert_footer_oro');
  const footerEN = getTemplate('cert_footer_en');

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto no-print-bg font-serif">
      
      <div id="cert-paper" className="bg-white w-[1123px] h-[794px] p-6 shadow-2xl relative border-[4px] border-[#1a3b70] print:m-0 print:border-[2px] overflow-hidden">
        
        <div className="h-full w-full border-[1px] border-[#1a3b70] p-10 flex flex-col relative bg-white">
          
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
             <img src={Logo} alt="watermark" className="w-[450px]" />
          </div>

          {/* 1. TOP LEGAL HEADER - NOW FULLY DYNAMIC */}
          <div className="flex justify-between items-start z-10 mb-6 text-[10px] text-slate-800 uppercase tracking-tight border-b border-slate-200 pb-4">
             <div className="w-1/3 leading-tight font-bold font-serif normal-case">
                {/* USE THE headerLocal VARIABLE HERE */}
                {headerLocal || (isAmharic 
                    ? "በኢትዮጵያ ሕግ መሠረት ላልተወሰነ ጊዜ የተቋቋመ ዋና መ/ቤት አዲስ አበባ" 
                    : "Akkaataa seera Itiyoophiyaatiin kan Dhaabbate")}
             </div>

             <div className="w-1/3 flex flex-col items-center -mt-2">
                <img src={Logo} alt="Logo" className="w-20 mb-2" />
                <h1 className="text-2xl font-black text-[#1a3b70] tracking-[0.1em] font-sans">RAMMİS BANK S.C.</h1>
             </div>

             <div className="w-1/3 text-right space-y-1 normal-case font-medium">
                <p>{headerEN || "Incorporated for Indefinite Period Under the Law of Ethiopia"}</p>
                <p className="text-xs font-mono font-bold text-red-600 mt-2">CERT. NO: {data.certificate_no}</p>
             </div>
          </div>

          {/* 2. CENTERED TITLE BLOCK */}
          <div className="text-center mb-10">
             <h2 className="text-xs font-bold tracking-[0.5em] text-slate-500 mb-1 italic">
                {isAmharic ? 'የአክሲዮን የምስክር ወረቀት' : 'SARTIFIKEETA AKSIYOONAA'}
             </h2>
             <h1 className="text-3xl font-black text-[#1a3b70] tracking-[0.3em] border-b-2 border-[#1a3b70] inline-block px-10 pb-1 font-sans">
                SHARE CERTIFICATE
             </h1>
          </div>

          {/* 3. BILINGUAL CONTENT */}
          <div className="grid grid-cols-2 gap-16 flex-1 px-4 text-[11px] leading-relaxed relative z-10">
             <div className="absolute left-1/2 top-0 bottom-0 w-[0.5px] bg-slate-300"></div>

             {/* LEFT COLUMN: LOCAL */}
             <div className="space-y-6">
                <div className="border border-slate-200 p-4 font-sans">
                   <p className="font-bold border-b border-slate-100 mb-2 underline">{isAmharic ? 'ይህ ሰርተፍኬት በተሰጠበት ቀን:' : 'Guyyaa ragaan kuni kennametti:'}</p>
                   <table className="w-full">
                      <tbody>
                         <tr className="border-b border-slate-50"><td>{isAmharic ? 'የተፈረመ ካፒታል፡-' : "Mallattaa'e:"}</td><td className="text-right font-bold">Birr {Number(data.total_subscribed_bank).toLocaleString()}</td></tr>
                         <tr className="border-b border-slate-50"><td>{isAmharic ? 'የተከፈለ ካፒታል፡-' : "Kaffalame:"}</td><td className="text-right font-bold">Birr {Number(data.total_paidup_bank).toLocaleString()}</td></tr>
                         <tr><td>{isAmharic ? 'የአንድንዱ አክሲዮን ዋጋ፡-' : "Gatii tokkoo:"}</td><td className="text-right font-bold">Birr 1,000.00</td></tr>
                      </tbody>
                   </table>
                </div>
                
                <div className="space-y-4">
                   <p className="italic text-slate-500 underline">{isAmharic ? 'ይህ የምስክር ወረቀት ለ' : 'Ragaan kun Obbo/Adde'}</p>
                   <p className="text-2xl font-bold text-black tracking-tight font-sans">{data.full_name}</p>
                   <p className="text-justify font-serif leading-loose">
                      {bodyLocal}
                   </p>
                </div>
                <p className="font-bold">{isAmharic ? 'የተሰጠበት ቀን፡-' : 'Guyyaa Itti Kenname:'} {displayDateLocal}</p>
             </div>

             {/* RIGHT COLUMN: ENGLISH */}
             <div className="space-y-6 pl-2 font-sans">
                {/* ... existing English capital table ... */}
                <div className="border border-slate-200 p-4">
                   <p className="font-bold border-b border-slate-100 mb-2 underline italic">As of the date of issuance of this certificate:</p>
                   <table className="w-full">
                      <tbody>
                         <tr className="border-b border-slate-50"><td>Subscribed Capital:</td><td className="text-right font-bold">Birr {Number(data.total_subscribed_bank).toLocaleString()}</td></tr>
                         <tr className="border-b border-slate-50"><td>Paid up Capital:</td><td className="text-right font-bold">Birr {Number(data.total_paidup_bank).toLocaleString()}</td></tr>
                         <tr><td>Par value per share:</td><td className="text-right font-bold">Birr 1,000.00</td></tr>
                      </tbody>
                   </table>
                </div>

                <div className="space-y-4">
                   <p className="italic text-slate-500 underline">This is to certify that</p>
                   <p className="text-2xl font-bold text-black tracking-tight">{data.full_name}</p>
                   <p className="text-justify italic leading-loose">
                      {bodyEN}
                   </p>
                </div>

                <p className="font-bold pt-4">Date of Issue: {new Date(data.issue_date).toLocaleDateString('en-GB')} G.C</p>
             </div>
          </div>

          {/* 4. SIGNATURES AREA */}
          <div className="grid grid-cols-2 mt-10 border-t-2 border-slate-800 pt-8 font-sans">
             <div className="flex flex-col items-center">
                <div className="h-12 w-64 border-b border-black mb-2 flex items-end justify-center pb-1 text-slate-200 italic text-[8px]">Authorized Digital Signature</div>
                <p className="text-[11px] font-black uppercase text-black">Chief Executive Officer</p>
                <p className="text-[9px] text-slate-500">{isAmharic ? 'ዋና ሥራ አስፈጻሚ' : 'Hoji Raawwachiisaa Ol\'aanaa'}</p>
             </div>
             
             <div className="flex flex-col items-center relative">
                <div className="h-12 w-64 border-b border-black mb-2 flex items-end justify-center pb-1 text-slate-200 italic text-[8px]">Board Authorized Signature</div>
                <p className="text-[11px] font-black uppercase text-black">Board Chairman</p>
                <p className="text-[9px] text-slate-500">{isAmharic ? 'የቦርድ ሊቀመንበር' : 'Dura taa\'aa Boordii'}</p>
             </div>
          </div>

          {/* DYNAMIC FOOTER (UPDATED) */}
          <div className="mt-8 text-[8px] text-center text-slate-500 leading-tight uppercase tracking-widest border-t border-slate-100 pt-4 font-sans">
             <p className="font-bold mb-1">Rammis Bank Share Management Registry • Official Copy</p>
             {/* INSERT DYNAMIC FOOTER HERE */}
             <p className="normal-case font-serif italic text-slate-400">
                {isAmharic ? footerLocal : (footerLocal || "Oromo Footer Placeholder")}
             </p>
             <p className="mt-1 normal-case">{footerEN || "These shares may be transferred in accordance with the bank's articles of association."}</p>
          </div>
        </div>
      </div>

      {/* ... Buttons and Styles ... */}
      <div className="fixed top-8 right-8 flex flex-col gap-4 no-print">
         <button onClick={() => window.print()} className="bg-[#1a3b70] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-2 border-white">
            <Printer size={24}/>
         </button>
         <button onClick={onClose} className="bg-red-600 text-white w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center hover:bg-red-700 transition-all border-2 border-white shadow-2xl">
            <X size={24}/>
         </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;700;900&family=Montserrat:wght@400;700;900&display=swap');
        #cert-paper { font-family: 'Libre Baskerville', serif; }
        h1, h2 { font-family: 'Cinzel', serif; }
        .font-sans { font-family: 'Montserrat', sans-serif; }
        @media print {
          @page { size: landscape; margin: 0; }
          body { background: white !important; }
          .no-print { display: none !important; }
          #cert-paper { border: none !important; width: 100vw !important; height: 100vh !important; margin: 0; padding: 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default CertificateTemplate;
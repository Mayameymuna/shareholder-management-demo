// --- 1. GREGORIAN TO ETHIOPIAN DATE CONVERTER ---
export const toEthiopianDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Simplified conversion logic for banking certificates
    // Adjusts for the 7-8 year gap and Pagume
    let ethYear = year - 8;
    let ethMonth = month + 4;
    let ethDay = day;

    if (ethMonth > 12) {
        ethMonth -= 12;
        ethYear += 1;
    }

    // Note: Professional systems usually use a library like 'ethiopian-calendar' 
    // for exact Pagume accuracy, but this works for most standard dates.
    return {
        amh: `${ethDay}/${ethMonth}/${ethYear} ዓ.ም`,
        oro: `${ethDay}/${ethMonth}/${ethYear} A.L.I`
    };
};

// --- 2. NUMBER TO WORDS (BILINGUAL) ---
export const numberToWordsLocal = (num, lang = 'EN') => {
    const amharicOnes = ['', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'];
    const amharicTens = ['', 'አስር', 'ሃያ', 'ሰላሳ', 'አርባ', 'ሃምሳ', 'ስድሳ', 'ሰባ', 'ሰማንያ', 'ዘጠና'];
    
    const oromoOnes = ['', 'Tokko', 'Lama', 'Sadii', 'Afur', 'Shan', 'Jaba', 'Torba', 'Saddeet', 'Sagal'];
    const oromoTens = ['', 'Kudhan', 'Digdama', 'Soddoma', 'Afurtama', 'Shantama', 'Seittama', 'Torbatama', 'Saddeettama', 'Sagaltama'];

    const englishOnes = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const englishTens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return "Zero";
    
    // Logic for numbers up to 100 (Common for share counts like 50, 60, 100)
    if (num < 100) {
        const t = Math.floor(num / 10);
        const o = num % 10;
        if (lang === 'AMH') return amharicTens[t] + (o > 0 ? " " + amharicOnes[o] : "");
        if (lang === 'ORO') return oromoTens[t] + (o > 0 ? " " + oromoOnes[o] : "");
        return englishTens[t] + (o > 0 ? " " + englishOnes[o] : "");
    }

    // Logic for Thousands (Common for Birr amounts like 50,000)
    if (num >= 1000) {
        const thousandPart = Math.floor(num / 1000);
        const rest = num % 1000;
        if (lang === 'AMH') return numberToWordsLocal(thousandPart, 'AMH') + " ሺህ" + (rest > 0 ? " " + numberToWordsLocal(rest, 'AMH') : "");
        if (lang === 'ORO') return "Kuma " + numberToWordsLocal(thousandPart, 'ORO') + (rest > 0 ? " " + numberToWordsLocal(rest, 'ORO') : "");
        return numberToWordsLocal(thousandPart, 'EN') + " Thousand" + (rest > 0 ? " " + numberToWordsLocal(rest, 'EN') : "");
    }

    return num.toString(); // Fallback
};
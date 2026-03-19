export function parsePrice(val: any): number | null {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    
    // Remove currency symbols, commas, and other non-numeric characters (keep decimal and minus)
    const clean = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

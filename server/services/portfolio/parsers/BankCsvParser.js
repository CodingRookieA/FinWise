import PortfolioHolding from '../models/PortfolioHolding.js';

class BankCsvParser {
    constructor() {
        if (this.constructor === BankCsvParser) {
            throw new Error('Cannot instantiate abstract class BankCsvParser');
        }
    }

    parse(rows) {
        throw new Error('Method parse() must be implemented.');
    }

    canParse(headers) {
        const headerSet = new Set(headers.map(h => h.trim().toLowerCase()));
        const required = this.requiredHeaders.map(h => h.trim().toLowerCase());
        return required.every(header => headerSet.has(header));
    }

    get requiredHeaders() {
        throw new Error('Getter requiredHeaders must be implemented.');
    }

    cleanTicker(val) {
        if (!val) return '';
        let cleaned = val.toString().toUpperCase().trim();
        // Step 2: BMO Suffix Translation
        cleaned = cleaned.replace(/-TC$/, '.TO')
                         .replace(/-VC$/, '.V')
                         .replace(/\.?UN-TC$/, '.UN')
                         .replace(/\/PA-TC$/, '/PA')
                         .replace(/:CA$/, ''); 
        return cleaned;
    }

    determineAssetClass(ticker, quantity, description, securityType) {
        // Step 3: Explicit Metadata Check
        if (securityType) {
            const st = securityType.toString().toLowerCase();
            if (st.includes('mutual fund')) return 'Mutual Fund';
            if (st.includes('etf')) return 'ETF';
        }

        const mfRegex = /^[A-Z]{3,4}\d{3,5}(\.[A-Z]{1,2})?$/i;
        const etfRegex = /^[A-Z]{1,4}(\.TO|\.V|:CA|:US)?$/i;

        const isMfTicker = mfRegex.test(ticker);

        // Step 5: The ETF Fund Fallback
        if (description && description.toLowerCase().includes('etf') && isMfTicker) {
            return 'Mutual Fund';
        }

        // Step 4.3: Volumetric Precision (Tie-Breaker)
        if (quantity !== undefined && quantity !== null) {
            const qtyStr = quantity.toString();
            if (qtyStr.includes('.')) {
                const decimals = qtyStr.split('.')[1].length;
                if (decimals >= 3) {
                    return 'Mutual Fund';
                }
            }
        }

        // Step 4.1 & 4.2: Heuristic Classification
        if (isMfTicker) {
            return 'Mutual Fund';
        }
        
        if (etfRegex.test(ticker)) {
            return 'ETF';
        }

        return 'ETF'; // Default
    }
}

export default BankCsvParser;
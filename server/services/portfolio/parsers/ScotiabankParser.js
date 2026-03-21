import BankCsvParser from './BankCsvParser.js';
import PortfolioHolding from '../models/PortfolioHolding.js';

class ScotiabankParser extends BankCsvParser {
    get requiredHeaders() {
        return ['Symbol', 'Description', 'Security Type'];
    }

    parse(rows) {
        return rows.map(row => {
            const ticker = this.cleanTicker(row['Symbol']);
            const qty = row['Quantity'] ? parseFloat(row['Quantity']) : 0;
            const desc = row['Description'];
            const securityType = row['Security Type'] || null;

            return new PortfolioHolding(
                ticker,
                this.determineAssetClass(ticker, qty, desc, securityType),
                qty,
                0, 0
            );
        });
    }
}
export default ScotiabankParser;

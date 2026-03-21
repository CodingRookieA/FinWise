import BankCsvParser from './BankCsvParser.js';
import PortfolioHolding from '../models/PortfolioHolding.js';

class CIBCParser extends BankCsvParser {
    get requiredHeaders() {
        return ['Security type', 'Symbol', 'Transaction type', 'Quantity'];
    }

    parse(rows) {
        return rows.map(row => {
            const ticker = this.cleanTicker(row['Symbol']);
            const qty = parseFloat(row['Quantity']) || 0;
            const securityType = row['Security type'];

            return new PortfolioHolding(
                ticker,
                this.determineAssetClass(ticker, qty, null, securityType),
                qty,
                0, 0
            );
        });
    }
}
export default CIBCParser;
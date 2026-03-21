import BankCsvParser from './BankCsvParser.js';
import PortfolioHolding from '../models/PortfolioHolding.js';

class TDParser extends BankCsvParser {
    get requiredHeaders() {
        return ['Account', 'Action', 'Symbol', 'Security Type', 'Quantity'];
    }

    parse(rows) {
        return rows.map(row => {
            const tickerRaw = row['Symbol'] || '';
            const ticker = this.cleanTicker(tickerRaw);
            
            const qty = parseFloat(row['Quantity']) || 0;
            const securityType = row['Security Type'] || null;
            const description = row['Description'] || null;

            return new PortfolioHolding(
                ticker,
                this.determineAssetClass(ticker, qty, description, securityType),
                qty,
                0, 0
            );
        });
    }
}
export default TDParser;
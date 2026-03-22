import TDParser from './parsers/TDParser.js';
import RBCParser from './parsers/RBCParser.js';
import BMOParser from './parsers/BMOParser.js';
import ScotiabankParser from './parsers/ScotiabankParser.js';
import CIBCParser from './parsers/CIBCParser.js';

class CsvParserRouter {
    constructor() {
        this.parsers = [
            new TDParser(),
            new CIBCParser(),
            new RBCParser(),
            new BMOParser(),
            new ScotiabankParser()
        ];
    }

    detectParser(headers) {
        for (const parser of this.parsers) {
            if (parser.canParse(headers)) {
                return parser;
            }
        }
        throw new Error('Unsupported CSV format or unrecognized brokerage.');
    }
}

export default CsvParserRouter;

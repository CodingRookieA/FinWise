import YahooFinance from "yahoo-finance2";
import fs from 'fs'

let etfs
try {
    const data = fs.readFileSync('./etfs/canadian_etfs.txt', 'utf8');
    etfs = JSON.parse(data);
    // console.log('File content:', etfs);
} catch (err) {
    console.error('Error reading file:', err);
}

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export default {
    isValidCanadianETF(symbol) {
        if(!etfs.includes(symbol + '.TO')){
            return false
        }

        return true
    },

    async getCanadianETFS() {
        const quote = await yahooFinance.quote(etfs,
            {
                region: 'CA',
                lang: 'en-CA',
            }
        )
        return quote
        // console.log(quote)
    },
}

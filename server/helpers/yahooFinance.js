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
    async isValidCanadianETF(symbol) {
        const quote = await yahooFinance.quote(symbol + '.TO',
            {
                region: 'CA',
                lang: 'en-CA'
            }
        )

        if(quote?.market !== 'ca_market' || quote?.quoteType !== 'ETF'){
            return false
        }

        console.log('Quote ----------------\n', quote)
        return true
    },

    async getCanadianETFS() {
        const quote = await yahooFinance.quote(etfs,
            {
                region: 'CA',
                lang: 'en-CA',
            }
        )

        console.log(quote)
        // const chartInfo = await yahooFinance.chart('APLE.TO',
        //     {
        //         period1: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        //         interval: '1h'
        //     }
        // )
        // console.log(chartInfo)
    },

    async fetchAllETFs() {
        if (!Array.isArray(etfs) || etfs.length === 0) {
            return []
        }

        try {
            const quote = await yahooFinance.quote(etfs,
                {
                    region: 'CA',
                    lang: 'en-CA',
                }
            )

            if (!quote) {
                return []
            }

            return Array.isArray(quote) ? quote : [quote]
        } catch (error) {
            console.error('Error fetching ETFs:', error.message)
            return []
        }
    }
}

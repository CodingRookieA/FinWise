import YahooFinance from "yahoo-finance2";

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
        return true
    }
}

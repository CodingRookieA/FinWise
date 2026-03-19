export function slimETF(yahooETF) {
    return {
        symbol: yahooETF?.symbol ?? null,
        name: yahooETF?.shortName ?? null,
        currency: yahooETF?.currency ?? null,
        exchange: yahooETF?.exchange ?? null,
        current_price: yahooETF?.regularMarketPrice ?? null,
        price_change_pct: yahooETF?.regularMarketChangePercent ?? null,
        ytd_return: yahooETF?.ytdReturn ?? null,
        three_month_return: yahooETF?.trailingThreeMonthReturns ?? null,
        fifty_two_week_return: yahooETF?.fiftyTwoWeekChangePercent ?? null,
        fifty_two_week_high: yahooETF?.fiftyTwoWeekHigh ?? null,
        fifty_two_week_low: yahooETF?.fiftyTwoWeekLow ?? null,
        dividend_yield: yahooETF?.dividendYield ?? null,
        net_assets: yahooETF?.netAssets ?? null,
        last_updated: yahooETF?.regularMarketTime ?? null,
        market_state: yahooETF?.marketState ?? null,
        mer: null,
        fund_category: null,
        one_year_return: null,
        three_year_return: null,
        five_year_return: null,
        benchmark: null,
        num_holdings: null,
        asset_allocation: null,
        geographic_allocation: null,
    }
}

export function getMatchingETFs(userProfile, allETFs) {
    if (!Array.isArray(allETFs) || allETFs.length === 0) {
        return []
    }

    const validExchanges = new Set(['TOR', 'TSX'])
    const filtered = allETFs.filter(etf =>
        etf && etf.currency === 'CAD' && validExchanges.has(etf.exchange)
    )

    const scored = filtered.map(etf => {
        let score = 0

        const ytdReturn = Number(etf.ytdReturn)
        if (Number.isFinite(ytdReturn) && ytdReturn > 0) {
            score += 10
        }

        const threeMonthReturn = Number(etf.trailingThreeMonthReturns)
        if (Number.isFinite(threeMonthReturn) && threeMonthReturn > 0) {
            score += 5
        }

        const fiftyTwoWeekReturn = Number(etf.fiftyTwoWeekChangePercent)
        if (Number.isFinite(fiftyTwoWeekReturn) && fiftyTwoWeekReturn > 0) {
            score += 10
        }

        const netAssets = Number(etf.netAssets)
        if (Number.isFinite(netAssets)) {
            if (netAssets >= 1_000_000_000) {
                score += 15
            } else if (netAssets >= 100_000_000) {
                score += 10
            } else if (netAssets >= 10_000_000) {
                score += 5
            }
        }

        const dividendYield = Number(etf.dividendYield)
        const incomeGoals = new Set(['income_generation', 'income', 'grow wealth'])
        if (
            Number.isFinite(dividendYield) &&
            dividendYield > 3 &&
            incomeGoals.has(userProfile?.financial_goal)
        ) {
            score += 20
        }

        return { etf, score }
    })

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, 10).map(entry => slimETF(entry.etf))
}

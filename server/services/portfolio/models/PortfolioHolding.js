class PortfolioHolding {
    /**
     * @param {string} ticker 
     * @param {string} assetClass 
     * @param {number} shares 
     * @param {number} bookValue 
     * @param {number} currentPrice 
     */
    constructor(ticker, assetClass, shares, bookValue, currentPrice) {
        this.ticker = ticker;
        this.assetClass = assetClass;
        this.shares = shares;
        this.bookValue = bookValue;
        this.currentPrice = currentPrice;
    }
}

export default PortfolioHolding;

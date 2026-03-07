
import mongoose from 'mongoose'
import { ENVIRONMENT } from './utils/constants.js'
import { indexSource } from './services/article/indexService.js'

await mongoose.connect(ENVIRONMENT.mongoURI)

console.log('MongoDB connected')

const source = {
    url: 'https://www.wealthsimple.com/en-ca/learn/how-to-invest-in-mutual-funds#what_are_mutual_funds',
    category: 'fundamentals'
}

await indexSource(source, `
 How to Invest in Mutual Funds

Mutual funds allow investors to pool their money to invest in a broad range of assets like stocks and bonds. Instead of owning those assets, investors own shares in the fund itself, and those shares rise and fall in value with the assets.

What are mutual funds?

A mutual fund pools money from a set of investors in order to invest in a portfolio of asset classes like stocks and bonds. Unlike the stock market, in which investors purchase shares from one another, mutual fund shares are purchased directly from the fund or a broker who purchases shares for investors.

How do mutual funds work?

Mutual funds include equity funds, which invest in stocks including Canadian equities and small or large cap businesses. They also include money market funds, which invest in short-term fixed-income securities such as government bonds or treasury bills. Fixed income funds focus on investments that pay a fixed rate of return, including government bonds, investment-grade corporate bonds, and high-yield corporate bonds.

The price of the mutual fund, also known as its net asset value (NAV), is determined by the total value of the securities in the portfolio, divided by the number of the fund's outstanding shares. This price fluctuates based on the value of the securities held by the portfolio at the end of each business day.

In the case of actively managed mutual funds, the decisions to buy and sell securities are made by one or more portfolio managers, supported by researchers. A portfolio manager's primary goal is to seek out investment opportunities that help enable the fund to outperform its benchmark, which is generally an index such as the S&P/TSX Composite. While it may be tempting to focus on short-term performance when evaluating a fund, always keep in mind that any past performance is no guarantee for future performance.

What are the different types of mutual funds?

Mutual funds are divided into two main types — closed-end and open-ended funds. Within open-ended funds, there are two divisions: load and no-load.

Closed-ended funds have a set number of shares issued to the public through an initial public offering. These shares trade on the open market. This approach, combined with the fact that a closed-end fund does not redeem or issue new shares like a normal mutual fund, subjects the fund shares to the laws of supply and demand. As a result, shares of closed-end funds normally trade at a discount to net asset value.

Open-ended funds are the majority of mutual funds. The fund does not have a set number of shares. Instead, the fund will issue new shares to an investor based on the current net asset value and redeem the shares when the investor decides to sell.

In mutual fund terms, a load is a sales commission. If a fund charges a load, the investor will pay the sales commission on top of the net asset value of the fund's shares. No-load funds tend to generate higher returns for investors due to the lower expenses associated with ownership.

How do you invest in mutual funds?

Before you buy a mutual fund, make sure it is the investment product you want. Mutual funds often charge higher fees than other investments including exchange-traded funds (ETFs).

The biggest decision you will make in buying mutual funds is choosing the sector the mutual fund will invest in. You should also think about your investment goals and what kind of risk you are willing to take on. If you are risk-averse, a more conservative portfolio is probably right for you. If you are working with a long time horizon, you may be more enticed to add some riskier funds.

Once you have figured out what kinds of mutual funds you want to buy, make sure they are good quality in comparison to other funds that do the same thing. Many fund companies will provide ratings from Morningstar, the investment research agency, next to all of their offerings. These range from one to five stars, five being the best.

Unlike stocks, which are not generally marketed and sold by a company itself, you can go straight to the mutual fund issuers and buy their funds. Financial institutions sell these funds too. Just be aware that when you use one company to buy another's fund, you may be charged a fee that you would not pay if you bought the fund directly from the issuer.

Fees are normally listed online and in the mutual fund's fact sheet. Fees are like investment termites — they will eat into your returns — and over time they can have a big impact. If you put $100,000 into a mutual fund that charged the average fee in Canada, you would be $25,000 worse off in 10 years than if you had invested that money in passive ETFs that charged a fraction of the fees and achieved the same return.

Trading mutual funds should never be undertaken for emotional reasons. If the stock market experiences a big tumble one day, you might be tempted to move your money to cash or foreign stocks. According to the first rule of investing — buy low, sell high — this may not be a wise thing to do. You should plan to periodically adjust your investments to maintain a consistent asset allocation. Plan on rebalancing your portfolio annually.

How do mutual funds make money?

Mutual fund issuers charge fees in the form of trading fees, management expense ratios (MERs), and loads.

Trading fees: Online platforms will generally assess a one-time trading fee to buy most mutual funds. Increasingly, platforms offer substantial lists of no-trading-fee funds.

Management Expense Ratios (MERs): These reflect the fees charged to run a fund. Mutual funds are run by fund managers who are entrusted with trading the contents of the fund. MERs are expressed as a percentage. A percentage that might look quite small, like 1 or 2%, is shaved off the value of the entire fund annually, whether or not the fund made or lost money. Over time these MERs add up significantly.

Loads: It is not uncommon for trading platforms to waive trading fees for mutual funds that come equipped with loads. Load is simply a term for sales commission. Loaded mutual funds are named based on when the fee is charged. Front-loaded funds assess the fee when you buy the fund. Back-loaded funds charge a fee when you sell. Some funds spread the fee over the time you own the fund.

Disadvantages of investing in mutual funds

Cost: Management fees of mutual funds can be high, eating into your returns.

Fees: May include built-in loads, which are essentially sales commissions.

Liquidity: Mutual funds can be traded only once per day, unlike other investments which may be traded throughout the trading day.

Financial advice: Most mutual funds do not come with financial advice.

Spotty returns: Over the long term, the vast majority of actively managed mutual funds have failed to outperform benchmarks. Though many fail to outperform the market, you still pay for active management.

The alternative to active investing is passive investing — leaving your money alone for a long period of time in a low-fee account that seeks to mirror rather than outperform a market. This can be accomplished through an index fund, which tends to have significantly lower fees than actively managed funds because it simply maintains holdings in proportion to indexes such as the S&P/TSX Composite.

Advantages of investing in mutual funds

Flexibility: Able to react quickly to changing market conditions since they are actively managed.

Diversification: A single mutual fund may contain dozens or even hundreds of separate stocks or issuers.

What does the letter at the end of a mutual fund name mean?

The letter in a mutual fund name refers to the fund's series or class. Each series has different benefits and a different cost structure.

A series: Typically sold by a financial advisor or bought directly by an individual. They typically have a lower minimum investment requirement. Advisors that sell A series funds may receive a commission.

D series: Built for self-directed investors who buy funds through a brokerage. No advice comes with D series funds and as a result they generally have lower fees.

F series: Stands for fee-based mutual funds. The fees are paid through the advisor rather than through the fund. Advisors often charge in the region of 1 to 2%.

I series: In most cases stands for institutional. Some I series funds have a high investment minimum, making them suitable only for high-net-worth individuals.

O series: Generally refers to institutional mutual funds.

T series: Mutual funds with the letter T are tax-advantaged most of the time. These funds often have some portion of the returns that are not taxable.

How to make money from mutual funds

When you invest in a mutual fund, the value can increase in three primary ways.

Dividend payments: Income is earned from dividends on stocks and interest on bonds held in the fund's portfolio. A fund pays out nearly all of the income it receives over the year to fund owners in the form of a distribution. Funds often give investors a choice to either receive a check for distributions or to reinvest the earnings and get more shares.

Capital gain: When a fund sells a security that has gone up in price, this is a capital gain. When a fund sells a security that has gone down in price, this is a capital loss. Most funds distribute any net capital gains to investors annually.

Net asset value (NAV): If fund holdings increase in price but are not sold by the fund manager, the fund's shares increase in price. This is similar to when the price of a stock increases — you do not receive immediate distributions, but the value of your investment is greater, and you would make money if you decide to sell.

Investors in a mutual fund share equally in losses and gains. If one of your investments within the mutual fund goes bad, this does not drag down your entire investment portfolio. While investing in mutual funds does help to spread the risk, it does not eliminate it.
`)

await mongoose.disconnect()
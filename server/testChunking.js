/**
 * testChunking.js
 * Debug tool to test the chunking service and see actual chunk boundaries
 * 
 * Usage: node testChunking.js
 */

import { chunkArticle } from './services/article/chunkingService.js'

const testArticle = `What is a mutual fund?
A mutual fund is a type of investment vehicle where the money collected from various investors is pooled together to invest in different assets including bonds, stocks, and/or money market investments. Mutual funds are professionally managed by Fund Managers, who allocate the fund's assets and attempt to produce returns for investors.


What are the benefits of a mutual fund?
There are several reasons why an investor might choose to invest in a mutual fund. To name a few, mutual funds typically require a small initial minimum investment amount and are traded once per day at their closing Net Asset Value (NAV), allowing them to be relatively accessible for most investors.

Another advantage of mutual funds is that there is a team of professionals behind the scenes managing the mutual fund. For actively managed funds, fund managers follow market opportunities and other strategies to determine which stock, bond and other securities to buy and sell, with the intention of achieving the investment objective of the mutual fund.

Finally, mutual funds offer diversification. Since most mutual funds tend to invest in several different securities, the risks associated with investing in a single security are reduced because you're not putting all your eggs in one basket.

How do mutual funds work?
How do mutual fund distributions work?
Distributions may be in the form of capital gains, interest income, or foreign source income or “taxable dividends”.

Because mutual funds invest in a variety of different assets, income can be earned from dividends on stocks and interest on bonds held within the fund's portfolio. A fund will typically pay out a portion of the income it receives over the year to fund owners. Also, if the fund sells securities that have increased in price, most will pass on these gains to investors in the form of a distribution.

Finally, if a fund's Net Asset Value (NAV) increases in value but is not sold by the fund manager, the fund's units will increase in price. Investors can then sell their mutual fund units for a profit in the market.

Distributions are generally taxable to the investor whether the distributions are paid out in cash or reinvested into the mutual fund.

How are distributions calculated?

Distributions are allocated to unitholders in proportion to the number of units they hold on a specific date, known as the “record date”.

The frequency at which distributions will be paid will vary depending on the specific fund however can be paid monthly, quarterly, or annually.

Mutual fund costs
Management Expense Ratio
In general, there are fees and expenses associated with investing in a mutual fund. Some of these fees are payable directly by the fund and others are payable by the customer. It is important to understand these fees and expenses and how they will impact your investment in the fund. Customers should refer to the Fund Facts and Simplified Prospectus for important information about the mutual fund.

Mutual fund costs are typically expressed as a Management Expense Ratio (MER). The MER represents the total of the fund’s management fee (which includes the trailing commission) and any expenses, costs or fees incurred by the fund and is expressed as an annual expense. The MER is not charged to investors directly but rather, deducted from the returns of a fund.

The MER consists of the different costs associated with operating the fund. This includes portfolio management fees, taxes and operating costs. These are paid to the fund manager to cover the day-to-day operations of the fund that include research, regulatory compliance, investment and professional management.

Why do MERs vary?

MERs may vary depending on the type of fund and how actively managed it is. For example, index funds generally have lower MERs because they are passively managed in that the fund manager simply matches a market index.

With actively managed funds, however, the fund manager buys and sells securities, seeking to outperform the index. Backed by a team of researchers and analysts, fund managers stay on top of market opportunities, looking for ways to maximize returns while mitigating risk and making investment decisions to pursue the investment objective of the fund.

For the most part, actively managed funds cost more than those that are passively managed because you’re paying for investment-picking expertise.

Mutual funds vs. ETFs
What is an ETF?
Exchange-Traded Funds (ETFs) are investments that seek to combine the diversification of mutual funds with the trading flexibility of securities.

Like mutual funds, ETFs invest in a basket (i.e. portfolio) of securities such as stocks, fixed income or commodities. But, unlike mutual funds, ETFs are bought and sold on a stock exchange. This means their pricing changes throughout the day.

In contrast, mutual fund prices are determined daily after the close of the stock market. Additionally, mutual fund purchases and sales are processed by the fund company.

What are the costs associated with an ETF?
Costs of owning ETFs include management fees, operational expenses and trading fees.

Like mutual funds, ETFs charge a management fee and have certain operating costs for the ongoing operation and administration of the ETF which may be included in the MER. Also, buying and selling ETFs on a stock exchange can incur brokerage fees/commissions.

Investors should review the ETF Facts for more information.

How do the costs of mutual funds and ETFs compare?
Cost-sensitive investors may be interested in the potentially lower annual fees and no investment minimums offered by ETFs, which are typically passively managed. However, if you wish to invest small amounts of money regularly (such as with a dollar-cost averaging strategy or pre-authorized contributions), frequent trading commissions can reduce your returns, increasing the cost of your ETF investment.

Compared to ETFs, mutual funds typically come with minimum investment and higher expenses, such as management and operational fees. However, it’s important to remember that with those higher fees, investors also receive active management which includes the services of a manager who is much more involved in the funds’ investment selection and management and the fees also contain the cost of financial advice.

If you can’t decide between mutual funds and ETFs based on their investment cost, consider what kind of investor you are.

Active vs. passively managed funds
With actively managed ETFs, the Portfolio Manager buys and sells securities based on their research and strategies making tactical and strategic asset allocation decisions regarding the mix of equities, fixed income, etc. depending on the fund’s mandate. They seek to own a basket of securities that is different from an index in an attempt to outperform it to meet a specific objective such as growth, protecting capital or providing income. Active management tends to come at a higher cost given the Portfolio Manager's skill, research and decision making.

For passively managed ETFs, the Portfolio Manager constructs a portfolio that closely replicates a benchmark index. For example, the ETF would seek to hold a similar basket of securities as the S&P/ TSX Composite Index or the Dow Jones Industrial Average Index. Passive management tends to come at a lower cost since less research and skill are required to achieve index replication.

Which approach best suits your needs?

Active management may be better suited for investors who:

Seek the potential for better returns with less risk than a benchmark index
Have a specific objective, such as capital preservation
Want to take advantage of potential market opportunities as they arise
Want access to a wider variety of investment strategies, such as defensive strategies aimed at reducing portfolio volatility and risk
Want a team of experienced professionals to manage investments on their behalf
Passive management may be better suited for investors who:

Do-it-yourself investors
Are looking for low-cost exposure to specific investment markets
Are comfortable with the associated market risk
Are satisfied to achieve returns that closely mirror a particular index, less the MER`

console.log('\n🧪 Testing Chunking Service\n')
console.log('='.repeat(80))

const chunks = chunkArticle(testArticle)

console.log(`\n✅ Generated ${chunks.length} chunks\n`)

chunks.forEach((chunk, index) => {
    const tokenEstimate = Math.ceil(chunk.length / 4)
    console.log(`\n${'═'.repeat(80)}`)
    console.log(`📦 CHUNK ${index + 1}/${chunks.length} (≈${tokenEstimate} tokens, ${chunk.length} chars)`)
    console.log(`${'═'.repeat(80)}`)
    console.log(chunk)
})

console.log('\n' + '='.repeat(80))
console.log(`✅ Chunking test complete\n`)

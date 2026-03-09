import re
import sys
import json
import requests
from lxml import etree


# ── CIBC category pages that list all mutual funds ──
CATEGORY_URLS = [
    "https://www.cibc.com/en/personal-banking/investments/mutual-funds/growth-funds.html",
    "https://www.cibc.com/en/personal-banking/investments/mutual-funds/income-funds.html",
    "https://www.cibc.com/en/personal-banking/investments/mutual-funds/money-market-funds.html",
]

HEADERS = {"User-Agent": "Mozilla/5.0"}

CATEGORY_MAP = {
    "growth-funds": "Equity",
    "income-funds": "Fixed Income",
    "money-market-funds": "Money Market",
}


def _get_all_funds():
    """Scrape all CIBC category pages → dict of { productCode: {name, category, detail_link} }"""
    funds = {}
    for cat_url in CATEGORY_URLS:
        try:
            res = requests.get(cat_url, headers=HEADERS, timeout=15)
            tree = etree.HTML(res.text)
            cat_slug = cat_url.rsplit("/", 1)[-1].replace(".html", "")

            for row in tree.xpath('//tr[contains(@id, "data-rds")]'):
                code = row.get("id", "").replace("data-rds-p", "")
                name_spans = row.xpath(".//td[1]//span/text()")
                name = name_spans[0].strip() if name_spans else ""
                link_els = row.xpath(".//a/@href")
                link = link_els[0] if link_els else ""
                funds[code] = {
                    "name": name,
                    "category": CATEGORY_MAP.get(cat_slug, cat_slug),
                    "detail_path": link,
                }
        except Exception:
            continue
    return funds


def _parse_rates(product_code):
    """Call productRatesLegacy API → (nav, {1yr, 3yr, 5yr})"""
    url = (
        "https://www.cibconline.cibc.com/ebm-pno/api/v1/json/productRatesLegacy"
        f"?lobId=7&sourceProductCode={product_code}"
    )
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        text = r.text
    except Exception:
        return None, {}

    nav = None
    perf = {}

    rates_match = re.search(r"rates\s*:\s*\[(.*?)\]\s*\}", text, re.DOTALL)
    if not rates_match:
        return None, {}

    for entry in re.findall(r"\[(.*?)\]", rates_match.group(1)):
        parts = [p.strip().strip("'") for p in entry.split(",")]
        if len(parts) < 5 or parts[4] != "Published":
            continue

        rate_type = parts[2]
        value = parts[3]

        # type 13 = current NAV
        if rate_type == "13" and nav is None:
            try:
                nav = float(value)
            except ValueError:
                pass

        # type 1 = trailing returns
        if rate_type == "1":
            key = parts[0]
            try:
                val = float(value)
            except ValueError:
                continue
            # -99.999... means N/A
            if val < -99:
                continue
            if key == "1_null_null_Year_T":
                perf["1yr"] = val
            elif key == "3_null_null_Years_T":
                perf["3yr"] = val
            elif key == "5_null_null_Years_T":
                perf["5yr"] = val

    return nav, perf


def _parse_detail_js(detail_path):
    """Fetch the per-fund JS data file → {risk, minimum_investment, rrsp_eligible}"""
    if not detail_path:
        return {}

    # detail_path looks like: /en/.../growth-funds/balanced-fund.html
    # JS file is at: /content/dam/personal_banking/investments/mutual-fund-data/balanced-fund.js
    slug = detail_path.rsplit("/", 1)[-1].replace(".html", "")
    js_url = f"https://www.cibc.com/content/dam/personal_banking/investments/mutual-fund-data/{slug}.js"

    try:
        r = requests.get(js_url, headers=HEADERS, timeout=10)
        if r.status_code != 200:
            return {}
        js = r.text
    except Exception:
        return {}

    result = {}

    # stats[2] = risk, stats[3] = min investment, stats[6] = RRSP eligible
    stats = re.findall(r'stats\[(\d+)\]\s*=\s*"([^"]*)"', js)
    stats_map = {int(k): v for k, v in stats}

    if 2 in stats_map:
        result["risk"] = stats_map[2]
    if 3 in stats_map:
        result["minimum_investment"] = stats_map[3].replace("$", "").replace(",", "")
    if 6 in stats_map:
        result["rrsp_eligible"] = stats_map[6].replace("†", "").strip()

    # fundCode[0] = "ATL477"
    fc_match = re.search(r'fundCode\[0\]\s*=\s*"([^"]+)"', js)
    if fc_match:
        result["fund_code"] = fc_match.group(1)

    # bar[] = compound returns from the chart on the page
    # bar[0]=1Mo, bar[1]=3Mo, bar[2]=6Mo, bar[3]=1Yr, bar[4]=2Yr,
    # bar[5]=3Yr, bar[6]=4Yr, bar[7]=5Yr, bar[8]=10Yr, bar[9]=SinceInception
    bars = re.findall(r'bar\[(\d+)\]\s*=\s*"([^"]*)"', js)
    bar_map = {int(k): v for k, v in bars}

    def _bar_float(idx):
        v = bar_map.get(idx, "")
        if not v or v == "N/A":
            return None
        try:
            return float(v)
        except ValueError:
            return None

    result["1yr"] = _bar_float(3)
    result["3yr"] = _bar_float(5)
    result["5yr"] = _bar_float(7)

    return result


def get_fund_data(product_code):
    """Get full fund data for a CIBC fund by its product code (e.g. 'ATL477' or '477')"""
    # Strip ATL prefix if present
    product_code = str(product_code).strip().upper()
    if product_code.startswith("ATL"):
        product_code = product_code[3:]
    all_funds = _get_all_funds()
    fund_info = all_funds.get(product_code)

    if not fund_info:
        return None

    nav, perf = _parse_rates(product_code)
    detail = _parse_detail_js(fund_info.get("detail_path", ""))

    return {
        "fund_code": detail.get("fund_code", str(product_code)),
        "name": fund_info["name"],
        "nav": nav,
        "mer": None,  # not available via web scraping
        "1yr": detail.get("1yr") or perf.get("1yr"),
        "3yr": detail.get("3yr") or perf.get("3yr"),
        "5yr": detail.get("5yr") or perf.get("5yr"),
        "distribution": None,  # not available via web scraping
        "risk": detail.get("risk"),
        "fund_type": fund_info["category"],
        "account_eligibility": detail.get("rrsp_eligible"),
        "minimum_investment": detail.get("minimum_investment"),
    }


def get_all_funds_data():
    """Fetch data for every CIBC mutual fund."""
    all_funds = _get_all_funds()
    results = []

    # Build one big API call with all product codes
    codes = list(all_funds.keys())
    codes_param = "%2c".join(codes)
    bulk_url = (
        "https://www.cibconline.cibc.com/ebm-pno/api/v1/json/productRatesLegacy"
        f"?lobId=7&sourceProductCode={codes_param}"
    )

    try:
        r = requests.get(bulk_url, headers=HEADERS, timeout=30)
        bulk_text = r.text
    except Exception:
        bulk_text = ""

    # Parse each fund's rates from bulk response
    fund_rates = {}
    for m in re.finditer(r"var p(\d+)\s*=\s*\{(.*?)\}\s*(?=var p\d+|$)", bulk_text, re.DOTALL):
        code = m.group(1)
        block = m.group(2)

        nav = None
        perf = {}
        for entry in re.findall(r"\[(.*?)\]", block):
            parts = [p.strip().strip("'") for p in entry.split(",")]
            if len(parts) < 5 or parts[4] != "Published":
                continue
            rate_type = parts[2]
            value = parts[3]

            if rate_type == "13" and nav is None:
                try:
                    nav = float(value)
                except ValueError:
                    pass
            if rate_type == "1":
                key = parts[0]
                try:
                    val = float(value)
                except ValueError:
                    continue
                if val < -99:
                    continue
                if key == "1_null_null_Year_T":
                    perf["1yr"] = val
                elif key == "3_null_null_Years_T":
                    perf["3yr"] = val
                elif key == "5_null_null_Years_T":
                    perf["5yr"] = val

        fund_rates[code] = (nav, perf)

    for code, info in all_funds.items():
        nav, perf = fund_rates.get(code, (None, {}))
        detail = _parse_detail_js(info.get("detail_path", ""))

        results.append({
            "name": info["name"],
            "nav": nav,
            "mer": None,
            "1yr": perf.get("1yr"),
            "3yr": perf.get("3yr"),
            "5yr": perf.get("5yr"),
            "distribution": None,
            "risk": detail.get("risk"),
            "fund_type": info["category"],
            "account_eligibility": detail.get("rrsp_eligible"),
            "minimum_investment": detail.get("minimum_investment"),
        })

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py cibc.py <FUND_CODE | --all>")
        print("  py cibc.py ATL477     - CIBC Balanced Fund")
        print("  py cibc.py --all      - All CIBC mutual funds")
        sys.exit(1)

    arg = sys.argv[1].strip()

    if arg == "--all":
        results = get_all_funds_data()
        print(json.dumps(results, indent=2))
    else:
        result = get_fund_data(arg)
        print(json.dumps(result, indent=2))
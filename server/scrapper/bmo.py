import requests
import sys
import json
import re

BMO_GRAPHQL_URL = "https://df.bmogam.com/api/graphql/mutual-funds-production"

_RISK_MAP = {
    "1": "Low",
    "2": "Low to Medium",
    "3": "Medium",
    "4": "Medium to High",
    "5": "High",
}

def _to_float(x):
    try:
        return float(x)
    except Exception:
        return None

def _normalize_code(code: str) -> str:
    if code is None:
        return ""
    return re.sub(r"\D+", "", code)

def _latest(records, date_key="effectiveDate"):
    """Return the record with the latest date from a list of dicts."""
    if not records:
        return None
    return max(records, key=lambda r: r.get(date_key, ""))

def get_bmo_fund_by_code(fund_code: str):
    code = _normalize_code(fund_code)
    if not code:
        return None

    entity_id = f"BMO{code}"

    # NOTE: omitting locale returns English text; including locale causes nulls
    query = """
    {
      salesOptions(entityId: "%ENTITY%") {
        fundservCode
        fund {
          fullName
          cifscCategory { entityId name }
          riskRating { entityId name }
        }
        series {
          eligibilityText
          minimumInitialInvestment
          minimumInitialInvestmentRRSP
          distributionFrequency { name }
          fees { mer effectiveDate }
          annualDistributionBreakdowns {
            effectiveDate
            eligibleCdnDividendPortion
            ineligibleCdnDividendPortion
            interestPortion
            capitalGainsPortion
            returnOfCapitalPortion
            foreignNonBusinessPortion
            foreignTaxPortion
            totalDistribution
          }
        }
        compoundPerformance { effectiveDate p1yr p3yr p5yr }
        prices { effectiveDate navps }
      }
    }
    """.replace("%ENTITY%", entity_id)

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json",
    }

    try:
        r = requests.post(BMO_GRAPHQL_URL, headers=headers,
                          json={"query": query}, timeout=25)
    except Exception:
        return None

    if r.status_code != 200:
        return None

    try:
        data = r.json()
    except Exception:
        return None

    options = (data.get("data") or {}).get("salesOptions") or []
    if not options:
        return None

    so = options[0]
    fund = so.get("fund") or {}
    series = so.get("series") or {}

    # --- name ---
    name = fund.get("fullName")

    # --- nav ---
    prices = so.get("prices") or []
    latest_price = _latest(prices)
    nav = _to_float(latest_price["navps"]) if latest_price else None

    # --- mer ---
    fees_list = series.get("fees") or []
    latest_fee = _latest(fees_list)
    mer_raw = _to_float(latest_fee.get("mer")) if latest_fee else None
    mer = round(mer_raw * 100, 2) if mer_raw is not None else None

    # --- performance ---
    perf_list = so.get("compoundPerformance") or []
    latest_perf = _latest(perf_list)
    def _pct(key):
        if latest_perf is None:
            return None
        v = _to_float(latest_perf.get(key))
        return round(v * 100, 2) if v is not None else None

    p1yr = _pct("p1yr")
    p3yr = _pct("p3yr")
    p5yr = _pct("p5yr")

    # --- risk ---
    rr = fund.get("riskRating") or {}
    risk = rr.get("name") or _RISK_MAP.get(str(rr.get("entityId", "")))

    # --- distribution ---
    def _zero_to_none(v):
        f = _to_float(v)
        return f if f and f != 0 else None

    dist_breakdowns = series.get("annualDistributionBreakdowns") or []
    distribution = {}
    for rec in dist_breakdowns:
        year = (rec.get("effectiveDate") or "")[:4]
        if not year:
            continue
        distribution[year] = {
            "total": _to_float(rec.get("totalDistribution")),
            "eligible_dividend": _zero_to_none(rec.get("eligibleCdnDividendPortion")),
            "non_eligible_dividend": _zero_to_none(rec.get("ineligibleCdnDividendPortion")),
            "other_income": _zero_to_none(rec.get("interestPortion")),
            "capital_gains": _zero_to_none(rec.get("capitalGainsPortion")),
            "return_of_capital": _zero_to_none(rec.get("returnOfCapitalPortion")),
            "foreign_non_business_income": _zero_to_none(rec.get("foreignNonBusinessPortion")),
            "foreign_tax": _zero_to_none(rec.get("foreignTaxPortion")),
        }
    if not distribution:
        distribution = None

    # --- fund_type ---
    cifsc = fund.get("cifscCategory") or {}
    fund_type = cifsc.get("name") or cifsc.get("entityId")

    # --- account_eligibility ---
    eligibility = series.get("eligibilityText")

    # --- minimum_investment ---
    minimum = series.get("minimumInitialInvestment") or series.get("minimumInitialInvestmentRRSP")
    if minimum is not None:
        minimum = str(int(minimum))

    return {
        "fund_code": "BMO" + code,
        "name": name,
        "nav": nav,
        "mer": mer,
        "1yr": p1yr,
        "3yr": p3yr,
        "5yr": p5yr,
        "distribution": distribution,
        "risk": risk,
        "fund_type": fund_type,
        "account_eligibility": eligibility,
        "minimum_investment": minimum,
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py bmo.py <FUND_CODE>")
        print("  py bmo.py BMO95274")
        sys.exit(1)

    result = get_bmo_fund_by_code(sys.argv[1])
    if result is None:
        print("null")
    else:
        print(json.dumps(result, indent=2))
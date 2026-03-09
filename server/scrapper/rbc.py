import requests
import re
import json
import sys


def get_fund_data(fund_code):
    url = f"https://www.rbcgam.com/en/ca/products/mutual-funds/{fund_code}/detail"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            return None

        html = response.text

        # ── JS object 1: fundData (nav, performance, distributions) ──
        m1 = re.search(r'fundData\s*=\s*(\{.*?\})\s*;', html, re.DOTALL)
        if not m1:
            return None
        fund = json.loads(m1.group(1))

        # ── JS object 2: cmsData (risk, mer, minimumInvestment, fundCategory) ──
        m2 = re.search(r'=\s*(\{[^}]*"risk"\s*:\s*"[^"]*"[^}]*\})\s*;', html)
        cms = json.loads(m2.group(1)) if m2 else {}

        # MER: stored as decimal (e.g. "0.0051" → 0.51%)
        mer_raw = cms.get("mer")
        mer = round(float(mer_raw) * 100, 2) if mer_raw else None

        trailing = fund.get("trailingReturn", {})

        # Fund type mapping
        fund_type_map = {
            "fixedincome": "Fixed Income",
            "equity": "Equity",
            "balanced": "Balanced",
            "moneymarket": "Money Market",
            "specialty": "Specialty",
        }
        raw_type = cms.get("fundCategory", "")
        fund_type = fund_type_map.get(raw_type, raw_type)

        return {
            "fund_code":           fund_code,
            "name":                fund.get("fundName", {}).get("en"),
            "nav":                 fund.get("nav"),
            "mer":                 mer,
            "1yr":                 trailing.get("1Yr"),
            "3yr":                 trailing.get("3Yr"),
            "5yr":                 trailing.get("5Yr"),
            "distribution":        fund.get("distributions"),
            "risk":                cms.get("risk"),
            "fund_type":           fund_type,
            "account_eligibility": None,   # not available on this page
            "minimum_investment":  cms.get("minimumInvestment"),
        }

    except Exception:
        return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: py rbc.py FUND_CODE")
        sys.exit(1)

    fund_code = sys.argv[1].strip().upper()
    result = get_fund_data(fund_code)
    print(json.dumps(result, indent=2))
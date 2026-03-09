"""
Fetch 10 mutual funds from each bank and write results to mutual_funds.txt
"""
import json
import time
import sys

from rbc import get_fund_data as rbc_get
from bmo import get_bmo_fund_by_code as bmo_get
from cibc import get_fund_data as cibc_get
from td import get_td_fund_by_code as td_get

RBC_CODES = [
    "RBF565", "RBF414", "RBF540", "RBF600", "RBF1035",
    "RBF627", "RBF534", "RBF186", "RBF433", "RBF1679",
]

BMO_CODES = [
    "BMO14491", "BMO14700", "BMO14703", "BMO14704", "BMO14705",
    "BMO16772", "BMO95274", "BMO95111", "BMO95116", "BMO95223",
]

CIBC_CODES = [
    "ATL103", "ATL104", "ATL105", "ATL107", "ATL109",
    "ATL477", "ATL486", "ATL489", "ATL491", "ATL494",
]

TD_CODES = [
    "TDB161", "TDB162", "TDB271", "TDB164", "TDB165",
    "TDB166", "TDB627", "TDB170", "TDB171", "TDB172",
]

BANKS = [
    ("RBC",  RBC_CODES,  rbc_get),
    ("BMO",  BMO_CODES,  bmo_get),
    ("CIBC", CIBC_CODES, cibc_get),
    ("TD",   TD_CODES,   td_get),
]

def main():
    all_results = {}
    total = sum(len(codes) for _, codes, _ in BANKS)
    done = 0

    for bank_name, codes, fetch_fn in BANKS:
        print(f"\n--- {bank_name} ---")
        for code in codes:
            done += 1
            print(f"  [{done}/{total}] Fetching {code} ...", end=" ", flush=True)
            try:
                result = fetch_fn(code)
            except Exception as e:
                result = None
                print(f"ERROR: {e}")
            if result is not None:
                all_results[code] = result
                print("OK")
            else:
                print("null")
            time.sleep(1)

    # Write to file
    output_path = "mutual_funds.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(all_results, indent=2, ensure_ascii=False))

    print(f"\nDone. {len(all_results)}/{total} funds written to {output_path}")


if __name__ == "__main__":
    main()

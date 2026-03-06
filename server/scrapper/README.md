# Mutual Fund Data Collector

A Python project that scrapes mutual fund data from Canadian banks (RBC, BMO, CIBC, TD) and uploads it to MongoDB.

## Project Structure

### Core Scraper Files
- **rbc.py** - Scrapes mutual fund data from RBC GAM website. Extracts fund information including NAV, MER, trailing returns, and distribution history.
- **bmo.py** - Scrapes mutual fund data from BMO website. Retrieves similar fund metrics as RBC.
- **cibc.py** - Scrapes mutual fund data from CIBC website using XML parsing (lxml). Handles fund details and performance data.
- **td.py** - Scrapes mutual fund data from TD website. Collects fund information with trailing returns and fund categories.

### Main Scripts
- **fetch_all.py** - Main orchestration script that fetches data from all 4 banks (10 funds per bank = 40 total). Iterates through predefined fund codes for each bank and combines results.
- **upload.py** - Uploads the collected mutual fund data from `mutual_funds.txt` to MongoDB (FinWise database, mutual-funds collection). Handles connection management and error handling.

### Data Files
- **mutual_funds.txt** - JSON file containing the scraped mutual fund data. Stores fund information keyed by fund code with nested distribution data by year.

### Configuration
- **requirements.txt** - Python package dependencies (requests, pymongo, lxml)

## Data Schema

Each mutual fund document contains:
```json
{
  "fund_code": "RBF565",
  "name": "RBC Global Dividend Growth Fund",
  "nav": 23.2989,
  "mer": 2.09,
  "1yr": 6.76,
  "3yr": 12.92,
  "5yr": 9.11,
  "distribution": {
    "2024": {
      "total": 0.12,
      "dividends": 0.0003,
      "capitalGains": 0.1,
      ...
    }
  },
  "risk": "Medium",
  "fund_type": "Equity",
  "minimum_investment": 500
}
```

## Usage

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Fetch Mutual Fund Data
```bash
python fetch_all.py
```
This will scrape all funds and save to `mutual_funds.txt`.

### 3. Upload to MongoDB
```bash
python upload.py
```
This will upload the data from `mutual_funds.txt` to your MongoDB instance.

### 4. Fetch Individual Fund Data
```bash
python rbc.py RBF565
python bmo.py BMO14491
python cibc.py ATL103
python td.py TDB161
```

## Fund Codes

- **RBC**: RBF565, RBF414, RBF540, RBF600, RBF1035, RBF627, RBF534, RBF186, RBF433, RBF1679
- **BMO**: BMO14491, BMO14700, BMO14703, BMO14704, BMO14705, BMO16772, BMO95274, BMO95111, BMO95116, BMO95223
- **CIBC**: ATL103, ATL104, ATL105, ATL107, ATL109, ATL477, ATL486, ATL489, ATL491, ATL494
- **TD**: TDB161, TDB162, TDB271, TDB164, TDB165, TDB166, TDB627, TDB170, TDB171, TDB172

## Environment Variables

Set your MongoDB URI before running `upload.py`:
```bash
set MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
```

## Error Handling

- Individual fund fetch failures are logged but don't stop the entire process
- MongoDB connection errors are caught and reported
- HTML parsing errors are handled gracefully with None returns

## Notes

- Uses web scraping with requests and regex/lxml parsing
- User-Agent header included to avoid being blocked
- 15-second timeout for each HTTP request
- Data includes historical distributions from multiple years

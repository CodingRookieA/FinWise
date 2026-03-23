import csv
import json

firstRow = True
allETFS = []

print("!!! Please confirm that you have downloaded 'ETF-overview.csv' from [https://money.tmx.com/en/etf-screener],")
print("!!! And the file is placed within 'server/etfs'")

input("(enter to continue)")

with open(f"etfs\ETF-overview.csv", newline='') as csvfile:
    etfs = csv.reader(csvfile)
    for row in etfs:
        if(firstRow):
            firstRow = False
            continue
        allETFS.append(row[0].replace('.', '-') + '.TO')

json_string = json.dumps(allETFS)

# Wite to file
with open("etfs\canadian_etfs.txt", "w") as file:
    file.write(json_string)

file.close()

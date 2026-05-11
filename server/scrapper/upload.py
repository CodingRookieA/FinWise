from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import json
import os
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
    exit(1)

# Connect to FinWise database and mutual-funds collection
db = client['FinWise']
collection = db['mutual-funds']

# Read and upload mutual_funds.txt
file_path = "mutual_funds.txt"

if not os.path.exists(file_path):
    print(f"Error: {file_path} not found!")
    exit(1)

try:
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    print(f"\nLoaded {len(data)} mutual funds from {file_path}")
    
    # Delete existing data in the collection (optional, comment out if you want to append)
    collection.delete_many({})
    print("Cleared existing data in mutual-funds collection")
    
    # Insert the data
    if isinstance(data, dict):
        # If it's a dict with fund codes as keys, insert each fund as a document
        result = collection.insert_many(data.values())
        print(f"Successfully inserted {len(result.inserted_ids)} documents into FinWise/mutual-funds")
    elif isinstance(data, list):
        # If it's already a list of documents
        result = collection.insert_many(data)
        print(f"Successfully inserted {len(result.inserted_ids)} documents into FinWise/mutual-funds")
    
except json.JSONDecodeError as e:
    print(f"Error parsing JSON: {e}")
    exit(1)
except Exception as e:
    print(f"Error uploading data: {e}")
    exit(1)
finally:
    client.close()
    print("Connection closed.")

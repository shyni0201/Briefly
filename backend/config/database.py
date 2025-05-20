import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from gridfs import GridFS
import certifi

# Load environment variables
load_dotenv()

# Retrieve MongoDB connection URI from environment variables
uri = os.getenv('DATABASE_URL')

if not uri:
    raise ValueError("Missing required environment variables. Please check your .env file.")

# Initialize MongoDB client with TLS certificate and API version
# - tlsCAFile: Required for secure connection using certifi's SSL certificate
# - server_api: Uses MongoDB API version 1 for compatibility
client = MongoClient(uri, tlsCAFile=certifi.where(), server_api=ServerApi('1'))

# Get reference to the main database
db = client.internaldb

# Define collection references for different data types
users_collection_name = db["users"]           # Collection for user data
summaries_collection_name = db["summaries"]   # Collection for summary documents
shared_summaries_collection_name = db["shared_summaries"]  # Collection for shared summary records

# Initialize GridFS for storing large files
grid_fs = GridFS(db)

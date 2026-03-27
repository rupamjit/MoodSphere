import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")
MONGO_URI = os.getenv("MONGO_URI")
PINECONE_INDEX=os.getenv("PINECONE_INDEX")

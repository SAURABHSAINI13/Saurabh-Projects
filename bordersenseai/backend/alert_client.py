import os
from dotenv import load_dotenv  # install python-dotenv if using this
import requests

load_dotenv()  # reads .env into environment
TOKEN = os.getenv("API_BEARER_TOKEN")
if not TOKEN:
    raise RuntimeError("Set API_BEARER_TOKEN in .env or environment")

# ... rest of the code from before ...

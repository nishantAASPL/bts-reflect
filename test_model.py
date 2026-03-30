import requests
import json
import sys

# Set encoding to UTF-8 to handle emojis in Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def test_model():
    url = "http://ml01.alignedautomation.com:11434/api/generate"
    payload = {
        "model": "gpt-oss",
        "prompt": "Say hello!",
        "stream": False
    }
    headers = {
        "Content-Type": "application/json"
    }

    print(f"Testing model '{payload['model']}' at {url}...")
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print("\nSuccess! Model response:")
        print("-" * 30)
        print(result.get("response", "No response text found."))
        print("-" * 30)
        
    except requests.exceptions.RequestException as e:
        print(f"\nError connecting to the API: {e}")
    except json.JSONDecodeError:
        print("\nError: Failed to decode JSON response from the server.")

if __name__ == "__main__":
    test_model()

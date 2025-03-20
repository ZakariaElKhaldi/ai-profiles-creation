import requests
import sys
import json

def test_profile_api(api_key, query_text="What is the main topic of the document?"):
    # API endpoint - adjust if needed
    base_url = "http://localhost:8000/api"
    
    # STEP 1: First verify the API key to get the profile ID
    verify_endpoint = f"{base_url}/profiles/verify-key"
    print(f"Verifying API key at: {verify_endpoint}")
    
    try:
        # Verify the API key to get the profile ID
        verify_response = requests.post(
            verify_endpoint,
            json={"api_key": api_key}
        )
        
        if verify_response.status_code != 200:
            print(f"\n❌ Error verifying API key: {verify_response.status_code}")
            print(verify_response.text)
            return False
        
        # Extract the profile ID
        profile_id = verify_response.json()["profile_id"]
        print(f"API key is valid! Associated with profile: {profile_id}")
        
        # STEP 2: Now query the profile directly with its ID
        query_endpoint = f"{base_url}/profiles/{profile_id}/query"
        print(f"Querying profile at: {query_endpoint}")
        
        # Create the query body
        body = {
            "query": query_text
            # Add context if needed
            # "context": "Additional context here"
        }
        
        # Make the profile query
        response = requests.post(
            query_endpoint,
            json=body
        )
        
        # Check if request was successful
        if response.status_code == 200:
            print("\n✅ Query successful!")
            print("\nResponse:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"\n❌ Error querying profile: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"\n❌ Error connecting to API: {str(e)}")
        return False

if __name__ == "__main__":
    api_key = "pk_QzSFMikdNCqAH2lS-fl9-dDmFz-eV2ri5nM6tZkNWks"
    
    # Allow custom query if provided as argument
    query = "What is the main topic of the document?"
    if len(sys.argv) > 1:
        query = sys.argv[1]
    
    test_profile_api(api_key, query)
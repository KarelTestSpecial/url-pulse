import os
import requests
from supabase import create_client, Client

# Haal de credentials op uit de GitHub Secrets
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def check_urls():
    """
    Haalt alle te monitoren URL's op uit de Supabase-database,
    controleert hun status en werkt de database bij als de status is gewijzigd.
    """
    print("Fetching URLs from Supabase...")

    # Controleer of de Supabase credentials aanwezig zijn
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_KEY environment variables are not set.")
        print("Please configure them as secrets in your GitHub repository settings.")
        return

    try:
        # Haal alle URLs uit de database
        response = supabase.table('monitored_urls').select("id, url, status, user_id").execute()
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return

    if not response.data:
        print("No URLs to check.")
        return

    print(f"Found {len(response.data)} URLs to check.")

    for item in response.data:
        old_status = item.get('status', 'UNKNOWN')
        new_status = 'DOWN' # Standaard aanname

        try:
            # Voer de HTTP GET request uit met een timeout
            r = requests.get(item['url'], timeout=10)

            # Controleer op een succesvolle status code (2xx)
            if r.status_code >= 200 and r.status_code < 300:
                new_status = 'UP'
        except requests.RequestException as e:
            print(f"Error checking {item['url']}: {e}")
            new_status = 'DOWN'

        print(f"URL: {item['url']}, Old Status: {old_status}, New Status: {new_status}")

        # Alleen updaten als de status is veranderd om onnodige database-schrijfacties te voorkomen
        if old_status != new_status:
            print(f"Status for {item['url']} changed to {new_status}. Updating database...")
            try:
                supabase.table('monitored_urls').update({'status': new_status}).eq('id', item['id']).execute()
                print(f"Database updated successfully for URL ID: {item['id']}.")

                # Toekomstige stap: hier kan de notificatie-logica (bv. SendGrid) worden toegevoegd.
                # if new_status == 'DOWN':
                #     send_down_notification(item['user_id'], item['url'])

            except Exception as e:
                print(f"Error updating database for URL ID {item['id']}: {e}")

if __name__ == "__main__":
    check_urls()

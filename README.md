# URL-Pulse: Een Geautomatiseerde Website Uptime Monitor

Welkom bij URL-Pulse! Dit project is een eenvoudige, maar krachtige SaaS-applicatie (Software as a Service) die de uptime van uw websites monitort. Het is volledig gebouwd met een "GitHub-centrische" aanpak, wat betekent dat de logica draait op GitHub Actions en de frontend wordt gehost op GitHub Pages.

De applicatie maakt gebruik van externe, serverless diensten voor data-opslag en authenticatie, specifiek **Supabase**.

## Hoe het Werkt

*   **Backend:** Een GitHub Action (`.github/workflows/checker.yml`) wordt elke 5 minuten automatisch uitgevoerd. Dit script (`scripts/check_urls.py`) haalt alle geregistreerde URL's uit een Supabase-database, controleert of ze online zijn, en werkt hun status bij.
*   **Frontend:** Een simpele statische website (`index.html` en `app.js`) die wordt gehost via GitHub Pages. Gebruikers kunnen hier een account aanmaken, inloggen en de URL's die ze willen monitoren beheren.
*   **Database & Authenticatie:** Supabase wordt gebruikt voor het veilig opslaan van gebruikersgegevens en de te monitoren URL's. De frontend communiceert direct met de Supabase API.

---

## Configuratie Stappen (Cruciaal!)

Om dit project werkend te krijgen, moet u de volgende stappen eenmalig doorlopen.

### Stap 1: Maak een Supabase Project aan

1.  Ga naar [supabase.com](https://supabase.com) en maak een gratis account aan.
2.  Creëer een nieuw project. Kies een naam (bv. `url-pulse`) en een sterk database-wachtwoord. Selecteer een regio die dicht bij u in de buurt is.
3.  Zodra het project is aangemaakt, ga naar de **SQL Editor** in het linker menu.
4.  Klik op **"+ New query"** en voer het volgende SQL-statement uit om de benodigde tabel aan te maken:

    ```sql
    CREATE TABLE monitored_urls (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      url TEXT NOT NULL,
      status TEXT DEFAULT 'UNKNOWN',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Schakel Row Level Security (RLS) in voor de tabel
    ALTER TABLE monitored_urls ENABLE ROW LEVEL SECURITY;

    -- Maak policies aan zodat gebruikers alleen hun eigen data kunnen zien en beheren
    CREATE POLICY "Allow users to view their own URLs" ON monitored_urls
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Allow users to insert their own URLs" ON monitored_urls
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Allow users to delete their own URLs" ON monitored_urls
      FOR DELETE USING (auth.uid() = user_id);
    ```
    Klik op **"RUN"** om de tabel en de beveiligingsregels aan te maken.

### Stap 2: Vind uw Supabase API Keys

1.  Navigeer in uw Supabase-project naar **Settings** (het tandwiel-icoon linksonder).
2.  Klik op het **API** tabblad.
3.  U heeft twee sets van sleutels nodig. Houd deze pagina open:
    *   **Project URL**: Deze staat onder "Project URL".
    *   **Project API Keys -> `anon` `public`**: Dit is de publieke sleutel voor de frontend.
    *   **Project API Keys -> `service_role` `secret`**: Dit is de geheime sleutel voor de backend (de GitHub Action). **DEEL DEZE SLEUTEL NOOIT PUBLIEK!**

### Stap 3: Configureer GitHub Secrets

1.  Ga naar uw GitHub repository en klik op het tabblad **Settings**.
2.  Navigeer naar **Secrets and variables > Actions** in het linkermenu.
3.  Klik op de knop **"New repository secret"** en maak de volgende twee secrets aan:
    *   **Naam:** `SUPABASE_URL`
        *   **Waarde:** Plak hier uw **Project URL** uit Stap 2.
    *   **Naam:** `SUPABASE_SERVICE_KEY`
        *   **Waarde:** Plak hier uw **`service_role` secret** key uit Stap 2.

### Stap 4: Configureer de Frontend (`app.js`)

1.  Open het `app.js` bestand in deze repository.
2.  Bovenaan het bestand ziet u de volgende regels:
    ```javascript
    const SUPABASE_URL = 'VUL_HIER_UW_SUPABASE_URL_IN';
    const SUPABASE_ANON_KEY = 'VUL_HIER_UW_SUPABASE_ANON_KEY_IN';
    ```
3.  Vervang `'VUL_HIER_UW_SUPABASE_URL_IN'` door uw **Project URL**.
4.  Vervang `'VUL_HIER_UW_SUPABASE_ANON_KEY_IN'` door uw **`anon` `public`** key.
5.  Sla het bestand op en commit de wijzigingen naar uw repository.

### Stap 5: Activeer GitHub Pages

1.  Ga naar uw GitHub repository en klik op het tabblad **Settings**.
2.  Navigeer naar **Pages** in het linkermenu.
3.  Onder **"Build and deployment"**, selecteer `main` (of `master`) als uw branch.
4.  Laat de map op `/root` staan en klik op **Save**.
5.  Het kan een paar minuten duren, maar uw URL-Pulse applicatie zal nu live zijn op de getoonde URL (bv. `https://<uw-gebruikersnaam>.github.io/<repository-naam>/`).

---

Gefeliciteerd! Uw URL-Pulse applicatie is nu volledig geconfigureerd en operationeel.

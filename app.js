// app.js
// ===================================================================================
// BELANGRIJKE CONFIGURATie
// Vervang de onderstaande waarden door uw EIGEN Supabase Project URL en Anon Key.
// U vindt deze in uw Supabase project dashboard onder Settings -> API.
// ===================================================================================
const SUPABASE_URL = 'https://uxezxtvmtvsdvzhsnrgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZXp4dHZtdHZzZHZ6aHNucmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzIxMTEsImV4cCI6MjA3MDk0ODExMX0.ehbCSQn6dNa_JlZIAK5pl68hJ18M0K1OziJcXy0I8iw';

// --- Vanaf hier hoeft u niets te wijzigen ---

// Initialiseer de Supabase client
// *** AANPASSING HIER ***
// We halen eerst de createClient functie uit het globale 'supabase' object.
// Daarna roepen we die functie aan om onze client instance te maken.
// Dit voorkomt de 'ReferenceError'.
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// DOM Elementen
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userEmailSpan = document.getElementById('user-email');
const urlList = document.getElementById('url-list');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const newUrlInput = document.getElementById('new-url');

// === AUTHENTICATIE FUNCTIES ===

const handleSignUp = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        alert(`Registratie mislukt: ${error.message}`);
    } else {
        alert('Registratie succesvol! Controleer uw e-mail voor de bevestigingslink.');
    }
};

const handleLogIn = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert(`Inloggen mislukt: ${error.message}`);
    } else {
        console.log('Succesvol ingelogd:', data.user);
        updateUI();
    }
};

const handleLogOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert(`Uitloggen mislukt: ${error.message}`);
    } else {
        updateUI();
    }
};


// === DATA FUNCTIES ===

const fetchUrls = async () => {
    urlList.innerHTML = '<li>Laden...</li>';
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        urlList.innerHTML = '<li>Log in om uw URLs te zien.</li>';
        return;
    }

    const { data: urls, error } = await supabaseClient
        .from('monitored_urls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fout bij ophalen URLs:', error);
        urlList.innerHTML = '<li>Kon de URLs niet laden.</li>';
        return;
    }

    renderUrls(urls);
};

const handleAddUrl = async () => {
    const url = newUrlInput.value.trim();
    if (!url) {
        alert('Voer een geldige URL in.');
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('U moet ingelogd zijn om een URL toe te voegen.');
        return;
    }

    const { data, error } = await supabaseClient
        .from('monitored_urls')
        .insert({ url: url, user_id: user.id, status: 'UNKNOWN' })
        .select();

    if (error) {
        alert(`Kon URL niet toevoegen: ${error.message}`);
    } else {
        newUrlInput.value = '';
        fetchUrls(); // Herlaad de lijst
    }
};

const handleDeleteUrl = async (urlId) => {
    if (!confirm('Weet u zeker dat u deze URL wilt verwijderen?')) {
        return;
    }

    const { error } = await supabaseClient
        .from('monitored_urls')
        .delete()
        .eq('id', urlId);

    if (error) {
        alert(`Kon URL niet verwijderen: ${error.message}`);
    } else {
        fetchUrls(); // Herlaad de lijst
    }
};


// === UI FUNCTIES ===

const renderUrls = (urls) => {
    urlList.innerHTML = ''; // Leeg de lijst
    if (urls && urls.length > 0) {
        urls.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.url}</span>
                <div>
                    <span class="status status-${(item.status || 'UNKNOWN').toLowerCase()}">${item.status || 'UNKNOWN'}</span>
                    <button class="delete-btn" onclick="handleDeleteUrl(${item.id})">Verwijder</button>
                </div>
            `;
            urlList.appendChild(li);
        });
    } else {
        urlList.innerHTML = '<li>U heeft nog geen URLs toegevoegd.</li>';
    }
};

const updateUI = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        // Ingelogde staat
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        userEmailSpan.textContent = user.email;
        fetchUrls();
    } else {
        // Uitgelogde staat
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        userEmailSpan.textContent = '';
        urlList.innerHTML = '';
    }
};

// Luister naar authenticatie-events (bv. na een redirect van de bevestigingsmail)
supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateUI();
});


// Initialiseer de UI bij het laden van de pagina
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient !== 'undefined') {
        updateUI();
    } else {
        alert("Supabase client kon niet worden geïnitialiseerd. Controleer de URL en Key in app.js.");
        console.error("Supabase is undefined. Controleer de variabelen en de script-tag in je HTML.");
    }
});

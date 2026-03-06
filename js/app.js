// --- SUPABASE INTIALIZATION ---
const supabaseUrl = 'https://pgltsyrtduvddpcdlchk.supabase.co';
const supabaseKey = 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- STATE ---
let allDestinations = [];
let allAccommodations = [];
let siteSettings = [];
let tripPlan = [];
let adminPhone = "6282215197172";

// --- DOM ELEMENTS ---
const navbar = document.getElementById('navbar');
const destGrid = document.getElementById('destinations-grid');
const accomGrid = document.getElementById('accommodations-grid');
const blogGrid = document.getElementById('blog-grid');
const destFilters = document.getElementById('dest-filters');
const accomFilters = document.getElementById('accom-filters');

const tripTrigger = document.getElementById('trip-plan-trigger');
const tripDrawer = document.getElementById('trip-drawer');
const closeDrawerBtn = document.getElementById('close-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const tripBadge = document.getElementById('trip-badge');
const tripItemsContainer = document.getElementById('trip-items-container');
const checkoutBtn = document.getElementById('checkout-whatsapp');
const flightForm = document.getElementById('flight-form');

const mobileMenu = document.getElementById('mobile-menu');
const navLinksMenu = document.getElementById('nav-links');
const heroSearchForm = document.getElementById('hero-search-form');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupEventListeners();
    loadTripPlanFromStorage();
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- DATA FETCHING ---
async function fetchData() {
    try {
        // Fetch destinations
        const { data: destData, error: destError } = await _supabase
            .from('fmidtour_destinasi')
            .select('*')
            .order('area');

        // Fetch accommodations
        const { data: accomData, error: accomError } = await _supabase
            .from('fmidtour_akomodasi')
            .select('*')
            .order('area');

        // Fetch Settings
        const { data: settingsData, error: settingsError } = await _supabase
            .from('fmidtour_settings')
            .select('*');

        // Fetch latest 3 blogs
        const { data: blogData, error: blogError } = await _supabase
            .from('fmidtour_blog')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);

        if (destError || accomError || settingsError || blogError) {
            console.error('Supabase fetch error:', destError || accomError || settingsError || blogError);
            showError(destGrid, "Gagal memuat destinasi.");
            showError(accomGrid, "Gagal memuat akomodasi.");
            return;
        }

        allDestinations = destData || [];
        allAccommodations = accomData || [];
        siteSettings = settingsData || [];

        applySettingsToDOM();
        renderGrid(allDestinations, destGrid, 'destination');
        renderGrid(allAccommodations, accomGrid, 'accommodation');
        renderBlogGrid(blogData || []);

    } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        showError(destGrid, "Gagal memuat destinasi. Pastikan koneksi internet stabil.");
        showError(accomGrid, "Gagal memuat akomodasi.");
        showError(blogGrid, "Gagal memuat artikel blog.");
    }
}

function showError(container, message) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #EF4444; padding: 2rem;">${message}</div>`;
}

// --- APPLY SETTINGS TO DOM ---
function applySettingsToDOM() {
    const getVal = (key) => {
        const setting = siteSettings.find(s => s.key === key);
        return setting ? setting.value : '';
    };

    // Update Text Logic
    const updateText = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.innerText = val;
    };
    const updateHTML = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.innerHTML = val;
    };

    // Navbar & Footer Logo
    const webName = getVal('web_name');
    updateText('dyn-navbar-logo', webName);
    updateText('dyn-footer-logo', webName);

    // Hero
    const heroImg = getVal('hero_image');
    if (heroImg) {
        const heroBgEl = document.getElementById('dyn-hero-bg');
        if (heroBgEl) heroBgEl.src = heroImg;
    }

    const badgeText = getVal('hero_badge');
    if (badgeText) {
        updateHTML('dyn-hero-badge', `<i class="fas fa-sparkles"></i> ${badgeText}`);
    }
    updateText('dyn-hero-title', getVal('hero_title'));
    updateText('dyn-hero-subtitle', getVal('hero_subtitle'));

    // Footer
    updateText('dyn-footer-desc', getVal('footer_desc'));

    const waRaw = getVal('cs_whatsapp');
    if (waRaw) {
        updateText('dyn-footer-wa', waRaw);
        // Format for URL (remove 0 at start, add 62)
        let formatted = waRaw.replace(/\D/g, '');
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        }
        adminPhone = formatted;
    }

    updateText('dyn-footer-address', getVal('address'));

    const mapsEmbed = getVal('maps_embed');
    if (mapsEmbed) {
        updateHTML('dyn-footer-maps', mapsEmbed);
    }
}

// --- RENDERING ---
function formatRupiah(number) {
    if (number === 0) return "Gratis / Hubungi Admin";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

function renderGrid(data, container, type) {
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #6B7280;">Tidak ada data ditemukan untuk area ini.</div>`;
        return;
    }

    data.forEach(item => {
        const typeBadge = type === 'accommodation' ? `<div class="card-badge"><i class="fas fa-bed"></i> ${item.type}</div>` : '';
        const isAdded = tripPlan.some(t => t.id === item.id);
        const btnText = isAdded ? "Hapus dari Trip Plan" : "Tambah ke Trip Plan";
        const btnClass = isAdded ? "btn-add-trip active" : "btn-add-trip";
        const btnStyle = isAdded ? "background: var(--color-primary); color: white;" : "";

        const cardHTML = `
            <div class="travel-card fade-in">
                <div class="card-img-wrapper">
                    ${typeBadge}
                    <div class="card-badge" style="${type === 'accommodation' ? 'right: 1rem; left: auto;' : 'left: 1rem;'}; background: rgba(0,0,0,0.6); border: none;"><i class="fas fa-map-marker-alt"></i> ${item.area}</div>
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/400x300?text=Gambar+Tidak+Tersedia'">
                </div>
                <div class="card-body">
                    <h3>${item.name}</h3>
                    <div class="card-price">${formatRupiah(item.price)}</div>
                    <button class="${btnClass}" style="${btnStyle}" onclick="toggleTripItem('${item.id}', '${type}')" id="btn-${item.id}">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function renderBlogGrid(data) {
    if (!blogGrid) return;
    blogGrid.innerHTML = '';

    if (data.length === 0) {
        blogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #6B7280;">Belum ada artikel yang diterbitkan.</div>`;
        return;
    }

    data.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const cardHTML = `
            <div class="travel-card fade-in">
                <div class="card-img-wrapper">
                    <div class="card-badge" style="background: var(--color-primary);">${item.category}</div>
                    <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Blog+Image'">
                </div>
                <div class="card-body">
                    <small style="color: var(--color-primary); font-weight: 500;">${date}</small>
                    <h3 style="margin-top: 0.5rem; line-height: 1.3;">${item.title}</h3>
                    <p style="font-size: 0.9rem; color: #6B7280; margin: 0.5rem 0 1.5rem;">${item.excerpt}</p>
                    <a href="blog-detail.html?slug=${item.slug}" class="btn-text">Baca Selengkapnya <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `;
        blogGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --- FILTERING ---
function setupFilters(filterContainer, data, gridContainer, type) {
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');

            const filterArea = e.target.getAttribute('data-filter');
            if (filterArea === 'all') {
                renderGrid(data, gridContainer, type);
            } else {
                const filtered = data.filter(item => item.area === filterArea);
                renderGrid(filtered, gridContainer, type);
            }
        });
    });
}

// Delay filter setup until data is loaded
destFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        setupFilterAction(e, allDestinations, destGrid, 'destination', destFilters);
    }
});
accomFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        setupFilterAction(e, allAccommodations, accomGrid, 'accommodation', accomFilters);
    }
});

function setupFilterAction(e, data, gridContainer, type, filterContainer) {
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');

    const filterArea = e.target.getAttribute('data-filter');
    if (filterArea === 'all') {
        renderGrid(data, gridContainer, type);
    } else {
        const filtered = data.filter(item => item.area === filterArea);
        renderGrid(filtered, gridContainer, type);
    }
}


// --- TRIP PLAN LOGIC ---
function toggleTripItem(id, type) {
    const isAdded = tripPlan.some(t => t.id === id);

    if (isAdded) {
        // Remove
        tripPlan = tripPlan.filter(t => t.id !== id);
    } else {
        // Add
        let itemToAdd;
        if (type === 'destination') {
            itemToAdd = allDestinations.find(d => d.id === id);
            itemToAdd.itemType = 'Permintaan Tamasya Destinasi';
        } else {
            itemToAdd = allAccommodations.find(a => a.id === id);
            itemToAdd.itemType = `Permintaan Booking ${itemToAdd.type}`;
        }
        if (itemToAdd) {
            tripPlan.push({ ...itemToAdd });
            animateCartTrigger();
        }
    }

    updateTripUI();
    saveTripPlanToStorage();

    // Update button in grid if visible
    const btn = document.getElementById(`btn-${id}`);
    if (btn) {
        if (!isAdded) {
            btn.classList.add('active');
            btn.style.background = 'var(--color-primary)';
            btn.style.color = 'white';
            btn.innerText = 'Hapus dari Trip Plan';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--color-primary)';
            btn.innerText = 'Tambah ke Trip Plan';
        }
    }
}

function updateTripUI() {
    // Update Badge
    tripBadge.innerText = tripPlan.length;

    // Animate Badge
    tripBadge.style.transform = 'scale(1.5)';
    setTimeout(() => { tripBadge.style.transform = 'scale(1)'; }, 200);

    // Update Drawer
    if (tripPlan.length === 0) {
        tripItemsContainer.innerHTML = '<div class="empty-state">Belum ada destinasi atau akomodasi yang dipilih. Mari mulai eksplorasi!</div>';
        checkoutBtn.style.display = 'none';
        return;
    }

    checkoutBtn.style.display = 'block';
    tripItemsContainer.innerHTML = '';

    tripPlan.forEach(item => {
        const icon = item.itemType.includes('Tamasya') ? 'fa-map-marked-alt' : 'fa-bed';
        const html = `
            <div class="trip-item">
                <img src="${item.image}" alt="${item.name}" class="trip-item-img" onerror="this.src='https://via.placeholder.com/70'">
                <div class="trip-item-details">
                    <div class="trip-item-title">${item.name}</div>
                    <div class="trip-item-area"><i class="fas ${icon}"></i> ${item.area}</div>
                    <div class="trip-item-price">${formatRupiah(item.price)}</div>
                </div>
                <button class="remove-item" onclick="toggleTripItem('${item.id}', '${item.itemType.includes('Tamasya') ? 'destination' : 'accommodation'}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        tripItemsContainer.insertAdjacentHTML('beforeend', html);
    });
}

function animateCartTrigger() {
    tripTrigger.style.transform = 'scale(1.2) translateY(-10px)';
    setTimeout(() => {
        tripTrigger.style.transform = 'scale(1) translateY(0)';
    }, 300);
}

function saveTripPlanToStorage() {
    localStorage.setItem('fm_tour_trip_plan', JSON.stringify(tripPlan));
}

function loadTripPlanFromStorage() {
    const saved = localStorage.getItem('fm_tour_trip_plan');
    if (saved) {
        tripPlan = JSON.parse(saved);
        updateTripUI();
    }
}

// --- DRAWER INTERACTION ---
function setupEventListeners() {
    tripTrigger.addEventListener('click', openDrawer);
    closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    checkoutBtn.addEventListener('click', processCheckout);
    flightForm.addEventListener('submit', processFlightBooking);

    // Mobile Menu
    if (mobileMenu && navLinksMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinksMenu.classList.toggle('active');
        });
        navLinksMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navLinksMenu.classList.remove('active');
            }
        });
    }

    // Hero Search Form Interaction
    if (heroSearchForm) {
        heroSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Get the selected destination area
            const searchDest = document.getElementById('search-dest').value;

            // Find the matching filter button and click it programmatically
            const filterBtn = Array.from(destFilters.querySelectorAll('.filter-btn')).find(b => b.getAttribute('data-filter') === searchDest);
            if (filterBtn) {
                filterBtn.click();
            }

            // Scroll down to the destinations section
            document.getElementById('destinations').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

function openDrawer() {
    tripDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
    setTimeout(() => { drawerOverlay.style.display = 'block'; }, 10);
}

function closeDrawer() {
    tripDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    setTimeout(() => { drawerOverlay.style.display = 'none'; }, 300);
}

// --- WHATSAPP INTEGRATIONS ---
function processCheckout() {
    if (tripPlan.length === 0) return;

    const destinasi = tripPlan.filter(t => t.itemType.includes('Tamasya')).map(t => `- ${t.name} (${t.area})`).join('%0A');
    const akomodasi = tripPlan.filter(t => !t.itemType.includes('Tamasya')).map(t => `- ${t.name} (${t.area})`).join('%0A');

    let message = `Halo Admin FM-ID Tour,%0A%0ASaya ingin merencanakan perjalanan dengan detail trip plan berikut:%0A%0A`;

    if (destinasi.length > 0) {
        message += `*Destinasi Wisata:*%0A${destinasi}%0A%0A`;
    }

    if (akomodasi.length > 0) {
        message += `*Penginapan (Hotel/Villa):*%0A${akomodasi}%0A%0A`;
    }

    message += `Tolong berikan informasi detail rincian paket dan ketersediaannya. Terima kasih!`;

    const whatsappURL = `https://wa.me/${adminPhone}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

function processFlightBooking(e) {
    e.preventDefault();

    const origin = document.getElementById('flight-origin').value;
    const dest = document.getElementById('flight-dest').value;
    const date = document.getElementById('flight-date').value;
    const pax = document.getElementById('flight-pax').value;

    const message = `Halo Admin FM-ID Tour,%0A%0ASaya ingin memesan tiket pesawat dengan detail berikut:%0A%0A*Kota Asal:* ${origin}%0A*Kota Tujuan:* ${dest}%0A*Tanggal Berangkat:* ${date}%0A*Jumlah Penumpang:* ${pax} Orang%0A%0ATolong bantu carikan jadwal penerbangan terbaik dan estimasi harganya. Terima kasih!`;

    const whatsappURL = `https://wa.me/${adminPhone}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

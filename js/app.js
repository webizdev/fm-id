// --- SUPABASE INTIALIZATION ---
const supabaseUrl = 'https://pgltsyrtduvddpcdlchk.supabase.co';
const supabaseKey = 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- STATE ---
let allDestinations = [];
let allAccommodations = [];
let allAreas = [];
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
    // 1. Initial Data Fetch (Ensures data loads even if langChanged event is missed)
    fetchData();

    // 2. Language Change Support
    window.addEventListener('langChanged', () => {
        fetchData(); // Re-fetch or re-render
        updateTripUI(); // Update drawer text
    });

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

        // Fetch latest 6 blogs (to check if > 5)
        const { data: blogData, error: blogError } = await _supabase
            .from('fmidtour_blog')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6);

        // Fetch areas
        const { data: areasData, error: areasError } = await _supabase
            .from('fmidtour_areas')
            .select('*')
            .order('name');

        if (destError || accomError || settingsError || blogError || areasError) {
            console.error('Supabase fetch error:', destError || accomError || settingsError || blogError || areasError);
            showError(destGrid, "Gagal memuat destinasi.");
            showError(accomGrid, "Gagal memuat akomodasi.");
            return;
        }

        const initialLimit = window.innerWidth < 768 ? 2 : 5;

        allDestinations = destData || [];
        allAccommodations = accomData || [];
        allAreas = areasData || [];
        siteSettings = settingsData || [];

        applySettingsToDOM();
        populateAreasUI();
        renderGrid(allDestinations, destGrid, 'destination', initialLimit);
        renderGrid(allAccommodations, accomGrid, 'accommodation', initialLimit);
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
    const lang = localStorage.getItem('fm_lang') || 'id';

    const getVal = (key) => {
        const setting = siteSettings.find(s => s.key === key);
        return setting ? setting.value : '';
    };

    const getTranslatedVal = (baseKey) => {
        if (lang === 'en') {
            const enVal = getVal(baseKey + '_en');
            if (enVal) return enVal;
        } else if (lang === 'ar') {
            const arVal = getVal(baseKey + '_ar');
            if (arVal) return arVal;
        }
        return getVal(baseKey);
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

    const badgeText = getTranslatedVal('hero_badge');
    if (badgeText) {
        updateHTML('dyn-hero-badge', `<i class="fas fa-sparkles"></i> ${badgeText}`);
    }
    updateText('dyn-hero-title', getTranslatedVal('hero_title'));
    updateText('dyn-hero-subtitle', getTranslatedVal('hero_subtitle'));

    // Footer
    updateText('dyn-footer-desc', getTranslatedVal('footer_desc'));

    const waRaw = getVal('cs_whatsapp');
    if (waRaw) {
        updateText('dyn-footer-wa', waRaw);
        // Format for URL (remove 0 at start, add 62)
        let formatted = waRaw.replace(/\D/g, '');
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        }
        adminPhone = formatted;

        // Update Nav Contact Button
        const navContact = document.getElementById('dyn-nav-contact');
        if (navContact) {
            const encodedMsg = encodeURIComponent("Halo admin, saya mau bertanya tentang tour & travel ke..");
            navContact.href = `https://wa.me/${adminPhone}?text=${encodedMsg}`;
            navContact.target = "_blank";
        }
    }

    const emailRaw = getVal('cs_email');
    if (emailRaw) {
        updateText('dyn-footer-email', emailRaw);
    }

    const igRaw = getVal('social_instagram');
    const igIcon = document.getElementById('dyn-footer-ig');
    if (igIcon && igRaw) {
        igIcon.href = igRaw;
    }

    const tiktokRaw = getVal('social_tiktok');
    const tiktokIcon = document.getElementById('dyn-footer-tiktok');
    if (tiktokIcon && tiktokRaw) {
        tiktokIcon.href = tiktokRaw;
    }

    const snapchatRaw = getVal('social_snapchat');
    const snapIcon = document.getElementById('dyn-footer-snapchat');
    if (snapIcon && snapchatRaw) {
        snapIcon.href = snapchatRaw;
    }

    updateText('dyn-footer-address', getVal('address'));

    const mapsEmbed = getVal('maps_embed');
    if (mapsEmbed) {
        updateHTML('dyn-footer-maps', mapsEmbed);
    }
}

function populateAreasUI() {
    // 1. Hero Search Dropdown
    const searchDest = document.getElementById('search-dest');
    const areaSuggestions = document.getElementById('area-suggestions');

    // Define custom ordering
    const orderMap = {
        'Puncak': 1,
        'Bandung': 2,
        'Bali': 3,
        'Jakarta': 4
    };

    // Sort allAreas based on custom order map, falling back to name for others
    const sortedAreas = [...allAreas].sort((a, b) => {
        const orderA = orderMap[a.name] || 999;
        const orderB = orderMap[b.name] || 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
    });

    if (areaSuggestions) {
        areaSuggestions.innerHTML = '';
        sortedAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.name;
            areaSuggestions.appendChild(option);
        });
    }

    // 2. Filter Buttons
    const renderFilters = (container) => {
        if (!container) return;
        // Keep the "Semua" button
        const allBtn = container.querySelector('[data-filter="all"]');
        container.innerHTML = '';
        if (allBtn) container.appendChild(allBtn);

        sortedAreas.forEach(area => {
            const lang = localStorage.getItem('fm_lang') || 'id';
            const areaNameTranslated = lang === 'en' ? (area.name_en || area.name) : (lang === 'ar' ? (area.name_ar || area.name) : area.name);

            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-filter', area.name);
            btn.innerText = areaNameTranslated;
            container.appendChild(btn);
        });
    };

    renderFilters(destFilters);
    renderFilters(accomFilters);
}

// --- RENDERING ---

function renderGrid(data, container, type, limit = null) {
    container.innerHTML = '';
    const lang = localStorage.getItem('fm_lang') || 'id';

    if (data.length === 0) {
        const noDataText = translations[lang] ? translations[lang].no_data_area : "Tidak ada data ditemukan untuk area ini.";
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #6B7280;">${noDataText}</div>`;
        return;
    }

    const displayData = limit ? data.slice(0, limit) : data;

    displayData.forEach(item => {
        const isAdded = tripPlan.some(t => t.id === item.id);
        const name = lang === 'en' ? (item.name_en || item.name) : (lang === 'ar' ? (item.name_ar || item.name) : item.name);

        let rawType = item.type;
        let typeKey = 'type_' + rawType.toLowerCase().replace(/\s+/g, '_');
        let fallbackType = translations[lang] && translations[lang][typeKey] ? translations[lang][typeKey] : rawType;
        const itemTypeTranslated = lang === 'en' ? (item.type_en || fallbackType) : (lang === 'ar' ? (item.type_ar || fallbackType) : rawType);

        // Find area name translation
        const areaData = allAreas.find(a => a.name === item.area);
        const areaTranslated = areaData ? (lang === 'en' ? (areaData.name_en || areaData.name) : (lang === 'ar' ? (areaData.name_ar || areaData.name) : areaData.name)) : item.area;

        const btnText = translations[lang] ? (isAdded ? translations[lang].btn_remove_trip : translations[lang].btn_add_trip) : (isAdded ? "Hapus" : "Tambah");
        const btnClass = isAdded ? "btn-add-trip active" : "btn-add-trip";
        const btnStyle = isAdded ? "background: var(--color-primary); color: white;" : "";

        const typeBadge = type === 'accommodation' ? `<div class="card-badge" style="z-index: 2;"><i class="fas fa-bed"></i> ${itemTypeTranslated}</div>` : '';

        const cardHTML = `
            <div class="travel-card fade-in">
                <div class="card-img-wrapper">
                    ${typeBadge}
                    <div class="card-badge" style="${type === 'accommodation' ? 'right: 1rem; left: auto;' : 'left: 1rem;'}; background: rgba(0,0,0,0.6); border: none; z-index: 2;"><i class="fas fa-map-marker-alt"></i> ${areaTranslated}</div>
                    <img src="${item.image}" alt="${name}" onerror="this.src='https://via.placeholder.com/400x300?text=Gambar+Tidak+Tersedia'">
                </div>
                <div class="card-body">
                    <h3>${name}</h3>
                    <button class="${btnClass}" style="${btnStyle}" onclick="toggleTripItem('${item.id}', '${type}')" id="btn-${item.id}">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Add "Lihat Selengkapnya" button if data > limit
    if (limit && data.length > limit) {
        const btnSeeMore = translations[lang] ? translations[lang].btn_see_more : "Lihat Selengkapnya";
        const btnId = `see-more-${type}-${Math.random().toString(36).substr(2, 9)}`;
        const btnWrapper = `
            <div style="grid-column: 1/-1; text-align: center; margin-top: 3rem;">
                <button id="${btnId}" class="btn-primary" style="display: inline-block; padding: 1rem 2rem; border-radius: 50px; background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); cursor: pointer; font-weight: 600;">${btnSeeMore} <i class="fas fa-chevron-down"></i></button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', btnWrapper);

        document.getElementById(btnId).addEventListener('click', () => {
            renderGrid(data, container, type, null); // Render all
        });
    }
}

function renderBlogGrid(data) {
    if (!blogGrid) return;
    blogGrid.innerHTML = '';
    const lang = localStorage.getItem('fm_lang') || 'id';

    if (data.length === 0) {
        const noArticlesText = translations[lang] ? translations[lang].no_articles : "Belum ada artikel yang diterbitkan.";
        blogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #6B7280;">${noArticlesText}</div>`;
        return;
    }

    // Show only first 5
    const displayData = data.slice(0, 5);

    displayData.forEach(item => {
        const title = lang === 'en' ? (item.title_en || item.title) : (lang === 'ar' ? (item.title_ar || item.title) : item.title);
        const excerpt = lang === 'en' ? (item.excerpt_en || item.excerpt) : (lang === 'ar' ? (item.excerpt_ar || item.excerpt) : item.excerpt);

        let rawCat = item.category || '';
        let catKey = 'cat_' + rawCat.toLowerCase().replace(/\s+/g, '_');
        let fallbackCat = translations[lang] && translations[lang][catKey] ? translations[lang][catKey] : rawCat;
        const category = lang === 'en' ? (item.category_en || fallbackCat) : (lang === 'ar' ? (item.category_ar || fallbackCat) : fallbackCat);

        const btnReadMore = translations[lang] ? translations[lang].btn_read_more : "Baca Selengkapnya";

        let locale = 'id-ID';
        if (lang === 'en') locale = 'en-US';
        if (lang === 'ar') locale = 'ar-SA';
        const date = new Date(item.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

        const cardHTML = `
            <div class="travel-card fade-in">
                <div class="card-img-wrapper">
                    <div class="card-badge" style="background: var(--color-primary);">${category}</div>
                    <img src="${item.image}" alt="${title}" onerror="this.src='https://via.placeholder.com/400x300?text=Blog+Image'">
                </div>
                <div class="card-body">
                    <small style="color: var(--color-primary); font-weight: 500;">${date}</small>
                    <h3 style="margin-top: 0.5rem; line-height: 1.3;">${title}</h3>
                    <p style="font-size: 0.9rem; color: #6B7280; margin: 0.5rem 0 1.5rem;">${excerpt}</p>
                    <a href="blog-detail.html?slug=${item.slug}" class="btn-text">${btnReadMore} <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `;
        blogGrid.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Add "Lihat Semua Artikel" button if data > 5
    if (data.length > 5) {
        const btnSeeAll = translations[lang] ? translations[lang].btn_see_more : "Lihat Semua Artikel";
        const btnWrapper = `
            <div style="grid-column: 1/-1; text-align: center; margin-top: 3rem;">
                <a href="blog.html" class="btn-primary" style="display: inline-block; padding: 1rem 2rem; border-radius: 50px; text-decoration: none;">${btnSeeAll} <i class="fas fa-chevron-right"></i></a>
            </div>
        `;
        blogGrid.insertAdjacentHTML('beforeend', btnWrapper);
    }
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
    const initialLimit = window.innerWidth < 768 ? 2 : 5;
    if (filterArea === 'all') {
        renderGrid(data, gridContainer, type, initialLimit);
    } else {
        const filtered = data.filter(item => item.area === filterArea);
        renderGrid(filtered, gridContainer, type, initialLimit);
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
        const lang = localStorage.getItem('fm_lang') || 'id';
        const btnAdd = translations[lang] ? translations[lang].btn_add_trip : "Tambah ke Trip Plan";
        const btnRemove = translations[lang] ? translations[lang].btn_remove_trip : "Hapus dari Trip Plan";

        if (!isAdded) {
            btn.classList.add('active');
            btn.style.background = 'var(--color-primary)';
            btn.style.color = 'white';
            btn.innerText = btnRemove;
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--color-primary)';
            btn.innerText = btnAdd;
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
    const lang = localStorage.getItem('fm_lang') || 'id';
    tripItemsContainer.innerHTML = '';

    if (tripPlan.length === 0) {
        const emptyMsg = translations[lang] ? translations[lang].trip_plan_empty : "Belum ada rencana trip.";
        tripItemsContainer.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
        checkoutBtn.style.display = 'none';
        return;
    }

    checkoutBtn.style.display = 'block';
    const checkoutText = translations[lang] ? translations[lang].btn_send_whatsapp : "Kirim Rencana ke WhatsApp";
    checkoutBtn.innerHTML = `${checkoutText} <i class="fab fa-whatsapp"></i>`;

    tripPlan.forEach(item => {
        const name = lang === 'en' ? (item.name_en || item.name) : (lang === 'ar' ? (item.name_ar || item.name) : item.name);
        const areaData = allAreas.find(a => a.name === item.area);
        const areaNameTranslated = areaData ? (lang === 'en' ? (areaData.name_en || areaData.name) : (lang === 'ar' ? (areaData.name_ar || areaData.name) : areaData.name)) : item.area;
        const icon = item.itemType.includes('Tamasya') ? 'fa-map-marked-alt' : 'fa-bed';

        const html = `
            <div class="trip-item">
                <img src="${item.image}" alt="${name}" class="trip-item-img" onerror="this.src='https://via.placeholder.com/70'">
                <div class="trip-item-details">
                    <div class="trip-item-title">${name}</div>
                    <div class="trip-item-area"><i class="fas ${icon}"></i> ${areaNameTranslated}</div>
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

    const lang = localStorage.getItem('fm_lang') || 'id';

    const destinasi = tripPlan.filter(t => t.itemType.includes('Tamasya')).map(t => {
        const name = lang === 'en' ? (t.name_en || t.name) : (lang === 'ar' ? (t.name_ar || t.name) : t.name);
        const areaData = allAreas.find(a => a.name === t.area);
        const area = areaData ? (lang === 'en' ? (areaData.name_en || areaData.name) : (lang === 'ar' ? (areaData.name_ar || areaData.name) : areaData.name)) : t.area;
        return `- ${name} (${area})`;
    }).join('%0A');

    const akomodasi = tripPlan.filter(t => !t.itemType.includes('Tamasya')).map(t => {
        const name = lang === 'en' ? (t.name_en || t.name) : (lang === 'ar' ? (t.name_ar || t.name) : t.name);
        const areaData = allAreas.find(a => a.name === t.area);
        const area = areaData ? (lang === 'en' ? (areaData.name_en || areaData.name) : (lang === 'ar' ? (areaData.name_ar || areaData.name) : areaData.name)) : t.area;
        return `- ${name} (${area})`;
    }).join('%0A');

    let intro = "Halo Admin FM-ID Tour,%0A%0ASaya ingin merencanakan perjalanan dengan detail trip plan berikut:";
    let labelDest = "*Destinasi Wisata:*";
    let labelAcc = "*Penginapan (Hotel/Villa):*";
    let outro = "Tolong berikan informasi detail rincian paket dan ketersediaannya. Terima kasih!";

    if (lang === 'en') {
        intro = "Hello FM-ID Tour Admin,%0A%0AI would like to plan a trip with the following trip plan details:";
        labelDest = "*Sightseeing Destinations:*";
        labelAcc = "*Accommodations (Hotel/Villa):*";
        outro = "Please provide detailed package information and availability. Thank you!";
    } else if (lang === 'ar') {
        intro = "مرحباً مسؤول FM-ID جولات وسفر،%0A%0Aأود التخطيط لرحلة بتفاصيل خطة الرحلة التالية:";
        labelDest = "*الوجهات السياحية:*";
        labelAcc = "*السكن (فندق/فيلا):*";
        outro = "يرجى تقديم معلومات مفصلة عن الباقة ومدى توفرها. شكراً لك!";
    }

    let message = `${intro}%0A%0A`;

    if (destinasi.length > 0) {
        message += `${labelDest}%0A${destinasi}%0A%0A`;
    }

    if (akomodasi.length > 0) {
        message += `${labelAcc}%0A${akomodasi}%0A%0A`;
    }

    message += outro;

    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
}

function processFlightBooking(e) {
    e.preventDefault();

    const origin = document.getElementById('flight-origin').value;
    const dest = document.getElementById('flight-dest').value;
    const date = document.getElementById('flight-date').value;
    const pax = document.getElementById('flight-pax').value;

    const lang = localStorage.getItem('fm_lang') || 'id';

    let intro = "Halo Admin FM-ID Tour,%0A%0ASaya ingin memesan tiket pesawat dengan detail berikut:";
    let lblOrigin = "*Kota Asal:*";
    let lblDest = "*Kota Tujuan:*";
    let lblDate = "*Tanggal Berangkat:*";
    let lblPax = "*Jumlah Penumpang:*";
    let paxUnit = "Orang";
    let outro = "Tolong bantu carikan jadwal penerbangan terbaik dan estimasi harganya. Terima kasih!";

    if (lang === 'en') {
        intro = "Hello FM-ID Tour Admin,%0A%0AI would like to book flight tickets with the following details:";
        lblOrigin = "*Origin City:*";
        lblDest = "*Destination City:*";
        lblDate = "*Departure Date:*";
        lblPax = "*Number of Passengers:*";
        paxUnit = "Person(s)";
        outro = "Please help me find the best flight schedule and price estimate. Thank you!";
    } else if (lang === 'ar') {
        intro = "مرحباً مسؤول FM-ID جولات وسفر،%0A%0Aأود حجز تذاكر طيران بالتفاصيل التالية:";
        lblOrigin = "*مدينة المغادرة:*";
        lblDest = "*مدينة الوصول:*";
        lblDate = "*تاريخ المغادرة:*";
        lblPax = "*عدد الركاب:*";
        paxUnit = "أشخاص";
        outro = "يرجى مساعدتي في العثور على أفضل جدول طيران وتقدير التكلفة. شكراً لك!";
    }

    const message = `${intro}%0A%0A${lblOrigin} ${origin}%0A${lblDest} ${dest}%0A${lblDate} ${date}%0A${lblPax} ${pax} ${paxUnit}%0A%0A${outro}`;

    const whatsappURL = `https://wa.me/${adminPhone}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

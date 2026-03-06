// --- SUPABASE INTIALIZATION ---
const supabaseUrl = 'https://pgltsyrtduvddpcdlchk.supabase.co';
const supabaseKey = 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi';
let _supabase;

try {
    _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase initialized successfully.");
} catch (e) {
    console.error("Supabase failed to initialize:", e);
    alert("Koneksi ke database gagal. Silakan periksa koneksi internet Anda.");
}

// --- GLOBAL FUNCTIONS (Defined at top to prevent unresponsiveness) ---

window.openEditModal = function (id, targetGroup = null) {
    console.log('--- START openEditModal ---');
    console.log('ID:', id, 'Target Group:', targetGroup);

    try {
        const modal = document.getElementById('form-modal');
        if (!modal) throw new Error("Element #form-modal tidak ditemukan di DOM!");

        let group = targetGroup || activeView;
        console.log('Final Group:', group);

        // Ensure data exists
        let item = null;
        if (currentData[group]) {
            item = currentData[group].find(x => String(x.id) === String(id));
        }

        // Fallback: search in all groups
        if (!item) {
            console.log('Item not found in current group, searching others...');
            for (const g of ['destinations', 'accommodations', 'blog']) {
                if (currentData[g]) {
                    item = currentData[g].find(x => String(x.id) === String(id));
                    if (item) {
                        group = g;
                        console.log('Found item in group:', g);
                        break;
                    }
                }
            }
        }

        if (!item) {
            console.error('Item not found in any group:', id);
            alert('Data tidak ditemukan (ID: ' + id + '). Silakan coba segarkan halaman.');
            return;
        }

        console.log('Item Found:', item);

        // UI Updates - Direct Lookups for Safety
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.innerText = group === 'blog' ? 'Edit Artikel Blog' : (group === 'destinations' ? 'Edit Destinasi' : 'Edit Akomodasi');
        }

        document.getElementById('entry-id').value = item.id || '';
        document.getElementById('entry-group').value = group || '';

        const nameInput = document.getElementById('entry-name');
        const areaInput = document.getElementById('entry-area');
        const priceInput = document.getElementById('entry-price');
        const imageInput = document.getElementById('entry-image');
        const typeInput = document.getElementById('entry-type');
        const categoryInput = document.getElementById('entry-category');
        const excerptInput = document.getElementById('entry-excerpt');
        const contentInput = document.getElementById('entry-content');

        if (nameInput) nameInput.value = item.name || item.title || '';
        if (areaInput) areaInput.value = item.area || 'Jakarta';
        if (priceInput) priceInput.value = item.price !== undefined ? item.price : '0';
        if (imageInput) imageInput.value = item.image || '';
        if (typeInput) typeInput.value = item.type || 'Hotel';

        if (group === 'blog' && categoryInput) {
            categoryInput.value = item.category || 'Tips Travel';
            if (excerptInput) excerptInput.value = item.excerpt || '';
            if (contentInput) contentInput.value = item.content || '';
        }

        const groupType = document.getElementById('group-type');
        const groupBlog = document.getElementById('group-blog-fields');
        const pField = document.getElementById('entry-price') ? document.getElementById('entry-price').closest('.form-group') : null;
        const aField = document.getElementById('entry-area') ? document.getElementById('entry-area').closest('.form-group') : null;

        if (groupType) groupType.style.display = group === 'accommodations' ? 'block' : 'none';
        if (groupBlog) groupBlog.style.display = group === 'blog' ? 'block' : 'none';
        if (pField) pField.style.display = group === 'blog' ? 'none' : 'block';
        if (aField) aField.style.display = group === 'blog' ? 'none' : 'block';

        const nameLabel = document.querySelector('label[for="entry-name"]');
        if (nameLabel) nameLabel.innerText = group === 'blog' ? 'Judul Artikel' : 'Nama Tempat';

        document.getElementById('entry-image-upload').value = '';

        console.log('Showing Modal...');
        modal.style.display = 'block';
        console.log('--- END openEditModal (Success) ---');

    } catch (error) {
        console.error('Error in openEditModal:', error);
        alert('Gagal membuka modal edit: ' + error.message);
    }
};

window.deleteItem = async function (id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        let table = '';
        if (activeView === 'destinations') table = 'fmidtour_destinasi';
        else if (activeView === 'accommodations') table = 'fmidtour_akomodasi';
        else table = 'fmidtour_blog';
        try {
            const { error } = await _supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            await fetchData();
        } catch (err) {
            console.error('Delete Error:', err);
            alert('Terjadi kesalahan saat menghapus data.');
        }
    }
};

console.log("Admin Dashboard Script Loaded.");

// STATE & DATA
let currentData = { destinations: [], accommodations: [], settings: [], blog: [], areas: [] };
let activeView = 'destinations'; // 'destinations', 'accommodations', 'pengaturan', 'hero', 'footer', 'blog', 'areas'

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const pinInput = document.getElementById('admin-pin');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const navItems = document.querySelectorAll('.nav-menu li');
const pageTitle = document.getElementById('page-title');
const tableBody = document.getElementById('table-body');
const loadingIndicator = document.getElementById('loading-indicator');
const tableContainer = document.getElementById('table-container');

// Setting Containers
const pengaturanContainer = document.getElementById('pengaturan-container');
const heroContainer = document.getElementById('hero-container');
const footerContainer = document.getElementById('footer-container');
const blogContainer = document.getElementById('blog-container');
const blogTableBody = document.getElementById('blog-table-body');
const areasContainer = document.getElementById('areas-container');
const areasTableBody = document.getElementById('areas-table-body');

// Modal Elements
const modal = document.getElementById('form-modal');
const btnAddNew = document.getElementById('btn-add-new');
const closeBtn = document.querySelector('.close-modal');
const dataForm = document.getElementById('data-form');
const groupTypeField = document.getElementById('group-type');
const groupBlogFields = document.getElementById('group-blog-fields');
const priceField = document.getElementById('entry-price').closest('.form-group');
const areaField = document.getElementById('entry-area').closest('.form-group');

// INIT
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// AUTHENTICATION
function checkAuth() {
    if (sessionStorage.getItem('fm_admin_auth') === 'true') {
        showDashboard();
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    try {
        const { data, error } = await _supabase
            .from('fmidtour_settings')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (error) throw error;

        const storedPin = data ? String(data.value).trim() : null;
        const inputPin = String(pinInput.value).trim();

        if (storedPin && inputPin === storedPin) {
            sessionStorage.setItem('fm_admin_auth', 'true');
            showDashboard();
        } else {
            loginError.style.display = 'block';
        }
    } catch (err) {
        console.error('Login error:', err);
        loginError.innerText = "Terjadi kesalahan sistem.";
        loginError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('fm_admin_auth');
    location.reload();
});

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    fetchData(); // Load data initially
}

// DATA FETCHING via Supabase
async function fetchData() {
    loadingIndicator.style.display = 'block';
    tableContainer.style.display = 'none';

    try {
        const { data: destData, error: destError } = await _supabase.from('fmidtour_destinasi').select('*');
        const { data: accomData, error: accomError } = await _supabase.from('fmidtour_akomodasi').select('*');
        const { data: settingsData, error: settingsError } = await _supabase.from('fmidtour_settings').select('*');
        const { data: blogData, error: blogError } = await _supabase.from('fmidtour_blog').select('*').order('created_at', { ascending: false });
        const { data: areasData, error: areasError } = await _supabase.from('fmidtour_areas').select('*').order('name');

        if (destError || accomError || settingsError || blogError || areasError) {
            console.error('Supabase fetch error:', destError || accomError || settingsError || blogError || areasError);
            alert('Gagal mengambil data dari Supabase.');
        } else {
            currentData.destinations = destData || [];
            currentData.accommodations = accomData || [];
            currentData.settings = settingsData || [];
            currentData.blog = blogData || [];
            currentData.areas = areasData || [];

            populateSettingsForms();
            populateAreaDropdowns();
            renderTable();
            renderBlogTable();
            renderAreasTable();
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        alert('Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
        loadingIndicator.style.display = 'none';
        updateViewDisplay();
    }
}

// NAVIGATION
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        navItems.forEach(nav => nav.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeView = e.currentTarget.getAttribute('data-view');

        const titleMap = {
            'destinations': 'Kelola Destinasi',
            'accommodations': 'Kelola Akomodasi',
            'pengaturan': 'Pengaturan Dasar',
            'hero': 'Edit Hero Section',
            'footer': 'Edit Footer & Kontak',
            'blog': 'Kelola Artikel Blog',
            'areas': 'Kelola Area Wisata'
        };
        pageTitle.innerText = titleMap[activeView] || 'Kelola Data';

        updateViewDisplay();
    });
});

function updateViewDisplay() {
    tableContainer.style.display = 'none';
    pengaturanContainer.style.display = 'none';
    heroContainer.style.display = 'none';
    footerContainer.style.display = 'none';
    blogContainer.style.display = 'none';
    areasContainer.style.display = 'none';
    btnAddNew.style.display = 'none';

    if (activeView === 'destinations' || activeView === 'accommodations' || activeView === 'blog' || activeView === 'areas') {
        if (activeView === 'blog') {
            blogContainer.style.display = 'block';
        } else if (activeView === 'areas') {
            areasContainer.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
        }
        btnAddNew.style.display = 'inline-block';
        if (activeView === 'blog') renderBlogTable();
        else if (activeView === 'areas') renderAreasTable();
        else renderTable();
    } else if (activeView === 'pengaturan') {
        pengaturanContainer.style.display = 'block';
    } else if (activeView === 'hero') {
        heroContainer.style.display = 'block';
    } else if (activeView === 'footer') {
        footerContainer.style.display = 'block';
    }
}

// RENDERING TABLE
function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    // items depends on activeView (destinations or accommodations)
    if (activeView !== 'destinations' && activeView !== 'accommodations') return;
    if (!currentData[activeView]) return;

    const items = currentData[activeView];

    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const typeOrNull = item.type ? item.type : '-';
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.innerHTML = `
            <td><strong>${item.name}</strong><br><small style="color:#6B7280;">${item.image}</small></td>
            <td>${item.area}</td>
            <td>Rp ${parseInt(item.price).toLocaleString('id-ID')}</td>
            <td>${typeOrNull}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditModal('${item.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderBlogTable() {
    if (!blogTableBody) return;
    blogTableBody.innerHTML = '';
    if (!currentData.blog) return;
    const items = currentData.blog;

    if (items.length === 0) {
        blogTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada artikel blog.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString('id-ID');
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.innerHTML = `
            <td><strong>${item.title}</strong><br><small style="color:#6B7280;">slug: ${item.slug}</small></td>
            <td>${item.category}</td>
            <td>${date}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditModal('${item.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        blogTableBody.appendChild(tr);
    });
}

// Event Delegation was removed in favor of direct onclick for maximum reliability in this dashboard.

// MODAL CONTROLS
btnAddNew.addEventListener('click', () => {
    let modalTitleText = '';
    if (activeView === 'destinations') modalTitleText = 'Tambah Destinasi Baru';
    else if (activeView === 'accommodations') modalTitleText = 'Tambah Akomodasi Baru';
    else if (activeView === 'blog') modalTitleText = 'Tambah Artikel Blog';
    else modalTitleText = 'Tambah Area Baru';

    document.getElementById('modal-title').innerText = modalTitleText;
    dataForm.reset();
    document.getElementById('entry-name').value = '';
    document.getElementById('entry-price').value = '';
    document.getElementById('entry-image').value = '';
    document.getElementById('entry-image-upload').value = '';
    document.getElementById('entry-id').value = '';
    document.getElementById('entry-group').value = activeView;

    // Toggle fields based on activeView
    if (activeView === 'areas') {
        const nameField = document.getElementById('entry-name').closest('.form-group');
        const areaFieldGroup = document.getElementById('entry-area').closest('.form-group');
        const priceFieldGroup = document.getElementById('entry-price').closest('.form-group');
        const imageFieldGroup = document.getElementById('entry-image-upload').closest('.form-group');

        nameField.style.display = 'block';
        areaFieldGroup.style.display = 'none';
        priceFieldGroup.style.display = 'none';
        imageFieldGroup.style.display = 'none';
        groupTypeField.style.display = 'none';
        groupBlogFields.style.display = 'none';
        document.querySelector('label[for="entry-name"]').innerText = 'Nama Area Baru';
    } else {
        groupTypeField.style.display = activeView === 'accommodations' ? 'block' : 'none';
        groupBlogFields.style.display = activeView === 'blog' ? 'block' : 'none';
        priceField.style.display = activeView === 'blog' ? 'none' : 'block';
        areaField.style.display = activeView === 'blog' ? 'none' : 'block';
        document.getElementById('entry-name').closest('.form-group').style.display = 'block';
        document.getElementById('entry-image-upload').closest('.form-group').style.display = 'block';
        document.querySelector('label[for="entry-name"]').innerText = activeView === 'blog' ? 'Judul Artikel' : 'Nama Tempat';
    }

    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// CREATE / UPDATE
dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('entry-id').value;
    const group = document.getElementById('entry-group').value;
    let table = '';
    if (group === 'destinations') table = 'fmidtour_destinasi';
    else if (group === 'accommodations') table = 'fmidtour_akomodasi';
    else if (group === 'blog') table = 'fmidtour_blog';
    else table = 'fmidtour_areas';

    const btnSave = document.getElementById('btn-save');
    const originalText = btnSave.innerText;
    btnSave.innerText = 'Menyimpan...';
    btnSave.disabled = true;

    try {
        let imageUrl = document.getElementById('entry-image').value;
        const fileInput = document.getElementById('entry-image-upload');

        // 1. Handle File Upload if a file is selected
        if (fileInput.files && fileInput.files.length > 0) {
            let file = fileInput.files[0];

            // Compress image to max 500KB
            btnSave.innerText = 'Mengkompresi Gambar...';
            try {
                file = await compressImage(file, 500);
            } catch (err) {
                console.error("Compression warning:", err); // Upload original if compression fails
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            const filePath = `${fileName}`;

            btnSave.innerText = 'Mengunggah Gambar...';
            const { error: uploadError } = await _supabase.storage
                .from('fmidtour_images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: publicUrlData } = _supabase.storage
                .from('fmidtour_images')
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;

            // Also update the text input visually
            document.getElementById('entry-image').value = imageUrl;
        }

        // 2. Prepare Data
        let newItem = {};
        if (group === 'blog') {
            const title = document.getElementById('entry-name').value;
            newItem = {
                title: title,
                slug: title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
                category: document.getElementById('entry-category').value,
                excerpt: document.getElementById('entry-excerpt').value,
                content: document.getElementById('entry-content').value,
                image: imageUrl
            };
        } else if (group === 'areas') {
            newItem = {
                name: document.getElementById('entry-name').value
            };
        } else {
            newItem = {
                name: document.getElementById('entry-name').value,
                area: document.getElementById('entry-area').value,
                price: parseInt(document.getElementById('entry-price').value),
                image: imageUrl
            };
            if (group === 'accommodations') {
                newItem.type = document.getElementById('entry-type').value;
            }
        }

        btnSave.innerText = 'Menyimpan Data...';
        if (id) {
            // Update existing
            const { error } = await _supabase.from(table).update(newItem).eq('id', id);
            if (error) throw error;
        } else {
            // Add new
            const { error } = await _supabase.from(table).insert([newItem]);
            if (error) throw error;
        }

        modal.style.display = 'none';
        await fetchData(); // Refresh data from remote
    } catch (err) {
        console.error('Save Error:', err);
        alert('Terjadi kesalahan saat menyimpan data ke Supabase.');
    } finally {
        btnSave.innerText = originalText;
        btnSave.disabled = false;
    }
});

// Functions moved to top.

// SETTINGS & CONTENT MANAGEMENT
function populateSettingsForms() {
    const getVal = (key) => {
        const setting = currentData.settings.find(s => s.key === key);
        return setting ? setting.value : '';
    };

    // Pengaturan
    const webNameEl = document.getElementById('set-web_name');
    const adminPassEl = document.getElementById('set-admin_password');
    if (webNameEl) webNameEl.value = getVal('web_name');
    if (adminPassEl) adminPassEl.value = getVal('admin_password');

    // Hero
    const heroBadgeEl = document.getElementById('set-hero_badge');
    const heroTitleEl = document.getElementById('set-hero_title');
    const heroSubtitleEl = document.getElementById('set-hero_subtitle');
    const heroImageEl = document.getElementById('set-hero_image');

    if (heroBadgeEl) heroBadgeEl.value = getVal('hero_badge');
    if (heroTitleEl) heroTitleEl.value = getVal('hero_title');
    if (heroSubtitleEl) heroSubtitleEl.value = getVal('hero_subtitle');
    if (heroImageEl) heroImageEl.value = getVal('hero_image') || 'assets/images/hero.png';

    // Footer
    const footerDescEl = document.getElementById('set-footer_desc');
    const csWhatsappEl = document.getElementById('set-cs_whatsapp');
    const addressEl = document.getElementById('set-address');
    const mapsEmbedEl = document.getElementById('set-maps_embed');

    if (footerDescEl) footerDescEl.value = getVal('footer_desc');
    if (csWhatsappEl) csWhatsappEl.value = getVal('cs_whatsapp');
    if (addressEl) addressEl.value = getVal('address');
    if (mapsEmbedEl) mapsEmbedEl.value = getVal('maps_embed');
}

async function saveSettings(updates, btnElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = 'Menyimpan...';
    btnElement.disabled = true;

    try {
        for (const update of updates) {
            const { error } = await _supabase
                .from('fmidtour_settings')
                .update({ value: update.value })
                .eq('key', update.key);

            if (error) throw error;
        }
        alert('Pengaturan berhasil disimpan!');
        await fetchData();
    } catch (err) {
        console.error('Save Settings Error:', err);
        alert('Gagal menyimpan pengaturan.');
    } finally {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
    }
}

document.getElementById('form-pengaturan').addEventListener('submit', (e) => {
    e.preventDefault();
    const updates = [
        { key: 'web_name', value: document.getElementById('set-web_name').value },
        { key: 'admin_password', value: document.getElementById('set-admin_password').value }
    ];
    saveSettings(updates, e.target.querySelector('button'));
});

document.getElementById('form-hero').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSave = e.target.querySelector('button');
    const originalText = btnSave.innerText;

    try {
        let imageUrl = document.getElementById('set-hero_image').value;
        const fileInput = document.getElementById('set-hero_image_upload');

        if (fileInput.files && fileInput.files.length > 0) {
            btnSave.innerText = 'Mengunggah & Kompres...';
            btnSave.disabled = true;
            let file = fileInput.files[0];

            try {
                file = await compressImage(file, 1000);
            } catch (err) {
                console.error("Compression warning:", err);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

            const { error: uploadError } = await _supabase.storage
                .from('fmidtour_images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = _supabase.storage
                .from('fmidtour_images')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
            document.getElementById('set-hero_image').value = imageUrl;
        }

        const updates = [
            { key: 'hero_image', value: imageUrl },
            { key: 'hero_badge', value: document.getElementById('set-hero_badge').value },
            { key: 'hero_title', value: document.getElementById('set-hero_title').value },
            { key: 'hero_subtitle', value: document.getElementById('set-hero_subtitle').value }
        ];

        await saveSettings(updates, btnSave);

    } catch (err) {
        console.error('Save Hero Error:', err);
        alert('Terjadi kesalahan saat menyimpan pengaturan hero.');
        btnSave.innerText = originalText;
        btnSave.disabled = false;
    }
});

document.getElementById('form-footer').addEventListener('submit', (e) => {
    e.preventDefault();
    const updates = [
        { key: 'footer_desc', value: document.getElementById('set-footer_desc').value },
        { key: 'cs_whatsapp', value: document.getElementById('set-cs_whatsapp').value },
        { key: 'address', value: document.getElementById('set-address').value },
        { key: 'maps_embed', value: document.getElementById('set-maps_embed').value }
    ];
    saveSettings(updates, e.target.querySelector('button'));
});

// IMAGE COMPRESSION UTILITY
async function compressImage(file, maxSizeKB) {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            return resolve(file); // Return original if not an image
        }

        const maxSizeBytes = maxSizeKB * 1024;

        if (file.size <= maxSizeBytes) {
            return resolve(file); // Return original if already small enough
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions to aid compression
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.9;

                const getCompressedBlob = (q) => {
                    return new Promise((res) => {
                        canvas.toBlob((blob) => {
                            res(blob);
                        }, 'image/jpeg', q);
                    });
                };

                const attemptCompression = async () => {
                    let blob = await getCompressedBlob(quality);

                    while (blob.size > maxSizeBytes && quality > 0.1) {
                        quality -= 0.1;
                        blob = await getCompressedBlob(quality);
                    }

                    const baseFileName = file.name.replace(/\.[^/.]+$/, "");
                    const compressedFile = new File([blob], `${baseFileName}.jpg`, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                };

                attemptCompression();
            };
            img.onerror = () => resolve(file); // fail safe
            img.src = readerEvent.target.result;
        };
        reader.onerror = () => resolve(file); // fail safe
        reader.readAsDataURL(file);
    });
}

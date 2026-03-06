// --- SUPABASE INTIALIZATION ---
const supabaseUrl = 'https://pgltsyrtduvddpcdlchk.supabase.co';
const supabaseKey = 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// STATE & DATA
let currentData = { destinations: [], accommodations: [], settings: [] };
let activeView = 'destinations'; // 'destinations', 'accommodations', 'pengaturan', 'hero', 'footer'

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

// Modal Elements
const modal = document.getElementById('form-modal');
const btnAddNew = document.getElementById('btn-add-new');
const closeBtn = document.querySelector('.close-modal');
const dataForm = document.getElementById('data-form');
const groupTypeField = document.getElementById('group-type');

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

        if (data && pinInput.value === data.value) {
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

        if (destError || accomError || settingsError) {
            console.error('Supabase fetch error:', destError || accomError || settingsError);
            alert('Gagal mengambil data dari Supabase.');
        } else {
            currentData.destinations = destData || [];
            currentData.accommodations = accomData || [];
            currentData.settings = settingsData || [];

            populateSettingsForms();
            renderTable();
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
            'footer': 'Edit Footer & Kontak'
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
    btnAddNew.style.display = 'none';

    if (activeView === 'destinations' || activeView === 'accommodations') {
        tableContainer.style.display = 'block';
        btnAddNew.style.display = 'inline-block';
        renderTable();
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
    tableBody.innerHTML = '';
    const items = currentData[activeView] || [];

    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data.</td></tr>`;
        return;
    }

    items.forEach(item => {
        // Tipe is only available for accommodations, otherwise show '-'
        const typeOrNull = item.type ? item.type : '-';

        const tr = document.createElement('tr');
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

// MODAL CONTROLS
btnAddNew.addEventListener('click', () => {
    document.getElementById('modal-title').innerText = activeView === 'destinations' ? 'Tambah Destinasi Baru' : 'Tambah Akomodasi Baru';
    dataForm.reset();
    document.getElementById('entry-name').value = '';
    document.getElementById('entry-price').value = '';
    document.getElementById('entry-image').value = '';
    document.getElementById('entry-image-upload').value = ''; // Reset file input
    document.getElementById('entry-id').value = ''; // Empty ID means new entry
    document.getElementById('entry-group').value = activeView;

    // Toggle type field for accommodations
    groupTypeField.style.display = activeView === 'accommodations' ? 'block' : 'none';
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
    const table = group === 'destinations' ? 'fmidtour_destinasi' : 'fmidtour_akomodasi';

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
        const newItem = {
            name: document.getElementById('entry-name').value,
            area: document.getElementById('entry-area').value,
            price: parseInt(document.getElementById('entry-price').value),
            image: imageUrl
        };

        if (group === 'accommodations') {
            newItem.type = document.getElementById('entry-type').value;
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

// EDIT FUNCTION
window.openEditModal = function (id) {
    const group = activeView;
    const item = currentData[group].find(x => x.id === id);
    if (!item) return;

    document.getElementById('modal-title').innerText = group === 'destinations' ? 'Edit Destinasi' : 'Edit Akomodasi';
    document.getElementById('entry-id').value = item.id;
    document.getElementById('entry-group').value = group;
    document.getElementById('entry-name').value = item.name;
    document.getElementById('entry-area').value = item.area;
    document.getElementById('entry-price').value = item.price;
    document.getElementById('entry-image').value = item.image;
    document.getElementById('entry-image-upload').value = ''; // Reset file input

    groupTypeField.style.display = group === 'accommodations' ? 'block' : 'none';
    if (group === 'accommodations') {
        document.getElementById('entry-type').value = item.type;
    }

    modal.style.display = 'block';
};

// DELETE FUNCTION
window.deleteItem = async function (id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        const table = activeView === 'destinations' ? 'fmidtour_destinasi' : 'fmidtour_akomodasi';
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

// SETTINGS & CONTENT MANAGEMENT
function populateSettingsForms() {
    const getVal = (key) => {
        const setting = currentData.settings.find(s => s.key === key);
        return setting ? setting.value : '';
    };

    // Pengaturan
    document.getElementById('set-web_name').value = getVal('web_name');
    document.getElementById('set-admin_password').value = getVal('admin_password');

    // Hero
    document.getElementById('set-hero_badge').value = getVal('hero_badge');
    document.getElementById('set-hero_title').value = getVal('hero_title');
    document.getElementById('set-hero_subtitle').value = getVal('hero_subtitle');

    // Set fallback hero image if somehow undefined
    const heroImg = getVal('hero_image');
    document.getElementById('set-hero_image').value = heroImg || 'assets/images/hero.png';
    document.getElementById('set-hero_image_upload').value = '';

    // Footer
    document.getElementById('set-footer_desc').value = getVal('footer_desc');
    document.getElementById('set-cs_whatsapp').value = getVal('cs_whatsapp');
    document.getElementById('set-address').value = getVal('address');
    document.getElementById('set-maps_embed').value = getVal('maps_embed');
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
                file = await compressImage(file, 500);
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

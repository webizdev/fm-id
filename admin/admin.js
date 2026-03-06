// --- SUPABASE INTIALIZATION ---
const supabaseUrl = 'https://pgltsyrtduvddpcdlchk.supabase.co';
const supabaseKey = 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi';
let _supabase;

console.log("--- ADMIN SCRIPT INITIALIZING ---");

try {
    if (typeof window.supabase === 'undefined') {
        throw new Error("Supabase library not loaded!");
    }
    _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase initialized successfully.");
} catch (e) {
    console.error("Supabase failed to initialize:", e);
    alert("Koneksi ke database gagal. Silakan periksa koneksi internet Anda.");
}

// --- STATE & DATA ---
let currentData = { destinations: [], accommodations: [], settings: [], blog: [], areas: [] };
let activeView = 'destinations';

// --- HELPER ---
const getEl = (id) => document.getElementById(id);

// --- GLOBAL FUNCTIONS ---

window.openEditModal = function (id, targetGroup = null) {
    console.log('--- START openEditModal --- ID:', id, 'Group:', targetGroup);

    try {
        const modal = getEl('form-modal');
        if (!modal) throw new Error("Element #form-modal tidak ditemukan!");

        let group = targetGroup || activeView;
        let item = null;

        if (currentData[group]) {
            item = currentData[group].find(x => String(x.id) === String(id));
        }

        if (!item) {
            console.log('Searching in other groups...');
            for (const g of ['destinations', 'accommodations', 'blog', 'areas']) {
                if (currentData[g]) {
                    item = currentData[g].find(x => String(x.id) === String(id));
                    if (item) { group = g; break; }
                }
            }
        }

        if (!item) {
            alert('Data tidak ditemukan (ID: ' + id + ').');
            return;
        }

        const modalTitle = getEl('modal-title');
        if (modalTitle) {
            if (group === 'blog') modalTitle.innerText = 'Edit Artikel Blog';
            else if (group === 'destinations') modalTitle.innerText = 'Edit Destinasi';
            else if (group === 'accommodations') modalTitle.innerText = 'Edit Akomodasi';
            else modalTitle.innerText = 'Edit Area';
        }

        getEl('entry-id').value = item.id || '';
        getEl('entry-group').value = group || '';
        getEl('entry-name').value = item.name || item.title || '';
        getEl('entry-area').value = item.area || 'Jakarta';
        getEl('entry-price').value = item.price !== undefined ? item.price : '0';
        getEl('entry-image').value = item.image || '';
        getEl('entry-type').value = item.type || 'Hotel';

        if (group === 'blog') {
            getEl('entry-category').value = item.category || 'Tips Travel';
            getEl('entry-excerpt').value = item.excerpt || '';
            getEl('entry-content').value = item.content || '';
        }

        // --- DYNAMIC VISIBILITY & REQUIRED FLAGS ---
        const groupType = getEl('group-type');
        const groupBlog = getEl('group-blog-fields');
        const priceInput = getEl('entry-price');
        const areaInput = getEl('entry-area');
        const imageInput = getEl('entry-image');

        const pField = priceInput ? priceInput.closest('.form-group') : null;
        const aField = areaInput ? areaInput.closest('.form-group') : null;
        const iField = imageInput ? imageInput.closest('.form-group') : null;

        const isArea = group === 'areas';
        const isBlog = group === 'blog';

        if (groupType) groupType.style.display = group === 'accommodations' ? 'block' : 'none';
        if (groupBlog) groupBlog.style.display = isBlog ? 'block' : 'none';
        if (pField) pField.style.display = (isBlog || isArea) ? 'none' : 'block';
        if (aField) aField.style.display = (isBlog || isArea) ? 'none' : 'block';
        if (iField) iField.style.display = isArea ? 'none' : 'block';

        // Toggle Required
        if (priceInput) priceInput.required = !(isBlog || isArea);
        if (areaInput) areaInput.required = !(isBlog || isArea);
        if (imageInput) imageInput.required = !isArea;

        const nameLabel = document.querySelector('label[for="entry-name"]');
        if (nameLabel) {
            if (isBlog) nameLabel.innerText = 'Judul Artikel';
            else if (isArea) nameLabel.innerText = 'Nama Area Baru';
            else nameLabel.innerText = 'Nama Tempat';
        }

        getEl('entry-image-upload').value = '';
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error in openEditModal:', error);
        alert('Gagal membuka modal: ' + error.message);
    }
};

window.deleteItem = async function (id) {
    if (!confirm("Hapus data ini?")) return;

    let table = '';
    if (activeView === 'destinations') table = 'fmidtour_destinasi';
    else if (activeView === 'accommodations') table = 'fmidtour_akomodasi';
    else if (activeView === 'areas') table = 'fmidtour_areas';
    else table = 'fmidtour_blog';

    try {
        const { error } = await _supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    } catch (err) {
        console.error('Delete Error:', err);
        alert('Gagal menghapus data: ' + err.message);
    }
};

// --- DATA FETCHING ---
async function fetchData() {
    console.log("--- START fetchData ---");
    const loader = getEl('loading-indicator');
    const container = getEl('table-container');

    if (loader) loader.style.display = 'block';

    try {
        if (!_supabase) throw new Error("Supabase client not initialized.");

        const { data: dData, error: dErr } = await _supabase.from('fmidtour_destinasi').select('*');
        if (dErr) throw dErr;

        const { data: aData, error: aErr } = await _supabase.from('fmidtour_akomodasi').select('*');
        if (aErr) throw aErr;

        const { data: sData, error: sErr } = await _supabase.from('fmidtour_settings').select('*');
        if (sErr) throw sErr;

        const { data: bData, error: bErr } = await _supabase.from('fmidtour_blog').select('*').order('created_at', { ascending: false });
        if (bErr) throw bErr;

        const { data: arData, error: arErr } = await _supabase.from('fmidtour_areas').select('*').order('name');
        if (arErr) throw arErr;

        currentData.destinations = dData || [];
        currentData.accommodations = aData || [];
        currentData.settings = sData || [];
        currentData.blog = bData || [];
        currentData.areas = arData || [];

        populateSettingsForms();
        populateAreaDropdowns();
        renderTable();
        renderBlogTable();
        renderAreasTable();
        console.log("--- fetchData Completed ---");

    } catch (error) {
        console.error('CRITICAL FETCH ERROR:', error);
        alert('Terjadi kesalahan saat mengambil data: ' + (error.message || JSON.stringify(error)));
    } finally {
        if (loader) loader.style.display = 'none';
        updateViewDisplay();
    }
}

// --- RENDERING ---
function renderTable() {
    const tableBody = getEl('table-body');
    if (!tableBody || (activeView !== 'destinations' && activeView !== 'accommodations')) return;

    tableBody.innerHTML = '';
    const items = currentData[activeView] || [];

    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const price = item.price ? parseInt(item.price).toLocaleString('id-ID') : '0';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name || '-'}</strong><br><small style="color:#aaa;">${item.image || ''}</small></td>
            <td>${item.area || '-'}</td>
            <td>Rp ${price}</td>
            <td>${item.type || '-'}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditModal('${item.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderBlogTable() {
    const blogBody = getEl('blog-table-body');
    if (!blogBody) return;
    blogBody.innerHTML = '';
    const items = currentData.blog || [];

    if (items.length === 0) {
        blogBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada artikel.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.title}</strong></td>
            <td>${item.category || '-'}</td>
            <td>${date}</td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditModal('${item.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        blogBody.appendChild(tr);
    });
}

function renderAreasTable() {
    const areasBody = getEl('areas-table-body');
    if (!areasBody) return;
    areasBody.innerHTML = '';
    const items = currentData.areas || [];

    if (items.length === 0) {
        areasBody.innerHTML = `<tr><td colspan="2" style="text-align:center;">Tidak ada area.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditModal('${item.id}', 'areas')"><i class="fas fa-edit"></i></button>
                <button class="action-btn btn-delete" onclick="deleteItem('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        areasBody.appendChild(tr);
    });
}

function populateAreaDropdowns() {
    const areaSelect = getEl('entry-area');
    if (!areaSelect) return;
    areaSelect.innerHTML = '';

    // Add default option
    const def = document.createElement('option');
    def.value = '';
    def.innerText = '-- Pilih Area --';
    areaSelect.appendChild(def);

    currentData.areas.forEach(area => {
        const opt = document.createElement('option');
        opt.value = area.name;
        opt.innerText = area.name;
        areaSelect.appendChild(opt);
    });
}

function populateSettingsForms() {
    const getVal = (key) => {
        const s = (currentData.settings || []).find(x => x.key === key);
        return s ? s.value : '';
    };

    const ids = [
        'set-web_name', 'set-admin_password', 'set-hero_badge', 'set-hero_title',
        'set-hero_subtitle', 'set-hero_image', 'set-footer_desc', 'set-cs_whatsapp',
        'set-address', 'set-maps_embed'
    ];

    ids.forEach(id => {
        const el = getEl(id);
        if (el) el.value = getVal(id.replace('set-', ''));
    });
}

function updateViewDisplay() {
    const containers = [
        'table-container', 'pengaturan-container', 'hero-container',
        'footer-container', 'blog-container', 'areas-container', 'btn-add-new'
    ];
    containers.forEach(id => {
        const el = getEl(id);
        if (el) el.style.display = 'none';
    });

    const v = activeView;
    if (v === 'destinations' || v === 'accommodations' || v === 'blog' || v === 'areas') {
        const targetId = v === 'blog' ? 'blog-container' : (v === 'areas' ? 'areas-container' : 'table-container');
        if (getEl(targetId)) getEl(targetId).style.display = 'block';
        if (getEl('btn-add-new')) getEl('btn-add-new').style.display = 'inline-block';

        if (v === 'blog') renderBlogTable();
        else if (v === 'areas') renderAreasTable();
        else renderTable();
    } else {
        const targetId = v + '-container';
        if (getEl(targetId)) getEl(targetId).style.display = 'block';
    }
}

// --- CORE HANDLER SETUP ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Setting up listeners...");

    // 1. Navigation
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-menu li').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            activeView = item.getAttribute('data-view');
            const titles = { 'destinations': 'Destinasi', 'accommodations': 'Akomodasi', 'pengaturan': 'Pengaturan', 'hero': 'Hero', 'footer': 'Footer', 'blog': 'Blog', 'areas': 'Area Wisata' };
            if (getEl('page-title')) getEl('page-title').innerText = 'Kelola ' + (titles[activeView] || 'Data');
            updateViewDisplay();
        });
    });

    // 2. Add New Button
    const btnAdd = getEl('btn-add-new');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const form = getEl('data-form');
            if (!form) return;
            form.reset();
            getEl('entry-id').value = '';
            getEl('entry-group').value = activeView;
            getEl('modal-title').innerText = 'Tambah ' + activeView;

            // Visibility & Required Toggles
            const isArea = activeView === 'areas';
            const isBlog = activeView === 'blog';

            const priceInput = getEl('entry-price');
            const areaInput = getEl('entry-area');
            const imageInput = getEl('entry-image');

            if (priceInput) {
                priceInput.closest('.form-group').style.display = (isBlog || isArea) ? 'none' : 'block';
                priceInput.required = !(isBlog || isArea);
            }
            if (areaInput) {
                areaInput.closest('.form-group').style.display = (isBlog || isArea) ? 'none' : 'block';
                areaInput.required = !(isBlog || isArea);
            }
            if (getEl('group-type')) getEl('group-type').style.display = activeView === 'accommodations' ? 'block' : 'none';
            if (getEl('group-blog-fields')) getEl('group-blog-fields').style.display = isBlog ? 'block' : 'none';
            if (imageInput) {
                imageInput.closest('.form-group').style.display = isArea ? 'none' : 'block';
                imageInput.required = !isArea;
            }

            const nameLbl = document.querySelector('label[for="entry-name"]');
            if (nameLbl) nameLbl.innerText = isBlog ? 'Judul Artikel' : (isArea ? 'Nama Area Baru' : 'Nama Tempat');

            getEl('form-modal').style.display = 'block';
        });
    }

    // 3. Modal Close
    const cls = document.querySelector('.close-modal');
    if (cls) cls.onclick = () => getEl('form-modal').style.display = 'none';
    window.addEventListener('click', (e) => { if (e.target === getEl('form-modal')) getEl('form-modal').style.display = 'none'; });

    // 4. Data Form Submission
    const dForm = getEl('data-form');
    if (dForm) {
        dForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = getEl('btn-save');
            const group = getEl('entry-group').value;
            const id = getEl('entry-id').value;

            btn.disabled = true;
            const oldT = btn.innerText;
            btn.innerText = 'Menyimpan...';

            try {
                let url = getEl('entry-image').value;
                const file = getEl('entry-image-upload').files[0];

                if (file) {
                    btn.innerText = 'Upload...';
                    const fExt = file.name.split('.').pop();
                    const fPath = `upload_${Date.now()}.${fExt}`;
                    const { error: upErr } = await _supabase.storage.from('fmidtour_images').upload(fPath, file);
                    if (upErr) throw upErr;
                    const { data } = _supabase.storage.from('fmidtour_images').getPublicUrl(fPath);
                    url = data.publicUrl;
                }

                let payload = {};
                if (group === 'blog') {
                    const title = getEl('entry-name').value;
                    payload = { title, slug: title.toLowerCase().replace(/ /g, '-'), category: getEl('entry-category').value, excerpt: getEl('entry-excerpt').value, content: getEl('entry-content').value, image: url };
                } else if (group === 'areas') {
                    payload = { name: getEl('entry-name').value };
                } else {
                    payload = { name: getEl('entry-name').value, area: getEl('entry-area').value, price: parseInt(getEl('entry-price').value), image: url };
                    if (group === 'accommodations') payload.type = getEl('entry-type').value;
                }

                const tableMap = { 'destinations': 'fmidtour_destinasi', 'accommodations': 'fmidtour_akomodasi', 'blog': 'fmidtour_blog', 'areas': 'fmidtour_areas' };
                const table = tableMap[group];

                const { error } = id ? await _supabase.from(table).update(payload).eq('id', id) : await _supabase.from(table).insert([payload]);
                if (error) throw error;

                getEl('form-modal').style.display = 'none';
                fetchData();
            } catch (err) { alert("Save Error: " + (err.message || JSON.stringify(err))); }
            finally { btn.disabled = false; btn.innerText = oldT; }
        });
    }

    // 5. Login Form
    const lFrm = getEl('login-form');
    if (lFrm) {
        lFrm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = getEl('login-error');
            if (errEl) errEl.style.display = 'none';

            try {
                const { data, error } = await _supabase.from('fmidtour_settings').select('value').eq('key', 'admin_password').single();
                if (error) throw error;
                if (data && String(getEl('admin-pin').value).trim() === String(data.value).trim()) {
                    sessionStorage.setItem('fm_admin_auth', 'true');
                    showDashboard();
                } else {
                    if (errEl) errEl.style.display = 'block';
                }
            } catch (ex) { alert("Login Error: " + ex.message); }
        });
    }

    // 6. Logout
    const loBtn = getEl('logout-btn');
    if (loBtn) loBtn.addEventListener('click', () => { sessionStorage.removeItem('fm_admin_auth'); location.reload(); });

    // 7. Settings Forms
    const setupSettingsForm = (formId, keys) => {
        const form = getEl(formId);
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const b = form.querySelector('button');
            b.disabled = true;
            try {
                for (const k of keys) {
                    const val = getEl('set-' + k).value;
                    const { error } = await _supabase.from('fmidtour_settings').update({ value: val }).eq('key', k);
                    if (error) throw error;
                }
                alert("Berhasil disimpan!");
                fetchData();
            } catch (ex) { alert("Error: " + ex.message); }
            finally { b.disabled = false; }
        });
    };

    setupSettingsForm('form-pengaturan', ['web_name', 'admin_password']);
    setupSettingsForm('form-footer', ['footer_desc', 'cs_whatsapp', 'address', 'maps_embed']);

    // 8. Hero Form
    const hFrm = getEl('form-hero');
    if (hFrm) {
        hFrm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const b = hFrm.querySelector('button');
            b.disabled = true;
            try {
                let url = getEl('set-hero_image').value;
                const file = getEl('set-hero_image_upload').files[0];
                if (file) {
                    const path = `hero_${Date.now()}.jpg`;
                    await _supabase.storage.from('fmidtour_images').upload(path, file);
                    const { data } = _supabase.storage.from('fmidtour_images').getPublicUrl(path);
                    url = data.publicUrl;
                }
                const updates = [
                    { k: 'hero_image', v: url },
                    { k: 'hero_badge', v: getEl('set-hero_badge').value },
                    { k: 'hero_title', v: getEl('set-hero_title').value },
                    { k: 'hero_subtitle', v: getEl('set-hero_subtitle').value }
                ];
                for (const u of updates) await _supabase.from('fmidtour_settings').update({ value: u.v }).eq('key', u.k);
                alert("Hero Updated!");
                fetchData();
            } catch (ex) { alert("Error: " + ex.message); }
            finally { b.disabled = false; }
        });
    }

    checkAuth();
});

function checkAuth() {
    const isAuth = sessionStorage.getItem('fm_admin_auth') === 'true';
    if (getEl('login-screen')) getEl('login-screen').style.display = isAuth ? 'none' : 'flex';
    if (getEl('dashboard-screen')) getEl('dashboard-screen').style.display = isAuth ? 'flex' : 'none';
    if (isAuth) fetchData();
}

function showDashboard() {
    checkAuth();
}

// Supabase Configuration
const supabaseUrl = 'https://pgltsyrtduvddpcdlchk.supabase.co';
const supabaseKey = 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (window.location.pathname.includes('blog-detail.html')) {
        if (slug) {
            fetchArticleDetail(slug);
        } else {
            window.location.href = 'blog.html';
        }
    } else if (window.location.pathname.includes('blog.html')) {
        fetchAllArticles();
    }

    // Always update WhatsApp Link in Nav if possible
    updateNavWhatsApp();

    // Language Change Support
    window.addEventListener('langChanged', () => {
        if (window.location.pathname.includes('blog-detail.html')) {
            if (slug) fetchArticleDetail(slug);
        } else {
            fetchAllArticles();
        }
    });
});

async function updateNavWhatsApp() {
    const navContact = document.getElementById('dyn-nav-contact');
    if (!navContact) return;

    try {
        const { data, error } = await _supabase
            .from('fmidtour_settings')
            .select('*');

        if (error) throw error;

        if (data) {
            const getVal = (key) => {
                const setting = data.find(s => s.key === key);
                return setting ? setting.value : '';
            };

            // WhatsApp Nav & Footer
            let waRaw = getVal('cs_whatsapp');
            if (waRaw) {
                let formatted = waRaw.replace(/\D/g, '');
                if (formatted.startsWith('0')) {
                    formatted = '62' + formatted.substring(1);
                }
                const lang = localStorage.getItem('fm_lang') || 'id';
                const msg = lang === 'ar' ? "مرحباً، أود الاستفسار عن جولة..." : (lang === 'en' ? "Hello admin, I'd like to ask about tour & travel to.." : "Halo admin, saya mau bertanya tentang tour & travel ke..");
                const encodedMsg = encodeURIComponent(msg);
                navContact.href = `https://wa.me/${formatted}?text=${encodedMsg}`;
                navContact.target = "_blank";

                const footerWa = document.getElementById('dyn-footer-wa');
                if (footerWa) footerWa.innerText = waRaw;
            }

            // Email Footer
            const emailRaw = getVal('cs_email');
            const footerEmail = document.getElementById('dyn-footer-email');
            if (footerEmail && emailRaw) {
                footerEmail.innerText = emailRaw;
            }

            // Address Footer
            const addressRaw = getVal('address');
            const footerAddress = document.getElementById('dyn-footer-address');
            if (footerAddress && addressRaw) {
                footerAddress.innerText = addressRaw;
            }

            // Desc Footer
            const lang = localStorage.getItem('fm_lang') || 'id';
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

            const descRaw = getTranslatedVal('footer_desc');
            const footerDesc = document.querySelector('.footer-desc');
            if (footerDesc && descRaw) {
                footerDesc.innerText = descRaw;
            }

            // Maps Footer
            const mapsRaw = getVal('maps_embed');
            const footerMaps = document.getElementById('dyn-footer-maps');
            if (footerMaps && mapsRaw) {
                footerMaps.innerHTML = mapsRaw;
            }

            // Social Media Footer
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
        }
    } catch (err) {
        console.error('Error updating nav WA link:', err);
    }
}

async function fetchAllArticles() {
    const blogGrid = document.getElementById('blog-page-grid');
    if (!blogGrid) return;

    try {
        const { data, error } = await _supabase
            .from('fmidtour_blog')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        blogGrid.innerHTML = '';
        const lang = localStorage.getItem('fm_lang') || 'id';
        if (data.length === 0) {
            const noArticlesText = translations[lang] ? translations[lang].no_articles : "Belum ada artikel yang diterbitkan.";
            blogGrid.innerHTML = `<p>${noArticlesText}</p>`;
            return;
        }


        data.forEach(item => {
            const title = lang === 'en' ? (item.title_en || item.title) : (lang === 'ar' ? (item.title_ar || item.title) : item.title);
            const excerpt = lang === 'en' ? (item.excerpt_en || item.excerpt) : (lang === 'ar' ? (item.excerpt_ar || item.excerpt) : item.excerpt);

            let rawCat = item.category || '';
            let catKey = 'cat_' + rawCat.toLowerCase().replace(/\s+/g, '_');
            let fallbackCat = translations[lang] && translations[lang][catKey] ? translations[lang][catKey] : rawCat;
            const category = lang === 'en' ? (item.category_en || fallbackCat) : (lang === 'ar' ? (item.category_ar || fallbackCat) : fallbackCat);

            const btnText = translations[lang] ? translations[lang].btn_read_more : "Baca Selengkapnya";

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
                        <a href="blog-detail.html?slug=${item.slug}" class="btn-text" style="text-decoration:none; color: var(--color-primary); font-weight:600;">${btnText} <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `;
            blogGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    } catch (err) {
        console.error('Error:', err);
        blogGrid.innerHTML = '<p>Gagal memuat artikel.</p>';
    }
}

async function fetchArticleDetail(slug) {
    try {
        const { data, error } = await _supabase
            .from('fmidtour_blog')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;

        const lang = localStorage.getItem('fm_lang') || 'id';
        const title = lang === 'en' ? (data.title_en || data.title) : (lang === 'ar' ? (data.title_ar || data.title) : data.title);
        const content = lang === 'en' ? (data.content_en || data.content) : (lang === 'ar' ? (data.content_ar || data.content) : data.content);
        const excerpt = lang === 'en' ? (data.excerpt_en || data.excerpt) : (lang === 'ar' ? (data.excerpt_ar || data.excerpt) : data.excerpt);

        let rawCat = data.category || '';
        let catKey = 'cat_' + rawCat.toLowerCase().replace(/\s+/g, '_');
        let fallbackCat = translations[lang] && translations[lang][catKey] ? translations[lang][catKey] : rawCat;
        const category = lang === 'en' ? (data.category_en || fallbackCat) : (lang === 'ar' ? (data.category_ar || fallbackCat) : fallbackCat);

        // Update SEO
        document.title = `${title} | FM-ID Tour&Travel`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', excerpt);

        // Render Content
        let locale = 'id-ID';
        if (lang === 'en') locale = 'en-US';
        if (lang === 'ar') locale = 'ar-SA';
        const date = new Date(data.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

        document.getElementById('article-title').innerText = title;
        const metaBadge = document.getElementById('article-meta-badge');
        if (metaBadge) metaBadge.innerText = category;

        const adminText = lang === 'ar' ? 'مسؤول FM-ID' : 'Admin FM-ID';
        const authorName = data.author || adminText;

        const metaText = document.getElementById('article-meta-text');
        if (metaText) metaText.innerHTML = `<i class="fas fa-calendar-alt"></i> ${date} &nbsp; | &nbsp; <i class="fas fa-user"></i> ${authorName}`;

        document.getElementById('article-hero-img').src = data.image;
        document.getElementById('article-content').innerHTML = content;

    } catch (err) {
        console.error('Error:', err);
        const lang = localStorage.getItem('fm_lang') || 'id';
        const titleNotFound = translations[lang] ? translations[lang].article_not_found_title : "Artikel tidak ditemukan";
        const descNotFound = translations[lang] ? translations[lang].article_not_found_desc : "Maaf, artikel yang Anda cari tidak tersedia.";
        const btnBackBlog = translations[lang] ? translations[lang].btn_back_blog : "Kembali ke Blog";

        const container = document.getElementById('article-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding: 5rem 2rem;">
                    <h2>${titleNotFound}</h2>
                    <p>${descNotFound}</p>
                    <a href="blog.html" class="btn-primary" style="margin-top: 2rem; display:inline-block;">${btnBackBlog}</a>
                </div>
            `;
        }
    }
}

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
            .select('value')
            .eq('key', 'cs_whatsapp')
            .single();

        if (error) throw error;
        if (data && data.value) {
            let waRaw = data.value;
            let formatted = waRaw.replace(/\D/g, '');
            if (formatted.startsWith('0')) {
                formatted = '62' + formatted.substring(1);
            }
            // Use translation for WhatsApp message if desired
            const lang = localStorage.getItem('fm_lang') || 'id';
            const msg = lang === 'ar' ? "مرحباً، أود الاستفسار عن جولة..." : (lang === 'en' ? "Hello admin, I'd like to ask about tour & travel to.." : "Halo admin, saya mau bertanya tentang tour & travel ke..");
            const encodedMsg = encodeURIComponent(msg);
            navContact.href = `https://wa.me/${formatted}?text=${encodedMsg}`;
            navContact.target = "_blank";
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
        if (data.length === 0) {
            blogGrid.innerHTML = '<p>Belum ada artikel.</p>';
            return;
        }

        const lang = localStorage.getItem('fm_lang') || 'id';

        data.forEach(item => {
            const title = lang === 'en' ? (item.title_en || item.title) : (lang === 'ar' ? (item.title_ar || item.title) : item.title);
            const excerpt = lang === 'en' ? (item.excerpt_en || item.excerpt) : (lang === 'ar' ? (item.excerpt_ar || item.excerpt) : item.excerpt);
            const category = lang === 'en' ? (item.category_en || item.category) : (lang === 'ar' ? (item.category_ar || item.category) : item.category);
            const btnText = translations[lang] ? translations[lang].btn_read_more : "Baca Selengkapnya";

            const date = new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : (lang === 'en' ? 'en-US' : 'id-ID'), { day: 'numeric', month: 'long', year: 'numeric' });
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
        const category = lang === 'en' ? (data.category_en || data.category) : (lang === 'ar' ? (data.category_ar || data.category) : data.category);

        // Update SEO
        document.title = `${title} | FM-ID Tour&Travel`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', excerpt);

        // Render Content
        const date = new Date(data.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : (lang === 'en' ? 'en-US' : 'id-ID'), { day: 'numeric', month: 'long', year: 'numeric' });

        document.getElementById('article-title').innerText = title;
        const metaBadge = document.getElementById('article-meta-badge');
        if (metaBadge) metaBadge.innerText = category;

        const metaText = document.getElementById('article-meta-text');
        if (metaText) metaText.innerHTML = `<i class="fas fa-calendar-alt"></i> ${date} &nbsp; | &nbsp; <i class="fas fa-user"></i> ${data.author || 'Admin'}`;

        document.getElementById('article-hero-img').src = data.image;
        document.getElementById('article-content').innerHTML = content;

    } catch (err) {
        console.error('Error:', err);
        const container = document.getElementById('article-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding: 5rem 2rem;">
                    <h2>Artikel tidak ditemukan / Article not found</h2>
                    <p>Maaf, artikel yang Anda cari tidak tersedia. / Sorry, the article you are looking for is not available.</p>
                    <a href="blog.html" class="btn-primary" style="margin-top: 2rem; display:inline-block;">Kembali ke Blog</a>
                </div>
            `;
        }
    }
}

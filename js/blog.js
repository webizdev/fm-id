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
});

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

        // Update SEO
        document.title = `${data.title} | FM-ID Tour&Travel`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.excerpt);

        // Render Content
        const date = new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        document.getElementById('article-title').innerText = data.title;
        document.getElementById('article-meta').innerHTML = `<i class="fas fa-calendar-alt"></i> ${date} &nbsp; | &nbsp; <i class="fas fa-tag"></i> ${data.category} &nbsp; | &nbsp; <i class="fas fa-user"></i> ${data.author}`;
        document.getElementById('article-hero-img').src = data.image;
        document.getElementById('article-content').innerHTML = data.content;

    } catch (err) {
        console.error('Error:', err);
        document.getElementById('article-container').innerHTML = `
            <div style="text-align:center; padding: 5rem 2rem;">
                <h2>Artikel tidak ditemukan</h2>
                <p>Maaf, artikel yang Anda cari tidak tersedia atau sudah dihapus.</p>
                <a href="blog.html" class="btn-primary" style="margin-top: 2rem; display:inline-block;">Kembali ke Blog</a>
            </div>
        `;
    }
}

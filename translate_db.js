const url = 'https://pgltsyrtduvddpcdlchk.supabase.co/rest/v1';
const headers = {
    'apikey': 'sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi',
    'Authorization': 'Bearer sb_publishable_qA1ikbX5NfBE1kAeG-3aOA_Kr1f-5xi',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function run() {
    // 1. Fetch Blog
    const res = await fetch(`${url}/fmidtour_blog?select=*`, { headers });
    const blogs = await res.json();
    console.log(`Fetched ${blogs.length} blogs.`);

    for (let b of blogs) {
        let update = {};
        if (b.title === 'Menjelajahi Sisi Lain Kota Bandung') {
            update.title_en = 'Exploring the Other Side of Bandung';
            update.title_ar = 'استكشاف الجانب الآخر من باندونغ';
            update.category_en = 'Destinations';
            update.category_ar = 'وجهة';
            update.excerpt_en = 'Discover hidden gems and legendary culinary spots you can only find at night in Bandung.';
            update.excerpt_ar = 'اكتشف الجواهر الخفية وأماكن الطهي الأسطورية التي يمكنك العثور عليها فقط في الليل في باندونغ.';
        } else if (b.title === 'Tips Memilih Tiket Pesawat Murah') {
            update.title_en = 'Tips for Choosing Cheap Flight Tickets';
            update.title_ar = 'نصائح لاختيار تذاكر طيران رخيصة';
            update.category_en = 'Travel Tips';
            update.category_ar = 'نصائح السفر';
            update.excerpt_en = 'Don\'t miss out! Follow these tips to get the best flight ticket prices.';
            update.excerpt_ar = 'لا تفوت الفرصة! اتبع هذه النصائح للحصول على أفضل أسعار تذاكر الطيران.';
        } else if (b.title.includes('makanan legendaris')) {
            update.title_en = 'Legendary Food in Jakarta';
            update.title_ar = 'طعام أسطوري في جاكرتا';
            update.category_en = 'Culinary';
            update.category_ar = 'الطبخ';
        } else {
            update.title_en = b.title + ' (EN)';
            update.title_ar = b.title + ' (AR)';
        }

        const patchRes = await fetch(`${url}/fmidtour_blog?id=eq.${b.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(update)
        });
        console.log('Updated blog:', b.title, patchRes.status);
    }

    // 2. Fetch Destinations
    const destRes = await fetch(`${url}/fmidtour_destinasi?select=*`, { headers });
    const dests = await destRes.json();
    for (let d of dests) {
        let update = {};
        if (d.name.includes('Curug')) {
            update.name_en = d.name.replace('Curug', 'Waterfall');
            update.name_ar = d.name.replace('Curug', 'شلال');
        } else if (d.name === 'Gunung Bromo') {
            update.name_en = 'Mount Bromo';
            update.name_ar = 'جبل برومو';
        } else if (d.name.includes('Kawah')) {
            update.name_en = d.name.replace('Kawah', 'Crater');
            update.name_ar = d.name.replace('Kawah', 'فوهة');
        } else {
            update.name_en = d.name; // Proper names stay the same
            update.name_ar = d.name;
        }

        await fetch(`${url}/fmidtour_destinasi?id=eq.${d.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(update)
        });
        console.log('Updated dest:', d.name);
    }

    // 3. Fetch Accommodations
    const accRes = await fetch(`${url}/fmidtour_akomodasi?select=*`, { headers });
    const accs = await accRes.json();
    for (let a of accs) {
        let update = {
            name_en: a.name,
            name_ar: a.name
        };
        await fetch(`${url}/fmidtour_akomodasi?id=eq.${a.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(update)
        });
        console.log('Updated acc:', a.name);
    }
}

run().catch(console.error);

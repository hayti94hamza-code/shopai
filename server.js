const express = require('express');
const cors = require('cors');
const Shopify = require('shopify-api-node');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Shopify credentials
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_SHOP_URL = process.env.SHOPIFY_SHOP_URL;

console.log('🛒 Shopify:', SHOPIFY_SHOP_URL || 'Not configured');

let shopify = null;
if (SHOPIFY_API_KEY && SHOPIFY_ACCESS_TOKEN && SHOPIFY_SHOP_URL) {
  shopify = new Shopify({
    shopName: SHOPIFY_SHOP_URL.replace('.myshopify.com', ''),
    apiKey: SHOPIFY_API_KEY,
    password: SHOPIFY_ACCESS_TOKEN
  });
}

// ===== REVIEW STORAGE =====
let allReviews = [];

// ===== GENERATE MOCK REVIEWS =====
function generateMockReviews(count = 500) {
  const firstNames = ['Khadija', 'Youssef', 'Fatima', 'Mohamed', 'Aicha', 'Omar', 'Nadia', 'Karim', 'Samira', 'Hassan', 'Zineb', 'Tariq', 'Salma', 'Nisrine', 'Imane', 'Adil'];
  const lastNames = ['El Hachimi', 'Benali', 'Alami', 'Fassi', 'Meknassi', 'Tazi', 'Berrada', 'Lahlou', 'Benjelloun', 'Kabbaj', 'Zniber', 'Mernissi', 'Bennani'];
  const expressions = ['تبارك الله سلعة نقية', 'ما شاء الله', 'الحمد لله', 'تبارك الرحمان', 'شكرا بزاف', 'بزاف عجبني', 'مزيان بزاف'];
  const texts = [
    'هاد المنتج رائع بزاف! جودة عالية وخدمة مزيانة. ننصح بيه لجميع الأصحاب.',
    'والله ما تندمش على الشراء. الجودة ممتازة والخدمة فوق الممتازة.',
    'من الأحسن اللي شريت هاد العام. السعر مناسب والجودة عالية. تبارك الله.',
    'حاجة مزينة بزاف! تجربة رائعة ومنتج يستحق الشراء.',
    'ما شاء الله، سلعة نقية وجودة عالية. الخدمة كانت مزيانة والتوصيل سريع.'
  ];

  const reviews = [];
  const productIds = [15841953907062, 15841953907063, 15841953907064, 15841953907065];
  const productTitles = [
    'JPG Le Beau Paradise Garden',
    'Armani Stronger With You',
    'Lancôme Idôle',
    'Acqua di Giò'
  ];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    
    const stars = Math.random() < 0.7 ? 5 : 4;
    const text = texts[Math.floor(Math.random() * texts.length)];
    const expression = expressions[Math.floor(Math.random() * expressions.length)];
    const productIndex = Math.floor(Math.random() * productIds.length);
    
    reviews.push({
      id: `review_${Date.now()}_${i}`,
      customer: {
        name: fullName,
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=128`,
        verified: Math.random() > 0.3
      },
      rating: stars,
      title: stars === 5 ? '⭐ Excellent!' : '✨ Very Good!',
      text: `${text} ${expression}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      productImage: `https://picsum.photos/seed/${i + 1}/400/400`,
      helpful: Math.floor(Math.random() * 40) + 5,
      productId: productIds[productIndex],
      productTitle: productTitles[productIndex]
    });
  }
  return reviews;
}

// ===== SHUFFLE FUNCTION =====
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===== ROUTES =====

// Root
app.get('/', (req, res) => {
  res.send('✅ NEFHARA Reviews Server is running! Visit <a href="/embed.html">/embed.html</a> for the admin dashboard.');
});

// Dashboard
app.get('/embed.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NEFHARA Reviews - Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .header h1 { font-size: 1.8rem; font-weight: 700; color: #1a1a1a; }
        .header .brand { color: #7c3aed; }
        .header .badge { background: #10b981; color: white; font-size: 0.75rem; padding: 4px 12px; border-radius: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .stat-card .number { font-size: 2rem; font-weight: 700; color: #7c3aed; }
        .stat-card .label { font-size: 0.85rem; color: #6b7280; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background: #7c3aed; color: white; }
        .btn-primary:hover { background: #6d28d9; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .widget-preview { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .widget-code { background: #1a1a1a; color: #10b981; padding: 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.85rem; overflow-x: auto; margin: 10px 0; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
        .copy-btn { background: #1a1a1a; color: white; border: 1px solid #374151; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
        .copy-btn:hover { background: #374151; }
        .toast { position: fixed; bottom: 20px; right: 20px; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; display: none; z-index: 1000; }
        @media (max-width: 640px) { .stats { grid-template-columns: 1fr; } .header { flex-direction: column; align-items: flex-start; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>✨ <span class="brand">NEFHARA</span> Reviews</h1>
                <span class="badge">v1.0</span>
            </div>
            <div>
                <span id="statusText" style="color:#10b981;">✅ Connected</span>
                <span style="margin-left:12px;color:#6b7280;" id="reviewCount">0 reviews</span>
            </div>
        </div>
        <div class="stats">
            <div class="stat-card">
                <div class="number" id="totalReviews">0</div>
                <div class="label">Total Reviews</div>
            </div>
            <div class="stat-card">
                <div class="number" id="productCount">0</div>
                <div class="label">Products with Reviews</div>
            </div>
            <div class="stat-card">
                <div class="number">⭐ 4-5</div>
                <div class="label">Star Rating Range</div>
            </div>
        </div>
        <div class="actions">
            <button class="btn btn-primary" onclick="generateReviews()">🚀 Generate 500 Reviews</button>
            <button class="btn btn-success" onclick="getWidgetCode()">📋 Get Widget Code</button>
            <button class="btn btn-danger" onclick="clearReviews()">🗑️ Clear Reviews</button>
        </div>
        <div class="widget-preview" id="widgetContainer">
            <div style="text-align:center;padding:2rem;color:#6b7280;">Click "Get Widget Code" to see the embed code</div>
        </div>
        <div id="codeContainer" style="display:none;margin-top:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:600;">📋 Widget Embed Code</span>
                <button class="copy-btn" onclick="copyCode()">📄 Copy Code</button>
            </div>
            <div class="widget-code" id="widgetCode">Loading...</div>
        </div>
    </div>
    <div class="toast" id="toast"></div>
    <script>
        const API_URL = window.location.origin;
        async function fetchStats() {
            try {
                const res = await fetch(\`\${API_URL}/api/reviews\`);
                const data = await res.json();
                document.getElementById('totalReviews').textContent = data.total || 0;
                const products = new Set(data.reviews?.map(r => r.productId) || []);
                document.getElementById('productCount').textContent = products.size;
                document.getElementById('reviewCount').textContent = \`\${data.total || 0} reviews\`;
            } catch (e) { console.error('Error fetching stats:', e); }
        }
        async function generateReviews() {
            const btn = event.target;
            btn.textContent = '⏳ Generating...';
            btn.disabled = true;
            try {
                const res = await fetch(\`\${API_URL}/api/generate-bulk\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ count: 500 })
                });
                const data = await res.json();
                showToast(\`✅ \${data.totalReviews} reviews generated!\`);
                fetchStats();
            } catch (e) { showToast('❌ Error generating reviews'); }
            finally { btn.textContent = '🚀 Generate 500 Reviews'; btn.disabled = false; }
        }
        async function clearReviews() {
            if (!confirm('Are you sure you want to clear all reviews?')) return;
            try {
                await fetch(\`\${API_URL}/api/clear-reviews\`, { method: 'POST' });
                showToast('🗑️ All reviews cleared');
                fetchStats();
                document.getElementById('widgetContainer').innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280;">No reviews available</div>';
                document.getElementById('codeContainer').style.display = 'none';
            } catch (e) { showToast('❌ Error clearing reviews'); }
        }
        async function getWidgetCode() {
            try {
                const res = await fetch(\`\${API_URL}/api/generate-widget\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: '15841953907062', productTitle: 'JPG Le Beau Paradise Garden' })
                });
                const data = await res.json();
                document.getElementById('widgetCode').textContent = data.widget;
                document.getElementById('codeContainer').style.display = 'block';
                showToast('✅ Widget code generated!');
            } catch (e) { showToast('❌ Error generating widget code'); }
        }
        function copyCode() {
            const code = document.getElementById('widgetCode').textContent;
            navigator.clipboard.writeText(code);
            showToast('📋 Code copied to clipboard!');
        }
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
        fetchStats();
    </script>
</body>
</html>`);
});

// ===== WIDGET CSS =====
app.get('/widget.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.send(`
    .nefhara-review-widget { max-width: 1200px; margin: 2rem auto; padding: 1.5rem; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
    .nefhara-review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #f3f4f6; }
    .nefhara-review-header h2 { font-size: 1.8rem; font-weight: 700; color: #1a1a1a; margin: 0; }
    .nefhara-review-header .badge { background: #10b981; color: white; font-size: 0.85rem; padding: 6px 16px; border-radius: 20px; }
    .nefhara-review-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .nefhara-review-card { background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0f0f0; transition: all 0.3s ease; }
    .nefhara-review-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .nefhara-review-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 0.75rem; }
    .nefhara-review-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }
    .nefhara-review-customer-name { font-weight: 700; font-size: 1.1rem; color: #1a1a1a; }
    .nefhara-review-stars { color: #fbbf24; font-size: 1.1rem; letter-spacing: 2px; }
    .nefhara-review-text { color: #374151; font-size: 1.05rem; line-height: 1.7; margin: 0.5rem 0; }
    .nefhara-review-product-image { margin-top: 0.75rem; border-radius: 8px; overflow: hidden; background: #f9fafb; border: 1px solid #f0f0f0; max-width: 200px; }
    .nefhara-review-product-image img { width: 100%; height: 150px; object-fit: cover; display: block; }
    .nefhara-review-footer { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 0.85rem; color: #9ca3af; }
    .nefhara-verified-badge { background: #dbeafe; color: #2563eb; font-size: 0.7rem; padding: 3px 10px; border-radius: 12px; margin-left: 8px; }
    .nefhara-refresh-button { background: #f3f4f6; color: #4b5563; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; }
    .nefhara-refresh-button:hover { background: #e5e7eb; }
    .nefhara-product-tag { display: inline-block; background: #f3e8ff; color: #7c3aed; font-size: 0.7rem; padding: 3px 12px; border-radius: 12px; margin-top: 4px; }
    @media (max-width: 640px) { .nefhara-review-grid { grid-template-columns: 1fr; } .nefhara-review-product-image { max-width: 100%; } .nefhara-review-header h2 { font-size: 1.4rem; } }
  `);
});

// ===== WIDGET JS =====
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    (function() {
      const API_URL = window.location.origin;
      function renderStars(rating) { let html = ''; for (let i = 1; i <= 5; i++) { html += i <= rating ? '★' : '☆'; } return html; }
      async function loadReviews() {
        const container = document.getElementById('nefhara-reviews-widget');
        if (!container) return;
        const productId = container.dataset.product || window.NEFHARA_PRODUCT_ID || '15841953907062';
        container.innerHTML = '<div style="text-align:center;padding:2rem;font-size:1.2rem;color:#6b7280;">Loading reviews...</div>';
        try {
          const response = await fetch(\`\${API_URL}/api/reviews/\${productId}?count=20\`);
          if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
          const data = await response.json();
          if (!data.success || data.reviews.length === 0) {
            container.innerHTML = '<div class="nefhara-review-widget"><div style="text-align:center;padding:2rem;color:#6b7280;font-size:1.2rem;">✨ No reviews available.</div></div>';
            return;
          }
          const reviews = data.reviews;
          let html = '<div class="nefhara-review-widget"><div class="nefhara-review-header"><h2>✨ Customer Reviews</h2><div><span class="badge">' + reviews.length + ' Reviews</span><button onclick="loadReviews()" class="nefhara-refresh-button" style="margin-left:10px;">↻ Refresh</button></div></div><div class="nefhara-review-grid">';
          reviews.forEach(review => {
            const productImage = review.productImage || '';
            html += '<div class="nefhara-review-card"><div class="nefhara-review-card-header"><img class="nefhara-review-avatar" src="' + review.customer.avatar + '" alt="' + review.customer.name + '"><div><div class="nefhara-review-customer-name">' + review.customer.name + (review.customer.verified ? '<span class="nefhara-verified-badge">✓ Verified</span>' : '') + '</div><div class="nefhara-review-stars">' + renderStars(review.rating) + '</div></div></div><div style="font-weight:700;font-size:1.1rem;margin:0.25rem 0;">' + review.title + '</div><div class="nefhara-review-text">' + review.text + '</div><div class="nefhara-product-tag">📦 ' + (review.productTitle || 'Product') + '</div>' + (productImage ? '<div class="nefhara-review-product-image"><img src="' + productImage + '" alt="Product photo" loading="lazy" /></div>' : '') + '<div class="nefhara-review-footer"><span>' + review.date + '</span><span>👍 ' + review.helpful + ' helpful</span></div></div>';
          });
          html += '</div></div>';
          container.innerHTML = html;
        } catch (error) {
          console.error('Error loading reviews:', error);
          container.innerHTML = '<div class="nefhara-review-widget"><div style="text-align:center;padding:2rem;color:#ef4444;font-size:1.2rem;">❌ Error loading reviews: ' + error.message + '<br><br><button onclick="loadReviews()" class="nefhara-refresh-button" style="margin-top:10px;">↻ Try Again</button></div></div>';
        }
      }
      if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', loadReviews); } else { setTimeout(loadReviews, 100); }
      window.loadReviews = loadReviews;
    })();
  `);
});

// ===== API ROUTES =====

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', reviews: allReviews.length });
});

// Clear reviews
app.post('/api/clear-reviews', (req, res) => {
  allReviews = [];
  res.json({ success: true, message: 'All reviews cleared' });
});

// Generate bulk reviews
app.post('/api/generate-bulk', (req, res) => {
  const count = req.body.count || 500;
  allReviews = generateMockReviews(count);
  res.json({ success: true, totalReviews: allReviews.length });
});

// Get reviews for a specific product - FIXED ROUTE
app.get('/api/reviews/:productId', (req, res) => {
  try {
    const productId = req.params.productId;
    const count = parseInt(req.query.count) || 20;
    
    let filteredReviews = allReviews;
    if (productId !== 'all') {
      filteredReviews = allReviews.filter(r => String(r.productId) === String(productId));
    }
    
    const shuffled = shuffleArray(filteredReviews);
    const selected = shuffled.slice(0, count);
    
    res.json({
      success: true,
      displayed: selected.length,
      totalAvailable: allReviews.length,
      productId: productId,
      reviews: selected
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reviews (admin)
app.get('/api/reviews', (req, res) => {
  res.json({ total: allReviews.length, reviews: allReviews });
});

// Get products from Shopify
app.get('/api/products', async (req, res) => {
  try {
    if (!shopify) { return res.status(500).json({ error: 'Shopify not configured' }); }
    const products = await shopify.product.list({ limit: 250, fields: 'id,title,images' });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate widget code
app.post('/api/generate-widget', (req, res) => {
  const { productId, productTitle } = req.body;
  const widgetCode = `
<!-- NEFHARA AI Reviews Widget -->
<div id="nefhara-reviews-widget" data-product="${productId || '15841953907062'}"></div>
<link rel="stylesheet" href="https://nefhara-reviews.onrender.com/widget.css" />
<script src="https://nefhara-reviews.onrender.com/widget.js" defer></script>
<script>
  window.NEFHARA_PRODUCT_ID = "${productId || '15841953907062'}";
  window.NEFHARA_PRODUCT_TITLE = "${productTitle || 'JPG Le Beau Paradise Garden'}";
</script>
`;
  res.json({ widget: widgetCode });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 NEFHARA Reviews Server running on http://localhost:${PORT}`);
  console.log(`🛒 Shopify: ${SHOPIFY_SHOP_URL || 'Not configured'}`);
  console.log(`📋 Total Reviews: ${allReviews.length}`);
  console.log(`\n✅ Ready!\n`);
});

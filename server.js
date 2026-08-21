require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Shopify = require('shopify-api-node');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// Shopify credentials
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_SHOP_URL = process.env.SHOPIFY_SHOP_URL;

// Initialize Shopify
const shopify = new Shopify({
  shopName: SHOPIFY_SHOP_URL.replace('.myshopify.com', ''),
  apiKey: SHOPIFY_API_KEY,
  password: SHOPIFY_ACCESS_TOKEN
});

console.log('🛒 Shopify connected:', SHOPIFY_SHOP_URL);

// ===== REVIEW STORAGE =====
let allReviews = [];

// ===== COUNTRY DATA =====
const countryData = {
  'Morocco': {
    firstNames: ['Khadija', 'Youssef', 'Fatima', 'Mohamed', 'Aicha', 'Omar', 'Nadia', 'Karim', 'Samira', 'Hassan', 'Zineb', 'Tariq', 'Salma', 'Nisrine', 'Imane', 'Adil', 'Rachid', 'Latifa', 'Mehdi', 'Sofia', 'Hamza', 'Leila'],
    lastNames: ['El Hachimi', 'Benali', 'Alami', 'Fassi', 'Meknassi', 'Tazi', 'Berrada', 'Lahlou', 'Benjelloun', 'Kabbaj', 'Zniber', 'Mernissi', 'Bennani', 'El Alaoui', 'Benchekroun', 'Slaoui', 'Cherkaoui'],
    expressions: ['تبارك الله سلعة نقية', 'ما شاء الله', 'الحمد لله', 'تبارك الرحمان', 'شكرا بزاف', 'بزاف عجبني', 'مزيان بزاف']
  },
  'France': {
    firstNames: ['Marie', 'Pierre', 'Sophie', 'Jean', 'Isabelle', 'Philippe', 'Catherine', 'Michel', 'Anne', 'François'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'],
    expressions: ['Excellent produit!', 'Vraiment top!', 'Je recommande', 'Qualité exceptionnelle']
  },
  'USA': {
    firstNames: ['Emma', 'James', 'Olivia', 'John', 'Ava', 'Michael', 'Sophia', 'William', 'Isabella', 'David'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'],
    expressions: ['Absolutely amazing!', 'Highly recommend!', 'Quality product!', 'Great value!']
  }
};

// ===== GENERATE MOCK REVIEW =====
function generateMockReview(productId, productTitle, productImage, country, index) {
  const data = countryData[country] || countryData['Morocco'];
  const firstName = data.firstNames[Math.floor(Math.random() * data.firstNames.length)];
  const lastName = data.lastNames[Math.floor(Math.random() * data.lastNames.length)];
  const fullName = `${firstName} ${lastName}`;

  const rand = Math.random();
  let stars = rand < 0.70 ? 5 : 4;

  const templates = {
    'Morocco': [
      `هاد ${productTitle} رائع بزاف! جودة عالية وخدمة مزيانة. ننصح بيه لجميع الأصحاب.`,
      `والله ما تندمش على الشراء. الجودة ممتازة والخدمة فوق الممتازة.`,
      `من الأحسن اللي شريت هاد العام. السعر مناسب والجودة عالية. تبارك الله.`,
      `حاجة مزينة بزاف! تجربة رائعة ومنتج يستحق الشراء. أنصح الجميع يقتنيه.`,
      `ما شاء الله، سلعة نقية وجودة عالية. الخدمة كانت مزيانة والتوصيل سريع.`
    ],
    'France': [
      `Ce ${productTitle} est fantastique! La qualité est exceptionnelle.`,
      `Je suis totalement satisfaite de mon achat. Le ${productTitle} est parfait.`
    ],
    'USA': [
      `This ${productTitle} is absolutely amazing! The quality is outstanding.`,
      `Best purchase I've made this year! The ${productTitle} is premium quality.`
    ]
  };

  const texts = templates[country] || templates['Morocco'];
  const text = texts[Math.floor(Math.random() * texts.length)];
  const expression = data.expressions[Math.floor(Math.random() * data.expressions.length)];

  let title = stars === 5 ? '⭐ Excellent!' : '✨ Very Good!';

  return {
    id: `review_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
    customer: {
      name: fullName,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=128`,
      verified: Math.random() > 0.3
    },
    rating: stars,
    title: title,
    text: `${text} ${expression}`,
    date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    helpful: Math.floor(Math.random() * 40) + 5,
    locale: { country, language: data.language || 'Moroccan Darija' },
    productId: productId,
    productTitle: productTitle,
    productImage: productImage
  };
}

// ===== GENERATE BULK REVIEWS =====
async function generateBulkReviews(count = 500, country = 'Morocco') {
  console.log(`\n📝 Generating ${count} reviews...`);
  
  let products = [];
  try {
    const shopifyProducts = await shopify.product.list({
      limit: 250,
      fields: 'id,title,images'
    });
    products = shopifyProducts.map(p => ({
      id: p.id,
      title: p.title,
      image: p.images && p.images.length > 0 ? p.images[0].src : null
    }));
    console.log(`🛒 Found ${products.length} products`);
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    return [];
  }

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const review = generateMockReview(randomProduct.id, randomProduct.title, randomProduct.image, country, i);
    reviews.push(review);
    if ((i + 1) % 50 === 0 || i === count - 1) {
      console.log(`   ✅ Generated ${i + 1}/${count}`);
    }
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

// ===== API ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', reviews: allReviews.length });
});

// Clear reviews
app.post('/api/clear-reviews', (req, res) => {
  allReviews = [];
  res.json({ success: true, message: 'All reviews cleared' });
});

// Generate bulk reviews
app.post('/api/generate-bulk', async (req, res) => {
  try {
    const { country = 'Morocco', count = 500 } = req.body;
    allReviews = await generateBulkReviews(count, country);
    res.json({
      success: true,
      totalReviews: allReviews.length,
      message: `Generated ${allReviews.length} reviews`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get 20 random reviews
app.get('/api/reviews/:productId', (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const randomReviews = shuffleArray(allReviews).slice(0, count);
    res.json({
      success: true,
      displayed: randomReviews.length,
      totalAvailable: allReviews.length,
      reviews: randomReviews
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
    const products = await shopify.product.list({
      limit: 250,
      fields: 'id,title,images,variants'
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate reviews for specific product
app.post('/api/generate-reviews', async (req, res) => {
  try {
    const { productId, country = 'Morocco', count = 20 } = req.body;
    
    const product = await shopify.product.get(productId);
    const productImage = product.images && product.images.length > 0 ? product.images[0].src : null;
    
    const reviews = [];
    for (let i = 0; i < count; i++) {
      const review = generateMockReview(productId, product.title, productImage, country, i);
      reviews.push(review);
    }
    allReviews = [...allReviews, ...reviews];
    
    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate widget code
app.post('/api/generate-widget', (req, res) => {
  const { productId, productTitle } = req.body;
  const widgetCode = `
<!-- NEFHARA AI Reviews Widget -->
<div id="nefhara-reviews-widget" data-product="${productId || ''}"></div>
<link rel="stylesheet" href="http://localhost:${PORT}/widget.css" />
<script src="http://localhost:${PORT}/widget.js" defer></script>
<script>
  window.NEFHARA_PRODUCT_ID = "${productId || ''}";
  window.NEFHARA_PRODUCT_TITLE = "${productTitle || ''}";
</script>
`;
  res.json({ widget: widgetCode });
});

// ===== WIDGET CSS =====
app.get('/widget.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.send(`
    .nefhara-review-widget {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 1.5rem;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    }
    .nefhara-review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f3f4f6;
    }
    .nefhara-review-header h2 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }
    .nefhara-review-header .badge {
      background: #10b981;
      color: white;
      font-size: 0.85rem;
      padding: 6px 16px;
      border-radius: 20px;
    }
    .nefhara-review-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .nefhara-review-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #f0f0f0;
      transition: all 0.3s ease;
    }
    .nefhara-review-card:hover {
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .nefhara-review-card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 0.75rem;
    }
    .nefhara-review-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      object-fit: cover;
    }
    .nefhara-review-customer-name {
      font-weight: 700;
      font-size: 1.1rem;
      color: #1a1a1a;
    }
    .nefhara-review-stars {
      color: #fbbf24;
      font-size: 1.1rem;
      letter-spacing: 2px;
    }
    .nefhara-review-text {
      color: #374151;
      font-size: 1.05rem;
      line-height: 1.7;
      margin: 0.5rem 0;
    }
    .nefhara-review-product-image {
      margin-top: 0.75rem;
      border-radius: 8px;
      overflow: hidden;
      background: #f9fafb;
      border: 1px solid #f0f0f0;
      max-width: 200px;
    }
    .nefhara-review-product-image img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }
    .nefhara-review-footer {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #9ca3af;
    }
    .nefhara-verified-badge {
      background: #dbeafe;
      color: #2563eb;
      font-size: 0.7rem;
      padding: 3px 10px;
      border-radius: 12px;
      margin-left: 8px;
    }
    .nefhara-refresh-button {
      background: #f3f4f6;
      color: #4b5563;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    .nefhara-refresh-button:hover {
      background: #e5e7eb;
    }
    .nefhara-product-tag {
      display: inline-block;
      background: #f3e8ff;
      color: #7c3aed;
      font-size: 0.7rem;
      padding: 3px 12px;
      border-radius: 12px;
      margin-top: 4px;
    }
    @media (max-width: 640px) {
      .nefhara-review-grid { grid-template-columns: 1fr; }
      .nefhara-review-product-image { max-width: 100%; }
      .nefhara-review-header h2 { font-size: 1.4rem; }
    }
  `);
});

// ===== WIDGET JS =====
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    (function() {
      const API_URL = 'http://localhost:5001';
      
      function renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
          html += i <= rating ? '★' : '☆';
        }
        return html;
      }

      async function loadReviews() {
        const container = document.getElementById('nefhara-reviews-widget');
        if (!container) return;
        
        const productId = container.dataset.product || window.NEFHARA_PRODUCT_ID || 'all';
        
        container.innerHTML = '<div style="text-align:center;padding:2rem;font-size:1.2rem;color:#6b7280;">Loading reviews...</div>';
        
        try {
          const response = await fetch(\`\${API_URL}/api/reviews/\${productId}?count=20\`);
          const data = await response.json();
          
          if (!data.success || data.reviews.length === 0) {
            container.innerHTML = \`
              <div class="nefhara-review-widget">
                <div style="text-align:center;padding:2rem;color:#6b7280;font-size:1.2rem;">
                  ✨ No reviews yet. Generate reviews from the admin panel.
                </div>
              </div>
            \`;
            return;
          }

          const reviews = data.reviews;
          
          let html = \`
            <div class="nefhara-review-widget">
              <div class="nefhara-review-header">
                <h2>✨ Customer Reviews</h2>
                <div>
                  <span class="badge">\${reviews.length} Reviews</span>
                  <button onclick="loadReviews()" class="nefhara-refresh-button" style="margin-left:10px;">↻ Refresh</button>
                </div>
              </div>
              <div class="nefhara-review-grid">
          \`;

          reviews.forEach(review => {
            const productImage = review.productImage || '';
            html += \`
              <div class="nefhara-review-card">
                <div class="nefhara-review-card-header">
                  <img class="nefhara-review-avatar" src="\${review.customer.avatar}" alt="\${review.customer.name}">
                  <div>
                    <div class="nefhara-review-customer-name">
                      \${review.customer.name}
                      \${review.customer.verified ? '<span class="nefhara-verified-badge">✓ Verified</span>' : ''}
                    </div>
                    <div class="nefhara-review-stars">\${renderStars(review.rating)}</div>
                  </div>
                </div>
                <div style="font-weight:700;font-size:1.1rem;margin:0.25rem 0;">\${review.title}</div>
                <div class="nefhara-review-text">\${review.text}</div>
                <div class="nefhara-product-tag">📦 \${review.productTitle || 'Product'}</div>
                \${productImage ? '<div class="nefhara-review-product-image"><img src="' + productImage + '" alt="Product photo" loading="lazy" /></div>' : ''}
                <div class="nefhara-review-footer">
                  <span>\${review.date}</span>
                  <span>👍 \${review.helpful} helpful</span>
                </div>
              </div>
            \`;
          });

          html += \`</div></div>\`;
          container.innerHTML = html;
          
        } catch (error) {
          console.error('Error loading reviews:', error);
          container.innerHTML = \`
            <div class="nefhara-review-widget">
              <div style="text-align:center;padding:2rem;color:#ef4444;font-size:1.2rem;">
                ❌ Error loading reviews. Make sure the server is running.
              </div>
            </div>
          \`;
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadReviews);
      } else {
        loadReviews();
      }

      window.loadReviews = loadReviews;
    })();
  `);
});

// Serve the embed.html page
app.get('/embed.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'embed.html'));
});

// Root route
app.get('/', (req, res) => {
  res.send('NEFHARA Reviews App - Visit /embed.html for the admin dashboard');
});

app.listen(PORT, () => {
  console.log(`\n🚀 NEFHARA Reviews Server running on http://localhost:${PORT}`);
  console.log(`🛒 Shopify: ${SHOPIFY_SHOP_URL}`);
  console.log(`📋 Admin Dashboard: http://localhost:${PORT}/embed.html`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/generate-bulk - Generate 500 reviews`);
  console.log(`   GET  /api/reviews/:id - Get 20 random reviews`);
  console.log(`   GET  /api/products - Get Shopify products`);
  console.log(`\n✅ Ready!\n`);
});

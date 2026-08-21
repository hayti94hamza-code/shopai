const express = require('express');
const cors = require('cors');
const path = require('path');
const Shopify = require('shopify-api-node');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== EXPLICIT ROUTE FOR embed.html =====
app.get('/embed.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'embed.html'));
});

// ===== EXPLICIT ROUTE FOR widget.css =====
app.get('/widget.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.css'));
});

// ===== EXPLICIT ROUTE FOR widget.js =====
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.js'));
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NEFHARA Reviews</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f9fafb; color: #1a1a1a; }
        .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; }
        h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .brand { color: #7c3aed; }
        .status { display: inline-block; background: #10b981; color: white; padding: 4px 16px; border-radius: 20px; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px; }
        .btn:hover { background: #6d28d9; }
        .features { text-align: left; margin: 24px 0; padding: 0; list-style: none; }
        .features li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .features li:last-child { border-bottom: none; }
        .emoji { margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>✨ <span class="brand">NEFHARA</span> Reviews</h1>
        <div class="status">✅ Live</div>
        <p style="color: #6b7280; font-size: 1.1rem;">
          AI-powered customer reviews for your Shopify store
        </p>
        <div>
          <a href="/embed.html" class="btn">📊 Open Dashboard</a>
        </div>
        <ul class="features">
          <li><span class="emoji">⭐</span> 500+ AI-generated reviews</li>
          <li><span class="emoji">🎲</span> 20 random reviews per product page</li>
          <li><span class="emoji">🇲🇦</span> Moroccan names + Arabic script</li>
          <li><span class="emoji">📸</span> Product images included</li>
        </ul>
        <p style="color: #9ca3af; font-size: 0.85rem; margin-top: 1.5rem;">
          © 2026 NEFHARA • Made with ❤️
        </p>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    reviews: allReviews ? allReviews.length : 0,
    timestamp: new Date().toISOString() 
  });
});

// ===== SHOPIFY SETUP =====
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
  
  if (!shopify) {
    console.error('❌ Shopify not configured. Cannot fetch products.');
    return [];
  }
  
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
    console.error('❌ Generate error:', error);
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
    if (!shopify) {
      return res.status(500).json({ error: 'Shopify not configured' });
    }
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
    
    if (!shopify) {
      return res.status(500).json({ error: 'Shopify not configured' });
    }
    
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
<link rel="stylesheet" href="https://nefahara-reviews.onrender.com/widget.css" />
<script src="https://nefahara-reviews.onrender.com/widget.js" defer></script>
<script>
  window.NEFHARA_PRODUCT_ID = "${productId || ''}";
  window.NEFHARA_PRODUCT_TITLE = "${productTitle || ''}";
</script>
`;
  res.json({ widget: widgetCode });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 NEFHARA Reviews Server running on http://localhost:${PORT}`);
  console.log(`🛒 Shopify: ${SHOPIFY_SHOP_URL || 'Not configured'}`);
  console.log(`📋 Admin Dashboard: http://localhost:${PORT}/embed.html`);
  console.log(`\n✅ Ready!\n`);
});

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBXVrbfucAyj9wud-sY2BaO2mLO8JaeeQE",
    authDomain: "ship-53cd8.firebaseapp.com",
    databaseURL: "https://ship-53cd8-default-rtdb.firebaseio.com",
    projectId: "ship-53cd8",
    storageBucket: "ship-53cd8.firebasestorage.app",
    messagingSenderId: "682363394250",
    appId: "1:682363394250:web:705c36de45058f4a26bc33"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// State
let cart = JSON.parse(localStorage.getItem('aarush_luxury_cart')) || [];
let products = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
});

// Fetch Products
function fetchProducts() {
    const grid = document.getElementById('product-grid');
    database.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        products = [];
        grid.innerHTML = '';
        if (data) {
            Object.keys(data).forEach(id => {
                const p = data[id];
                p.id = id;
                products.push(p);
                renderProduct(p);
            });
        } else {
            grid.innerHTML = '<div class="col-span-4 text-center py-20 opacity-50">Our vault is being restocked...</div>';
        }
    });
}

function renderProduct(p) {
    const isOutOfStock = p.stock <= 0;
    const isLowStock = p.stock > 0 && p.stock <= 5;
    const grid = document.getElementById('product-grid');
    
    const card = `
        <div class="product-card group" data-aos="fade-up">
            <div class="relative overflow-hidden rounded-[30px] aspect-[4/5] bg-gray-100">
                <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="img-overlay absolute inset-0 flex items-center justify-center">
                    ${!isOutOfStock ? `
                        <button onclick="addToCart('${p.id}')" class="bg-white text-luxuryGreen font-bold px-8 py-3 rounded-full uppercase tracking-widest text-xs transform translate-y-10 group-hover:translate-y-0 transition-all duration-500 shadow-2xl">
                            Add to Bag
                        </button>
                    ` : ''}
                </div>
                ${isOutOfStock ? '<div class="absolute top-6 left-6 bg-black text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">Out of Stock</div>' : ''}
                ${isLowStock ? '<div class="absolute top-6 left-6 bg-red-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">Limited Supply</div>' : ''}
            </div>
            <div class="mt-8 text-center">
                <h3 class="text-xl font-['Playfair_Display'] font-bold mb-2">${p.name}</h3>
                <p class="text-gold font-bold tracking-widest text-sm">₹${p.price.toLocaleString()}</p>
            </div>
        </div>
    `;
    grid.innerHTML += card;
}

// Cart Logic
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    const content = document.getElementById('cart-content');
    
    if (drawer.classList.contains('invisible')) {
        drawer.classList.remove('invisible');
        setTimeout(() => {
            overlay.classList.add('opacity-100');
            content.classList.remove('translate-x-full');
        }, 10);
    } else {
        overlay.classList.remove('opacity-100');
        content.classList.add('translate-x-full');
        setTimeout(() => drawer.classList.add('invisible'), 500);
    }
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (product.stock <= 0) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.qty < product.stock) {
            existing.qty++;
        } else {
            alert('This is the last available unit of this rare formulation.');
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    toggleCart();
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const product = products.find(p => p.id === id);
    
    if (delta > 0 && item.qty >= product.stock) return;
    
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

function updateCartUI() {
    localStorage.setItem('aarush_luxury_cart', JSON.stringify(cart));
    const list = document.getElementById('cart-items');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    
    countEl.innerText = cart.reduce((acc, i) => acc + i.qty, 0);
    let total = 0;
    list.innerHTML = '';
    
    cart.forEach(item => {
        total += item.price * item.qty;
        list.innerHTML += `
            <div class="flex gap-6 items-center border-b border-gray-100 pb-6">
                <img src="${item.image}" class="w-20 h-20 object-cover rounded-2xl">
                <div class="flex-1">
                    <h4 class="font-['Playfair_Display'] font-bold text-sm mb-1">${item.name}</h4>
                    <p class="text-gold text-xs font-bold mb-3">₹${item.price.toLocaleString()}</p>
                    <div class="flex items-center gap-4">
                        <button onclick="updateQty('${item.id}', -1)" class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white transition-all">-</button>
                        <span class="text-xs font-bold">${item.qty}</span>
                        <button onclick="updateQty('${item.id}', 1)" class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white transition-all">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    totalEl.innerText = `₹${total.toLocaleString()}`;
    if (cart.length === 0) {
        list.innerHTML = '<div class="text-center py-20 opacity-30 text-sm tracking-widest">YOUR SELECTION IS EMPTY</div>';
    }
}

// Checkout
function showCheckout() {
    if (cart.length === 0) return alert('Your selection bag is empty.');
    toggleCart();
    document.getElementById('checkout-modal').classList.remove('hidden');
    
    const summary = document.getElementById('checkout-summary');
    let total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    summary.innerHTML = `
        <div class="flex justify-between font-bold text-gray-400 uppercase tracking-widest mb-4">
            <span>Items Bag</span>
            <span>Subtotal</span>
        </div>
        ${cart.map(i => `<div class="flex justify-between mb-2"><span>${i.name} (x${i.qty})</span><span>₹${(i.price * i.qty).toLocaleString()}</span></div>`).join('')}
        <div class="border-t border-gray-200 mt-4 pt-4 flex justify-between text-lg font-bold text-luxuryGreen">
            <span>TOTAL</span>
            <span class="text-gold">₹${total.toLocaleString()}</span>
        </div>
    `;
}

function hideCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> AUTHORIZING...';

    const orderId = 'AA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    
    const orderData = {
        orderId,
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        address: document.getElementById('cust-address').value,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        status: "New",
        time: new Date().toLocaleString()
    };

    try {
        // Save Order
        await database.ref('orders').push(orderData);

        // Update Stock
        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            const newStock = product.stock - item.qty;
            await database.ref('products/' + item.id).update({ stock: newStock });
        }

        // Telegram Alert
        await sendTelegram(orderData);

        // Success
        cart = [];
        updateCartUI();
        hideCheckout();
        document.getElementById('order-form').reset();
        
        document.getElementById('success-modal').classList.remove('hidden');
        document.getElementById('success-msg').innerText = `Your order ${orderId} has been successfully authorized for premium dispatch.`;
        setTimeout(() => document.getElementById('success-card').classList.add('show'), 100);

    } catch (err) {
        console.error(err);
        alert('Authorization failed. Please contact your premium concierge.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'PLACE YOUR ORDER <i class="fa-solid fa-arrow-right"></i>';
    }
});

function closeSuccess() {
    document.getElementById('success-card').classList.remove('show');
    setTimeout(() => document.getElementById('success-modal').classList.add('hidden'), 500);
}

async function sendTelegram(order) {
    const BOT_TOKEN = "8519947258:AAGJzcVNkJXGndbc1O9C2e_rNgQWAleNhFY";
    const CHAT_ID = "6820660513";
    
    let itemsText = order.items.map(i => `• ${i.name} (x${i.qty})`).join('\n');
    
    const message = `
🌟 *NEW PREMIUM ORDER: ${order.orderId}*
---------------------------------------
👤 *Customer:* ${order.name}
📞 *Phone:* ${order.phone}
📧 *Email:* ${order.email}
📍 *Address:* ${order.address}

📦 *Items Ordered:*
${itemsText}

💰 *Total Amount:* ₹${order.total.toLocaleString()}
💳 *Method:* ${order.paymentMethod}
⏰ *Time:* ${order.time}
---------------------------------------
Aarush Ayurveda Elite Dashboard
    `;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    });
}

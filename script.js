/**
 * Aarush Ayurveda - Core Application Script
 * GitHub Pages Compatible - No ES Modules
 */

// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyBXVrbfucAyj9wud-sY2BaO2mLO8JaeeQE",
    authDomain: "ship-53cd8.firebaseapp.com",
    databaseURL: "https://ship-53cd8-default-rtdb.firebaseio.com",
    projectId: "ship-53cd8",
    storageBucket: "ship-53cd8.firebasestorage.app",
    messagingSenderId: "682363394250",
    appId: "1:682363394250:web:705c36de45058f4a26bc33"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State Management
let cart = JSON.parse(localStorage.getItem('aarush_cart')) || [];
let products = [];

// DOM Elements
const productList = document.getElementById('product-list');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutModal = document.getElementById('checkout-modal');
const orderForm = document.getElementById('order-form');

// Initialization
window.onload = () => {
    fetchProducts();
    updateCartUI();
};

// --- Store Functions ---

async function fetchProducts() {
    db.ref('products').on('value', (snapshot) => {
        products = [];
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(id => {
                products.push({ id, ...data[id] });
            });
            renderProducts();
        } else {
            productList.innerHTML = `<div class="col-span-full text-center py-10">Our herbal treasures are being prepared. Check back soon!</div>`;
        }
    });
}

function renderProducts() {
    productList.innerHTML = products.map(p => `
        <div class="product-card bg-white rounded-2xl overflow-hidden border border-stone-100 flex flex-col h-full" data-aos="fade-up">
            <div class="relative overflow-hidden group">
                <img src="${p.image}" alt="${p.name}" class="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110">
                ${p.stock <= 0 ? '<div class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold uppercase tracking-widest text-sm">Out of Stock</div>' : ''}
            </div>
            <div class="p-6 flex flex-col flex-1">
                <h3 class="text-xl font-bold text-primary font-['Playfair_Display'] mb-2">${p.name}</h3>
                <p class="text-stone-500 text-sm mb-4 flex-1 line-clamp-2">${p.description}</p>
                <div class="flex items-center justify-between mt-auto">
                    <span class="text-lg font-bold text-primary">₹${p.price}</span>
                    <button 
                        onclick="addToCart('${p.id}')" 
                        ${p.stock <= 0 ? 'disabled' : ''}
                        class="bg-gold text-primary p-3 rounded-lg hover:bg-primary hover:text-white transition-all disabled:bg-gray-200 disabled:text-gray-400">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- Cart Functions ---

function toggleCart() {
    cartDrawer.classList.toggle('active');
    cartDrawer.classList.toggle('invisible');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
        } else {
            alert('Limit reached for current stock.');
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    if (!cartDrawer.classList.contains('active')) toggleCart();
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const product = products.find(p => p.id === id);

    if (item) {
        if (delta > 0 && item.quantity >= product.stock) {
            alert('Insufficient stock.');
            return;
        }
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    saveCart();
    updateCartUI();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('aarush_cart', JSON.stringify(cart));
}

function updateCartUI() {
    cartCount.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="text-center py-20 text-gray-400">Your bag is as light as air.</div>`;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
                <div class="flex items-center space-x-4 border-b border-stone-100 pb-4">
                    <img src="${item.image}" class="w-16 h-16 object-cover rounded-lg">
                    <div class="flex-1">
                        <h4 class="font-bold text-primary text-sm">${item.name}</h4>
                        <p class="text-gold font-semibold text-sm">₹${item.price}</p>
                        <div class="flex items-center space-x-3 mt-2">
                            <button onclick="updateQty('${item.id}', -1)" class="w-6 h-6 border flex items-center justify-center rounded hover:bg-stone-100">-</button>
                            <span class="text-sm font-bold">${item.quantity}</span>
                            <button onclick="updateQty('${item.id}', 1)" class="w-6 h-6 border flex items-center justify-center rounded hover:bg-stone-100">+</button>
                        </div>
                    </div>
                    <button onclick="removeItem('${item.id}')" class="text-stone-300 hover:text-red-500 transition"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
        }).join('');
    }
    cartTotal.innerText = `₹${total}`;
}

// --- Checkout Functions ---

function showCheckout() {
    if (cart.length === 0) return alert('Your cart is empty.');
    toggleCart();
    checkoutModal.classList.remove('hidden');
    renderOrderSummary();
}

function hideCheckout() {
    checkoutModal.classList.add('hidden');
}

function renderOrderSummary() {
    const summary = document.getElementById('order-summary');
    let total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    
    summary.innerHTML = `
        <div class="font-bold text-primary mb-2">Order Summary</div>
        ${cart.map(i => `
            <div class="flex justify-between">
                <span>${i.name} × ${i.quantity}</span>
                <span>₹${i.price * i.quantity}</span>
            </div>
        `).join('')}
        <div class="flex justify-between font-bold text-primary pt-2 border-t mt-2">
            <span>Payable Amount</span>
            <span>₹${total}</span>
        </div>
    `;
}

orderForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const loader = document.getElementById('loader');

    btn.disabled = true;
    loader.classList.remove('hidden');

    const orderData = {
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        address: document.getElementById('cust-address').value,
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        status: "New",
        time: new Date().toLocaleString()
    };

    try {
        // Save to Firebase
        const orderId = db.ref('orders').push().key;
        await db.ref('orders/' + orderId).set(orderData);

        // Update Stock
        for (const item of cart) {
            const productRef = db.ref('products/' + item.id);
            const snapshot = await productRef.once('value');
            const currentStock = snapshot.val().stock;
            await productRef.update({ stock: Math.max(0, currentStock - item.quantity) });
        }

        // Telegram Alert
        await sendTelegramAlert(orderData);

        alert('Success! Your order has been placed. Our wellness experts will contact you soon.');
        cart = [];
        saveCart();
        updateCartUI();
        hideCheckout();
        orderForm.reset();
    } catch (err) {
        console.error(err);
        alert('Order processing failed. Please try again.');
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
};

async function sendTelegramAlert(order) {
    const botToken = "8519947258:AAGJzcVNkJXGndbc1O9C2e_rNgQWAleNhFY";
    const chatId = "6820660513";
    const itemsText = order.items.map(i => `${i.name} (x${i.quantity})`).join('\n');
    
    const message = `🌿 *New Order Received*\n` +
                    `----------------------\n` +
                    `👤 *Customer:* ${order.name}\n` +
                    `📞 *Phone:* ${order.phone}\n` +
                    `📧 *Email:* ${order.email}\n` +
                    `📍 *Address:* ${order.address}\n\n` +
                    `📦 *Items:*\n${itemsText}\n\n` +
                    `💰 *Total:* ₹${order.total}\n` +
                    `💳 *Method:* ${order.paymentMethod}\n` +
                    `⏰ *Time:* ${order.time}`;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) { console.error("Telegram alert failed"); }
}

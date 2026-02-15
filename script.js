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

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let products = [];
let cart = JSON.parse(localStorage.getItem('aarush_cart')) || [];

// Core Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
});

// Fetch Products from Firebase
function fetchProducts() {
    const list = document.getElementById('product-list');
    db.ref('products').on('value', (snapshot) => {
        products = [];
        list.innerHTML = '';
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(id => {
                const p = data[id];
                p.id = id;
                products.push(p);
                
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock < 5;
                
                list.innerHTML += `
                    <div class="p-card bg-white rounded-[30px] overflow-hidden border border-stone-100 flex flex-col h-full group">
                        <div class="relative overflow-hidden aspect-[4/5]">
                            <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                            ${isOutOfStock ? '<div class="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] uppercase tracking-widest font-bold">Sold Out</div>' : ''}
                            ${isLowStock ? '<div class="absolute top-4 left-4 bg-orange-500 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Limited Supply</div>' : ''}
                        </div>
                        <div class="p-8 flex flex-col flex-1">
                            <h3 class="text-xl font-bold text-primary font-['Playfair_Display'] mb-2">${p.name}</h3>
                            <p class="text-stone-400 text-xs mb-6 flex-1 leading-relaxed">${p.description}</p>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="text-xl font-bold text-gold font-['Playfair_Display']">₹${p.price}</span>
                                <button onclick="addToCart('${p.id}')" ${isOutOfStock ? 'disabled' : ''} 
                                    class="bg-primary text-gold p-4 rounded-2xl hover:bg-gold hover:text-primary transition-all disabled:opacity-20">
                                    <i class="fa-solid fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            list.innerHTML = `<div class="col-span-full text-center py-20 opacity-50 italic">The inventory is currently being replenished...</div>`;
        }
    });
}

// Cart Logic
function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('active');
}

function addToCart(id) {
    const p = products.find(prod => prod.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity < p.stock) existing.quantity++;
        else return alert("Maximum available stock reached.");
    } else {
        cart.push({ ...p, quantity: 1 });
    }
    saveCart();
    if (!document.getElementById('cart-drawer').classList.contains('active')) toggleCart();
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const p = products.find(prod => prod.id === id);
    
    if (item) {
        if (delta > 0 && item.quantity >= p.stock) return alert("Insufficient stock.");
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    }
    saveCart();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
}

function saveCart() {
    localStorage.setItem('aarush_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    list.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;
        list.innerHTML += `
            <div class="flex items-center gap-5 border-b border-stone-100 pb-5">
                <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl shadow-sm">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-primary leading-tight mb-1">${item.name}</h4>
                    <p class="text-gold font-bold text-xs mb-2">₹${item.price}</p>
                    <div class="flex items-center space-x-3">
                        <button onclick="updateQty('${item.id}', -1)" class="w-6 h-6 border rounded-lg flex items-center justify-center hover:bg-stone-50">-</button>
                        <span class="text-xs font-bold">${item.quantity}</span>
                        <button onclick="updateQty('${item.id}', 1)" class="w-6 h-6 border rounded-lg flex items-center justify-center hover:bg-stone-50">+</button>
                    </div>
                </div>
                <button onclick="removeItem('${item.id}')" class="text-stone-300 hover:text-red-500 transition"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });

    if (cart.length === 0) list.innerHTML = `<p class="text-center py-20 text-stone-300 italic">Your bag is as light as air...</p>`;
    
    totalEl.innerText = `₹${total}`;
    countEl.innerText = count;
}

// Checkout Flow
function showCheckout() {
    if (cart.length === 0) return alert("Select your treasures first.");
    toggleCart();
    document.getElementById('checkout-modal').classList.remove('hidden');
    renderSummary();
}

function hideCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

function renderSummary() {
    const box = document.getElementById('checkout-summary');
    let total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    box.innerHTML = `
        <div class="font-bold text-primary text-xs uppercase tracking-widest mb-4">Summary</div>
        ${cart.map(i => `<div class="flex justify-between"><span>${i.name} (x${i.quantity})</span><span>₹${i.price * i.quantity}</span></div>`).join('')}
        <div class="border-t border-gold/10 pt-4 mt-2 flex justify-between font-bold text-primary text-lg">
            <span>Payable</span><span>₹${total}</span>
        </div>
    `;
}

// Order Submission
document.getElementById('order-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const loader = document.getElementById('loader');
    
    btn.disabled = true;
    loader.classList.remove('hidden');

    const orderId = 'AA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    
    const orderData = {
        orderId,
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        address: document.getElementById('cust-address').value,
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: total,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        status: "New",
        time: new Date().toLocaleString()
    };

    try {
        // 1. Save to Firebase
        await db.ref('orders').push(orderData);

        // 2. Reduce Stock
        for (const item of cart) {
            const pRef = db.ref('products/' + item.id);
            const snapshot = await pRef.once('value');
            const currentStock = snapshot.val().stock;
            await pRef.update({ stock: Math.max(0, currentStock - item.quantity) });
        }

        // 3. Telegram Alert
        await sendTelegram(orderData);

        // 4. Success Handling
        document.getElementById('success-oid').innerText = orderId;
        document.getElementById('success-modal').classList.remove('hidden');
        cart = [];
        saveCart();
    } catch (err) {
        alert("Authorization failed. Please contact heritage support.");
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
};

async function sendTelegram(order) {
    const bot = "8519947258:AAGJzcVNkJXGndbc1O9C2e_rNgQWAleNhFY";
    const chat = "6820660513";
    const itemsText = order.items.map(i => `${i.name} (x${i.quantity})`).join('\n');
    const msg = `🌿 *New Order Confirmed: ${order.orderId}*\n\n👤 *Customer:* ${order.name}\n📞 *Phone:* ${order.phone}\n📍 *Address:* ${order.address}\n\n📦 *Items:*\n${itemsText}\n\n💰 *Total:* ₹${order.total}\n💳 *Payment:* ${order.paymentMethod}`;

    await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: 'Markdown' })
    });
}

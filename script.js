// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXVrbfucAyj9wud-sY2BaO2mLO8JaeeQE",
    authDomain: "ship-53cd8.firebaseapp.com",
    databaseURL: "https://ship-53cd8-default-rtdb.firebaseio.com",
    projectId: "ship-53cd8",
    storageBucket: "ship-53cd8.firebasestorage.app",
    messagingSenderId: "682363394250",
    appId: "1:682363394250:web:705c36de45058f4a26bc33"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Product Data
const products = [
    { id: 1, name: "Premium Hair Vitalizer", price: 899, image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=400" },
    { id: 2, name: "Pure Himalayan Shilajit", price: 1499, image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400" },
    { id: 3, name: "Glow Boost Face Serum", price: 749, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400" },
    { id: 4, name: "Ashwagandha Gold", price: 999, image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400" }
];

let cart = JSON.parse(localStorage.getItem('aarush_cart')) || [];

// Render Products
function renderProducts() {
    const productGrid = document.getElementById('product-list');
    productGrid.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-xl shadow-lg overflow-hidden group" data-aos="fade-up">
            <div class="relative overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-64 object-cover transition duration-500 group-hover:scale-110">
                <button onclick="addToCart(${product.id})" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1b4332] text-white px-6 py-2 rounded-full opacity-0 group-hover:opacity-100 transition duration-300">
                    Add to Cart
                </button>
            </div>
            <div class="p-6 text-center">
                <h3 class="text-xl font-bold text-[#1b4332] mb-2">${product.name}</h3>
                <p class="text-[#d4af37] font-bold text-lg">₹${product.price}</p>
            </div>
        </div>
    `).join('');
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
}

function updateCart() {
    localStorage.setItem('aarush_cart', JSON.stringify(cart));
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    let total = 0;
    let count = 0;

    cartItems.innerHTML = cart.map((item, index) => {
        total += item.price * item.quantity;
        count += item.quantity;
        return `
            <div class="flex items-center gap-4 border-b pb-4">
                <img src="${item.image}" class="w-16 h-16 object-cover rounded">
                <div class="flex-1">
                    <h4 class="font-bold text-sm">${item.name}</h4>
                    <p class="text-xs text-gray-500">₹${item.price}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <button onclick="changeQty(${index}, -1)" class="w-6 h-6 border rounded">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQty(${index}, 1)" class="w-6 h-6 border rounded">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-500"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');

    cartCount.innerText = count;
    cartTotal.innerText = `₹${total}`;
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) return removeFromCart(index);
    updateCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('hidden');
}

// Checkout Logic
function toggleCheckout() {
    document.getElementById('checkout-modal').classList.toggle('hidden');
}

function openCheckout() {
    if (cart.length === 0) return alert("Your cart is empty!");
    toggleCart();
    toggleCheckout();
    renderSummary();
}

function renderSummary() {
    const summary = document.getElementById('order-summary');
    let total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    summary.innerHTML = `
        <p class="font-bold border-b pb-2 mb-2">Order Summary</p>
        ${cart.map(item => `<div class="flex justify-between"><span>${item.name} (x${item.quantity})</span><span>₹${item.price * item.quantity}</span></div>`).join('')}
        <div class="flex justify-between font-bold mt-2 border-t pt-2"><span>Total</span><span>₹${total}</span></div>
    `;
}

// Handle Order Submission
async function handleOrder(e) {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner mx-auto"></div>';

    const orderData = {
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        address: document.getElementById('cust-address').value,
        items: cart,
        total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        status: "New",
        time: new Date().toLocaleString()
    };

    try {
        // Save to Firebase
        const orderRef = database.ref('orders').push();
        await orderRef.set(orderData);

        // Send Telegram Alert
        await sendTelegramAlert(orderData);

        alert("Order Placed Successfully!");
        cart = [];
        updateCart();
        toggleCheckout();
        document.getElementById('checkout-form').reset();
    } catch (error) {
        console.error(error);
        alert("Something went wrong. Please try again.");
    } finally {
        btn.disabled = false;
        btn.innerText = "PLACE ORDER";
    }
}

async function sendTelegramAlert(order) {
    const BOT_TOKEN = "8519947258:AAGJzcVNkJXGndbc1O9C2e_rNgQWAleNhFY";
    const CHAT_ID = "6820660513";
    
    let itemDetails = order.items.map(i => `${i.name} (x${i.quantity})`).join('\n');
    
    const text = `
🌿 *New Order - Aarush Ayurveda* 🌿
--------------------------
👤 *Customer:* ${order.name}
📞 *Phone:* ${order.phone}
📧 *Email:* ${order.email}
📍 *Address:* ${order.address}
--------------------------
📦 *Items:*
${itemDetails}
--------------------------
💰 *Total:* ₹${order.total}
💳 *Method:* ${order.paymentMethod}
--------------------------
⏰ *Time:* ${order.time}
    `;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        })
    });
}

// Init
renderProducts();
updateCart();

/**
 * SECURITY NOTE: 
 * 1. Firebase Rules should restrict write access to authorized domains only.
 * 2. In a production environment, the Telegram bot token should be called via 
 *    a secure backend/serverless function to prevent client-side exposure.
 */

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

let cart = JSON.parse(localStorage.getItem('aarush_cart')) || [];
let allProducts = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
});

// Fetch Products from Firebase
function fetchProducts() {
    const grid = document.getElementById('product-grid');
    db.ref('products').on('value', (snapshot) => {
        grid.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            grid.innerHTML = '<p class="text-center w-100">No products available.</p>';
            return;
        }

        allProducts = [];
        Object.keys(data).forEach(id => {
            const p = data[id];
            p.id = id;
            allProducts.push(p);
            
            const isOut = p.stock <= 0;
            grid.innerHTML += `
                <div class="product-card" data-aos="fade-up">
                    ${isOut ? '<span class="out-of-stock">Sold Out</span>' : ''}
                    <img src="${p.image}" alt="${p.name}">
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="price">₹${p.price}</p>
                        <button 
                            onclick="addToCart('${id}')" 
                            class="btn-primary mt-2 w-100" 
                            ${isOut ? 'disabled style="opacity:0.5; cursor:not-allowed"' : ''}>
                            ${isOut ? 'Out of Stock' : 'Add to Bag'}
                        </button>
                    </div>
                </div>
            `;
        });
    });
}

// Cart Management
function toggleCart(show) {
    document.getElementById('cart-drawer').classList.toggle('active', show);
}

function addToCart(id) {
    const product = allProducts.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
        } else {
            alert("Maximum stock reached");
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    toggleCart(true);
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const product = allProducts.find(p => p.id === id);
    
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        } else if (item.quantity > product.stock) {
            item.quantity = product.stock;
            alert("Limit reached");
        }
    }
    saveCart();
}

function saveCart() {
    localStorage.setItem('aarush_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-amount');
    const countEl = document.getElementById('cart-count');
    
    list.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;
        list.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}">
                <div style="flex:1">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} x ${item.quantity}</p>
                    <div class="mt-1">
                        <button onclick="updateQty('${item.id}', -1)" class="btn-qty">-</button>
                        <button onclick="updateQty('${item.id}', 1)" class="btn-qty">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    totalEl.innerText = `₹${total}`;
    countEl.innerText = count;
}

// Checkout Flow
function openCheckout() {
    if (cart.length === 0) return alert("Cart is empty");
    toggleCart(false);
    document.getElementById('checkout-modal').style.display = 'block';
    
    let summaryHtml = '<h4>Order Summary</h4>';
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        summaryHtml += `<p>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</p>`;
    });
    summaryHtml += `<hr><p><strong>Total: ₹${total}</strong></p>`;
    document.getElementById('checkout-summary').innerHTML = summaryHtml;
}

function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

document.getElementById('checkout-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.innerText = "Processing...";

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
        // Save Order
        const orderRef = db.ref('orders').push();
        await orderRef.set(orderData);

        // Reduce Stock
        for (let item of cart) {
            const prodRef = db.ref(`products/${item.id}/stock`);
            const snapshot = await prodRef.get();
            const currentStock = snapshot.val();
            await prodRef.set(currentStock - item.quantity);
        }

        // Telegram Alert
        await sendTelegram(orderData);

        alert("Order Placed Successfully!");
        cart = [];
        saveCart();
        closeCheckout();
    } catch (err) {
        console.error(err);
        alert("Error placing order");
    } finally {
        btn.disabled = false;
        btn.innerText = "Place Order";
    }
};

async function sendTelegram(order) {
    const token = "8519947258:AAGJzcVNkJXGndbc1O9C2e_rNgQWAleNhFY";
    const chatId = "6820660513";
    const itemStr = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
    
    const message = `🛒 *NEW ORDER RECEIVED*\n\n` +
                    `👤 *Customer:* ${order.name}\n` +
                    `📞 *Phone:* ${order.phone}\n` +
                    `📧 *Email:* ${order.email}\n` +
                    `📦 *Items:* ${itemStr}\n` +
                    `💰 *Total:* ₹${order.total}\n` +
                    `💳 *Payment:* ${order.paymentMethod}\n` +
                    `📍 *Address:* ${order.address}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    });
}

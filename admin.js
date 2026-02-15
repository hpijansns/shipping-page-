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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let allOrders = [];

// Navigation
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('section-' + tab).classList.remove('hidden');
}

// ---------------- ORDER MANAGEMENT ----------------

function fetchOrders() {
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        allOrders = [];
        const rows = document.getElementById('order-rows');
        rows.innerHTML = '';
        
        if (data) {
            Object.keys(data).reverse().forEach(id => {
                const order = { id, ...data[id] };
                allOrders.push(order);
            });
            calculateStats(allOrders);
            renderOrders(allOrders);
        }
    });
}

function calculateStats(orders) {
    let revenue = 0;
    let counts = { total: orders.length, New: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };

    orders.forEach(o => {
        revenue += Number(o.total || 0);
        if (counts.hasOwnProperty(o.status)) counts[o.status]++;
    });

    document.getElementById('s-revenue').innerText = '₹' + revenue.toLocaleString();
    document.getElementById('s-orders').innerText = counts.total;
    document.getElementById('s-new').innerText = counts.New;
    document.getElementById('s-proc').innerText = counts.Processing;
    document.getElementById('s-ship').innerText = counts.Shipped;
    document.getElementById('s-delv').innerText = counts.Delivered;
    document.getElementById('s-cancel').innerText = counts.Cancelled;
}

function renderOrders(orders) {
    const rows = document.getElementById('order-rows');
    const query = document.getElementById('orderSearch').value.toLowerCase();
    rows.innerHTML = '';

    orders.filter(o => o.name.toLowerCase().includes(query) || o.phone.includes(query)).forEach(o => {
        rows.innerHTML += `
            <tr class="hover:bg-stone-50 transition">
                <td class="p-6">
                    <div class="text-xs font-bold text-primary tracking-widest">${o.orderId || 'N/A'}</div>
                    <div class="text-[10px] text-stone-400 mt-1">${o.time}</div>
                </td>
                <td class="p-6">
                    <div class="font-bold">${o.name}</div>
                    <div class="text-[10px] text-stone-400 uppercase tracking-widest">${o.phone}</div>
                </td>
                <td class="p-6 text-[10px] italic">
                    ${o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                </td>
                <td class="p-6 font-bold text-primary">₹${o.total}</td>
                <td class="p-6">
                    <span class="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest badge-${o.status}">${o.status}</span>
                </td>
                <td class="p-6">
                    <div class="flex flex-wrap justify-center gap-2">
                        <button onclick="updateStatus('${o.id}', 'Processing')" class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-bold uppercase hover:bg-blue-600 hover:text-white transition">Process</button>
                        <button onclick="updateStatus('${o.id}', 'Shipped')" class="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition">Ship</button>
                        <button onclick="updateStatus('${o.id}', 'Delivered')" class="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[9px] font-bold uppercase hover:bg-purple-600 hover:text-white transition">Delv</button>
                        <button onclick="updateStatus('${o.id}', 'Cancelled')" class="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-bold uppercase hover:bg-rose-600 hover:text-white transition">X</button>
                    </div>
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center space-x-4">
                        <a href="https://wa.me/91${o.phone.replace(/\D/g,'')}" target="_blank" class="text-emerald-500 hover:scale-110 transition"><i class="fa-brands fa-whatsapp text-lg"></i></a>
                        <button onclick="deleteOrder('${o.id}')" class="text-rose-300 hover:text-rose-500 transition"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function updateStatus(id, newStatus) {
    db.ref('orders/' + id).once('value').then(async (snap) => {
        const o = snap.val();
        await db.ref('orders/' + id).update({ status: newStatus });
        
        // Auto WhatsApp
        const shortId = (o.orderId || 'N/A').slice(-6);
        let emoji = "🔄";
        if (newStatus === "Shipped") emoji = "🚚";
        else if (newStatus === "Delivered") emoji = "✅";
        else if (newStatus === "Cancelled") emoji = "❌";

        const msg = `Namaste ${o.name} ji 🙏\n\nAapka order ID: #${shortId}\nAb status: ${newStatus} ${emoji}\n\nDhanyavaad 🙏\nAarush Ayurveda`;
        const phone = o.phone.replace(/\D/g, '');
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    });
}

function filterOrders() { renderOrders(allOrders); }

function deleteOrder(id) {
    if (confirm("Permanently archive this order?")) db.ref('orders/' + id).remove();
}

function exportCSV() {
    let csv = "Order ID,Customer,Phone,Total,Status,Time\n";
    allOrders.forEach(o => {
        csv += `${o.orderId},${o.name},${o.phone},${o.total},${o.status},${o.time}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AarushOrders.csv';
    a.click();
}

// ---------------- PRODUCT MANAGEMENT ----------------

const prodForm = document.getElementById('product-form');

function fetchProducts() {
    db.ref('products').on('value', snap => {
        const data = snap.val();
        const list = document.getElementById('product-rows');
        list.innerHTML = '';
        if (data) {
            Object.keys(data).forEach(id => {
                const p = data[id];
                list.innerHTML += `
                    <tr class="hover:bg-stone-50 transition">
                        <td class="p-6 flex items-center space-x-4">
                            <img src="${p.image}" class="w-10 h-10 object-cover rounded-lg shadow-sm">
                            <div>
                                <div class="font-bold text-sm text-primary">${p.name}</div>
                                <div class="text-[9px] text-stone-400 uppercase tracking-widest truncate max-w-[150px]">${p.description}</div>
                            </div>
                        </td>
                        <td class="p-6 font-bold text-gold text-sm font-['Playfair_Display']">₹${p.price}</td>
                        <td class="p-6 text-center">
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold ${p.stock < 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}">${p.stock}</span>
                        </td>
                        <td class="p-6">
                            <div class="flex justify-center space-x-4">
                                <button onclick="editProduct('${id}')" class="text-blue-400 hover:text-blue-600"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button onclick="deleteProduct('${id}')" class="text-rose-400 hover:text-rose-600"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
    });
}

prodForm.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const prodData = {
        name: document.getElementById('prod-name').value,
        price: Number(document.getElementById('prod-price').value),
        image: document.getElementById('prod-img').value,
        stock: Number(document.getElementById('prod-stock').value),
        description: document.getElementById('prod-desc').value,
        createdAt: new Date().getTime()
    };
    if (id) db.ref('products/' + id).update(prodData);
    else db.ref('products').push(prodData);
    resetForm();
};

function editProduct(id) {
    db.ref('products/' + id).once('value', snap => {
        const p = snap.val();
        document.getElementById('edit-id').value = id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-img').value = p.image;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-desc').value = p.description;
        document.getElementById('form-title').innerText = "Edit Inventory Item";
        document.getElementById('prod-submit').innerText = "Update Product";
    });
}

function deleteProduct(id) {
    if (confirm("Remove item from inventory vault?")) db.ref('products/' + id).remove();
}

function resetForm() {
    prodForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('form-title').innerText = "Add New Product";
    document.getElementById('prod-submit').innerText = "Save Product";
}

// Global Load
window.onload = () => {
    fetchOrders();
    fetchProducts();
};

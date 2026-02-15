/**
 * Aarush Ayurveda - Admin Dashboard Logic
 * GitHub Pages Compatible
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

let allOrders = [];

// Tab Switcher
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('section-' + tab).classList.remove('hidden');
}

// --- Order Management ---

db.ref('orders').on('value', (snapshot) => {
    const data = snapshot.val();
    allOrders = [];
    const rows = document.getElementById('order-rows');
    rows.innerHTML = '';

    let stats = { total: 0, new: 0, proc: 0, ship: 0 };

    if (data) {
        Object.keys(data).reverse().forEach(id => {
            const order = { id, ...data[id] };
            allOrders.push(order);
            
            stats.total++;
            if (order.status === 'New') stats.new++;
            if (order.status === 'Processing') stats.proc++;
            if (order.status === 'Shipped') stats.ship++;

            rows.innerHTML += `
                <tr class="border-b hover:bg-stone-50 transition">
                    <td class="p-4 text-xs font-medium text-gray-500">${order.time}</td>
                    <td class="p-4">
                        <div class="font-bold text-primary">${order.name}</div>
                        <div class="text-xs text-stone-500">${order.phone} | ${order.email}</div>
                        <div class="text-[10px] bg-gray-100 p-1 mt-1 rounded leading-tight">${order.address}</div>
                    </td>
                    <td class="p-4 text-xs">
                        ${order.items.map(i => `<div class="mb-1">${i.name} <span class="text-gold font-bold">× ${i.quantity}</span></div>`).join('')}
                    </td>
                    <td class="p-4 font-bold text-primary">₹${order.total}</td>
                    <td class="p-4">
                        <select onchange="updateStatus('${id}', this.value)" class="p-2 border rounded text-xs outline-none ${getStatusColor(order.status)}">
                            <option value="New" ${order.status === 'New' ? 'selected' : ''}>New</option>
                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td class="p-4">
                        <div class="flex items-center justify-center space-x-3">
                            <a href="https://wa.me/91${order.phone.replace(/\D/g,'')}" target="_blank" class="text-green-500 hover:scale-110 transition"><i class="fa-brands fa-whatsapp text-lg"></i></a>
                            <button onclick="deleteOrder('${id}')" class="text-red-400 hover:text-red-600 transition"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    
    // Update Stats
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-new').innerText = stats.new;
    document.getElementById('stat-proc').innerText = stats.proc;
    document.getElementById('stat-ship').innerText = stats.ship;
});

function getStatusColor(status) {
    if (status === 'New') return 'bg-blue-50 text-blue-600';
    if (status === 'Processing') return 'bg-yellow-50 text-yellow-600';
    if (status === 'Shipped') return 'bg-green-50 text-green-600';
    if (status === 'Delivered') return 'bg-stone-800 text-white';
    return 'bg-red-50 text-red-600';
}

function updateStatus(id, status) {
    db.ref('orders/' + id).update({ status });
}

function deleteOrder(id) {
    if (confirm('Permanently delete this order?')) {
        db.ref('orders/' + id).remove();
    }
}

function filterOrders() {
    const val = document.getElementById('search-order').value.toLowerCase();
    const rows = document.querySelectorAll('#order-rows tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(val) ? '' : 'none';
    });
}

function exportCSV() {
    let csv = "Date,Name,Phone,Email,Total,Status,Address\n";
    allOrders.forEach(o => {
        csv += `${o.time},${o.name},${o.phone},${o.email},${o.total},${o.status},"${o.address}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aarush_ayurveda_orders.csv';
    a.click();
}

// --- Product Management ---

const productForm = document.getElementById('product-form');

db.ref('products').on('value', snapshot => {
    const data = snapshot.val();
    const rows = document.getElementById('product-rows');
    rows.innerHTML = '';

    if (data) {
        Object.keys(data).forEach(id => {
            const p = data[id];
            rows.innerHTML += `
                <tr class="border-b hover:bg-stone-50 transition">
                    <td class="p-4 flex items-center space-x-3">
                        <img src="${p.image}" class="w-10 h-10 object-cover rounded">
                        <div>
                            <div class="font-bold text-primary text-sm">${p.name}</div>
                            <div class="text-[10px] text-gray-400 truncate max-w-[150px]">${p.description}</div>
                        </div>
                    </td>
                    <td class="p-4 font-bold text-primary text-sm">₹${p.price}</td>
                    <td class="p-4 text-center">
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${p.stock}
                        </span>
                    </td>
                    <td class="p-4">
                        <div class="flex justify-center space-x-3 text-sm">
                            <button onclick="editProduct('${id}')" class="text-blue-500 hover:scale-110 transition"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="deleteProduct('${id}')" class="text-red-500 hover:scale-110 transition"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
});

productForm.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const prodData = {
        name: document.getElementById('prod-name').value,
        price: parseInt(document.getElementById('prod-price').value),
        image: document.getElementById('prod-img').value,
        stock: parseInt(document.getElementById('prod-stock').value),
        description: document.getElementById('prod-desc').value,
        createdAt: new Date().getTime()
    };

    if (id) {
        db.ref('products/' + id).update(prodData);
    } else {
        db.ref('products').push(prodData);
    }
    resetProdForm();
};

function editProduct(id) {
    db.ref('products/' + id).once('value', snapshot => {
        const p = snapshot.val();
        document.getElementById('edit-id').value = id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-img').value = p.image;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-desc').value = p.description;
        document.getElementById('form-title').innerText = "Edit Product";
        document.getElementById('prod-submit').innerText = "Update Product";
    });
}

function deleteProduct(id) {
    if (confirm('Delete product?')) db.ref('products/' + id).remove();
}

function resetProdForm() {
    productForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('form-title').innerText = "Add New Product";
    document.getElementById('prod-submit').innerText = "Save Product";
}

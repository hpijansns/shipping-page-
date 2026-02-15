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

let allOrders = [];

// Panel Switcher
function switchPanel(panelId) {
    document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('panel-' + panelId).classList.remove('hidden');
    
    document.querySelectorAll('aside nav button').forEach(btn => btn.classList.remove('active-tab'));
    document.getElementById('tab-' + panelId).classList.add('active-tab');
}

// Stats & Real-time Update
database.ref('orders').on('value', snapshot => {
    const orders = snapshot.val();
    let revenue = 0;
    let totalOrders = 0;
    let newOrders = 0;
    allOrders = [];

    const orderBody = document.getElementById('order-table-body');
    orderBody.innerHTML = '';

    if (orders) {
        Object.keys(orders).reverse().forEach(key => {
            const o = orders[key];
            o.fbKey = key;
            allOrders.push(o);
            
            revenue += o.total;
            totalOrders++;
            if (o.status === "New") newOrders++;

            const statusClass = `badge-${o.status.toLowerCase()}`;
            orderBody.innerHTML += `
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition-all">
                    <td class="p-8">
                        <div class="font-bold text-luxuryGreen">${o.orderId}</div>
                        <div class="text-[10px] text-gray-400 mt-1">${o.time}</div>
                    </td>
                    <td class="p-8">
                        <div class="font-bold">${o.name}</div>
                        <div class="text-xs text-gray-400">${o.phone}</div>
                    </td>
                    <td class="p-8">
                        <div class="text-xs">${o.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>
                    </td>
                    <td class="p-8 font-bold text-luxuryGreen">₹${o.total.toLocaleString()}</td>
                    <td class="p-8">
                        <select onchange="updateOrderStatus('${o.fbKey}', this.value)" class="bg-gray-100 border-none rounded-full px-4 py-2 text-[10px] font-bold outline-none cursor-pointer">
                            <option value="New" ${o.status === 'New' ? 'selected' : ''}>NEW</option>
                            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>PROCESSING</option>
                            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>SHIPPED</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>DELIVERED</option>
                            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>CANCELLED</option>
                        </select>
                    </td>
                    <td class="p-8 text-center">
                        <div class="flex items-center justify-center gap-4">
                            <a href="https://wa.me/91${o.phone}" target="_blank" class="text-green-500 hover:scale-110 transition"><i class="fa-brands fa-whatsapp text-lg"></i></a>
                            <button onclick="deleteOrder('${o.fbKey}')" class="text-red-400 hover:text-red-600 transition"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById('stat-revenue').innerText = '₹' + revenue.toLocaleString();
    document.getElementById('stat-orders').innerText = totalOrders;
    document.getElementById('stat-new').innerText = newOrders;
});

// Product Management
database.ref('products').on('value', snapshot => {
    const products = snapshot.val();
    const productBody = document.getElementById('product-table-body');
    let lowStockCount = 0;
    productBody.innerHTML = '';

    if (products) {
        Object.keys(products).forEach(key => {
            const p = products[key];
            if (p.stock <= 5) lowStockCount++;

            productBody.innerHTML += `
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition-all">
                    <td class="p-8">
                        <img src="${p.image}" class="w-16 h-16 rounded-2xl object-cover shadow-sm">
                    </td>
                    <td class="p-8">
                        <div class="font-bold text-luxuryGreen">${p.name}</div>
                        <div class="text-[10px] text-gray-400 line-clamp-1 max-w-[200px]">${p.description}</div>
                    </td>
                    <td class="p-8 font-bold text-luxuryGreen">₹${p.price}</td>
                    <td class="p-8 text-center">
                        <span class="font-bold ${p.stock <= 5 ? 'text-red-600' : 'text-luxuryGreen'}">${p.stock}</span>
                    </td>
                    <td class="p-8">
                        <div class="flex items-center justify-center gap-6">
                            <button onclick="editProduct('${key}')" class="text-gold hover:scale-110 transition"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteProduct('${key}')" class="text-red-400 hover:scale-110 transition"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    document.getElementById('stat-low-stock').innerText = lowStockCount;
});

// Modal Logic
function openProductModal() {
    document.getElementById('product-modal').classList.remove('hidden');
}
function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('modal-title').innerText = "Product Details";
}

document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const prod = {
        name: document.getElementById('prod-name').value,
        price: parseInt(document.getElementById('prod-price').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        image: document.getElementById('prod-img').value,
        description: document.getElementById('prod-desc').value,
        createdAt: new Date().toISOString()
    };

    if (id) {
        database.ref('products/' + id).update(prod);
    } else {
        database.ref('products').push(prod);
    }
    closeProductModal();
});

function editProduct(id) {
    database.ref('products/' + id).once('value', snapshot => {
        const p = snapshot.val();
        document.getElementById('edit-id').value = id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-img').value = p.image;
        document.getElementById('prod-desc').value = p.description;
        document.getElementById('modal-title').innerText = "Edit Product Entry";
        openProductModal();
    });
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to remove this rare botanical formulation from inventory?')) {
        database.ref('products/' + id).remove();
    }
}

function updateOrderStatus(id, status) {
    database.ref('orders/' + id).update({ status });
}

function deleteOrder(id) {
    if (confirm('Archive this order permanently?')) {
        database.ref('orders/' + id).remove();
    }
}

function searchOrders() {
    const query = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#order-table-body tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
    });
}

function exportCSV() {
    let csv = "Order ID,Time,Customer,Phone,Total,Status,Address\n";
    allOrders.forEach(o => {
        csv += `${o.orderId},${o.time},${o.name},${o.phone},${o.total},${o.status},"${o.address.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'aarush_ayurveda_elite_orders.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

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

let ordersList = [];

// Panel Switcher
function showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
}

// Product Management
function toggleProductModal(show) {
    document.getElementById('product-modal').style.display = show ? 'block' : 'none';
    if (!show) document.getElementById('product-form').reset();
}

document.getElementById('product-form').onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-product-id').value;
    const product = {
        name: document.getElementById('prod-name').value,
        price: Number(document.getElementById('prod-price').value),
        image: document.getElementById('prod-image').value,
        description: document.getElementById('prod-desc').value,
        stock: Number(document.getElementById('prod-stock').value),
        createdAt: new Date().toISOString()
    };

    if (id) {
        db.ref('products/' + id).update(product);
    } else {
        db.ref('products').push(product);
    }
    toggleProductModal(false);
};

db.ref('products').on('value', snapshot => {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.keys(data).forEach(id => {
            const p = data[id];
            list.innerHTML += `
                <tr>
                    <td><img src="${p.image}" width="50"></td>
                    <td>${p.name}</td>
                    <td>₹${p.price}</td>
                    <td>${p.stock}</td>
                    <td>
                        <button onclick="editProduct('${id}')"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteProduct('${id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
});

function editProduct(id) {
    db.ref('products/' + id).once('value', snapshot => {
        const p = snapshot.val();
        document.getElementById('edit-product-id').value = id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-image').value = p.image;
        document.getElementById('prod-desc').value = p.description;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('product-modal-title').innerText = "Edit Product";
        toggleProductModal(true);
    });
}

function deleteProduct(id) {
    if (confirm("Delete this product?")) db.ref('products/' + id).remove();
}

// Order Management
db.ref('orders').on('value', snapshot => {
    const list = document.getElementById('admin-order-list');
    list.innerHTML = '';
    const data = snapshot.val();
    ordersList = [];
    
    let total = 0, n = 0, s = 0;

    if (data) {
        Object.keys(data).reverse().forEach(id => {
            const o = data[id];
            o.id = id;
            ordersList.push(o);
            
            total++;
            if (o.status === "New") n++;
            if (o.status === "Shipped") s++;

            list.innerHTML += `
                <tr>
                    <td>${o.time}</td>
                    <td>
                        <strong>${o.name}</strong><br>${o.phone}
                        <br><a href="https://wa.me/91${o.phone}" target="_blank" class="text-green-600"><i class="fab fa-whatsapp"></i> Chat</a>
                    </td>
                    <td>${o.items.map(i => `${i.name} (x${i.quantity})`).join('<br>')}</td>
                    <td>₹${o.total}</td>
                    <td>
                        <select onchange="updateOrderStatus('${id}', this.value)">
                            <option value="New" ${o.status === 'New' ? 'selected' : ''}>New</option>
                            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="deleteOrder('${id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    document.getElementById('stat-total-orders').innerText = total;
    document.getElementById('stat-new-orders').innerText = n;
    document.getElementById('stat-shipped-orders').innerText = s;
});

function updateOrderStatus(id, status) {
    db.ref(`orders/${id}`).update({ status });
}

function deleteOrder(id) {
    if (confirm("Delete this order?")) db.ref('orders/' + id).remove();
}

function searchOrders() {
    const term = document.getElementById('orderSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#admin-order-list tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
}

function exportOrdersToCSV() {
    let csv = "Date,Name,Phone,Email,Total,Status,Address\n";
    ordersList.forEach(o => {
        csv += `"${o.time}","${o.name}","${o.phone}","${o.email}","${o.total}","${o.status}","${o.address.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'aarush_orders.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

showPanel('stats');

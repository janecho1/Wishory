const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Helper function to read data.json (동기식)
function readData() {
    try {
        // 파일이 존재하는지 확인
        if (!fs.existsSync(DATA_FILE)) {
            // 파일이 없으면 기본 구조로 생성
            const defaultData = {
                users: [],
                items: [],
                orders: []
            };
            writeData(defaultData);
            return defaultData;
        }
        
        // 파일 읽기
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(fileContent);
        
        // 기본 구조가 없으면 추가
        if (!data.users) data.users = [];
        if (!data.items) data.items = [];
        if (!data.orders) data.orders = [];
        
        return data;
    } catch (error) {
        console.error('Error reading data.json:', error);
        // 에러 발생 시 기본 구조 반환
        const defaultData = {
            users: [],
            items: [],
            orders: []
        };
        writeData(defaultData);
        return defaultData;
    }
}

// Helper function to write data.json (동기식)
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing data.json:', error);
        throw error;
    }
}

// 서버 시작 시 data.json 초기화 확인
readData();
console.log('Data file initialized/loaded');

// ========== ITEMS API ==========

// GET /api/items - Get items (optionally filtered by userId)
app.get('/api/items', (req, res) => {
    try {
        const data = readData();
        const userId = req.query.userId;
        let items = data.items || [];

        if (userId) {
            items = items.filter(item => item.userId === userId);
        }

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/items - Add new item
app.post('/api/items', (req, res) => {
    try {
        const data = readData();
        const newItem = {
            id: Date.now().toString(),
            name: req.body.name,
            price: parseFloat(req.body.price),
            season: req.body.season,
            category: req.body.category,
            userId: req.body.userId || null,
            url: req.body.url || '',
            imageUrl: req.body.imageUrl || 'https://via.placeholder.com/400'
        };
        data.items.push(newItem);
        writeData(data); // 파일에 즉시 저장
        res.json(newItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/items/:id - Update item
app.put('/api/items/:id', (req, res) => {
    try {
        const data = readData();
        const itemIndex = data.items.findIndex(item => item.id === req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        data.items[itemIndex] = {
            ...data.items[itemIndex],
            ...req.body,
            id: req.params.id // Ensure ID doesn't change
        };
        
        writeData(data); // 파일에 즉시 저장
        res.json(data.items[itemIndex]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/items/:id - Delete item
app.delete('/api/items/:id', (req, res) => {
    try {
        const data = readData();
        const itemIndex = data.items.findIndex(item => item.id === req.params.id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        data.items.splice(itemIndex, 1);
        writeData(data); // 파일에 즉시 저장
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== AUTH API ==========

// POST /api/auth/login - Login
app.post('/api/auth/login', (req, res) => {
    try {
        const data = readData();
        const { id, password } = req.body;
        const user = data.users.find(u => u.id === id && u.password === password);
        
        if (user) {
            res.json({ success: true, userId: user.id });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/signup - Signup
app.post('/api/auth/signup', (req, res) => {
    try {
        const data = readData();
        const { id, password } = req.body;
        
        if (password.length > 16) {
            return res.status(400).json({ error: 'Password must be 16 characters or less' });
        }
        
        if (data.users.find(u => u.id === id)) {
            return res.status(400).json({ error: 'ID already exists' });
        }
        
        // users 배열에 추가하고 파일에 저장
        data.users.push({ id, password });
        writeData(data); // 파일에 즉시 저장
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== CART API ==========
// Cart는 세션 데이터로 관리하되, 파일에도 저장하여 영구 보존

// GET /api/cart/:userId - Get user's cart
app.get('/api/cart/:userId', (req, res) => {
    try {
        const data = readData();
        // carts가 없으면 빈 배열 반환
        if (!data.carts) {
            data.carts = {};
        }
        const cart = data.carts[req.params.userId] || [];
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/cart/:userId - Add item to cart
app.post('/api/cart/:userId', (req, res) => {
    try {
        const data = readData();
        if (!data.carts) {
            data.carts = {};
        }
        if (!data.carts[req.params.userId]) {
            data.carts[req.params.userId] = [];
        }
        
        const { productId } = req.body;
        const item = data.items.find(i => i.id === productId);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const cart = data.carts[req.params.userId];
        const existingItem = cart.find(c => c.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                productId,
                name: item.name,
                price: item.price,
                quantity: 1
            });
        }
        
        writeData(data); // 파일에 즉시 저장
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/cart/:userId/:index - Update cart item quantity
app.put('/api/cart/:userId/:index', (req, res) => {
    try {
        const data = readData();
        if (!data.carts) {
            data.carts = {};
        }
        const cart = data.carts[req.params.userId] || [];
        const index = parseInt(req.params.index);
        const { quantity } = req.body;
        
        if (index < 0 || index >= cart.length) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        if (quantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = quantity;
        }
        
        writeData(data); // 파일에 즉시 저장
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/cart/:userId/:index - Remove item from cart
app.delete('/api/cart/:userId/:index', (req, res) => {
    try {
        const data = readData();
        if (!data.carts) {
            data.carts = {};
        }
        const cart = data.carts[req.params.userId] || [];
        const index = parseInt(req.params.index);
        
        if (index < 0 || index >= cart.length) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        cart.splice(index, 1);
        writeData(data); // 파일에 즉시 저장
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/cart/:userId - Clear cart
app.delete('/api/cart/:userId', (req, res) => {
    try {
        const data = readData();
        if (!data.carts) {
            data.carts = {};
        }
        data.carts[req.params.userId] = [];
        writeData(data); // 파일에 즉시 저장
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== ORDERS API ==========

// GET /api/orders/:userId - Get user's orders
app.get('/api/orders/:userId', (req, res) => {
    try {
        const data = readData();
        // orders 배열에서 해당 userId의 주문만 필터링
        const userOrders = (data.orders || []).filter(order => order.userId === req.params.userId);
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/orders/:userId - Create new order
app.post('/api/orders/:userId', (req, res) => {
    try {
        const data = readData();
        if (!data.orders) {
            data.orders = [];
        }
        
        const order = {
            id: Date.now().toString(),
            userId: req.params.userId,
            date: new Date().toISOString(),
            items: req.body.items,
            total: req.body.total,
            customer: req.body.customer,
            payment: req.body.payment
        };
        
        // orders 배열에 추가하고 파일에 저장
        data.orders.push(order);
        writeData(data); // 파일에 즉시 저장
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/orders/:userId/:orderId - Delete an order (새로 추가됨)
app.delete('/api/orders/:userId/:orderId', (req, res) => {
    try {
        const data = readData();
        if (!data.orders) data.orders = [];
        
        const orderIndex = data.orders.findIndex(
            order => order.id === req.params.orderId && order.userId === req.params.userId
        );
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        data.orders.splice(orderIndex, 1);
        writeData(data);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`\nTo start the server:`);
    console.log(`1. Run: npm install`);
    console.log(`2. Run: node server.js`);
    console.log(`3. Open: http://localhost:${PORT}`);
    console.log(`\nData persistence: All data is saved to ${DATA_FILE}`);
});
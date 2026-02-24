// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Seasons and Categories
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const CATEGORIES = ['Outer', 'Top', 'Bottom', 'Dress', 'Shoes', 'Accessories'];

// Current state
let currentSeason = 'Spring';
let currentCategory = 'all';
let currentUser = null;
let currentSlideIndex = 0;
let slideInterval = null;
let openKebabMenuId = null;

// Router
const router = {
    navigate(path) {
        window.location.hash = path;
        this.handleRoute();
    },
    
    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const path = hash.split('/');
        
        // Hide all pages first
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Update theme based on season
        document.body.className = '';
        
        // Route handling
        if (hash === '/' || hash === '') {
            this.showPage('page-home');
        } else if (hash === '/login') {
            this.showPage('page-login');
        } else if (hash === '/signup') {
            this.showPage('page-signup');
        } else if (hash.startsWith('/wishlist/')) {
            if (!isLoggedIn()) {
                alert('로그인이 필요한 서비스입니다.');
                this.navigate('/login');
                return;
            }
            const season = path[2];
            if (season === 'all') {
                currentSeason = 'All';
                this.setTheme('all');
                this.showPage('page-wishlist');
                renderWishlist();
            } else if (SEASONS.map(s => s.toLowerCase()).includes(season)) {
                currentSeason = season.charAt(0).toUpperCase() + season.slice(1);
                this.setTheme(season);
                this.showPage('page-wishlist');
                renderWishlist();
            } else {
                this.navigate('/');
            }
        } else if (hash === '/cart') {
            if (!isLoggedIn()) {
                alert('Please login to access your cart.');
                this.navigate('/login');
                return;
            }
            this.showPage('page-cart');
            renderCart();
        } else if (hash === '/orders') {
            if (!isLoggedIn()) {
                alert('Please login to view your orders.');
                this.navigate('/login');
                return;
            }
            this.showPage('page-orders');
            renderOrders();
        } else {
            this.navigate('/');
        }
        
        updateAuthButton();
        updateSeasonNav();
    },
    
    showPage(pageId) {
        // Hide all pages first
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        // Show selected page
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.remove('hidden');
        }
    },
    
    setTheme(season) {
        document.body.className = `theme-${season}`;
    }
};

// Initialize router
window.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    currentUser = sessionStorage.getItem('currentUser');
    
    // Initialize hero slider
    initHeroSlider();
    
    // Load highlights marquee
    await loadHighlightsMarquee();
    
    router.handleRoute();
    window.addEventListener('hashchange', () => router.handleRoute());
    
    // Close kebab menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.product-kebab') && !e.target.closest('.kebab-menu')) {
            closeKebabMenu();
        }
    });
});

// Update season navigation active state
function updateSeasonNav() {
    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.classList.remove('active');
        const season = btn.dataset.season;
        if (season && currentSeason.toLowerCase() === season) {
            btn.classList.add('active');
        }
    });
}

// ========== HERO SLIDER ==========

function initHeroSlider() {
    showSlide(0);
    startSlideShow();
}

function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (index >= slides.length) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = slides.length - 1;
    } else {
        currentSlideIndex = index;
    }
    
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === currentSlideIndex) {
            slide.classList.add('active');
        }
    });
    
    dots.forEach((dot, i) => {
        dot.classList.remove('active');
        if (i === currentSlideIndex) {
            dot.classList.add('active');
        }
    });
}

function changeSlide(direction) {
    showSlide(currentSlideIndex + direction);
    resetSlideShow();
}

function currentSlide(index) {
    showSlide(index);
    resetSlideShow();
}

function startSlideShow() {
    slideInterval = setInterval(() => {
        showSlide(currentSlideIndex + 1);
    }, 4000);
}

function resetSlideShow() {
    clearInterval(slideInterval);
    startSlideShow();
}

// ========== HIGHLIGHTS MARQUEE ==========

async function loadHighlightsMarquee() {
    const section = document.getElementById('highlights-marquee');

    // 로그인하지 않은 상태에서는 하이라이트 영역 숨김
    if (!currentUser) {
        if (section) {
            section.style.display = 'none';
        }
        return;
    } else if (section) {
        section.style.display = '';
    }

    try {
        const response = await fetch(`${API_BASE}/items?userId=${encodeURIComponent(currentUser)}`);
        const items = await response.json();
        
        const track = document.getElementById('marquee-track');
        if (!track) return;
        
        // items가 0개일 때 무한 루프 방지
        if (items.length === 0) {
            track.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">등록된 상품이 없습니다</div>';
            return;
        }
        
        // Get random 8 items
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        const selectedItems = shuffled.slice(0, 8);
        
        // Duplicate if less than 8 items (최소 1개 이상이므로 무한 루프 방지)
        const displayItems = [];
        while (displayItems.length < 16) {
            displayItems.push(...selectedItems);
            // 안전장치: selectedItems가 비어있으면 루프 종료
            if (selectedItems.length === 0) {
                break;
            }
        }
        
        track.innerHTML = '';
        
        displayItems.forEach(item => {
            const marqueeItem = document.createElement('div');
            marqueeItem.className = 'marquee-item';
            marqueeItem.onclick = () => {
                if (item.url) {
                    window.open(item.url, '_blank');
                }
            };
            
            const img = document.createElement('img');
            img.className = 'marquee-item-image';
            img.src = item.imageUrl || 'https://via.placeholder.com/200';
            img.alt = item.name;
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/200';
            };
            
            const name = document.createElement('div');
            name.className = 'marquee-item-name';
            name.textContent = item.name;
            
            marqueeItem.appendChild(img);
            marqueeItem.appendChild(name);
            track.appendChild(marqueeItem);
        });
    } catch (error) {
        console.error('Error loading highlights:', error);
        const track = document.getElementById('marquee-track');
        if (track) {
            track.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">상품을 불러오는 중 오류가 발생했습니다</div>';
        }
    }
}

// ========== AUTHENTICATION ==========

function isLoggedIn() {
    return currentUser !== null;
}

function handleAuthClick() {
    if (isLoggedIn()) {
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        updateAuthButton();
        router.navigate('/');
    } else {
        router.navigate('/login');
    }
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.textContent = isLoggedIn() ? 'Logout' : 'Login';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const id = document.getElementById('login-id').value;
    const password = document.getElementById('login-pw').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = id;
            sessionStorage.setItem('currentUser', id);
            alert('환영합니다.');
            document.getElementById('login-form').reset();
            router.navigate('/');
        } else {
            alert('Invalid ID or Password.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const id = document.getElementById('signup-id').value;
    const password = document.getElementById('signup-pw').value;
    
    if (password.length > 16) {
        alert('Password must be 16 characters or less.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Sign up successful!');
            document.getElementById('signup-form').reset();
            router.navigate('/login');
        } else {
            alert(data.error || 'Sign up failed.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Sign up failed. Please try again.');
    }
}

// ========== WISHLIST FUNCTIONS ==========

async function renderWishlist() {
    if (!isLoggedIn()) {
        alert('로그인이 필요한 서비스입니다.');
        router.navigate('/login');
        return;
    }
    const title = document.getElementById('wishlist-title');
    if (title) {
        if (currentSeason === 'All') {
            title.textContent = 'All Seasons Wishlist';
        } else {
            title.textContent = `${currentSeason} Wishlist`;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE}/items?userId=${encodeURIComponent(currentUser)}`);
        const items = await response.json();
        
        const filteredItems = items.filter(item => {
            const seasonMatch = currentSeason === 'All' || item.season === currentSeason;
            const categoryMatch = currentCategory === 'all' || item.category === currentCategory;
            return seasonMatch && categoryMatch;
        });
        
        const grid = document.getElementById('product-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (filteredItems.length === 0) {
            grid.innerHTML = '<p>No products found. Add some items to your wishlist!</p>';
            return;
        }
        
        filteredItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.itemId = item.id;
            
            card.innerHTML = `
                <div class="product-image-container" onclick="openProductLink('${item.url || ''}')">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/400'}" 
                         alt="${item.name}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400'">
                    <button class="product-kebab" onclick="event.stopPropagation(); toggleKebabMenu('${item.id}')">⋮</button>
                    <div id="kebab-menu-${item.id}" class="kebab-menu hidden">
                        <button class="kebab-menu-item" onclick="event.stopPropagation(); openEditModal('${item.id}')">수정</button>
                        <button class="kebab-menu-item delete" onclick="event.stopPropagation(); deleteItem('${item.id}')">삭제</button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-name" onclick="openProductLink('${item.url || ''}')">${item.name}</div>
                    <div class="product-category">${item.category}</div>
                    <div class="product-price">${item.price.toLocaleString('ko-KR')}원</div>
                    <div class="product-actions">
                        <button class="btn-secondary" onclick="addToCart('${item.id}')">Add to Cart</button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading wishlist:', error);
        alert('Failed to load wishlist.');
    }
}

function openProductLink(url) {
    if (url) {
        window.open(url, '_blank');
    }
}

function filterProducts(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    renderWishlist();
}

function toggleKebabMenu(itemId) {
    // Close other menus
    if (openKebabMenuId && openKebabMenuId !== itemId) {
        const otherMenu = document.getElementById(`kebab-menu-${openKebabMenuId}`);
        if (otherMenu) {
            otherMenu.classList.add('hidden');
        }
    }
    
    const menu = document.getElementById(`kebab-menu-${itemId}`);
    if (menu) {
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            openKebabMenuId = itemId;
        } else {
            menu.classList.add('hidden');
            openKebabMenuId = null;
        }
    }
}

function closeKebabMenu() {
    if (openKebabMenuId) {
        const menu = document.getElementById(`kebab-menu-${openKebabMenuId}`);
        if (menu) {
            menu.classList.add('hidden');
        }
        openKebabMenuId = null;
    }
}

function openAddItemModal() {
    if (!isLoggedIn()) {
        alert('Please login to add items.');
        router.navigate('/login');
        return;
    }
    
    const modal = document.getElementById('add-item-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    // Season 선택 UI
    const seasonGroup = document.getElementById('item-season-group');
    const seasonSelect = document.getElementById('item-season');

    if (seasonGroup && seasonSelect) {
        if (currentSeason === 'All') {
            // All 탭에서는 사용자가 직접 시즌 선택
            seasonGroup.style.display = 'block';
            seasonSelect.value = '';
        } else {
            // 특정 시즌 탭에서는 해당 시즌으로 자동 지정하고 UI는 숨김
            seasonGroup.style.display = 'none';
            seasonSelect.value = currentSeason;
        }
    }

    // 현재 선택된 카테고리가 전체가 아니라면 모달의 카테고리 선택값을 자동 지정
    const categorySelect = document.getElementById('item-category');
    if (categorySelect) {
        if (currentCategory && currentCategory !== 'all') {
            categorySelect.value = currentCategory;
        } else {
            categorySelect.value = '';
        }
    }
}

function closeAddItemModal() {
    const modal = document.getElementById('add-item-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('add-item-form').reset();
    }
}

async function handleAddItem(event) {
    event.preventDefault();
    
    const name = document.getElementById('item-name').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const seasonSelect = document.getElementById('item-season');
    const category = document.getElementById('item-category').value;
    const url = document.getElementById('item-url').value;
    const imageUrl = document.getElementById('item-image-url').value;

    // 시즌 결정 로직: All 탭에서는 사용자가 선택, 아닌 경우 현재 탭 시즌 사용
    let seasonToUse = currentSeason;
    if (currentSeason === 'All') {
        if (!seasonSelect || !seasonSelect.value) {
            alert('Please select a season.');
            return;
        }
        seasonToUse = seasonSelect.value;
    }
    
    try {
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                price,
                season: seasonToUse,
                category,
                userId: currentUser,
                url: url || '',
                imageUrl: imageUrl || 'https://via.placeholder.com/400'
            })
        });
        
        if (response.ok) {
            closeAddItemModal();
            renderWishlist();
            await loadHighlightsMarquee(); // Refresh marquee
        } else {
            alert('Failed to add item.');
        }
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Failed to add item.');
    }
}

async function openEditModal(itemId) {
    closeKebabMenu();
    
    try {
        const response = await fetch(`${API_BASE}/items?userId=${encodeURIComponent(currentUser)}`);
        const items = await response.json();
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            alert('Item not found.');
            return;
        }
        
        document.getElementById('edit-item-id').value = item.id;
        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-price').value = item.price;
        document.getElementById('edit-item-category').value = item.category;
        document.getElementById('edit-item-url').value = item.url || '';
        document.getElementById('edit-item-image-url').value = item.imageUrl || '';
        
        const modal = document.getElementById('edit-item-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading item:', error);
        alert('Failed to load item.');
    }
}

function closeEditItemModal() {
    const modal = document.getElementById('edit-item-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('edit-item-form').reset();
    }
}

async function handleEditItem(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-item-id').value;
    const name = document.getElementById('edit-item-name').value;
    const price = parseFloat(document.getElementById('edit-item-price').value);
    const category = document.getElementById('edit-item-category').value;
    const url = document.getElementById('edit-item-url').value;
    const imageUrl = document.getElementById('edit-item-image-url').value;
    
    try {
        const response = await fetch(`${API_BASE}/items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                price,
                category,
                userId: currentUser,
                url: url || '',
                imageUrl: imageUrl || 'https://via.placeholder.com/400'
            })
        });
        
        if (response.ok) {
            closeEditItemModal();
            renderWishlist();
            await loadHighlightsMarquee(); // Refresh marquee
        } else {
            alert('Failed to update item.');
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Failed to update item.');
    }
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    closeKebabMenu();
    
    try {
        const response = await fetch(`${API_BASE}/items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            renderWishlist();
            await loadHighlightsMarquee(); // Refresh marquee
        } else {
            alert('Failed to delete item.');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item.');
    }
}

// ========== CART FUNCTIONS ==========

async function addToCart(productId) {
    if (!isLoggedIn()) {
        alert('Please login to add items to cart.');
        router.navigate('/login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });
        
        if (response.ok) {
            alert('Item added to cart!');
        } else {
            alert('Failed to add item to cart.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart.');
    }
}

async function renderCart() {
    if (!isLoggedIn()) return;
    
    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser}`);
        const cart = await response.json();
        
        const container = document.getElementById('cart-table-container');
        if (!container) return;
        
        if (cart.length === 0) {
            container.innerHTML = '<p>Your cart is empty.</p>';
            document.getElementById('checkout-form-container').style.display = 'none';
            return;
        }
        
        document.getElementById('checkout-form-container').style.display = 'block';
        
        let html = `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let total = 0;
        
        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.price.toLocaleString('ko-KR')}원</td>
                    <td>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateCartQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                        </div>
                    </td>
                    <td>${subtotal.toLocaleString('ko-KR')}원</td>
                    <td>
                        <button class="delete-btn" onclick="removeFromCart(${index})">Delete</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                        <td style="font-weight: bold;">${total.toLocaleString('ko-KR')}원</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading cart:', error);
        alert('Failed to load cart.');
    }
}

async function updateCartQuantity(index, change) {
    if (!isLoggedIn()) return;
    
    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser}`);
        const cart = await response.json();
        
        if (cart[index]) {
            const newQuantity = cart[index].quantity + change;
            
            if (newQuantity <= 0) {
                await fetch(`${API_BASE}/cart/${currentUser}/${index}`, {
                    method: 'DELETE'
                });
            } else {
                await fetch(`${API_BASE}/cart/${currentUser}/${index}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ quantity: newQuantity })
                });
            }
            
            renderCart();
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        alert('Failed to update cart.');
    }
}

async function removeFromCart(index) {
    if (!isLoggedIn()) return;
    
    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser}/${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            renderCart();
        } else {
            alert('Failed to remove item.');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        alert('Failed to remove item.');
    }
}

async function handleCheckout(event) {
    event.preventDefault();
    
    if (!isLoggedIn()) return;
    
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;
    const bank = document.getElementById('checkout-bank').value;
    const password = document.getElementById('checkout-password').value;
    
    if (!name || !phone || !address || !bank || !password) {
        alert('Please fill in all fields.');
        return;
    }
    
    if (password.length > 6) {
        alert('Account password must be 6 digits or less.');
        return;
    }
    
    try {
        // Get cart
        const cartResponse = await fetch(`${API_BASE}/cart/${currentUser}`);
        const cart = await cartResponse.json();
        
        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }
        
        // Calculate total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Create order
        const order = {
            items: cart.map(item => `${item.name} (x${item.quantity})`),
            total: total,
            customer: {
                name,
                phone,
                address
            },
            payment: {
                bank,
                password: '***'
            }
        };
        
        // Save order
        const orderResponse = await fetch(`${API_BASE}/orders/${currentUser}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });
        
        if (orderResponse.ok) {
            // Clear cart
            await fetch(`${API_BASE}/cart/${currentUser}`, {
                method: 'DELETE'
            });
            
            alert('완료되었습니다.');
            document.getElementById('checkout-form').reset();
            router.navigate('/');
        } else {
            alert('Failed to complete order.');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Failed to complete order.');
    }
}

// ========== ORDERS FUNCTIONS ==========

async function renderOrders() {
    if (!isLoggedIn()) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${currentUser}`);
        const orders = await response.json();
        
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        let filteredOrders = orders;
        
        if (startDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.date).toISOString().split('T')[0];
                return orderDate >= startDate;
            });
        }
        
        if (endDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.date).toISOString().split('T')[0];
                return orderDate <= endDate;
            });
        }
        
        if (filteredOrders.length === 0) {
            container.innerHTML = '<p>No orders found.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        filteredOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';
            
            const date = new Date(order.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            card.innerHTML = `
                <button class="delete-order-btn" onclick="deleteOrder('${order.id}')">삭제</button>
                <div class="order-date">${date}</div>
                <div class="order-items">${order.items.join(', ')}</div>
                <div class="order-total">Total: ${order.total.toLocaleString('ko-KR')}원</div>
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('Failed to load orders.');
    }
}

function filterOrders() {
    renderOrders();
}

// (새로 추가된) 주문 내역 삭제 함수
async function deleteOrder(orderId) {
    if (!confirm('정말 이 주문 내역을 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${currentUser}/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            renderOrders(); // 성공 시 화면 새로고침
        } else {
            alert('주문 내역 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('주문 내역 삭제 중 오류가 발생했습니다.');
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const addModal = document.getElementById('add-item-modal');
    const editModal = document.getElementById('edit-item-modal');
    
    if (event.target === addModal) {
        closeAddItemModal();
    }
    if (event.target === editModal) {
        closeEditItemModal();
    }
});
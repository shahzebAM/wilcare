import React, { useState, useEffect } from 'react';
import ImageViewer from 'react-simple-image-viewer';

export default function ShoppingApp() {

  /* ================= AUTH ================= */
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('staffList');
    return saved ? JSON.parse(saved) : [{ name: 'staff1', password: '1234' }];
  });

  /* ================= CUSTOMERS ================= */
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [checkoutCustomer, setCheckoutCustomer] = useState('');

  /* ================= ORDER HISTORY ================= */
  const [orderHistory, setOrderHistory] = useState(() => {
    const saved = localStorage.getItem('orderHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }, [orderHistory]);

  /* ================= PRODUCTS ================= */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Student Items');
  const [cart, setCart] = useState([]);
  const [quantityMap, setQuantityMap] = useState({});

  /* ================= MODALS ================= */
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  /* ================= IMAGE VIEWER ================= */
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

  /* ================= STAFF MODAL ================= */
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');

  /* ================= RESTORE LOGIN ================= */
  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      const u = JSON.parse(saved);
      setCurrentUser(u);
      setScreen(u.role === 'admin' ? 'admin' : 'app');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('staffList', JSON.stringify(staffList));
  }, [staffList]);

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const categoryFiles = [
      { name: 'Student Items', file: '/assets/products.json' },
    ];

    Promise.all(
      categoryFiles.map(cat =>
        fetch(cat.file)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log(`Loaded ${cat.name}:`, data);
            return data.map((p, index) => ({ 
              ...p, 
              category: cat.name,
              uniqueId: `${cat.name}-${p.id || index}`
            }));
          })
          .catch(err => {
            console.error(`Failed to load ${cat.file}:`, err);
            return [];
          })
      )
    ).then(results => {
      const allProducts = results.flat();
      console.log('Total loaded products:', allProducts.length);
      
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      
      const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
      console.log('Categories:', uniqueCategories);
      setCategories(uniqueCategories);
      
      const q = {};
      allProducts.forEach(p => {
        q[p.uniqueId] = '';
      });
      setQuantityMap(q);
    });
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    let filtered = products.filter(p =>
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    filtered = filtered.filter(p => p.category === selectedCategory);
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  /* ================= LOGIN ================= */
  const login = () => {
    if (loginName === 'admin' && loginPassword === 'admin123') {
      const user = { name: 'Admin', role: 'admin' };
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
      setScreen('admin');
      return;
    }
    const staff = staffList.find(s => s.name === loginName && s.password === loginPassword);
    if (!staff) return alert('Invalid credentials');
    const user = { name: staff.name, role: 'staff' };
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setScreen('app');
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setScreen('login');
    setCurrentUser(null);
  };

  /* ================= CART ================= */
  const addSelectedToCart = () => {
    const itemsToAdd = filteredProducts.filter(p => {
      const qty = quantityMap[p.uniqueId];
      return qty && qty !== '' && Number(qty) > 0;
    });
    
    if (itemsToAdd.length === 0) {
      alert('Please enter quantities for items to add');
      return;
    }

    itemsToAdd.forEach(product => {
      const qty = Number(quantityMap[product.uniqueId]);
      const existing = cart.find(i => i.uniqueId === product.uniqueId);
      if (existing) {
        setCart(prev => prev.map(i =>
          i.uniqueId === product.uniqueId ? { ...i, quantity: i.quantity + qty } : i
        ));
      } else {
        setCart(prev => [...prev, { ...product, quantity: qty }]);
      }
    });

    const clearedQuantities = {};
    Object.keys(quantityMap).forEach(key => {
      clearedQuantities[key] = '';
    });
    setQuantityMap(clearedQuantities);
  };

  const updateCartQty = (uniqueId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.uniqueId !== uniqueId));
    } else {
      setCart(cart.map(i => i.uniqueId === uniqueId ? { ...i, quantity: qty } : i));
    }
  };

  const removeCartItem = (uniqueId) => {
    setCart(cart.filter(i => i.uniqueId !== uniqueId));
  };

  const clearCart = () => {
    setCart([]);
  };

  /* ================= IMAGE VIEWER ================= */
  const openImageViewer = index => {
    setImages(filteredProducts.map(p => p.image));
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

  /* ================= CHECKOUT MESSAGE ================= */
  const generateMessage = () => {
    const items = cart
      .map(i => `${i.code} - ${i.description} x ${i.quantity}`)
      .join('\n');
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    return `Staff: ${currentUser.name}
Customer: ${checkoutCustomer}

Order:
${items}

Total: ₱${total}`;
  };

  const finalizeCustomer = () => {
    if (!checkoutCustomer) return alert('Enter customer name');
    if (!customers.includes(checkoutCustomer)) {
      setCustomers([...customers, checkoutCustomer]);
    }
  };

  const saveOrderToHistory = () => {
    const order = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      staff: currentUser.name,
      customer: checkoutCustomer,
      items: cart.map(i => ({
        code: i.code,
        description: i.description,
        quantity: i.quantity,
        price: i.price
      })),
      total: cart.reduce((s, i) => s + i.price * i.quantity, 0)
    };
    setOrderHistory([order, ...orderHistory]);
  };

  const checkoutEmail = () => {
    finalizeCustomer();
    saveOrderToHistory();
    window.location.href =
      `mailto:shahzebali654321@gmail.com?subject=New Order&body=${encodeURIComponent(generateMessage())}`;
    resetAfterCheckout();
  };

  const checkoutViber = () => {
    finalizeCustomer();
    saveOrderToHistory();
    window.location.href =
      `viber://forward?text=${encodeURIComponent(generateMessage())}`;
    resetAfterCheckout();
  };

  const resetAfterCheckout = () => {
    setCart([]);
    setCheckoutCustomer('');
    setIsCheckoutOpen(false);
    setIsCartOpen(false);

    const emptyQuantities = {};
    products.forEach(p => {
      emptyQuantities[p.uniqueId] = '';
    });
    setQuantityMap(emptyQuantities);
  };

  /* ================= ORDER HISTORY ================= */
  const printOrder = (order) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const itemsList = order.items.map(i => 
      `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${i.code}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${i.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${i.price}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f5f5f5; padding: 8px; border: 1px solid #ddd; text-align: left; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <h2>Order #${order.id}</h2>
          <p><strong>Date:</strong> ${order.date}</p>
          <p><strong>Staff:</strong> ${order.staff}</p>
          <p><strong>Customer:</strong> ${order.customer}</p>
          
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div class="total">Total: ₱${order.total.toFixed(2)}</div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearHistory = () => {
    if (!window.confirm('Are you sure you want to clear all order history? This cannot be undone.')) return;
    setOrderHistory([]);
    localStorage.removeItem('orderHistory');
  };

  /* ================= STAFF MANAGEMENT ================= */
  const addStaff = () => {
    if (!newStaffName || !newStaffPassword) return alert('Enter name and password');
    if (staffList.find(s => s.name === newStaffName)) return alert('Staff already exists');

    const updatedList = [...staffList, { name: newStaffName, password: newStaffPassword }];
    setStaffList(updatedList);
    setNewStaffName('');
    setNewStaffPassword('');
  };

  const removeStaff = (name) => {
    if (!window.confirm(`Remove staff "${name}"?`)) return;
    setStaffList(staffList.filter(s => s.name !== name));
  };

  /* ================= LOGIN SCREEN ================= */
  if (screen === 'login') return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <div style={{ background: 'white', padding: 30, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20 }}>Login</h2>
        <input
          style={{ width: '100%', padding: 10, marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
          placeholder="Username"
          value={loginName}
          onChange={e => setLoginName(e.target.value)}
        />
        <input
          style={{ width: '100%', padding: 10, marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
        />
        <button
          style={{ width: '100%', padding: 10, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          onClick={login}
        >
          Login
        </button>
      </div>
    </div>
  );

  /* ================= ADMIN SCREEN ================= */
  if (screen === 'admin') return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Admin Panel</h2>
        <button
          style={{ padding: '8px 16px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          onClick={logout}
        >
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          onClick={() => setIsStaffModalOpen(true)}
        >
          Manage Staff
        </button>
        <button
          style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          onClick={() => setIsHistoryOpen(true)}
        >
          Order History ({orderHistory.length})
        </button>
      </div>

      {/* STAFF MANAGEMENT MODAL */}
      {isStaffModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, width: 400, borderRadius: 8 }}>
            <h3 style={{ marginBottom: 20 }}>Staff Management</h3>

            <input
              style={{ width: '100%', padding: 8, marginBottom: 10, border: '1px solid #ddd', borderRadius: 4 }}
              placeholder="Staff Name"
              value={newStaffName}
              onChange={e => setNewStaffName(e.target.value)}
            />
            <input
              style={{ width: '100%', padding: 8, marginBottom: 10, border: '1px solid #ddd', borderRadius: 4 }}
              type="password"
              placeholder="Password"
              value={newStaffPassword}
              onChange={e => setNewStaffPassword(e.target.value)}
            />
            <button
              style={{ width: '100%', padding: 10, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 20 }}
              onClick={addStaff}
            >
              Add Staff
            </button>

            <hr style={{ margin: '20px 0' }} />

            <h4 style={{ marginBottom: 10 }}>Existing Staff</h4>
            {staffList.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span>{s.name}</span>
                <button
                  style={{ padding: '4px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  onClick={() => removeStaff(s.name)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              style={{ width: '100%', padding: 10, background: '#666', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 20 }}
              onClick={() => setIsStaffModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ORDER HISTORY MODAL */}
      {isHistoryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', padding: 30, width: '90%', maxWidth: 800, borderRadius: 8, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Order History</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                {orderHistory.length > 0 && (
                  <button
                    style={{ padding: '6px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    onClick={clearHistory}
                  >
                    Clear History
                  </button>
                )}
                <button
                  style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}
                  onClick={() => setIsHistoryOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {orderHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: 40 }}>No orders yet</p>
              ) : (
                orderHistory.map(order => (
                  <div key={order.id} style={{ background: '#f9f9f9', padding: 15, borderRadius: 6, marginBottom: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 5 }}>Order #{order.id}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>{order.date}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Staff: {order.staff}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>Customer: {order.customer}</div>
                      </div>
                      <button
                        style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                        onClick={() => printOrder(order)}
                      >
                        🖨️ Print
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid #ddd', paddingTop: 10, marginTop: 10 }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                          <span>{item.code} - {item.description}</span>
                          <span>x{item.quantity} = ₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ fontWeight: 'bold', marginTop: 10, textAlign: 'right', fontSize: 15 }}>
                        Total: ₱{order.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              style={{ width: '100%', padding: 10, background: '#666', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 20 }}
              onClick={() => setIsHistoryOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const selectedCount = filteredProducts.filter(p => {
    const qty = quantityMap[p.uniqueId];
    return qty && qty !== '' && Number(qty) > 0;
  }).length;

  /* ================= MAIN APP SCREEN ================= */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <h2>Products</h2>
        <button
          style={{ padding: '8px 16px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          onClick={logout}
        >
          Logout
        </button>
      </div>

      <input
        style={{ width: '100%', padding: 10, marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {/* CATEGORY TABS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 15, overflowX: 'auto', paddingBottom: 10 }}>
        {categories.map(cat => (
          <button
            key={cat}
            style={{
              padding: '8px 16px',
              background: selectedCategory === cat ? '#1976d2' : 'white',
              color: selectedCategory === cat ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredProducts.map((item, i) => (
          <div key={item.uniqueId} style={{ background: 'white', padding: 12, borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 70, fontSize: 13, fontFamily: 'monospace' }}>{item.code}</span>

              <span
                style={{ flex: 1, fontSize: 13, cursor: 'pointer' }}
                onClick={() => openImageViewer(i)}
              >
                {item.description}
              </span>

              <span style={{ color: 'green', fontWeight: 'bold' }}>₱{item.price}</span>

              <input
                type="number"
                value={quantityMap[item.uniqueId]}
                onChange={e =>
                  setQuantityMap({ ...quantityMap, [item.uniqueId]: e.target.value })
                }
                style={{ width: 100, padding: 6, border: '1px solid #ddd', borderRadius: 4, textAlign: 'center' }}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        ))}
      </div>

      {/* SINGLE ADD BUTTON */}
      {selectedCount > 0 && (
        <button
          onClick={addSelectedToCart}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          +
          {selectedCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#d32f2f',
              color: 'white',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {selectedCount}
            </span>
          )}
        </button>
      )}

      {/* CART FLOATING BUTTON */}
      <button
        onClick={() => setIsCartOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: '#2e7d32',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontSize: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}
      >
        🛒
        {cart.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: '#d32f2f',
            color: 'white',
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 'bold'
          }}>
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        )}
      </button>

      {/* CART MODAL */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, width: 450, borderRadius: 8, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Cart</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  style={{ padding: '4px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
                <button
                  style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}
                  onClick={() => setIsCartOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>

            {cart.map(i => (
              <div key={i.uniqueId} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                <span style={{ flex: 1, fontSize: 14 }}>{i.description}</span>
                <input
                  type="number"
                  value={i.quantity}
                  onChange={e => updateCartQty(i.uniqueId, Number(e.target.value))}
                  style={{ width: 80, padding: 6, border: '1px solid #ddd', borderRadius: 4, textAlign: 'center' }}
                />
                <button
                  style={{ padding: 6, background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  onClick={() => removeCartItem(i.uniqueId)}
                >
                  🗑️
                </button>
              </div>
            ))}

            <button
              style={{ width: '100%', padding: 12, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 20 }}
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, width: 420, borderRadius: 8 }}>
            <h3 style={{ marginBottom: 20 }}>Customer Name</h3>
            <input
              style={{ width: '100%', padding: 10, marginBottom: 20, border: '1px solid #ddd', borderRadius: 4 }}
              placeholder="Enter customer name"
              value={checkoutCustomer}
              onChange={e => setCheckoutCustomer(e.target.value)}
              list="customers"
            />
            <datalist id="customers">
              {customers.map(c => <option key={c} value={c} />)}
            </datalist>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ flex: 1, padding: 12, background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                onClick={checkoutEmail}
              >
                Email
              </button>
              <button
                style={{ flex: 1, padding: 12, background: '#2e7d32', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                onClick={checkoutViber}
              >
                Viber
              </button>
            </div>
            <button
              style={{ width: '100%', padding: 10, background: '#666', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 10 }}
              onClick={() => setIsCheckoutOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isViewerOpen && (
        <ImageViewer
          src={images}
          currentIndex={currentImageIndex}
          closeOnClickOutside={true}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
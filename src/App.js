import React, { useState, useEffect } from 'react';
import ImageViewer from 'react-simple-image-viewer';
import {
  Container,
  TextField,
  Button,
  Card,
  Typography,
  Box,
  IconButton,
  Stack,
  Divider,
  Modal,
  Autocomplete,
  Badge
} from '@mui/material';
import { Add, Remove, Logout, ShoppingCart, Delete } from '@mui/icons-material';

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

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  /* ================= PRODUCTS ================= */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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
    // Define your JSON files here with their category names
    const categoryFiles = [
      { name: 'Student Items', file: '/assets/products.json' },
      { name: 'Dental Items', file: '/assets/dental.json' }
      // Add more categories as needed
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
            console.log(`Loaded ${cat.name}:`, data); // Debug log
            return data.map((p, index) => ({ 
              ...p, 
              category: cat.name,
              uniqueId: `${cat.name}-${p.id || index}` // Create unique ID per category
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
      console.log('Products by category:', allProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {}));
      
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(allProducts.map(p => p.category))];
      console.log('Categories:', uniqueCategories);
      setCategories(uniqueCategories);
      
      const q = {};
      allProducts.forEach(p => (q[p.uniqueId] = ""));
      setQuantityMap(q);
    });
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    console.log('Filtering - Selected Category:', selectedCategory);
    console.log('Total products:', products.length);
    
    let filtered = products.filter(p =>
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    console.log('After search filter:', filtered.length);
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
      console.log(`After category filter (${selectedCategory}):`, filtered.length);
    }
    
    console.log('Filtered products:', filtered);
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
  const addToCart = product => {
    const qty = Number(quantityMap[product.uniqueId] || 1);
    const existing = cart.find(i => i.uniqueId === product.uniqueId);
    if (existing) {
      setCart(cart.map(i =>
        i.uniqueId === product.uniqueId ? { ...i, quantity: i.quantity + qty } : i
      ));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
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

  const checkoutEmail = () => {
    finalizeCustomer();
    window.location.href =
      `mailto:shahzebali654321@gmail.com?subject=New Order&body=${encodeURIComponent(generateMessage())}`;
    resetAfterCheckout();
  };

  const checkoutViber = () => {
    finalizeCustomer();
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
      emptyQuantities[p.id] = '';
    });
    setQuantityMap(emptyQuantities);
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
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h5">Login</Typography>
        <TextField fullWidth label="Username" sx={{ mt: 2 }} value={loginName} onChange={e => setLoginName(e.target.value)} />
        <TextField fullWidth type="password" label="Password" sx={{ mt: 2 }} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
        <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={login}>Login</Button>
      </Card>
    </Container>
  );

  /* ================= ADMIN SCREEN ================= */
  if (screen === 'admin') return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Admin Panel</Typography>
        <Button startIcon={<Logout />} color="error" onClick={logout}>Logout</Button>
      </Stack>

      <Button variant="contained" onClick={() => setIsStaffModalOpen(true)}>Manage Staff</Button>

      {/* STAFF MANAGEMENT MODAL */}
      <Modal open={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)}>
        <Box sx={{ bgcolor: 'white', p: 3, width: 400, mx: 'auto', mt: '10%', borderRadius: 2 }}>
          <Typography variant="h6">Staff Management</Typography>

          <Stack spacing={1} mt={2}>
            <TextField
              label="Staff Name"
              size="small"
              value={newStaffName}
              onChange={e => setNewStaffName(e.target.value)}
            />
            <TextField
              label="Password"
              size="small"
              type="password"
              value={newStaffPassword}
              onChange={e => setNewStaffPassword(e.target.value)}
            />
            <Button variant="contained" onClick={addStaff}>Add Staff</Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">Existing Staff</Typography>
          {staffList.map(s => (
            <Stack key={s.name} direction="row" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography>{s.name}</Typography>
              <Button color="error" size="small" onClick={() => removeStaff(s.name)}>Remove</Button>
            </Stack>
          ))}
        </Box>
      </Modal>
    </Container>
  );

  /* ================= MAIN APP SCREEN ================= */
  return (
    <Container maxWidth="xl" sx={{ mt: 2, pb: 8 }}>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography variant="h5">Products</Typography>
        <Button startIcon={<Logout />} color="error" onClick={logout}>Logout</Button>
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {/* CATEGORY TABS */}
      <Stack direction="row" spacing={1} mt={1} sx={{ overflowX: 'auto', pb: 1 }}>
        {categories.map(cat => (
          <Button
            key={cat}
            size="small"
            variant={selectedCategory === cat ? 'contained' : 'outlined'}
            onClick={() => setSelectedCategory(cat)}
            sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
          >
            {cat}
          </Button>
        ))}
      </Stack>

      <Stack spacing={0.5} mt={1}>
        {filteredProducts.map((item, i) => (
          <Card key={item.uniqueId} sx={{ p: 0.8, width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ width: 70, fontSize: 13 }}>{item.code}</Typography>

              <Box flex={1} onClick={() => openImageViewer(i)} sx={{ cursor: 'pointer' }}>
                <Typography sx={{ fontSize: 13 }}>
                  {item.description}
                  <Box component="span" sx={{ ml: 1, color: 'green' }}>₱{item.price}</Box>
                </Typography>
              </Box>

              <TextField
                type="number"
                size="small"
                value={quantityMap[item.uniqueId]}
                onClick={e => e.stopPropagation()}
                onChange={e =>
                  setQuantityMap({ ...quantityMap, [item.uniqueId]: Math.max(1, Number(e.target.value)) })
                }
                sx={{ width: 60 }}
              />

              <Button
                size="small"
                variant="contained"
                onClick={e => { e.stopPropagation(); addToCart(item); }}
              >
                Add
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>

      {/* CART FLOATING BUTTON */}
      <IconButton
        onClick={() => setIsCartOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: 'success.main',
          color: 'white',
          width: 60,
          height: 60,
          boxShadow: 4,
          '&:hover': { bgcolor: 'success.dark' }
        }}
      >
        <Badge badgeContent={cart.reduce((s, i) => s + i.quantity, 0)} color="error">
          <ShoppingCart />
        </Badge>
      </IconButton>

      {/* CART MODAL */}
      <Modal open={isCartOpen} onClose={() => setIsCartOpen(false)}>
        <Box sx={{ bgcolor: 'white', p: 3, width: 450, mx: 'auto', mt: '10%', borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Cart</Typography>
            <Button color="error" size="small" startIcon={<Delete />} onClick={clearCart}>Clear Cart</Button>
          </Stack>

          {cart.map(i => (
            <Stack key={i.uniqueId} direction="row" spacing={1} alignItems="center">
              <Typography flex={1}>{i.description}</Typography>
              <TextField
                type="number"
                size="small"
                value={i.quantity}
                onChange={e => updateCartQty(i.uniqueId, Number(e.target.value))}
                sx={{ width: 70 }}
              />
              <IconButton color="error" onClick={() => removeCartItem(i.uniqueId)}><Delete /></IconButton>
            </Stack>
          ))}

          <Button fullWidth sx={{ mt: 2 }} variant="contained" onClick={() => setIsCheckoutOpen(true)}>Checkout</Button>
        </Box>
      </Modal>

      {/* CHECKOUT MODAL */}
      <Modal open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)}>
        <Box sx={{ bgcolor: 'white', p: 3, width: 420, mx: 'auto', mt: '10%', borderRadius: 2 }}>
          <Typography variant="h6">Customer Name</Typography>
          <Autocomplete
            freeSolo
            options={customers}
            value={checkoutCustomer}
            onChange={(e, v) => setCheckoutCustomer(v || '')}
            onInputChange={(e, v) => setCheckoutCustomer(v)}
            renderInput={(params) => <TextField {...params} sx={{ mt: 2 }} />}
          />
          <Stack direction="row" spacing={1} mt={3}>
            <Button fullWidth variant="contained" onClick={checkoutEmail}>Email</Button>
            <Button fullWidth variant="contained" color="success" onClick={checkoutViber}>Viber</Button>
          </Stack>
        </Box>
      </Modal>

      {isViewerOpen && (
        <ImageViewer
          src={images}
          currentIndex={currentImageIndex}
          closeOnClickOutside={true}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </Container>
  );
}
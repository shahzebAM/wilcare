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
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [quantityMap, setQuantityMap] = useState({});

  /* ================= MODALS ================= */
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  /* ================= IMAGE VIEWER ================= */
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

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
    fetch('/assets/products.json')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setFilteredProducts(data);
        const q = {};
        data.forEach(p => (q[p.id] = ""));
        setQuantityMap(q);
      });
  }, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    setFilteredProducts(
      products.filter(p =>
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, products]);

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
    const qty = Number(quantityMap[product.id] || 1);
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      setCart(cart.map(i =>
        i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
      ));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
  };

  const updateCartQty = (id, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.id !== id));
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const removeCartItem = (id) => {
    setCart(cart.filter(i => i.id !== id));
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

  /* ================= LOGIN UI ================= */
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

  /* ================= MAIN APP ================= */
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

      <Stack spacing={0.5} mt={1}>
        {filteredProducts.map((item, i) => (
          <Card key={item.id} sx={{ p: 0.8, width: '100%' }}>
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
                value={quantityMap[item.id]}
                onClick={e => e.stopPropagation()}
                onChange={e =>
                  setQuantityMap({ ...quantityMap, [item.id]: Math.max(1, Number(e.target.value)) })
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
            <Stack key={i.id} direction="row" spacing={1} alignItems="center">
              <Typography flex={1}>{i.description}</Typography>
              <TextField
                type="number"
                size="small"
                value={i.quantity}
                onChange={e => updateCartQty(i.id, Number(e.target.value))}
                sx={{ width: 70 }}
              />
              <IconButton color="error" onClick={() => removeCartItem(i.id)}><Delete /></IconButton>
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

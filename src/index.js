const express = require("express");
const bcrypt = require('bcryptjs');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require("mongoose");
const session = require('express-session');
const bodyParser = require('body-parser');
const User = require("./models/User"); // Import the User model
const app = express();
const flash = require('express-flash');
app.use(flash());
app.use(expressLayouts);
const PORT = 3000;
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();  // Load environment variables from .env

// Middleware for parsing cookies (if using JWT in cookies)
const cookieParser = require('cookie-parser');
app.use(cookieParser());
// Import the Order model at the top of your `index.js` file

// Use the profile routes
app.use(bodyParser.json());
const JWT_SECRET = 'your_secret_key';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/myEcommerceDB');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
connectDB();

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route to Fetch All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to Fetch a Single User by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Set up session for storing cart and user data
app.use(session({
    secret: process.env.SESSION_SECRET,  // Use the secret from .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware to make sure cart is initialized in session
app.use((req, res, next) => {
    console.log('Session:', req.session); // Add this middleware to log session
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});
app.use((req, res, next) => {
    res.locals.session = req.session; // Make session data available in EJS views
    next();
    });

// Middleware to populate req.user
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            req.user = user; // Assign the user to req.user
        } catch (err) {
            console.error('Error fetching user:', err);
        }
    }
    next();
});
// Serve static files and set the view engine to EJS
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set('layout', 'layout');

// Route to display the login page
app.get('/register', (req, res) => {
    res.render('register', { title: 'Login'});
});
// Registration Route
app.post('/register', async (req, res) => {
    const { firstName, lastName, contactNumber, email, password } = req.body;

    console.log('Registration request received');
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);
    console.log('Contact Number:', contactNumber);
    console.log('Email:', email);
    console.log('Password:', password);

    try {

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // If email exists, send a message to the user
            console.log('Email already exists');
            return res.status(400).send('Email already exists');
        }

        // Create a new user instance with all required fields
        const newUser = new User({
            firstName,
            lastName,
            contactNumber,
            email,
            password,  // Store the hashed password
        });

        // Save the user
        await newUser.save();
        console.log('User registered successfully');
        res.redirect('/login');  // Redirect to login page after registration

    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send('Error registering user');
    }
});

// Route to display the login page
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' ,message:'' });
});

// Login route without password hashing
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('Login request received');
    console.log('Email:', email);
    console.log('Password:', password);

    try {
        // Check if user exists with the provided email
        const user = await User.findOne({ email: req.body.email.toLowerCase() });
        if (!user) {
            // If user not found, send email not registered message
            console.log('Email not registered');
            return res.status(400).render('login', { message: 'Email not registered' });
        }
        // Compare the entered password with the stored plain text password
    if (user.password === password) {
      // Passwords match, login successful
      req.session.userId = user._id; // Store the user in the session
        return res.redirect('/home');
    } else {
      // Incorrect password
        return res.status(400).send('Incorrect password');
    }
    } catch (err) {
    console.error(err);
    return res.status(500).send('Internal server error');
    }
});

// Route for the home page
app.get("/", (req, res) => {
    res.redirect('/home');  // Redirect to /home
});

// /home route to render home page
app.get("/home", (req, res) => {
    res.render('home', { title: 'Home Page' }); // Render home page
});
// Route for products page
app.get("/products", (req, res) => {
    res.render("products", { title: "Products Page" });
});


// Route to serve the checkout page with cart details
app.get('/checkout', (req, res) => {
    // Assuming the cart is stored in the session
    const cart = req.session.cart || [];  // Default to empty array if no cart exists

    // Calculate total price or any other details
    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Pass cart details and total amount to the checkout view
    res.render('checkout', {
        cart: cart,
        totalAmount: totalAmount
    });
    });

    app.post('/checkout', async (req, res) => {
        const { userId, items, totalAmount } = req.body;
        
        const orderId = "ORDER" + Date.now(); // Generate unique order ID
        
        try {
            const order = new Order({
            orderId,
            userId,
            items,
            totalAmount,
            paymentStatus: "Pending",
            });
        
            await order.save();
            console.log("Order saved successfully:", orderId);
        
            res.status(200).json({ message: "Order generated successfully", orderId });
        } catch (error) {
            console.error("Error saving order:", error);
            res.status(500).json({ error: "Failed to generate order" });
        }
        });

app.post('/add-to-cart', (req, res) => {
    const { name, price } = req.body;

    // Initialize the cart if it doesn't exist
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Check if the item exists in the cart
    const existingItem = req.session.cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;  // Increase quantity if item exists
    } else {
        req.session.cart.push({ name, price, quantity: 1 });  // Add new item to cart
    }

    res.json({ success: true, cart: req.session.cart });
});


// Remove item from cart route
app.post('/remove-from-cart', (req, res) => {
    const { name } = req.body;
    let cart = req.session.cart || [];

    const item = cart.find(item => item.name === name);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;  // Decrease the quantity by 1
        } else {
            cart = cart.filter(item => item.name !== name);  // Remove the item entirely when quantity is 1
        }
    }

    req.session.cart = cart;

    res.json({
        success: true,
        cart: req.session.cart,
        totalItems: req.session.cart.length,
    });
});



app.get('/cart', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.render('cart', { cart: [], message: 'Your cart is empty.' });
    }
    res.render('cart', { cart: req.session.cart });
});

app.post('/cart', (req, res) => {
    const { id, name, price, quantity } = req.body;

    if (!id || !name || isNaN(price) || isNaN(quantity)) {
        return res.json({ success: false, message: "Invalid product data." });
    }

    // Add to cart logic (ensure `price` and `quantity` are numbers)
    // Example cart format:
    // req.session.cart = [{ id: '3', name: 'Product 3', price: 1000, quantity: 1 }, ...]

    req.session.cart = req.session.cart || [];
    const existingProductIndex = req.session.cart.findIndex(item => item.id === id);

    if (existingProductIndex > -1) {
        req.session.cart[existingProductIndex].quantity += quantity;
    } else {
        req.session.cart.push({ id, name, price, quantity });
    }

    res.json({ success: true, cart: req.session.cart });
});


app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

// Middleware to verify JWT and fetch user data
function authenticateToken(req, res, next) {
    const token = req.cookies.token; // Or `req.headers.authorization`
    const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

    if (!token) {
        return res.status(401).send('Access Denied: No Token Provided');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid Token');
        }

        req.user = user; // Attach the user data to the request object
        next();
    });
}

// Route to update user profile
app.post('/profile/update', authenticateToken, async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        // Update user details in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, address },
            { new: true }
        );

        res.json(updatedUser); // Return updated user data
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
module.exports = router;


// Route to fetch user profile based on session data
app.get('/profile', async (req, res) => {
    // Check if the user is logged in (session contains userId)
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        // Render profile page with user data
        res.render('profile', { user });
    } catch (err) {
        console.error('Error retrieving user data:', err);
        res.status(500).send('Error retrieving profile data');
    }
});


// Route to handle updating user address
app.post('/update-address', async (req, res) => {
    // Check if the user is logged in (session contains userId)
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    const { address } = req.body; // Get the address from the form input

    try {
        // Update the user's address in the database
        const user = await User.findByIdAndUpdate(req.session.userId, { address: address }, { new: true });
        
        if (!user) {
            console.error('User not found with ID:', req.session.userId);
            return res.status(404).send('User not found');
        }

        // Redirect back to profile page after updating the address
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).send('Error updating address');
    }
});

// Assuming you have this route defined in your server

// Route to payment
app.get('/payment', (req, res) => {
    const cart = req.session.cart || [];  // Get cart from session
    res.render('payment', { cart });  // Pass cart to payment.ejs
});


// Handle payment processing and order saving
app.post('/payment', (req, res) => {
    const cart = req.session.cart || [];
    const address = req.body.address; // User's shipping address from form
    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const userId = req.session.userId; // Assuming user is logged in

    // Generate a unique order ID
    const orderId = uuidv4();

    // Save the order in the database
    const newOrder = new Order({
        userId: userId,
        orderId: orderId,
        paymentStatus: 'Pending',
        address: address,
        totalAmount: totalAmount,
        items: cart,
        date: new Date(),
    });

    // Save the order to the database
    newOrder.save()
        .then(order => {
        console.log('Order saved:', order);

        // Clear the cart from the session
        req.session.cart = [];  
        // Redirect to order success page with the order ID
        res.redirect(`/order-success/${orderId}`);
        })
        .catch(err => {
        console.error("Error saving order:", err);
        res.status(500).send("Error processing the order");
        });
    });

    app.post('/confirm-payment', (req, res) => {
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.status(400).send('No items in the cart');
        }
    
        // Process payment logic here (e.g., check if payment is successful)
        const orderId = generateOrderId();  // You can generate an order ID here
        const orderDetails = req.session.cart;
    
        // Save order to database or perform other necessary actions
        saveOrderToDatabase(orderId, orderDetails);
    
        // Clear cart after payment confirmation
        req.session.cart = [];
    
        res.send(`Payment successful! Your order ID is: ${orderId}`);
    });
    
    function generateOrderId() {
        // Generate a unique order ID (e.g., using a timestamp or random ID)
        return `ORDER${Date.now()}`;
    }
    
    function saveOrderToDatabase(orderId, orderDetails) {
        // Save the order details to your database here
    }
    

// Route for orders page
app.get('/orders', (req, res) => {
    // Replace with actual user authentication
    const userId = req.session.userId || 'dummyUserId';

    // Fetch user orders
    const orders = getUserOrders(userId);

    // Render orders page
    res.render('orders', { orders });
});

// Clear cart after checkout or payment
app.post('/clear-cart', (req, res) => {
    req.session.cart = [];
    res.send({ success: true });
});

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    }
    
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
      // User is logged in as admin
        return next();
    }
    // Redirect to login if not authenticated
    res.redirect('/admin/login');
    }

const ADMIN_CREDENTIALS = {
    username: 'admin', // Replace with your desired admin username
    password: 'password123', // Replace with your desired admin password
};


// Serve the admin login page
app.get('/admin/login', (req, res) => {
    res.render('admin-login'); // Render admin-login.ejs
});


  // Handle admin login
    app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      req.session.isAdmin = true; // Set session variable
      return res.redirect('/admin'); // Redirect to admin page
    }  
    res.status(401).send('Invalid username or password');
    });

    app.get('/admin', (req, res) => {
        if (req.session && req.session.isAdmin) {
          // If logged in, show the admin dashboard
          res.render('admin'); // Replace with your admin dashboard view
          res.sendFile(path.join(__dirname, 'views', 'admin-orders.html')); // Adjust path to the file

        } else {
          // If not logged in, show the login form
          res.render('admin-login'); // Replace with your login view
        }
        });

        app.post('/admin', (req, res) => {
            const { username, password } = req.body;
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
              req.session.isAdmin = true; // Mark the user as authenticated
              return res.redirect('/admin'); // Redirect back to admin dashboard
            }

            // Show an error if login fails
            res.status(401).render('admin-login', { error: 'Invalid username or password' });
            });

  // Logout admin
    app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
    });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

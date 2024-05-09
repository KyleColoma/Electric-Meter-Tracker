if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// Import required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')
const flash = require('connect-flash');
const ejsMate = require('ejs-mate');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoSanitize = require('express-mongo-sanitize');
const dbUrl = process.env.DB_URL



// Import models and routes
const Meter = require('./models/meter');
const User = require('./models/user');
const userRoutes = require('./routes/users');

// Import utility functions
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');

// Set up Express app
const app = express();

// mongodb://localhost:27017/ST
// Connect to MongoDB
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'secret!'
    }
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, 'MongoDB connection error:'));
db.once("open", () => {
    console.log('Connected to MongoDB');
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e)
})

// Middleware and configurations
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    store, 
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Set local variables
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/', userRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// About route
app.get('/about', (req, res) => {
    res.render('about');
});

// Resources route
app.get('/resources', (req, res) => {
    res.render('resources');
});

// Error handling
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Error Occurred';
    res.status(statusCode).render('error', { err });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

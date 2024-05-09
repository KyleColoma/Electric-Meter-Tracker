const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Meter = require('../models/meter');
const passport = require('passport');
const Joi = require('joi');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');

router.use(express.urlencoded({ extended: true }));

router.use(express.json());
const flash = require('connect-flash');
router.use(flash());
router.get('/register', (req, res) => {
    res.render('users/register');
})

router.post('/register', catchAsync(async(req, res) => {
    try {
        const {firstName, lastName, email, username, password} = req.body;
        const user = new User({firstName, lastName, email, username}); 
        const registeredUser = await User.register(user, password); 
        res.redirect('/login');
    } catch(e){
        req.flash('error', e.message)
        res.redirect('/register')
    }
}))

router.get('/login', (req, res) => {
    res.render('users/login');
})

router.post('/login', passport.authenticate('local',  { failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    req.flash('success', 'Successfully logged in!')
    res.redirect('/');
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/'); 
    });
});

router.post('/applications', catchAsync(async (req, res) => {
    if (!req.user) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
    }
    req.flash('success', ''); 
    const inputData = req.body.data;
    const newMeter = new Meter({ data: inputData, user: req.user._id });
    await newMeter.save();
    req.flash('success', 'Successfully added new meter reading');
    res.redirect('/applications');
}));

router.get('/applications', catchAsync(async (req, res) => {
    if (!req.user) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
    }

    const submittedData = await Meter.find({ user: req.user._id }).sort({ createdAt: -1 }); // Fetch data submitted by current user
    res.render('applications', { submittedData });
}));

router.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if(!err.message) err.message = 'Error Occured'
    res.status(statusCode).render('error', { err })
})

module.exports = router;
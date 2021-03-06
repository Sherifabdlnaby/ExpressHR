const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();

// Load User Model
require('../models/user');
const User = mongoose.model('user');

// User Login Route
router.get('/login', (req, res) => {
  res.render('users/login');
});

// User Register Route
router.get('/register', (req, res) => {
  res.render('users/register');
});

// Login Form POST
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: (req.session.returnTo || '/'),
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Register Form POST
router.post('/register', (req, res) => {
  let errors = [];

  if(req.body.password != req.body.password2){
    errors.push({text:'Passwords do not match'});
  }

  if(req.body.password.length < 4){
    errors.push({text:'Password must be at least 4 characters'});
  }

  if(errors.length > 0){
    res.render('users/register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      password2: req.body.password2
    });
  } else {
    User.findOne( { $or : [ {email: req.body.email}, {username: req.body.username} ] })
      .then(user => {
        if(user){
          req.flash('error_msg', 'Username or Email already registered');
          res.redirect('/users/register');
        } else {
          const newUser = new User({
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
          });
          
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if(err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => {

                  passport.authenticate('local')(req, res, function () {
                    req.flash('success_msg', 'Welcome');
                    res.redirect('/');
                  })
                })
                .catch(err => {
                  return;
                });
            });
          });
        }
      });
  }
});

router.post('/checkUsername/', async (req, res) => {
  let user = await User.findOne( {username: req.body.username} );
  if(user){
    res.json({
      "valid" : false,
      "message" : "Username Already Exists"
    })
  } else {
    res.json({
      "valid" : true
    })
  }
});

router.post('/checkEmail/', async (req, res) => {
  let user = await User.findOne( {email: req.body.email} );
  if(user){
    res.json({
      "valid" : false,
      "message" : "Email Already Exists"
    })
  } else {
    res.json({
      "valid" : true
    })
  }
});

// Logout User
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
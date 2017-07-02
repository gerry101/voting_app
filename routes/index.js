var User       = require('../models/user'),
//    config     = require('../config/index'),
    middleware = require('../middleware'),
    nodemailer = require('nodemailer'),
    passport   = require('passport'),
    express    = require('express'),
    crypto     = require('crypto'),
    asyncc     = require('async'),
    router     = express.Router();

router.get('/', function(req, res) {
   res.render('landing', {'info': 'Search for any poll below'}); 
});

router.get('/register', function(req, res) {
   res.render('register'); 
});

router.post('/register', function(req, res) {
   var newUser = new User({username: req.body.username, email: req.body.email});
   User.register(newUser, req.body.password, function(err, user) {
      if(err) {
          var emailErr = "E11000 duplicate key error index: voting_app.users.$email_1 dup key: { :"
          if(err.message.substring(0, emailErr.length) === emailErr) {
              return res.render("register", {"error": "A user with that email address already exists"});
          } else {
              req.flash("error", err.message);
              return res.redirect("/register");
          }
      } 
      passport.authenticate('local') (req, res, function() {
         req.flash("success", "You have signed up successfuly");
         res.redirect('/'); 
      });
   });
});

router.get('/login', function(req, res) {
   res.render('login'); 
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.render('login', {"error": "Username or password is incorrect"}); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
      delete req.session.redirectTo;
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

router.get('/profile', middleware.isLoggedIn, function(req, res) {
   User.findById(req.user._id).populate('polls').exec(function(err, user) {
      if(err) {
          req.flash('error', 'An error seems to have ocured');
          res.redirect('/');
      } else {
          res.render('profile', {user: user});
      }
   });
});

router.get('/logout', function(req, res) {
   req.logout();
   req.flash('info', 'You have just logged out');
   res.redirect('/');
});

router.get('/forgot', function(req, res) {
   res.render('forgot'); 
});

router.post('/forgot', function(req, res, next) {
 asyncc.waterfall([
 function(done) {
 crypto.randomBytes(20, function(err, buf) {
 var token = buf.toString('hex');
 done(err, token);
 });
 },
 function(token, done) {
 User.findOne({email: req.body.email }, function(err, user) {
 if(!user) {
 req.flash('error', "No VoteBaz account matched that email address");
 return res.redirect('/forgot');
 }
 user.resetPasswordToken = token;
 user.resetPasswordExpires = Date.now() + 3600000; 
 user.save(function(err) {
 done(err, token, user);
 });
 });
 }, function(token, user, done) {
 var client = nodemailer.createTransport({
 service: 'SendGrid',
 auth: {
 user: 'ChamaTest',
 pass: 'kyamachama1'
 }
 });
 var email = {
 from: 'VoteBaz <teamkyama@gmail.com>',
 to: user.email,
 subject: 'VoteBaz Account Password Reset',
 html: '<p>Hello,</p>' +
       '<p>You are receiving this because you (or someone else) has requested the reset of the password for your VoteBaz account.</p>' +
       '<p>Please click on the following link, or paste this into your browser to complete the process:</p>' +
       '<p> http://' + req.headers.host + '/reset/' + token + '</p>' +
       '<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>' +
       '<p>From the VoteBaz team,<br>' +
       'Have a  :-)  time<br>' +
       'Feel free to reach out at teamkyama@gmail.com</p>'
      };
 client.sendMail(email, function(err) {
 req.flash('success', 'An e-mail has been sent to \'' + user.email + '\' with further instructions.');
 req.flash('info', 'It might take a few minutes as VoteBaz does it\'s thing :-)');
     
 done(err, 'done');
 });
 }
 ], function(err) {
 if(err) return next(err.message);
 res.redirect('/forgot');
 });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
        user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res) {
  asyncc.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        user.setPassword(req.body.password, function(err, user) {
                if(err) {
                    req.flash("error", "Something wrong seems to have occurred. Please try again");
                    res.redirect("/forgot");
                } else {
                    user.save();
                }
        });
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
          user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var client = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'ChamaTest',
          pass: 'kyamachama1'
        }
      });
      var email = {
        from: 'VoteBaz <teamkyama@gmail.com>',
        to: user.email,
        subject: 'VoteBaz Account Password Reset',
        html: '<p>Hey there,</p>' +
              '<p>This is a confirmation that the password for your VoteBaz account ' + user.email + ' has just been changed.</p>' +
              '<p>From the VoteBaz team,<br>' +
              'Have a  :-)  time<br>' +
              'Feel free to reach out at kyama@gmail.com</p>'
      };
      client.sendMail(email, function(err) {
        req.flash('success', 'Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});  

module.exports = router;
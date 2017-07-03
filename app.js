var session        = require('express-session'),
    methodOverride = require('method-override'),
    LocalStrategy  = require('passport-local'),
    User           = require('./models/user'),
    flash          = require('connect-flash'),
    bodyParser     = require('body-parser'),
    mongoose       = require('mongoose'),
    passport       = require('passport'),
    express        = require('express'),
    app            = express();

var indexRoutes = require('./routes/index'),
    pollRoutes  = require('./routes/poll');

//voting_app
mongoose.connect(process.env.DATABASEURL);

app.use(session({
    secret: 'voting app app in voting',
    resave: false,
    saveUninitialized: false
}));
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(flash());

app.use(function(req, res, next) {
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   res.locals.info = req.flash('info');
   next(); 
});

app.use(indexRoutes);
app.use(pollRoutes);
app.set('view engine', 'ejs');


var port = process.env.PORT || 3000;
app.listen(port);
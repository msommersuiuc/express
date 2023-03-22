var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const session = require('express-session');

var indexRouter = require('./routes/index');

var app = express();

// Configure express-session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if you use HTTPS
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport session setup
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Configure OIDC strategy
const strategyConfig = {
    identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.CLIENT_ID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.REDIRECT_URL,
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.CLIENT_SECRET,
    validateIssuer: false,
    passReqToCallback: false,
    scope: ['openid', 'profile', 'email'],
};

passport.use(new OIDCStrategy(strategyConfig, (iss, sub, profile, accessToken, refreshToken, done) => {
    return done(null, profile);
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/auth/openid',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

app.post('/auth/openid/return',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.sendStatus(500);
        }

        const logoutUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/logout`;
        const postLogoutRedirectUrl = encodeURIComponent('http://localhost:3000');

        res.redirect(`${logoutUrl}?post_logout_redirect_uri=${postLogoutRedirectUrl}`);
    });
});

app.get('/login', (req, res) => {
    res.send('<a href="/auth/openid">Log in with Azure AD</a>');
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

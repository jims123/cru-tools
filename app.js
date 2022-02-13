require('./common/global_defines');
CT.blockchain.evt.on('loaded', async () => {
    require('./blockchain/subscribe');
});
CT.blockchain.evt.once('loaded', async () => {
    CT.MT.mt._TW.emit('round', 'start');
});
CT.MT.start();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');
const ejs = require("ejs");
const SQLiteStore = require('connect-sqlite3')(session);

var app = express();

app.set('trust proxy', 1);
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('connect-timeout')(120 * 1000, {
    respond: false,
}));
app.use(function (req, res, next) {
    res.header('X-Powered-By', 'CV1.0.0');
    req.on('timeout', function () {
        return next(new CT.Exception(CT.error.ERROR_REQUEST_TIMEOUT));
    });
    next();
});
app.use(logger('dev'));
app.use(session({
    secret: CT.config.CookieSecret,
    name: CT.config.SessionName,
    resave: false,
    saveUninitialized: false,
    cookie: {httpOnly: true, path: '/', maxAge: 3600 * 24 * 7 * 1000},
    store: new SQLiteStore({
        db:'sessions.db'
    }),
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(CT.co(async function (req, res, next) {
    if (!CT.BC_ENV.isReady || !CT.BC_ENV.isConnected) {
        throw new CT.Exception(CT.error.ERROR_BC_API_CONNECT_FAILED);
    } else {
        next();
    }
}));


app.get('/login', CT.co(CT.ctrls.auth.pageLogin));
app.post('/login', CT.co(CT.ctrls.auth.login));
app.all('/logout', CT.co(CT.ctrls.auth.logout));

app.use(CT.co(async function authCheck(req, res, next) {

    req.user = {};
    if (req.session && !req.session.data) {
        return res.redirect(301, '/login');
    }
    if (!req.session) {
        req.session = {};
    }
    res.locals.user = req.user = req.session.data;
    next();
}));

app.use('/', CT.routers.mainpage);
app.use('/reward', CT.routers.reward);
app.use('/owner', CT.routers.owner);
app.use('/member', CT.routers.member);
app.use('/account', CT.routers.account);
app.use('/user', CT.routers.user);
app.use('/syscfg', CT.routers.sysCfg);
app.use('/sse', CT.routers.sse);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(CT.co(async function (err, res, next) {
    throw err;
}));

process.on('uncaughtException', err => {
    if (err.message == '|ghkdsofig') {
        throw new Error('oh');
    }
    console.error(err);
})
module.exports = app;

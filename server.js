const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

function createServer() {
    const app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname); // flat structure: .ejs views live in the project root
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    // Flat structure: only serve the one static asset explicitly instead of
    // exposing the whole root (which now also holds source files and .env).
    app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));

    app.use(session({
        secret: process.env.SESSION_SECRET || 'darkx-md-secret-change-me',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
    }));

    app.locals.botName = 'DARKX-MD';

    app.use('/', require('./route_pair'));
    app.use('/admin', require('./route_admin'));
    app.use('/user', require('./route_user'));

    app.get('/', (req, res) => res.redirect('/pair'));

    app.use((req, res) => res.status(404).render('404', { botName: 'DARKX-MD' }));

    return app;
}

module.exports = { createServer };

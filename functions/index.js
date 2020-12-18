const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const path = require('path');
const parse = require('body-parser');
const compression = require('compression');
const async = require('async');
const helmet = require('helmet');
const yup = require('yup');
const cors = require('cors');

require('dotenv').config();

admin.initializeApp();
const db = admin.firestore();

const app = express();

function parallelLoad(middlewares) {
    return (req, res, next) => {
        async.each(middlewares, (mw, cb) => {
            mw(req, res, cb);
        }, next);
    };
}

app.use(parallelLoad([
    cors({origin: true}),
    helmet(),
    helmet.contentSecurityPolicy({
        directives: {
            "default-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/", "https://use.fontawesome.com/", "http://www.w3.org/", "data:", "https://www.google-analytics.com/", "http://www.googletagmanager.com/", "https://cdn.cookielaw.org/"],
            "script-src": ["'strict-dynamic'", "'nonce-rAnd0m123'", "'unsafe-inline'", "http:", "https:"]
        }
    }),
    compression(),
    express.static(path.join(__dirname, 'public')),
    parse.urlencoded({ extended: true }),
    parse.json(),
]));

const notFoundPath = path.join(__dirname, 'public', '404.html');

app.get('/:id', async (req, res) => {
    res.setHeader('Content-Encoding', 'compression');
    res.setHeader('Content-Type', 'text/html');

    let { id } = req.params;
    id = id.toLowerCase();

    try {
        const url = await getUrl(id);

        if(url) {
            return res.redirect(url.url)
        }
        
        return res.status(404).sendFile(notFoundPath);
    } catch (error) {
        return res.status(404).sendFile(notFoundPath);
    }
});

const schema = yup.object().shape({
    id: yup.string().trim().matches(/^[\w]+$/i),
    url: yup.string().trim().url('Ungültige URL. Bitte auf Fehler prüfen.').required(),
});

// Create a new Url2Go
app.post('/create-url', async (req, res, next) => {
    let { id, url } = req.body;

    try {
        await schema.validate({
            id,
            url,
        });

        id = id.toLowerCase();

        if(url.includes('gymox.page')) {
            throw new Error('Das darfst du nicht!');
        }

        if(await getUrl(id) !== null) {
            throw new Error('Verkürzte URL bereits vorhanden. Bitte eine andere Verkürtzung versuchen.')
        }

        const newUrl = {
            id: id,
            url: url
        }

        await db.collection('urls').doc(id).set(newUrl);

        return res.json(newUrl);
    } catch (error) {
        return next(error);
    }
});

app.use((req, res, next) => {
    res.setHeader('Content-Encoding', 'compression');
    res.setHeader('Content-Type', 'text/html');
    return res.status(404).sendFile(notFoundPath);
})

app.use((error, req, res, next) => {
    if(error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }

    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'dev' ? error.stack : '',
    })
});

async function getUrl(id) {
    const doc = await db.collection('urls').doc(id).get();
    return doc.exists ? doc.data() : null;
}

exports.app = functions.https.onRequest(app);
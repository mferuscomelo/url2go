// Firebase for the database
const admin = require('firebase-admin');

// Express.js
const express = require('express');

// Used to convert .less styles to .css (for convenience)
const lessMiddleware = require('less-middleware');

const path = require('path');
const parse = require('body-parser');
const urlModule = require('url');
const os = require('os');
const compression = require('compression');
const async = require('async');
const dotenv = require('dotenv');

// Initialize the environment variables
dotenv.config();

// Initialize firebase and connect to the correct database
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://url2go-295111.firebaseio.com"
});
const db = admin.firestore();

// Initialize the app
const app = express();

function parallelLoad(middlewares) {
  return function (req, res, next) {
    async.each(middlewares, function (mw, cb) {
      mw(req, res, cb);
    }, next);
  };
}

// Convert .less styles to .css
if (os.hostname().indexOf("local") > -1)
  app.use(lessMiddleware(path.join(__dirname, 'public')));

// Make Express use the /public directory
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(parse.json());
app.use(parallelLoad([
  function (req, res, next) {
    if (req.secure || process.env.NODE_ENV === 'dev') {
      // request was via https, so do no special handling
      return;
    } else {
      // request was via http, so redirect to https
      res.redirect('https://' + req.headers.host + req.url);
    }
  },
  compression(),
  express.static(path.join(__dirname, 'public')),
  parse.json()
]))

// Home Page
app.get('/', (req, res) => {
  const home = path.join(__dirname, 'public', 'index.html');
  res.sendFile(home);
});

// Page with key
app.get('/:key', (req, res) => {
  // Get the key from the url
  const key = req.params.key;

  // Check if the url2go exists in database
  getUrl(key)
    .then( (doc) => {
      if (doc == null) 
        // Url2Go doesn't exist
        return res.sendFile(path.join(__dirname, 'public', 'not-found.html'));

      // Route user to not-found.html page
      res.redirect(doc.url)
    })
    .catch( (error) => {
      console.error(error);
    });
});

// Create a new Url2Go
app.post('/create-url', async (req, res) => {
  // Catch passed information
  let expireTime = req.body.expireTime;
  let key = req.body.key;
  let url;

  // Check if the url is a proper url
  try {
      url = urlModule.parse(req.body.url);
  } catch (err) {
      return res.status(400).send({error: 'invalid URL'});
  }

  // Check if the URL exists
  await getUrl(key)
    .then( (doc) => {
      if(doc != null)
        // The Url2Go already exists
        return res.status(400).send({error: 'entry already exists'});
    })
    .catch( (error) => {
      console.error(error);
    });

  var currentDate = new Date();

  // Since the Url2Go doesn't exist, create a new one
  db.collection('urls').doc(key).set({
    key: key,
    url: url.href,
    // expireAt: new admin.firestore.Timestamp.fromDate(new Date(Date.now() + ((expireTime) / (60 * 24) )))
  })
  .then( () => {
    return res.status(200).send();
  })
  .catch( (err) => {
    return res.status(400).send({error: 'can\'t create an entry in the database'});
  });
});

const server = app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`Express running at PORT ${server.address().port}`);
});

async function getUrl(key) {
  const doc = await db.collection('urls').doc(key).get();
  return doc.exists ? doc.data() : null;
}
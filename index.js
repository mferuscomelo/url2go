const admin = require('firebase-admin');
const express = require('express');
const path = require('path');
const parse = require('body-parser');
const compression = require('compression');
const async = require('async');
const helmet = require('helmet');
const yup = require('yup');

require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://url2go-295111.firebaseio.com"
});
const db = admin.firestore();

const app = express();

function parallelLoad(middlewares) {
  return function (req, res, next) {
    async.each(middlewares, function (mw, cb) {
      mw(req, res, cb);
    }, next);
  };
}

app.use(parallelLoad([
  helmet(),
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/", "https://use.fontawesome.com/", "http://www.w3.org/", "data:", "https://www.google-analytics.com/", "http://www.googletagmanager.com/", "https://cdn.cookielaw.org/"],
      "script-src": ["'strict-dynamic'", "'nonce-rAnd0m123'", "'unsafe-inline'", "http:", "https:"]
    }
  }),
  compression(),
  express.static(path.join(__dirname, 'public')),
  parse.json()
]));

const notFoundPath = path.join(__dirname, 'public', '404.html');

// Home Page
// app.get('/', (req, res) => {
//   const home = path.join(__dirname, 'public', 'index.html');
//   res.sendFile(home);
// });

app.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const url = await getUrl(id);

    if(url) {
      return res.redirect(url.url)
    }

    return res.status(404).sendFile(notFoundPath)
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

    if(await getUrl(id) != null) {
      throw new Error('Verkürzte URL bereits vorhanden. Bitte eine andere Verkürtzung versuchen.')
    }

    const newUrl = {
      id: id,
      url: url
    }

    await db.collection('urls').doc(id).set(newUrl);

    return res.json(newUrl);
  } catch (error) {
    next(error);
  }
  
  // // Catch passed information
  // let expireTime = req.body.expireTime;
  // let key = req.body.key;
  // let url = req.body.url;

  // console.log('Key: ', key);
  // console.log('Url: ', url);

  // // Check if the url is a proper url
  // if(!validUrl.isUri(url))
  //   return res.status(400).send({errorMessage: 'Ungültige URL. Bitte auf Fehler prüfen.'});

  // // Check if the URL exists
  // await getUrl(key)
  //   .then( (doc) => {
  //     if(doc != null)
  //       // The Url2Go already exists
  //       return res.status(400).json({errorMessage: 'Verkürzte URL bereits vorhanden. Bitte eine andere Verkürtzung versuchen.'});
  //   })
  //   .catch( (error) => {
  //     console.error(error);
  //   });

  // var currentDate = new Date();

  // // Since the Url2Go doesn't exist, create a new one
  // db.collection('urls').doc(key).set({
  //   key: key,
  //   url: url,
  //   // expireAt: new admin.firestore.Timestamp.fromDate(new Date(Date.now() + ((expireTime) / (60 * 24) )))
  // })
  // .then( () => {
  //   return res.status(200).send();
  // })
  // .catch( (err) => {
  //   return res.status(400).send({errorMessage: 'Fehler beim Herstellen einer Datenbankverbindung. Bitte versucht es erneuert.'});
  // });
});

app.use((req, res, next) => {
  res.status(404).sendFile(notFoundPath);
})

app.use((error, req, res, next) => {
  if(error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }

  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
  })
})

const port = process.env.PORT || 5000
const server = app.listen(port, () => {
  console.log(`Express running at PORT ${server.address().port}`);
});

async function getUrl(id) {
  const doc = await db.collection('urls').doc(id).get();
  return doc.exists ? doc.data() : null;
}
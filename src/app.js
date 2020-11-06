require('dotenv').config();
const { MongoClient } = require('mongodb');
const dbURL = process.env.DATABASE;

const doesUrlExist = (db, submittedKey) => db.collection('urls')
  .findOne({ _id: submittedKey });

const express = require('express');
var lessMiddleware = require('less-middleware');
const path = require('path');
const parse = require('body-parser');
const urlModule = require('url');
const { execSync } = require('child_process');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(parse.json());

MongoClient.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    app.locals.db = client.db('url2go');
    console.log('DB connection succesful at ' + dbURL);
  })
  .catch(() => console.error('DB connection failed :('));

app.get('/', (req, res) => {
  const home = path.join(__dirname, 'public', 'index.html');
  res.sendFile(home);
});

app.get('/:key', (req, res) => {
  const key = req.params.key;
  console.log(key);
  const { db } = req.app.locals;
  doesUrlExist(db, key)
    .then(doc => {
      if (doc === null) return res.sendFile(path.join(__dirname, 'public', 'not-found.html'));
      res.redirect(doc.url)
    })
    .catch(console.error);
});

app.post('/create-url', (req, res) => {
  // for debugging
  console.log('Url submitted: ', req.body.url);
  console.log('Key submitted: ', req.body.key);
  console.log('expireTime submitted: ', req.body.expireTime);

  // Catch passed information
  let expireTime = req.body.expireTime;
  let key = req.body.key;
  let url;

  try {
      url = urlModule.parse(req.body.url);
  } catch (err) {
      return res.status(400).send({error: 'invalid URL'});
  }

  const { db } = req.app.locals;

  const dbUrls = db.collection('urls');
  var currentDate = new Date();

  dbUrls.insertOne(
    {
      _id: key,
      url: url.href,
      expireAt: new Date(currentDate.getTime() + expireTime*60000),
    }
  )
  .then( () => {
    return res.status(200).send();
  })
  .catch( (err) => {
    return res.status(400).send({error: 'can\' create an entry in the database'});
  });
});

app.set('port', 8080);

const server = app.listen(app.get('port'), () => {
  console.log(`Express running at PORT ${server.address().port}`);
});
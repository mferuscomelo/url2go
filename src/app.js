const admin = require('firebase-admin');
const express = require('express');
var lessMiddleware = require('less-middleware');
const path = require('path');
const parse = require('body-parser');
const urlModule = require('url');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://url2go-295111.firebaseio.com"
});
const db = admin.firestore();

const app = express();

app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(parse.json());

app.get('/', (req, res) => {
  const home = path.join(__dirname, 'public', 'index.html');
  res.sendFile(home);
});

app.get('/:key', (req, res) => {
  const key = req.params.key;

  getUrl(key)
    .then( (doc) => {
      if (doc == null) 
        return res.sendFile(path.join(__dirname, 'public', 'not-found.html'));

      res.redirect(doc.url)
    })
    .catch(console.error);
});

app.post('/create-url', async (req, res) => {
  // Catch passed information
  let expireTime = req.body.expireTime;
  let key = req.body.key;
  let url;

  try {
      url = urlModule.parse(req.body.url);
  } catch (err) {
      return res.status(400).send({error: 'invalid URL'});
  }

  await getUrl(key)
    .then( (doc) => {
      if(doc != null)
        return res.status(400).send({error: 'entry already exists'});
    })
    .catch( (error) => {
      console.error(error);
    });

  var currentDate = new Date();

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
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const keys = require('./config/keys');

require('./models/User');
require('./models/Blog');
require('./services/passport');
require('./services/cache');

mongoose.Promise = global.Promise;
// mongoose.connect('mongodb+srv://a:147532@cluster0-3m8qh.mongodb.net/blog?retryWrites=true&w=majority', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverSelectionTimeoutMS: 5000
// }).catch(err => console.log(err.reason));

mongoose.connect(keys.mongoURI, { useNewUrlParser: true })
  .then(() => {
    console.log('Connection to the Atlas Cluster is successful!')
  })
  .catch((err) => console.error(err));;;
// mongoose.connect(keys.mongoURI, { dbName: 'blog' }, { useNewUrlParser: true })
// .then(() => {
//   console.log('Connection to the Atlas Cluster is successful!')
// })
// .catch((err) => console.error(err));;

const app = express();

app.use(bodyParser.json());
app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
);
app.use(passport.initialize());
app.use(passport.session());

require('./routes/authRoutes')(app);
require('./routes/blogRoutes')(app);
// require('./routes/uploadRoutes')(app);

if (['production'].includes(process.env.NODE_ENV)) {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});

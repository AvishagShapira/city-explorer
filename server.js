const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();

const PORT = process.env.PORT || 3000;
const users = [];
const comments = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'xss-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: false }
}));

const upload = multer({ dest: 'public/uploads/' });

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user, comments });
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) return res.send('User already exists.');
  users.push({ email, password });
  req.session.user = { email };
  res.redirect('/');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const user = users.find(u => u.email === req.body.email && u.password === req.body.password);
  if (!user) return res.send('Invalid credentials');
  req.session.user = { email: user.email };
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.post('/comment', upload.single('image'), (req, res) => {
  const image = req.file ? '/uploads/' + req.file.filename : null;
  const user = req.session.user?.email || 'Anonymous';
  comments.push({ id: uuidv4(), user, text: req.body.text, image });
  res.redirect('/');
});

app.get('/comment/:id/edit', (req, res) => {
  const comment = comments.find(c => c.id === req.params.id);
  if (!comment || comment.user !== req.session.user?.email) return res.sendStatus(403);
  res.render('edit', { comment });
});

app.post('/comment/:id/edit', upload.single('image'), (req, res) => {
  const comment = comments.find(c => c.id === req.params.id);
  if (!comment || comment.user !== req.session.user?.email) return res.sendStatus(403);
  comment.text = req.body.text;
  if (req.file) {
    comment.image = '/uploads/' + req.file.filename;
  }
  res.redirect('/');
});

app.post('/comment/:id/delete', (req, res) => {
  const index = comments.findIndex(c => c.id === req.params.id && c.user === req.session.user?.email);
  if (index !== -1) comments.splice(index, 1);
  res.redirect('/');
});

app.listen(PORT, () => console.log(`Portal running at http://localhost:${PORT}`));

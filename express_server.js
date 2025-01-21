const express = require("express");
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { getUserByEmail,urlsForUser, generateRandomString } = require('./helpers');
const app = express();
const PORT = 8080;

app.use(morgan('dev'));
app.use(express.urlencoded({extended: true }));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_KEY || 'development-secret-key'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Initialize URL database
let urlDatabase = {};

// Initialize the users database
const users = {};

// Track deleted URLs using a simple object
const deletedUrls = {};

// Home route
app.get("/", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  if (!user) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

// Route to return the URL database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to render a page displaying all URLs
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  // If user is not logged in, return error message
  if (!user) {
    return res.status(403).send("Please log in to view your urls");
  }

  const userUrls = urlsForUser(userId, urlDatabase);

  const templateVars = {
    urls: userUrls,
    user: user
  };
  res.render("urls_index", templateVars);
});

// Route to render the form for creating a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  // If user is not logged in redirect to login page
  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

// Route to handle form submission and create a new short URL
app.post("/urls", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  if (!user) {
    return res.status(403).send("Please log in to create a new short URL");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  };

  res.redirect(`/urls/${shortURL}`);
});

// Route to display the specific short URL and its corresponding long URL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];
  const userId = req.session.userId;
  const user = users[userId];

  // If user is not logged in return error message
  if (!user) {
    return res.status(403).send('Please log in to view the URL details.');
  }

  // If the URL does not exist return error message
  if (!urlData) {
    return res.status(404).send('Short URL not found!');
  }

  // If the logged in user does not own the URL return error message
  if (urlData.userID !== userId) {
    return res.status(403).send('You do not have permission to view this URL.');
  }

  // If all checks pass, render the page
  const templateVars = {
    id: shortURL,
    longURL: urlData.longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

// Route to handle redirection to the long URL based on the short URL ID
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;

  // Check if the URL has been deleted
  if (deletedUrls[shortURL]) {
    return res.status(410).send("410 - Gone: This shortened URL has been deleted and is no longer available.");
  }

  const urlData = urlDatabase[shortURL];

  if (!urlData) {
    return res.status(404).send("404 - URL Not Found: The shortened URL you are trying to access does not exist.");
  }
  
  // Redirect the user to the long URL - using a permanent redirect
  res.redirect(301, urlData.longURL); // Use 301 for permanent redirection
});

// Route to render the form for updating a URL
app.get("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const urlData = urlDatabase[shortURL];
  const userId = req.session.userId;
  const user = users[userId];

  if (!urlData) {
    return res.status(404).send('Short URL not found!');
  }

  if (!user) {
    return res.status(403).send('Please log in to edit the URL.');
  }

  if (urlData.userID !== userId) {
    return res.status(403).send('You do not have permission to view this URL.');
  }

  const templateVars = {
    id: shortURL,
    longURL: urlData.longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

// Route to handle form submission and update a URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const userId = req.session.userId;
  const urlData = urlDatabase[shortURL];

  if (!urlData) {
    return res.status(404).send('Short URL not found!');
  }

  if (!userId) {
    return res.status(403).send('Please log in to edit the URL');
  }

  if (urlData.userID !== userId) {
    return res.status(403).send('You do not have permission to edit this URL');
  }

  // Update the long URL in the database
  urlDatabase[shortURL] = {
    longURL: newLongURL,
    userID: userId,
  };

  res.redirect(`/urls/${shortURL}`);
});

// Route to handle deleting a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.userId;
  const urlData = urlDatabase[shortURL];

  if (!urlData) {
    return res.status(404).send('Short URL not found!');
  }

  if (!userId) {
    return res.status(403).send('Please log in to delete the URL');
  }

  if (urlData.userID !== userId) {
    return res.status(403).send('You do not have permission to delete this URL');
  }

  deletedUrls[shortURL] = true;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Route to GET the login form
app.get("/login", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  // If user is logged in, redirect to /urls
  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: user
  };
  res.render("login", templateVars);
});

// Route to handle login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const existingUser = getUserByEmail(email, users);

  if (!existingUser) {
    return res.status(403).send('Invalid user');
  }

  // Compare plain password with stored hash
  if (!bcrypt.compareSync(password, existingUser.password)) {
    return res.status(403).send('incorrect password');
  }

  req.session.userId = existingUser.id;
  res.redirect("/urls");
});

// Route to handle logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Route to render the registration form
app.get("/register", (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];

  // If user is logged in, redirect to /urls
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: user
  };
  res.render("register", templateVars);
});

// Route to handle registration form submission
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send('Email is already registered!');
  }

  const userid = generateRandomString();
  users[userid] = {
    id: userid,
    email: email,
    password: hashedPassword,
  };
  req.session.userId = userid;
  res.redirect("/urls");
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
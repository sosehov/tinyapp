const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(morgan('dev'));
app.use(express.urlencoded({extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

// Initialize URL database
let urlDatabase = {};

// Initialize the users database
const users = {};

// Generate a random 6-character string for a short URL ID
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Helper function to lookup user in users object
const findUserByEmail = function(email) {
  for (const userid in users) {
    if (users[userid].email === email) {
      return users[userid];
    }
  }
  return null;
};

// Route to return the URL database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to render a page displaying all URLs
app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];
  const templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_index", templateVars);
});

// Route to render the form for creating a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
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
  const userId = req.cookies['user_id'];
  const user = users[userId];

  if (!user) {
    return res.send("Please log in to create a new short URL");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Route to display the specific short URL and its corresponding long URL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const userId = req.cookies['user_id'];
  const user = users[userId];

  if (!longURL) {
    return res.status(404).send('Short URL not found!');
  }

  const templateVars = {
    id: shortURL,
    longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

// Route to handle redirection to the long URL based on the short URL ID
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];

  if (!longURL) {
    return res.status(404).send('Short URL not found!'); // Return 4404 if short URL doesn't exist
  }

  // Redirect the user to the long URL (using a permanent redirect)
  res.redirect(301, longURL); // Use 301 for permanent redirection
});

// Route to render the form for updating a URL
app.get("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const userId = req.cookies['user_id'];
  const user = users[userId];

  if (!longURL) {
    return res.status(404).send('Short URL not found!');
  }

  const templateVars = {
    id: shortURL,
    longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

// Route to handle form submission and update a URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Short URL not found!');
  }

  // Update the long URL in the database
  urlDatabase[shortURL] = newLongURL;
  res.redirect(`/urls/${shortURL}`);
});

// Route to handle deleting a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Short URL not found!');
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Route to GET the login form
app.get("/login", (req, res) => {
  const userId = req.cookies['user_id'];
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
  const existingUser = findUserByEmail(email);

  if (!existingUser) {
    return res.status(403).send('Invalid user');
  }
  if (password !== existingUser.password) {
    return res.status(403).send('incorrect password');
  }
  res.cookie('user_id', existingUser.id);
  res.redirect("/urls");
});

// Route to handle logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login");
});

// Route to render the registration form
app.get("/register", (req, res) => {
  const userId = req.cookies['user_id'];
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

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(400).send('Email is already registered!');
  }

  const userid = generateRandomString();
  users[userid] = {
    id: userid,
    email: email,
    password: password,
  };
  res.cookie('user_id', userid);
  res.redirect("/urls");
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
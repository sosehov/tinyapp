const express = require("express");
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const dbFile = path.join(__dirname, 'urls.json');

app.use(morgan('dev'));
app.use(express.urlencoded({extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

// Initialize URL database
let urlDatabase = {};
const users = {};

// Read URL data from the file on server startup
const loadDatabase = function() {
  fs.readFile(dbFile, 'utf8', (err, data) => {
    if (err) {
      // If the file doesn't exist or can't be read, initialize with an empty object
      if (err.code === 'ENOENT') {
        console.log("Database file not found, initializing a new one.");
      } else {
        console.log("Error reading database file:", err);
      }
      urlDatabase = {}; // Initialize an empty database if reading fails
    } else {
      urlDatabase = JSON.parse(data); // Parse the JSON data from the file
    }
  });
};

// Save URL data to the file whenever it's updated
const saveDatabase = () => {
  fs.writeFile(dbFile, JSON.stringify(urlDatabase, null, 2), (err) => {
    if (err) {
      console.log("Error saving database:", err);
    }
  });
};

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

// Home route
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Route to return the URL database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to render a page displaying all URLs
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: res.locals.user
  };
  res.render("urls_index", templateVars);
});

// Route to render the form for creating a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: res.locals.user
  };
  res.render("urls_new", templateVars);
});

// Route to handle form submission and create a new short URL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  // Save the new short URL and corresponding long URL in the database
  urlDatabase[shortURL] = longURL;
  saveDatabase();

  res.redirect(`/urls/${shortURL}`);
});

// Route to display the specific short URL and its corresponding long URL
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!longURL) {
    return res.status(404).send('Short URL not found!');
  }

  const templateVars = {
    id: shortURL,
    longURL,
    user: res.locals.user,
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

  if (!longURL) {
    return res.status(404).send('Short URL not found!');
  }

  const templateVars = {
    id: shortURL,
    longURL,
    user: res.locals.user,
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
  saveDatabase();
  res.redirect(`/urls/${shortURL}`);
});

// Route to handle deleting a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Short URL not found!');
  }
  delete urlDatabase[shortURL];
  saveDatabase();
  res.redirect("/urls");
});

// Route to handle login
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (username) {
    // Set the 'user_id' cookie
    res.cookie('user_id', username);
    res.redirect("/urls");
  } else {
    res.status(400).send('Username is required!');
  }
});

// Route to handle logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// Route to render the registration form
app.get("/register", (req, res) => {
  res.render("register");
});

// Route to handle registration form submission
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: email,
    password: password,
  };
  res.cookie('user_id', userID);
  res.redirect("/urls");
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Load the database when the server starts up
loadDatabase();
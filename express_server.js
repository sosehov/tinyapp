const express = require("express");
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8080; // default port 8080
const dbFile = path.join(_dirname, 'urls.json');

app.use(morgan('dev')); // Middleware- Enable server side logging
app.use(express.urlencoded({extended: true }));
app.set("view engine", "ejs"); // Set view engine

let urlDatabase = {};

// Load URL data from the file on server startup
fs.readFile(dbFile, (err, data) => {
  if (err) {
    console.log("Could not read database file:", err);
  } else {
    urlDatabase = JSON.parse(data);
  }
});

// Save URL data to the file whenever it's updated
const saveDatabase = () => {
  fs.writeFile(dbFile, JSON.stringify(urlDatabase, null, 2), (err) => {
    if (err) {
      console.log("Error saving database:", err);
    }
  });
};

// Simulates generating a unique short URL id
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  // Generate a random 6-character string
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Home route
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Route for returning URL database in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to render all URLs
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Simple hello world route
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Present the form to the user
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Submit the form
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL; // get the long URL from the form data
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL; // Save the new shortURL -> longURL pair in the database
  saveDatabase(); //Save data to file after each update
  res.redirect(`/urls/${shortURL}`); // Redirect to the newly created URL page
});

// Show specific URL by ID
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if (!longURL) {
    return res.status(404).send('Short URL not found!');
  };
  const templateVars = { id: shortURL, longURL };
  res.render("urls_show", templateVars);
});

//Redirect any request to "/u/id" to its longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    return res.status(404).send('Short URL not found!');
  };
  res.redirect(301, longURL); // Use 301 for permanent redirection
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
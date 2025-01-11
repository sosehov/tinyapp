const express = require("express");
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080

app.use(morgan('dev')); // Middleware- Enable server side logging
app.use(express.urlencoded({extended: true }));
app.set("view engine", "ejs"); // Set view engine

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
})

// Submit the form
app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("OK");
});

// Show specific URL by ID
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
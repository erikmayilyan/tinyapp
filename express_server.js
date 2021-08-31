const express = require("express");
const app = express();
const PORT = 8080; 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

function generateRandomString(len, arr) {
  const result = Math.random().toString(36).slice(2);
  return result.substring(0, 6);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
  //console.log(req.body);
  //res.send("Ok");    
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const url = req.params.shortURL;
  console.log("THIS IS SOME DELETE FUNCTION");
  console.log(url);
  delete urlDatabase[url];
  res.redirect('/urls');
});

app.post("/urls/reroute/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const newLong = req.body.longURL;
  urlDatabase[req.params.shortURL] = newLong;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

const express = require("express");
const app = express();
const PORT = 8080; 
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
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

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

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
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  console.log(users);
  console.log(req.cookies["user_id"], "HELLO");
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const theEmail = req.body.email;
  const thePass = req.body.password;
  const newUserId = generateRandomString();
  const user = { 
    id: newUserId,
    email: req.body["email"],
    password: req.body["password"]
  };
  if(!theEmail || !thePass) {
    res.status(400).send('Please, enter a proper email or a password!');
  };
  for (let user_id in users) {
    if(theEmail === users[user_id].email) {
      res.status(400).send('This account already exists!');
    }
  };
  users[newUserId] = user;
  console.log("HELLO: ", users);
  res.cookie('user_id', newUserId);
  res.redirect("/urls");
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
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/registration", (req, res) => {
  const theUsername = req.body.username;
  console.log(theUsername);
  res.cookie('username', theUsername);
  let user;
  for (const u in users) {
    if (users[u].email === theUsername) {
      console.log(users[u].email);
      user = users[u];
    }
  }
  res.cookie('user_id', user.id);
  console.log(users);
  console.log(theUsername);
  console.log(req.cookies);
  const templateVars = {
    user: user,
    urls: urlDatabase 
  };
  console.log("MY USERNAME IS: ", theUsername);
  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.cookie('user_id', '');
  const templateVars = {
    user: null,
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  const theEmail = req.body.email;
  const thePass = req.body.password;
  if(!theEmail) {
    res.status(403).send('The E-Mail cannot be found!');
  }
  if(!thePass) {
    res.status(403).send('The Password cannot be found!');
  }
  for (let user_id in users) {
    if(theEmail === users[user_id].email && thePass === users[user_id].password) {
      res.cookie('user_id', user_id);
      res.redirect("/urls");
      console.log(user_id);
    } 
  }
});
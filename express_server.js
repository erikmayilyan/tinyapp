const express = require("express");
const app = express();
const PORT = 8080; 
const bodyParser = require("body-parser");
const helpers = require("./helpers");
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 
}));
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

function generateRandomString(len, arr) {
  const result = Math.random().toString(36).slice(2);
  return result.substring(0, 6);
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
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
  if (!req.session["user_id"]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
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

const urlsForUsers = function (userId) {
  const results = {};
  for (const shortURL in urlDatabase) {
    const url = urlDatabase[shortURL];
    if (url.userID === userId) {
      results[shortURL] = url;
    }
  }
  return results;
}

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(401).send('You are not logged in! You can\'t see the URL list!');
  }
  const userID = req.session["user_id"];
  const user = users[userID];
  const urls = urlsForUsers(userID);
  const templateVars = { 
    urls,
    user 
  };
  console.log(users);
  console.log(req.session["user_id"], "HELLO");
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]]
  };
  if (!req.session["user_id"]) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if(req.session["user_id"]) {
    res.redirect("/urls");
  }
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("registration", templateVars);
});

const bcrypt = require('bcrypt');

app.post("/register", (req, res) => {
  const theEmail = req.body.email;
  const thePass = req.body.password;
  const hashedPassword = bcrypt.hashSync(thePass, 10);
  const newUserId = generateRandomString();
  const user = { 
    id: newUserId,
    email: req.body["email"],
    password: hashedPassword
  };
  if(!theEmail || !thePass) {
    res.status(400).send('Please, enter a proper email or a password!');
  };
  const existingUser = helpers.getUserByEmail(theEmail, users);
  if(existingUser) {
    return res.status(400).send('This account already exists!');
  };
  users[newUserId] = user;
  console.log("HELLO: ", users);
  req.session.user_id = newUserId;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL;
  const obj = urlDatabase[shortURL];
  if (!userID) {
    return res.status(400).send('You are not logged in!');
  } else if (obj.userID !== userID) {
    return res.status(400).send('This URL does not belong to you!');
  } else {
    console.log("THIS IS SOME DELETE FUNCTION");
    delete urlDatabase[shortURL];
    res.redirect('/urls');
    console.log(shortURL);
  }
});

app.post("/urls/reroute/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const shortURL = req.params.shortURL;
  const obj = urlDatabase[shortURL];
  if (obj.userID !== userID) {
    return res.status(400).send('This URL does not belong to you!');
  }
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const db = urlDatabase[req.params.shortURL];
  const val = req.session["user_id"];
  if (!db) {
    return res.status(404).send('The URL does not exist!');
  } else if (!req.session["user_id"]) {
    return res.status(401).send('You are not logged in! You can\'t see the URL list!');
  } else if (val !== db.userID) {
    return res.status(401).send('You don\'t own the URL!');
  } else {
    const newLong = req.body.longURL;
    console.log(newLong);
    console.log(urlDatabase);
    const obj = {
        longURL: newLong,
        userID: req.session["user_id"]
    }
    urlDatabase[req.params.shortURL] = obj;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(401).send('UNAUTHORIZED! User must be logged in!');
  }
  const randomString = generateRandomString();
  const obj = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  }
  urlDatabase[randomString] = obj;
  res.redirect(`/urls/${randomString}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const db = urlDatabase[req.params.shortURL];
  const val = req.session["user_id"];
  if (!db) {
    return res.status(403).send('The URL does not exist!');
  } else if (!req.session["user_id"]) {
    return res.status(401).send('You are not logged in! You can\'t see the URL list!');
  } else if (val !== db.userID) {
    return res.status(401).send('You don\'t own the URL!');
  } else {
    const templateVars = { shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session["user_id"]]
    };
    console.log(templateVars);
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const db = urlDatabase[req.params.shortURL];
  if (db) {
    const longURL = db.longURL;
    res.redirect(longURL);
  } else {
    return res.status(404).send('URL does not exist!');
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  const templateVars = {
    user: null,
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  if(req.session["user_id"]) {
    res.redirect("/urls");
  }
  const templateVars = { 
    user: users[req.session["user_id"]]
  };
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  const theEmail = req.body.email;
  const thePass = req.body.password;
  const hashedPassword = bcrypt.hashSync(thePass, 10);
  if(!theEmail) {
    return res.status(403).send('The E-Mail cannot be found!');
  }
  if(!thePass) {
    return res.status(403).send('The Password cannot be found!');
  }
  const existingUser = helpers.getUserByEmail(theEmail, users);
  if(existingUser && bcrypt.compareSync(thePass, existingUser.password)) {
    console.log(existingUser);
    req.session.user_id = existingUser.id;
    res.redirect("/urls");
    return;
  }
  res.status(403).send('Incorrect username or a password!');
});
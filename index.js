const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { checkLoggedIn, bypassLogin } = require('./middleware');
const User = require('./models/User');

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/session-auth")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB error:", err));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
    name: "session-cookie"
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.get("/", checkLoggedIn, (req, res) => {
  res.render("home");
});

// Login Page

app.get("/login", bypassLogin, (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  User.findOne({ username, password })
    .then(user => {
      if (user) {
        req.session.user = {
          username: user.username,
          name: user.username,
          email: user.email,
          date: user.date,
          gender: user.gender,
          password: user.password
        };
        res.redirect("/");
      } else {
        res.render("login", { error: "Invalid username or password" });
      }
    })
    .catch(err => {
      console.error(" Error during login:", err);
      res.render("login", { error: "Something went wrong, please try again." });
    });
});

// Register Page
app.get("/register", bypassLogin, (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
  const { username, password, email, date, gender } = req.body;

  User.findOne({ username })
    .then((existUser) => {
      if (existUser) {
        return res.render("register", { error: "Username already exists" });
      }

      const newUser = new User({ username, password, email, date, gender });
      return newUser.save();
    })
    .then((savedUser) => {
      if (savedUser) {
        req.session.user = {
          username: savedUser.username,
          name: savedUser.username,
          email: savedUser.email,
          date: savedUser.date,
          gender: savedUser.gender,
          password: savedUser.password
        };
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.error(" Error during register:", err);
      res.render("register", { error: "Something went wrong, please try again." });
    });
});



app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("session-cookie");
    res.redirect("/login");
  });
});

app.listen(3000, () => {
  console.log(" Server is running on http://localhost:3000");
});

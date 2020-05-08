const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app =express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.use(session({
  secret: 'Money Manager.',
  resave: false,
  saveUninitialized: false,
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req, res){
  res.sendFile(__dirname + "/index.html")
})
app.get("/Sign-in", function(req, res){
  let str = "Sign-in";
  res.render("register",{register:str})
})
app.get("/Sign-up", function(req, res){
  let str = "Sign-up";
  res.render("register",{register:str})
})
app.get("/dashboard",function(req,res){
  username = req.user.username;
  console.log(username);
  if(req.isAuthenticated()){
    res.render("dashboard",{username:username});
  }
  else{
    res.redirect("/Sign-in");
  }
})
app.get("/Log-out",function(req, res){
  req.logout();
  res.redirect("/");
})

app.post("/Sign-in",function(req,res){

  const user = new User({
    username:req.body.username,
    password: req.body.password
  })

  req.login(user,function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/dashboard");
      })
    }
  })

})
app.post("/Sign-up",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/Sign-up")
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/dashboard");
      })
    }
  })

})











app.listen(3000, function() {
  console.log("Server started on port 3000");
});

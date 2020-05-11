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

const itemsSchema = new mongoose.Schema({
  username:String,
  paymentContext:String,
  amount:Number
})

const Item = mongoose.model("Item",itemsSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  pay:[itemsSchema],
  recieve:[itemsSchema]
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

  if(req.isAuthenticated()){
    User.findOne({username:req.user.username},function(err,foundList){
        res.render("dashboard", {username:username,oldListItems:foundList.pay,newListItems:foundList.recieve})
      })
  }
  else{
    res.redirect("/Sign-in");
  }
})
app.get("/Log-out",function(req, res){
  req.logout();
  res.redirect("/");
})
let user_arr = [];
app.get("/Split", function(req, res){
  res.render("split",{listItems:user_arr});
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

app.post("/dashboard",function(req, res){

  const id=req.user._id;

  let tempitem = new Item({
    username:req.body.username,
    paymentContext:req.body.paymentContext,
    amount:req.body.amount
  })

  const store = req.body.list;
  if (store==="pay"){
    User.findOne({username:req.body.username},function(err,foundList){
      if(foundList){
        if(foundList.length != 0){
          User.findOne({_id:id},function(err, foundLis){
            tempitem = new Item({
              username:foundLis.username,
              paymentContext:req.body.paymentContext,
              amount:req.body.amount
            })
            foundList.recieve.push(tempitem);
            foundList.save();
          })

        }
      }
      })
    User.findOne({_id:id},function(err,foundList){
      if(foundList){
        if(foundList.length != 0){
          foundList.pay.push(tempitem);
          foundList.save();
        }
      }
      res.redirect("/dashboard");
      })
  }
  else {
    User.findOne({username:req.body.username},function(err,foundList){
      if(foundList){
        if(foundList.length != 0){
          User.findOne({_id:id},function(err,foundLis){
            tempitem = new Item({
              username:foundLis.username,
              paymentContext:req.body.paymentContext,
              amount:req.body.amount
            })
            foundList.pay.push(tempitem);
            foundList.save();
          })

        }
      }
      })

    User.findOne({_id:id},function(err,foundList){
      if(foundList){
        if(foundList.length != 0){
          foundList.recieve.push(tempitem);
          foundList.save();
        }
      }
      res.redirect("/dashboard");
      })
  }


})

app.post("/delete",function(req, res){
  const del1 = req.user.username;
  const del2 = req.body.checkbox;
  const pay ="pay";
  const recieve = "recieve";
  const count = req.body.count;
  const action = req.body.action;

if(req.body.action === recieve){
  User.findOne({username:del1},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      foundUser.recieve.splice(count,1);
      foundUser.save();
    }
  })
  User.findOne({username:del2},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      foundUser.pay.splice(count,1);
      foundUser.save();
    }
  })
}
else{
  User.findOne({username:del1},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      foundUser.pay.splice(count,1);
      foundUser.save();
    }
  })
  User.findOne({username:del2},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      foundUser.recieve.splice(count,1);
      foundUser.save();
    }
  })
}

  res.redirect("/dashboard");
})

app.post("/Split", function(req, res){
  const member = req.body.username;
  user_arr.push(member);
  res.redirect("/Split")
})

app.post("/Submit", function(req, res){
  const username = req.body.username;
  const size = req.body.size;
  const paymentContext = req.body.paymentContext;
  const amount = (req.body.amount)/size;

  user_arr.forEach(function(user){
    let tempitem = new Item({
      username:username,
      paymentContext:paymentContext,
      amount:amount
    })

    User.findOne({username:user},function(err, foundUser){

      foundUser.pay.push(tempitem);
      foundUser.save();
    })
    User.findOne({username:username},function(err, foundUser){
      tempitem = new Item({
        username:user,
        paymentContext:paymentContext,
        amount:amount
      })
      foundUser.recieve.push(tempitem);
      foundUser.save();
    })


  })
  user_arr.length=0;
})








app.listen(3000, function() {
  console.log("Server started on port 3000");
});

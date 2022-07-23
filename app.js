const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const HashMap = require("hashmap");

const app = express();
app.use(express.json());

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Mysecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/diffDb", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  Department: String,
});

const itemSchema = new mongoose.Schema({
  itemcode: String,
  itemname: String,
  department: String,
  amount: Number,
  quantity: Number,
});

const departmentSchema = new mongoose.Schema({
  name: String,
  totalbudget: Number,
  remainingbudget: Number,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Item = new mongoose.model("Item", itemSchema);
const Department = new mongoose.model("Department", departmentSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/register", function (req, res) {
  res.render("sign-up");
});

app.get("/login", function (req, res) {
  res.render("sign-in");
});

app.get("/dashboard", function (req, res) {
  if (req.isAuthenticated()) {
    Department.find({}, function (err, foundItem) {
      res.render("dashboard", { dept: foundItem });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/adddept", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("adddept");
  } else {
    res.redirect("/login");
  }
});

app.get("/updatedept", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("updatedept");
  } else {
    res.redirect("/login");
  }
});

// Departemnt Wise
// app.get("/item/department", function (req, res) {
//   var map = new HashMap();
//   Item.find({},function(err,found){
//     found.foreach(e=>{
//       map.set(e.department,count+1)
//     })
//   })
// });

app.get("/updateitem/:id", function (req, res) {
  // console.log("hi");
  if (req.isAuthenticated()) {
    Item.find({ _id: req.params.id }, function (err, foundItem) {
      // console.log(foundItem);
      res.render("updateitem", { item: foundItem[0] });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/item/:dname", function (req, res) {
  // console.log(req.params.dname);
  var count;
  if (req.isAuthenticated()) {
    Item.find({ department: req.params.dname }, function (err, foundItem) {
      count = foundItem.length;
      // console.log(count);
      res.render("items", {
        item: foundItem,
        cn: count,
        dep: req.params.dname,
      });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/item", function (req, res) {
  var count;

  if (req.isAuthenticated()) {
    Item.find({}, function (err, foundItem) {
      count = foundItem.length;
      // console.log(count);
      res.render("items", { item: foundItem, cn: count });
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/additem", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("additem");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  // console.log(req.body);
  //res.send("Hello " + req.body.new);

  User.register(
    {
      username: req.body.username,
      email: req.body.email,
      Department: req.body.Department,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        // console.log("Hongya");
        passport.authenticate("local")(req, res, function () {
          res.redirect("/dashboard");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  // console.log(req.body);
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  // console.log("errors");
  req.login(user, function (err) {
    if (err) {
      //console.log("error");
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        // console.log("login hongya");
        res.redirect("/dashboard");
      });
    }
  });
});

app.post("/createdept", function (req, res) {
  const name1 = req.body.name;
  const totalbudget1 = req.body.totalbudget;
  const remainingbudget1 = req.body.remainingbudget;
  const Department1 = new Department({
    name: name1,
    totalbudget: totalbudget1,
    remainingbudget: remainingbudget1,
  });
  // console.log(Department1);
  // dep.push(name1);
  Department1.save();
  res.redirect("/dashboard");
});

app.post("/updatedept", function (req, res) {
  var abhi;
  Department.find({ name: req.body.name }, async function (err, foundDept) {
    if (err) {
      console.log(err);
    } else {
      // console.log(foundDept[0].item);

      // foundDept[0].remainingbudget = foundDept[0].remainingbudget - amount1;
      abhi = await foundDept[0].remainingbudget;
      phele = await foundDept[0].totalbudget;
      // console.log("sad" + bchahua);
      // console.log("Veere");
      Department.updateOne(
        { name: req.body.name },
        {
          $set: {
            totalbudget: req.body.totalbudget,
            remainingbudget: req.body.totalbudget - (phele - abhi),
          },
        },
        function (err, res) {
          if (!err) {
            //console.log("Hello");
          }
        }
      );

      res.redirect("/dashboard");

      // console.log(foundDept);
      // Department.save();
    }
  });
});

app.post("/additem", function (req, res) {
  // console.log(req.body);
  const itemcode1 = req.body.itemcode;
  const itemname1 = req.body.itemname;
  const department1 = req.body.department;
  const amount1 = req.body.amount;
  const quantity1 = req.body.quantity;
  const Item1 = new Item({
    itemcode: itemcode1,
    itemname: itemname1,
    department: department1,
    amount: amount1,
    quantity: quantity1,
  });
  // console.log(Item1);
  Item1.save();
  var bchahua;
  Department.find({ name: department1 }, async function (err, foundDept) {
    if (err) {
      console.log(err);
    } else {
      // console.log(foundDept[0].item);

      foundDept[0].remainingbudget =
        foundDept[0].remainingbudget - amount1 * quantity1;
      bchahua = await foundDept[0].remainingbudget;
      // console.log("sad" + bchahua);
      // console.log("Veere");
      Department.updateOne(
        { name: department1 },
        {
          $set: {
            remainingbudget: bchahua,
          },
        },
        function (err, res) {
          if (!err) {
            //console.log("Hello");
          }
        }
      );

      // console.log(foundDept);
      // Department.save();
    }
  });
  res.redirect("/dashboard");
});

app.post("/updateitem/:id", function (req, res) {
  // console.log(req.body);

  var oldamount;
  var oldquantity;
  var bchahua;
  Item.find({ _id: req.params.id }, async function (err, foundItem) {
    // const data = await console.log(foundItem);
    // console.log(data);
    oldamount = foundItem[0].amount;
    oldquantity = foundItem[0].quantity;

    Department.find(
      { name: req.body.department },
      async function (err, foundDept) {
        if (err) {
          console.log(err);
        } else {
          // console.log(foundDept[0].item);

          foundDept[0].remainingbudget =
            foundDept[0].remainingbudget -
            (req.body.amount * req.body.quantity - oldamount * oldquantity);
          bchahua = await foundDept[0].remainingbudget;
          // console.log("sad" + bchahua);
          // console.log("Veere");
          Department.updateOne(
            { name: req.body.department },
            {
              $set: {
                remainingbudget: bchahua,
              },
            },
            function (err, res) {
              if (!err) {
                //console.log("Hello");
              }
            }
          );

          // console.log(foundDept);
          // Department.save();
        }
      }
    );
  });

  // console.log("IShaan");

  Item.updateOne(
    { _id: req.params.id },
    {
      $set: {
        quantity: req.body.quantity,
        amount: req.body.amount,
      },
    },
    function (err, res) {
      if (!err) {
        //console.log("Hello");
      }
    }
  );

  res.redirect("/item");
});

app.post("/delete/:id", function (req, res) {
  // console.log("Del try" + req.params.id);
  //console.log(req.body);
  var curamount;
  var curquantity;
  var bchahua;
  Item.find({ _id: req.params.id }, async function (err, foundItem) {
    // const data = await console.log(foundItem);
    // console.log(data);
    curamount = foundItem[0].amount;
    curquantity = foundItem[0].quantity;

    Department.find(
      { name: foundItem[0].department },
      async function (err, foundDept) {
        if (err) {
          console.log(err);
        } else {
          // console.log(foundDept[0].item);

          foundDept[0].remainingbudget =
            foundDept[0].remainingbudget + curamount * curquantity;
          bchahua = await foundDept[0].remainingbudget;
          // console.log("sad" + bchahua);
          // console.log("Veere");
          Department.updateOne(
            { name: foundItem[0].department },
            {
              $set: {
                remainingbudget: bchahua,
              },
            },
            function (err, res) {
              if (!err) {
                //console.log("Hello");
              }
            }
          );

          // console.log(foundDept);
          // Department.save();
        }
      }
    );

    Item.findByIdAndRemove(req.params.id, function (err) {
      if (!err) {
        // console.log("Succesfullt deleted Item");
        res.redirect("/dashboard");
      }
    });
  });
});

app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/check", function (req, res) {
  console.log(req.body);
});

app.listen(3000, function (req, res) {
  console.log("Server started on port 3000");
});

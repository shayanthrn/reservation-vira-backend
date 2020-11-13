const express = require('express');
const router = express.Router();
const fs = require('fs');
const url = require('url');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var cookieParser = require('cookie-parser');
var formidable = require("formidable");
var mv = require('mv');
const TokenGenerator = require('uuid-token-generator');
const tokgen = new TokenGenerator();
var Doctor = require('../coreapp/Doctor.js');
var Chat = require('../coreapp/Chat.js');
var User = require('../coreapp/User.js');
var Reservation = require('../coreapp/Reservation.js');
var ReservationHC = require('../coreapp/ReservationHC.js');
var teleReservation = require('../coreapp/teleReservation.js');
var Category = require('../coreapp/Category.js');
var Transaction = require('../coreapp/Transaction.js');
var dburl = "mongodb://localhost:27017/";          //url of database            auth o doros kon 
var lodash = require('lodash');
var HealthCenter = require('../coreapp/HealthCenter.js');
var time = require('../coreapp/resTime.js');
var persianDate = require('persian-date');
var myDate = require('../coreapp/myDate.js');
var Kavenegar = require('kavenegar');
var request = require('request');
var apikave = Kavenegar.KavenegarApi({
  apikey: "534438436D6364307552744278336A334B694F46343179417642536E66686568"
});
var md5 = require('md5');
const { ObjectID } = require('mongodb');
const ZarinpalCheckout = require('zarinpal-checkout');
const { debugPort } = require('process');
const { Buffer } = require('buffer');
const { query, json } = require('express');
const fileUpload = require('express-fileupload');
const Ticket = require('../coreapp/Ticket.js');
const e = require('express');
const { setTimeout } = require('timers');
const { log } = require('console');
const zarinpal = ZarinpalCheckout.create('3392f819-3761-4add-babb-4d1d70021603', false);

router.get("/mahyar", function (req, res) {
  res.render("mahyar.ejs"), {};
  res.end();
})


var basiccategories = [];


function categories() {
  return new Promise((resolve, reject) => {
    basiccategories = [];
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Categories').find({}).forEach(function (doc) {
        basiccategories.push(doc);
      }, function () {
        resolve(basiccategories);
        db.close();
      })
    })
  })
}

//------------------------api------------------------------//


router.get("/testpayment",function(req,res){
  request({
    url: "https://fcp.shaparak.ir/_ipgw_/payment/simple/",
    method: "POST",
    json: true,
    body: {
      Amount:1007,
      ResNum:"first123",
      MID:"21918395",
      redirectURL:"https://reservation.drtajviz.com"
    }
  }, (error, response, body) => {
    console.log(response)
    console.log("----------");
    console.log(body);
  })
})






//banksalamat

router.get("/api/getAlltypesofHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HCtypes").find({}, async function (err, result) {
        data = await result.toArray()
        res.json({ data: data });
        db.close();
        res.end();
      })
    })
  }
})

router.post("/api/getallHCbytype", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").find({ type: req.body.type }, async function (err, result) {
        data = await result.toArray()
        res.json({ data: data });
        db.close();
        res.end();
      })
    })
  }
})

router.post("/api/getallHCbytypeandcity", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").find({ city: req.body.city, type: req.body.type }, async function (err, result) {
        data = await result.toArray()
        res.json({ data: data });
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getTimeslotsHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      days = [];
      freetimes = []
      dbo.collection("HealthCenters").findOne({ name: query.name }, function (err, result) {
        if (result == null) {
          res.json({ data: 'not found' });
          res.end();
        }
        var catobj = null;
        if (result.systype == "B") {
          catobj = result;
        }
        else {
          result.categories.forEach(function (doc) {
            if (doc.name == query.category) {
              catobj = doc;
            }
          })
        }
        if (catobj == null) {
          res.json({ data: 'invalid category' });
          res.end();
        }
        else {
          currentday = new persianDate();
          days.push(currentday);
          freetimes.push(getDoctimeslots(catobj, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
          for (let i = 0; i < 14; i++) {
            currentday = currentday.add("d", 1);
            days.push(currentday);
            freetimes.push(getDoctimeslots(catobj, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
          }
          res.json({ days: createDayboxobj(days), freetimes: freetimes });
          res.end();
        }
      })
    })
  }
})


router.post("/api/paymentHC", function (req, res) {
  if (req.body.usertoken == undefined) {
    console.log(req.body);
    res.json({ data: "user token not found" })
    res.end();
  }
  else {
    if (req.body.choice == undefined) {
      res.json({ data: "choice is not defined" })
      res.end();
    }
    else {

      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ token: req.body.usertoken }, function (err, user) {
          if (user == null) {
            res.json({ data: "user not found" });
            db.close();
            res.end();
          }
          else {
            if (checkinterval(1)) {
              dbo.collection("HealthCenters").findOne({ name: req.body.HCname }, function (err, HC) {
                if (HC == null) {
                  db.close();
                  res.json({ data: "HC not found" });
                  res.end();
                }
                else {
                  var catobj = null;
                  if (HC.categories == undefined) {
                    catobj = HC;
                  }
                  else {
                    HC.categories.forEach(function (doc) {
                      if (doc.name == req.body.cat) {
                        catobj = doc;
                      }
                    })
                    if (catobj == null) {
                      res.redirect("/noaccess")
                    }
                  }
                  reservedata = req.body.choice.split(":");
                  date = new myDate(Number(reservedata[4]), Number(reservedata[3]), Number(reservedata[2]));
                  start = { hour: Number(reservedata[0]), min: Number(reservedata[1]) };
                  temp = (start.hour * 60) + start.min + catobj.visitduration;
                  end = { hour: Math.floor(temp / 60), min: temp % 60 }
                  unavb = { start: start, end: end, date: date, dayofweek: new persianDate([Number(reservedata[2]), Number(reservedata[3]), Number(reservedata[4])]).format("dddd") };
                  zarinpal.PaymentRequest({
                    Amount: req.body.cost, // In Tomans
                    CallbackURL: 'http://reservation.drtajviz.com/paymenthandlerHC',
                    Description: 'Dr tajviz payment',
                    Email: 'shayanthrn@gmail.com',
                    Mobile: user.phonenumber
                  }).then(response => {
                    if (response.status === 100) {
                      reservation = new ReservationHC(user._id, HC._id, req.body.cat, unavb, response.authority, req.body.cost);
                      addtransaction(user._id, req.body.cost, response.authority);
                      dbo.collection("TempReservesHC").insertOne(reservation, function (err, reserve) {
                        res.json({ data: response.url })
                      })
                    }
                  }).catch(err => {
                    res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
                    console.error(err);
                    db.close();
                    res.end();
                  });
                }
              })
            }
          }
        })
      })
    }
  }
})



router.post("/api/addExperimentFile", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    if (req.files != null) {
      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ phonenumber: req.body.phonenumber }, function (err, user) {
          if (user == null) {
            res.json({ data: "user not found" });
            res.end();
          }
          else {
            dbo.collection("HealthCenters").findOne({ name: req.body.hcname, type: req.body.hctype }, function (err, hc) {
              if (hc == null) {
                res.json({ data: "HC not found" });
                res.end();
              }
              else {
                var now = new Date();
                path = "data/Experiments/" + now.getTime() + ".zip";
                dbo.collection("Experiments").insertOne({ userid: user._id, hcid: hc._id, dateuploaded: now, description: req.body.description, path: path }, function (err, result) {
                  mv(req.files.file.tempFilePath, path, function (err) {
                    res.json({ data: "file uploaded successfully" });
                    db.close();
                    res.end();
                  })
                })
              }
            })
          }
        })

      })
    }
    else {
      res.json({ data: "no file uploaded" });
      res.end();
    }
  }
})


router.get("/api/getAllExperimentsOfuser", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ phonenumber: query.phonenumber }, async function (err, user) {
        if (user == null) {
          res.json({ data: "user not found" });
          db.close();
          res.end();
        }
        else {
          result = await dbo.collection("Experiments").aggregate([{ $match: { userid: user._id } }, { $lookup: { from: "HealthCenters", localField: "hcid", foreignField: "_id", as: "HC" } }, { $project: { "HC.name": 1, "HC.address": 1, "HC.image": 1, "HC.phonenumber": 1, "dateuploaded": 1, "description": 1, "path": 1 } }]).toArray();
          res.json({ data: result });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/api/getAllExperimentsOfHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").findOne({ name: query.name, type: query.type }, function (err, HC) {
        if (HC == null) {
          res.json({ data: "HC not found" });
          db.close();
          res.end();
        }
        else {
          dbo.collection("Experiments").find({ hcid: HC._id }, async function (err, cursor) {
            result = await cursor.toArray();
            res.json({ data: result });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.post("/api/sendTicket", function (req, res) {       //should get chat i
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    var chatid = new ObjectID(req.body.chatid)
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Chats").findOne({ doctor: query.dname, userphone: query.uphone, _id: chatid }, function (err, chat) {
        if (chat != null) {
          var now = new Date();
          var newticket;
          if (req.files == null) {
            newticket = new Ticket(req.body.subject, req.body.text, null, now, req.body.sender);
            chat.tickets.push(newticket);
            dbo.collection("Chats").updateOne({ doctor: query.dname, userphone: query.uphone, _id: chatid }, { $set: { tickets: chat.tickets } }, function (err, asd) {
              res.json({ data: "succesfull" });
              res.end();
            })
          }
          else {
            var arr = req.files.file.name.split('.');
            var fileformat = arr[arr.length - 1];
            var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
            newticket = new Ticket(req.body.subject, req.body.text, file, now, req.body.sender);
            mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
              chat.tickets.push(newticket);
              dbo.collection("Chats").updateOne({ doctor: query.dname, userphone: query.uphone, _id: chatid }, { $set: { tickets: chat.tickets } }, function (err, asd) {
                res.json({ data: "succesfull" });
                res.end();
              })
            })
          }
        }
        else {
          var newchat = new Chat(query.dname, query.uphone);
          var now = new Date();
          var newticket;
          if (req.files == null) {
            newticket = new Ticket(req.body.subject, req.body.text, null, now, req.body.sender);
            newchat.tickets.push(newticket);
            dbo.collection("Chats").insertOne(newchat, function (err, as) {
              res.json({ data: "succesfull" });
              res.end();
            })
          }
          else {
            var arr = req.files.file.name.split('.');
            var fileformat = arr[arr.length - 1];
            var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
            newticket = new Ticket(req.body.subject, req.body.text, file, now, req.body.sender);
            mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
              newchat.tickets.push(newticket);
              dbo.collection("Chats").insertOne(newchat, function (err, as) {
                res.json({ data: "succesfull" });
                res.end();
              })
            })
          }
        }
      })
    })
  }
})

router.get('/api/getAlltickets', function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Chats").findOne({ doctor: query.dname, userphone: query.uphone }, function (err, chat) {
        if (chat == null) {
          res.json({ data: "not found" });
          res.end();
        }
        else {
          res.json({ data: chat });
          res.end();
        }
      })
    })
  }
})

router.get("/api/downloadfile", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "noaccess" });
    res.end();
  }
  else {
    console.log(query)
    res.download(query.path);
  }
})



//banksalamat

router.get("/api/verification", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    var phonenumber = query.phonenumber;
    var myresponse;
    MongoClient.connect(dburl, function (err, db) {
      if (err) throw err;
      var dbo = db.db("mydb");
      var verifycode = Math.floor(Math.random() * (99999 - 10000) + 10000);
      verifycode = verifycode.toString();
      apikave.VerifyLookup({
        token: verifycode,
        template: "reservation",
        receptor: phonenumber
      },
        function (response, status) {
          if (status == 200) {
            dbo.collection("signupcode").updateOne({ phonenumber: phonenumber }, { $set: { code: verifycode, phonenumber: phonenumber, date: new Date().getTime() } }, { upsert: true }, function (err, result) {
              dbo.collection("Users").findOne({ phonenumber: query.phonenumber }, function (err, user) {
                if (user == null) {
                  myresponse = { func: "signup", code: verifycode };
                }
                else {
                  myresponse = { func: "login", code: verifycode };
                }
                res.json(myresponse)
                db.close();
                res.end();
              })
            })
          }
          else {
            res.write("problem in sending");
            db.close();
            res.end();
          }
        });
    });
  }
})

router.get("/api/login", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    var query = url.parse(req.url, true).query;
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ phonenumber: query.phonenumber }, function (err, user) {
        if (user == null) {
          res.json("not exist")
          db.close();
          res.end();
        }
        else {
          dbo.collection("signupcode").deleteOne({ phonenumber: query.phonenumber })
          res.json({ token: user.token });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.post("/api/signup", function (req, res) {
  if (req.body.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb")
      dbo.collection("signupcode").deleteOne({ phonenumber: req.body.phonenumber })
      var user = new User(req.body.phonenumber);
      user.sex = req.body.gender;
      user.firstname = req.body.firstname;
      user.lastname = req.body.lastname;
      user.birthdate = req.body.birthdate;
      let token1 = tokgen.generate();
      user.token = token1;
      dbo.collection('Users').insertOne(user, function (err, result6) {
        if (err) res.json({ status: "nok" })
        else {
          res.json({ status: "ok", token: token1 });
        }
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getCategories", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    var data = [];
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Categories").find({}).forEach(function (doc) {
        data.push(doc);
      }, function () {
        res.json({ Categories: data });
        db.close();
        res.end();
      })
    })
  }
})

router.get("/api/getDoctors", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    var data = [];
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Doctors").find({}).forEach(function (doc) {
        data.push(doc);
      }, function () {
        res.json({ Doctors: data });
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getDoctorsBycategory", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    var data = [];
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Doctors").find({ categories: query.category }).forEach(function (doc) {
        data.push(doc);
      }, function () {
        res.json({ Doctors: data });
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getDoctorsBycategory-city", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.write("noaccess");
    res.end();
  }
  else {
    var data = [];
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Doctors").find({ categories: query.category, city: query.city }).forEach(function (doc) {
        data.push(doc);
      }, function () {
        res.json({ Doctors: data });
        db.close();
        res.end();
      })
    })
  }
})

router.get("/api/getCurUser", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "no access" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: query.token }, { projection: { reservations: 0 } }, async function (err, user) {
        if (user == null) {
          res.json({ data: "not found" });
          db.close();
          res.end();
        }
        else {
          user.chats = await dbo.collection("Chats").find({ userphone: user.phonenumber }).toArray()
          user.reserves = await dbo.collection("Reservations").aggregate([{ $match: { user: user._id } }, { $lookup: { from: "Doctors", localField: "doctor", foreignField: "_id", as: "doctor" } }, { $lookup: { from: "HealthCenters", localField: "HC", foreignField: "_id", as: "HC" } }, { $project: { "time": 1, "refid": 1, "HC.name": 1, "HC.image": 1, "HC.address": 1, "HC.phonenumber": 1, "catname": 1, "doctor.name": 1, "doctor.categories": 1, "doctor.image": 1, "doctor.workphone": 1, "doctor.background": 1, "doctor.medicalnumber": 1, "doctor.address": 1 } }]).toArray();
          user.teleReservations = await dbo.collection("teleReservations").aggregate([{ $match: { user: user._id } }, { $lookup: { from: "Doctors", localField: "doctor", foreignField: "_id", as: "doctor" } }, { $project: { "doctor.name": 1, "doctor.image": 1, "doctor.workphone": 1, "doctor.background": 1, "doctor.medicalnumber": 1, "doctor.categories": 1, "doctor.address": 1, "timeinfo": 1, "refid": 1 } }]).toArray()
          res.json({ user: user });
          db.close();
          res.end();
        }
      })
    })
  }
})


router.get("/api/getTimeSlots", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.key != "pouyarahmati") {
    res.json({ data: "no access" });
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      days = [];
      freetimes = []
      dbo.collection("Doctors").findOne({ name: query.doctor }, function (err, result) {
        if (result == null) {
          res.json({ data: "not found" });
          db.close();
          res.end();
        }
        currentday = new persianDate();
        days.push(currentday);
        freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
        for (let i = 0; i < 14; i++) {
          currentday = currentday.add("d", 1);
          days.push(currentday);
          freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
        }
        res.json({ days: createDayboxobj(days), freetimes: freetimes });
        db.close();
        res.end();
      })
    })
  }
})


router.post("/api/payment", function (req, res) {
  if (req.body.usertoken == undefined) {
    console.log(req.body);
    res.json({ data: "user token not found" })
    res.end();
  }
  else {
    if (req.body.choice == undefined) {
      res.json({ data: "choice is not defined" })
      res.end();
    }
    else {

      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ token: req.body.usertoken }, function (err, user) {
          if (user == null) {
            res.json({ data: "user not found" });
            db.close();
            res.end();
          }
          else {
            if (checkinterval(1)) {
              dbo.collection("Doctors").findOne({ name: req.body.doctor }, function (err, doctor) {
                if (doctor == null) {
                  res.json({ data: "doctor not found" });
                  db.close();
                  res.end();
                }
                else {
                  reservedata = req.body.choice.split(":");
                  date = new myDate(Number(reservedata[4]), Number(reservedata[3]), Number(reservedata[2]));
                  start = { hour: Number(reservedata[0]), min: Number(reservedata[1]) };
                  temp = (start.hour * 60) + start.min + doctor.visitduration;
                  end = { hour: Math.floor(temp / 60), min: temp % 60 }
                  unavb = { start: start, end: end, date: date, dayofweek: new persianDate([Number(reservedata[2]), Number(reservedata[3]), Number(reservedata[4])]).format("dddd") };
                  zarinpal.PaymentRequest({
                    Amount: req.body.cost, // In Tomans
                    CallbackURL: 'http://reservation.drtajviz.com/paymenthandler',
                    Description: 'Dr tajviz payment',
                    Email: 'shayanthrn@gmail.com',
                    Mobile: user.phonenumber
                  }).then(response => {
                    if (response.status === 100) {
                      reservation = new Reservation(user._id, doctor._id, unavb, response.authority, req.body.cost);
                      addtransaction(user._id, req.body.cost, response.authority);
                      dbo.collection("TempReserves").insertOne(reservation, function (err, reserve) {
                        res.json({ url: response.url })
                      })
                    }
                  }).catch(err => {
                    res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
                    console.error(err);
                    db.close();
                    res.end();
                  });
                }
              })
            }
          }
        })
      })
    }
  }
})

router.post("/api/ticketpayment", function (req, res) {
  if (req.body.usertoken == undefined || req.body.key != "pouyarahmati") {
    res.json({ data: "user token not found" })
    res.end();
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.body.usertoken }, function (err, user) {
        if (user == null) {
          res.json({ data: "not found user" })
        }
        else {
          dbo.collection("Doctors").findOne({ name: req.body.doctor }, function (err, doctor) {
            zarinpal.PaymentRequest({
              Amount: req.body.cost, // In Tomans
              CallbackURL: 'http://reservation.drtajviz.com/ticketpaymenthandler',
              Description: 'Dr tajviz payment',
              Email: 'shayanthrn@gmail.com',
              Mobile: user.phonenumber
            }).then(response => {
              if (response.status === 100) {
                var newchat = new Chat(req.body.doctor, user.phonenumber, doctor.chatcost);
                newchat.authority = response.authority;
                addtransaction(user._id, req.body.cost, response.authority);
                var now = new Date();
                var newticket;
                if (req.files == null) {
                  newticket = new Ticket(req.body.subject, req.body.text, null, now, "patient");
                  newchat.tickets.push(newticket);
                  dbo.collection("TempChats").insertOne(newchat, function (err, as) {
                    res.json({ url: response.url })
                    db.close();
                  })
                }
                else {
                  var arr = req.files.file.name.split('.');
                  var fileformat = arr[arr.length - 1];
                  var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
                  newticket = new Ticket(req.body.subject, req.body.text, file, now, "patient");
                  mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
                    newchat.tickets.push(newticket);
                    dbo.collection("TempChats").insertOne(newchat, function (err, as) {
                      res.json({ url: response.url })
                      db.close();
                    })
                  })
                }
              }
              else {
                res.json({ data: "fail" })
                db.close()
              }
            }).catch(err => {
              console.log(req.body.cost)
              res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
              console.error(err);
              db.close();
              res.end();
            });
          })
        }
      })
    })
  }
})

router.post("/api/telepayment", function (req, res) {
  if (req.body.usertoken == undefined || req.body.key != "pouyarahmati") {
    res.json({ data: "user token not found" })
    res.end();
  }
  else {
    if (req.body.choice == undefined) {
      res.json({ data: "choice not found" })
    }
    else {
      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ token: req.body.usertoken }, function (err, user) {
          if (user == null) {
            res.json({ data: "user token not found" })
            db.close();
            res.end();
          }
          else {
            dbo.collection("Doctors").findOne({ name: req.body.doctor }, function (err, doctor) {
              var reservedata = req.body.choice.split(":");
              var date = new myDate(Number(reservedata[2]), Number(reservedata[1]), Number(reservedata[0]));
              var time = { start: reservedata[3], end: reservedata[4] };
              var timeinfo = { time: time, date: date }
              zarinpal.PaymentRequest({
                Amount: req.body.cost, // In Tomans
                CallbackURL: 'http://reservation.drtajviz.com/telepaymenthandler',
                Description: 'Dr tajviz payment',
                Email: 'shayanthrn@gmail.com',
                Mobile: user.phonenumber
              }).then(response => {
                if (response.status === 100) {
                  reservation = new teleReservation(user._id, doctor._id, timeinfo, response.authority, req.body.cost);
                  addtransaction(user._id, req.body.cost, response.authority);
                  dbo.collection("TempteleReserves").insertOne(reservation, function (err, reserve) {
                    res.json({ url: response.url })
                  })
                }
              }).catch(err => {
                res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
                console.error(err);
                db.close();
                res.end();
              });
            })
          }
        })
      })
    }
  }
})

//--------------------------api---------------------------//

router.post("/changedocinfo", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          dbo.collection("Doctors").findOne({name:req.body.name},function(err,doctor){
            if(doctor!=null && result.name!=req.body.name){
              db.close();
              res.redirect('duplicatename');
            }
            else{
              var cats = []
              if (typeof req.body.categories == "string") {
                cats.push(req.body.categories);
              }
              else {
                if (req.body.categories == undefined || req.body.categories == null) {
                  cats = [];
                }
                else {
                  cats = req.body.categories;
                }
              }
              temp=result.image.split("/").slice(0,2);
              temp.push(req.body.name+".png");
              newimg=temp.join("/");
              if(result.name!=req.body.name){
                fs.rename("public"+result.image,"public"+newimg,function(err){
                  console.log("changed photo path");
                })
                dbo.collection("Chats").updateMany({doctor:result.name},{$set:{doctor:req.body.name}});
              }
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $set: { name:req.body.name , image:newimg ,categories: cats, city: req.body.city, workphone: req.body.workphone, medicalnumber: req.body.medicalnumber, codemeli: req.body.codemeli, background: req.body.experience, address: req.body.address, phonenumber: req.body.phone, visitduration: Number(req.body.duration), description: req.body.description } }, function (err, res2) {
                if (req.files != null) {
                  mv(req.files.image.tempFilePath, "public" + result.image, function (err) {
                    console.log("public" + result.image)
                  })
                }
                db.close();
                res.redirect('/doctorpanel/profile');
              })
            }
          })
        }
      })
    })
  }
})

router.post("/changeHCinfo", function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          dbo.collection("HealthCenters").findOne({name:req.body.name},function(err,myhc){
            if(myhc!=null && HC.name!=req.body.name){
              db.close();
              res.redirect("/duplicated-name");
            }
          else{
              var cats = []
          if (typeof req.body.categories == "string") {
            cats.push(req.body.categories);
          }
          else {
            cats = req.body.categories;
          }
          temp=HC.image.split("/").slice(0,2);
          temp.push(req.body.name+".png");
          newimg=temp.join("/");
          if(HC.name!=req.body.name){
            fs.rename("public"+HC.image,"public"+newimg,function(err){
              console.log("changed photo path");
            })
          }
          if (HC.systype == "A") {
            HC.categories.forEach(function (item, index, object) {
              if (!req.body.categories.includes(item.name)) {
                object.splice(index, 1);
              }
            })
            hccatnames = [];
            HC.categories.forEach(function (item, index, object) {
              hccatnames.push(item.name);
            })
            cats.forEach(function (doc) {
              if (!hccatnames.includes(doc)) {
                HC.categories.push({ name: doc, unavailabletimes: [], reservations: [], visitduration: 30, visitcost: 3000 })
              }
            })
            dbo.collection('HealthCenters').updateOne({ token: req.cookies.HCtoken }, { $set: {name:req.body.name,image:newimg , codeofHC: req.body.codeofHC, categories: HC.categories, codemeli: req.body.codemeli, city: req.body.city, phonenumber: req.body.phonenumber, directphonenumber: req.body.directphonenumber, background: req.body.background, address: req.body.address, medicalnumber: req.body.medicalnumber } }, function (err, res2) {
              if (req.files != null) {
                mv(req.files.image.tempFilePath, "public" + HC.image, function (err) {
                  console.log("public" + HC.image)
                })
              }
              db.close();
              res.redirect('/HCpanel/profile');
            })
          }
          else {
            dbo.collection('HealthCenters').updateOne({ token: req.cookies.HCtoken }, { $set: { name:req.body.name, image:newimg , codeofHC: req.body.codeofHC, codemeli: req.body.codemeli, city: req.body.city, phonenumber: req.body.phonenumber, directphonenumber: req.body.directphonenumber, background: req.body.background, address: req.body.address, medicalnumber: req.body.medicalnumber } }, function (err, res2) {
              if (req.files != null) {
                mv(req.files.image.tempFilePath, "public" + HC.image, function (err) {
                  console.log("public" + HC.image)
                })
              }
              db.close();
              res.redirect('/HCpanel/profile');
            })
          }
            }
          })
        }
      })
    })
  }
})

router.get("/addunavbeveryday", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {
            res.write("invalid");
            db.close();
            res.end();
          }
          else {
            if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: fromtime, end: { hour: 23, min: 59 } } } });
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: totime } } });
              db.close();
              res.redirect('/doctorpanel/visittimes');
            }
            else {
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: fromtime, end: totime } } }, function (result2) {
                db.close();
                res.redirect('/doctorpanel/visittimes');
              })
            }
          }
        }
      })
    })
  }
})



router.get("/addunavbeverydayadmin", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Admins').findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {
            res.write("invalid");
            db.close();
            res.end();
          }
          else {
            if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
              if (query.type == "doctor") {
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: fromtime, end: { hour: 23, min: 59 } } } });
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: totime } } });
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if (query.type == "آزمایشگاه") {
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: fromtime, end: { hour: 23, min: 59 } } } });
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: totime } } });
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if (query.type == "کلینیک") {
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: "*", dayofweek: "*", start: fromtime, end: { hour: 23, min: 59 } } } })
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: totime } } })
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
            }
            else {
              if (query.type == "doctor") {
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if (query.type == "آزمایشگاه") {
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: "*", start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if (query.type == "کلینیک") {
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: "*", dayofweek: "*", start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
            }
          }
        }
      })
    })
  }
})

router.get("/addunavbeverydayHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.HCtoken == undefined) {

    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {
            res.write("invalid");
            db.close();
            res.end();
          }
          else {
            if (HC.systype == "A") {
              if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
                HC.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push({ date: "*", dayofweek: "*", start: fromtime, end: { hour: 23, min: 59 } });
                    doc.unavailabletimes.push({ date: "*", dayofweek: "*", start: { hour: 0, min: 0 }, end: totime });
                  }
                })
              }
              else {
                HC.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push({ date: "*", dayofweek: "*", start: fromtime, end: totime });

                  }
                })
              }
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { categories: HC.categories } }, function (err, result2) {
                console.log(result2);
                console.log(HC.categories);
                res.redirect('/HCpanel/visittimes');
              });
            }
            else {
              if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
                HC.unavailabletimes.push({ date: "*", dayofweek: "*", start: fromtime, end: { hour: 23, min: 59 } });
                HC.unavailabletimes.push({ date: "*", dayofweek: "*", start: { hour: 0, min: 0 }, end: totime });
              }
              else {
                HC.unavailabletimes.push({ date: "*", dayofweek: "*", start: fromtime, end: totime });
              }
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { unavailabletimes: HC.unavailabletimes } }, function (err, result2) {
                res.redirect('/HCpanel/visittimes');
              });
            }
          }
        }
      })
    })
  }
})




router.get("/addunavbdayofweek", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {
            db.close();
            res.write("invalid");
            res.end();
          }
          else {
            if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: fromtime, end: { hour: 23, min: 59 } } } });
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime } } });
              db.close();
              res.redirect('/doctorpanel/visittimes');
            }
            else {
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                db.close();
                res.redirect('/doctorpanel/visittimes');
              })
            }
          }
        }
      })
    })
  }
})


router.get("/addunavbdayofweekadmin", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Admins').findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {
            db.close();
            res.write("invalid");
            res.end();
          }
          else {
            if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
              if (query.type == "doctor") {
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: fromtime, end: { hour: 23, min: 59 } } } });
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime } } });
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if (query.type == "آزمایشگاه") {
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: fromtime, end: { hour: 23, min: 59 } } } });
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime } } });
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if (query.type == "کلینیک") {
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: "*", dayofweek: query.dayofweek, start: fromtime, end: { hour: 23, min: 59 } } } })
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: "*", dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime } } })
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
            }
            else {
              if (query.type == "doctor") {
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if (query.type == "آزمایشگاه") {
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: "*", dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if (query.type == "کلینیک") {
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: "*", dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
            }
          }
        }
      })
    })
  }
})


router.get("/addunavbdayofweekHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {
            db.close();
            res.write("invalid");
            res.end();
          }
          else {
            if (HC.systype == "A") {
              if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
                HC.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push({ date: "*", dayofweek: query.dayofweek, start: fromtime, end: { hour: 23, min: 59 } });
                    doc.unavailabletimes.push({ date: "*", dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime });
                  }
                })
              }
              else {
                HC.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push({ date: "*", dayofweek: query.dayofweek, start: fromtime, end: totime });

                  }
                })
              }
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { categories: HC.categories } }, function (err, result2) {
                res.redirect('/HCpanel/visittimes');
              });
            }
            else {
              if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
                HC.unavailabletimes.push({ date: "*", dayofweek: query.dayofweek, start: fromtime, end: { hour: 23, min: 59 } });
                HC.unavailabletimes.push({ date: "*", dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime });
              }
              else {
                HC.unavailabletimes.push({ date: "*", dayofweek: query.dayofweek, start: fromtime, end: totime });
              }
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { unavailabletimes: HC.unavailabletimes } }, function (err, result2) {
                res.redirect('/HCpanel/visittimes');
              });
            }
          }
        }
      })
    })
  }
})


router.get("/addunavb", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {

            res.write("invalid");
            db.close();
            res.end();
          }
          else {
            querydate = new persianDate(Number(query.datePicker));
            date = new myDate(querydate.toArray()[2], querydate.toArray()[1], querydate.toArray()[0]);
            if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: { hour: 23, min: 59 } } } })
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: date, dayofweek: querydate.format("dddd"), start: { hour: 0, min: 1 }, end: totime } } })
              db.close();
              res.redirect('/doctorpanel/visittimes');
            }
            else {
              dbo.collection('Doctors').updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: { date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: totime } } }, function (result2) {
                db.close();
                res.redirect('/doctorpanel/visittimes');
              })
            }
          }
        }
      })
    })
  }
})

router.get("/addunavbadmin", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Admins').findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {

            res.write("invalid");
            db.close();
            res.end();
          }
          else {
            querydate = new persianDate(Number(query.datePicker));
            date = new myDate(querydate.toArray()[2], querydate.toArray()[1], querydate.toArray()[0]);
            if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {

              if (query.type == "doctor") {
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: { hour: 23, min: 59 } } } });
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: date, dayofweek: querydate.format("dddd"), start: { hour: 0, min: 1 }, end: totime } } });
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if (query.type == "آزمایشگاه") {
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: { hour: 23, min: 59 } } } });
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: date, dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime } } });
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if (query.type == "کلینیک") {
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: { hour: 23, min: 59 } } } })
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: date, dayofweek: query.dayofweek, start: { hour: 0, min: 1 }, end: totime } } })
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
            }
            else {
              if (query.type == "doctor") {
                dbo.collection('Doctors').updateMany({}, { $addToSet: { unavailabletimes: { date: date, dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if (query.type == "آزمایشگاه") {
                dbo.collection('HealthCenters').updateMany({ type: "آزمایشگاه" }, { $addToSet: { unavailabletimes: { date: date, dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if (query.type == "کلینیک") {
                dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $addToSet: { 'categories.$[].unavailabletimes': { date: date, dayofweek: query.dayofweek, start: fromtime, end: totime } } }, function (result2) {
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
            }
          }
        }
      })
    })
  }
})


router.get("/addunavbHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          fromtime = { hour: Number(query.fromTime.split(":")[0]), min: Number(query.fromTime.split(":")[1]) };
          totime = { hour: Number(query.toTime.split(":")[0]), min: Number(query.toTime.split(":")[1]) };
          if (Number.isNaN(fromtime.hour) || Number.isNaN(fromtime.min) || Number.isNaN(totime.hour) || Number.isNaN(totime.min)) {

            res.write("invalid");
            db.close();
            res.end();
          }
          else {
            querydate = new persianDate(Number(query.datePicker));
            date = new myDate(querydate.toArray()[2], querydate.toArray()[1], querydate.toArray()[0]);
            if (HC.systype == "A") {
              if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
                HC.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push({ date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: { hour: 23, min: 59 } });
                    doc.unavailabletimes.push({ date: date, dayofweek: querydate.format("dddd"), start: { hour: 0, min: 1 }, end: totime });
                  }
                })
              }
              else {
                HC.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push({ date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: totime });

                  }
                })
              }
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { categories: HC.categories } }, function (err, result2) {
                res.redirect('/HCpanel/visittimes');
              });
            }
            else {
              if ((fromtime.hour * 60) + fromtime.min > (totime.hour * 60) + totime.min) {
                HC.unavailabletimes.push({ date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: { hour: 23, min: 59 } });
                HC.unavailabletimes.push({ date: date, dayofweek: querydate.format("dddd"), start: { hour: 0, min: 1 }, end: totime });
              }
              else {
                HC.unavailabletimes.push({ date: date, dayofweek: querydate.format("dddd"), start: fromtime, end: totime });
              }
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { unavailabletimes: HC.unavailabletimes } }, function (err, result2) {
                res.redirect('/HCpanel/visittimes');
              });
            }
          }
        }
      })
    })
  }
})



router.post("/changepass", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (result.password == md5(req.body.oldPassword)) {
            if (req.body.confirmPassword == req.body.newPassword) {
              dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $set: { password: md5(req.body.newPassword) } }, function (err, result3) {
                db.close();
                res.redirect("/doctorpanel/systemicinfo");
              })
            }
            else {
              res.write("not confirmed");
              db.close();
              res.end();
            }
          }
          else {
            res.write("wrong pass");
            db.close();
            res.end();
          }
        }
      })
    })
  }
})


router.post("/changepassHC", function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (HC.password == md5(req.body.oldPassword)) {
            if (req.body.confirmPassword == req.body.newPassword) {
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { password: md5(req.body.newPassword) } }, function (err, result3) {
                db.close();
                res.redirect("/HCpanel/systemicinfo");
              })
            }
            else {
              res.write("not confirmed");
              db.close();
              res.end();
            }
          }
          else {
            res.write("wrong pass");
            db.close();
            res.end();
          }
        }
      })
    })
  }
})


router.post("/addDoctor", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect("/noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, admin) {
        if (admin == null) {
          res.redirect("/noaccess");
        }
        else {
          dbo.collection("Doctors").findOne({ name: req.body.name }, function (err, res1) {
            if (res1 != null) {
              db.close();
              res.redirect('/Adminpanel/addDoctor-duplicatedname')
            }
            else {
              dbo.collection("Doctors").findOne({ username: req.body.username },async function (err, res2) {
                if (res2 != null) {
                  db.close();
                  res.redirect('/Adminpanel/addDoctor-duplicatedusername')
                }
                else {
                  var cats = [];
                  var memtype = [];
                  if (typeof req.body.categories == "string") {
                    cats.push(req.body.categories);
                  }
                  else {
                    req.body.categories.forEach(function (doc) {
                      cats.push(doc);
                    })
                  }
                  if (typeof req.body.membershiptypes == "string") {
                    memtype.push(req.body.membershiptypes)
                  }
                  else {
                    req.body.membershiptypes.forEach(function (doc2) {
                      memtype.push(doc2);
                    })
                  }
                  unhashed = req.body.pass;
                  req.body.pass = md5(req.body.pass)
                  mydoc=new Doctor(req.body.username, req.body.pass, req.body.name, cats, req.body.medicalnumber, req.body.codemeli, req.body.workphone, req.body.phonenumber, req.body.address, req.body.city, "/docphotos/" + req.body.name.trim() + ".png", req.body.background, req.body.description, memtype, req.body.appknowledge);
                  costs=await dbo.collection("costs").findOne({})
                  mydoc.visitcost=costs.docrescost;
                  mydoc.televisitcost=costs.doctelcost;
                  mydoc.chatcost=costs.docchatcost;
                  dbo.collection('Doctors').insertOne(mydoc, function (err, res2) {
                    sendSMS("docsignup", res2.insertedId, "Doctors", req.body.username, unhashed, null);
                    if (req.files != null) {
                      mv(req.files.image.tempFilePath, "public/docphotos/" + req.body.name + ".png", function (err) {
                        console.log("public/docphotos/" + req.body.name + ".png")
                      })
                    }
                    db.close();
                    res.redirect('/Adminpanel/addDoctor-success');
                  })
                }
              })
            }
          })
        }
      })
    })
  }
})

router.get("/Adminpanel/addDoctor-duplicatedname", function (req, res) {
  res.render("adddoc-result.ejs", { data: "این نام قبلا در سیستم ثبت شده است." })
  res.end();
})

router.get("/Adminpanel/addDoctor-duplicatedusername", function (req, res) {
  res.render("adddoc-result.ejs", { data: "این نام کاربری قبلا در سیستم ثبت شده است." })
  res.end();
})

router.get("/Adminpanel/addDoctor-success", function (req, res) {
  res.render("adddoc-result.ejs", { data: "عملیات با موفقیت انجام شد." })
  res.end();
})

router.post('/addHC', function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect("/noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, admin) {
        if (admin == null) {
          res.redirect("/noaccess");
        }
        else {
          MongoClient.connect(dburl, function (err, db) {
            var dbo = db.db("mydb");
            dbo.collection("HealthCenters").findOne({ name: req.body.name }, function (err, hc) {
              if (hc != null) {
                res.json({ data: "there is a healthcenter with this name" });
                res.end();
              }
              else {
                dbo.collection("HealthCenters").findOne({ username: req.body.username }, function (err, hc2) {
                  if (hc2 != null) {
                    res.json({ data: "there is a healthcenter with this username" });
                    res.end();
                  }
                  else {
                    dbo.collection("HCtypes").findOne({ name: query.type },async function (err, type) {
                      var img = "/" + query.type + "photos/" + req.body.name + ".png";
                      unhashed = req.body.password;
                      req.body.password = md5(req.body.password);
                      costs=await dbo.collection("costs").findOne({});
                      var newHC = new HealthCenter(query.type, type.systype, req.body.name, type.systype == "B" || type.systype == "A", req.body.codemeli, req.body.codeofHC, req.body.city, req.body.phonenumber, req.body.address, req.body.directphonenumber, req.body.background, req.body.medicalnumber, req.body.appknowledge, req.body.username, req.body.password, img,costs);
                      try {
                        mv(req.files.image.tempFilePath, "public" + img, { mkdirp: true }, function (err) {
                          console.log("image added");
                        });
                      } catch (error) {
                        console.log("no image");
                      }
                      dbo.collection("HealthCenters").insertOne(newHC,async function (err, result) {
                        sendSMS("HCsignup", result.insertedId, "HealthCenters", req.body.username, unhashed, null);
                        if (type.systype == "A") {
                          var cats = []
                          if (typeof req.body.categories == "string") {
                            cats.push(req.body.categories);
                          }
                          else {
                            if (req.body.categories == undefined || req.body.categories == null) {
                              cats = [];
                            }
                            else {
                              cats = req.body.categories;
                            }
                          }
                          costs=await dbo.collection("costs").findOne({});
                          cats.forEach(function (doc) {
                            var newcat = { name: doc, unavailabletimes: [], reservations: [], visitduration: 30, visitcost: costs.clinicrescost };
                            dbo.collection("HealthCenters").updateOne({ name: req.body.name }, { $addToSet: { categories: newcat } }, function (err, result) {
                              console.log("cats added");
                            })
                          })
                        }
                        res.redirect("/HCsignup")
                      })
                    })
                  }
                })
              }
            })
          })
        }
      })
    })
  }
})




//-----------------------functions--------------------------//

function n(n) {
  if (typeof n == "string") {
    n = parseInt(n)
  }
  return n > 9 ? "" + n : "0" + n;
}

function addtransaction(userid, amount, authority) {
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Users").findOne({ _id: userid }, function (err, user) {
      var transaction = new Transaction(authority, amount, "پاسخی از بانک دریافت نشده است.", user.firstname + " " + user.lastname);
      dbo.collection("Transactions").insertOne(transaction, function (err, asd) {
        console.log("added");
      })
    })
  })
}

function changestatustransaction(authority, status) {
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Transactions").updateOne({ authority: authority }, { $set: { status: status } }, function (err, asd) {
      console.log("changed");
    })
  })
}


function createinterval(start, end) {
  st = { hour: Math.floor(start / 60), min: start % 60 };
  en = { hour: Math.floor(end / 60), min: end % 60 };
  return { start: st, end: en };
}


function getDoctimeslots(doctor, date, flag) {
  duration = doctor.visitduration;
  console.log(doctor);
  unavb = doctor.unavailabletimes;
  dayofweek = new persianDate([date.year, date.month, date.day]).format('dddd');
  mintime = 0;
  timeslots = [];
  now = new persianDate().toArray();
  nowinmin = now[3] * 60 + now[4];
  if (flag == 1) {
    while (mintime + duration <= 1440) {
      if (mintime + duration > nowinmin) {
        interval = createinterval(mintime, mintime + duration);
        mintime += duration;
        timeslots.push(interval);
      }
      else {
        mintime += duration;
      }
    }

  }
  else {
    while (mintime + duration <= 1440) {
      interval = createinterval(mintime, mintime + duration);
      mintime += duration;
      timeslots.push(interval);
    }
  }

  for (let i = 0; i < unavb.length; i++) {
    temp = new myDate(unavb[i].date.day, unavb[i].date.month, unavb[i].date.year);
    if (lodash.isEqual(temp, date) || (unavb[i].date == "*" && dayofweek == unavb[i].dayofweek) || (unavb[i].dayofweek == "*")) {
      lodash.remove(timeslots, function (slot) {
        slotstart = slot.start.min + (slot.start.hour * 60);
        slotend = slot.end.min + (slot.end.hour * 60);
        unavbstart = unavb[i].start.min + (unavb[i].start.hour * 60);
        unavbend = unavb[i].end.min + (unavb[i].end.hour * 60);
        if (unavbstart < slotend && unavbstart > slotstart) {
          return true;
        }
        if (unavbstart < slotend && unavbstart >= slotstart) {
          return true;
        }
        if (unavbend <= slotend && unavbend > slotstart) {
          return true;
        }
        if (unavbstart < slotstart && unavbend > slotend) {
          return true;
        }
        if (unavbstart == slotstart && unavbend == slotend) {
          return true;
        }
        return false;
      });
    }
  }
  timeslots.forEach(function (doc) {
    if (doc.start.min < 10) {
      doc.start.min = "0" + doc.start.min
    }
    else {
      doc.start.min = doc.start.min.toString();
    }
    if (doc.start.hour < 10) {
      doc.start.hour = "0" + doc.start.hour
    }
    else {
      doc.start.hour = doc.start.hour.toString();
    }
    if (doc.end.min < 10) {
      doc.end.min = "0" + doc.end.min
    }
    else {
      doc.end.min = doc.end.min.toString();
    }
    if (doc.end.hour < 10) {
      doc.end.hour = "0" + doc.end.hour
    }
    else {
      doc.end.hour = doc.end.hour.toString();
    }
  })
  return timeslots;
}


function createDayboxobj(days) {
  result = [];
  for (let i = 0; i < days.length; i++) {
    result.push({
      dayofweek: days[i].format("dddd"),
      day: days[i].toArray()[2],
      month: days[i].format("MMMM"),
      monthnum: days[i].toArray()[1],
      year: days[i].toArray()[0],
      index: i,
      ndayofweek: (days[i].day() - 1) + ""
    })
  }
  return result;
}

function replaceALL(string, search, replace) {
  return string.split(search).join(replace);
}

function checkinterval(reservedata) {       //must be implemented
  return 1;
}


function sendSMS(template, id, type, token, token2, token3) {
  var id = ObjectID(id);
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection(type).findOne({ _id: id }, function (err, obj) {
      switch (template) {
        case "addexp":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "chatdoc":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "chatuser":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "docsignup":
          apikave.VerifyLookup({
            token: token,
            token2: token2,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "HCsignup":
          apikave.VerifyLookup({
            token: token,
            token2: token2,
            template: template,
            receptor: obj.directphonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "reserveACK":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            token3: token3,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "reserveACKdoc":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            token3: token3,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "resHC":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            template: template,
            receptor: obj.directphonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "resHCuser":
          apikave.VerifyLookup({
            token: token,
            token10: token2,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "teleresdoc":
          apikave.VerifyLookup({
            token: token,
            token2: token2,
            token10: token3,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        case "teleresuser":
          apikave.VerifyLookup({
            token: token,
            token2: token2,
            token10: token3,
            template: template,
            receptor: obj.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                console.log("success")
              }
            });
          break;
        default:
          break;
      }
    })
  })
}

router.get("/test", function (req, res) {
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Reservations").findOne({ refid: "345345" }, async function (err, reservation) {
      var doctor = await dbo.collection("Doctors").findOne({})
      res.render("paymentaccept.ejs", { doctor: doctor, time: "123", resid: reservation.refid });
      sendSMS("reserveACK", reservation.user.toString(), "Users", reservation.refid, doctor.name, new persianDate([reservation.time.date.year, reservation.time.date.month, reservation.time.date.day]).format("L"))

      res.end();
    })
  })
})

//-----------------------functions--------------------------//
//-----------------------HCpanel-----------------------------//

router.get('/HCpanel/dashboard', function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").findOne({ token: req.cookies.HCtoken },async function (err, HC) {
        if (HC == null) {
          res.redirect('/noaccess');
        }
        else {
          if (HC.isReserveable == false) {
            res.redirect("/HCpanel/profile");
            db.close();
          }
          else {
            var visittimes = [];
            var currentday = new persianDate();
            visittimes.push({ date1: { year: currentday.toArray()[0], month: currentday.format("MMMM"), day: currentday.toArray()[2] }, date: { year: currentday.toArray()[0], month: currentday.toArray()[1], day: currentday.toArray()[2] }, times: [], dayofweek: currentday.format("dddd") });
            for (let i = 0; i < 5; i++) {
              currentday = currentday.add('d', 1);
              visittimes.push({ date1: { year: currentday.toArray()[0], month: currentday.format("MMMM"), day: currentday.toArray()[2] }, date: { year: currentday.toArray()[0], month: currentday.toArray()[1], day: currentday.toArray()[2] }, times: [], dayofweek: currentday.format("dddd") });
            }
            if (HC.systype == "B") {
              HC.reservations=await dbo.collection("Reservations").find({HC:HC._id}).toArray();
              HC.reservations.forEach(function (doc) {
                for (i = 0; i < 6; i++) {
                  if (lodash.isEqual(visittimes[i].date, doc.time.date)) {
                    visittimes[i].times.push(doc);
                  }
                }
              })
            }
            else {
              for (let k = 0; k < HC.categories.length; k++) {
                HC.categories[k].reservations=await dbo.collection("Reservations").find({HC:HC._id,catname:HC.categories[k].name}).toArray();
                HC.categories[k].reservations.forEach(function (doc) {
                  for (i = 0; i < 6; i++) {
                    if (lodash.isEqual(visittimes[i].date, doc.time.date)) {
                      visittimes[i].times.push(doc);
                    }
                  }
                })
              }
            }
            res.render("HCPanel/reserveable/dashboard.ejs", { visittimes: visittimes });
            res.end();
            db.close();
          }
        }
      })
    })
  }
})

router.get('/HCpanel/profile', function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          res.redirect('/noaccess');
        }
        else {
          if (HC.isReserveable == false) {
            res.render("HCPanel/unreserveable/profile.ejs", { HC: HC });
            res.end();
            db.close();
          }
          else {
            if (HC.systype == "B") {
              res.render("HCPanel/reserveable/profileB.ejs", { HC: HC });
              res.end();
              db.close();
            }
            else {
              res.render("HCPanel/reserveable/profileA.ejs", { HC: HC });
              res.end();
              db.close();
            }
          }
        }
      })
    })
  }
})

router.get('/HCpanel/systemicinfo', function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          res.redirect('/noaccess');
        }
        else {
          if (HC.isReserveable == false) {
            res.render("HCPanel/unreserveable/systemicinfo.ejs");
            res.end();
            db.close();
          }
          else {
            res.render("HCPanel/reserveable/systemicinfo.ejs");
            res.end();
            db.close();
          }
        }
      })
    })
  }
})

//---------just reservables  

router.get("/HCpanel/patients", function (req, res) {
  var patientsid = [];
  var patients = [];
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken },async function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (HC.isReserveable != true) {
            res.redirect('noaccess');
          }
          else {
            HC.reservations=await dbo.collection("Reservations").find({HC:HC._id}).toArray();
              for (var i = 0; i < HC.reservations.length; i++) {
                patientsid.push(HC.reservations[i].user);
              }

            dbo.collection("Users").find({ _id: { $in: patientsid } }, function (err, result2) {
              result2.forEach(function (doc) {
                patients.push(doc);
              }, function () {
                res.render('HCPanel/reserveable/patients.ejs', { patients: patients });
                db.close();
                res.end();
              })
            })
          }
        }
      })
    })
  }
})


router.get("/HCPanel/users/:userid", function (req, res) {
  userid = ObjectID(req.params.userid);
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null || result.systype == "C") {
          db.close();
          res.redirect('noaccess');
        }
        else {
          dbo.collection("Users").findOne({ _id: userid }, async function (err, user) {
            if (user == null) {
              db.close();
              res.redirect('noaccess');
            }
            else {
              user.reserves = await dbo.collection("Reservations").find({ user: user._id, HC: result._id }).toArray();
              res.render('HCPanel/reserveable/patient-status.ejs', { user: user });
              db.close();
              res.end();
            }
          })
        }
      })
    })
  }
})

router.get("/HCpanel/reserves/:resid", function (req, res) {
  resid = ObjectID(req.params.resid);
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null || result.systype == "C") {
          db.close();
          res.redirect('noaccess');
        }
        else {
          dbo.collection("Reservations").findOne({ _id: resid, HC: result._id }, async function (err, reserve) {
            if (reserve == null) {
              res.redirect("/noaccess");
            }
            else {
              reserve.user = await dbo.collection("Users").findOne({ _id: reserve.user });
              res.render('HCPanel/reserveable/reserve-status.ejs', { reserve: reserve });
              db.close();
              res.end();
            }
          })
        }
      })
    })
  }
})

router.get("/HCpanel/removevisittimes", function (req, res) {

  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          //-------

          //----------
          if (result.systype == "A") {
            res.render('HCPanel/reserveable/removevisittimes-typeA.ejs', { categories: result.categories });
          }
          else {
            var days = [];
            var freetimes = [];
            currentday = new persianDate();
            days.push(currentday);
            freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
            for (let i = 0; i < 14; i++) {
              currentday = currentday.add("d", 1);
              days.push(currentday);
              freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
            }
            res.render('HCPanel/reserveable/removevisittimes-typeB.ejs', { days: createDayboxobj(days), freetimes: freetimes });
          }
          db.close();
          res.end();
        }
      })
    })
  }
})

router.post("/HCpanel/removevisittimes/step2", function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (result.systype == "A") {
            var catobj = null;
            result.categories.forEach(function (doc) {
              if (doc.name == req.body.category) {
                catobj = doc;
              }
            })
            if (catobj == null) {
              res.redirect("/noaccess");
            }
            else {
              var days = [];
              var freetimes = [];
              currentday = new persianDate();
              days.push(currentday);
              freetimes.push(getDoctimeslots(catobj, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
              for (let i = 0; i < 14; i++) {
                currentday = currentday.add("d", 1);
                days.push(currentday);
                freetimes.push(getDoctimeslots(catobj, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
              }
              res.render('HCPanel/reserveable/removevisittimes-typeA-2.ejs', { days: createDayboxobj(days), freetimes: freetimes, category: req.body.category });
            }
          }
          else {
            res.redirect("/noaccess")
          }
          db.close();
          res.end();
        }
      })
    })
  }
})


router.get("/HCpanel/visittimes", function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (result.systype == "A") {
            res.render('HCPanel/reserveable/addunavb-typeA.ejs', { categories: result.categories });
          }
          else {
            res.render('HCPanel/reserveable/addunavb-typeB.ejs');
          }
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/HCpanel/addexp", function (req, res) {
  var patientsid = [];
  var phonenumbers = [];
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken },async function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (HC.systype == "C") {
            db.close();
            res.redirect('noaccess');
          }
          else {
              HC.reservations=await dbo.collection("Reservations").find({HC:HC._id}).toArray();
              for (var i = 0; i < HC.reservations.length; i++) {
                patientsid.push(HC.reservations[i].user);
              }
           
            dbo.collection("Users").find({ _id: { $in: patientsid } }, function (err, result2) {
              result2.forEach(function (doc) {
                phonenumbers.push(doc.phonenumber);
              }, function () {
                res.render('HCPanel/reserveable/addexp.ejs', { phonenumbers: phonenumbers });
                db.close();
                res.end();
              })
            })

          }
        }
      })
    })
  }
})


router.post("/addexp", function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, HC) {
        if (HC == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (req.files != null) {
            dbo.collection("Users").findOne({ phonenumber: req.body.phonenumber }, function (err, user) {
              if (user == null) {
                res.json({ data: "user not found" });
                res.end();
              }
              else {
                var now = new Date();
                path = "data/Experiments/" + now.getTime() + ".zip";
                dbo.collection("Experiments").insertOne({ userid: user._id, hcid: HC._id, dateuploaded: now, description: req.body.description, path: path }, function (err, result) {
                  mv(req.files.file.tempFilePath, path, { mkdirp: true }, function (err) {
                    sendSMS("addexp", user._id, "Users", new persianDate().format("L"), HC.name, null)
                    res.redirect("/HCpanel/addexp");
                    db.close();
                  })
                })
              }
            })
          }
          else {
            res.json({ data: "no file uploaded" });
            res.end();
          }
        }
      })
    })
  }
})

router.get("/HCpanel/reserves", function (req, res) {

})


//-----------------------HCpanel------------------------------//

//-----------------------Doctorpanel---------------------------//

router.get("/doctorpanel", function (req, res) {
  res.redirect("/DoctorPanel/dashboard")
})

router.get('/doctorpanel/dashboard', function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, async function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var visittimes = [];
          var currentday = new persianDate();
          visittimes.push({ date1: { year: currentday.toArray()[0], month: currentday.format("MMMM"), day: currentday.toArray()[2] }, date: { year: currentday.toArray()[0], month: currentday.toArray()[1], day: currentday.toArray()[2] }, times: [], dayofweek: currentday.format("dddd") });
          for (let i = 0; i < 5; i++) {
            currentday = currentday.add('d', 1);
            visittimes.push({ date1: { year: currentday.toArray()[0], month: currentday.format("MMMM"), day: currentday.toArray()[2] }, date: { year: currentday.toArray()[0], month: currentday.toArray()[1], day: currentday.toArray()[2] }, times: [], dayofweek: currentday.format("dddd") });
          }
          result.reservations.forEach(function (doc) {
            for (i = 0; i < 6; i++) {
              if (lodash.isEqual(visittimes[i].date, doc.time.date)) {
                visittimes[i].times.push(doc);
              }
            }
          })
          var patientsid = []
          result.reservations.forEach(function (doc) {
            patientsid.push(doc.user.toString())
          })
          var patients = new Set(patientsid)
          patients = Array.from(patients)
          res.render('DoctorPanel/dashboard.ejs', { visittimes: visittimes, patientscount: patients.length, rescount: result.reservations.length, doctor: result });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/doctorpanel/removevisittimes", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var days = [];
          var freetimes = [];
          currentday = new persianDate();
          days.push(currentday);
          freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
          for (let i = 0; i < 14; i++) {
            currentday = currentday.add("d", 1);
            days.push(currentday);
            freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
          }
          res.render("DoctorPanel/removevisittimes.ejs", { doctor: result, days: createDayboxobj(days), freetimes: freetimes });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.post("/removevisittimes", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (req.body.choice == undefined) {
            res.redirect("/doctorpanel/removevisittimes");
          }
          else {
            choices = []
            if (typeof req.body.choice == "string") {
              choices.push(req.body.choice);
            }
            else {
              choices = req.body.choice;
            }
            choices.forEach(function (doc) {
              reservedata = doc.split(":");
              date = new myDate(Number(reservedata[4]), Number(reservedata[3]), Number(reservedata[2]));
              start = { hour: Number(reservedata[0]), min: Number(reservedata[1]) };
              temp = (start.hour * 60) + start.min + result.visitduration;
              end = { hour: Math.floor(temp / 60), min: temp % 60 }
              unavb = { start: start, end: end, date: date, dayofweek: new persianDate([Number(reservedata[2]), Number(reservedata[3]), Number(reservedata[4])]).format("dddd") };
              dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: unavb } });
            })
            setTimeout(function () {
              res.redirect("/doctorpanel/removevisittimes")
            }, 100)
          }
        }
      })
    })
  }
})

router.post("/removevisittimesHC", function (req, res) {
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (req.body.choice == undefined) {
            res.redirect("/HCpanel/removevisittimes");
          }
          else {
            choices = []
            if (typeof req.body.choice == "string") {
              choices.push(req.body.choice);
            }
            else {
              choices = req.body.choice;
            }
            var flag = 0;
            choices.forEach(function (doc) {
              reservedata = doc.split(":");
              date = new myDate(Number(reservedata[4]), Number(reservedata[3]), Number(reservedata[2]));
              start = { hour: Number(reservedata[0]), min: Number(reservedata[1]) };
              temp = (start.hour * 60) + start.min + result.visitduration;
              end = { hour: Math.floor(temp / 60), min: temp % 60 }
              unavb = { start: start, end: end, date: date, dayofweek: new persianDate([Number(reservedata[2]), Number(reservedata[3]), Number(reservedata[4])]).format("dddd") };
              if (result.systype == "B") {
                dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $addToSet: { unavailabletimes: unavb } });
              }
              else if (result.systype == "A") {
                var catobj = null;
                console.log(result.categories);
                console.log("========")
                result.categories.forEach(function (doc) {
                  if (doc.name == req.body.category) {
                    doc.unavailabletimes.push(unavb);
                  }
                })
                console.log(result.categories)
                dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { categories: result.categories } })
              }
              else {
                flag = 2;
                res.redirect("/noaccess");
                res.end();
                db.close();
              }
            })
            setTimeout(function () {
              if (flag != 2) {
                res.redirect("/HCpanel/removevisittimes")
              }
            }, 100)
          }
        }
      })
    })
  }
})


router.get('/doctorpanel/profile', function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          categories().then(basiccategories => {
            res.render('DoctorPanel/profile.ejs', { doctor: result, categories: basiccategories });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get('/doctorpanel/patients', function (req, res) {
  var patientsid = [];
  var patients = [];
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          for (var i = 0; i < result.reservations.length; i++) {
            patientsid.push(result.reservations[i].user);
          }
          dbo.collection("Users").find({ _id: { $in: patientsid } }, function (err, result2) {
            result2.forEach(function (doc) {
              patients.push(doc);
            }, function () {
              res.render('DoctorPanel/patients.ejs', { patients: patients, doctor: result });
              db.close();
              res.end();
            })
          })
        }
      })
    })
  }
})


router.get("/doctorpanel/patients/:userid", function (req, res) {
  userid = ObjectID(req.params.userid);
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, doctor) {
        if (doctor == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Users").findOne({ _id: userid }, async function (err, user) {
            if (user == null) {
              db.close();
              res.redirect('/noaccess');
            }
            else {
              user.reserves = await dbo.collection("Reservations").find({ user: userid, doctor: doctor._id }).toArray();
              user.telereserves = await dbo.collection("teleReservations").find({ user: userid, doctor: doctor._id }).toArray();
              user.chats = await dbo.collection("Chats").find({ userphone: user.phonenumber, doctor: doctor.name }).toArray();
              res.render('DoctorPanel/patient-status.ejs', { user: user, doctor: doctor });
              db.close();
              res.end();
            }
          })
        }
      })
    })
  }
})

router.get("/DoctorPanel/reserves/:resid", function (req, res) {
  resid = ObjectID(req.params.resid);
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          dbo.collection("Reservations").findOne({ _id: resid, doctor: result._id }, async function (err, reserve) {
            if (reserve == null) {
              res.redirect("/noaccess");
            }
            else {
              reserve.user = await dbo.collection("Users").findOne({ _id: reserve.user });
              res.render('DoctorPanel/reserve-status.ejs', { reserve: reserve, doctor: result });
              db.close();
              res.end();
            }
          })
        }
      })
    })
  }
})


router.get("/DoctorPanel/telereserves/:resid", function (req, res) {
  resid = ObjectID(req.params.resid);
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          dbo.collection("teleReservations").findOne({ _id: resid, doctor: result._id }, async function (err, reserve) {
            if (reserve == null) {
              res.redirect("/noaccess");
            }
            else {
              reserve.user = await dbo.collection("Users").findOne({ _id: reserve.user });
              res.render('DoctorPanel/telereserve-status.ejs', { reserve: reserve, doctor: result });
              db.close();
              res.end();
            }
          })
        }
      })
    })
  }
})

router.get('/doctorpanel/visittimes', function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          res.render('DoctorPanel/addunavb.ejs', { doctor: result });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get('/doctorpanel/systemicinfo', function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          res.render('DoctorPanel/settings.ejs', { doctor: result });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/doctorpanel/tickets", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, async function (err, result) {
        if (result == null || !result.membershiptypes.includes("chatconsultant")) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          chats = await dbo.collection("Chats").find({ doctor: result.name }).toArray()
          var foreach = new Promise((resolve, reject) => {
            if (chats.length == 0) {
              resolve();
            }
            else {
              counter=0;
              chats.forEach(async function (doc, index, array) {
                user = await dbo.collection("Users").findOne({ phonenumber: doc.userphone },{ projection: { firstname: 1,lastname:1 } })
                doc.user = user;
                doc.datecreated = new persianDate(doc.tickets[doc.tickets.length - 1].datecreated).format("l")
                counter++;
                if (counter === chats.length ) {
                  console.log(counter);
                  resolve();
                }
              });
            }
          });
          foreach.then(a => {
            res.render('DoctorPanel/tickets.ejs', { doctor: result, chats: chats });
            db.close();
           res.end();
          })
        }
      })
    })
  }
})


router.get("/doctorpanel/tickets/:tid", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, async function (err, result) {
        if (result == null || !result.membershiptypes.includes("chatconsultant")) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var tid = ObjectID(req.params.tid);
          dbo.collection("Chats").findOne({ _id: tid, doctor: result.name }, function (err, chat) {
            chat.tickets.forEach(function (doc) {
              doc.datecreated = new persianDate(doc.datecreated).format()
            })
            res.render("DoctorPanel/chatpage.ejs", { doctor: result, chat: chat });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})

router.post("/sendticket", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, async function (err, result) {
        if (result == null || !result.membershiptypes.includes("chatconsultant")) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var chatid = new ObjectID(req.body.chatid)
          dbo.collection("Chats").findOne({ doctor: req.body.dname, userphone: req.body.uphone, _id: chatid }, async function (err, chat) {
            if (chat != null) {
              var now = new Date();
              var newticket;
              if (req.files == null) {
                newticket = new Ticket(req.body.subject, req.body.text, null, now, req.body.sender);
                chat.tickets.push(newticket);
                dbo.collection("Chats").updateOne({ doctor: req.body.dname, userphone: req.body.uphone, _id: chatid }, { $set: { tickets: chat.tickets } }, function (err, asd) {
                  res.redirect(req.body.from);
                  db.close();
                })
              }
              else {
                var arr = req.files.file.name.split('.');
                var fileformat = arr[arr.length - 1];
                var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
                newticket = new Ticket(req.body.subject, req.body.text, file, now, req.body.sender);
                mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
                  chat.tickets.push(newticket);
                  dbo.collection("Chats").updateOne({ doctor: req.body.dname, userphone: req.body.uphone, _id: chatid }, { $set: { tickets: chat.tickets } }, function (err, asd) {
                    res.redirect(req.body.from);
                    db.close();
                  })
                })
              }
            }
            else {
              var newchat = new Chat(req.body.dname, req.body.uphone);
              var now = new Date();
              var newticket;
              if (req.files == null) {
                newticket = new Ticket(req.body.subject, req.body.text, null, now, req.body.sender);
                newchat.tickets.push(newticket);
                dbo.collection("Chats").insertOne(newchat, function (err, as) {
                  res.redirect(req.body.from);
                  db.close();
                })
              }
              else {
                var arr = req.files.file.name.split('.');
                var fileformat = arr[arr.length - 1];
                var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
                newticket = new Ticket(req.body.subject, req.body.text, file, now, req.body.sender);
                mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
                  newchat.tickets.push(newticket);
                  dbo.collection("Chats").insertOne(newchat, function (err, as) {
                    res.redirect(req.body.from);
                    db.close();;
                  })
                })
              }
            }
            user = await dbo.collection("Users").findOne({ phonenumber: req.body.uphone })
            sendSMS("chatuser", user._id, "Users", new persianDate().format("L"), result.name, null);
          })
        }
      })
    })
  }
})

router.post("/sendticketuser", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Users').findOne({ token: req.cookies.usertoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var chatid = new ObjectID(req.body.chatid)
          dbo.collection("Chats").findOne({ doctor: req.body.dname, userphone: req.body.uphone, _id: chatid }, async function (err, chat) {
            if (chat != null) {
              var now = new Date();
              var newticket;
              if (req.files == null) {
                newticket = new Ticket(req.body.subject, req.body.text, null, now, req.body.sender);
                chat.tickets.push(newticket);
                dbo.collection("Chats").updateOne({ doctor: req.body.dname, userphone: req.body.uphone, _id: chatid }, { $set: { tickets: chat.tickets } }, function (err, asd) {
                  res.redirect(req.body.from);
                  db.close();
                })
              }
              else {
                var arr = req.files.file.name.split('.');
                var fileformat = arr[arr.length - 1];
                var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
                newticket = new Ticket(req.body.subject, req.body.text, file, now, req.body.sender);
                mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
                  chat.tickets.push(newticket);
                  dbo.collection("Chats").updateOne({ doctor: req.body.dname, userphone: req.body.uphone, _id: chatid }, { $set: { tickets: chat.tickets } }, async function (err, asd) {
                    res.redirect(req.body.from);
                    db.close();
                  })
                })
              }
            }
            else {
              var newchat = new Chat(req.body.dname, req.body.uphone);
              var now = new Date();
              var newticket;
              if (req.files == null) {
                newticket = new Ticket(req.body.subject, req.body.text, null, now, req.body.sender);
                newchat.tickets.push(newticket);
                dbo.collection("Chats").insertOne(newchat, function (err, as) {
                  res.redirect(req.body.from);
                  db.close();
                })
              }
              else {
                var arr = req.files.file.name.split('.');
                var fileformat = arr[arr.length - 1];
                var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
                newticket = new Ticket(req.body.subject, req.body.text, file, now, req.body.sender);
                mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
                  newchat.tickets.push(newticket);
                  dbo.collection("Chats").insertOne(newchat, function (err, as) {
                    res.redirect(req.body.from);
                    db.close();;
                  })
                })
              }
            }
            doctor = await dbo.collection("Doctors").findOne({ name: req.body.dname });
            sendSMS("chatdoc", doctor._id, "Doctors", new persianDate().format("L"), result.firstname + " " + result.lastname, null);
          })
        }
      })
    })
  }
})

router.get("/search", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (query.filter != "category" && query.filter != "Doctors" && query.filter != "HealthCenters") {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      qcity = { $regex: '.*' }
      if (query.city != undefined && query.city != "all") {
        qcity = query.city;
      }
      myregex = '.*' + query.query + '.*'
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
        if (query.filter == "category") {
          dbo.collection("Doctors").find({ categories: { $regex: myregex }, city: qcity }, async function (err, results) {
            results = await results.toArray();
            dbo.collection("HealthCenters").find({ systype: "A", "categories.name": { $regex: myregex }, city: qcity }, async function (err, results2) {
              results2 = await results2.toArray();
              finalresult = results.concat(results2);
              categories().then(basiccategories => {
                if (user == null) {
                  res.render('search.ejs', { Objects: finalresult, type: "category", category: "", user: "", categories: basiccategories });
                }
                else {
                  res.render('search.ejs', { Objects: finalresult, type: "category", category: "", user: user, categories: basiccategories });
                }
                res.end();
                db.close();
              })
            })
          })
        }
        else {
          dbo.collection(query.filter).find({ name: { $regex: myregex }, categories: { $ne: [] }, city: qcity }, async function (err, results) {
            results = await results.toArray();
            categories().then(basiccategories => {
              if (user == null) {
                res.render('search.ejs', { Objects: results, type: "sd", category: "", user: "", categories: basiccategories });
              }
              else {
                res.render('search.ejs', { Objects: results, type: "category", category: "", user: user, categories: basiccategories });
              }
              res.end();
              db.close();
            })
          })
        }
      })
    })
  }
})


router.get("/Download", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.doctortoken == undefined && req.cookies.admintoken == undefined && query.key != "pouyarahmati") {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      if (req.cookies.doctortoken != undefined) {
        dbo.collection("Doctors").findOne({ token: req.cookies.doctortoken }, function (err, doctor) {
          if (doctor == null && query.key != "pouyarahmati") {
            res.redirect("noaccess");
            db.close();
          }
          else {
            res.download(query.path);
            db.close();
          }
        })
      }
      else {
        dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, admin) {
          if (admin == null && query.key != "pouyarahmati") {
            res.redirect("noaccess");
            db.close();
          }
          else {
            res.download(query.path);
            db.close();
          }
        })
      }
    })
  }
})


router.get("/finishchat/:chatid", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          oid = new ObjectID(req.params.chatid)
          dbo.collection("Chats").updateOne({ doctor: result.name, _id: oid }, { $set: { finished: true } }, function (err, as) {
            res.redirect("/DoctorPanel/tickets");
            db.close();
          })
        }
      })
    })
  }
})

router.get("/resetunavb", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          result.reservations = await dbo.collection("Reservations").find({ doctor: result._id }).toArray();
          newunavb = []
          result.reservations.forEach(function (doc) {
            newunavb.push(doc.time);
          })
          dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $set: { unavailabletimes: newunavb } }, function (err, asf) {
            db.close();
            res.redirect("/doctorpanel/removevisittimes");
          })
        }
      })
    })
  }
})

router.get("/resetunavbHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.HCtoken == undefined) {
    res.redirect("/noaccess")
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").findOne({ token: req.cookies.HCtoken }, async function (err, HC) {
        if (HC == null) {
          res.redirect("/noaccess");
          db.close();
        }
        else {
          if (HC.systype == "B") {
            //=============
            HC.reservations = await dbo.collection("Reservations").find({ HC: HC._id }).toArray();
            newunavb = []
            HC.reservations.forEach(function (doc) {
              newunavb.push(doc.time);
            })
            dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { unavailabletimes: newunavb } }, function (err, asf) {
              db.close();
              res.redirect("/HCpanel/removevisittimes");
            })
            //=============
          }
          else if (HC.systype == "A") {
            var catobj = null;
            HC.categories.forEach(function (doc) {
              if (doc.name == query.category) {
                catobj = doc;
              }
            })
            if (catobj == null) {
              res.redirect("/noaccess");
            }
            else {
              //============
              myreservations = await dbo.collection("Reservations").find({ HC: HC._id, catname: catobj.name }).toArray();
              newunavb = []
              myreservations.forEach(function (doc) {
                newunavb.push(doc.time);
              })
              HC.categories.forEach(function (doc) {
                if (doc.name == query.category) {
                  doc.unavailabletimes = newunavb;
                }
              })
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { categories: HC.categories } }, function (err, asf) {
                db.close();
                res.redirect("/HCpanel/removevisittimes");
              })
              //=============
            }
          }
          else {
            res.redirect("/noaccess");
            db.close();
          }
        }
      })
    })
  }
})

router.get("/nightmode", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var flag = 0;
          var flag1 = 0;
          newunavb = { date: "*", dayofweek: "*", start: { hour: 20, min: 0 }, end: { hour: 23, min: 59 } }
          newunavb2 = { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: { hour: 8, min: 0 } }
          try {
            result.unavailabletimes.forEach(function (doc) {
              if (lodash.isEqual(doc, newunavb)) {
                flag = 1;
              }
              if (lodash.isEqual(doc, newunavb2)) {
                flag1 = 1;
              }
              if (flag1 == 1 && flag == 1) {
                throw BreakException;
              }
            })
          } catch (error) {
            console.log("found it")
          }
          if (flag == 1 && flag1 == 1) {
            db.close()
            res.redirect("/doctorpanel/removevisittimes");
          }
          else {
            dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: newunavb } }, function (err, asf) {
              dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $addToSet: { unavailabletimes: newunavb2 } }, function (err, asdfa) {
                db.close();
                res.redirect("/doctorpanel/removevisittimes");
              })
            })
          }
        }
      })
    })
  }
})

router.get("/nightmodeHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.HCtoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('HealthCenters').findOne({ token: req.cookies.HCtoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          if (result.systype == "B") {
            var flag = 0;
            var flag1 = 0;
            newunavb = { date: "*", dayofweek: "*", start: { hour: 20, min: 0 }, end: { hour: 23, min: 59 } }
            newunavb2 = { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: { hour: 8, min: 0 } }
            try {
              result.unavailabletimes.forEach(function (doc) {
                if (lodash.isEqual(doc, newunavb)) {
                  flag = 1;
                }
                if (lodash.isEqual(doc, newunavb2)) {
                  flag1 = 1;
                }
                if (flag1 == 1 && flag == 1) {
                  throw BreakException;
                }
              })
            } catch (error) {
              console.log("found it")
            }
            if (flag == 1 && flag1 == 1) {
              db.close()
              res.redirect("/HCpanel/removevisittimes");
            }
            else {
              dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $addToSet: { unavailabletimes: newunavb } }, function (err, asf) {
                dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $addToSet: { unavailabletimes: newunavb2 } }, function (err, asdfa) {
                  db.close();
                  res.redirect("/HCpanel/removevisittimes");
                })
              })
            }
          }
          else if (result.systype == "A") {
            if (query.category == undefined) {
              res.redirect("/noaccess");
            }
            else {
              var catobj = null;
              result.categories.forEach(function (doc) {
                if (doc.name == query.category) {
                  catobj = doc;
                }
              })
              if (catobj == null) {
                res.redirect("/noaccess");
              }
              var flag = 0;
              var flag1 = 0;
              newunavb = { date: "*", dayofweek: "*", start: { hour: 20, min: 0 }, end: { hour: 23, min: 59 } }
              newunavb2 = { date: "*", dayofweek: "*", start: { hour: 0, min: 1 }, end: { hour: 8, min: 0 } }
              try {
                myunavailabletimes = catobj.unavailabletimes;
                myunavailabletimes.forEach(function (doc) {
                  if (lodash.isEqual(doc, newunavb)) {
                    flag = 1;
                  }
                  if (lodash.isEqual(doc, newunavb2)) {
                    flag1 = 1;
                  }
                  if (flag1 == 1 && flag == 1) {
                    throw BreakException;
                  }
                })
              } catch (error) {
                console.log("found it")
              }
              if (flag == 1 && flag1 == 1) {
                db.close()
                res.redirect("/HCpanel/removevisittimes");
              }
              else {
                result.categories.forEach(function (doc) {
                  if (doc.name == query.category) {
                    doc.unavailabletimes.push(newunavb);
                    doc.unavailabletimes.push(newunavb2);
                  }
                })
                dbo.collection("HealthCenters").updateOne({ token: req.cookies.HCtoken }, { $set: { categories: result.categories } }, function (err, asf) {
                  res.redirect("/HCpanel/removevisittimes");
                  db.close();
                })
              }
            }
          }
          else {
            res.redirect("/noaccess");
            db.close();
          }
        }
      })
    })
  }
})

router.get("/doctorpanel/telereserve", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null || !result.membershiptypes.includes("teleconsultant")) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var visittimes = [];
          var currentday = new persianDate();
          visittimes.push({ date1: { year: currentday.toArray()[0], month: currentday.format("MMMM"), day: currentday.toArray()[2] }, date: { year: currentday.toArray()[0], month: currentday.toArray()[1], day: currentday.toArray()[2] }, times: [], dayofweek: currentday.format("dddd") });
          for (let i = 0; i < 5; i++) {
            currentday = currentday.add('d', 1);
            visittimes.push({ date1: { year: currentday.toArray()[0], month: currentday.format("MMMM"), day: currentday.toArray()[2] }, date: { year: currentday.toArray()[0], month: currentday.toArray()[1], day: currentday.toArray()[2] }, times: [], dayofweek: currentday.format("dddd") });
          }
          result.telereservations.forEach(function (doc) {
            for (i = 0; i < 6; i++) {
              if (lodash.isEqual(visittimes[i].date, doc.timeinfo.date)) {
                visittimes[i].times.push(doc);
              }
            }
          })
          console.log(visittimes[0].times)
          res.render("DoctorPanel/telereserve.ejs", { visittimes: visittimes, doctor: result });
          db.close()
          res.end()
        }
      })
    })
  }
})

router.get("/doctorpanel/telereserve/settime", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null || !result.membershiptypes.includes("teleconsultant")) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          res.render("DoctorPanel/TRsettime.ejs", { doctor: result, teletimes: result.teletimes });
          db.close()
          res.end()
        }
      })
    })
  }
})

router.post("/trsettime", function (req, res) {
  if (req.cookies.doctortoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null || !result.membershiptypes.includes("teleconsultant")) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          if (req.body.choice == undefined) {
            dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $set: { teletimes: [] } }, function (err, asdf) {
              res.redirect("/doctorpanel/telereserve/settime");
              db.close();
            })
          }
          else {
            var times = []
            if (typeof req.body.choice == "string") {
              times.push(req.body.choice);
            }
            else {
              times = req.body.choice;
            }
            dbo.collection("Doctors").updateOne({ token: req.cookies.doctortoken }, { $set: { teletimes: times } }, function (err, asdf) {
              res.redirect("/doctorpanel/telereserve/settime");
              db.close();
            })
          }
        }
      })
    })
  }
})


//------------------------Doctorpanel---------------------------//


//------------------------adminpanel---------------------------//

router.get("/AdminPanel/dashboard", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var doctors = await dbo.collection("Doctors").find().toArray();
          var HCs = await dbo.collection("HealthCenters").find({ systype: { $ne: "C" } }).toArray();
          res.render("AdminPanel/dashboard.ejs", { doctors: doctors, HCs: HCs, reserves: [] });
          db.close();
          res.end()
        }
      })
    })
  }
})

router.post("/AdminPanel/dashboard", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          if (req.body.name == undefined || req.body.type == undefined) {
            res.redirect("/AdminPanel/dashboard");
            db.close();
          }
          else {
            if (req.body.datePicker == "") {
              if (req.body.type == "HC") {
                dbo.collection("HealthCenters").findOne({ name: req.body.name }, async function (err, HC) {
                  reserves = await dbo.collection("Reservations").find({ HC: HC._id }).toArray();
                  var doctors = await dbo.collection("Doctors").find().toArray();
                  var HCs = await dbo.collection("HealthCenters").find({ systype: { $ne: "C" } }).toArray();
                  res.render("AdminPanel/dashboard.ejs", { doctors: doctors, HCs: HCs, reserves: reserves });
                  db.close();
                  res.end()
                })
              }
              else {
                dbo.collection("Doctors").findOne({ name: req.body.name }, async function (err, doctor) {
                  reserves = await dbo.collection("Reservations").find({ doctor: doctor._id }).toArray();
                  var doctors = await dbo.collection("Doctors").find().toArray();
                  var HCs = await dbo.collection("HealthCenters").find({ systype: { $ne: "C" } }).toArray();
                  res.render("AdminPanel/dashboard.ejs", { doctors: doctors, HCs: HCs, reserves: reserves });
                  db.close();
                  res.end()
                })
              }
            }
            else {
              mydate = new persianDate(Number(req.body.datePicker));
              mydate = mydate.toArray();
              mydate = { year: mydate[0], month: mydate[1], day: mydate[2] };
              if (req.body.type == "HC") {
                dbo.collection("HealthCenters").findOne({ name: req.body.name }, async function (err, HC) {
                  reserves = await dbo.collection("Reservations").find({ HC: HC._id, 'time.date': mydate }).toArray();
                  var doctors = await dbo.collection("Doctors").find().toArray();
                  var HCs = await dbo.collection("HealthCenters").find({ systype: { $ne: "C" } }).toArray();
                  res.render("AdminPanel/dashboard.ejs", { doctors: doctors, HCs: HCs, reserves: reserves });
                  db.close();
                  res.end()
                })
              }
              else {
                dbo.collection("Doctors").findOne({ name: req.body.name }, async function (err, doctor) {
                  reserves = await dbo.collection("Reservations").find({ doctor: doctor._id, 'time.date': mydate }).toArray();
                  var doctors = await dbo.collection("Doctors").find().toArray();
                  var HCs = await dbo.collection("HealthCenters").find({ systype: { $ne: "C" } }).toArray();
                  res.render("AdminPanel/dashboard.ejs", { doctors: doctors, HCs: HCs, reserves: reserves });
                  db.close();
                  res.end()
                })
              }
            }
          }
        }
      })
    })
  }
})

router.get("/adminpanel/transactions", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, async function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var transactions = await dbo.collection("Transactions").find({}).toArray();
          transactions = transactions.reverse();
          res.render("AdminPanel/transactions.ejs", { transactions: transactions })
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/AdminPanel/doctors", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var doctors = await dbo.collection("Doctors").find().toArray()
          res.render("AdminPanel/doctors-list.ejs", { doctors: doctors });
          db.close();
          res.end();
        }
      })
    })
  }
})


router.get("/AdminPanel/doctors/:doctor", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Doctors").findOne({ name: req.params.doctor }, function (err, doctor) {
            res.render("AdminPanel/doctors-profile.ejs", { doctor: doctor });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get("/AdminPanel/healthcenters", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var HCs = await dbo.collection("HealthCenters").find().toArray()
          res.render("AdminPanel/Hcs-list.ejs", { HCs: HCs });
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/AdminPanel/HealthCenters/:hcname", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("HealthCenters").findOne({ name: req.params.hcname }, function (err, HC) {
            res.render("AdminPanel/Hcs-profile.ejs", { HC: HC });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get("/AdminPanel/Chats", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var doctors = await dbo.collection("Doctors").find().toArray()
          res.render("AdminPanel/chats.ejs", { doctors: doctors, chats: [] })
          res.end();
          db.close();
        }
      })
    })
  }
})

router.post("/AdminPanel/Chats", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          if (req.body.name == undefined) {
            db.close();
            res.redirect("/AdminPanel/Chats")
          }
          else {
            var chats = await dbo.collection("Chats").find({ doctor: req.body.name }).toArray()
            var doctors = await dbo.collection("Doctors").find().toArray()
            res.render("AdminPanel/chats.ejs", { doctors: doctors, chats: chats })
            res.end();
            db.close();
          }
        }
      })
    })
  }
})


router.get("/AdminPanel/Chats/:chatid", function (req, res) {
  chatid = new ObjectID(req.params.chatid)
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Chats").findOne({ _id: chatid }, function (err, chat) {
            chat.tickets.forEach(function (doc) {
              doc.datecreated = new persianDate(doc.datecreated).format()
            })
            res.render("AdminPanel/chatpage.ejs", { chat: chat });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})

router.get("/AdminPanel/telereserves", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var doctors = await dbo.collection("Doctors").find().toArray()
          res.render("AdminPanel/telereserves.ejs", { doctors: doctors, reserves: [] })
          res.end();
          db.close();
        }
      })
    })
  }
})

router.post("/AdminPanel/telereserves", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          if (req.body.name == undefined) {
            db.close();
            res.redirect("/AdminPanel/telereserves")
          }
          else {
            dbo.collection("Doctors").findOne({ name: req.body.name }, async function (err, doctor) {
              var doctors = await dbo.collection("Doctors").find().toArray()
              res.render("AdminPanel/telereserves.ejs", { doctors: doctors, reserves: doctor.telereservations })
              res.end();
              db.close();
            })
          }
        }
      })
    })
  }
})

router.get("/AdminPanel/telereserves/:teleresid", function (req, res) {
  teleresid = new ObjectID(req.params.teleresid)
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("teleReservations").findOne({ _id: teleresid }, async function (err, reserve) {
            reserve.doctor = await dbo.collection("Doctors").findOne({ _id: reserve.doctor });
            reserve.doctor = reserve.doctor.name;
            reserve.user = await dbo.collection("Users").findOne({ _id: reserve.user });
            reserve.user = reserve.user.firstname + " " + reserve.user.lastname;
            res.render("AdminPanel/telreserve-status.ejs", { reserve: reserve });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})

router.post("/resetdocpass",function(req,res){
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Doctors").updateOne({name:req.body.docname},{$set:{password:md5(req.body.newpass)}});
          res.redirect("/AdminPanel/Doctors/"+req.body.docname)
        }
      })
    })
  }
})

router.post("/resetHCpass",function(req,res){
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("HealthCenters").updateOne({name:req.body.HCname},{$set:{password:md5(req.body.newpass)}});
          res.redirect("/AdminPanel/HealthCenters/"+req.body.HCname)
        }
      })
    })
  }
})


router.get("/AdminPanel/patients", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Users").find({}, async function (err, users) {
            users = await users.toArray();
            res.render('AdminPanel/patients.ejs', { patients: users });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})



router.get("/AdminPanel/users/:userid", function (req, res) {
  userid = req.params.userid;
  userid = ObjectID(userid);
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Admins').findOne({ token: req.cookies.admintoken }, function (err, result2) {
        if (result2 == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Users").findOne({ _id: userid }, async function (err, result3) {
            if (result3 != null) {
              result3.reserves = await dbo.collection("Reservations").find({ user: userid }).toArray();
              result3.telereserves = await dbo.collection("teleReservations").find({ user: userid }).toArray();
              result3.chats = await dbo.collection("Chats").find({ userphone: result3.phonenumber }).toArray();
              res.render("AdminPanel/patients-profile.ejs", { user: result3, reservations: result3.reserves });
              db.close();
              res.end();
            }
            else {
              db.close();
              res.redirect("/AdminPanel/users");
            }
          })
        }
      })
    })
  }
})



router.get("/Adminpanel/reserves/:resid", function (req, res) {
  resid = req.params.resid;
  resid = ObjectID(resid);
  if (req.cookies.doctortoken == undefined && req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Doctors').findOne({ token: req.cookies.doctortoken }, function (err, result) {
        if (result == null) {
          dbo.collection('Admins').findOne({ token: req.cookies.admintoken }, function (err, result2) {
            if (result2 == null) {
              db.close();
              res.redirect('noaccess');
            }
            else {
              dbo.collection("Reservations").findOne({ _id: resid }, function (err, reserve) {
                dbo.collection("Users").findOne({ _id: reserve.user }, function (err, user) {
                  dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
                    reserve.user = user;
                    if (doctor == null) {
                      dbo.collection("HealthCenters").findOne({ _id: reserve.HC }, function (err, HC) {
                        reserve.doctor = HC;
                        res.render("AdminPanel/reserve-status.ejs", { reserve: reserve });
                        res.end();
                        db.close();
                      })
                    }
                    else {
                      reserve.doctor = doctor;

                      res.render("AdminPanel/reserve-status.ejs", { reserve: reserve });
                      res.end();
                      db.close();
                    }
                  })
                })
              })
            }
          })
        }
        else {
          dbo.collection("Reservations").findOne({ _id: resid }, function (err, reserve) {
            dbo.collection("Users").findOne({ _id: reserve.user }, function (err, user) {
              dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
                reserve.user = user;
                if (doctor == null) {
                  dbo.collection("HealthCenters").findOne({ _id: reserve.HC }, function (err, HC) {
                    reserve.doctor = HC;
                    res.render("AdminPanel/reserve-status.ejs", { reserve: reserve });
                    res.end();
                    db.close();
                  })
                }
                else {
                  reserve.doctor = doctor;
                  console.log(reserve);
                  res.render("AdminPanel/reserve-status.ejs", { reserve: reserve });
                  res.end();
                  db.close();
                }
              })
            })
          })
        }
      })
    })
  }
})


router.get("/Adminpanel/addDoctor", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          categories().then(basiccategories => {
            res.render("AdminPanel/doctors-add.ejs", { categories: basiccategories });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get("/Adminpanel/addcategory", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          res.render("AdminPanel/specialty-add.ejs");
          db.close();
          res.end();
        }
      })
    })
  }
})


router.get("/AdminPanel/pendingdoctors", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          doctors = await dbo.collection("tempDoctors").find({}).toArray();
          res.render("AdminPanel/pendingdocs.ejs", { doctors: doctors })
          res.end();
        }
      })
    })
  }
})

router.get('/AdminPanel/pendingdoctors/:doctor', function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("tempDoctors").findOne({ name: req.params.doctor }, function (err, doctor) {
            res.render("AdminPanel/doctors-profile.ejs", { doctor: doctor });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})

router.get("/removependingdoctors/:doctor", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("tempDoctors").findOne({ name: req.params.doctor }, function (err, doctor) {
            path = "public/docphotos-temp/" + doctor.image.split("/")[2]
            fs.unlink(path, function (err) {
              dbo.collection("tempDoctors").deleteOne({ name: req.params.doctor });
              res.redirect("/adminpanel/pendingdoctors");
              db.close();
            })
          })
        }
      })
    })
  }
})

router.get("/acceptpendingdoctors/:doctor", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("tempDoctors").findOne({ name: req.params.doctor }, function (err, doctor) {
            path = "public/docphotos-temp/" + doctor.image.split("/")[2]
            dest = "public/docphotos/" + doctor.image.split("/")[2]
            mv(path, dest, function (err) {
              dbo.collection("Doctors").insertOne(doctor, function (err, sf) {
                dbo.collection("tempDoctors").deleteOne({ name: req.params.doctor });
                res.redirect("/adminpanel/pendingdoctors");
                db.close();
              })
            })
          })
        }
      })
    })
  }
})

router.get("/AdminPanel/pendinghcs", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          HCs = await dbo.collection("tempHealthCenters").find({}).toArray();
          res.render("AdminPanel/pendinghcs.ejs", { HCs: HCs })
          res.end();
        }
      })
    })
  }
})

router.get("/AdminPanel/pendinghcs/:hcname", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("tempHealthCenters").findOne({ name: req.params.hcname }, function (err, HC) {
            res.render("AdminPanel/Hcs-profile.ejs", { HC: HC });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})

router.get("/removependinghcs/:HC", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("tempHealthCenters").findOne({ name: req.params.HC }, function (err, HC) {
            a=HC.image.split("/");
            a[1]+="-temp";
            path = a.join("/");
            path = "public" + path;
            fs.unlink(path, function (err) {
              dbo.collection("tempHealthCenters").deleteOne({ name: req.params.HC });
              res.redirect("/adminpanel/pendinghcs");
              db.close();
            })
          })
        }
      })
    })
  }
})

router.get("/acceptpendinghcs/:HC", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("tempHealthCenters").findOne({ name: req.params.HC }, function (err, HC) {
            a=HC.image.split("/");
            a[1]+="-temp";
            path = a.join("/");
            path = "public" + path;
            dest = "public" + HC.image
            mv(path, dest, function (err) {
              dbo.collection("HealthCenters").insertOne(HC, function (err, sf) {
                dbo.collection("tempHealthCenters").deleteOne({ name: req.params.HC });
                res.redirect("/adminpanel/pendinghcs");
                db.close();
              })
            })
          })
        }
      })
    })
  }
})

router.get("/Adminpanel/visittimes", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          res.render("AdminPanel/visittimes.ejs");
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/adminpanel/costmanage", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          res.render("AdminPanel/costmanage.ejs");
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/archive/:type/:id",function(req,res){
  id=ObjectID(req.params.id);
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          if(req.params.type=="doc"){
            dbo.collection("Doctors").updateOne({_id:id},{$set:{archived:true}});
            res.redirect("/adminpanel/doctors");
            db.close();
          }
          else{
            dbo.collection("HealthCenters").updateOne({_id:id},{$set:{archived:true}});
            res.redirect("/adminpanel/HealthCenters");
            db.close();
          }
        }
      })
    })
  }
})

router.get("/unarchive/:type/:id",function(req,res){
  id=ObjectID(req.params.id);
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          if(req.params.type=="doc"){
            dbo.collection("Doctors").updateOne({_id:id},{$set:{archived:false}});
            res.redirect("/adminpanel/doctors");
            db.close();
          }
          else{
            dbo.collection("HealthCenters").updateOne({_id:id},{$set:{archived:false}});
            res.redirect("/adminpanel/HealthCenters");
            db.close();
          }
        }
      })
    })
  }
})

router.get("/changecostadmin", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect("/noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, admin) {
        if (admin == null) {
          db.close();
          res.redirect("noaccess");
        }
        else {
          if (query.type == "doctor") {
            switch (query.visittype) {
              case "chat":
                dbo.collection("Doctors").updateMany({}, { $set: { chatcost: Number(query.cost) } })
                dbo.collection("costs").updateOne({},{$set:{docchatcost:Number(query.cost)}});
                db.close();
                res.redirect("/adminpanel/costmanage");
                break;
              case "tele":
                dbo.collection("Doctors").updateMany({}, { $set: { televisitcost: Number(query.cost) } })
                dbo.collection("costs").updateOne({},{$set:{doctelcost:Number(query.cost)}});
                db.close();
                res.redirect("/adminpanel/costmanage");
                break;
              default:
                dbo.collection("Doctors").updateMany({}, { $set: { visitcost: Number(query.cost) } })
                dbo.collection("costs").updateOne({},{$set:{docrescost:Number(query.cost)}});
                db.close();
                res.redirect("/adminpanel/costmanage");
                break;
            }
          }
          else if (query.type == "آزمایشگاه") {
            dbo.collection("HealthCenters").updateMany({ type: "آزمایشگاه" }, { $set: { visitcost: Number(query.cost) } })
            dbo.collection("costs").updateOne({},{$set:{labrescost:Number(query.cost)}});
            db.close();
            res.redirect("/adminpanel/costmanage");
          }
          else if (query.type == "کلینیک") {
            dbo.collection("HealthCenters").updateMany({ type: "کلینیک" }, { $set: { 'categories.$[].visitcost': Number(query.cost) } });
            dbo.collection("costs").updateOne({},{$set:{clinicrescost:Number(query.cost)}});
            db.close();
            res.redirect("/adminpanel/costmanage");
          }
        }
      })
    })
  }
})

router.post("/addCategory", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Categories").insertOne({ name: req.body.name, image: "/catphotos/" + req.body.name.split(' ').join('-') + ".png" }, function (err, insert) {
            if (req.files != null) {
              mv(req.files.image.tempFilePath, "public" + "/catphotos/" + req.body.name.split(' ').join('-') + ".png", function (err) {
                console.log("public" + "/catphotos/" + req.body.name.split(' ').join('-') + ".png")
              })
            }
            db.close();
            res.redirect('/Adminpanel/categories');
          })
        }
      })
    })
  }
})

router.get("/Adminpanel/editcategory", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Categories").findOne({ name: query.category }, function (err, category) {
            res.render("AdminPanel/specialty-edit.ejs", { category: category });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


// router.post("/editcategory",function(req,res){
//   var query= url.parse(req.url,true).query;
//   if(req.cookies.admintoken==undefined){
//     res.redirect('/noaccess');
//   }
//   else{
//     MongoClient.connect(dburl,function(err,db){
//       var dbo=db.db("mydb");
//       dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
//         if(result==null){
//           db.close();
//           res.redirect('/noaccess');
//         }
//         else{
//           dbo.collection("Categories").updateOne({name:query.name},{$set:{name:req.body.name,image:"/catphotos/"+req.body.name.split(' ').join('-')+".png"}},function(err,update){
//             if(req.files!=null){
//               mv(req.files.image.tempFilePath,"public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png",function(err){
//                 console.log("public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png")
//               })
//             }
//             db.close();
//             res.redirect('/Adminpanel/categories');
//           })
//         }
//       })
//     })
//   }
// })

router.get("/Adminpanel/categories", function (req, res) {
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          var cats = []
          dbo.collection("Categories").find({}).forEach(function (doc) {
            cats.push(doc);
          }, function () {
            res.render("AdminPanel/specialties.ejs", { categories: cats });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get("/removecategory", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('/noaccess');
        }
        else {
          dbo.collection("Categories").deleteOne({ name: query.category }, function (err, deleted) {
            fs.unlink('public/catphotos/' + query.category.split(' ').join('-') + ".png", function (err) {
              if (err && err.code == 'ENOENT') {
                console.info("File doesn't exist, won't remove it.");
              } else if (err) {
                console.error("Error occurred while trying to remove file");
              } else {
                console.info(`removed`);
              }
              dbo.collection("Doctors").updateMany({ categories: query.category }, { $pull: { categories: query.category } }, function (err, done) {
                res.redirect("adminpanel/categories")
              })
            });
          })
        }
      })
    })
  }
})


router.get("/HCsignup", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.admintoken == undefined) {
    res.redirect("/noaccess");
  }
  else {
    if (query.ejs != undefined) {
      try {
        res.render(query.ejs, { flag: 0 });
        res.end();
      } catch (error) {
        res.redirect("/HCsignup")
      }
    }
    else {
      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Admins").findOne({ token: req.cookies.admintoken }, function (err, admin) {
          if (admin == null) {
            res.redirect("/noaccess");
          }
          else {
            dbo.collection("HCtypes").find({}, async function (err, result) {
              types = await result.toArray();
              res.render("HCsignup.ejs", { types: types });
              res.end();
              db.close();
            })
          }
        })
      })
    }
  }
})



//------------------------adminpanel---------------------------//
//------------------------userpanel----------------------------//

router.get("/UserPanel/profile", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          res.render("UserPanel/profile.ejs", { user: user })
          res.end();
          db.close();
        }
      })
    })
  }
})



router.post("/changeuserinfo", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          dbo.collection("Users").updateOne({ token: req.cookies.usertoken }, { $set: { firstname: req.body.firstname, lastname: req.body.lastname, sex: req.body.sex } }, function (err, asdf) {
            res.redirect("/UserPanel/profile");
            db.close();
          })
        }
      })
    })
  }
})



router.get("/UserPanel/chats", function (req, res) {   //buggggggg
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, async function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          user.chats = await dbo.collection("Chats").find({ userphone: user.phonenumber }).toArray();
          user.chats.forEach(function (doc) {
            doc.datecreated = new persianDate(doc.tickets[doc.tickets.length - 1].datecreated).format("L")
          })
          res.render("UserPanel/chats.ejs", { user: user, chats: user.chats })
          res.end();
          db.close();
        }
      })
    })
  }
})

router.get("/UserPanel/chats/:chatid", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect('/noaccess');
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection('Users').findOne({ token: req.cookies.usertoken }, async function (err, result) {
        if (result == null) {
          db.close();
          res.redirect('noaccess');
        }
        else {
          var chatid = ObjectID(req.params.chatid);
          dbo.collection("Chats").findOne({ _id: chatid, userphone: result.phonenumber }, function (err, chat) {
            chat.tickets.forEach(function (doc) {
              doc.datecreated = new persianDate(doc.datecreated).format()
            })
            res.render("UserPanel/chatpage.ejs", { chat: chat });
            db.close();
            res.end();
          })
        }
      })
    })
  }
})

router.get("/UserPanel/reservations", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, async function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          reserves = await dbo.collection("Reservations").find({ user: user._id }).toArray();
          res.render("UserPanel/reservations.ejs", { reserves: reserves })
          res.end();
          db.close();
        }
      })
    })
  }
})

router.get("/UserPanel/reservations/:resid", function (req, res) {
  var resid = ObjectID(req.params.resid);
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, async function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          dbo.collection("Reservations").findOne({ _id: resid }, function (err, reserve) {
            dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
              if (doctor != null) {
                reserve.doctor = doctor;
                res.render("UserPanel/reserve-status.ejs", { reserve: reserve });
                db.close();
                res.end();
              }
              else {
                dbo.collection("HealthCenters").findOne({ _id: reserve.HC }, function (err, HC) {
                  if (HC == null) {
                    res.redirect("thereisproblem");
                  }
                  else {
                    reserve.HC = HC;
                    res.render("UserPanel/reserve-status.ejs", { reserve: reserve });
                    db.close();
                    res.end();
                  }
                })
              }
            })
          })
        }
      })
    })
  }
})

router.get("/UserPanel/telereservations", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, async function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          reserves = await dbo.collection("teleReservations").find({ user: user._id }).toArray();
          res.render("UserPanel/telereservations.ejs", { reserves: reserves })
          res.end();
          db.close();
        }
      })
    })
  }
})

router.get("/UserPanel/telereservations/:resid", function (req, res) {
  var resid = ObjectID(req.params.resid);
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, async function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          dbo.collection("teleReservations").findOne({ _id: resid }, function (err, reserve) {
            dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
              reserve.doctor = doctor;
              res.render("UserPanel/telereserve-status.ejs", { reserve: reserve });
              db.close();
              res.end();
            })
          })
        }
      })
    })
  }
})

router.get("/UserPanel/experiments", function (req, res) {
  if (req.cookies.usertoken == undefined) {
    res.redirect("noaccess");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, async function (err, user) {
        if (user == null) {
          res.redirect("noaccess");
          db.close();
        }
        else {
          exps = await dbo.collection("Experiments").aggregate([{ $match: { userid: user._id } }, { $lookup: { from: "HealthCenters", localField: "hcid", foreignField: "_id", as: "hcid" } }]).toArray();
          exps.forEach(function (doc) {
            doc.dateuploaded = new persianDate(doc.dateuploaded).format("L");
          })
          res.render("UserPanel/experiments.ejs", { exps: exps })
          res.end();
          db.close();
        }
      })
    })
  }
})

router.get("/downloadexp", function (req, res) {
  var query = url.parse(req.url, true).query;
  var expid = ObjectID(query.expid)
  if (req.cookies.usertoken == undefined) {
    res.redirect("/UserPanel/experiments");
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
        if (user == null) {
          res.redirect("/UserPanel/experiments");
          db.close();
        }
        else {
          dbo.collection("Experiments").findOne({ _id: expid }, function (err, exp) {
            if (exp == null) {
              res.redirect("notfound");
              db.close();
            }
            else {
              if (exp.userid.toString() != user._id.toString()) {
                console.log(exp.userid);
                console.log(user._id)
                res.redirect("noaccess");
                db.close();
              }
              else {
                res.download(query.path);
                db.close();
              }
            }
          })
        }
      })
    })
  }
})


//------------------------userpanel----------------------------//

router.get("/", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  Categories = [];
  MongoClient.connect(dburl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    if (req.cookies.usertoken == undefined) {
      categories().then(basiccategories => {
        res.render('index.ejs', { Objects: basiccategories, type: "category", category: "", user: "", categories: basiccategories });
        res.end();
        db.close();
      })
    }
    else {
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, result) {
        if (err) throw err;
        if (result == null) {
          res.clearCookie('usertoken');
          res.redirect('/');
        }
        categories().then(basiccategories => {
          res.render('index.ejs', { Objects: basiccategories, type: "category", category: "", user: result, categories: basiccategories });
          res.end();
          db.close();
        })
      })
    }
  })
})


router.get("/consultant", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  Categories = [];
  MongoClient.connect(dburl, async function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    if (req.cookies.usertoken == undefined) {
      user = "";
    }
    else {
      user = await dbo.collection("Users").findOne({ token: req.cookies.usertoken })
      if (user == null) {
        user = "";
      }
    }
    docpics = {};
    counter = 1;
    a = await dbo.collection("Categories").find({}).toArray();
    drcounts = await dbo.collection("Doctors").find({ $or: [{ membershiptypes: "chatconsultant" }, { membershiptypes: "teleconsultant" }] ,archived:false }).count();
    a.forEach(async function (doc, index, array) {
      docpics[doc.name] = await dbo.collection("Doctors").find({ categories: doc.name ,archived:false }, { projection: { image: 1, _id: 0 } }).limit(4).toArray();
      counter++;
      if (counter == array.length) {
        categories().then(basiccategories => {
          res.render("consultant.ejs", { categories: basiccategories, user: user, drcounts: drcounts, docpics: docpics });
          res.end();
        })
      }
    })
  })
})

router.get("/consultant/:Category", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  var query = url.parse(req.url, true).query;
  if (query.city == "all") {
    qcity = { $regex: '.*' }
  }
  else {
    qcity = query.city;
  }
  Doctors = [];
  MongoClient.connect(dburl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.collection("Doctors").find({ categories: req.params.Category.split('-').join(' '), city: qcity ,archived:false }).forEach(function (doc, err) {
      Doctors.push(doc);
    }, function () {
      if (req.cookies.usertoken == undefined) {
        categories().then(basiccategories => {
          res.render("index.ejs", { Objects: Doctors, type: "doc", category: req.params.Category, user: "", categories: basiccategories });
          res.end();
          db.close();
        })
      }
      else {
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, result) {
          if (err) throw err;
          if (result == null) {
            res.clearCookie('usertoken');
            res.redirect('/category//' + req.params.Category);
          }
          categories().then(basiccategories => {
            res.render('index.ejs', { Objects: Doctors, type: "doc", category: req.params.Category.split(' ').join('-'), user: result, categories: basiccategories });
            res.end();
            db.close();
          })
        })
      }
    })
  })
})



router.get("/HealthCenters", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("HCtypes").find({}, async function (err, result) {
      var types = await result.toArray();
      if (req.cookies.usertoken == undefined) {
        categories().then(basiccategories => {
          res.render("healthcenters.ejs", { Objects: types, user: "", categories: basiccategories });
          res.end();
          db.close();
        })
      }
      else {
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            categories().then(basiccategories => {
              res.render("healthcenters.ejs", { Objects: types, user: "", categories: basiccategories });
              res.end();
              db.close();
            })
          }
          else {
            categories().then(basiccategories => {
              res.render("healthcenters.ejs", { Objects: types, user: user, categories: basiccategories });
              res.end();
              db.close();
            })
          }
        })
      }
    })
  })
})

router.get("/healthcenters/:type", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  var type = req.params.type.split("-").join(' ');
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("HealthCenters").find({ type: type ,archived:false }, async function (err, result) {
      HCs = await result.toArray();
      if (req.cookies.usertoken == undefined) {
        categories().then(basiccategories => {
          res.render("healthcenters-type.ejs", { Objects: HCs, user: "", categories: basiccategories, type: type });
          res.end();
          db.close();
        })
      }
      else {
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            categories().then(basiccategories => {
              res.render("healthcenters-type.ejs", { Objects: HCs, user: "", categories: basiccategories, type: type });
              res.end();
              db.close();
            })
          }
          else {
            categories().then(basiccategories => {
              res.render("healthcenters-type.ejs", { Objects: HCs, user: user, categories: basiccategories, type: type });
              res.end();
              db.close();
            })
          }
        })
      }
    })
  })
})


router.get("/healthcenters/:type/:HC", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  var HCname = req.params.HC.split("-").join(' ');
  var type = req.params.type.split("-").join(' ');
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("HealthCenters").findOne({ name: HCname }, function (err, HC) {
      if (HC.systype == "C") {
        if (req.cookies.usertoken == undefined) {
          categories().then(basiccategories => {
            res.render("hc-info.ejs", { user: "", categories: basiccategories, HC: HC });
            res.end();
            db.close();
          })
        }
        else {
          dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
            if (user == null) {
              categories().then(basiccategories => {
                res.render("hc-info.ejs", { user: user, categories: basiccategories, HC: HC });
                res.end();
                db.close();
              })
            }
            else {
              categories().then(basiccategories => {
                res.render("hc-info.ejs", { user: user, categories: basiccategories, HC: HC });
                res.end();
                db.close();
              })
            }
          })
        }
      }
      else if (HC.systype == "B") {
        if (req.cookies.usertoken == undefined) {
          categories().then(basiccategories => {
            res.render("hc-res-info.ejs", { user: "", categories: basiccategories, HC: HC, category: "آزمایش" });
            res.end();
            db.close();
          })
        }
        else {
          dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
            if (user == null) {
              categories().then(basiccategories => {
                res.render("hc-res-info.ejs", { user: user, categories: basiccategories, HC: HC, category: "آزمایش" });
                res.end();
                db.close();
              })
            }
            else {
              categories().then(basiccategories => {
                res.render("hc-res-info.ejs", { user: user, categories: basiccategories, HC: HC, category: "آزمایش" });
                res.end();
                db.close();
              })
            }
          })
        }
      }
      else if (HC.systype == "A") {
        if (req.cookies.usertoken == undefined) {
          categories().then(basiccategories => {
            res.render("hc-cats.ejs", { Objects: HC.categories, user: "", categories: basiccategories, HC: HC });
            res.end();
            db.close();
          })
        }
        else {
          dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
            if (user == null) {
              categories().then(basiccategories => {
                res.render("hc-cats.ejs", { Objects: HC.categories, user: "", categories: basiccategories, HC: HC });
                res.end();
                db.close();
              })
            }
            else {
              categories().then(basiccategories => {
                res.render("hc-cats.ejs", { Objects: HC.categories, user: user, categories: basiccategories, HC: HC });
                res.end();
                db.close();
              })
            }
          })
        }
      }
    })
  })
})


router.get("/reservation/info/:type/:HCname/:category", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  var HCname = req.params.HCname.split('-').join(' ');
  var type = req.params.type.split('-').join(' ');
  var category = req.params.category.split('-').join(' ');
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("HealthCenters").findOne({ type: type, name: HCname }, function (err, HC) {
      if (req.cookies.usertoken == undefined) {
        categories().then(basiccategories => {
          res.render("hc-res-info.ejs", { HC: HC, category: category, categories: basiccategories, user: "" });
          res.end();
          db.close();
        })
      }
      else {
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            categories().then(basiccategories => {
              res.render("hc-res-info.ejs", { HC: HC, category: category, categories: basiccategories, user: "" });
              res.end();
              db.close();
            })
          }
          else {
            categories().then(basiccategories => {
              res.render("hc-res-info.ejs", { HC: HC, category: category, categories: basiccategories, user: user });
              res.end();
              db.close();
            })
          }
        })
      }
    })
  })
})

router.get("/reservation/:type/:HCname/:category", function (req, res) {
  var HCname = req.params.HCname.split('-').join(' ');
  var type = req.params.type.split('-').join(' ');
  var category = req.params.category.split('-').join(' ');
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    days = [];
    freetimes = []
    dbo.collection("HealthCenters").findOne({ name: HCname, type: type ,archived:false }, function (err, result) {
      if (result == null || result.categories == undefined) {
        res.redirect("/noaccess")
      }
      else {
        var catobj = null;
        result.categories.forEach(function (doc) {
          if (doc.name == category) {
            catobj = doc;
          }
        })
        if (catobj == null) {
          res.redirect("/noaccess")
        }
        else {
          currentday = new persianDate();
          days.push(currentday);
          freetimes.push(getDoctimeslots(catobj, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
          for (let i = 0; i < 14; i++) {
            currentday = currentday.add("d", 1);
            days.push(currentday);
            freetimes.push(getDoctimeslots(catobj, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
          }
          res.render("reservehc.ejs", { HC: result, cat: catobj, days: createDayboxobj(days), freetimes: freetimes });
          res.end();
        }
      }
    })
  })
})

router.get("/reservation/:type/:HCname", function (req, res) {
  var HCname = req.params.HCname.split('-').join(' ');
  var type = req.params.type.split('-').join(' ');
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    days = [];
    freetimes = []
    dbo.collection("HealthCenters").findOne({ name: HCname, type: type ,archived:false }, function (err, HC) {
      if (HC == null || HC.systype != "B") {
        res.redirect("/noaccess")
      }
      else {
        currentday = new persianDate();
        days.push(currentday);
        freetimes.push(getDoctimeslots(HC, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
        for (let i = 0; i < 14; i++) {
          currentday = currentday.add("d", 1);
          days.push(currentday);
          freetimes.push(getDoctimeslots(HC, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
        }
        res.render("reservehc.ejs", { HC: HC, cat: HC, days: createDayboxobj(days), freetimes: freetimes });
        res.end();
      }
    })
  })
})


router.get("/ticket/:doctor", function (req, res) {
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Doctors").findOne({ name: req.params.doctor.split('-').join(' ') ,archived:false }, function (err, doctor) {
      if (doctor == null) {
        res.redirect("/")
        res.end();
      }
      else {
        res.render("ticket.ejs", { doctor: doctor });
        res.end();
        db.close();
      }
    })
  })
})


router.post("/ticketpayment", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.usertoken == undefined) {
    res.redirect("/signup?from=" + query.from);
  }
  else {
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
        if (user == null) {
          res.redirect("/signup?from=" + query.from);
          db.close();
          res.end();
        }
        else {
          dbo.collection("Doctors").findOne({ name: req.body.doctor }, function (err, doctor) {
            zarinpal.PaymentRequest({
              Amount: req.body.cost, // In Tomans
              CallbackURL: 'http://reservation.drtajviz.com/ticketpaymenthandler',
              Description: 'Dr tajviz payment',
              Email: 'shayanthrn@gmail.com',
              Mobile: user.phonenumber
            }).then(response => {
              if (response.status === 100) {
                var newchat = new Chat(req.body.doctor, user.phonenumber, doctor.chatcost);
                addtransaction(user._id, req.body.cost, response.authority);
                newchat.authority = response.authority;
                var now = new Date();
                var newticket;
                if (req.files == null) {
                  newticket = new Ticket(req.body.subject, req.body.text, null, now, "patient");

                  newchat.tickets.push(newticket);
                  dbo.collection("TempChats").insertOne(newchat, function (err, as) {
                    res.redirect(response.url);
                    db.close();
                  })
                }
                else {
                  var arr = req.files.file.name.split('.');
                  var fileformat = arr[arr.length - 1];
                  var file = { format: fileformat, path: "data/ticketfiles/" + arr[0] + now.getTime() + "." + fileformat };
                  newticket = new Ticket(req.body.subject, req.body.text, file, now, "patient");
                  mv(req.files.file.tempFilePath, file.path, { mkdirp: true }, function (err) {
                    newchat.tickets.push(newticket);
                    dbo.collection("TempChats").insertOne(newchat, function (err, as) {
                      res.redirect(response.url);
                      db.close();
                    })
                  })
                }
              }
              else {
                res.redirect("/failure");
                db.close()
              }
            }).catch(err => {
              res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
              console.error(err);
              db.close();
              res.end();
            });
          })
        }
      })
    })
  }
})

router.get("/paymentaccept2", function (req, res) {
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
      if (user == null) {
        user = "";
      }
      categories().then(basiccategories => {
        res.render("paymentaccept2.ejs", { categories: basiccategories, user: user });
        res.end();
      })
    })
  })
})

router.get("/ticketpaymenthandler", function (req, res) {
  var query = url.parse(req.url, true).query;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("TempChats").findOne({ authority: query.Authority }, function (err, chat) {
      if (chat == null) {
        db.close();
        res.redirect("/paymentaccept2")
      }
      else {
        console.log(chat)
        if (query.Status == "NOK") {
          dbo.collection("Doctors").findOne({ name: chat.doctor }, function (err, doctor) {
            dbo.collection("TempChats").deleteOne({ authority: query.Authority }, function (err, result) {
              if (chat.tickets[0].file != null) {
                fs.unlink(chat.tickets[0].file.path, function (err) {
                  if (err && err.code == 'ENOENT') {
                    console.info("File doesn't exist, won't remove it.");
                  } else if (err) {
                    console.error("Error occurred while trying to remove file");
                  } else {
                    console.info(`removed`);
                  }
                });
              }
              doctor.visitcost = doctor.chatcost;
              changestatustransaction(query.Authority, "ناموفق");
              res.render("paymentfail.ejs", { doctor: doctor, time: "-", resid: 0, chat: 1, doc: 1 });
              db.close();
              res.end();
            })
          })
        }
        else {
          zarinpal.PaymentVerification({
            Amount: chat.cost, // In Tomans
            Authority: chat.authority,
          }).then(response => {
            if (response.status === 100 && response.RefID != 0) {
              var mychat = chat;
              mychat.refid = response.RefID;
              dbo.collection("Chats").insertOne(mychat, function (err, result234) {
                dbo.collection("TempChats").deleteOne({ authority: query.Authority }, function (err, aa) {
                  dbo.collection("Users").updateOne({ phonenumber: mychat.userphone }, { $addToSet: { chats: mychat } }, function (err, ad) {
                    dbo.collection("Doctors").findOne({ name: mychat.doctor }, function (err, doctor) {
                      dbo.collection("Doctors").updateOne({ name: mychat.doctor }, { $addToSet: { chats: mychat } }, function (err, sas) {
                        changestatustransaction(query.Authority, "موفق");
                        res.render("paymentaccept.ejs", { doctor: doctor, time: "-", resid: mychat.refid, chat: 1, doc: 1 });
                        //sendSMSforres(reservation);
                        res.end();
                      })
                    })
                  })
                })
              })
            }
            else {
              dbo.collection("Doctors").findOne({ name: chat.doctor }, function (err, doctor) {
                dbo.collection("TempChats").deleteOne({ authority: query.Authority }, function (err, result) {
                  if (chat.tickets[0].file != null) {
                    fs.unlink(chat.tickets[0].file.path, function (err) {
                      if (err && err.code == 'ENOENT') {
                        console.info("File doesn't exist, won't remove it.");
                      } else if (err) {
                        console.error("Error occurred while trying to remove file");
                      } else {
                        console.info(`removed`);
                      }
                    });
                  }
                  doctor.visitcost = doctor.chatcost;
                  changestatustransaction(query.Authority, "ناموفق");
                  res.render("paymentfail.ejs", { doctor: doctor, time: "-", resid: 0, chat: 1, doc: 1 });
                  db.close();
                  res.end();
                })
              })
            }
          }).catch(err => {
            res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
            console.error(err);
            res.end();
          });
        }
      }
    })
  })
})


router.post("/telepayment", function (req, res) {
  var query = url.parse(req.url, true).query;
  if (req.cookies.usertoken == undefined) {
    res.redirect("/signup?from=" + query.from);
  }
  else {
    if (req.body.choice == undefined) {
      res.redirect("back");
    }
    else {
      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            res.redirect("/signup?from=" + query.from);
            db.close();
            res.end();
          }
          else {
            dbo.collection("Doctors").findOne({ name: req.body.doctor }, function (err, doctor) {
              var reservedata = req.body.choice.split(":");
              var date = new myDate(Number(reservedata[2]), Number(reservedata[1]), Number(reservedata[0]));
              var time = { start: reservedata[3], end: reservedata[4] };
              var timeinfo = { time: time, date: date }
              zarinpal.PaymentRequest({
                Amount: req.body.cost, // In Tomans
                CallbackURL: 'http://reservation.drtajviz.com/telepaymenthandler',
                Description: 'Dr tajviz payment',
                Email: 'shayanthrn@gmail.com',
                Mobile: user.phonenumber
              }).then(response => {
                if (response.status === 100) {
                  reservation = new teleReservation(user._id, doctor._id, timeinfo, response.authority, req.body.cost);
                  addtransaction(user._id, req.body.cost, response.authority);
                  dbo.collection("TempteleReserves").insertOne(reservation, function (err, reserve) {
                    res.redirect(response.url)
                  })
                }
              }).catch(err => {
                res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
                console.error(err);
                db.close();
                res.end();
              });
            })
          }
        })
      })
    }
  }
})

router.get("/telepaymenthandler", function (req, res) {
  var query = url.parse(req.url, true).query;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("TempteleReserves").findOne({ authority: query.Authority }, function (err, reserve) {
      if (reserve == null) {
        db.close();
        res.redirect("/paymentaccept2")

      }
      else {
        if (query.Status == "NOK") {
          strtime = n(reserve.timeinfo.time.start) + "-" + n(reserve.timeinfo.time.end);
          dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
            dbo.collection("TempteleReserves").deleteOne({ authority: query.Authority }, function (err, result) {
              changestatustransaction(query.Authority, "ناموفق");
              res.render("paymentfail.ejs", { doctor: doctor, time: strtime, resid: 0, chat: 2, doc: 1 });
              db.close();
              res.end();
            })
          })
        }
        else {
          zarinpal.PaymentVerification({
            Amount: reserve.cost, // In Tomans
            Authority: reserve.authority,
          }).then(response => {
            if (response.status === 100 && response.RefID != 0) {
              var reservation = reserve;
              reservation.refid = response.RefID;
              dbo.collection("teleReservations").insertOne(reservation, function (err, result234) {
                dbo.collection("TempteleReserves").deleteOne({ authority: query.Authority }, function (err, aa) {
                  dbo.collection("Users").updateOne({ _id: reservation.user }, { $addToSet: { telereservations: reservation } }, function (err, ad) {
                    dbo.collection("Doctors").findOne({ _id: reservation.doctor }, function (err, doctor) {
                      dbo.collection("Doctors").updateOne({ _id: reservation.doctor }, { $addToSet: { telereservations: reservation } }, async function (err, sas) {
                        strtime = n(reservation.timeinfo.time.start) + "-" + n(reservation.timeinfo.time.end);
                        changestatustransaction(query.Authority, "موفق");
                        res.render("paymentaccept.ejs", { doctor: doctor, time: strtime, resid: reservation.refid, chat: 2, doc: 1 });
                        user = await dbo.collection("Users").findOne({ _id: reservation.user })
                        mytime = reservation.timeinfo.date.year + "/" + reservation.timeinfo.date.month + "/" + reservation.timeinfo.date.day
                        sendSMS("teleresdoc", doctor._id, "Doctors", mytime, strtime,user.firstname+" "+user.lastname);
                        sendSMS("teleresuser", user._id, "Users", mytime, strtime,doctor.name);
                        res.end();
                      })
                    })
                  })
                })
              })
            }
            else {
              strtime = n(reserve.timeinfo.time.start) + "-" + n(reserve.timeinfo.time.end);
              dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
                dbo.collection("TempteleReserves").deleteOne({ authority: query.Authority }, function (err, result) {
                  changestatustransaction(query.Authority, "ناموفق");
                  res.render("paymentfail.ejs", { doctor: doctor, time: strtime, resid: 0, chat: 2, doc: 1 });
                  res.end();
                })
              })
            }
          }).catch(err => {
            res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
            console.error(err);
            res.end();
          });
        }
      }
    })
  })
})


router.post("/paymentHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  if (req.cookies.usertoken == undefined) {
    res.redirect("/signup" + "?from=" + query.from);
  }
  else {
    if (req.body.choice == undefined) {
      console.log(query.from)
      res.redirect("back")
      res.end();
    }
    else {
      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            res.redirect("/signup" + "?from=" + query.from);
            db.close();
            res.end();
          }
          else {
            if (checkinterval(1)) {
              dbo.collection("HealthCenters").findOne({ name: req.body.HCname, type: req.body.type }, function (err, HC) {
                if (HC == null) {
                  db.close();
                  res.redirect("/noaccess");
                }
                else {
                  var catobj = null;
                  if (HC.categories == undefined) {
                    catobj = HC;
                  }
                  else {
                    HC.categories.forEach(function (doc) {
                      if (doc.name == req.body.cat) {
                        catobj = doc;
                      }
                    })
                    if (catobj == null) {
                      res.redirect("/noaccess")
                    }
                  }
                  reservedata = req.body.choice.split(":");
                  date = new myDate(Number(reservedata[4]), Number(reservedata[3]), Number(reservedata[2]));
                  start = { hour: Number(reservedata[0]), min: Number(reservedata[1]) };
                  temp = (start.hour * 60) + start.min + catobj.visitduration;
                  end = { hour: Math.floor(temp / 60), min: temp % 60 }
                  unavb = { start: start, end: end, date: date, dayofweek: new persianDate([Number(reservedata[2]), Number(reservedata[3]), Number(reservedata[4])]).format("dddd") };
                  zarinpal.PaymentRequest({
                    Amount: req.body.cost, // In Tomans
                    CallbackURL: 'http://reservation.drtajviz.com/paymenthandlerHC',
                    Description: 'Dr tajviz payment',
                    Email: 'shayanthrn@gmail.com',
                    Mobile: user.phonenumber
                  }).then(response => {
                    if (response.status === 100) {
                      reservation = new ReservationHC(user._id, HC._id, req.body.cat, unavb, response.authority, req.body.cost);
                      addtransaction(user._id, req.body.cost, response.authority);
                      dbo.collection("TempReservesHC").insertOne(reservation, function (err, reserve) {
                        res.redirect(response.url)
                      })
                    }
                  }).catch(err => {
                    res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
                    console.error(err);
                    db.close();
                    res.end();
                  });
                }
              })
            }
          }
        })
      })
    }
  }
})



router.get("/paymenthandlerHC", function (req, res) {
  var query = url.parse(req.url, true).query;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("TempReservesHC").findOne({ authority: query.Authority }, function (err, reserve) {
      if (reserve == null) {
        db.close();
        res.redirect("/paymentaccept2")
      }
      else {
        if (query.Status == "NOK") {
          strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
          dbo.collection("HealthCenters").findOne({ _id: reserve.HC }, function (err, HC) {
            dbo.collection("TempReservesHC").deleteOne({ authority: query.Authority }, function (err, result) {
              if(HC.systype=="A"){
                HC.visitcost=HC.categories[0].visitcost;
              }
              changestatustransaction(query.Authority, "ناموفق");
              res.render("paymentfail.ejs", { doctor: HC, time: strtime, resid: 0, chat: 0, doc: 0 });
              db.close();
              res.end();
            })
          })
        }
        else {
          zarinpal.PaymentVerification({
            Amount: reserve.cost, // In Tomans
            Authority: reserve.authority,
          }).then(response => {
            if (response.status === 100 && response.RefID != 0) {
              var reservation = reserve;
              reservation.refid = response.RefID;
              dbo.collection("Reservations").insertOne(reservation, function (err, result234) {
                dbo.collection("TempReservesHC").deleteOne({ authority: query.Authority }, function (err, aa) {
                  dbo.collection("Users").updateOne({ _id: reservation.user }, { $addToSet: { reserves: reservation } }, function (err, ad) {
                    dbo.collection("HealthCenters").findOne({ _id: reservation.HC }, async function (err, HC) {
                      if (HC.systype == "B") {
                        dbo.collection("HealthCenters").updateOne({ _id: reservation.HC }, { $addToSet: { reservations: reservation, unavailabletimes: reservation.time } }, function (err, sas) {
                          strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
                          changestatustransaction(query.Authority, "موفق");
                          res.render("paymentaccept.ejs", { doctor: HC, time: strtime, resid: reservation.refid, chat: 0, doc: 0 });
                          res.end();
                        })
                      }
                      else {
                        var catobj = null;
                        console.log("this is hc categories------------:");
                        console.log(HC.categories);
                        HC.categories.forEach(function (doc) {
                          if (doc.name == reservation.catname) {
                            doc.reservations.push(reservation);
                            doc.unavailabletimes.push(reservation.time);
                          }
                        })
                        console.log("this is hc categories---afterchanges---------:");
                        console.log(HC.categories);
                        dbo.collection("HealthCenters").updateOne({ _id: reservation.HC }, { $set: { categories: HC.categories } }, function (err, sdf) {
                          strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
                          changestatustransaction(query.Authority, "موفق");
                          if(HC.systype=="A"){
                            HC.visitcost=HC.categories[0].visitcost;
                          }
                          res.render("paymentaccept.ejs", { doctor: HC, time: strtime, resid: reservation.refid, chat: 0, doc: 0 });
                          res.end();
                        })
                      }
                      user = await dbo.collection("Users").findOne({ _id: reservation.user })
                      mytime = new persianDate([reservation.time.date.year, reservation.time.date.month, reservation.time.date.day])
                      sendSMS("resHC", HC._id, "HealthCenters", mytime.format("L"), user.firstname + " " + user.lastname, null);
                      sendSMS("resHCuser", user._id, "Users", mytime.format("L"), HC.name, null);
                    })
                  })
                })
              })
            } else {
              strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
              dbo.collection("HealthCenters").findOne({ _id: reserve.HC }, function (err, HC) {
                dbo.collection("TempReservesHC").deleteOne({ authority: query.Authority }, function (err, result) {
                  if(HC.systype=="A"){
                    HC.visitcost=HC.categories[0].visitcost;
                  }
                  changestatustransaction(query.Authority, "ناموفق");
                  res.render("paymentfail.ejs", { doctor: HC, time: strtime, resid: 0, chat: 0, doc: 0 });
                  res.end();
                })
              })
            }
          }).catch(err => {
            res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
            console.error(err);
            res.end();
          });
        }
      }
    })
  })
})


router.get("/category/:Category", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  var query = url.parse(req.url, true).query;
  if (query.city == "all") {
    qcity = { $regex: '.*' }
  }
  else {
    qcity = query.city;
  }
  Doctors = [];
  MongoClient.connect(dburl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.collection("Doctors").find({ categories: req.params.Category.split('-').join(' '), city: qcity,archived:false }).forEach(function (doc, err) {
      Doctors.push(doc);
    }, function () {
      if (req.cookies.usertoken == undefined) {
        categories().then(basiccategories => {
          res.render("index.ejs", { Objects: Doctors, type: "doc", category: req.params.Category, user: "", categories: basiccategories });
          res.end();
          db.close();
        })
      }
      else {
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, result) {
          if (err) throw err;
          if (result == null) {
            res.clearCookie('usertoken');
            res.redirect('/category//' + req.params.Category);
          }
          categories().then(basiccategories => {
            res.render('index.ejs', { Objects: Doctors, type: "doc", category: req.params.Category.split(' ').join('-'), user: result, categories: basiccategories });
            res.end();
            db.close();
          })
        })
      }
    })
  })
})

router.get("/category/:Category/:Doctor", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.collection("Doctors").findOne({ name: req.params.Doctor.split('-').join(' ') ,archived:false }, function (err, result) {
      if(result==null){
        res.redirect("/");
        db.close();
      }
      else{
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            categories().then(basiccategories => {
              res.render("doctorpage.ejs", { doctor: result, categories: basiccategories, user: "" });
              db.close();
              res.end();
            })
          }
          else {
            categories().then(basiccategories => {
              res.render("doctorpage.ejs", { doctor: result, categories: basiccategories, user: user });
              db.close();
              res.end();
            })
          }
        })
      }
    })
  })
})

router.get("/reserve/:Doctor", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    days = [];
    freetimes = []
    dbo.collection("Doctors").findOne({ name: req.params.Doctor.split('-').join(' '), archived:false }, function (err, result) {
      if (result == null) {
        db.close();
        res.redirect('/');
      }
      else {
        currentday = new persianDate();
        days.push(currentday);
        freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 1));
        for (let i = 0; i < 14; i++) {
          currentday = currentday.add("d", 1);
          days.push(currentday);
          freetimes.push(getDoctimeslots(result, new myDate(currentday.toArray()[2], currentday.toArray()[1], currentday.toArray()[0]), 0));
        }
        categories().then(basiccategories => {
          res.render("reserve.ejs", { doctor: result, days: createDayboxobj(days), freetimes: freetimes, categories: basiccategories });
          db.close();
          res.end();
        })
      }
    })
  })
})

router.get("/telereserve/:Doctor", function (req, res) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    days = [];
    freetimes = []
    dbo.collection("Doctors").findOne({ name: req.params.Doctor.split('-').join(' ') ,archived:false}, function (err, result) {
      if (result == null) {
        db.close();
        res.redirect('/');
      }
      else {
        currentday = new persianDate();
        days.push(currentday);
        for (let i = 0; i < 14; i++) {
          currentday = currentday.add("d", 1);
          days.push(currentday);
        }
        myteletimes = { '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [] }
        result.teletimes.forEach(function (doc) {
          switch (Number(doc[0])) {
            case 0:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['0'].push(obj)
              break;
            case 1:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['1'].push(obj)
              break;
            case 2:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['2'].push(obj)
              break;
            case 3:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['3'].push(obj)
              break;
            case 4:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['4'].push(obj)
              break;
            case 5:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['5'].push(obj)
              break;
            case 6:
              arr = doc.split("-");
              obj = { start: arr[1], end: arr[2] }
              myteletimes['6'].push(obj)
              break;
            default:
              break;
          }
        })
        categories().then(basiccategories => {
          res.render("telereserve.ejs", { doctor: result, days: createDayboxobj(days), teletimes: myteletimes, categories: basiccategories });
          db.close();
          res.end();
        })
      }
    })
  })
})


router.post("/payment", function (req, res) {
  var query = url.parse(req.url, true).query;
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  if (req.cookies.usertoken == undefined) {
    res.redirect("/signup" + "?from=" + query.from);
    res.end();
  }
  else {
    if (req.body.choice == undefined) {
      res.redirect("back")
      res.end();
    }
    else {
      MongoClient.connect(dburl, function (err, db) {
        var dbo = db.db("mydb");
        dbo.collection("Users").findOne({ token: req.cookies.usertoken }, function (err, user) {
          if (user == null) {
            res.redirect("/signup" + "?from=" + query.from);
            db.close();
            res.end();
          }
          else {
            if (checkinterval(1)) {
              dbo.collection("Doctors").findOne({ name: req.body.doctor }, function (err, doctor) {
                if (doctor == null) {
                  db.close();
                  res.redirect("/noaccess");
                }
                else {
                  reservedata = req.body.choice.split(":");
                  date = new myDate(Number(reservedata[4]), Number(reservedata[3]), Number(reservedata[2]));
                  console.log(date);
                  start = { hour: Number(reservedata[0]), min: Number(reservedata[1]) };
                  temp = (start.hour * 60) + start.min + doctor.visitduration;
                  end = { hour: Math.floor(temp / 60), min: temp % 60 }
                  unavb = { start: start, end: end, date: date, dayofweek: new persianDate([Number(reservedata[2]), Number(reservedata[3]), Number(reservedata[4])]).format("dddd") };
                  zarinpal.PaymentRequest({
                    Amount: req.body.cost, // In Tomans
                    CallbackURL: 'http://reservation.drtajviz.com/paymenthandler',
                    Description: 'Dr tajviz payment',
                    Email: 'shayanthrn@gmail.com',
                    Mobile: user.phonenumber
                  }).then(response => {
                    if (response.status === 100) {
                      reservation = new Reservation(user._id, doctor._id, unavb, response.authority, req.body.cost);
                      addtransaction(user._id, req.body.cost, response.authority);
                      dbo.collection("TempReserves").insertOne(reservation, function (err, reserve) {
                        res.redirect(response.url)
                      })
                    }
                  }).catch(err => {
                    res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
                    console.error(err);
                    db.close();
                    res.end();
                  });
                }
              })
            }
          }
        })
      })
    }
  }
})


router.get("/paymenthandler", function (req, res) {
  var query = url.parse(req.url, true).query;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("TempReserves").findOne({ authority: query.Authority }, function (err, reserve) {
      if (reserve == null) {
        db.close();
        res.redirect("/paymentaccept2")
      }
      else {
        if (query.Status == "NOK") {
          strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
          dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
            dbo.collection("TempReserves").deleteOne({ authority: query.Authority }, function (err, result) {
              changestatustransaction(query.Authority, "ناموفق");
              res.render("paymentfail.ejs", { doctor: doctor, time: strtime, resid: 0, chat: 0, doc: 1 });
              db.close();
              res.end();
            })
          })
        }
        else {
          zarinpal.PaymentVerification({
            Amount: reserve.cost, // In Tomans
            Authority: reserve.authority,
          }).then(response => {
            if (response.status === 100 && response.RefID != 0) {
              var reservation = reserve;
              reservation.refid = response.RefID;
              dbo.collection("Reservations").insertOne(reservation, function (err, result234) {
                dbo.collection("TempReserves").deleteOne({ authority: query.Authority }, function (err, aa) {
                  dbo.collection("Doctors").updateOne({ _id: reservation.doctor }, { $addToSet: { reservations: reservation, unavailabletimes: reservation.time } }, function (err, ss) {
                    dbo.collection("Users").updateOne({ _id: reservation.user }, { $addToSet: { reserves: reservation } }, function (err, ad) {
                      strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
                      dbo.collection("Doctors").findOne({ _id: reservation.doctor }, async function (err, doctor) {
                        changestatustransaction(query.Authority, "موفق");
                        res.render("paymentaccept.ejs", { doctor: doctor, time: strtime, resid: reservation.refid, chat: 0, doc: 1 });
                        sendSMS("reserveACK", reservation.user, "Users", reservation.refid, doctor.name, new persianDate([reservation.time.date.year, reservation.time.date.month, reservation.time.date.day]).format("L"))
                        username = await dbo.collection("Users").findOne({ _id: reservation.user })
                        sendSMS("reserveACKdoc", reservation.doctor, "Doctors", reservation.refid, username.firstname + " " + username.lastname, new persianDate([reservation.time.date.year, reservation.time.date.month, reservation.time.date.day]).format("L"))
                        res.end();
                      })
                    })
                  })
                })
              })
            } else {
              strtime = n(reserve.time.start.hour) + ":" + n(reserve.time.start.min) + "-" + n(reserve.time.end.hour) + ":" + n(reserve.time.end.min);
              dbo.collection("Doctors").findOne({ _id: reserve.doctor }, function (err, doctor) {
                dbo.collection("TempReserves").deleteOne({ authority: query.Authority }, function (err, result) {
                  changestatustransaction(query.Authority, "ناموفق");
                  res.render("paymentfail.ejs", { doctor: doctor, time: strtime, resid: 0, chat: 0, doc: 1 });
                  res.end();
                })
              })
            }
          }).catch(err => {
            res.write("<html><body><p>there is a problem on server please try again later</p><a href='/' >go back to main page</a></body></html>");
            console.error(err);
            res.end();
          });
        }
      }
    })
  })
})

router.get("/doctorsignup", function (req, res) {
  categories().then(basiccategories => {
    res.render("doctorsignup.ejs", { categories: basiccategories });
    res.end();
  })
})

router.post("/doctorsignup", function (req, res) {
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Doctors").findOne({ name: req.body.name }, function (err, res1) {
      if (res1 != null) {
        db.close();
        res.redirect('/Adminpanel/addDoctor-duplicatedname')
      }
      else {
        dbo.collection("Doctors").findOne({ username: req.body.username },async function (err, res2) {
          if (res2 != null) {
            db.close();
            res.redirect('/Adminpanel/addDoctor-duplicatedusername')
          }
          else {
            var cats = [];
            var memtype = [];
            if (typeof req.body.categories == "string") {
              cats.push(req.body.categories);
            }
            else {
              req.body.categories.forEach(function (doc) {
                cats.push(doc);
              })
            }
            if (typeof req.body.membershiptypes == "string") {
              memtype.push(req.body.membershiptypes)
            }
            else {
              req.body.membershiptypes.forEach(function (doc2) {
                memtype.push(doc2);
              })
            }
            unhashed = req.body.pass;
            req.body.pass = md5(req.body.pass)
            mydoc=new Doctor(req.body.username, req.body.pass, req.body.name, cats, req.body.medicalnumber, req.body.codemeli, req.body.workphone, req.body.phonenumber, req.body.address, req.body.city, "/docphotos/" + req.body.name.trim() + ".png", req.body.background, req.body.description, memtype, req.body.appknowledge)
            costs=await dbo.collection("costs").findOne({})
            mydoc.visitcost=costs.docrescost;
            mydoc.televisitcost=costs.doctelcost;
            mydoc.chatcost=costs.docchatcost;
            dbo.collection('tempDoctors').insertOne(mydoc, function (err, res2) {
              //sendSMS("docsignup",res2.insertedId,"Doctors",req.body.username,unhashed,null);
              if (req.files != null) {
                mv(req.files.image.tempFilePath, "public/docphotos-temp/" + req.body.name.trim() + ".png", function (err) {
                  console.log("public/docphotos/" + req.body.name + ".png")
                })
              }
              db.close();
              res.redirect('/Adminpanel/addDoctor-success');
            })
          }
        })
      }
    })
  })
})

router.get("/labsignup", function (req, res) {
  res.render("labsignup.ejs", { flag: 1 });
  res.end();
})

router.get("/clinicsignup", function (req, res) {
  res.render("clinicsignup.ejs", { flag: 1 });
  res.end();
})

router.get("/pharmacysignup", function (req, res) {
  res.render("pharmacysignup.ejs", { flag: 1 });
  res.end();
})

router.post("/addHC2", function (req, res) {
  var query = url.parse(req.url, true).query;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    MongoClient.connect(dburl, function (err, db) {
      var dbo = db.db("mydb");
      dbo.collection("HealthCenters").findOne({ name: req.body.name }, function (err, hc) {
        if (hc != null) {
          res.json({ data: "there is a healthcenter with this name" });
          res.end();
        }
        else {
          dbo.collection("HealthCenters").findOne({ username: req.body.username }, function (err, hc2) {
            if (hc2 != null) {
              res.json({ data: "there is a healthcenter with this username" });
              res.end();
            }
            else {
              dbo.collection("HCtypes").findOne({ name: query.type },async function (err, type) {
                var img = "/" + query.type + "photos/" + req.body.name + ".png";
                var imgtemp = "/" + query.type + "photos-temp/" + req.body.name + ".png";
                unhashed = req.body.password;
                req.body.password = md5(req.body.password);
                costs=await dbo.collection("costs").findOne({});
                var newHC = new HealthCenter(query.type, type.systype, req.body.name, type.systype == "B" || type.systype == "A", req.body.codemeli, req.body.codeofHC, req.body.city, req.body.phonenumber, req.body.address, req.body.directphonenumber, req.body.background, req.body.medicalnumber, req.body.appknowledge, req.body.username, req.body.password, img,costs);
                try {
                  mv(req.files.image.tempFilePath, "public" + imgtemp, { mkdirp: true }, function (err) {
                    console.log("image added");
                  });
                } catch (error) {
                  console.log("no image");
                }
                dbo.collection("tempHealthCenters").insertOne(newHC,async function (err, result) {
                  //sendSMS("HCsignup",result.insertedId,"HealthCenters",req.body.username,unhashed,null);
                  if (type.systype == "A") {
                    var cats = []
                    if (typeof req.body.categories == "string") {
                      cats.push(req.body.categories);
                    }
                    else {
                      if (req.body.categories == undefined || req.body.categories == null) {
                        cats = [];
                      }
                      else {
                        cats = req.body.categories;
                      }
                    }
                    costs=await dbo.collection("costs").findOne({});
                    cats.forEach(function (doc) {
                      var newcat = { name: doc, unavailabletimes: [], reservations: [], visitduration: 30, visitcost: costs.clinicrescost };
                      dbo.collection("tempHealthCenters").updateOne({ name: req.body.name }, { $addToSet: { categories: newcat } }, function (err, result) {
                        console.log("cats added");
                      })
                    })
                  }
                  res.redirect("/")
                })
              })
            }
          })
        }
      })
    })
  })
})

router.get("/signup", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  var query = url.parse(req.url, true).query;
  req.session.gobackafterlogin = query.from;
  console.log(req.session)
  res.render('signup.ejs', { data: "" });
  res.end();
})


router.post('/signup', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  request({
    url: "https://www.google.com/recaptcha/api/siteverify?secret=6Lce7sgZAAAAABlVY5VbfAHr589PRWY-ZgtPRXt9&response=" + req.body["g-recaptcha-response"],
    method: "POST",
    json: true,   // <--Very important!!!
    body: {
      response: req.body.captcha,
      secret: "6Lce7sgZAAAAABlVY5VbfAHr589PRWY-ZgtPRXt9"
    }
  }, (error, response, body) => {
    if (error) {
      console.error(error)
      return
    }
    if (response.body.success == false) {
      res.redirect("/youarearobot");
      res.end();
    }
    else if (response.body.success == true) {
      console.log("success in captcha")
      if (req.body.rules == 'on' && req.body.phonenumber != undefined) {
        MongoClient.connect(dburl, function (err, db) {
          if (err) throw err;
          var dbo = db.db("mydb");
          var verifycode = Math.floor(Math.random() * (99999 - 10000) + 10000);
          verifycode = verifycode.toString();
          apikave.VerifyLookup({
            token: verifycode,
            template: "reservation",
            receptor: req.body.phonenumber
          },
            function (response, status) {
              console.log(response);
              console.log(status);
              if (status == 200) {
                dbo.collection("signupcode").updateOne({ phonenumber: req.body.phonenumber }, { $set: { code: verifycode, phonenumber: req.body.phonenumber, date: new Date().getTime() } }, { upsert: true }, function (err, result) {
                  res.render("verify.ejs", { phonenumber: req.body.phonenumber, text: "" });
                  db.close();
                  res.end();
                })
              }
              else {
                res.write("<html><body><p>there is a problem on server please try again later</p></body></html>");
                db.close();
                res.end();
              }
            });
        });
      }
      else {
        res.render('signup.ejs', { data: "قوانین بررسی نشده است" });
        res.end();
      }
    }
  })
})


router.post("/verifynumber", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("signupcode").findOne({ phonenumber: req.body.phonenumber }, function (err, result) {
      var now = new Date().getTime();
      if (now - result.date < 120000) {
        if (req.body.code == result.code) {
          dbo.collection("signupcode").deleteOne({ phonenumber: req.body.phonenumber }, function (err, result3) {
            dbo.collection("Users").findOne({ phonenumber: req.body.phonenumber }, function (err, result4) {
              if (result4 == null) {
                var user = new User(req.body.phonenumber);
                dbo.collection('Users').insertOne(user, function (err, result6) {
                  res.render('submitinfo.ejs', { phonenumber: req.body.phonenumber });
                  db.close();
                  res.end();
                })
              }
              else {
                if (result4 != "") {
                  res.cookie('usertoken', result4.token);
                  db.close();
                  res.redirect(req.session.gobackafterlogin)
                }
                else {
                  let token1 = tokgen.generate();
                  res.cookie('usertoken', token1);
                  dbo.collection("Users").updateOne({ phonenumber: req.body.phonenumber }, { $set: { token: token1 } }, function (err, result5) {
                    db.close();
                    res.redirect(req.session.gobackafterlogin);
                  })
                }
              }
            })
          })
        }
        else {
          res.render("verify.ejs", { phonenumber: req.body.phonenumber, text: "کد وارد شده معتبر نیست" });
          db.close();
          res.end();
        }
      }
      else {
        dbo.collection("signupcode").deleteOne({ phonenumber: req.body.phonenumber }, function (err, result2) {
          res.render('signup.ejs', { data: "کد منقضی شده است" })
          res.end();
        })
      }
    })
  })
})

router.post('/submitinfo', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    var bdate = {
      year: req.body.birthdate.split('/')[0],
      month: req.body.birthdate.split('/')[1],
      day: req.body.birthdate.split('/')[2]
    }
    let token1 = tokgen.generate();
    res.cookie('usertoken', token1);
    dbo.collection("Users").updateOne({ phonenumber: req.body.phonenumber }, { $set: { sex: req.body.sex, firstname: req.body.firstname, lastname: req.body.lastname, birthdate: bdate, token: token1 } }, function (err, result) {
      db.close();
      res.redirect('/');
    })
  })
})


router.get('/loginDoc', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  res.render('logindoctor.ejs', { wrongflag: 0 });
  res.end();
});

router.post('/loginDoc', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Doctors").findOne({ username: req.body.username }, function (err, doctor) {
      if (doctor == null) {
        res.render('logindoctor.ejs', { wrongflag: 1 });
        db.close();
        res.end();
      }
      else {
        if (req.body.pass != doctor.password) {
          res.render('logindoctor.ejs', { wrongflag: 1 });
          db.close();
          res.end();
        }
        else {
          let mytoken;
          if (doctor.token == "") {
            mytoken = tokgen.generate();
          }
          else {
            mytoken = doctor.token;
          }
          dbo.collection("Doctors").updateOne({ username: req.body.username }, { $set: { token: mytoken } }, function (err, result2) {
            res.cookie('doctortoken', mytoken);
            db.close();
            res.redirect('/Doctorpanel/dashboard');
          })
        }
      }
    })
  })
})

router.get('/loginHC', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  res.render('loginHC.ejs', { wrongflag: 0 });
  res.end();
});

router.post('/loginHC', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("HealthCenters").findOne({ username: req.body.username }, function (err, HC) {
      if (HC == null) {
        res.render('loginHC.ejs', { wrongflag: 1 });
        db.close();
        res.end();
      }
      else {
        if (req.body.pass != HC.password) {
          res.render('loginHC.ejs', { wrongflag: 1 });
          db.close();
          res.end();
        }
        else {
          let mytoken;
          if (HC.token == "") {
            mytoken = tokgen.generate();
          }
          else {
            mytoken = HC.token;
          }
          dbo.collection("HealthCenters").updateOne({ username: req.body.username }, { $set: { token: mytoken } }, function (err, result2) {
            res.cookie('HCtoken', mytoken);
            db.close();
            res.redirect('/HCpanel/dashboard');
          })
        }
      }
    })
  })
})

router.get("/loginAdmin", function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  res.render('AdminPanel/loginadmin.ejs', { wrongflag: 0 });
  res.end();
})

router.post('/loginAdmin', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Admins").findOne({ username: req.body.username }, function (err, result) {
      if (result == null) {
        res.render('AdminPanel/loginadmin.ejs', { wrongflag: 1 });
        db.close();
        res.end();
      }
      else {
        if (req.body.pass != result.password) {
          res.render('AdminPanel/loginadmin.ejs', { wrongflag: 1 });
          db.close();
          res.end();
        }
        else {
          let mytoken;
          if (result.token == "") {
            mytoken = tokgen.generate();
          }
          else {
            mytoken = result.token;
          }
          dbo.collection("Admins").updateOne({ username: req.body.username }, { $set: { token: mytoken } }, function (err, result2) {
            res.cookie('admintoken', mytoken);
            db.close();
            res.redirect('/AdminPanel/dashboard');
          })
        }
      }
    })
  })
})

router.get("/index",function(req,res){
  categories().then(basiccategories=>{
    res.render("index2.ejs",{categories:basiccategories,user:""});
    res.end();
  })
  
})

router.get('/exit', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    res.clearCookie('usertoken');
    res.clearCookie('doctortoken');
    res.clearCookie('admintoken');
    res.clearCookie('HCtoken');
    db.close();
    res.redirect('/');
    res.end();
  })
})


router.get('*', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  categories().then(basiccategories => {
    res.render("404.ejs", { categories: basiccategories, user: "" });
    res.statusCode = 404;
    res.end();
  })
});

router.post('*', function (req, res) {
  req.session.prevurl = req.session.currurl;
  req.session.currurl = req.url;
  categories().then(basiccategories => {
    res.render("404.ejs", { categories: basiccategories, user: "" });
    res.statusCode = 404;
    res.end();
  })
});

module.exports = router;
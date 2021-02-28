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
var Doctor = require('/coreapp/Doctor.js');
var Chat = require('/coreapp/Chat.js');
var User = require('/coreapp/User.js');
var Reservation = require('../coreapp/Reservation.js');
var ReservationHC = require('../coreapp/ReservationHC.js');
var teleReservation = require('../coreapp/teleReservation.js');
var Category = require('../coreapp/Category.js');
var Transaction = require('../coreapp/Transaction.js');
var dburl = "mongodb://localhost:27017/";          //url of database            auth o doros kon 
var lodash = require('lodash');
var HealthCenter = require('../coreapp/HealthCenter.js');
var Comment = require("../coreapp/Comment.js")
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


var dburl = "mongodb://localhost:27017/";

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
              token20: token3,
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
              token20: token3,
              template: template,
              receptor: obj.workphone
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
              token10: token2,
              token20: token3,
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

MongoClient.connect(dburl, function (err, db) {
    var dbo = db.db("mydb");
    dbo.collection("Doctors").findOne({ name: "shayan" },async function (err, doctor) {
            muser = dbo.collection("Users").findOne({ phonenumber: "09128993687" })
            sendSMS("chatdoc", doctor._id, "Doctors", "!23", muser.firstname + " " + muser.lastname);
            sendSMS("chatuser", muser._id, "Users","123", doctor.name)
            res.end();
    })
})
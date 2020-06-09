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
var User = require('../coreapp/User.js');
var Reservation = require('../coreapp/Reservation.js');
var Category = require('../coreapp/Category.js');
var dburl="mongodb://localhost:27017/";          //url of database            auth o doros kon 
var lodash =require('lodash');
var time=require('../coreapp/resTime.js');
var persianDate = require('persian-date');
var myDate= require('../coreapp/myDate.js');


//-----------------------test route--------------------------//




router.get("/test1",function(req,res){
  a=new persianDate();
  for(let i=0;i<5;i++){
    a=a.add("d",1);
    console.log(a.toArray());
  }
  res.json({data:a.toArray()});
})



//-----------------------test route--------------------------//

//-----------------------functions--------------------------//


function createinterval(start,end){
  st={hour:Math.floor(start/60),min:start%60};
  en={hour:Math.floor(end/60),min:end%60};
  return {start:st,end:en};
}


function getDoctimeslots(doctor,date){
  duration=doctor.visitduration;
  unavb=doctor.unavailabletimes;
  dayofweek=new persianDate([date.year,date.month,date.day]).format('dddd');
  mintime=0;
  timeslots=[];
  while(mintime+duration<=1440){
    interval=createinterval(mintime,mintime+duration);
    mintime+=duration;
    timeslots.push(interval);
  }
  for(let i=0;i<unavb.length;i++){
    if(lodash.isEqual(unavb[i].date,date)||(unavb[i].date=="*"&&dayofweek==unavb[i].dayofweek)||(unavb[i].dayofweek=="*")){
      lodash.remove(timeslots,function(slot){
        slotstart=slot.start.min + (slot.start.hour*60);
        slotend=slot.end.min + (slot.end.hour*60);
        unavbstart=unavb[i].start.min + (unavb[i].start.hour*60);
        unavbend=unavb[i].end.min + (unavb[i].end.hour*60);
        if(unavbstart<slotend && unavbstart>slotstart){
          return true;
        }
        if(unavbend<slotend && unavbend>slotstart){
          return true;
        }
        if(unavbstart<slotstart&&unavbend>slotend){
          return true;
        }
        return false;
      });
    }
  }
  return timeslots;
}


function createDayboxobj(days){
  result=[];
  for(let i=0;i<days.length;i++){
    result.push({
      dayofweek:days[i].format("dddd"),
      day:days[i].toArray()[2],
      month:days[i].format("MMMM"),
      index:i
    })
  }
  return result;
}

//-----------------------functions--------------------------//

router.get("/",function(req,res){
  Categories = [];
  MongoClient.connect(dburl,function(err,db){
    if (err) throw err;
    var dbo=db.db("mydb");
    dbo.collection("Categories").find().forEach(function(doc,err){
      Categories.push(doc);
    },function(){
      if(req.cookies.usertoken==undefined){
        res.render('index.ejs',{Objects:Categories,type:"category",category:"",user:""});
        res.end();
        db.close();
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,result){
          if(err) throw err;
          if(result==null){
            res.clearCookie('usertoken');
            res.redirect('/');
          }
          res.render('index.ejs',{Objects:Categories,type:"category",category:"",user:result});
          res.end();
          db.close();
        })
      }
    })
  })
})

router.get("/c//:Category",function(req,res){
  Doctors = [];
  MongoClient.connect(dburl,function(err,db){
    if(err) throw err;
    var dbo= db.db("mydb");
    dbo.collection("Doctors").find({category:req.params.Category}).forEach(function(doc,err){
      Doctors.push(doc);
    },function(){
      if(req.cookies.usertoken==undefined){
        res.render("index.ejs",{Objects:Doctors,type:"doc",category:req.params.Category,user:""});
        res.end();
        db.close();
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,result){
          if(err) throw err;
          if(result==null){
            res.clearCookie('usertoken');
            res.redirect('/c//'+req.params.Category);
          }
          res.render('index.ejs',{Objects:Doctors,type:"doc",category:req.params.Category,user:result});
          res.end();
          db.close();
        })
      }
    })
  })
})

router.get("/reserve/:Doctor",function(req,res){
  MongoClient.connect(dburl,function(err,db){
    if(err) throw err;
    var dbo=db.db("mydb");
    days=[];
    freetimes=[]
    dbo.collection("Doctors").findOne({name:req.params.Doctor},function(err,result){
      currentday=new persianDate();
      days.push(currentday);
      freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      for(let i=0;i<14;i++){
        currentday=currentday.add("d",1);
        days.push(currentday);
        freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      }
      console.log(freetimes);
      res.render("reserve.ejs",{doctor:result,days:createDayboxobj(days),freetimes:freetimes});
      res.end();
    })
  })
})

router.get("/c/:Category/:Doctor",function(req,res){ 
  MongoClient.connect(dburl,function(err,db){
    if (err) throw err;
    var dbo=db.db("mydb");
    dbo.collection("Doctors").findOne({name:req.params.Doctor},function(err,result){
      res.render("doctorpage.ejs",{doctor:result});
      res.end();
    })
  })
})


router.get("/paymenthandler",function(req,res){
  if(req.cookies.usertoken==undefined){
    res.redirect("/");
    res.end();
  }
  else{
  var query = url.parse(req.url,true).query;
  var flag=0;
  var time={date:{day:query.day,month:query.month,year:query.year},
            hour:Number(query.hour),
            min:Number(query.min)
           }
  MongoClient.connect(dburl,function(err,db){
    var dbo= db.db("mydb");
    dbo.collection("Doctors").findOne({name:query.doctor},function(err,result){
      flag=checktime(result.unavailabletimes,time,result.visitduration);
      if(flag==0){
        res.render("reserve.ejs",{doctor:result})
        res.end();
      }
      else{
        //
        var paymentack=1;
        /*



        payment



        */
        if(paymentack==0){
          strtime=query.hour +":"+ query.min;
          res.render("paymentfail.ejs",{doctor:result,time:strtime});
        }
        else{
          unavb={start:{hour:Number(query.hour),min:Number(query.min)},end:{hour:time.hour,min:time.min},date:time.date};
          time={date:{day:query.day,month:query.month,year:query.year},
            hour:Number(query.hour),
            min:Number(query.min)
           }
          dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
            reservation = new Reservation(user._id,result._id,time)
            dbo.collection("Reservations").insertOne(reservation,function(err,result2){
              dbo.collection("Doctors").updateOne({name:query.doctor},{$addToSet:{reservations:reservation,unavailabletimes:unavb}},function(err,result3){
                dbo.collection("Users").updateOne({username:user.username},{$addToSet:{reserves:reservation}},function(err,result4){
                  strtime=query.hour +":"+ query.min;
                  res.render("paymentaccept.ejs",{doctor:result,time:strtime,resid:reservation._id});
                })
              })
            })
          })
        }
      }
    })
  })
  }
})


router.get('/register',function(req,res){       //register 
  var query = url.parse(req.url,true).query;
  if(query.username==undefined&&query.pass==undefined){
    res.render('register.ejs');
    res.end();
  }
  else{
    if(query.rules=='on'&&query.username!=""&&query.pass!=""){
      let newuser=new User(query.username,query.pass,"empty","empty","user");
      let token=tokgen.generate();
      newuser.token=token;
      res.cookie('usertoken',newuser.token);
      MongoClient.connect(dburl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("Users").insertOne(newuser, function(err, res) {
          if (err) throw err;
          console.log("user :"+newuser.username+" inserted");
          db.close();
        });
      });
      res.redirect('/welcome');
      res.end();
    }
    else{
      res.redirect('/register');
      res.end();
    }
  }
})

router.get('/welcome',function(req,res){
  res.render('welcome.ejs');
  res.end();
})

router.get('/submitinfo',function(req,res){
  var query = url.parse(req.url,true).query;
    if(query.firstname==undefined){
      res.render('submitinfo.ejs');
      res.end();
    }
    else{
      MongoClient.connect(dburl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var newvalues = { $set: {firstname: query.firstname, lastname: query.lastname,codemeli: query.codemeli,phone: query.phonenumber,creditcardnumber: query.creditcardnumber,email: query.email } };
        dbo.collection("Users").updateOne({token:req.cookies.usertoken},newvalues, function(err, res) {
          if (err) throw err;
          db.close();
        });
      });
      res.redirect('/');
      res.end();
    }
})



router.get('/login',function(req,res){   // login page
  var query = url.parse(req.url,true).query;
  if(query.username==undefined){
    res.render('login.ejs',{wrongflag:0});
    res.end();
  }
  else{
    MongoClient.connect(dburl, function(err, db) {
      if (err) throw err;
      var dbo = db.db("mydb");
      dbo.collection("Users").findOne({username:query.username}, function(err, result) {
        if (err) throw err;
        if(result==null){
          res.render("login.ejs",{wrongflag:1});
          res.end();
        }
        else{
          if(query.pass!=result.pass){
            res.render("login.ejs",{wrongflag:1});
            res.end();
         }
         else{
           MongoClient.connect(dburl,function(err,db){
             if(err) throw err;
             dbo = db.db("mydb");
             let token1=tokgen.generate();
              dbo.collection("Users").updateOne({username:query.username},{ $set : {token:token1}},function(err,result2){
              if(err) throw err;
              res.cookie('usertoken',token1);
              res.redirect("/");
            })
           })
          }
        }
      });
    });
  }
})




router.get('/exit',function(req,res){
  res.clearCookie('usertoken');
  res.redirect('/');
  res.end();
})


router.get('*',function(req,res){        // 404 page should be displayed here// should be at the end
  res.render("404.ejs");
  res.end();
});

module.exports = router;
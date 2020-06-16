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
var Kavenegar = require('kavenegar');
var api = Kavenegar.KavenegarApi({
  apikey:"534438436D6364307552744278336A334B694F46343179417642536E66686568"
  });
var md5 = require('md5');
const { each } = require('lodash');




//--------------------------api---------------------------//



















//------------------------api------------------------------//
router.post("/changedocinfo",function(req,res){
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$set:{category:req.body.major,background:req.body.experience,address:req.body.address,phonenumber:req.body.phone,visitduration:Number(req.body.duration),visitcost:Number(req.body.cost),description:req.body.description}},function(err,res2){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"D://web developing/reservation/public"+result.image,function(err){
  
              })
            }
            res.redirect('/doctorpanel/profile');
          })
        }
      })
    })
  }
})






//-----------------------test route--------------------------//





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
    temp=new myDate(unavb[i].date.day,unavb[i].date.month,unavb[i].date.year);
    if(lodash.isEqual(temp,date)||(unavb[i].date=="*"&&dayofweek==unavb[i].dayofweek)||(unavb[i].dayofweek=="*")){
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
        if(unavbstart==slotstart&&unavbend==slotend){
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
      monthnum:days[i].toArray()[1],
      year:days[i].toArray()[0],
      index:i
    })
  }
  return result;
}

//-----------------------functions--------------------------//





//-----------------------Doctorpanel---------------------------//

router.get('/doctorpanel/dashboard',function(req,res){
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          var visittimes=[];
          var currentday=new persianDate();
          visittimes.push({date1:{year:currentday.toArray()[0],month:currentday.format("MMMM"),day:currentday.toArray()[2]},date:{year:currentday.toArray()[0],month:currentday.toArray()[1],day:currentday.toArray()[2]},times:[],dayofweek:currentday.format("dddd")});
          for(let i=0;i<5;i++){
            currentday=currentday.add('d',1);
            visittimes.push({date1:{year:currentday.toArray()[0],month:currentday.format("MMMM"),day:currentday.toArray()[2]},date:{year:currentday.toArray()[0],month:currentday.toArray()[1],day:currentday.toArray()[2]},times:[],dayofweek:currentday.format("dddd")});
          }
          result.reservations.forEach(function(doc){
            for(i=0;i<6;i++){
              if(lodash.isEqual(visittimes[i].date,doc.time.date)){
                visittimes[i].times.push(doc);
              }
            }
          })
          res.render('DoctorPanel/dashboard.ejs',{visittimes:visittimes});
          res.end();
        }
      })
    })
  }
})

router.get('/doctorpanel/profile',function(req,res){
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          res.render('DoctorPanel/profile.ejs',{doctor:result});
          res.end();
        }
      })
    })
  }
})


router.get('/doctorpanel/patients',function(req,res){
  var patientsid=[];
  var patients=[];
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          for(var i=0;i<result.reservations.length;i++){
              patientsid.push(result.reservations[i].user);
          }
          dbo.collection("Users").find({_id: { $in : patientsid }},function(err,result2){
            result2.forEach(function(doc){
              patients.push(doc);
            },function(){
              console.log(patients);
              res.render('DoctorPanel/patients.ejs',{patients:patients});
              res.end();
            })
          })
        }
      })
    })
  }
})

router.get('/doctorpanel/visittimes',function(req,res){
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          res.render('DoctorPanel/addunavb.ejs');
          res.end();
        }
      })
    })
  }
})

router.get('/doctorpanel/systemicinfo',function(req,res){
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          res.render('DoctorPanel/settings.ejs');
          res.end();
        }
      })
    })
  }
})

//------------------------Doctorpanel---------------------------//


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


router.post("/paymenthandler",function(req,res){
  if(req.cookies.usertoken==undefined){
    res.redirect("/");
    res.end();
  }
  else{
  if(req.body.choice==undefined){
    res.redirect("/");
    res.end();
  }
  reservedata=req.body.choice.split(":");
  MongoClient.connect(dburl,function(err,db){
    var dbo= db.db("mydb");
    dbo.collection("Doctors").findOne({name:req.body.doctor},function(err,result){
        date=new myDate(Number(reservedata[4]),Number(reservedata[3]),Number(reservedata[2]));
        start={hour:Number(reservedata[0]),min:Number(reservedata[1])};
        temp=(start.hour*60)+start.min+result.visitduration;
        end={hour:Math.floor(temp/60),min:temp%60}
        //
        var paymentack=1;
        /*

        payment

        */
        if(paymentack==0){
          strtime=reservedata[0]+":"+reservedata[1];
          res.render("paymentfail.ejs",{doctor:result,time:strtime});
        }
        else{
          unavb={start:start,end:end,date:date,dayofweek:new persianDate([Number(reservedata[2]),Number(reservedata[3]),Number(reservedata[4])]).format("dddd")};
          dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
            reservation = new Reservation(user._id,result._id,unavb)
            dbo.collection("Reservations").insertOne(reservation,function(err,result2){
              dbo.collection("Doctors").updateOne({name:req.body.doctor},{$addToSet:{reservations:reservation,unavailabletimes:unavb}},function(err,result3){
                dbo.collection("Users").updateOne({username:user.username},{$addToSet:{reserves:reservation}},function(err,result4){
                  strtime=reservedata[0]+":"+reservedata[1];
                  res.render("paymentaccept.ejs",{doctor:result,time:strtime,resid:reservation._id});
                })
              })
            })
          })
        }
    })
  })
  }
})
router.get("/register",function(req,res){
  res.render('register.ejs');
  res.end();
})

router.post('/register',function(req,res){       //register 
  if(req.body.username==undefined&&req.body.pass==undefined){
    res.render('register.ejs');
    res.end();
  }
  else{
    if(req.body.rules=='on'&&req.body.username!=""&&req.body.pass!=""){
      let newuser=new User(req.body.username,req.body.pass,"empty","empty","user");
      MongoClient.connect(dburl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("tempuser").insertOne(newuser, function(err, res) {
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
    res.render('submitinfo.ejs');
    res.end();
})

router.post('/submitinfo',function(req,res){
MongoClient.connect(dburl, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var verifycode=Math.floor(Math.random() * (99999 - 10000) + 10000);
   verifycode=verifycode.toString();
    api.VerifyLookup({
      token: verifycode,
      template : "reservation",
      receptor: req.body.phonenumber
    },
    function(response, status) {
      console.log(response);
      console.log(status);
      if(status==200){
        var newvalues = { $set: {firstname: req.body.firstname, lastname: req.body.lastname,codemeli: req.body.codemeli,phone: req.body.phonenumber,creditcardnumber: req.body.creditcardnumber,email: req.body.email,code:verifycode } };
        dbo.collection("tempuser").updateOne({},newvalues, function(err, result3) {
          if (err) throw err;
          db.close();
          res.redirect("/verifynumber");
          res.end();
        });
      }
      else{
        console.log(req.body.phonenumber);
        console.log(verifycode);
        // moshkeli dar ersal pish amade ast
      }
    });
  });
})

router.get("/verifynumber",function(req,res){
  res.render("verify.ejs");
  res.end();
})


router.post("/verifynumber",function(req,res){
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("tempuser").findOne({},function(err,result){
      if(req.body.code==result.code){
        let token=tokgen.generate();
        result.token=token;
        res.cookie('usertoken',token);
        dbo.collection("Users").insertOne(result,function(err,res2){
          dbo.collection("tempuser").drop();
          res.redirect("/");
        })
      }
      else{
          res.redirect("/verifynumber");
      }
    })
  })
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


router.get('/loginDoc',function(req,res){
  res.render('logindoctor.ejs',{wrongflag:0});
  res.end();
});

router.post('/loginDoc',function(req,res){
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Doctors").findOne({username:req.body.username},function(err,result){
      if(result==null){
        res.render('logindoctor.ejs',{wrongflag:1});
        res.end();
      }
      else{
        if(req.body.pass!=result.password){
          res.render('logindoctor.ejs',{wrongflag:1});
          res.end();
        }
        else{
          let mytoken=tokgen.generate();
          dbo.collection("Doctors").updateOne({username:req.body.username},{$set:{token:mytoken}},function(err,result2){
            res.cookie('doctortoken',mytoken);
            res.redirect('/Doctorpanel/dashboard');
          })
        }
      }
    })
  })
})


router.get('/exit',function(req,res){
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection('Users').updateOne({token:req.cookies.usertoken},{$set:{token:""}});
    res.clearCookie('usertoken');
    dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$set:{token:""}});
    res.clearCookie('doctortoken');
    res.redirect('/');
    res.end();
  })
})


router.get('*',function(req,res){        // 404 page should be displayed here// should be at the end
  res.render("404.ejs");
  res.end();
});

module.exports = router;
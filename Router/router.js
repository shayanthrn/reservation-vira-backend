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
var apikave = Kavenegar.KavenegarApi({
  apikey:"534438436D6364307552744278336A334B694F46343179417642536E66686568"
  });
var md5 = require('md5');
const { ObjectID } = require('mongodb');


var categories=[];
MongoClient.connect(dburl,function(err,db){
  var dbo=db.db("mydb");
  dbo.collection('Categories').find({}).forEach(function(doc){
    categories.push(doc);
  })
  db.close();
})




//--------------------------api---------------------------//

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
              mv(req.files.image.tempFilePath,"public"+result.image,function(err){
              })
            }
            res.redirect('/doctorpanel/profile');
          })
        }
      })
    })
  }
})

router.get("/addunavbeveryday",function(req,res){
  var query = url.parse(req.url,true).query;
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
          fromtime = {hour:Number(query.fromTime.split(":")[0]),min:Number(query.fromTime.split(":")[1])};
          totime= {hour:Number(query.toTime.split(":")[0]),min:Number(query.toTime.split(":")[1])};
          if(Number.isNaN(fromtime.hour)||Number.isNaN(fromtime.min)||Number.isNaN(totime.hour)||Number.isNaN(totime.min)){
            res.write("invalid");
            res.end();
          }
          else{
            if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}}}});
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:{hour:0,min:0},end:totime}}});
              res.redirect('/doctorpanel/visittimes');
            }
            else{
            dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:totime}}},function(result2){
              res.redirect('/doctorpanel/visittimes');
            })
            }
          }
        }
      })
    })
  }
})

router.get("/addunavbdayofweek",function(req,res){
  var query = url.parse(req.url,true).query;
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
          fromtime = {hour:Number(query.fromTime.split(":")[0]),min:Number(query.fromTime.split(":")[1])};
          totime= {hour:Number(query.toTime.split(":")[0]),min:Number(query.toTime.split(":")[1])};
          if(Number.isNaN(fromtime.hour)||Number.isNaN(fromtime.min)||Number.isNaN(totime.hour)||Number.isNaN(totime.min)){
            res.write("invalid");
            res.end();
          }
          else{
            if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}}}});
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:{hour:0,min:0},end:totime}}});
              res.redirect('/doctorpanel/visittimes');
            }
            else{
            dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime}}},function(result2){
              res.redirect('/doctorpanel/visittimes');
            })
            }
          }
        }
      })
    })
  }
})


router.get("/addunavb",function(req,res){
  var query = url.parse(req.url,true).query;
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
          fromtime = {hour:Number(query.fromTime.split(":")[0]),min:Number(query.fromTime.split(":")[1])};
          totime= {hour:Number(query.toTime.split(":")[0]),min:Number(query.toTime.split(":")[1])};
          if(Number.isNaN(fromtime.hour)||Number.isNaN(fromtime.min)||Number.isNaN(totime.hour)||Number.isNaN(totime.min)){
            res.write("invalid");
            res.end();
          }
          else{
            querydate=new persianDate(Number(query.datePicker));
            date=new myDate(querydate.toArray()[2],querydate.toArray()[1],querydate.toArray()[0]);
            if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:{hour:23,min:59}}}})
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:{hour:0,min:0},end:totime}}})
              res.redirect('/doctorpanel/visittimes');
            }
            else{
            dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:totime}}},function(result2){
              res.redirect('/doctorpanel/visittimes');
            })
            }
          }
        }
      })
    })
  }
})


router.post("/changepass",function(req,res){
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
          if(result.password==req.body.oldPassword){
              if(req.body.confirmPassword==req.body.newPassword){
                dbo.collection("Doctors").updateOne({token:req.cookies.doctortoken},{ $set:{password:req.body.newPassword}},function(err,result3){
                  res.redirect("/doctorpanel/systemicinfo");
                })
              }
              else{
                res.write("not confirmed");
                res.end();
              }
          }
          else{
            res.write("wrong pass");
            res.end();
          }
        }
      })
    })
  }
})


router.post("/addDoctor",function(req,res){
  if(req.cookies.admintoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Admins').findOne({token:req.cookies.admintoken},function(err,result){
        if(result==null){
          res.redirect('noaccess');
        }
        else{
          dbo.collection('Doctors').insertOne(new Doctor(req.body.username,req.body.pass,req.body.name,req.body.categories,req.body.medicalnumber,req.body.codemeli,req.body.workphone,req.body.phonenumber,req.body.address,req.body.city,"/docphotos/"+req.body.name+".png",req.body.background,req.body.description,req.body.membershiptypes,req.body.appknowledge),function(err,res2){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+res2.image,function(err){
                console.log("public"+res2.image)
              })
            }
            res.redirect('/'); //fixxxxxxxxxxxxxxxxxxxxxxxx
          })
        }
      })
    })
  }
})





//------------------------api------------------------------//






//-----------------------test route--------------------------//

router.get("/test",function(req,res){
  var query=url.parse(req.url,true).query;
  console.log(query);
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

function replaceALL(string,search,replace){
  return string.split(search).join(replace);
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


//------------------------adminpanel---------------------------//

router.get("/AdminPanel/users/:userid",function(req,res){
  userid=req.params.userid;
  userid=ObjectID(userid);
  if(req.cookies.doctortoken==undefined&&req.cookies.admintoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          dbo.collection('Admins').findOne({token:req.cookies.admintoken},function(err,result2){
            if(result2==null){
              res.redirect('noaccess');
            }
            else{
              dbo.collection("Users").findOne({_id:userid},function(err,result3){
                var promises=[];
                if(result3!=null){
                  result3.reserves.forEach(function(doc){
                   promises.push(dbo.collection("Doctors").findOne({_id:doc.doctor},{ projection: {name: 1} }));
                  });
                  Promise.all(promises).then(function(value){
                      res.render("AdminPanel/patients-profile.ejs",{user:result3,reservations:value});
                      res.end();
                  });
                }
                else{
                  res.redirect("/AdminPanel/users");
                }
              })
            }
          })
        }
        else{
          dbo.collection("Users").findOne({_id:userid},function(err,result3){
            var promises=[];
            if(result3!=null){
              result3.reserves.forEach(function(doc){
               promises.push(dbo.collection("Doctors").findOne({_id:doc.doctor},{ projection: {name: 1} }));
              });
              Promise.all(promises).then(function(value){
                  res.render("AdminPanel/patients-profile.ejs",{user:result3,reservations:value});
                  res.end();
              });
            }
            else{
              res.redirect("/AdminPanel/users");
            }
          })
        }
      })
    })
  }
})



router.get("/Adminpanel/reserves/:resid",function(req,res){
  resid=req.params.resid;
  resid=ObjectID(resid);
  if(req.cookies.doctortoken==undefined&&req.cookies.admintoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          dbo.collection('Admins').findOne({token:req.cookies.admintoken},function(err,result2){
            if(result2==null){
              res.redirect('noaccess');
            }
            else{
              res.render("AdminPanel/reserve-status.ejs");
            }
          })
        }
        else{
          res.render("AdminPanel/reserve-status.ejs");
        }
      })
    })
  }
})


router.get("/Adminpanel/addDoctor",function(req,res){
  if(req.cookies.admintoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        if(result==null){
          res.redirect('/noaccess');
        }
        else{
          res.render("AdminPanel/doctors-add.ejs",{categories:categories});
          res.end();
        }
      })
    })
  }
})

//------------------------adminpanel---------------------------//



router.get("/",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  Categories = [];
  MongoClient.connect(dburl,function(err,db){
    if (err) throw err;
    var dbo=db.db("mydb");
    dbo.collection("Categories").find().forEach(function(doc,err){
      Categories.push(doc);
    },function(){
      if(req.cookies.usertoken==undefined){
        res.render('index.ejs',{Objects:Categories,type:"category",category:"",user:"",categories:categories});
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
          res.render('index.ejs',{Objects:Categories,type:"category",category:"",user:result,categories:categories});
          res.end();
          db.close();
        })
      }
    })
  })
})

router.get("/category//:Category",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  Doctors = [];
  MongoClient.connect(dburl,function(err,db){
    if(err) throw err;
    var dbo= db.db("mydb");
    dbo.collection("Doctors").find({categories:req.params.Category.split('-').join(' ')}).forEach(function(doc,err){
      Doctors.push(doc);
    },function(){
      if(req.cookies.usertoken==undefined){
        res.render("index.ejs",{Objects:Doctors,type:"doc",category:req.params.Category,user:"",categories:categories});
        res.end();
        db.close();
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,result){
          if(err) throw err;
          if(result==null){
            res.clearCookie('usertoken');
            res.redirect('/category//'+req.params.Category);
          }
          res.render('index.ejs',{Objects:Doctors,type:"doc",category:req.params.Category.split(' ').join('-'),user:result,categories:categories});
          res.end();
          db.close();
        })
      }
    })
  })
})

router.get("/category/:Category/:Doctor",function(req,res){ 
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    if (err) throw err;
    var dbo=db.db("mydb");
    dbo.collection("Doctors").findOne({name:req.params.Doctor.split('-').join(' ')},function(err,result){
      res.render("doctorpage.ejs",{doctor:result,categories:categories,user:""});      //fix this
      res.end();
    })
  })
})

router.get("/reserve/:Doctor",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    if(err) throw err;
    var dbo=db.db("mydb");
    days=[];
    freetimes=[]
    dbo.collection("Doctors").findOne({name:req.params.Doctor.split('-').join(' ')},function(err,result){
      currentday=new persianDate();
      days.push(currentday);
      freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      for(let i=0;i<14;i++){
        currentday=currentday.add("d",1);
        days.push(currentday);
        freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      }
      res.render("reserve.ejs",{doctor:result,days:createDayboxobj(days),freetimes:freetimes,categories:categories});
      res.end();
    })
  })
})




router.post("/paymenthandler",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  if(req.cookies.usertoken==undefined){
    res.redirect("/signup");
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


router.get("/signup",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  req.session.gobackafterlogin=req.session.prevurl;
  console.log(req.session)
  res.render('signup.ejs',{data:""});
  res.end();
})

router.post('/signup',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  console.log(req.session)
    if(req.body.rules=='on'&&req.body.phonenumber!=undefined){
      MongoClient.connect(dburl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var verifycode=Math.floor(Math.random() * (99999 - 10000) + 10000);
        verifycode=verifycode.toString();
        apikave.VerifyLookup({
          token: verifycode,
          template : "reservation",
          receptor: req.body.phonenumber
        },
        function(response, status) {
          console.log(response);
          console.log(status);
          if(status==200){
            dbo.collection("signupcode").updateOne({phonenumber:req.body.phonenumber},{$set:{code:verifycode,phonenumber:req.body.phonenumber,date:new Date().getTime()}},{upsert:true},function(err,result){
                res.render("verify.ejs",{phonenumber:req.body.phonenumber,text:""});
                res.end();
            })
          }
          else{
            res.write("<html><body><p>there is a problem on server please try again later</p></body></html>");
            res.end();
          }
        });
      });
    }
    else{
      res.render('signup.ejs',{data:"قوانین بررسی نشده است"});
      res.end();
    }
})


router.post("/verifynumber",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("signupcode").findOne({phonenumber:req.body.phonenumber},function(err,result){
      var now=new Date().getTime();
      if(now-result.date<120000){
          if(req.body.code==result.code){
            dbo.collection("signupcode").deleteOne({phonenumber:req.body.phonenumber},function(err,result3){
              dbo.collection("Users").findOne({phonenumber:req.body.phonenumber},function(err,result4){
                if(result4==null){
                  var user=new User(req.body.phonenumber);
                  dbo.collection('Users').insertOne(user,function(err,result6){
                    res.render('submitinfo.ejs',{phonenumber:req.body.phonenumber});
                    res.end();
                  })
                }
                else{
                    if(result4!=""){
                      res.cookie('usertoken',result4.token);
                      res.redirect(req.session.gobackafterlogin)
                    }
                    else{
                      let token1=tokgen.generate();
                      res.cookie('usertoken',token1);
                      dbo.collection("Users").updateOne({phonenumber:req.body.phonenumber},{$set:{token:token1}},function(err,result5){
                        res.redirect(req.session.gobackafterlogin);
                        })
                    }
                }
              })
            })
          }
          else{
            res.render("verify.ejs",{phonenumber:req.body.phonenumber,text:"کد وارد شده معتبر نیست"});
            res.end();
          }
      }
      else{
        dbo.collection("signupcode").deleteOne({phonenumber:req.body.phonenumber},function(err,result2){
          res.render('signup.ejs',{data:"کد منقضی شده است"})
          res.end();
        })
      }
    })
  })
})

router.post('/submitinfo',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    var bdate={
      year:req.body.birthdate.split('/')[0],
      month:req.body.birthdate.split('/')[1],
      day:req.body.birthdate.split('/')[2]
    }
    let token1=tokgen.generate();
    res.cookie('usertoken',token1);
    dbo.collection("Users").updateOne({phonenumber:req.body.phonenumber},{$set:{sex:req.body.sex,firstname:req.body.firstname,lastname:req.body.lastname,birthdate:bdate,token:token1}},function(err,result){
      res.redirect('/');
    })
  })
})


router.get('/loginDoc',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  res.render('logindoctor.ejs',{wrongflag:0});
  res.end();
});

router.post('/loginDoc',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
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

router.get("/loginAdmin",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  res.render('AdminPanel/loginadmin.ejs',{wrongflag:0});
  res.end();
})

router.post('/loginAdmin',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Admins").findOne({username:req.body.username},function(err,result){
      if(result==null){
        res.render('AdminPanel/loginadmin.ejs',{wrongflag:1});
        res.end();
      }
      else{
        if(req.body.pass!=result.password){
          res.render('AdminPanel/loginadmin.ejs',{wrongflag:1});
          res.end();
        }
        else{
          let mytoken=tokgen.generate();
          dbo.collection("Admins").updateOne({username:req.body.username},{$set:{token:mytoken}},function(err,result2){
            res.cookie('admintoken',mytoken);
            res.redirect('/AdminPanel/addDoctor');
          })
        }
      }
    })
  })
})


router.get('/exit',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    res.clearCookie('usertoken');
    res.clearCookie('doctortoken');
    res.clearCookie('admintoken');
    res.redirect('/');
    res.end();
  })
})


router.get('*',function(req,res){        // 404 page should be displayed here// should be at the end
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  res.render("404.ejs",{categories:categories,user:""});
  res.end();
});

module.exports = router;
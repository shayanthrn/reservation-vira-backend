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
var HealthCenter= require('../coreapp/HealthCenter.js');
var time=require('../coreapp/resTime.js');
var persianDate = require('persian-date');
var myDate= require('../coreapp/myDate.js');
var Kavenegar = require('kavenegar');
var apikave = Kavenegar.KavenegarApi({
  apikey:"534438436D6364307552744278336A334B694F46343179417642536E66686568"
  });
var md5 = require('md5');
const { ObjectID } = require('mongodb');
const ZarinpalCheckout = require('zarinpal-checkout');
const { debugPort } = require('process');
const { Buffer } = require('buffer');
const { query } = require('express');
const zarinpal = ZarinpalCheckout.create('3392f819-3761-4add-babb-4d1d70021603', false);




var basiccategories=[];


function categories(){
  return new Promise((resolve, reject) => {
    basiccategories=[];
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Categories').find({}).forEach(function(doc){
        basiccategories.push(doc);
      },function(){
        resolve(basiccategories);
        db.close();
      })
    })
  })
}

//------------------------api------------------------------//






//banksalamat


router.post("/api/addhealthcenter",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("HealthCenters").findOne({name:req.body.name,type:req.body.type},function(err,hc){
          if(hc!=null){
            res.json({data:"there is a healthcenter with this name"});
            res.end();
          }
          else{
            var newHC=new HealthCenter(req.body.type,req.body.name,req.body.isreserveable=="true",req.body.city,req.body.phonenumber,req.body.address);
            dbo.collection("HealthCenters").insertOne(newHC,function(err,result){
              res.json({data:result});
              db.close();
              res.end();
            })
          }
        })
      })
   }
})

router.get("/api/getAlltypesofHC",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("HealthCenters").distinct("type",function(err,result){
          res.json({data:result});
          db.close();
          res.end();
        })
      })
   }
})

router.get("/api/getallHCbytype",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("HealthCenters").find({type:req.body.type},async function(err,result){
          data=await result.toArray()
          res.json({data:data});
          db.close();
          res.end();
        })
      })
   }
})

router.get("/api/getallHCbytypeandcity",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("HealthCenters").find({city:req.body.city,type:req.body.type},async function(err,result){
          data=await result.toArray()
          res.json({data:data});
          db.close();
          res.end();
        })
      })
   }
})


router.post("/api/addCategoryToHC",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        var newcat = {name:req.body.catname,unavailabletimes:[],reservations:[],visitduration:Number(req.body.catduration),visitcost:Number(req.body.catcost)}
        dbo.collection("HealthCenters").updateOne({name:req.body.name,type:req.body.type,isReserveable:true},{$addToSet:{categories:newcat}},function(err,result){
          res.json({data:result});
          db.close();
          res.end();
        })
      })
   }
})

router.get("/api/getTimeslotsHC",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      days=[];
      freetimes=[]
      dbo.collection("HealthCenters").findOne({name:query.name,type:query.type},function(err,result){
      if(result==null){
        res.json({data:'not found'});
        res.end();
      }
      var catobj=null;
      result.categories.forEach(function(doc){
        if(doc.name==query.category){
          catobj=doc;
        }
      })
      if(catobj==null){
        res.json({data:'invalid category'});
        res.end();
      }
      else{
        currentday=new persianDate();
        days.push(currentday);
        freetimes.push(getDoctimeslots(catobj,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
        for(let i=0;i<14;i++){
          currentday=currentday.add("d",1);
          days.push(currentday);
          freetimes.push(getDoctimeslots(catobj,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
        }
        res.json({days:createDayboxobj(days),freetimes:freetimes});
        res.end();
      }
    })
    })
   }
})


router.post("/api/paymentHC",function(req,res){

})


router.get("/api/paymenthandlerHC",function(req,res){
  
})


router.post("/api/addExperimentFile",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
    if(req.files!=null){
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("Users").findOne({phonenumber:req.body.phonenumber},function(err,user){
          if(user==null){
            res.json({data:"user not found"});
            res.end();
          }
          else{
            dbo.collection("HealthCenters").findOne({name:req.body.hcname,type:req.body.hctype},function(err,hc){
              if(hc==null){
                res.json({data:"HC not found"});
                res.end();
              }
              else{
                var now=new Date();
                path="/data/Experiments/"+now.getTime()+".zip";
                dbo.collection("Experiments").insertOne({userid:user._id,hcid:hc._id,dateuploaded:now,description:req.body.description,path:path},function(err,result){
                  mv(req.files.file.tempFilePath,path,function(err){
                    res.json({data:"file uploaded successfully"});
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
    else{
      res.json({data:"no file uploaded"});
      res.end();
    }
   }
})


router.get("/api/getAllExperimentsOfuser",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("Users").findOne({phonenumber:query.phonenumber},function(err,user){
          if(user==null){
            res.json({data:"user not found"});
            db.close();
            res.end();
          }
          else{
            dbo.collection("Experiments").find({userid:user._id},async function(err,cursor){
              result= await cursor.toArray();
              res.json({data:result});
              db.close();
              res.end();
            })
          }
        })
      })
   }
})

router.get("/api/getAllExperimentsOfHC",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("HealthCenters").findOne({name:query.name,type:query.type},function(err,HC){
          if(HC==null){
            res.json({data:"HC not found"});
            db.close();
            res.end();
          }
          else{
            dbo.collection("Experiments").find({hcid:HC._id},async function(err,cursor){
              result= await cursor.toArray();
              res.json({data:result});
              db.close();
              res.end();
            })
          }
        })
      })
   }
})


router.get("/api/sendTicket",function(req,res){

})

router.get('/api/getAlltickets',function(req,res){

})



//banksalamat

router.get("/api/verification",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    var phonenumber = query.phonenumber;
    var myresponse;
    MongoClient.connect(dburl, function(err, db) {
      if (err) throw err;
      var dbo = db.db("mydb");
      var verifycode=Math.floor(Math.random() * (99999 - 10000) + 10000);
      verifycode=verifycode.toString();
      apikave.VerifyLookup({
        token: verifycode,
        template : "reservation",
        receptor: phonenumber
      },
      function(response, status) {
        if(status==200){
          dbo.collection("signupcode").updateOne({phonenumber:phonenumber},{$set:{code:verifycode,phonenumber:phonenumber,date:new Date().getTime()}},{upsert:true},function(err,result){
              dbo.collection("Users").findOne({phonenumber:query.phonenumber},function(err,user){
                if(user==null){
                  myresponse={func:"signup",code:verifycode};
                }
                else{
                  myresponse={func:"login",code:verifycode};
                }
                res.json(myresponse)
                db.close();
                res.end();
              })
          })
        }
        else{
          res.write("problem in sending");
          db.close();
          res.end();
        }
      });
    });
  }
})

// ///

// var query=url.parse(req.url,true).query;
//   if(query.key!="pouyarahmati"){
//     res.write("noaccess");
//     res.end();
//   }
//   else{
    
//   }
// ///

router.get("/api/login",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    var query=url.parse(req.url,true).query;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Users").findOne({phonenumber:query.phonenumber},function(err,user){
      if(user==null){
        res.json("not exist")
        db.close();
        res.end();
      }
      else{
        dbo.collection("signupcode").deleteOne({phonenumber:query.phonenumber})
        res.json({token:user.token});
        db.close();
        res.end();
      }
    })
  })
  }
})

router.post("/api/signup",function(req,res){
  if(req.body.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb")
      dbo.collection("signupcode").deleteOne({phonenumber:req.body.phonenumber})
      var user=new User(req.body.phonenumber);
      user.sex=req.body.gender;
      user.firstname=req.body.firstname;
      user.lastname=req.body.lastname;
      user.birthdate=req.body.birthdate;
      let token1=tokgen.generate();
      user.token=token1;
      dbo.collection('Users').insertOne(user,function(err,result6){
        if(err) res.json({status:"nok"})
        else{
          res.json({status:"ok",token:token1});
        }
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getCategories",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    var data=[];
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Categories").find({}).forEach(function(doc){
        data.push(doc);
      },function(){
        res.json({Categories:data});
        db.close();
        res.end();
      })
    })
  }
})

router.get("/api/getDoctors",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    var data=[];
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Doctors").find({}).forEach(function(doc){
        data.push(doc);
      },function(){
        res.json({Doctors:data});
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getDoctorsBycategory",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    var data=[];
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Doctors").find({categories:query.category}).forEach(function(doc){
        data.push(doc);
      },function(){
        res.json({Doctors:data});
        db.close();
        res.end();
      })
    })
  }
})


router.get("/api/getDoctorsBycategory-city",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    var data=[];
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Doctors").find({categories:query.category,city:query.city}).forEach(function(doc){
        data.push(doc);
      },function(){
        res.json({Doctors:data});
        db.close();
        res.end();
      })
    })
  }
})

router.get("/api/getCurUser",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Users").findOne({token:query.token},function(err,user){
        if(user==null){
          res.write("not found");
          db.close();
          res.end();
        }
        else{
          res.json({user:user});
          db.close();
          res.end();
        }
      })
    })
  }
})


router.get("/api/getTimeSlots",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.write("noaccess");
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      days=[];
      freetimes=[]
      dbo.collection("Doctors").findOne({name:query.doctor},function(err,result){
      if(result==null){
        res.write('not found');
        db.close();
        res.end();
      }
      currentday=new persianDate();
      days.push(currentday);
      freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      for(let i=0;i<14;i++){
        currentday=currentday.add("d",1);
        days.push(currentday);
        freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      }
      res.json({days:createDayboxobj(days),freetimes:freetimes});
      db.close();
      res.end();
    })
    })
  }
})


router.post("/api/payment",function(req,res){
  if(req.body.usertoken==undefined){
    console.log(req.body);
    res.json({data:"user token not found"})
    res.end();
  }
  else{
  if(req.body.choice==undefined){
    res.json({data:"choice is not defined"})
    res.end();
  }
 
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Users").findOne({token:req.body.usertoken},function(err,user){
      if(user==null){
        res.json({data:"user not found"});
        db.close();
        res.end();
      }
      else{
        if(checkinterval(1)){
          dbo.collection("Doctors").findOne({name:req.body.doctor},function(err,doctor){
            if(doctor==null){
              res.json({data:"doctor not found"});
              db.close();
              res.end();
            }
            else{
              reservedata=req.body.choice.split(":");
              date=new myDate(Number(reservedata[4]),Number(reservedata[3]),Number(reservedata[2]));
              start={hour:Number(reservedata[0]),min:Number(reservedata[1])};
              temp=(start.hour*60)+start.min+doctor.visitduration;
              end={hour:Math.floor(temp/60),min:temp%60}
              unavb={start:start,end:end,date:date,dayofweek:new persianDate([Number(reservedata[2]),Number(reservedata[3]),Number(reservedata[4])]).format("dddd")};
              zarinpal.PaymentRequest({
                Amount: req.body.cost , // In Tomans
                CallbackURL: 'http://reservation.drtajviz.com/paymenthandler',
                Description: 'Dr tajviz payment',
                Email: 'shayanthrn@gmail.com',
                Mobile: '09128993687'
              }).then(response => {
                if (response.status === 100) {
                  reservation = new Reservation(user._id,doctor._id,unavb,response.authority,req.body.cost);
                  dbo.collection("TempReserves").insertOne(reservation,function(err,reserve){
                    res.json({url:response.url})
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          console.log(req.body);
          dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$set:{city:req.body.city,workphone:req.body.workphone,medicalnumber:req.body.medicalnumber,codemeli:req.body.codemeli,background:req.body.experience,address:req.body.address,phonenumber:req.body.phone,visitduration:Number(req.body.duration),description:req.body.description}},function(err,res2){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+result.image,function(err){
                console.log("public"+result.image)
              })
            }
            db.close();
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          fromtime = {hour:Number(query.fromTime.split(":")[0]),min:Number(query.fromTime.split(":")[1])};
          totime= {hour:Number(query.toTime.split(":")[0]),min:Number(query.toTime.split(":")[1])};
          if(Number.isNaN(fromtime.hour)||Number.isNaN(fromtime.min)||Number.isNaN(totime.hour)||Number.isNaN(totime.min)){
            res.write("invalid");
            db.close();
            res.end();
          }
          else{
            if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}}}});
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:{hour:0,min:0},end:totime}}});
              db.close();
              res.redirect('/doctorpanel/visittimes');
            }
            else{
            dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:totime}}},function(result2){
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          fromtime = {hour:Number(query.fromTime.split(":")[0]),min:Number(query.fromTime.split(":")[1])};
          totime= {hour:Number(query.toTime.split(":")[0]),min:Number(query.toTime.split(":")[1])};
          if(Number.isNaN(fromtime.hour)||Number.isNaN(fromtime.min)||Number.isNaN(totime.hour)||Number.isNaN(totime.min)){
            db.close();
            res.write("invalid");
            res.end();
          }
          else{
            if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}}}});
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:{hour:0,min:0},end:totime}}});
              db.close();
              res.redirect('/doctorpanel/visittimes');
            }
            else{
            dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime}}},function(result2){
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          fromtime = {hour:Number(query.fromTime.split(":")[0]),min:Number(query.fromTime.split(":")[1])};
          totime= {hour:Number(query.toTime.split(":")[0]),min:Number(query.toTime.split(":")[1])};
          if(Number.isNaN(fromtime.hour)||Number.isNaN(fromtime.min)||Number.isNaN(totime.hour)||Number.isNaN(totime.min)){
            
            res.write("invalid");
            db.close();
            res.end();
          }
          else{
            querydate=new persianDate(Number(query.datePicker));
            date=new myDate(querydate.toArray()[2],querydate.toArray()[1],querydate.toArray()[0]);
            if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:{hour:23,min:59}}}})
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:{hour:0,min:0},end:totime}}})
              db.close();
              res.redirect('/doctorpanel/visittimes');
            }
            else{
            dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:totime}}},function(result2){
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


router.post("/changepass",function(req,res){
  if(req.cookies.doctortoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Doctors').findOne({token:req.cookies.doctortoken},function(err,result){
        if(result==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          if(result.password==req.body.oldPassword){
              if(req.body.confirmPassword==req.body.newPassword){
                dbo.collection("Doctors").updateOne({token:req.cookies.doctortoken},{ $set:{password:req.body.newPassword}},function(err,result3){
                  db.close();
                  res.redirect("/doctorpanel/systemicinfo");
                })
              }
              else{
                res.write("not confirmed");
                db.close();
                res.end();
              }
          }
          else{
            res.write("wrong pass");
            db.close();
            res.end();
          }
        }
      })
    })
  }
})


router.post("/addDoctor",function(req,res){
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Doctors").findOne({name:req.body.name},function(err,res1){
        if(res1!=null){
          db.close();
          res.redirect('/doctorsignup')
        }
        else{
          dbo.collection("Doctors").findOne({username:req.body.username},function(err,res2){
            if(res2!=null){
              db.close();
              res.redirect('/doctorsignup')
            }
            else{
              var cats=[];
              var memtype=[];
              if(typeof req.body.categories=="string"){
                cats.push(req.body.categories);
              }
              else{
                req.body.categories.forEach(function(doc){
                  cats.push(doc);
                  })
              }
              if(typeof req.body.membershiptypes=="string"){
                memtype.push(req.body.membershiptypes)
              }
              else[
                req.body.membershiptypes.forEach(function(doc2){
                  memtype.push(doc2);
                })
              ]
              dbo.collection('Doctors').insertOne(new Doctor(req.body.username,req.body.pass,req.body.name,cats,req.body.medicalnumber,req.body.codemeli,req.body.workphone,req.body.phonenumber,req.body.address,req.body.city,"/docphotos/"+req.body.name+".png",req.body.background,req.body.description,memtype,req.body.appknowledge),function(err,res2){
                if(req.files!=null){
                mv(req.files.image.tempFilePath,"public/docphotos/"+req.body.name+".png",function(err){
                  console.log("public/docphotos/"+req.body.name+".png")
                })
                }
                db.close();
                res.redirect('/'); //fixxxxxxxxxxxxxxxxxxxxxxxx
              })
            }
          })
        }
      })
    })
})






//-----------------------test route--------------------------//

router.get("/test",function(req,res){
    res.render("test.ejs");
    res.end();
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
  timeslots.forEach(function(doc){
    if(doc.start.min<10){
      doc.start.min = "0" + doc.start.min
    }
    else{
      doc.start.min = doc.start.min.toString();
    }
    if(doc.start.hour<10){
      doc.start.hour = "0" + doc.start.hour
    }
    else{
      doc.start.hour = doc.start.hour.toString();
    }
    if(doc.end.min<10){
      doc.end.min = "0" + doc.end.min
    }
    else{
      doc.end.min = doc.end.min.toString();
    }
    if(doc.end.hour<10){
      doc.end.hour = "0" + doc.end.hour
    }
    else{
      doc.end.hour = doc.end.hour.toString();
    }
  })
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

function checkinterval(reservedata){       //must be implemented
  return 1;
}


function sendSMSforres(reservation){
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Doctors").findOne({_id:reservation.doctor},function(err,doctor){
      dbo.collection("Users").findOne({_id:reservation.user},function(err,user){
        var date=reservation.time.date.year+"/"+reservation.time.date.month+'/'+reservation.time.day+" "+reservation.time.start.hour+":"+reservation.time.start.min;
        apikave.VerifyLookup({
          token: reservation.refid,
          token2: doctor.name,
          token3: date,
          template : "reserveACK",
          receptor: doctor.phonenumber+","+user.phonenumber
        },
        function(response, status) {
          console.log(response);
          console.log(status);
          if(status==200){
            console.log("hehe");
            db.close();
            res.end();
          }
          else{
            res.write("<html><body><p>there is a problem on server please try again later</p></body></html>");
            db.close();
            res.end();
          }
        });
      })
    })
  })
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
          db.close();
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
          db.close();
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          res.render('DoctorPanel/profile.ejs',{doctor:result});
          db.close();
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
          db.close();
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
              res.render('DoctorPanel/patients.ejs',{patients:patients});
              db.close();
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          res.render('DoctorPanel/addunavb.ejs');
          db.close();
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
          db.close();
          res.redirect('noaccess');
        }
        else{
          res.render('DoctorPanel/settings.ejs');
          db.close();
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
              db.close();
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
                      db.close();
                      res.end();
                  });
                }
                else{
                  db.close();
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
                  db.close();
                  res.end();
              });
            }
            else{
              db.close();
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
              db.close();
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
          db.close();
          res.redirect('/noaccess');
        }
        else{
          categories().then(basiccategories=>{
            res.render("AdminPanel/doctors-add.ejs",{categories:basiccategories});
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get("/Adminpanel/addcategory",function(req,res){
  // if(req.cookies.admintoken==undefined){
  //   res.redirect('/noaccess');
  // }
  // else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        // if(result==null){
        //   db.close();
        //   res.redirect('/noaccess');
        // }
        // else{
          res.render("AdminPanel/specialty-add.ejs");
          db.close();
          res.end();
        //}
      })
    })
  //}
})

router.post("/addCategory",function(req,res){
  // if(req.cookies.admintoken==undefined){
  //   res.redirect('/noaccess');
  // }
  // else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        // if(result==null){
        //   db.close();
        //   res.redirect('/noaccess');
        // }
        // else{
          dbo.collection("Categories").insertOne({name:req.body.name,image:"/catphotos/"+req.body.name.split(' ').join('-')+".png"},function(err,insert){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png",function(err){
                console.log("public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png")
              })
            }
            db.close();
            res.redirect('/Adminpanel/categories');
          })
        //}
      })
    })
  //}
})

router.get("/Adminpanel/editcategory",function(req,res){
  var query= url.parse(req.url,true).query;
  // if(req.cookies.admintoken==undefined){
  //   res.redirect('/noaccess');
  // }
  // else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        // if(result==null){
        //   db.close();
        //   res.redirect('/noaccess');
        // }
        // else{
          dbo.collection("Categories").findOne({name:query.category},function(err,category){
            res.render("AdminPanel/specialty-edit.ejs",{category:category});
            db.close();
            res.end();
          })
        //}
      })
    })
  //}
})


router.post("/editcategory",function(req,res){
  var query= url.parse(req.url,true).query;
  // if(req.cookies.admintoken==undefined){
  //   res.redirect('/noaccess');
  // }
  // else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        // if(result==null){
        //   db.close();
        //   res.redirect('/noaccess');
        // }
        // else{
          dbo.collection("Categories").updateOne({name:query.name},{$set:{name:req.body.name,image:"/catphotos/"+req.body.name.split(' ').join('-')+".png"}},function(err,update){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png",function(err){
                console.log("public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png")
              })
            }
            db.close();
            res.redirect('/Adminpanel/categories');
          })
        //}
      })
    })
  //}
})

router.get("/Adminpanel/categories",function(req,res){
  // if(req.cookies.admintoken==undefined){
  //   res.redirect('/noaccess');
  // }
  // else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        // if(result==null){
        //   db.close();
        //   res.redirect('/noaccess');
        // }
        // else{
          var cats=[]
          dbo.collection("Categories").find({}).forEach(function(doc){
            cats.push(doc);
          },function(){
            res.render("AdminPanel/specialties.ejs",{categories:cats});
            db.close();
            res.end();
          })
        //}
      })
    })
  //}
})


router.get("/removecategory",function(req,res){
  var query= url.parse(req.url,true).query;
  // if(req.cookies.admintoken==undefined){
  //   res.redirect('/noaccess');
  // }
  // else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,result){
        // if(result==null){
        //   db.close();
        //   res.redirect('/noaccess');
        // }
        // else{
          dbo.collection("Categories").deleteOne({name:query.category},function(err,deleted){
            fs.unlink('public/catphotos/'+query.category.split(' ').join('-')+".png", function(err) {
              if(err && err.code == 'ENOENT') {
                  // file doens't exist
                  console.info("File doesn't exist, won't remove it.");
              } else if (err) {
                  // other errors, e.g. maybe we don't have enough permission
                  console.error("Error occurred while trying to remove file");
              } else {
                  console.info(`removed`);
              }
              res.redirect("adminpanel/categories")
          });
          })
        //}
      })
    })
  //}
})


//------------------------adminpanel---------------------------//
//======================= signup========================//

router.get("/DoctorSignup",function(req,res){
  categories().then(basiccategories=>{
    res.render("doctorsignup.ejs",{categories:basiccategories});
    res.end();
  })
})

router.get("/HCsignup",function(req,res){
    res.render("HCsignup.ejs");
    res.end();
})

router.get("/pharmacysignup",function(req,res){
  res.render("pharmacysignup.ejs");
  res.end();
})

router.get("/clinicsignup",function(req,res){
  categories().then(basiccategories=>{
    res.render("clinicsignup.ejs",{categories:basiccategories});
    res.end();
  })
})

router.get("/labsignup",function(req,res){
  res.render("labsignup.ejs");
})
//======================= signup========================//



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
        categories().then(basiccategories=>{
          res.render('index.ejs',{Objects:Categories,type:"category",category:"",user:"",categories:basiccategories});
          res.end();
          db.close();
        })
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,result){
          if(err) throw err;
          if(result==null){
            res.clearCookie('usertoken');
            res.redirect('/');
          }
          categories().then(basiccategories=>{
            res.render('index.ejs',{Objects:Categories,type:"category",category:"",user:result,categories:basiccategories});
            res.end();
            db.close();
          })
        })
      }
    })
  })
})

router.get("/category/:Category",function(req,res){
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
        categories().then(basiccategories=>{
          res.render("index.ejs",{Objects:Doctors,type:"doc",category:req.params.Category,user:"",categories:basiccategories});
          res.end();
          db.close();
        })
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,result){
          if(err) throw err;
          if(result==null){
            res.clearCookie('usertoken');
            res.redirect('/category//'+req.params.Category);
          }
          categories().then(basiccategories=>{
            res.render('index.ejs',{Objects:Doctors,type:"doc",category:req.params.Category.split(' ').join('-'),user:result,categories:basiccategories});
            res.end();
            db.close();
          })
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
      categories().then(basiccategories=>{
        res.render("doctorpage.ejs",{doctor:result,categories:basiccategories,user:""});      //fix this
        db.close();
        res.end();
      })
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
      if(result==null){
        db.close();
        res.redirect('/');
      }
      currentday=new persianDate();
      days.push(currentday);
      freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      for(let i=0;i<14;i++){
        currentday=currentday.add("d",1);
        days.push(currentday);
        freetimes.push(getDoctimeslots(result,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      }
      categories().then(basiccategories=>{
        res.render("reserve.ejs",{doctor:result,days:createDayboxobj(days),freetimes:freetimes,categories:basiccategories});
        db.close();
        res.end();
      })
    })
  })
})


router.post("/payment",function(req,res){
  var query= url.parse(req.url,true).query;
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  if(req.cookies.usertoken==undefined){
    res.redirect("/signup"+"?from="+query.from);
    res.end();
  }
  else{
  if(req.body.choice==undefined){
    res.redirect("/");
    res.end();
  }
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
      if(user==null){
        res.redirect("/signup"+"?from="+query.from);
        db.close();
        res.end();
      }
      else{
        if(checkinterval(1)){
          dbo.collection("Doctors").findOne({name:req.body.doctor},function(err,doctor){
            if(doctor==null){
              db.close();
              res.redirect("/noaccess");
            }
            else{
              reservedata=req.body.choice.split(":");
              date=new myDate(Number(reservedata[4]),Number(reservedata[3]),Number(reservedata[2]));
              start={hour:Number(reservedata[0]),min:Number(reservedata[1])};
              temp=(start.hour*60)+start.min+doctor.visitduration;
              end={hour:Math.floor(temp/60),min:temp%60}
              unavb={start:start,end:end,date:date,dayofweek:new persianDate([Number(reservedata[2]),Number(reservedata[3]),Number(reservedata[4])]).format("dddd")};
              zarinpal.PaymentRequest({
                Amount: req.body.cost , // In Tomans
                CallbackURL: 'http://reservation.drtajviz.com/paymenthandler',
                Description: 'Dr tajviz payment',
                Email: 'shayanthrn@gmail.com',
                Mobile: '09128993687'
              }).then(response => {
                if (response.status === 100) {
                  reservation = new Reservation(user._id,doctor._id,unavb,response.authority,req.body.cost);
                  dbo.collection("TempReserves").insertOne(reservation,function(err,reserve){
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
})


router.get("/paymenthandler",function(req,res){
  var query= url.parse(req.url,true).query;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("TempReserves").findOne({authority:query.Authority},function(err,reserve){
      if(reserve==null){
        db.close();
        res.redirect("/noaccess");
      }
      else{
        if(query.Status=="NOK"){
          strtime=reserve.time.start.hour+":"+reserve.time.start.min;
          dbo.collection("Doctors").findOne({_id:reserve.doctor},function(err,doctor){
            dbo.collection("TempReserves").deleteOne({authority:query.Authority},function(err,result){
              res.render("paymentfail.ejs",{doctor:doctor,time:strtime});
              db.close();
              res.end();
            })
          })
        }
        else{
          zarinpal.PaymentVerification({
          Amount: reserve.cost, // In Tomans
          Authority: reserve.authority,
          }).then(response => {
          if (response.status === 100 && response.RefID!=0) {
            var reservation=reserve;
            reservation.refid=response.RefID;
            dbo.collection("Reservations").insertOne(reservation,function(err,result234){
              dbo.collection("TempReserves").deleteOne({authority:query.Authority},function(err,aa){
                dbo.collection("Doctors").updateOne({_id:reservation.doctor},{$addToSet:{reservations:reservation,unavailabletimes:reservation.time}},function(err,ss){
                  dbo.collection("Users").updateOne({_id:reservation.user},{$addToSet:{reserves:reservation}},function(err,ad){
                    strtime=reservation.time.start.hour+":"+reservation.time.start.min;
                    res.render("paymentaccept.ejs",{doctor:result,time:strtime,resid:reservation.refid});
                    //sendSMSforres(reservation);
                    res.end();
                  })
                })
              })
            })
          } else {
              strtime=reserve.time.start.hour+":"+reserve.time.start.min;
              dbo.collection("Doctors").findOne({_id:reserve.doctor},function(err,doctor){
              dbo.collection("TempReserves").deleteOne({authority:query.Authority},function(err,result){
              res.render("paymentfail.ejs",{doctor:doctor,time:strtime});
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


router.get("/signup",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  var query= url.parse(req.url,true).query;
  req.session.gobackafterlogin=query.from;
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
                db.close();
                res.end();
            })
          }
          else{
            res.write("<html><body><p>there is a problem on server please try again later</p></body></html>");
            db.close();
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
                    db.close();
                    res.end();
                  })
                }
                else{
                    if(result4!=""){
                      res.cookie('usertoken',result4.token);
                      db.close();
                      res.redirect(req.session.gobackafterlogin)
                    }
                    else{
                      let token1=tokgen.generate();
                      res.cookie('usertoken',token1);
                      dbo.collection("Users").updateOne({phonenumber:req.body.phonenumber},{$set:{token:token1}},function(err,result5){
                        db.close();
                        res.redirect(req.session.gobackafterlogin);
                        })
                    }
                }
              })
            })
          }
          else{
            res.render("verify.ejs",{phonenumber:req.body.phonenumber,text:"کد وارد شده معتبر نیست"});
            db.close();
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
      db.close();
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
    dbo.collection("Doctors").findOne({username:req.body.username},function(err,doctor){
      if(doctor==null){
        res.render('logindoctor.ejs',{wrongflag:1});
        db.close();
        res.end();
      }
      else{
        if(req.body.pass!=doctor.password){
          res.render('logindoctor.ejs',{wrongflag:1});
          db.close();
          res.end();
        }
        else{
          let mytoken;
          if(doctor.token==""){
            mytoken=tokgen.generate();
          }
          else{
            mytoken=doctor.token;
          }
          dbo.collection("Doctors").updateOne({username:req.body.username},{$set:{token:mytoken}},function(err,result2){
            res.cookie('doctortoken',mytoken);
            db.close();
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
        db.close();
        res.end();
      }
      else{
        if(req.body.pass!=result.password){
          res.render('AdminPanel/loginadmin.ejs',{wrongflag:1});
          db.close();
          res.end();
        }
        else{
          let mytoken;
          if(result.token==""){
            mytoken=tokgen.generate();
          }
          else{
            mytoken=result.token;
          }
          dbo.collection("Admins").updateOne({username:req.body.username},{$set:{token:mytoken}},function(err,result2){
            res.cookie('admintoken',mytoken);
            db.close();
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
    db.close();
    res.redirect('/');
    res.end();
  })
})


router.get('*',function(req,res){        // 404 page should be displayed here// should be at the end
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  categories().then(basiccategories=>{
    res.render("404.ejs",{categories:basiccategories,user:""});
    res.end();
  })
});

module.exports = router;
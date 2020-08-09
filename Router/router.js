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
var Category = require('../coreapp/Category.js');
var dburl="mongodb://localhost:27017/";          //url of database            auth o doros kon 
var lodash =require('lodash');
var HealthCenter= require('../coreapp/HealthCenter.js');
var time=require('../coreapp/resTime.js');
var persianDate = require('persian-date');
var myDate= require('../coreapp/myDate.js');
var Kavenegar = require('kavenegar');
var request = require('request');
var apikave = Kavenegar.KavenegarApi({
  apikey:"534438436D6364307552744278336A334B694F46343179417642536E66686568"
  });
var md5 = require('md5');
const { ObjectID } = require('mongodb');
const ZarinpalCheckout = require('zarinpal-checkout');
const { debugPort } = require('process');
const { Buffer } = require('buffer');
const { query } = require('express');
const fileUpload = require('express-fileupload');
const Ticket = require('../coreapp/Ticket.js');
const e = require('express');
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

router.get("/api/getAlltypesofHC",function(req,res){
  var query=url.parse(req.url,true).query;
   if(query.key!="pouyarahmati"){
     res.json({data:"noaccess"});
     res.end();
   }
   else{
      MongoClient.connect(dburl,function(err,db){
        var dbo=db.db("mydb");
        dbo.collection("HCtypes").find({},async function(err,result){
          data=await result.toArray()
          res.json({data:data});
          db.close();
          res.end();
        })
      })
   }
})

router.post("/api/getallHCbytype",function(req,res){
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

router.post("/api/getallHCbytypeandcity",function(req,res){
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
      dbo.collection("HealthCenters").findOne({name:query.name},function(err,result){
      if(result==null){
        res.json({data:'not found'});
        res.end();
      }
      var catobj=null;
      if(result.systype=="B"){
        catobj=result;
      }
      else{
        result.categories.forEach(function(doc){
          if(doc.name==query.category){
            catobj=doc;
          }
        })
      }
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
  else{
    
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
          dbo.collection("HealthCenters").findOne({name:req.body.HCname},function(err,HC){
            if(HC==null){
              db.close();
              res.json({data:"HC not found"});
              res.end();
            }
            else{
              var catobj=null;
              if(HC.categories==undefined){
                catobj=HC;
              }
              else{
                HC.categories.forEach(function(doc){
                  if(doc.name==req.body.cat){
                    catobj=doc;
                  }
                  })
                  if(catobj==null){
                    res.redirect("/noaccess")
                  }
              }
              reservedata=req.body.choice.split(":");
              date=new myDate(Number(reservedata[4]),Number(reservedata[3]),Number(reservedata[2]));
              start={hour:Number(reservedata[0]),min:Number(reservedata[1])};
              temp=(start.hour*60)+start.min+catobj.visitduration;
              end={hour:Math.floor(temp/60),min:temp%60}
              unavb={start:start,end:end,date:date,dayofweek:new persianDate([Number(reservedata[2]),Number(reservedata[3]),Number(reservedata[4])]).format("dddd")};
              zarinpal.PaymentRequest({
                Amount: req.body.cost , // In Tomans
                CallbackURL: 'http://reservation.drtajviz.com/paymenthandlerHC',
                Description: 'Dr tajviz payment',
                Email: 'shayanthrn@gmail.com',
                Mobile: '09128993687'
              }).then(response => {
                if (response.status === 100) {
                  reservation = new ReservationHC(user._id,HC._id,req.body.cat,unavb,response.authority,req.body.cost);
                  dbo.collection("TempReservesHC").insertOne(reservation,function(err,reserve){
                    res.json({data:response.url})
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


router.post("/api/sendTicket",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.json({data:"noaccess"});
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Chats").findOne({doctor:query.dname,userphone:query.uphone},function(err,chat){
        if(chat!=null){
          var now=new Date();
          var newticket;
          if(req.files==null){
            newticket=new Ticket(req.body.subject,req.body.text,null,now);
          }
          else{
            var arr=req.files.file.name.split('.');
            var fileformat=arr[arr.length-1];
            var file={format:fileformat,path:"data/ticketfiles/"+arr[0]+now.getTime()+"."+fileformat};
            newticket = new Ticket(req.body.subject,req.body.text,file,now);
            mv(req.files.file.tempFilePath,file.path,{mkdirp:true},function(err){
              chat.tickets.push(newticket);
              dbo.collection("Chats").updateOne({doctor:query.dname,userphone:query.uphone},{$set:{tickets:chat.tickets}},function(err,asd){
                res.json({data:"succesfull"});
                res.end();
              })
            })
          }
        }
        else{
          var newchat = new Chat(query.dname,query.uphone);
          var now=new Date();
          var newticket;
          if(req.files==null){
            newticket=new Ticket(req.body.subject,req.body.text,null,now);
          }
          else{
            var arr=req.files.file.name.split('.');
            var fileformat=arr[arr.length-1];
            var file={format:fileformat,path:"data/ticketfiles/"+arr[0]+now.getTime()+"."+fileformat};
            newticket = new Ticket(req.body.subject,req.body.text,file,now);
            mv(req.files.file.tempFilePath,file.path,{mkdirp:true},function(err){
              newchat.tickets.push(newticket);
              dbo.collection("Chats").insertOne(newchat,function(err,as){
                res.json({data:"succesfull"});
                res.end();
              })
            })
          } 
        }
      })
    })
  }
})

router.get('/api/getAlltickets',function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.json({data:"noaccess"});
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Chats").findOne({doctor:query.dname,userphone:query.uphone},function(err,chat){
        if(chat==null){
          res.json({data:"not found"});
          res.end();
        }
        else{
          res.json({data:chat});
          res.end();
        }
      })
    })
  }
})

router.get("/api/downloadfile",function(req,res){
  var query=url.parse(req.url,true).query;
  if(query.key!="pouyarahmati"){
    res.json({data:"noaccess"});
    res.end();
  }
  else{
    res.download(req.body.path);
    res.end();
  }
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
    res.json({data:"no access"});
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Users").findOne({token:query.token},function(err,user){
        if(user==null){
          res.json({data:"not found"});
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
    res.json({data:"no access"});
    res.end();
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      days=[];
      freetimes=[]
      dbo.collection("Doctors").findOne({name:query.doctor},function(err,result){
      if(result==null){
        res.json({data:"not found"});
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
  else{
    
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
          var cats=[]
          if(typeof req.body.categories=="string"){
            cats.push(req.body.categories);
          }
          else{
            if(req.body.categories==undefined || req.body.categories==null ){
              cats=[];
            }
            else{
              cats=req.body.categories;
            }
          }
          dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$set:{categories:cats,city:req.body.city,workphone:req.body.workphone,medicalnumber:req.body.medicalnumber,codemeli:req.body.codemeli,background:req.body.experience,address:req.body.address,phonenumber:req.body.phone,visitduration:Number(req.body.duration),description:req.body.description}},function(err,res2){
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

router.post("/changeHCinfo",function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          dbo.collection('HealthCenters').updateOne({token:req.cookies.HCtoken},{$set:{codeofHC:req.body.codeofHC,codemeli:req.body.codemeli,city:req.body.city,phonenumber:req.body.phonenumber,directphonenumber:req.body.directphonenumber,background:req.body.background,address:req.body.address,medicalnumber:req.body.medicalnumber}},function(err,res2){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+HC.image,function(err){
                console.log("public"+HC.image)
              })
            }
            db.close();
            res.redirect('/HCpanel/profile');
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
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:{hour:0,min:1},end:totime}}});
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



router.get("/addunavbeverydayadmin",function(req,res){
  var query = url.parse(req.url,true).query;
  if(req.cookies.admintoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Admins').findOne({token:req.cookies.admintoken},function(err,result){
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
              if(query.type=="doctor"){
                dbo.collection('Doctors').updateMany({},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}}}});
                dbo.collection('Doctors').updateMany({},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:{hour:0,min:1},end:totime}}});
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if(query.type=="آزمایشگاه"){
                dbo.collection('HealthCenters').updateMany({type:"آزمایشگاه"},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}}}});
                dbo.collection('HealthCenters').updateMany({type:"آزمایشگاه"},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:{hour:0,min:1},end:totime}}});
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if(query.type=="کلینیک"){
                dbo.collection("HealthCenters").updateMany({type:"کلینیک"},{$addToSet:{'categories.$[].unavailabletimes':{date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}}}})
                dbo.collection("HealthCenters").updateMany({type:"کلینیک"},{$addToSet:{'categories.$[].unavailabletimes':{date:"*",dayofweek:"*",start:{hour:0,min:1},end:totime}}})
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
            }
            else{
              if(query.type=="doctor"){
                dbo.collection('Doctors').updateMany({},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:totime}}},function(result2){
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if(query.type=="آزمایشگاه"){
                dbo.collection('HealthCenters').updateMany({type:"آزمایشگاه"},{$addToSet:{unavailabletimes:{date:"*",dayofweek:"*",start:fromtime,end:totime}}},function(result2){
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if(query.type=="کلینیک"){
                dbo.collection("HealthCenters").updateMany({type:"کلینیک"},{$addToSet:{'categories.$[].unavailabletimes':{date:"*",dayofweek:"*",start:fromtime,end:totime}}},function(result2){
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

router.get("/addunavbeverydayHC",function(req,res){
  var query = url.parse(req.url,true).query;
  if(req.cookies.HCtoken==undefined){
    
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
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
            if(HC.systype=="A"){
              if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
                HC.categories.forEach(function(doc){
                  if(doc.name==query.category){
                     doc.unavailabletimes.push({date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}});
                     doc.unavailabletimes.push({date:"*",dayofweek:"*",start:{hour:0,min:0},end:totime});
                  }
                })
              }
              else{
                HC.categories.forEach(function(doc){
                  if(doc.name==query.category){
                     doc.unavailabletimes.push({date:"*",dayofweek:"*",start:fromtime,end:totime});
                     
                  }
                })
              }
              dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{$set:{categories:HC.categories}},function(err,result2){
                console.log(result2);
                console.log(HC.categories);
                res.redirect('/HCpanel/visittimes');
              });
            }
            else{
              if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
                HC.unavailabletimes.push({date:"*",dayofweek:"*",start:fromtime,end:{hour:23,min:59}});
                HC.unavailabletimes.push({date:"*",dayofweek:"*",start:{hour:0,min:0},end:totime});
              }
              else{
                HC.unavailabletimes.push({date:"*",dayofweek:"*",start:fromtime,end:totime});
              }
              dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{$set:{unavailabletimes:HC.unavailabletimes}},function(err,result2){
                res.redirect('/HCpanel/visittimes');
              });
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
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:{hour:0,min:1},end:totime}}});
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


router.get("/addunavbdayofweekadmin",function(req,res){
  var query = url.parse(req.url,true).query;
  if(req.cookies.admintoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('Admins').findOne({token:req.cookies.admintoken},function(err,result){
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
              if(query.type=="doctor"){
                dbo.collection('Doctors').updateMany({},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}}}});
                dbo.collection('Doctors').updateMany({},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:{hour:0,min:1},end:totime}}});
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if(query.type=="آزمایشگاه"){
                dbo.collection('HealthCenters').updateMany({type:"آزمایشگاه"},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}}}});
                dbo.collection('HealthCenters').updateMany({type:"آزمایشگاه"},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:{hour:0,min:1},end:totime}}});
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
              else if(query.type=="کلینیک"){
                dbo.collection("HealthCenters").updateMany({type:"کلینیک"},{$addToSet:{'categories.$[].unavailabletimes':{date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}}}})
                dbo.collection("HealthCenters").updateMany({type:"کلینیک"},{$addToSet:{'categories.$[].unavailabletimes':{date:"*",dayofweek:query.dayofweek,start:{hour:0,min:1},end:totime}}})
                db.close();
                res.redirect('/adminpanel/visittimes');
              }
            }
            else{
              if(query.type=="doctor"){
                dbo.collection('Doctors').updateMany({},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime}}},function(result2){
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if(query.type=="آزمایشگاه"){
                dbo.collection('HealthCenters').updateMany({type:"آزمایشگاه"},{$addToSet:{unavailabletimes:{date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime}}},function(result2){
                  db.close();
                  res.redirect('/adminpanel/visittimes');
                })
              }
              else if(query.type=="کلینیک"){
                dbo.collection("HealthCenters").updateMany({type:"کلینیک"},{$addToSet:{'categories.$[].unavailabletimes':{date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime}}},function(result2){
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


router.get("/addunavbdayofweekHC",function(req,res){
  var query = url.parse(req.url,true).query;
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
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
            if(HC.systype=="A"){
              if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
                HC.categories.forEach(function(doc){
                  if(doc.name==query.category){
                     doc.unavailabletimes.push({date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}});
                     doc.unavailabletimes.push({date:"*",dayofweek:query.dayofweek,start:{hour:0,min:1},end:totime});
                  }
                })
              }
              else{
                HC.categories.forEach(function(doc){
                  if(doc.name==query.category){
                     doc.unavailabletimes.push({date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime});
                     
                  }
                })
              }
              dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{$set:{categories:HC.categories}},function(err,result2){
                res.redirect('/HCpanel/visittimes');
              });
            }
            else{
              if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
                HC.unavailabletimes.push({date:"*",dayofweek:query.dayofweek,start:fromtime,end:{hour:23,min:59}});
                HC.unavailabletimes.push({date:"*",dayofweek:query.dayofweek,start:{hour:0,min:1},end:totime});
              }
              else{
                HC.unavailabletimes.push({date:"*",dayofweek:query.dayofweek,start:fromtime,end:totime});
              }
              dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{$set:{unavailabletimes:HC.unavailabletimes}},function(err,result2){
                res.redirect('/HCpanel/visittimes');
              });
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
              dbo.collection('Doctors').updateOne({token:req.cookies.doctortoken},{$addToSet:{unavailabletimes:{date:date,dayofweek:querydate.format("dddd"),start:{hour:0,min:1},end:totime}}})
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


router.get("/addunavbHC",function(req,res){
  var query = url.parse(req.url,true).query;
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
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
            if(HC.systype=="A"){
              if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
                HC.categories.forEach(function(doc){
                  if(doc.name==query.category){
                     doc.unavailabletimes.push({date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:{hour:23,min:59}});
                     doc.unavailabletimes.push({date:date,dayofweek:querydate.format("dddd"),start:{hour:0,min:1},end:totime});
                  }
                })
              }
              else{
                HC.categories.forEach(function(doc){
                  if(doc.name==query.category){
                     doc.unavailabletimes.push({date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:totime});
                     
                  }
                })
              }
              dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{$set:{categories:HC.categories}},function(err,result2){
                res.redirect('/HCpanel/visittimes');
              });
            }
            else{
              if((fromtime.hour*60)+fromtime.min>(totime.hour*60)+totime.min){
                HC.unavailabletimes.push({date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:{hour:23,min:59}});
                HC.unavailabletimes.push({date:date,dayofweek:querydate.format("dddd"),start:{hour:0,min:1},end:totime});
              }
              else{
                HC.unavailabletimes.push({date:date,dayofweek:querydate.format("dddd"),start:fromtime,end:totime});
              }
              dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{$set:{unavailabletimes:HC.unavailabletimes}},function(err,result2){
                res.redirect('/HCpanel/visittimes');
              });
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


router.post("/changepassHC",function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          if(HC.password==req.body.oldPassword){
              if(req.body.confirmPassword==req.body.newPassword){
                dbo.collection("HealthCenters").updateOne({token:req.cookies.HCtoken},{ $set:{password:req.body.newPassword}},function(err,result3){
                  db.close();
                  res.redirect("/HCpanel/systemicinfo");
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
  if(req.cookies.admintoken==undefined){
    res.redirect("/noaccess");
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,admin){
        if(admin==null){
          res.redirect("/noaccess");
        }
        else{
          dbo.collection("Doctors").findOne({name:req.body.name},function(err,res1){
            if(res1!=null){
              db.close();
              res.redirect('/Adminpanel/addDoctor')
            }
            else{
              dbo.collection("Doctors").findOne({username:req.body.username},function(err,res2){
                if(res2!=null){
                  db.close();
                  res.redirect('/Adminpanel/addDoctor')
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
                    res.redirect('/Adminpanel/addDoctor');
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

router.post('/addHC',function(req,res){
  var query= url.parse(req.url,true).query;
  if(req.cookies.admintoken==undefined){
    res.redirect("/noaccess");
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,admin){
        if(admin==null){
          res.redirect("/noaccess");
        }
        else{
          MongoClient.connect(dburl,function(err,db){
            var dbo=db.db("mydb");
            dbo.collection("HealthCenters").findOne({name:req.body.name},function(err,hc){
              if(hc!=null){
                res.json({data:"there is a healthcenter with this name"});
                res.end();
              }
              else{
                dbo.collection("HealthCenters").findOne({username:req.body.username},function(err,hc2){
                  if(hc2!=null){
                    res.json({data:"there is a healthcenter with this username"});
                    res.end();
                  }
                  else{
                    dbo.collection("HCtypes").findOne({name:query.type},function(err,type){
                      var img= "/"+query.type +"photos/"+req.body.name+".png";
                      var newHC=new HealthCenter(query.type,type.systype,req.body.name,type.systype=="B" || type.systype=="A",req.body.codemeli,req.body.codeofHC,req.body.city,req.body.phonenumber,req.body.address,req.body.directphonenumber,req.body.background,req.body.medicalnumber,req.body.appknowledge,req.body.username,req.body.password,img);
                      try {
                        mv(req.files.image.tempFilePath,"public"+img,{mkdirp: true},function(err){
                          console.log("image added");
                        });
                      } catch (error) {
                        console.log("no image");
                      }
                      dbo.collection("HealthCenters").insertOne(newHC,function(err,result){
                        if(type.systype=="A"){
                          var cats=[]
                          if(typeof req.body.categories=="string"){
                            cats.push(req.body.categories);
                          }
                          else{
                            if(req.body.categories==undefined || req.body.categories==null ){
                              cats=[];
                            }
                            else{
                              cats=req.body.categories;
                             }
                           }
                          cats.forEach(function(doc){
                            var newcat = {name:doc,unavailabletimes:[],reservations:[],visitduration:30,visitcost:3000};
                            dbo.collection("HealthCenters").updateOne({name:req.body.name},{$addToSet:{categories:newcat}},function(err,result){
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


//-----------------------test route--------------------------//

router.get("/test",function(req,res){
    res.render("test.ejs");
    res.end();
})

router.get("/test2",function(req,res){
  reservation={
    "user": {
        "$oid": "5ef3291e7fc6456d3a1aaa16"
    },
    "doctor": {
        "$oid": "5f14097c4c368d1c02ef530c"
    },
    refid:"1231",
    "time": {
        "start": {
            "hour": 3,
            "min": 0
        },
        "end": {
            "hour": 4,
            "min": 0
        },
        "date": {
            "year": 1399,
            "month": 5,
            "day": 10
        },
        "dayofweek": "جمعه"
    },
    "authority": "A00000000000000000000000000210093852",
    "cost": "3000"
  }
  sendSMSforres(reservation);
  res.end();
})

router.post("/test",function(req,res){
  console.log(req.files);
  console.log(req.body);
  res.json({data:req.body,data2:req.files});
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
        if(unavbstart<slotend && unavbstart>=slotstart){
          return true;
        }
        if(unavbend<=slotend && unavbend>slotstart){
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
          receptor:user.phonenumber
        },
        function(response, status) {
          console.log(response);
          console.log(status);
          if(status==200){
            apikave.VerifyLookup({
              token: reservation.refid,
              token2: user.firstname+" "+user.lastname,
              token3: date,
              template : "reserveACKdoc",
              receptor: doctor.phonenumber
            },function(respones,status){
                if(status==200){
                  console.log("ok");
                  db.close();
                }
                else{
                  db.close();
                  console.log("nok");
                }
            })
            db.close();
          }
          else{
            db.close();
            console.log("nok");
          }
        });
      })
    })
  })
}

//-----------------------functions--------------------------//
//-----------------------HCpanel-----------------------------//

router.get('/HCpanel/dashboard',function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("HealthCenters").findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          res.redirect('/noaccess');
        }
        else{
          if(HC.isReserveable==false){
            res.redirect("/HCpanel/profile");
            db.close();
          }
          else{
            var visittimes=[];
            var currentday=new persianDate();
            visittimes.push({date1:{year:currentday.toArray()[0],month:currentday.format("MMMM"),day:currentday.toArray()[2]},date:{year:currentday.toArray()[0],month:currentday.toArray()[1],day:currentday.toArray()[2]},times:[],dayofweek:currentday.format("dddd")});
            for(let i=0;i<5;i++){
              currentday=currentday.add('d',1);
              visittimes.push({date1:{year:currentday.toArray()[0],month:currentday.format("MMMM"),day:currentday.toArray()[2]},date:{year:currentday.toArray()[0],month:currentday.toArray()[1],day:currentday.toArray()[2]},times:[],dayofweek:currentday.format("dddd")});
            }
            if(HC.systype=="B"){
              HC.reservations.forEach(function(doc){
                for(i=0;i<6;i++){
                  if(lodash.isEqual(visittimes[i].date,doc.time.date)){
                    visittimes[i].times.push(doc);
                  }
                }
              })
            }
            else{
              for(let k=0;k<HC.categories.length;k++){
                HC.categories[k].reservations.forEach(function(doc){
                  for(i=0;i<6;i++){
                    if(lodash.isEqual(visittimes[i].date,doc.time.date)){
                      visittimes[i].times.push(doc);
                    }
                  }
                })
              }
            }
            res.render("HCPanel/reserveable/dashboard.ejs",{visittimes:visittimes});
            res.end();
            db.close();
          }
        }
      })
    })
  }
})

router.get('/HCpanel/profile',function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("HealthCenters").findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          res.redirect('/noaccess');
        }
        else{
          if(HC.isReserveable==false){
            res.render("HCPanel/unreserveable/profile.ejs",{HC:HC});
            res.end();
            db.close();
          }
          else{
            if(HC.systype=="B"){
              res.render("HCPanel/reserveable/profileB.ejs",{HC:HC});
              res.end();
              db.close();
            }
            else{
              res.render("HCPanel/reserveable/profileA.ejs",{HC:HC});
              res.end();
              db.close();
            }
          }
        }
      })
    })
  }
})

router.get('/HCpanel/systemicinfo',function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection("HealthCenters").findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          res.redirect('/noaccess');
        }
        else{
          if(HC.isReserveable==false){
            res.render("HCPanel/unreserveable/systemicinfo.ejs");
            res.end();
            db.close();
          }
          else{
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

router.get("/HCpanel/patients",function(req,res){
  var patientsid=[];
  var patients=[];
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          if(HC.isReserveable!=true){
            res.redirect('noaccess');
          }
          else{
            if(HC.systype=="A"){
              HC.categories.forEach(function(doc){
                for(var i=0;i<doc.reservations.length;i++){
                  patientsid.push(doc.reservations[i].user);
                }
              })
            }
            else{
              for(var i=0;i<HC.reservations.length;i++){
                patientsid.push(HC.reservations[i].user);
              }
            }
            dbo.collection("Users").find({_id: { $in : patientsid }},function(err,result2){
              result2.forEach(function(doc){
                patients.push(doc);
              },function(){
                res.render('HCPanel/reserveable/patients.ejs',{patients:patients});
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



router.get("/HCpanel/visittimes",function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,result){
        if(result==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          if(result.systype=="A"){
            res.render('HCPanel/reserveable/addunavb-typeA.ejs',{categories:result.categories});
          }
          else{
            res.render('HCPanel/reserveable/addunavb-typeB.ejs');
          }
          db.close();
          res.end();
        }
      })
    })
  }
})

router.get("/HCpanel/addexp",function(req,res){
  var patientsid=[];
  var phonenumbers=[];
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          if(HC.systype=="C"){
            db.close();
            res.redirect('noaccess');
          }
          else{
            if(HC.systype=="A"){
              HC.categories.forEach(function(doc){
                for(var i=0;i<doc.reservations.length;i++){
                  patientsid.push(doc.reservations[i].user);
                }
              })
            }
            else{
              for(var i=0;i<HC.reservations.length;i++){
                patientsid.push(HC.reservations[i].user);
              }
            }
            dbo.collection("Users").find({_id: { $in : patientsid }},function(err,result2){
              result2.forEach(function(doc){
                phonenumbers.push(doc.phonenumber);
              },function(){
                res.render('HCPanel/reserveable/addexp.ejs',{phonenumbers:phonenumbers});
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


router.post("/addexp",function(req,res){
  if(req.cookies.HCtoken==undefined){
    res.redirect('/noaccess');
  }
  else{
    MongoClient.connect(dburl,function(err,db){
      var dbo=db.db("mydb");
      dbo.collection('HealthCenters').findOne({token:req.cookies.HCtoken},function(err,HC){
        if(HC==null){
          db.close();
          res.redirect('noaccess');
        }
        else{
          if(req.files!=null){
            dbo.collection("Users").findOne({phonenumber:req.body.phonenumber},function(err,user){
            if(user==null){
              res.json({data:"user not found"});
              res.end();
            }
            else{
              var now=new Date();
              path="data/Experiments/"+now.getTime()+".zip";
              dbo.collection("Experiments").insertOne({userid:user._id,hcid:HC._id,dateuploaded:now,description:req.body.description,path:path},function(err,result){
                mv(req.files.file.tempFilePath,path,{mkdirp:true},function(err){
                  res.redirect("/HCpanel/addexp");
                  db.close();
                })
              })
            }
           })
          }
          else{
            res.json({data:"no file uploaded"});
            res.end();
          }
        }
      })
    })
  }
})

router.get("/HCpanel/reserves",function(req,res){

})


//-----------------------HCpanel------------------------------//

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
          categories().then(basiccategories=>{
            res.render('DoctorPanel/profile.ejs',{doctor:result,categories:basiccategories});
            db.close();
            res.end();
          })
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
          res.render("AdminPanel/specialty-add.ejs");
          db.close();
          res.end();
        }
      })
    })
  }
})


router.get("/Adminpanel/visittimes",function(req,res){
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
          res.render("AdminPanel/visittimes.ejs",{categories:basiccategories});
          db.close();
          res.end();
        }
      })
    })
  }
})

router.post("/addCategory",function(req,res){
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
          dbo.collection("Categories").insertOne({name:req.body.name,image:"/catphotos/"+req.body.name.split(' ').join('-')+".png"},function(err,insert){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png",function(err){
                console.log("public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png")
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

router.get("/Adminpanel/editcategory",function(req,res){
  var query= url.parse(req.url,true).query;
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
          dbo.collection("Categories").findOne({name:query.category},function(err,category){
            res.render("AdminPanel/specialty-edit.ejs",{category:category});
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.post("/editcategory",function(req,res){
  var query= url.parse(req.url,true).query;
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
          dbo.collection("Categories").updateOne({name:query.name},{$set:{name:req.body.name,image:"/catphotos/"+req.body.name.split(' ').join('-')+".png"}},function(err,update){
            if(req.files!=null){
              mv(req.files.image.tempFilePath,"public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png",function(err){
                console.log("public"+"/catphotos/"+req.body.name.split(' ').join('-')+".png")
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

router.get("/Adminpanel/categories",function(req,res){
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
          var cats=[]
          dbo.collection("Categories").find({}).forEach(function(doc){
            cats.push(doc);
          },function(){
            res.render("AdminPanel/specialties.ejs",{categories:cats});
            db.close();
            res.end();
          })
        }
      })
    })
  }
})


router.get("/removecategory",function(req,res){
  var query= url.parse(req.url,true).query;
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
          dbo.collection("Categories").deleteOne({name:query.category},function(err,deleted){
            fs.unlink('public/catphotos/'+query.category.split(' ').join('-')+".png", function(err) {
              if(err && err.code == 'ENOENT') {
                  console.info("File doesn't exist, won't remove it.");
              } else if (err) {
                  console.error("Error occurred while trying to remove file");
              } else {
                  console.info(`removed`);
              }
              dbo.collection("Doctors").updateMany({categories:query.category},{$pull:{categories:query.category}},function(err,done){
                res.redirect("adminpanel/categories")
              })
          });
          })
        }
      })
    })
  }
})


router.get("/HCsignup",function(req,res){
    var query = url.parse(req.url,true).query;
    if(req.cookies.admintoken==undefined){
      res.redirect("/noaccess");
    }
    else{
      if(query.ejs!=undefined){
        try {
          res.render(query.ejs);
          res.end();
        } catch (error) {
          res.redirect("/HCsignup")
        }
      }
      else{
        MongoClient.connect(dburl,function(err,db){
          var dbo=db.db("mydb");
          dbo.collection("Admins").findOne({token:req.cookies.admintoken},function(err,admin){
            if(admin==null){
              res.redirect("/noaccess");
            }
            else{
              dbo.collection("HCtypes").find({},async function(err,result){
                types=await result.toArray();
                res.render("HCsignup.ejs",{types:types});
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



router.get("/HealthCenters",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("HCtypes").find({},async function(err,result){
      var types= await result.toArray();
      if(req.cookies.usertoken==undefined){
        categories().then(basiccategories=>{
          res.render("healthcenters.ejs",{Objects:types,user:"",categories:basiccategories});
          res.end();
          db.close();
        })
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
          if(user==null){
            categories().then(basiccategories=>{
              res.render("healthcenters.ejs",{Objects:types,user:"",categories:basiccategories});
              res.end();
              db.close();
            })
          }
          else{
            categories().then(basiccategories=>{
              res.render("healthcenters.ejs",{Objects:types,user:user,categories:basiccategories});
              res.end();
              db.close();
            })
          }
        })
      }
    })
  })
})

router.get("/healthcenters/:type",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  var type=req.params.type.split("-").join(' ');
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("HealthCenters").find({type:type},async function(err,result){
      HCs=await result.toArray();
      if(req.cookies.usertoken==undefined){
        categories().then(basiccategories=>{
          res.render("healthcenters-type.ejs",{Objects:HCs,user:"",categories:basiccategories,type:type});
          res.end();
          db.close();
        })
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
          if(user==null){
            categories().then(basiccategories=>{
              res.render("healthcenters-type.ejs",{Objects:HCs,user:"",categories:basiccategories,type:type});
              res.end();
              db.close();
            })
          }
          else{
            categories().then(basiccategories=>{
              res.render("healthcenters-type.ejs",{Objects:HCs,user:user,categories:basiccategories,type:type});
              res.end();
              db.close();
            })
          }
        })
      }
    })
  })
})


router.get("/healthcenters/:type/:HC",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  var HCname=req.params.HC.split("-").join(' ');
  var type=req.params.type.split("-").join(' ');
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("HealthCenters").findOne({name:HCname},function(err,HC){
      if(HC.systype=="C"){
        if(req.cookies.usertoken==undefined){
          categories().then(basiccategories=>{
            res.render("hc-info.ejs",{user:"",categories:basiccategories,HC:HC});
            res.end();
            db.close();
          })
        }
        else{
          dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
            if(user==null){
              categories().then(basiccategories=>{
                res.render("hc-info.ejs",{user:user,categories:basiccategories,HC:HC});
                res.end();
                db.close();
              })
            }
            else{
              categories().then(basiccategories=>{
                res.render("hc-info.ejs",{user:user,categories:basiccategories,HC:HC});
                res.end();
                db.close();
              })
            }
          })
        }
      }
      else if(HC.systype=="B"){
        if(req.cookies.usertoken==undefined){
          categories().then(basiccategories=>{
            res.render("hc-res-info.ejs",{user:"",categories:basiccategories,HC:HC,category:"آزمایش"});
            res.end();
            db.close();
          })
        }
        else{
          dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
            if(user==null){
              categories().then(basiccategories=>{
                res.render("hc-res-info.ejs",{user:user,categories:basiccategories,HC:HC,category:"آزمایش"});
                res.end();
                db.close();
              })
            }
            else{
              categories().then(basiccategories=>{
                res.render("hc-res-info.ejs",{user:user,categories:basiccategories,HC:HC,category:"آزمایش"});
                res.end();
                db.close();
              })
            }
          })
        }
      }
      else if(HC.systype=="A"){
        if(req.cookies.usertoken==undefined){
          categories().then(basiccategories=>{
            res.render("hc-cats.ejs",{Objects:HC.categories,user:"",categories:basiccategories,HC:HC});
            res.end();
            db.close();
          })
        }
        else{
          dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
            if(user==null){
              categories().then(basiccategories=>{
                res.render("hc-cats.ejs",{Objects:HC.categories,user:"",categories:basiccategories,HC:HC});
                res.end();
                db.close();
              })
            }
            else{
              categories().then(basiccategories=>{
                res.render("hc-cats.ejs",{Objects:HC.categories,user:user,categories:basiccategories,HC:HC});
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


router.get("/reservation/info/:type/:HCname/:category",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  var HCname=req.params.HCname.split('-').join(' ');
  var type=req.params.type.split('-').join(' ');
  var category=req.params.category.split('-').join(' ');
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("HealthCenters").findOne({type:type,name:HCname},function(err,HC){
      if(req.cookies.usertoken==undefined){
        categories().then(basiccategories=>{
          res.render("hc-res-info.ejs",{HC:HC,category:category,categories:basiccategories,user:""});
          res.end();
          db.close();
        })
      }
      else{
        dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
          if(user==null){
            categories().then(basiccategories=>{
              res.render("hc-res-info.ejs",{HC:HC,category:category,categories:basiccategories,user:""});
              res.end();
              db.close();
            })
          }
          else{
            categories().then(basiccategories=>{
              res.render("hc-res-info.ejs",{HC:HC,category:category,categories:basiccategories,user:user});
              res.end();
              db.close();
            })
          }
        })
      }
    })
  })
})

router.get("/reservation/:type/:HCname/:category",function(req,res){
  var HCname=req.params.HCname.split('-').join(' ');
  var type=req.params.type.split('-').join(' ');
  var category=req.params.category.split('-').join(' ');
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    days=[];
    freetimes=[]
    dbo.collection("HealthCenters").findOne({name:HCname,type:type},function(err,result){
    if(result==null || result.categories==undefined){
      res.redirect("/noaccess")
    }
    else{
      var catobj=null;
    result.categories.forEach(function(doc){
      if(doc.name==category){
        catobj=doc;
      }
    })
    if(catobj==null){
      res.redirect("/noaccess")
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
      res.render("reservehc.ejs",{HC:result,cat:catobj,days:createDayboxobj(days),freetimes:freetimes});
      res.end();
    }
    }
  })
  })
})

router.get("/reservation/:type/:HCname",function(req,res){
  var HCname=req.params.HCname.split('-').join(' ');
  var type=req.params.type.split('-').join(' ');
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    days=[];
    freetimes=[]
    dbo.collection("HealthCenters").findOne({name:HCname,type:type},function(err,HC){
    if(HC==null || HC.systype!="B"){
      res.redirect("/noaccess")
    }
    else{
      currentday=new persianDate();
      days.push(currentday);
      freetimes.push(getDoctimeslots(HC,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      for(let i=0;i<14;i++){
        currentday=currentday.add("d",1);
        days.push(currentday);
        freetimes.push(getDoctimeslots(HC,new myDate(currentday.toArray()[2],currentday.toArray()[1],currentday.toArray()[0])));
      }
      res.render("reservehc.ejs",{HC:HC,cat:HC,days:createDayboxobj(days),freetimes:freetimes});
      res.end();
    }
  })
  })
})

router.post("/paymentHC",function(req,res){
  var query= url.parse(req.url,true).query;
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  if(req.cookies.usertoken==undefined){
    res.redirect("/signup"+"?from="+query.from);
  }
  else{
  if(req.body.choice==undefined){
    res.redirect("/"+query.from);
    res.end();
  }
  else{
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
            dbo.collection("HealthCenters").findOne({name:req.body.HCname,type:req.body.type},function(err,HC){
              if(HC==null){
                db.close();
                res.redirect("/noaccess");
              }
              else{
                var catobj=null;
                if(HC.categories==undefined){
                  catobj=HC;
                }
                else{
                  HC.categories.forEach(function(doc){
                    if(doc.name==req.body.cat){
                      catobj=doc;
                    }
                    })
                    if(catobj==null){
                      res.redirect("/noaccess")
                    }
                }
                reservedata=req.body.choice.split(":");
                date=new myDate(Number(reservedata[4]),Number(reservedata[3]),Number(reservedata[2]));
                start={hour:Number(reservedata[0]),min:Number(reservedata[1])};
                temp=(start.hour*60)+start.min+catobj.visitduration;
                end={hour:Math.floor(temp/60),min:temp%60}
                unavb={start:start,end:end,date:date,dayofweek:new persianDate([Number(reservedata[2]),Number(reservedata[3]),Number(reservedata[4])]).format("dddd")};
                zarinpal.PaymentRequest({
                  Amount: req.body.cost , // In Tomans
                  CallbackURL: 'http://reservation.drtajviz.com/paymenthandlerHC',
                  Description: 'Dr tajviz payment',
                  Email: 'shayanthrn@gmail.com',
                  Mobile: '09128993687'
                }).then(response => {
                  if (response.status === 100) {
                    reservation = new ReservationHC(user._id,HC._id,req.body.cat,unavb,response.authority,req.body.cost);
                    dbo.collection("TempReservesHC").insertOne(reservation,function(err,reserve){
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



router.get("/paymenthandlerHC",function(req,res){
  var query= url.parse(req.url,true).query;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("TempReservesHC").findOne({authority:query.Authority},function(err,reserve){
      if(reserve==null){
        db.close();
        res.redirect("/noaccess");
        
      }
      else{
        if(query.Status=="NOK"){
          strtime=reserve.time.start.hour+":"+reserve.time.start.min;
          dbo.collection("HealthCenters").findOne({_id:reserve.HC},function(err,HC){
            dbo.collection("TempReservesHC").deleteOne({authority:query.Authority},function(err,result){
              res.render("paymentfail.ejs",{doctor:HC,time:strtime,href:0});
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
              dbo.collection("TempReservesHC").deleteOne({authority:query.Authority},function(err,aa){
                  dbo.collection("Users").updateOne({_id:reservation.user},{$addToSet:{reserves:reservation}},function(err,ad){
                    dbo.collection("HealthCenters").findOne({_id:reservation.HC},function(err,HC){
                      if(HC.systype=="B"){
                        dbo.collection("HealthCenters").updateOne({_id:reservation.HC},{$addToSet:{reservations:reservation,unavailabletimes:reservation.time}},function(err,sas){
                          strtime=reservation.time.start.hour+":"+reservation.time.start.min;
                          res.render("paymentaccept.ejs",{doctor:HC,time:strtime,resid:reservation.refid});
                          //sendSMSforres(reservation);
                          res.end();
                        })
                      }
                      else{
                        var catobj=null;
                        HC.categories.forEach(function(doc){
                        if(doc.name==req.body.cat){
                          doc.reservations.push(reservation);
                          doc.unavailabletimes.push(reservation.time);
                        }
                        })
                        dbo.collection("HealthCenters").updateOne({_id:reservation.HC},{$set:{categories:HC.categories}},function(err,sdf){
                          strtime=reservation.time.start.hour+":"+reservation.time.start.min;
                          res.render("paymentaccept.ejs",{doctor:HC,time:strtime,resid:reservation.refid});
                          //sendSMSforres(reservation);
                          res.end();
                        })
                      }
                    })
                  })
              })
            })
          } else {
              strtime=reserve.time.start.hour+":"+reserve.time.start.min;
              dbo.collection("Doctors").findOne({_id:reserve.doctor},function(err,doctor){
              dbo.collection("TempReservesHC").deleteOne({authority:query.Authority},function(err,result){
              res.render("paymentfail.ejs",{doctor:doctor,time:strtime,href:0});
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


router.get("/category/:Category",function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  var query=url.parse(req.url,true).query;
  if(query.city=="all"){
    qcity={$regex:'.*'}
  }
  else {
    qcity=query.city;
  }
  Doctors = [];
  MongoClient.connect(dburl,function(err,db){
    if(err) throw err;
    var dbo= db.db("mydb");
    dbo.collection("Doctors").find({categories:req.params.Category.split('-').join(' '),city:qcity}).forEach(function(doc,err){
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
      dbo.collection("Users").findOne({token:req.cookies.usertoken},function(err,user){
        if(user==null){
          categories().then(basiccategories=>{
            res.render("doctorpage.ejs",{doctor:result,categories:basiccategories,user:""});
            db.close();
            res.end();
          })
        }
        else{
          categories().then(basiccategories=>{
            res.render("doctorpage.ejs",{doctor:result,categories:basiccategories,user:user});
            db.close();
            res.end();
          })
        }
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
      else{
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
      }
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
  else{
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
                console.log(date);
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
              res.render("paymentfail.ejs",{doctor:doctor,time:strtime,href:0});
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
              res.render("paymentfail.ejs",{doctor:doctor,time:strtime,href:0});
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

router.get('/loginHC',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  res.render('loginHC.ejs',{wrongflag:0});
  res.end();
});

router.post('/loginHC',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("HealthCenters").findOne({username:req.body.username},function(err,HC){
      if(HC==null){
        res.render('loginHC.ejs',{wrongflag:1});
        db.close();
        res.end();
      }
      else{
        if(req.body.pass!=HC.password){
          res.render('loginHC.ejs',{wrongflag:1});
          db.close();
          res.end();
        }
        else{
          let mytoken;
          if(HC.token==""){
            mytoken=tokgen.generate();
          }
          else{
            mytoken=HC.token;
          }
          dbo.collection("HealthCenters").updateOne({username:req.body.username},{$set:{token:mytoken}},function(err,result2){
            res.cookie('HCtoken',mytoken);
            db.close();
            res.redirect('/HCpanel/dashboard');
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
    res.clearCookie('HCtoken');
    db.close();
    res.redirect('/');
    res.end();
  })
})


router.get('*',function(req,res){
  req.session.prevurl=req.session.currurl;
  req.session.currurl=req.url;
  categories().then(basiccategories=>{
    res.render("404.ejs",{categories:basiccategories,user:""});
    res.statusCode=404;
    res.end();
  })
});

module.exports = router;
const { promises } = require('fs');
const { prependListener } = require('process');
var md5 = require('md5');

var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";

// MongoClient.connect(dburl,function(err,db){
//     var dbo=db.db("mydb");
//     dbo.collection("Users").updateMany({},{$set:{chats:[]}},function(err,res){
//         console.log(res);
//     })
// })

MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("costs").insertOne({docrescost:3000,doctelcost:5000,docchatcost:5000,labrescost:3000,clinicrescost:3000});
})
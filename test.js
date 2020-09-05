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
    dbo.collection("Doctors").find({}).forEach(function(data){
        data.password=md5(data.password)
        dbo.collection("Doctors").save(data);
    })
    dbo.collection("Admins").find({}).forEach(function(data){
        data.password=md5(data.password)
        dbo.collection("Admins").save(data);
    })
    dbo.collection("HealthCenters").find({}).forEach(function(data){
        data.password=md5(data.password)
        dbo.collection("HealthCenters").save(data);
    })
})
const { promises } = require('fs');
const { prependListener } = require('process');

var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";

MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Users").updateMany({},{$set:{chats:[]}},function(err,res){
        console.log(res);
    })
})
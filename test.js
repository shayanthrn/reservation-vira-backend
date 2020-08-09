const { promises } = require('fs');
const { prependListener } = require('process');

var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";

MongoClient.connect(dburl,async function(err,db){
    var dbo=db.db("mydb");
    a=await dbo.collection("HealthCenters").count()
    b=await dbo.collection("Doctors").count()
    console.log(a+b);
})
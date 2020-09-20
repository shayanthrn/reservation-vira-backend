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
    dbo.collection("HealthCenters").findOne({systype:"A"},function(err,HC){
        reservation={time:2323,aaa:22}
        console.log("this is hc categories------------:");
        console.log(HC.categories);
        HC.categories.forEach(function (doc) {
          if (doc.name == "3") {
            doc.reservations.push(reservation);
            doc.unavailabletimes.push(reservation.time);
          }
        })
        console.log("this is hc categories---afterchanges---------:");
        console.log(HC.categories);
    })
})
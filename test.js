const { promises } = require('fs');
const { prependListener } = require('process');

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
    myregex= '.*'+"پریس"+'.*'
    dbo.collection("Doctors").find({name:{$regex:myregex}},async function(err,cursor){
        arr=await cursor.toArray();
        console.log(arr)
    })
})
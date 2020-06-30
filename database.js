var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";


MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Categories").insertOne({name:"مامایی",image:"/catphotos/مامایی.png"});
    dbo.collection("Categories").insertOne({name:"پزشک عمومی",image:"/catphotos/پزشک-عمومی.png"});
    dbo.collection("Categories").insertOne({name:"شنوایی سنجی",image:"/catphotos/شنوایی-سنجی.png"});
    dbo.collection("Categories").insertOne({name:"بینایی سنجی",image:"/catphotos/بینایی-سنجی.png"});
    dbo.collection("Categories").insertOne({name:"جراحی پلاستیک و زیبایی",image:"/catphotos/جراحی-پلاستیک-و-زیبایی.png"});
    dbo.collection("Categories").insertOne({name:"خون و سرطان",image:"/catphotos/خون-و-سرطان.png"});
    dbo.collection("Categories").insertOne({name:"بیهوشی و مراقبت ویژه",image:"/catphotos/بیهوشی-و-مراقبت-ویژه.png"});
    dbo.collection("Categories").insertOne({name:"ریه",image:"/catphotos/ریه.png"});
    dbo.collection("Categories").insertOne({name:"گوارش و کبد",image:"/catphotos/گوارش-و-کبد.png"});
    dbo.collection("Categories").insertOne({name:"مغز و اعصاب",image:"/catphotos/مغز-و-اعصاب.png"});
})
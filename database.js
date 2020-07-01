var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";


MongoClient.connect(dburl,function(err,db){
    var dbo=db.db("mydb");
    dbo.collection("Categories").updateOne({name:"اطفال"},{$set:{image:"/catphotos/اطفال.png"}})
    dbo.collection("Categories").updateOne({name:"چشم"},{$set:{image:"/catphotos/چشم.png"}})
    dbo.collection("Categories").updateOne({name:"داخلی"},{$set:{image:"/catphotos/داخلی.png"}})
    dbo.collection("Categories").updateOne({name:"دندانپزشک"},{$set:{image:"/catphotos/دندانپزشک.png"}})
    dbo.collection("Categories").updateOne({name:"گوش حلق بینی"},{$set:{image:"/catphotos/گوش-حلق-بینی.png"}})
    dbo.collection("Categories").updateOne({name:"جراحی عمومی"},{$set:{image:"/catphotos/جراحی-عمومی.png"}})
    dbo.collection("Categories").updateOne({name:"جراحی و متخصص زنان"},{$set:{image:"/catphotos/جراحی-و-متخصص-زنان.png"}})
    dbo.collection("Categories").updateOne({name:"جراح کلیه و مجاری ادراری"},{$set:{image:"/catphotos/جراح-کلیه-و-مجاری-ادراری.png"}})
    dbo.collection("Categories").updateOne({name:"جراحی مغز و اعصاب"},{$set:{image:"/catphotos/جراحی-مغز-و-اعصاب.png"}})
    dbo.collection("Categories").updateOne({name:"بیماری های عفونی و تب دار"},{$set:{image:"/catphotos/بیماری-های-عفونی-و-تب-دار.png"}})
    dbo.collection("Categories").updateOne({name:"ارتوپدی"},{$set:{image:"/catphotos/ارتوپدی.png"}})
    dbo.collection("Categories").updateOne({name:"پوست و مو"},{$set:{image:"/catphotos/پوست-و-مو.png"}})
    dbo.collection("Categories").updateOne({name:"قلب و عروق"},{$set:{image:"/catphotos/قلب-و-عروق.png"}})
    dbo.collection("Categories").updateOne({name:"غدد و متابولیسم"},{$set:{image:"/catphotos/غدد-و-متابولیسم.png"}})
    dbo.collection("Categories").updateOne({name:"تغذیه"},{$set:{image:"/catphotos/تغذیه.png"}})
    dbo.collection("Categories").updateOne({name:"زنان و زایمان"},{$set:{image:"/catphotos/زنان-و-زایمان.png"}})
    dbo.collection("Categories").updateOne({name:"روانپزشک(اعصاب و روان)"},{$set:{image:"/catphotos/روانپزشک(اعصاب-و-روان).png"}})
})
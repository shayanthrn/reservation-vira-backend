var MongoClient = require('mongodb').MongoClient;
var dburl="mongodb://localhost:27017/";

class HealthCenter{
    constructor(type,systype,name,isReserveable,codemeli,codeofHC,city,phonenumber,address,directphonenumber,background,medicalnumber,appknowledge,username,password,image,costs){
        this.type=type;
        this.name=name;
        this.codeofHC=codeofHC;
        this.codemeli=codemeli;
        this.isReserveable=isReserveable;
        this.city=city;
        this.phonenumber=phonenumber;
        this.directphonenumber=directphonenumber;
        this.background=background;
        this.address=address;
        if(systype=="A"){
            this.categories=[];
        }
        else{
            if(systype=="B"){
                this.unavailabletimes=[];
                this.reservations=[]
                this.visitduration=30;
                this.visitcost=costs.labrescost;
            }
        }
        this.appknowledge=appknowledge;
        this.username=username;
        this.password=password;
        this.image=image;
        this.token="";
        this.medicalnumber=medicalnumber;
        this.systype=systype;
        this.archived=false;
    }
}


module.exports = HealthCenter;
class HealthCenter{
    constructor(type,name,isReserveable,codemeli,codeofHC,city,phonenubmber,address,directphonenumber,background,appknowledge,username,password,categories){
        this.type=type;
        this.name=name;
        this.codeofHC=codeofHC;
        this.codemeli=codemeli;
        this.isReserveable=isReserveable;
        this.city=city;
        this.phonenubmber=phonenubmber;
        this.directphonenumber=directphonenumber;
        this.background=background;
        this.address=address;
        if(isReserveable==true){
            this.categories=categories;
        }
        this.appknowledge=appknowledge;
        this.username=username;
        this.password=password;
    }
}


module.exports = HealthCenter;
class HealthCenter{
    constructor(type,name,isReserveable,codemeli,codeofHC,city,phonenumber,address,directphonenumber,background,medicalnumber,appknowledge,username,password,image){
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
        if(isReserveable==true){
            this.categories=[];
        }
        this.appknowledge=appknowledge;
        this.username=username;
        this.password=password;
        this.image=image;
        this.token="";
        this.medicalnumber=medicalnumber;
    }
}


module.exports = HealthCenter;
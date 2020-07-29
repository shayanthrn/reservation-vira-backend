class Doctor{
    constructor(username,pass,name,categories,medicalnumber,codemeli,workphone,phonenumber,address,city,path,background,description,membershiptypes,appknowledge){
        this.username=username;
        this.password=pass;
        this.name=name;
        this.categories=categories;
        this.medicalnumber=medicalnumber;
        this.codemeli=codemeli;
        this.workphone=workphone;
        this.phonenumber=phonenumber;
        this.address=address;
        this.city=city;
        this.unavailabletimes=[];
        this.image=path;
        this.background=background;
        this.visitduration=60;
        this.visitcost=3000;
        this.description=description;
        this.membershiptypes=membershiptypes;
        this.token="";
        this.appknowledge=appknowledge;
        this.reservations=[];
        this.telereservation=[];
    }
}

module.exports = Doctor;
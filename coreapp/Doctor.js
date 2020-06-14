class Doctor{
    constructor(username,pass,name,category,address,unavailabletimes,path,background,cost,description){
        this.username=username;
        this.password=pass;
        this.name=name;
        this.category=category;
        this.address=address;
        this.unavailabletimes=unavailabletimes;
        this.image=path;
        this.background=background;
        this.visitcost=cost;
        this.token="";
        this.description=description;
        this.reservations=[];
    }
}

module.exports = Doctor;
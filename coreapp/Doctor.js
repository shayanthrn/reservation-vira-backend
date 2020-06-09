class Doctor{
    constructor(name,category,address,unavailabletimes,path,background,cost,description){
        this.name=name;
        this.category=category;
        this.address=address;
        this.unavailabletimes=unavailabletimes;
        this.image=path;
        this.background=background;
        this.visitcost=cost;
        this.description=description;
        this.reservations=[];
    }
}

module.exports = Doctor;
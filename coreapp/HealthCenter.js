class HealthCenter{
    constructor(type,name,isReserveable,city,phonenubmber,address){
        this.type=type;
        this.name=name;
        this.isReserveable=isReserveable;
        this.city=city;
        this.phonenubmber=phonenubmber;
        this.address=address;
        if(isReserveable==true){
            this.categories=[];
        }
    }
}


module.exports = HealthCenter;
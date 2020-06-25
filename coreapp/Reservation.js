class Reservation{
    constructor(userid,doctorid,time,authority,cost){
        this.user=userid;
        this.doctor=doctorid;
        this.time=time;
        this.authority=authority;
        this.cost=cost;
    }
}

module.exports = Reservation;
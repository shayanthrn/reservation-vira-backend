class teleReservation{
    constructor(userid,doctorid,time,authority,cost){
        this.user=userid;
        this.doctor=doctorid;
        this.timeinfo=time;
        this.authority=authority;
        this.cost=cost;
    }
}

module.exports = teleReservation;
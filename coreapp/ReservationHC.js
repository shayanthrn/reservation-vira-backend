class Reservation{
    constructor(userid,HCid,catname,time,authority,cost){
        this.user=userid;
        this.HC=HCid;
        this.time=time;
        this.catname=catname;
        this.authority=authority;
        this.cost=cost;
    }
}

module.exports = Reservation;
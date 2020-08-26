class Chat{
    constructor(dname,uphone,cost){
        this.doctor=dname;
        this.userphone=uphone;
        this.tickets=[];
        this.finished=false;
        this.cost=cost;
    }
}

module.exports = Chat;
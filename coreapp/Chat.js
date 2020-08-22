class Chat{
    constructor(dname,uphone){
        this.doctor=dname;
        this.userphone=uphone;
        this.tickets=[];
        this.finished=false;
    }
}

module.exports = Chat;
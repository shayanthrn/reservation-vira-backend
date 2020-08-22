class User{
    constructor(phonenumber){
        this.phonenumber=phonenumber;
        this.sex="";
        this.firstname="";
        this.lastname="";
        this.birthdate={
            year:"",
            month:"",
            day:""
        }
        this.token="";
        this.reserves=[];
        this.telereservations=[];
        this.chats=[];
    }
}

module.exports = User;
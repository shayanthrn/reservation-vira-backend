class User{
    constructor(username,pass,phone,email,role){
        this.username=username;
        this.pass=pass;
        this.token=null;
        this.phone=phone;
        this.email=email;
        this.role=role;
        this.reserves=[];
    }
}

module.exports = User;
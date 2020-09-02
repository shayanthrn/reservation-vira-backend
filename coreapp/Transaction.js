class Transaction{
    constructor(authority,amount,status,username){
        this.authority=authority;
        this.amount=amount;
        this.status=status;
        this.username=username;
        this.time=new Date();
    }
}

module.exports = Transaction;
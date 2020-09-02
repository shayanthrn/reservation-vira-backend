var persianDate = require('persian-date');


class Transaction{
    constructor(authority,amount,status,username){
        this.authority=authority;
        this.amount=amount;
        this.status=status;
        this.username=username;
        this.time=new persianDate().format("LLL");
    }
}

module.exports = Transaction;
class Ticket{
    constructor(subject,text,file,now,sender){
        this.subject=subject;
        this.text=text;
        this.file=file;
        this.datecreated=now;
        this.sender=sender;
    }
}

module.exports = Ticket;
class Ticket{
    constructor(subject,text,file,now){
        this.subject=subject;
        this.text=text;
        this.file=file;
        this.datecreated=now;
    }
}

module.exports = Ticket;
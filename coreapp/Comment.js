var persianDate = require('persian-date');

class Comment{
    constructor(title,content,userid,id){
        this.title=title;
        this.content=content;
        this.senderid=userid;
        this.for=id;
        this.status="pending";
        this.time=new persianDate().format('L');
    }
}

module.exports = Comment;
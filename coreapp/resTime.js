var persianDate = require('persian-date');


class Time{
    constructor(date,start_time,end_time){
        this.date=date;
        this.start_time=start_time;
        this.end_time=end_time;
        this.dayofweek=new persianDate([date.year,date.month,date.day]).format('dddd');
    }
}

module.exports = Time;
function bla(val, cb){
    var x = toString(val);
    cb(val,{'wea':val*val});
}



bla(2,(err,msg) => {
    console.log(`code: ${err}, msg: ${JSON.stringify(msg)}`);
    bla(4,(err,msg) => {
        console.log(`code: ${err}, msg: ${JSON.stringify(msg)}`);
        bla(6,(err,msg) => {
            console.log(`code: ${err}, msg: ${JSON.stringify(msg)}`);
        });
    });
});
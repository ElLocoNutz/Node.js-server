
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs');
var config = require('./config');


helpers = {};

helpers.parseJsonToObject = function(str){
    try{
      var obj = JSON.parse(str);
      return obj;
    } catch(e){
      return {};
    }
};


helpers.hash = function(str){
    if(typeof(str)=='string' && str.length>0){
        var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }
};

helpers.createString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength >0 ? strLength : false;
    if(strLength){
        var chars = 'abcdefghijklmnopqrstuvwkyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        var str = '';

        for(i=1;i<=strLength;i++){
            var rndChar = chars.charAt(Math.floor(Math.random() * chars.length));

            str += rndChar;
        }

        return str;

    }else{
        return false;
    }
};


helpers.sendTwilioSms = function(phone,msg,callback){
    // Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length >= 9 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if(/*phone && msg*/1==1){

        var payload = {
            'From' : "me", // config.twilio.fromPhone,
            'To' : '+1'+phone,
            'Body' : msg
        };
        var stringPayload = querystring.stringify(payload);
        //var stringPayload = new URLSearchParams(payload).toString();
        console.log(stringPayload);
        
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }; /**/ 

        console.log(requestDetails);

        // Instantiate the request object
        var req = https.request(requestDetails,function(res){
        // Grab the status of the sent request

            var status =  res.statusCode;
            // Callback successfully if the request went through

            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was '+status);
            }
        });

        req.on('error',function(e){
            callback(e);
        });
    
        // Add the payload
        req.write(stringPayload);
    
        // End the request
        req.end();


    }else{
        callback('Parametros invalidos.');
    }
};

helpers.getTemplate = function(templateName, data, callback){
    templateName = typeof(templateName) == 'string' ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};
    if(templateName){
        var templateDir = path.join(__dirname,'/../templates/');
        fs.readFile(templateDir+templateName+'.html', 'utf8', function(err,str){
            if(!err && str && str.length > 0){
                //Do interpolation
                var finalString = helpers.interpolate(str,data);
                callback(false,finalString);
            }else{
                callback("No se encontró el template.");
            }
        });
    }else{
        callback('No se especificó un template valido.');
    }
};

// Agregar el header y footer
helpers.addUniversalTemplates = function(str,data,callback){
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    // Get the header
    helpers.getTemplate('_header',data,function(err,headerString){
      if(!err && headerString){
        // Get the footer
        helpers.getTemplate('_footer',data,function(err,footerString){
          if(!err && headerString){
            // Add them all together
            var fullString = headerString+str+footerString;
            callback(false,fullString);
          } else {
            callback('Could not find the footer template');
          }
        });
      } else {
        callback('Could not find the header template');
      }
    });
};

helpers.getStaticAsset = function(fileName, callback){
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false ;
    if(fileName){
        var publicDir = path.join(__dirname,'/../public/');
        fs.readFile(publicDir+fileName,function(err,data){
            if(!err && data){
                callback(false,data);
            }else{
                callback('No se encontró archivo.')
            }
        });
    }else{
        callback('No se especificó un nombre de archivo valido.')
    }
};

helpers.interpolate = function(str,data){
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};

    for(var keyName in config.templateGlobals){
        if(config.templateGlobals.hasOwnProperty(keyName)){
          data['global.'+keyName] = config.templateGlobals[keyName]
        }
    }
    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for(var key in data){
        if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
            var replace = data[key];
            var find = '{'+key+'}';
            str = str.replace(find,replace);
        }
    }
    return str;
}

module.exports = helpers;
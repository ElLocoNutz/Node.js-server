var config  = require('./config');
var _data = require('./data');
var helpers = require('./helpers');



//handlers


var handlers = {};





// handlers html
handlers.index = function(data, callback){
    if(data.method == 'get'){

        var templateData = {
            'head.title'    : 'Uptime Monitoring',
            'head.desc'     : 'Ofrecemos monitoreo de sitios webs gratuito y simple!',
            'body.title'    : 'This is the body title',
            'body.class'     : 'index'
        };

        helpers.getTemplate('index',templateData,function(err,str){
            if(!err && str){
                helpers.addUniversalTemplates(str,templateData,function(err,str){
                    if(!err && str){
                        callback(200,str,'html');
                    }else{
                        callback(500,undefined,'html');
                    }
                });
                
            }else{
                callback(500,undefined,'html');
            }
        });
    }else{
        callback(405,undefined,'html')
    }

};

handlers.accountCreate = function(data, callback){
    if(data.method == 'get'){

        var templateData = {
            'head.title'    : 'Crear una cuenta',
            'head.desc'     : 'El registro solo toma unos segundos.',
            'body.title'    : 'This is the body title',
            'body.class'     : 'accountCreate'
        };

        helpers.getTemplate('accountCreate',templateData,function(err,str){
            if(!err && str){
                helpers.addUniversalTemplates(str,templateData,function(err,str){
                    if(!err && str){
                        callback(200,str,'html');
                    }else{
                        callback(500,undefined,'html');
                    }
                });
                
            }else{
                callback(500,undefined,'html');
            }
        });
    }else{
        callback(405,undefined,'html')
    }

};

handlers.favicon = function(data,callback){
    if(data.method == 'get'){
        //Read favicon
        helpers.getStaticAsset('favicon.ico',function(err,data){
            if(!err && data){
                callback(200,data,'favicon');
            }else{
                callback(500);
            }
        });
    }else{
        callback(405);
    }
};

//Public assets
handlers.public = function(data, callback){
    if(data.method == 'get'){
        //get the filename requested
        console.log(data);
        var trimmedAssetName = data.trimPath.replace('public/','').trim();
        if(trimmedAssetName.length > 0 ){

            helpers.getStaticAsset(trimmedAssetName,function(err,data){
                if(!err && data){
                    //get content type
                    var contentType = 'plain';
                    if(trimmedAssetName.indexOf('.css') > -1 ){
                        contentType = 'css';
                    }
                    if(trimmedAssetName.indexOf('.png') > -1 ){
                        contentType = 'png';
                    }
                    if(trimmedAssetName.indexOf('.jpg') > -1 ){
                        contentType = 'jpg';
                    }
                    if(trimmedAssetName.indexOf('.ico') > -1 ){
                        contentType = 'favicon';
                    }
                    if(trimmedAssetName.indexOf('.js') > -1 ){
                        contentType = 'javascript';
                    }
                    callback(200,data,contentType);
                }else{
                    callback(404);
                }
            });
        }else{
            callback(404);
        }
    }else{
        callback(405);
    }
};

handlers.users = function(data, callback){
    var methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(405);
    }
};

//container for user submethods
handlers._users = {};

handlers._users.post = function(data, callback){
    console.log(data.payload);
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 7 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){

        _data.read('users',phone,function(err,data){
            if(err){

                var hashedPassword = helpers.hash(password);

                if(hashedPassword){
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };
    
                    _data.create('users',phone,userObject,function(err){
                        if(!err){
                            callback(200);
                        }else{
                            console.log("Error: "+err);
                            callback(500,{'Error':'No se pudo crear el usuario'});
                        }
    
                    });
                }else{
                    callback(500,{'Error':'No se pudo crear el hash'});
                }

            }else{
                console.log("Error: "+err);
                callback(400,{'Error':'Usuario existe'});
                
            }
        });

    }else{
        callback(400,{'Error':'Faltan datos'});

    }
};

handlers._users.get = function(data, callback){

    var phone = typeof(data.qs.phone) == 'string' && data.qs.phone.trim().length > 7 ? data.qs.phone.trim() : false;

    if(phone){

        // Obtener token desde el header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;

        handlers._tokens.verifyToken(token,phone,function(tokenIsvalid){
            if(tokenIsvalid){
                // Buscar el usuario
                _data.read('users',phone,function(err,data){
                    if(!err && data){
                      // Remove the hashed password from the user user object
                      delete data.hashedPassword;
                      callback(200,data);
                    }else{
                      callback(404);
                    }
                });
            }else{
                callback(403,{'Error':'Token invalido.'});
            }
        });
      } else {
        callback(400,{'Error' : 'Falta un campo requerido.'});
      }

/* */
};

handlers._users.put = function(data, callback){

    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length >7 ? data.payload.phone.trim() : false;
  // Check for optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone){
        // Error if nothing is sent to update
        if(firstName || lastName || password){
            
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
            
            handlers._tokens.verifyToken(token,phone,function(tokenIsvalid){
                
                if(tokenIsvalid){
                    // Lookup the user
                    _data.read('users',phone,function(err,userData){
                        if(!err && userData){
                      // Update the fields if necessary
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users',phone,userData,function(err){
                                if(!err){
                                    callback(200);
                                }else{
                                    console.log(err);
                                    callback(500,{'Error' : 'Could not update the user.'});
                                }
                            });
                        }else{
                            callback(400,{'Error' : 'El usuario no existe.'});
                        }
                    });
                }else{
                    callback(403,{'Error':'Token invalido.'});
                }
            });
            
        }else{
            callback(400,{'Error' : 'Faltan campos.'});
        }
    }else{
        callback(400,{'Error' : 'Falta campo requerido.'});
    }

};

handlers._users.delete = function(data, callback){
    var phone = typeof(data.qs.phone) == 'string' && data.qs.phone.trim().length >7 ? data.qs.phone.trim() : false;
    if(phone){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;
        console.log(token);
            
        handlers._tokens.verifyToken(token,phone,function(tokenIsvalid){
            if(tokenIsvalid){
                _data.read('users',phone,function(err,userData){
                    if(!err && userData){
                        _data.delete('users',phone,function(err){
                            if(!err){
                                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [] ;
                                var checksToDelete = userChecks.length;
                                if(checksToDelete>0){
                                    var checksDeleted = 0;
                                    var deletionErrors = false;

                                    userChecks.forEach(function(checkId){
                                        _data.delete('checks',checkId,function(err){
                                            if(err){
                                                deletionErrors = true;
                                            }else{
                                                checksDeleted++;
                                                if(checksDeleted==checksToDelete){
                                                    if(!deletionErrors){
                                                        callback(200);
                                                    }else{
                                                        callback(500,{'Error':'Error durante la eliminacion de archivos de usuario'});
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }else{
                                    callback(200);
                                }

                            }else{
                                callback(500,{'Error' : 'No se pudo borrar el usuario.'});
                            }
                        });
                    }else{
                        callback(400,{'Error' : 'No se pudo encontrar el usuario.'});
                    }
                });
            }else{
                callback(403,{'Error':'Token invalido.'});
            }
        });
            
        // Lookup the user
        
    }else{
        callback(400,{'Error' : 'Falta campo requerido'});

    }

};

// Tokens handler
handlers.tokens = function(data, callback){
    var methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405);
    }
};

handlers._tokens = {};

handlers._tokens.post = function(data,callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 7 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        _data.read('users',phone,function(err,userData){
            if(!err && userData){
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    var tokenId = helpers.createString(config.idLength);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObj = {
                        'phone' : phone,
                        'id'    : tokenId,
                        'expires' : expires
                    };
                    _data.create('tokens',tokenId,tokenObj,function(err){
                        if(!err){
                            callback(200, tokenObj);
                        }else{
                            callback(400, {'Error':'No se pudo crear token.'}); 
                        }
                    });
                }else{
                    callback(400, {'Error':'Wrong password.'});
                }
            }else{
                callback(400, {'Error':'No se encuentra el usuario.'});
            }
        });
    }else{
        callback(400,{'Error':'falta un campo requerido.'});
    }
};

handlers._tokens.get = function(data,callback){
    var id = typeof(data.qs.id) == 'string' && data.qs.id.trim().length == config.idLength ? data.qs.id.trim() : false;

    if(id){
        // Buscar el usuario
        _data.read('tokens',id,function(err,tokenData){
          if(!err && tokenData){
            callback(200,tokenData);
          } else {
            callback(404);
          }
        });
      } else {
        callback(400,{'Error' : 'Falta un campo requerido.'});
      }
};

handlers._tokens.put = function(data,callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == config.idLength ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        _data.read('tokens',id,function(err,tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens',id,tokenData,function(err){
                        if(!err){
                            callback(200);
                        }else{
                            callback(500,{'Error' : 'No se pudo actualizar el token.'});
                        }
                    });
                }else{
                    callback(400,{'Error' : 'El token ha expirado.'})
                }
            }else{
                callback(400,{'Error' : 'No existe el token.'});
            }
        });
    }else{
        callback(400,{'Error' : 'Falta un campo requerido.'});
    }
};

handlers._tokens.delete = function(data,callback){
    var id = typeof(data.qs.id) == 'string' && data.qs.id.trim().length == config.idLength ? data.qs.id.trim() : false;
    if(id){
        // Lookup the user
        _data.read('tokens',id,function(err,data){
            if(!err && data){
                _data.delete('tokens',id,function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(500,{'Error' : 'No se pudo borrar el token.'});
                    }
                });
            }else{
                callback(400,{'Error' : 'No se pudo encontrar el token.'});
            }
        });
    }else{
        callback(400,{'Error' : 'Falta campo requerido'});
    }
};


handlers._tokens.verifyToken = function(id,phone,callback){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
            // Check that the token is for the given user and has not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                console.log(tokenData.phone, phone, tokenData.expires,Date.now());
                callback(false);
            }
        }else{
            console.log("falló verifyToken");
            callback(false);
        }
    });
};

//checks
handlers.checks = function(data, callback){
    var methods = ['post', 'get', 'put', 'delete'];
    if (methods.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback);
    }else{
        callback(405);
    }
};

handlers._checks = {};

handlers._checks.post = function(data,callback){
    var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' &&  data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeout = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false ;

    console.log(protocol,url,method,successCodes,timeout);

    if(protocol && url && method && successCodes && timeout){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false ;

        _data.read('tokens',token,function(err, tokenData){
            if(!err && tokenData){
                var userPhone = tokenData.phone;

                _data.read('users',userPhone,function(err,userData){
                    if(!err && userData){
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [] ;

                        if(userChecks.length < config.maxChecks){
                            var checkId = helpers.createString(config.idLength);
                            // crear el objeto cheque
                            var checkObj = {
                                'id'        : checkId,
                                'userPhone' : userPhone,
                                'protocol'  : protocol,
                                'url'       : url,
                                'method'   : method,
                                'successCodes' : successCodes,
                                'timeoutSeconds' :timeout
                            }

                            _data.create('checks',checkId,checkObj,function(err){
                                if(!err){
                                    //agregar checkId al userObj
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users',userPhone,userData,function(err){
                                        if(!err){
                                            callback(200, checkObj);
                                        }else{
                                            callback(500,{'Error' : 'No se pudo actualizar el usuario.'});
                                        }
                                    });
                                }else{
                                    callback(400,{'Error' : 'No se pudo crear el nuevo cheque'});
                                }
                            });
                        }else{
                            callback(400,{'Error':`Máximo alcanzado (${config.maxChecks})`});
                        }
                    }else{
                        callback(403,{'Error' : 'No autorizado'});
                    }
                })
            }else{
                callback(403,{'Error' : 'No autorizado'});
            }
        });

    }else{
        callback(400,{'Error' :'Faltan campos.'});
    }
};

handlers._checks.get = function(data,callback){
    // Check that id is valid
    var id = typeof(data.qs.id) == 'string' && data.qs.id.trim().length == config.idLength ? data.qs.id.trim() : false;
    console.log(config.idLength,id);
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          console.log("This is check data",checkData);

          handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
              // Return check data
              callback(200,checkData);
            } else {
              callback(403,{'Error':'Token invalido.'});
            }
          });
        } else {
          callback(404);
        }
      });
    } else {
      callback(400,{'Error' : 'Falta un campo.'})
    }
  };
  
  // Checks - put
  // Required data: id
  // Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
  handlers._checks.put = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == config.idLength ? data.payload.id.trim() : false;
  
    // Check for optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  
    // Error if id is invalid
    if(id){
      // Error if nothing is sent to update
      if(protocol || url || method || successCodes || timeoutSeconds){
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
          if(!err && checkData){
            // Get the token that sent the request
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid and belongs to the user who created the check
            handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
              if(tokenIsValid){
                // Update check data where necessary
                if(protocol){
                  checkData.protocol = protocol;
                }
                if(url){
                  checkData.url = url;
                }
                if(method){
                  checkData.method = method;
                }
                if(successCodes){
                  checkData.successCodes = successCodes;
                }
                if(timeoutSeconds){
                  checkData.timeoutSeconds = timeoutSeconds;
                }
  
                // Store the new updates
                _data.update('checks',id,checkData,function(err){
                  if(!err){
                    callback(200);
                  } else {
                    callback(500,{'Error' : 'No se pudo actualizar cheque.'});
                  }
                });
              } else {
                callback(403);
              }
            });
          } else {
            callback(400,{'Error' : 'No se encuentra ID.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Faltan campos.'});
      }
    } else {
      callback(400,{'Error' : 'Falta un campo.'});
    }
  };
  
  
  // Checks - delete
  // Required data: id
  // Optional data: none
  handlers._checks.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.qs.id) == 'string' && data.qs.id.trim().length == config.idLength ? data.qs.id.trim() : false;
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
  
              // Delete the check data
              _data.delete('checks',id,function(err){
                if(!err){
                  // Lookup the user's object to get all their checks
                  _data.read('users',checkData.userPhone,function(err,userData){
                    if(!err){
                      var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
  
                      // Remove the deleted check from their list of checks
                      var checkPosition = userChecks.indexOf(id);
                      if(checkPosition > -1){
                        userChecks.splice(checkPosition,1);
                        // Re-save the user's data
                        userData.checks = userChecks;
                        _data.update('users',checkData.userPhone,userData,function(err){
                          if(!err){
                            callback(200);
                          } else {
                            callback(500,{'Error' : 'No se pudo actualizar el usuario.'});
                          }
                        });
                      } else {
                        callback(500,{"Error" : "No se encontró el cheque."});
                      }
                    } else {
                      callback(500,{"Error" : "No se encontró el usuario."});
                    }
                  });
                } else {
                  callback(500,{"Error" : "No se pudo eliminar."})
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{"Error" : "No se encuentra id."});
        }
      });
    } else {
      callback(400,{"Error" : "Id invalida"});
    }
  };

handlers.ping = function(data, callback){
    // callback http status code y payload object
    callback(200, {'name':'sample handler'});

};

// not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

module.exports = handlers;
/* 
*   Libreria para guardar data
*
*/

var fs = require('fs');
var path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');


//crear data
lib.create = function(dir,file,data,callback){

    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err,fileDescriptor){
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, function(err){
                if(!err){
                    fs.close(fileDescriptor,function(err){
                        if(!err){
                            callback(false);
                        }else{
                            callback("Error cerrando archivo.");
                        }
                    });
                }else{
                    callback('Error escribiendo archivo.');
                }
            });
        }else{
            callback('No se pudo crear nuevo archivo.');
        }
    });

};

//leer datos
lib.read = function(dir,file,callback){
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', function(err,data){
        if(!err  && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        }else{
            callback(err,data);
        }
        
    });
};

//update datos

lib.update = function(dir,file,data,callback){
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor){
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);

            fs.ftruncate(fileDescriptor, function(err){
                if(!err){

                    fs.writeFile(fileDescriptor,stringData,function(err){
                        if(!err){
                            fs.close(fileDescriptor,function(err){
                                if(!err){
                                    callback(false);
                                }else{
                                    callback("Error cerrando archivo.");
                                }
                            });
                        }else{
                            callback("Error escribiendo archivo.");
                        }
                    });
                }else{
                    callback("Error truncando archivo.");
                }
            });
            
        }else{
            callback("No se pudo abrir el archivo.");
        }
    });
};

lib.delete = function(dir,file,callback){
    fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err){
        if(!err){
            callback(false);
        }else{
            callback("Error eliminando archivo.");
        }
    });
};

// Listar items en un directorio
lib.list = function(dir,callback){
    fs.readdir(lib.baseDir+dir+'/', function(err,data){
        if(!err && data && data.length > 0){

            var trimmedFileNames = [];
            data.forEach(function(fileName){

                trimmedFileNames.push(fileName.replace('.json',''));

            });

            callback(false,trimmedFileNames);
        }else{
            callback(err,data);
        }
    });
};

module.exports = lib;
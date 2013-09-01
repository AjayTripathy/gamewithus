//configure file
//var conf = require('./conf')

//var facebook = require('./facebook.js');

//express
var express = require('express');

var flash = require('connect-flash');
var app = express();
var http = require('http');
var server = http.createServer(app);
var sio = require('socket.io');
var io = sio.listen(server);

//mongoskin
var mongo = require('mongoskin');
var db = mongo.db('localhost:27017/gamewithus?auto_reconnect', {safe: true});
var ObjectID = db.ObjectID;
var userColl = db.collection('users');
var userInfoColl = db.collection('userinfo');

//auth
var hash = require('node_hash');

var generateId = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for( var i=0; i < 8; i++ ) {
    	text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

exports.registerLocal = function (req,res) {
	 var regUser = req.body;
    userColl.findOne({
        username: regUser.username
    }, function(err, account) {
        if (err) {
            console.log("Find Error in User Collection: " + err);
            return;
        }
        if (account) {
            //account already exists, redirect to login page.
            console.log("exists")
            res.redirect('/login')
        } else {
            var newAccount = {};
            newAccount.type = 'local';
            newAccount.picture = '/img/test.jpg';
            newAccount.name = regUser.name;
            newAccount.username = regUser.username;
            newAccount.salt = generateId();
            newAccount.password = hash.sha256(regUser.password, newAccount.salt); //TODO: salt and hash! see https://github.com/AjayTripathy/dataHub/blob/master/controllers/auth.js
            newAccount.date = new Date();
            userColl.insert(newAccount, function(err, result) {
                if (err) {
                    console.log("Local Insert Error in User Collection: " + err);
                    return;
                } else {
                    //do nothing, adding was a success
                }
                console.log('success!');
                req.login(newAccount, function(error){
                    if (error){
                        console.log("Error")
                        throw error;
                    }
                    else{
                        res.redirect('/');
                    }
                    
                });
            });
        }
    });
}
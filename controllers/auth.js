
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

exports.localStrategy = function(username, password, done) {
    if (username) {
        userColl.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Unknown user'
                });
            }
            var saltedAndHashedPassword = hash.sha256(password, user.salt); 
            if (! (saltedAndHashedPassword == user.password) ) { //do the salt and hash
                return done(null, false, { message: 'Invalid password' });
            }

            return done(null, user);
        });
    } else {
        return done(null, false, {
            message: 'Empty username'
        });
    }
}

exports.facebookCallback = function(accessToken, refreshToken, profile, done) {

    facebook.getFbData(accessToken, '/me/friends', function(data){
        var friends = [];
        var data = JSON.parse(data);
        for (var i = 0; i < data.data.length; i++) {
            friends.push({fbID: data.data[i]['id']});
        }
        userColl.findOne({
            fbID: profile.id
        }, function(err, account) {

            if (err) {
                return done(err);
            }
            if (account) {
                var toInsert = {$set: {friends: friends}};
                userColl.update( {fbID : profile.id} , toInsert, function(err){
                    if (err){
                        return done(err);
                    } else {
                        userColl.findOne({
                            fbID: profile.id
                        }, function(err, accountUpdated) {
                            return done(null, accountUpdated)
                        });
                    }
                });
            } else {
                var newAccount = {};
                newAccount.type = 'facebook';
                newAccount.picture = 'https://graph.facebook.com/' + profile.id + '/picture'
                newAccount.name = profile.displayName;
                //newAccount.myId = {fbID : profile.id}
                newAccount.friends = friends;
                newAccount.fbID = profile.id;
                newAccount.date = new Date();
                userColl.insert(newAccount, function(err, result) {
                    if (err) {
                        console.log("Facebook Insert Error in User Collection: " + err);
                        return done(err);
                        return;
                    } else {
                        return done(null, result[0]);
                        //do nothing, adding was a success
                    }
                });
            }
        });
    });
}
//express
express = require('express');

//configure file
conf = require('./conf')

facebook = require('./facebook.js');


flash = require('connect-flash');
app = express();
http = require('http');
server = http.createServer(app);
sio = require('socket.io');
io = sio.listen(server);

hash = require('node_hash');



//configure socket.io
io.configure(function() {
    io.enable('browser client minification'); // send minified client
    io.enable('browser client etag'); // apply etag caching logic based on version number
    io.enable('browser client gzip'); // gzip the file
    io.set('log level', 1); // reduce logging
});



var passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    LocalStrategy = require('passport-local').Strategy;

//config express
app.configure(function() {
    app.use(flash());
    app.use(express.compress());
    app.set('views', __dirname + '/views');
    app.set('view options', {
        layout: false
    });
    app.set('view engine', 'ejs');
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({
        secret: 'sessionbartwithmesecret'
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/static'));
    app.use(app.router);
});

//mongoskin. intentionally global so that all the controllers can access this shit. will fix later
mongo = require('mongoskin');
db = mongo.db('localhost:27017/gamewithus?auto_reconnect', {safe: true});
ObjectID = db.ObjectID;
userColl = db.collection('users');
userInfoColl = db.collection('userinfo');

//controllers
var auth = require('./controllers/auth.js');
var social = require('./controllers/social.js');


//passport code
passport.use(new FacebookStrategy({
        clientID: conf.fb.appId,
        clientSecret: conf.fb.appSecret,
        callbackURL: "http://localhost:"+conf.expressPort+"/auth/facebook/callback"
    }, auth.facebookCallback)
);

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    userColl.findOne({
        _id: ObjectID.createFromHexString(id)
    }, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(auth.localStrategy));

app.get('/', function(req, res) {
    if (req.user) { 
        res.render("index", {
            user: req.user
        });
    } else {
        console.log("no req.user")
        res.redirect('/login');
    }
});

app.get('/about', function(req, res) {
        res.render("about");
});

app.get('/login', function(req, res) {
    if (req.user) {
        res.redirect('/');
    } else {
        res.render('login');
    }
});

app.get("/logout", function(req, res) {
    req.logOut();
    res.redirect('/');
});

app.post('/register/local', auth.registerLocal);

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
}));
app.post('/auth/local', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password'
}));

app.get('/friends', social.getFacebookFriends);


/*
app.post('/add/localFriend', function(req,res){
    var friendId = req.body.friendId;



    if (req.user){
    
        userColl.update(  {_id : req.user._id}, updateObj, function(err, result) {
           if (err){
               throw err;
           }

        }); 
    }
})
*/

/*
app.post('/reportTimeAndRoute', function(req, res){
    var time = req.body.time;
    var route = req.body.route;
    if(req.user){
        var toInsert = {$set: {time: time , route: route}};
        userColl.update( {_id : req.user._id} , toInsert, function(err){
            if (err){
                throw err;
            }
            res.send({status: 'ok'});
        });
        userColl.findOne({_id: req.user._id}, function(err, result){
            var friends = result.friends;
            var findObj = {$or: friends} 
            userColl.find(findObj , function(err, cursor) {
                if (err){
                    throw err;
                }
                cursor.toArray(function(err, results){
                    var data = []
                    for (var i = 0; i < results.length; i++){
                        var sID = results[i].socketID;
                        io.sockets.socket(sID).emit('updatedTime', {time: time, route: route, fbID: result.fbID, name: result.name} );
                    }
                });
            });
        });
    } 
    else {
        res.send({status: 'error'})
    }
});

app.post('/reportFriends', function(req, res){
    var friends = req.body.friends //[ {fbID:} , ]
    if (req.user){
        var toInsert = {$set: {friends: friends}};
        userColl.update( {_id : req.user._id} , toInsert, function(err){
           if (err){
               throw err;
           } 
           res.send({status: 'ok'});
        });
    }
    else {
        res.send({status: 'error'});
    }  
})

app.post('/getFriendsTimesAndRoutes' , function(req, res){
    if (req.user){
        userColl.findOne(  {_id : req.user._id}, function(err, result) {
            var friends = result.friends;
            var findObj = {$or: friends};
            userColl.find(findObj , function(err, cursor) {
                if (err){
                    throw err;
                }
                cursor.toArray(function(err, results){
                    var data = []
                    for (var i = 0; i < results.length; i++){
                        var result;
                        if (results[i].fbID){
                            result = {fbID: results[i].fbID, time: results[i].time , route: results[i].route, name: results[i].name};
                        }
                        if(result){
                            data.push(result);
                        }
                    }
                    res.send({status: 'ok' ,  data: data});
                });
            });
        });
    }
});

io.sockets.on('connection', function (socket) {
    socket.on('join', function (data) {
        console.log(data);
        var userID = data._id
        var toInsert = {$set: {socketID: socket.id}};
        userColl.update( {_id :  ObjectID.createFromHexString(userID) } , toInsert, function(err){
           if (err){
                console.log(err);
           } 
        });
    });
    socket.on('disconnect', function(){
        var socketID = socket.id
        var toInsert = {$set: {socketID: null}};
        userColl.update( {socketID :  socketID } , toInsert, function(err){
           if (err){
                console.log(err);
           } 
        });
    });
});
*/
server.listen(conf.expressPort);
console.log('Express on port: ' + conf.expressPort);

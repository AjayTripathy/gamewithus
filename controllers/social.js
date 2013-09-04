exports.getFacebookFriends = function(req, res){
   if (req.user){
        userColl.findOne(  {_id : req.user._id}, function(err, result) {
           if (err){
               throw err;
           } 
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
                            result = {fbID: results[i].fbID, name: results[i].name, picture: results[i].picture};
                        }
                        if(result){
                            data.push(result);
                        }
                    }
                    res.send({status: 'ok' ,  data: data});
                });
            });

        });
    } else {
      res.send({status: 'error'})  
    }

}
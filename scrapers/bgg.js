var request = require('request');

require('node.io').scrape(function() {
    this.getHtml("http://boardgamegeek.com/browse/boardgame/page/1", function(err, $) {
        var thumbs = $('.collection_thumbnail a')
        console.log(thumbs)
        for (var i = 0; i < thumbs.length; i++){
        	var link = thumbs[i].attribs.href
        	var boardgameId = parseInt(link.split('/')[2])

        }
    });
});
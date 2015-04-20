var request = require('request'),
    async = require('async'),
    cheerio = require('cheerio'),
    _ = require('lodash');

var parseLinks = function(body) {
    var $ = cheerio.load(body);

    return $('a')
        .map(function() {
            return $(this).attr('href');
        })
        .filter(function() {
            return this.indexOf('http') === 0;
        })
        .toArray();
};

var parsePage = function(url, callback) {
    console.log('run for ' + url);

    var options = {
        url: url,
        followRedirect: false
    };

    request(options, function (err, response, body) {
        if (err) {
            throw err;
        }

        console.log('finish for ' + url);
        callback(null, parseLinks(body));
    });
};

var setResults = function(result, results, currentLevel) {
    var links = _.union.apply(this, results);

    result[currentLevel] = [];
    result.checker = result.checker || {};

    links.forEach(function(item) {
        if(!result.checker[item]) {
            result.checker[item] = true;

            result[currentLevel].push(item);
        }
    });

    result[currentLevel] = result[currentLevel].slice(0, 10);
};

var parsePages = function(urls, currentLevel, maxLevel, result, callback) {
    async.mapLimit(urls, 10, function(item, cb) {

        parsePage(item, cb);
    }, function(err, results) {
        if(err) {
            callback(err);
        }

        setResults(result, results, currentLevel);

        if(currentLevel < maxLevel) {
            parsePages(result[currentLevel], currentLevel + 1, maxLevel, result, callback);
        } else {
            callback(null, result);
        }
    });
};

var runCrawler = function(rootUrl, level, callback) {
    var result = {};

    parsePages([rootUrl], 0, level, result, callback);
};

runCrawler('http://www.onliner.by', 3, function(err, result) {
    if(err) {
        console.log(err);
        return;
    }

    console.dir(result);
});
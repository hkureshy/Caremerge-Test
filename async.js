const https = require('https');
const http = require('http');
const url = require('url');
var async = require('async');
var mapLimit = require('async/map');

const httpServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  const queryStringobject = parsedUrl.query;

  const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

  const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringobject
  };

  chosenHandler(data, (statusCode) => {
    if(statusCode === 404) {
      res.end('404');
    } else {
      getTitles(queryStringobject.address, (titles) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><head></head><body>');
        res.write('<h1>Following are the titles of given websites:</h1><ul>');
        res.write(titles);
        res.write('</ul></body></html>');
        res.end();
      });
    }
  });
});

httpServer.listen(3000, () => {
  console.log('Server is listening in port 3000');
});

let handlers = {};
let titles = [];
let li = '';

getTitles = (qStr, callback) => {
  let sUrl = Array.isArray(qStr) ? qStr : [qStr];

  sUrl = sUrl.map(url => {
    if(url.indexOf('www.') === -1) {
      return 'www.' + url;
    }

    return url;
  });

  const titleRes = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;

  async.map(sUrl, requestFunc, (err, result) => {
    for(title in result) {
      li = li + '<li>' + sUrl[title] + ' - ' + result[title] + '</li>'
    }
    callback(li);
    li = '';
  });
}

requestFunc = (url, callback) => {
  const titleRes = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;

  https.get('https://' + url, (res, error) => {
    res.on('data', (chunk) => {
      var str = chunk.toString();
      var match = titleRes.exec(str);

      if (match && match[2]) {
        titles = match[2];
      }
    });
    res.on('end', () => {
      callback(null, titles);
    })
  }).on('error', () => {
    callback(null, 'NO RESPONSE');
  });
}

handlers.ping = (data, callback) => {
  callback(200);
}

handlers.notFound = (data, callback) => {
  callback(404);
};

const router = {
  'I/want/title': handlers.ping
};

const https = require('https');
const http = require('http');
const url = require('url');
var RSVP = require('rsvp');

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
  
  const promises = sUrl.map(url =>
    requestFunc(url)
  );
  RSVP.all(promises).then((data) => {
    data.forEach(title => {
      var str = title.toString();
      var match = titleRes.exec(str);

      if(match && match[2]) {
        li = li + '<li>' + match[2] + '</li>'
      }
    });
    callback(li);
    li = '';
  });
}

requestFunc = (sUrl) => {
  return new RSVP.Promise((resolve, reject) => {
    https.get('https://' + sUrl, response => {
      response.on('data', resolve);
      response.on('error', reject);
    });
  })
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

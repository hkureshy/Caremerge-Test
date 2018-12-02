const http = require('http');
const https = require('https');
const url = require('url');

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
      getTitles(queryStringobject.address, (title) => {
        for(let i = 0; i < title.length; i++) {
          li = li + '<li>' + queryStringobject.address[i] + ' - ' + title[i] + '</li>';
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><head></head><body>');
        res.write('<h1>Following are the titles of given websites:</h1><ul>');
        res.write(li);
        res.write('</ul></body></html>');
        res.end();
      });
    }
  });
});

// Start the server
httpServer.listen(3000, () => {
    console.log('Server is listening in port 3000');
});

// Define handlers
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
  let titles = [];

  for(i in sUrl) {
    https.get('https://' + sUrl[i], (response) => {
      response.on('data', (chunk) => {
        var str=chunk.toString();
        var match = titleRes.exec(str);

        if (match && match[2]) {
          titles.push(match[2]);
        }
      });

      response.on('end', () => {
        if(titles.length === sUrl.length) {
          callback(titles);
          li = '';
        }
      });
    });
  }
}

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
}

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Define a request router
const router = {
  'I/want/title': handlers.ping
};

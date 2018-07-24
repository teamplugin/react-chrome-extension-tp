const bluebird = require('bluebird');

global.Promise = bluebird;

function promisifier(method) {
  // return a function
  return function promisified(...args) {
    // which returns a promise
    return new Promise((resolve) => {
      args.push(resolve);
      method.apply(this, args);
    });
  };
}

function promisifyAll(obj, list) {
  list.forEach(api => bluebird.promisifyAll(obj[api], { promisifier }));
}

// let chrome extension api support Promise
promisifyAll(chrome, [
  'windows',
  'browserAction',
  'alarms',
  'cookies'
]);
promisifyAll(chrome.storage, [
  'local',
]);

require('./background/models/instagram/instagram');

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  let hasOrigin = false;
  let hasReferer = false;

  for (let i = 0; i < details.requestHeaders.length; i++) {
    if (details.requestHeaders[i].name === 'Origin') {
      hasOrigin = true;
      details.requestHeaders[i].value = 'https://www.instagram.com/';
    } else if (details.requestHeaders[i].name === 'Referer') {
      hasReferer = true;
      details.requestHeaders[i].value = 'https://www.instagram.com/';
    } else if (details.requestHeaders[i].name === 'Accept') {
      details.requestHeaders[i].value = 'application/json, text/javascript, */*; q=0.01';
    }
  }

  if (!hasOrigin) {
    details.requestHeaders.push({ name: 'Origin', value: 'https://www.instagram.com/' });
  }
  if (!hasReferer) {
    details.requestHeaders.push({ name: 'Referer', value: 'https://www.instagram.com/' });
  }
  return { requestHeaders: details.requestHeaders };
},
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders']);
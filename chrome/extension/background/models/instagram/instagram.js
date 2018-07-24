const UserObject = require('../../../background/models/instagram/instagram-user');
const LocationObject = require('../../../background/models/instagram/instagram-location');
const HashTagObject = require('../../../background/models/instagram/instagram-hashtag');
const Promise = require('bluebird');
const axios = require('axios');

let instagram;
let loaded = false; // ensures that instagram session is loaded.
const debug = true;

class Instagram { //extends Product {
  constructor(csrftoken) {
    this.licenseStatus = 'PENDING';  //PENDING, INACTIVE, FREE_TRIAL, FREE_TRIAL_EXPIRED, FULL
    this.license = {};
    this.csrftoken = csrftoken;
    this.debug = debug;
    this.isOn = false;
    this.looping = false;
    this.targets = [];
    this.maxLikes = 1000;//need to document in overview
    this.likes = 0;
    this.totalLikes = 0;//need to get from local storage
    this.processQueue = [];
    this.pollIntervalMin = 1;  // 1 minute
    this.pollIntervalMax = 60;  // 1 hour
    this.popupOpen = false;
    this.apiBlocked = false;
    this.isSleeping = false;
    this.apiCurrentLimit = this.maxLikes;
    this.setListeners();
    this.setWatch();
  }
  get totals() {
    return {
      maxLikes: this.maxLikes,
      totalLikes: this.totalLikes, //need to update to retrieve form storgae to keep state
      sessionLikes: this.likes,
    };
  }

  verifyAndSaveLicense = (license) => {
    const TRIAL_PERIOD_DAYS = 14;
    const startDate = new Date('2018-06-16'); //need to make dynamic or in milliseconds atleast.
    /*
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
       // Use the token.
    });*/
    if (this.debug) { console.log(`Got license: ${license}`); }

    if (!license) {
      if (this.debug) { console.log(`result not in license: ${license}`); }
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        this.getLiscense(token);
      });
      return;
    } else if (!('result' in license)) {
      if (this.debug) { console.log(`result not in license: ${license}`); }
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        this.getLiscense(token);
      });
      return;
    } else if ('verified' in license) {
      const lastVerified = license.verified;
      const now = Date.now();
      const secondsPassed = (now - lastVerified) / 100;

      if (secondsPassed >= license.maxAgeSecs) {
        if (this.debug) { console.log(`'get new token to validate lisence': ${license}`); }
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          this.getLiscense(token);
        });
        return;
      }
    }

    if (license.result && license.accessLevel === 'FULL') {
      if (this.debug) { console.log('Fully paid & properly licensed.'); }
      this.licenseStatus = 'FULL';
    } else if (license.result && license.accessLevel === 'FREE_TRIAL') {
      const createdDate = parseInt(license.createdTime, 10);
      let daysAgoLicenseIssued = Date.now() - createdDate;
      daysAgoLicenseIssued = daysAgoLicenseIssued / 1000 / 60 / 60 / 24;

      if (daysAgoLicenseIssued <= TRIAL_PERIOD_DAYS) {
        if (this.debug) { console.log('Free trial, still within trial period'); }
        this.licenseStatus = 'FREE_TRIAL';
      } else if (createdDate <= startDate) {
        if (this.debug) { console.log('Free trial, grandfathered'); }
        this.licenseStatus = 'FREE_TRIAL';
      } else {
        if (this.debug) { console.log('Free trial, trial period expired.'); }
        this.licenseStatus = 'FREE_TRIAL_EXPIRED';
        chrome.runtime.sendMessage({ type: 'lisenceUpdate', licenseStatus: this.licenseStatus });
      }
    } else {
      if (this.debug) { console.log('No license.'); }
      this.licenseStatus = 'INACTIVE';
      chrome.runtime.sendMessage({ type: 'lisenceUpdate', licenseStatus: this.licenseStatus });
    }

    const reviewedLicense = { ...license };
    reviewedLicense.verified = Date.now();
    const store = { license: reviewedLicense, liscenseError: 0 };

    this.license = reviewedLicense;

    chrome.storage.sync.set(store, () => {
      if (this.debug) { console.log('license saved'); }
    });
  }
  liscenseError = () => {
    /*chrome.identity.removeCachedAuthToken(
      { 'token': access_token },
      getTokenAndXhr);
          return;
    }*/
    const now = Date.now();
    chrome.storage.sync.get(['liscenseError'], (item) => {
      if ('liscenseError' in item) {
        if (item.liscenseError > 0) {
          const diff = now - item.liscenseError;
          if (diff > 86400000) {
            this.licenseStatus = 'INACTIVE';
            return;
          }
        }
      }
      const store = { liscenseError: now, type: 'liscenseError' };
      chrome.storage.sync.set({ liscenseError: store }, () => {
        if (this.debug) { console.log('license saved'); }
      });
    });
  }
  getLiscense = (token) => {
   
    const CWS_LICENSE_API_URL = `https://www.googleapis.com/chromewebstore/v1.1/userlicenses/${chrome.runtime.id}`;

    axios.get(CWS_LICENSE_API_URL, {
      headers: {
        Authorization: `Bearer ${token}` //the token is a variable which holds the token
      }
    })
   .then((response) => {
  //   console.log(response);
     if (response.status !== 200) {
          //this.liscenseError();
       return;
     }

     const license = response.data;

     //for testinging
     /*const license = {
       accessLevel: 'FULL',
       createdTime: '1528825493492',
       itemId: 'hehjkenfggkjmaoomeohlhjheelpfooi',
       kind: 'chromewebstore#userLicense',
       maxAgeSecs: '2',
       result: true
     };*/

     
     if ('accessLevel' in license) {
       this.verifyAndSaveLicense(license);
     } else {
       //this.liscenseError();
     }

    /*
    In addition, do not block the user interface or lock the user out of your Chrome App or
     Extension while waiting for the licensing server to respond,
     but instead, allow the user to continue for a
     limited grace period until a response is received.
     Providing a grace period of at least a day or two will
     ensure that your Chrome App or Extension continues to work
      properly in an offline situation where the user may not be connected to the network.*/
   })
   .catch((err) => {
     console.log('err');
     console.error(err);
      //this.liscenseError();
   });
  }
  popUpClosed = () => {
    this.popupOpen = false;
  }
  setListeners() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.onAlarm(alarm);
    });
  }
  resetSleep() {
    this.start();
    chrome.alarms.clear('instagram');
  }
  resetAPIBlock() {
    this.awake();
    chrome.alarms.clear('instagram');
  }
  setLicense(license, licenseStatus) {
    this.licenseStatus = licenseStatus;
  }
  setMaxLikes(likes) {

    this.maxLikes = likes;
    this.apiCurrentLimit = likes;
    
    this.saveToStore({ storeKey: 'maxLikes', maxLikes: likes });

    if (this.apiBlocked) {
      this.resetAPIBlock();
    }

    if (this.isSleeping) {
      this.resetSleep();
    }

  }
  /*addAttributes(attributes) { // don't delete for product super
    this.likes = attributes.likes;
    this.lastLiked = attributes.lastLiked;
    super.addAttributes(attributes);
  }*/
 /* sleep(handler, timeout) {
    let baseTime = Date.now();
    const callHandler = () => {
      if (Date.now() - baseTime > timeout) {
        baseTime = Date.now();
        //handler();
        this.startLoop();
      }
    };
    this.checkSessionInterval = window.setInterval(callHandler, 1000);
  }
  awake() {
    window.clearInterval(this.checkSessionInterval);
    this.checkSessionInterval = null;
  }*/
  onAlarm(alarm) {
    if (this.debug) { console.log(`Got alarm: ${alarm}`); }
    if (alarm) {
      if (alarm.name === 'instagram') {
        this.awake();
        this.setAutoWake();
      } else if (alarm.name === 'instagramAutoWake') {
        this.setAutoWake();
        for (const insta of this.targets) {
          insta.clearSession();
        }
      } else if (alarm.name === 'refreshLikes') {
        if (this.debug) { console.log(`refreshLikes triggered at ${Date.now()}`); }//temp
        this.likes = 0;
      } else {
        this.start(alarm.name);
      }
    }
  }
  setWatch() { //use to check main instagram
    if (this.debug) { console.log('set watch to wake up after midnight'); }//temp
    const tommorowDate = new Date();
    const tommorow = tommorowDate.setHours(24, 0, 0, 0);
    chrome.alarms.create('refreshLikes', { when: tommorow, periodInMinutes: 1440 }); //1440
  }
  updateInsta(insta) {
    return new Promise((resolve) => {
      const instaToUpdate = this.targets.filter(item => item.name === insta.title);

      if (instaToUpdate.length > 0) {
        instaToUpdate[0].update(insta);
        if (insta.isActive) {
          chrome.alarms.clear(instaToUpdate[0].name);
          this.startExtension();
        }
      }
      resolve();
    });
  }
  newUser(user, maxLikes) { //need to true or false
    return new Promise((resolve) => {
      if (this.debug) { console.log('Instagram newUser'); }
      const customer = {};
      const object = new UserObject(customer, user, this.csrftoken, maxLikes, true);
      user.type = 'user';
      user.maxLikes = maxLikes;
      user.storeKey = object.name;
      this.saveToStore(user);
    //  localStorage[object.name] = user;
      this.targets.push(object);
      resolve();
    });
  }
  newLocation(location, maxLikes) { //need to true or false
    return new Promise((resolve) => {
      if (this.debug) { console.log('Instagram newUser'); }
      const customer = {};
   
      const object = new LocationObject(customer, location, this.csrftoken, maxLikes, true);
      location.type = 'location';
      location.maxLikes = maxLikes;
      location.storeKey = object.name;

      this.saveToStore(location);
    //  localStorage[object.name] = user;
      this.targets.push(object);

      resolve();
    });
  }
  newHashTag(hashtag, maxLikes) { //need to true or false
    return new Promise((resolve) => {
      if (this.debug) { console.log('Instagram newHashTag'); }
      const customer = {};
      const object = new HashTagObject(customer, hashtag, this.csrftoken, maxLikes, true);
      hashtag.type = 'hashtag';
      hashtag.maxLikes = maxLikes;
      hashtag.storeKey = object.name;
      this.saveToStore(hashtag);
      this.targets.push(object);
      resolve();
    });
  }
  saveToStore(item) {
    const store = {};
    store[item.storeKey] = item;
    chrome.storage.sync.set(store, () => {
      if (this.debug) { console.log('item saved'); }
    });
  }
  loadFromStore(sendResponse) {
    if (this.debug) { console.log('loadFromStore'); }

    chrome.storage.sync.get(null, (items) => {
      //console.log(JSON.stringify(items));

      for (const [key, value] of Object.entries(items)) {
        if (this.debug) { console.log(`${key} ${value}`); }
        if (value instanceof Object) {
          if ('type' in value) {
            switch (value.type) {
              case 'user':
                this.newUser(value, value.maxLikes);
                break;
              case 'hashtag':
                this.newHashTag(value, value.maxLikes);
                break;
              case 'location':
                this.newLocation(value, value.maxLikes);
                break;
              default:
                break;
            }
          }
        } else {
          switch (key) {
            case 'maxLikes':
              this.maxLikes = value.maxLikes;
              break;
            case 'totalLikes':
              this.totalLikes = value.totalLikes;
              break;
            case 'license':
              this.verifyAndSaveLicense(value);
              break;
            default:
              break;
          }
        }
      }
      const instas = this.targets.map(insta => insta.jsonPaylod);
      if (sendResponse) {
        sendResponse({ instas, totals: this.totals, loading: false });
      }
      this.startExtension();
    });
  }
  removeFromStore(name) {
    //localStorage.removeItem(name);
    chrome.storage.sync.remove(name, () => { console.log(`removed from store ${name}`); });
  }
  rest(instagramObject) { //sleep individual insta
    if (this.debug) { console.log(`rest ${JSON.stringify(instagramObject)}`); }
    const delay = Math.floor(Math.random() * 240000) + 60000;
    const nowDate = new Date();
    const nowEpoch = nowDate.getTime() + ((nowDate.getTimezoneOffset() * 60) * 1000);
    instagramObject.rest(nowEpoch + delay);
    if (this.debug) { const now = new Date(); console.log(`Instagram rested ${instagramObject.name} at ${now} for ${nowEpoch + delay}`); }
    chrome.alarms.create(instagramObject.name, { when: nowEpoch + delay });

    if (this.popupOpen) {
      const instas = this.targets.map(insta => insta.jsonPaylod);
      chrome.runtime.sendMessage({ type: 'instaUpdate', instas, totals: this.totals });
    }
  }
  sleep() { //sleep instagram
    if (this.debug) { console.log('sleep'); }
    chrome.alarms.clear('instagramAutoWake');
    this.isOn = false;
    this.isSleeping = true;
    for (const insta of this.targets) {
      insta.clearSession();
    }
    const tommorowDate = new Date();
    tommorowDate.setHours(25, 0, 0, 0); // next midnignt + 1 hour
 //   const nowDate = new Date();
    const delay = tommorowDate.getTime() + ((tommorowDate.getTimezoneOffset() * 60) * 1000);
    chrome.alarms.getAll((alarms) => {
      //just clear them all for now
      for (const alarm of alarms) {
        const foundTarget = this.targets.find(target => target.name === alarm.name);
        if (foundTarget) {
          chrome.alarms.clear(foundTarget.name);
        }
      }
    });
    if (this.debug) { const now = new Date(); console.log(`Instagram slept extension: ${now} for ${delay}`); }
    chrome.alarms.create('instagram', { when: delay });
    this.saveToStore({ storeKey: 'totalLikes', totalLikes: this.totalLikes });
  }
  nap() { //nap whole instagram for a few hours
    if (this.debug) { console.log('nap'); }
    chrome.alarms.clear('instagramAutoWake');
    this.isOn = false;
    for (const insta of this.targets) {
      insta.clearSession();
    }
    const nowDate = new Date();
    const nowEpoch = nowDate.getTime() + ((nowDate.getTimezoneOffset() * 60) * 1000);
    const futureEpoch = nowEpoch + 3600000;

    chrome.alarms.getAll((alarms) => {
      //just clear them all for now
      for (const alarm of alarms) {
        const foundTarget = this.targets.find(target => target.name === alarm.name);
        if (foundTarget) {
          chrome.alarms.clear(foundTarget.name);
        }
      }
    });
    if (this.debug) { const now = new Date(); console.log(`Instagram nap extension: ${now} for ${3600000}`); }
    chrome.alarms.create('instagram', { when: futureEpoch });
    this.saveToStore({ storeKey: 'totalLikes', totalLikes: this.totalLikes });
  }
  setAutoWake() {
    if (this.debug) { console.log('setAutoWake'); }
    const tommorowDate = new Date();
    tommorowDate.setHours(26, 0, 0, 0); // next midnignt + 1 hour
    const delay = tommorowDate.getTime() + ((tommorowDate.getTimezoneOffset() * 60) * 1000);
    chrome.alarms.create('instagramAutoWake', { when: delay });
  }
  awake() {
    //add tracking and reporting
    const now = new Date();
    if (this.debug) { console.log(`Instagram awoke from sleep at : ${now}`); }
    this.isOn = true;
    this.apiBlocked = false;
    this.isSleeping = false;
    this.likes = 0;
    for (const target of this.targets) {
      target.isAwake = true;
    }
    this.startLoop();
  }
  startExtension() { //will prob be inut
    if (this.debug) { console.log(`Instagram started extension: ${now}`); }
    this.isOn = true;
    const now = new Date();
    if (this.licenseStatus === 'INACTIVE' || this.licenseStatus === 'FREE_TRIAL_EXPIRED' || this.licenseStatus === 'PENDING') {
      this.verifyAndSaveLicense();
    }
    this.startLoop();
  }
  stopExtension() { //will prob be not be prod
    this.isOn = false;
    this.targets = [];
  }
  start(name) {
    if (this.debug) { console.log(`Instagram start: ${name}`); }
    this.apiBlocked = false;
    this.isSleeping = false;
    const foundItem = this.targets.find(target => target.name === name);
    if (foundItem) {
      if (this.debug) { console.log(`Instagram start found item in targets: ${name}`); }
      if (foundItem.isActive) {
        foundItem.isAwake = true;
      }

      if (this.isOn) {
        this.startLoop();
      }
    } else {
      //will call api to see what its status is, should not happen
      if (this.debug) { console.log(`Instagram start no found item: ${name}`); }
    }
  }
  startLoop = () => {
    if (this.debug) { console.log(`should start loop ${this.looping}`); }
    this.verifyAndSaveLicense(this.license);
    if (!this.looping) {
      this.looping = true;
      Promise.resolve()
      .then(() => {
        const tangentialPromiseBranch = this.recurseToProcessTargets();
        return (tangentialPromiseBranch);
      })
      .then(() => {
        if (this.debug) { console.log('looping finished'); }
        //do we want it to nap if the lisence is inactive?
        if (this.licenseStatus === 'INACTIVE') {
          return;
        }
        this.nap();
      })
      .catch((err) => {
        if (this.debug) { console.error('start loop error'); }
        console.error(err);
        this.nap(); //nap and try again
      });
    }
  }
  recurseToProcessTargets = () => {
      // Use  return (0); to bail out of the recursion. 
    if (this.debug) { console.log('Entering recursive function'); }
    let activeItems = 0;
    if (this.debug) { console.log(this.looping); }
    if (!this.looping) {
      if (this.debug) { console.log('stop recursion looping is false'); }
      return (0);
    }
    if (this.licenseStatus === 'INACTIVE') {
      if (this.debug) { console.log('stop recursion INACTIVE licenseStatus'); }
      return (0);
    }

    const tangentialPromiseBranch = Promise.resolve().then(
        () => Promise.each(this.targets, (target) => {
          if (target.isActive && target.isAwake) {
            activeItems += 1;
            return target.likeNext().then((wasLiked) => {
              if (wasLiked) {
                this.likes = this.likes + 1;
                this.totalLikes = this.totalLikes + 1;

                if (this.popupOpen) {
                  const instas = this.targets.map(insta => insta.jsonPaylod);
                  chrome.runtime.sendMessage({ type: 'instaUpdate', instas, totals: this.totals });
                }

                if (target.inSessionLikes > target.maxLikes) {
                  if (this.debug) { console.log('shiould rest'); }
                  this.rest(target);
                }
              } else if (target.apiIsFailing) {
                this.apiBlocked = true;
                this.apiCurrentLimit = this.likes;
                return Promise.reject(new Error('instagram issues'));
              } else if (target.noLikes > 5) {
                target.skipPage();
                return target.fill().then(() => { Promise.delay(Math.floor(Math.random() * 10000) + 5000); });
              } else if (!target.hasNextPage) {
                this.rest(target);
              }

              return Promise.delay(Math.floor(Math.random() * 10000) + 5000);
            });
          }
          return Promise.resolve();
        })
          .then(() => {
            if (this.debug) { console.log(`Likes ${this.likes} done`); }
            if (this.debug) { console.log(`Max Likes ${this.maxLikes} done`); }
            if (this.likes > this.maxLikes - 1) {
              if (this.debug) { console.log('no more likes'); }
              this.looping = false;
              this.sleep();
            } else if (this.isOn) {
              if (activeItems > 0) {
                this.looping = true;
              } else {
                this.looping = false;
              }
            } else {
              if (this.debug) { console.log('isoff'); }
              this.looping = false;
            }
            return (this.recurseToProcessTargets());// RECURSE!
          })
          .catch((err) => {
            if (this.debug) { console.log(JSON.stringify(err)); }
            this.looping = false;
            this.nap(); //nap and try again
          })
        );
    return (tangentialPromiseBranch);
  };
}

module.exports = Instagram;

/// Startup scripts

chrome.alarms.clearAll(); //clear alarm on new load since storage will be emptied

function loadSession(sendResponse) {
  chrome.cookies.get({ url: 'https://www.instagram.com', name: 'csrftoken' }, (cookie) => {
    if (debug) { console.log(cookie.value); }
    if (cookie.value === undefined) {
      console.log('no session found!');
      return;
    } else if (cookie.value !== null && cookie.value !== '') {
      instagram = new Instagram(cookie.value);
      localStorage.csrftoken = cookie.value;
    } else if ('csrftoken' in localStorage) {
      instagram = new Instagram(localStorage.csrftoken);
    } else {
      console.log('no local session found!');
      return;
    }
    loaded = true;
    instagram.loadFromStore(sendResponse);
  });
}



const oldChromeVersion = !chrome.runtime;

if (chrome.runtime && chrome.runtime.onStartup) {
  loadSession();
  /*chrome.runtime.onStartup.addListener(() => {
   // instagram.loadFromStore();
   // instagram.start();
  });*/
}

if (oldChromeVersion) {
  //need to notify user to update thier chrome version
}


chrome.runtime.onConnect.addListener((externalPort) => {
  externalPort.onDisconnect.addListener(() => {
    instagram.popUpClosed();
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (debug) { console.log('got message'); }
  if (debug) { console.log(request); }
  let instas;
  let targets;

  if (loaded) {
    switch (request.type) {
      case 'start':
        sendResponse({ activated: true });
        instagram.startExtension();
        break;
      case 'stop':
        sendResponse({ activated: false });
        instagram.stopExtension();
        break;
      case 'resetAPIBlock':
       // instagram.resetAPIBlock();
        loadSession(sendResponse);
        break;
      case 'updateMaxLikes':

        instagram.setMaxLikes(request.maxLikes);
        break;
      case 'getInstas':
        instas = instagram.targets.map(insta => insta.jsonPaylod);
        sendResponse({ licenseStatus: instagram.licenseStatus, instas, totals: instagram.totals, loading: false, apiCurrentLimit: instagram.apiCurrentLimit, apiBlocked: instagram.apiBlocked, isSleeping: instagram.isSleeping });
        instagram.popupOpen = true;
        instagram.startExtension();
        break;
      case 'updateInsta':
        instagram.updateInsta(request.insta)
          .then(() => {
            instas = instagram.targets.map(item => item.jsonPaylod);
            sendResponse({ instas, totals: instagram.totals });
          });
        return true;
      case 'deleteInsta':
          //move target filter to class
        targets = instagram.targets.filter(insta => insta.name !== request.insta.title);
        instas = targets.map(item => item.jsonPaylod);
        instagram.targets = targets;
        instagram.removeFromStore(request.insta.title);
        sendResponse({ instas, totals: instagram.totals });
        return true;
      case 'newInsta':
        if ('user' in request.insta) {
          instagram.newUser(request.insta.user, request.insta.maxLikes)
            .then(() => {
              instas = instagram.targets.map(item => item.jsonPaylod);
              sendResponse({ instas, totals: instagram.totals });
              instagram.startExtension();
            });
        }
        if ('hashtag' in request.insta) {
          instagram.newHashTag(request.insta.hashtag, request.insta.maxLikes)
            .then(() => {
              instas = instagram.targets.map(item => item.jsonPaylod);
              sendResponse({ instas, totals: instagram.totals });
              instagram.startExtension();
            });
        }
        if ('location' in request.insta) {
          instagram.newLocation(request.insta.location, request.insta.maxLikes)
          .then(() => {
     
            instas = instagram.targets.map(item => item.jsonPaylod);
            sendResponse({ instas, totals: instagram.totals });
            instagram.startExtension();
          });
        }
        return true;
      default:
        break;
    }
  } else {
    console.log('load sesson!');
    loadSession(sendResponse);
   /*chrome.cookies.get({ url: 'https://www.instagram.com', name: 'csrftoken' }, (cookie) => {
      if (debug) { console.log(cookie.value); }
      if (cookie.value === undefined) {
        console.log('no session found!');
        return;
      } else if (cookie.value !== null && cookie.value !== '') {
        instagram = new Instagram(cookie.value);
        localStorage.csrftoken = cookie.value;
      } else if ('csrftoken' in localStorage) {
        instagram = new Instagram(localStorage.csrftoken);
      } else {
        console.log('no local session found!');
        return;
      }
      loaded = true;
      instagram.loadFromStore(sendResponse);
    });*/
    return true;
  }
});


/*
// callback = function (error, httpStatus, responseText);
function authenticatedXhr(method, url, callback) {
  var retry = true;
  function getTokenAndXhr() {
    chrome.identity.getAuthToken({ 'interactive': true },
      function (access_token) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization',
                             'Bearer ' + access_token);

        xhr.onload = function () {
          if (this.status === 401 && retry) {
            // This status may indicate that the cached
            // access token was invalid. Retry once with
            // a fresh token.
            retry = false;
            chrome.identity.removeCachedAuthToken(
                { 'token': access_token },
                getTokenAndXhr);
            return;
          }

          callback(null, this.status, this.responseText);
        }
      });
    }
  }*/


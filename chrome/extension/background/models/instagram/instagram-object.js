const Promise = require('bluebird');
const axios = require('axios');

class InstagramObject { //extends AWSObject {
  constructor(customer, type, instagramJSON, csrftoken, maxLikes, isActive) {

    this.debug = false;

    this.customer = customer;
    this.type = type;
    this.csrftoken = csrftoken;
    this.instagramJSON = instagramJSON;
    this.frequency = 1.5;
    this.deviation = 0;
    this.sleep = 3600000; // sleep an hour by default  -- can we delete?
    this.restPeriodEpoch = 0;
    this.loaded = false;
    this.hasNextPage = false;
    this.endCurser = null;
    this.arrayOfLiked = [];
    this.arrayOfInstas = [];
    this.currentIndex = 0;

    if (maxLikes === null) {
      this.maxLikes = 100;
    } else {
      this.maxLikes = maxLikes;
    }

    this.apiFailures = 0;
    this.loading = false;
    this.isActive = isActive; //or false??
    this.isAwake = true; //do want to store state, if active then awake it wil just go to sleep if needed
    this.totalLikes = 0;
    this.inSessionLikes = 0;
    this.noLikes = 0;
    this.lastLikedEpoch = 0;
  }
  get active() {
    return this.isActive;
  }
  get liked() {
    return this.arrayOfLiked;
  }
  get name() {
    switch (this.type) {
      case 'user':
        return this.instagramJSON.username;
      case 'hashTag':
        return this.instagramJSON.name;
      case 'location':
        return this.instagramJSON.name;
      default:
        return 'unknown';
    }
  }
  /*
  set frequency(likesPerHour) {
    this.frequency = this.frequency;
  }
  set deviation(deviation) {
    this.deviation = this.deviation;
  }*/
  get jsonPaylod() {
    return {
      title: this.name,
      type: this.type,
      isActive: this.isActive,
      isAwake: this.isAwake,
      maxLikes: this.maxLikes,
      inSessionLikes: this.inSessionLikes,
      totalLikes: this.totalLikes,
      lastLikedEpoch: this.lastLikedEpoch,
      restPeriodEpoch: this.restPeriodEpoch,
      likes: this.liked
    };
  }
  get apiIsFailing() {
    if (this.apiFailures > 2) {
      return true;
    }
    return false;
  }
  update(insta) {
  //  if (this.debug) { console.log(`InstagramObject update: ${JSON.stringify(insta)}`); }
    this.isActive = insta.isActive;
    if (insta.isActive) {
      this.isAwake = true;
    }
    this.maxLikes = insta.maxLikes;
  }
  addLikedInsta(insta) {
    if (this.arrayOfLiked.length > 100) {
      this.arrayOfLiked.shift();
    }
    ///console.log('add liked');
 //   console.log(insta);
    this.arrayOfLiked.push(insta);
    const nowDate = new Date();
    this.lastLikedEpoch = nowDate.getTime() + ((nowDate.getTimezoneOffset() * 60) * 1000);
  }
  rest(restPeriodEpoch) {
    this.isAwake = false;
    this.restPeriodEpoch = restPeriodEpoch;
    this.clearSession();
  }
  skipPage() {
    this.noLikes = 0;
  }
  skipInsta() {
    this.currentIndex = this.currentIndex + 1;
  }
  clearSession() {
    if (this.debug) { console.log(`clearSession`); }
    this.noLikes = 0;
    this.arrayOfInstas = [];
    this.hasNextPage = false;
    this.endCurser = null;
    this.inSessionLikes = 0;
    this.currentIndex = 0;
    this.loaded = false;
    this.apiFailures = 0;
  }
  add() {
    const params = {
      TableName: process.env.INSTAGRAM_TABLE,
      Item: {
        userID: this.userID,
        title: this.name,
        instagramJSON: this.instagramJSON,
        frequency: this.frequency,
        deviation: this.deviation,
        type: this.type,
        isActive: this.isActive,
        maxLikes: this.maxLikes,
        inSessionLikes: this.inSessionLikes,
        totalLikes: this.totalLikes,
        lastLikedEpoch: this.lastLikedEpoch,
        restPeriodEpoch: this.restPeriodEpoch
      }
    };
    if (this.debug) { console.log(`InstagramObject sync: ${JSON.stringify(params)}`); }

    return this.dynamodb.put(params).promise()
              .then(result => this.verifySuccess(result));
  }
  sync() {
    const params = {
      TableName: process.env.INSTAGRAM_TABLE,
      Key: {
        userID: this.userID,
        name: this.name
      }
    };


   // if (this.debug) { console.log(`InstagramObject sync: ${JSON.stringify(params)}`); }
    return this.dynamodb.get(params).promise()
                .then(result => this.verifySuccess(result))
                .then(result => this.addAttributes(result));
  }
  loadNew() {
    if (this.debug) { console.log(`InstagramObject Load New: ${this.type}`); }
    this.loading = true;
    return axios.get(this.searchAddress())
    .then((response) => {
      this.currentIndex = 0;
      if (this.debug) { console.log(`InstagramObject Load New response: ${response}`); }
  
      const rawString = response.data.substring(response.data.indexOf('<script type="text/javascript">window._sharedData = ') + 52, response.data.indexOf('};</script>') + 1);
      const payload = JSON.parse(rawString);
   
      this.convertFromNew(payload);
      return Promise.resolve(false);
    });
  }
  loadNext() {
    if (this.debug) { console.log(`InstagramObject loadNext: ${this.type}`); }
    if (this.debug) { console.log(`InstagramObject hasNextPage: ${this.hasNextPage}`); }
    if (this.debug) { console.log(`InstagramObject endCurser: ${this.endCurser}`); }
    //if (this.debug) { console.log(`InstagramObject instagramJSON: ${JSON.stringify(this.instagramJSON)}`); }
    this.loading = true;

    if (!this.hasNextPage) {
      //need to send message to sleep and remove from this queue

      return Promise.resolve(false);
    }

    if (this.endCurser == null) {
       //this should not happen, need to send message to sleep and remove from this queue
      return Promise.resolve(false);
    }

    return axios.get(this.queryAddress())
    .then(response => this.convertFromNext(response.data));
     // if (this.debug) { console.log(`InstagramObject loadNext response: ${JSON.stringify(response)}`); }
     /*
     return Promise.map(response.data.data.user.edge_owner_to_timeline_media.edges, item => item.node)
      .then((payload) => {
        this.currentIndex = 0;
        const data = response.data;
        data.instas = payload;
        */
   //    this.convertFromNext(response.data)

      //});
  //  );
  }
  fill() {
    if (this.debug) { console.log(`InstagramObject fill: ${this}`); }
    if (this.loaded) {
      return this.loadNext();
    }
    return this.loadNew().then(() => { this.loaded = true; });
  }
  convertFromNew(payload) {
    //if (this.debug) { console.log(`InstagramObject convertFromNew: ${payload}`); }
    this.loading = false;
    //   return Promise.resolve()
  }
  convertFromNext(payload) {
  //  if (this.debug) { console.log(`InstagramObject convertFromNext: ${payload}`); }
    this.loading = false;
  //  return Promise.resolve()
  }
  isLiked() {
    return axios.get(this.postPageAddress())
    .then((response) => {
    //  if (this.debug) { console.log(`InstagramObject isLiked response: ${response}`); }

      const rawString = response.data.substring(response.data.indexOf('<script type="text/javascript">window._sharedData = ') + 52, response.data.indexOf('};</script>') + 1);
      const payload = JSON.parse(rawString);
      const imageUrl = response.data.substring(response.data.indexOf('display_resources":[{"src":"') + 28, response.data.indexOf('","config_width":640'));

    //  if (this.debug) { console.log(`InstagramObject viewer_has_liked: ${JSON.stringify(payload.entry_data.PostPage[0].graphql.shortcode_media.viewer_has_liked)}`); }
      if (payload.entry_data.PostPage[0].graphql.shortcode_media.viewer_has_liked) {
        this.noLikes = this.noLikes + 1;
        return Promise.resolve();
      }
    //  this.likedInsta({ pageUrl: this.postPageAddress(), imageUrl });
      const insta = { pageUrl: this.postPageAddress(), imageUrl };
      return Promise.resolve(insta);
    })
    .catch((err) => {
      console.log('inside catch1');
      console.log(err);
      //this.rest(target);
      this.apiFailures = this.apiFailures + 1;
      this.noLikes = this.noLikes + 1;
      this.currentIndex = this.currentIndex + 1;
      return Promise.resolve(true);
    });
  }

  likeNext() {
    if (this.debug) { console.log(`InstagramObject likeNext: ${this.type}`); }
    if (this.debug) { console.log(`InstagramObject likeNext this.currentIndex : ${this.currentIndex}`); }
    if (this.debug) { console.log(`InstagramObject likeNext this.arrayOfInstas.length : ${this.arrayOfInstas.length}`); }

    if (this.arrayOfInstas.length === 0 || this.arrayOfInstas.length < this.currentIndex + 1) {
      return this.fill();
    }

    return this.isLiked()
    .then((likedInsta) => {
      if (this.debug) { console.log(`InstagramObject isLiked: ${likedInsta}`); }


      if (!likedInsta) {
        this.currentIndex = this.currentIndex + 1;
        return Promise.resolve(false);
      }

      const instaID = this.arrayOfInstas[this.currentIndex].id;
      const url = `https://www.instagram.com/web/likes/${instaID}/like/`;
      if (this.debug) { console.log(`InstagramObject likeNext for : ${instaID}`); }
        // Accept: 'application/json, text/javascript, */*; q=0.01',
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-CSRFToken': this.csrftoken,
          'X-Instagram-Ajax': '1',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      })
     // return Promise.resolve({status: 200})
      .then((response) => {

        if (response.status !== 200) {
          if (this.debug) { console.log(`InstagramObject likeNext bad status : ${JSON.stringify(response)}`); }
          //need to handle in code what to do if greater than what?
          this.apiFailures = this.apiFailures + 1;

          if (this.apiFailures > 2) {
            const error = new Error('apiFailures');
            this.noLikes = this.noLikes + 1;
            this.currentIndex = this.currentIndex + 1;
            return Promise.resolve(false);
            //return Promise.reject(error);
          }
        }
        if (this.debug) { console.log(`InstagramObject likeNext this.currentIndex : ${this.currentIndex}`); }
        if (this.debug) { console.log(`InstagramObject likeNext this.arrayOfInstas.length : ${this.arrayOfInstas.length}`); }
        this.addLikedInsta(likedInsta);
        this.currentIndex = this.currentIndex + 1;
        this.inSessionLikes = this.inSessionLikes + 1;
        return Promise.resolve(true);
      })
      .catch((err) => {
        console.log('inside catch2');
        console.log(err);
        //this.rest(target);
        this.noLikes = this.noLikes + 1;
        this.currentIndex = this.currentIndex + 1;
        this.apiFailures = this.apiFailures + 1;
        return Promise.resolve(true);
      });
    });
  }
  addAttributes(attributes) {
    this.type = attributes.type;
    this.likes = attributes.likes;
    this.lastLikedEpoch = attributes.lastLikedEpoch;
    this.instagramJSON = attributes.instagramJSON;
    this.frequency = attributes.frequency;
    this.deviation = attributes.deviation;
    return Promise.resolve(attributes);
  }
}


module.exports = InstagramObject;


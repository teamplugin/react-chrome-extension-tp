const InstagramObject = require('./instagram-object');
const Promise = require('bluebird');

class Location extends InstagramObject {
  constructor(customer, instagramJSON, csrftoken, maxLikes, isActive) {
    super(customer, 'location', instagramJSON, csrftoken, maxLikes, isActive);
  }
  searchAddress() {
    const username = this.instagramJSON.name;
    const locationID = this.instagramJSON.id;
    const address = `https://www.instagram.com/explore/locations/${locationID}/${username}/`;
    return address;
  }
  queryAddress() {
    return `https://www.instagram.com/graphql/query/?query_id=17888483320059182&variables={"id":"${this.instagramJSON.id}","first":12,"after":"${this.endCurser}"}`;
  }
  postPageAddress() {
    const username = this.instagramJSON.username;
    const shortcode = this.arrayOfInstas[this.currentIndex].code ? this.arrayOfInstas[this.currentIndex].code : this.arrayOfInstas[this.currentIndex].shortcode;
    const address = `https://www.instagram.com/p/${shortcode}/?taken-by=${username}`;
    return address;
  }
  convertFromNew(payload) {

    return Promise.map(payload.entry_data.LocationsPage[0].graphql.location.edge_location_to_media.edges, item => item.node)
    .then(instas => {

      this.currentIndex = 0;
      this.arrayOfInstas = instas;
      this.instagramJSON = payload.entry_data.LocationsPage[0].graphql.location.edge_location_to_media;
      this.instagramJSON.name = payload.entry_data.LocationsPage[0].graphql.location.slug;
      this.instagramJSON.id = payload.entry_data.LocationsPage[0].graphql.location.id;
      this.currentIndex = 0;
      this.count = payload.entry_data.LocationsPage[0].graphql.location.edge_location_to_media.count;
      this.hasNextPage = payload.entry_data.LocationsPage[0].graphql.location.edge_location_to_media.page_info.has_next_page;
      this.endCurser = payload.entry_data.LocationsPage[0].graphql.location.edge_location_to_media.page_info.end_cursor;
      super.convertFromNew(payload);
      return Promise.resolve(false);
    })
  }
  convertFromNext(payload) {
    return Promise.map(payload.data.location.edge_location_to_media.edges, item => item.node)
  .then((instas) => {
    this.currentIndex = 0;
    this.arrayOfInstas = instas;
    this.count = payload.data.location.edge_location_to_media.count;
    this.hasNextPage = payload.data.location.edge_location_to_media.page_info.has_next_page;
    this.endCurser = payload.data.location.edge_location_to_media.page_info.end_cursor;
    this.loading = false;
    super.convertFromNext(payload);
    return Promise.resolve(false);
  });
  }
}


module.exports = Location;

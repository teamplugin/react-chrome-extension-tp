const InstagramObject = require('./instagram-object');
const Promise = require('bluebird');

class HashTag extends InstagramObject {
  constructor(customer, instagramJSON, csrftoken, maxLikes, isActive) {
    super(customer, 'hashTag', instagramJSON, csrftoken, maxLikes, isActive);
  }
  searchAddress() {
    return `https://www.instagram.com/explore/tags/${this.instagramJSON.name}/`;
  }
  queryAddress() {
    return `https://www.instagram.com/graphql/query/?query_id=17875800862117404&variables={"tag_name":"${this.instagramJSON.name}","first":12,"after":"${this.endCurser}"}`;
  }
  postPageAddress() {
    const shortcode = this.arrayOfInstas[this.currentIndex].code ? this.arrayOfInstas[this.currentIndex].code : this.arrayOfInstas[this.currentIndex].shortcode;
    const address = `https://www.instagram.com/p/${shortcode}/?tagged=${this.instagramJSON.name}`;

    return address;
  }
  convertFromNew(payload) {
    return Promise.map(payload.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.edges, item => item.node)
    .then((instas) => {
      this.currentIndex = 0;
      this.arrayOfInstas = instas;
      this.instagramJSON = payload.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media;
      this.instagramJSON.name = payload.entry_data.TagPage[0].graphql.hashtag.name;
      this.currentIndex = 0;
      this.count = payload.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.count;
      this.hasNextPage = payload.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.page_info.has_next_page;
      this.endCurser = payload.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.page_info.end_cursor;
      super.convertFromNew(payload);
      return Promise.resolve(false);
    });
  }
  convertFromNext(payload) {
    return Promise.map(payload.data.hashtag.edge_hashtag_to_media.edges, item => item.node)
    .then((instas) => {
      this.currentIndex = 0;
      this.arrayOfInstas = instas;
      this.count = payload.data.hashtag.edge_hashtag_to_media.count;
      this.hasNextPage = payload.data.hashtag.edge_hashtag_to_media.page_info.has_next_page;
      this.endCurser = payload.data.hashtag.edge_hashtag_to_media.page_info.end_cursor;
      this.loading = false;
      super.convertFromNext(payload);
      return Promise.resolve(false);
    });
  }
}

module.exports = HashTag;


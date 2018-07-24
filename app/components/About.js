import React, { Component } from 'react';
import StarRatingComponent from 'react-star-rating-component';
import style from './About.css';

export default class About extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      rating: 0
    };
  }
  starSelected = (nextValue, prevValue, name) => {
    console.log(nextValue);
    console.log(prevValue);
    console.log(name);
   // this.setState({ rating });
  }
  render() {
    return (

      <div className={style.content}>


        <p className={style.faqtroubleshooting}>FAQ & Troubleshooting</p>
        <p className={style.gotaquestion}>Got a question? Something doesn't work? Most likely you are not alone and your question got an answer at our evergrowing FAQ page.</p>

        <a className={style.openfaqlink} target="_blank" rel="noopener noreferrer" href="https://teamplugin.com"><p className={style.openfaq}>Open FAQ Page</p></a>
        <hr />

        
      </div>
    );
  }
}

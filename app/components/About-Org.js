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

        <p className={style.faqtroubleshooting}>Debug Info</p>
        <p className={style.gotaquestion}>Found a bug? Help us smash it! Save debug info to a file by clicking blue button below then email this file to us at help@teamplugin.com</p>

        <a className={style.openfaqlink} href="#"><p className={style.openfaq}>SAVE DEBUG INFO TO A FILE</p></a>
        <hr />
        <p className={style.faqtroubleshooting}>Help Us Spread The <i className={'fa fa-heart iconheart'} aria-hidden="true" /></p>

        <p className={style.gotaquestion1}>Enjoy teamplugin? Want more features? Please help us improve by giving a feedback or rating the plugin on Web Store!</p>

        <table>
          <tr>
            <td width="30%">
              <a className={style.openfaqlink} href="#"><p className={style.openfaq}>YES RATE THE APP</p></a>
            </td>

            <td width="30%">
              <a className={style.openfaqlink} href="#"><p className={style.openfaq}>NO WAY!</p></a>
            </td>
          </tr>
        </table>
        <div style={{ fontSize: 24, marginBottom: '30px' }}>
          <StarRatingComponent
            name={'rate1'} /* name of the radio input, it is required */
            value={this.state.rating} /* number of selected icon (`0` - none, `1` - first) */
            starCount={5} /* number of icons in rating, default `5` */
            onStarClick={(nextValue, prevValue, name) => this.starSelected(nextValue, prevValue, name)} /* on icon click handler */
            starColor={'#00D7DA'} /* color of selected icons, default `#ffb400` */
            emptyStarColor={'#ddd'}
          />
        </div>
      </div>
    );
  }
}

import React, { Component } from 'react';
import style from './MainSection.css';
import logo from '../assets/images/logo.png';

export default class InactiveLicense extends Component {
  render() {
    const { licenceStatus } = this.props;

    let message;
    switch (licenceStatus) {
      case 'FREE_TRIAL_EXPIRED':
        message = 'Free Trial Expired!';
        break;
      case 'INACTIVE':
        message = 'Lisence Expired!';
        break;
      default:
        break;
    }

    const bottomMessage = 'To continue using teamplugin, please click above to purchase a license.';

    return (
      <div className={style.content}>
        <img src={logo} alt="Team Plugin" width="45" height="75" className={style.logo} />
        <p className={style.switchText}>{message}</p>
        <a className={style.purchaseLink} target="_blank" rel="noopener noreferrer" href="https://teamplugin"><p className={style.openfaq}>CLICK TO PURCHASE</p></a>
        <p className={style.footerText}>{bottomMessage}</p>
      </div>
    );
  }
}

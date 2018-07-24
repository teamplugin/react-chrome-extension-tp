import React, { Component } from 'react';
import style from './GoPro.css';
import logo from '../assets/images/logo.png';

export default class GoPro extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      rating: 0
    };
  }

  render() {
    return (

      <div className={style.content}>


        <p className={style.gotaquestion}>Double maximum daily speed, unlock advanced posts filtering and task types with <b>Pro Version:</b></p>
        <img src={logo} alt="Team Plugin" width="91" height="150" className={style.logo} align="middle" /> <br />

        <p className={style.alltasks1}>PRO VERSION</p>

        <div className={style.speedup}>
          <p className={style.centerpara1}>Speed upto 1400 likes/day</p>
          <p className={style.centerpara1}>Filter by keywords, users, dates & likes</p>
          <p className={style.centerpara1}>Like your feed & posts by location</p>
          <p className={style.centerpara}>Like posts by users' followers</p>
        </div>

        <table className={style.table2} style={{ margin: '22px 0px 0px 0px' }}>
          <tr>
            <td className={style.td2} width="28%" style={{ textAlign: 'center' }} >
              <span style={{ fontSize: '44px' }} >$</span> <label className={style.switch} style={{ margin: '11px 0px 0px 0px' }} />

              <p className={style.centerpara2}>/month</p>
            </td>

            <td className={style.td3} width="72%"><span className="alltasks1">PURCHASE NOW</span><br />
              <p className={style.gotaquestion21}>Create an account to purchase a Pro License. You will be able to cancel it anytime at<br />
                <a href="#">Create Account</a>
              </p>
            </td>

          </tr>
        </table>

        <p className={style.gotaquestion}>

          <i className="fa fa-lock" aria-hidden="true" /> We use Braintree Payments<sup>TM</sup> to process purchases and do not know your card details.</p>
      </div>
    );
  }
}

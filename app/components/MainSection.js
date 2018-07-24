import React, { Component } from 'react';
import Activity from '../components/Activity';
import style from './MainSection.css';
import logo from '../assets/images/logo.png';

export default class MainSection extends Component {
  render() {
    const isActive = this.props.instas.filter(item => item.isActive === true);
    let message = 'All tasks switched off';
    let bottomMessage = 'teamplugin was stopped. Switch some tasks ON in config screen when you are ready to launch it again.';
    if (this.props.isSleeping){
      bottomMessage = 'teamplugin has reached its set max likes for the day and is sleeping till tommorow';
    } else if (isActive.length > 0) {
      message = `Liking ${isActive[0].title}`;
      bottomMessage = 'teamplugin is active';
    }

    return (
      <div className={style.content}>
        <img src={logo} alt="Team Plugin" width="91" height="150" className={style.logo} />
        <p className={style.switchText}>{message}</p>
        <p className={style.totalText}>Total likes: { this.props.totals.totalLikes }    Today: { this.props.totals.sessionLikes }</p>
        <div className={style.activity}><Activity isSleeping={this.props.isSleeping } instas={ this.props.instas} maxRows={5} goFowardTo={this.props.goFowardTo } /></div>
        <p className={style.footerText}>{bottomMessage}</p>
      </div>
    );
  }
}

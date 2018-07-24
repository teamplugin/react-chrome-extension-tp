import React, { Component } from 'react';
import Activity from '../components/Activity';
import style from './History.css';

export default class History extends Component {
  render() {
    return (
      <div className={style.content} style={{ marginTop: '20px' }}>

        <i className="fa fa-clock-o activityhistory"><span className={style.activityhistory}> Activity History</span></i>
        <p className="gotaquestion">Review or click on a post to open and dislike.</p>

        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fff' }}>
          <tbody>
            <Activity instas={this.props.instas} />
          </tbody>
        </table>

      </div>
    );
  }
}

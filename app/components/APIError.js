import React, { Component } from 'react';
import style from './MainSection.css';


export default class APIError extends Component {

  render() {
    return (
      <p className={style.footerText} style={{color:'#cc0000'}}><b>
      Error hit at {this.props.apiCurrentLimit} likes, you may need to lower your like limit. The extension will auto start tommorow. Start now by clicking   
       <a className={style.config} href="#" onClick={() => this.props.resetAPIBlock()}><span className={style.config}> reset </span> </a></b> </p>)
  }
}

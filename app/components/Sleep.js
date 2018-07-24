import React, { Component } from 'react';
import style from './MainSection.css';


export default class Sleep extends Component {

  render() {
    return (<p className={style.footerText} style={{color:'#cc0000'}}><b>You have reached your daily like limit, the extension will sleep until tommorow. You can adjust your like limit to continue liking at anytime.</b> </p>)
  }
}

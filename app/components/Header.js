import React, { Component } from 'react';
import style from './Header.css';
import gear from '../assets/images/gear_2x.png';
import arrow from '../assets/images/arrow_2x.png';

export default class Header extends Component {
  goTo = (viewName) => {
    this.props.goFowardTo(viewName);
  }
  goBack = () => {
    this.props.goBack();
  }
  render() {


    if (this.props.hasBack) {
      return (
        <header>
          <table style={{ marginTop: '10px' }} width="100%" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td width="48%">
                  <a className={style.config} href="#" onClick={() => this.goBack()}> <img className={style.gear} src={arrow} />
                    <span className={style.config}> BACK </span></a>
                </td>
                <td width="20%" />
                <td width="18%" />
              </tr>
            </tbody>
          </table>

        </header>
      );
    }
    return (
      <header>

        <table width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td width="48%">
                <a className={style.config} href="#" onClick={() => this.goTo('tasks')}> <img className={style.gear} src={gear} />
                  <span className={style.config}> CONFIGURE TASKS </span></a>
              </td>
              <td width="20%"  />

              <td width="18%">
                <a className={style.config} href="#" onClick={() => this.goTo('about')}>
                  <p className={style.goback}>FAQs</p>
                </a>
              </td>
            </tr>
          </tbody>
        </table>

      </header>
    );
  }
}

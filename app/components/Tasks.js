import React, { Component } from 'react';
import { HashLoader } from 'react-spinners';
import Switch from './Switch';
import style from './Tasks.css';
import AddItem from './AddItem';
import EditItem from './EditItem';

import addStyle from './AddItem.css';

export default class Tasks extends Component {
  static getTitle(insta) {

    if ('user' in insta) {
      return insta.user.username;
    }
    if ('hashtags' in insta) {
      return `#${insta.hashtag.name}`;
    }
    if ('location' in insta) {
      return `#${insta.location.title}`;
    }
  }
  constructor(props, context) {
    super(props, context);
    this.state = {
      instas: [],
      totalRows: 0,
      switched: false,
      maxLikeError: false,
      addItem: false,
      addingNewInsta: false,
      ...this.props.totals,
      selectedInsta: null
    };
  }
  handleMaxLikesUpdate = (event) => {

    const { sessionLikes } = this.props.totals;

    let likes = event.target.value;

    if (likes.length > 1) {
      if (likes.charAt(0) === '0') {
        likes = likes.substr(1);
      }
    }

    likes = parseInt(likes);
    //likes = likes < sessionLikes ? sessionLikes : likes;
    likes = likes > 0 ? likes : '';
    const maxLikeError = likes < sessionLikes;


    this.setState({ maxLikes: likes, maxLikeError });

    if (likes > sessionLikes) {
      chrome.runtime.sendMessage({ type: 'updateMaxLikes', maxLikes: likes }, (response) => {
        this.props.refresh();
      });
    }
  }
  addInsta = (insta) => {

    this.toggleSubView('addItem');
    this.setState({ addingNewInsta: true }, () => {

      chrome.runtime.sendMessage({ type: 'newInsta', insta }, (response) => {

        this.props.refresh();
        this.setState({ addingNewInsta: false });
      });
    });
  }
  editInsta = (insta) => {

    this.toggleSubView('editItem');
    this.setState({ addingNewInsta: true }, () => {
      chrome.runtime.sendMessage({ type: 'updateInsta', insta }, (response) => {
        this.props.refresh();
        this.setState({ addingNewInsta: false });
      });
    });
  }
  deleteInsta = (insta) => {
    this.toggleSubView('editItem');
    this.setState({ addingNewInsta: true }, () => {
      chrome.runtime.sendMessage({ type: 'deleteInsta', insta }, (response) => {
        this.props.refresh();
        this.setState({ addingNewInsta: false });
      });
    });
  }
  toggleSwitch(title, event) {
    const instas = this.props.instas.slice();
    const toggledInsta = instas.filter(item => item.title === title);
    if (toggledInsta.length > 0) {
      toggledInsta[0].isActive = event;
      const insta = toggledInsta[0];
      chrome.runtime.sendMessage({ type: 'updateInsta', insta }, (response) => {
        this.setState({ instas: response.instas, ...response.totals });
      });
    }
  }
  toggleSubView = (view, selectedInsta) => {
    const current = this.state[view];
    const temp = {};
    temp[view] = !current;
    temp.selectedInsta = selectedInsta;
    this.setState(temp);
  }
  makeRows(instas) {
    const rows = [];
    for (let index = 0; index < instas.length; index += 1) {
      const nextRow = this.makeRow(instas[index]);
      rows.push(nextRow);
    }
    return rows;
  }
  makeRow(insta) {
    return (
      <tr key={insta.title} className={style.tr2} >
        <td className={style.td2} width="28%"><span className={style.hashTag}>#</span>
          <div
            style={{
              margin: '11px 0px 0px 0px'
            }}
          >
            <Switch isOn={insta.isActive} onToggle={event => this.toggleSwitch(insta.title, event)} />
          </div>
        </td>

        <td className={style.td3} width="72%" onClick={() => this.toggleSubView('editItem', insta)}>
          <div><span style={{ fontSize: '18px' }}>{ insta.type === 'hashTag' ? `#${insta.title}` : insta.title } </span></div>
          <span style={{ fontSize: '14px' }}>Advances settings available in future pro version only</span>
        </td>
      </tr>
    );
  }
  render() {
    const { maxLikeError } = this.state
    const { sessionLikes, maxLikes } = this.props.totals
    const progress = (this.props.totals.sessionLikes / this.props.totals.maxLikes) * 100;
    const progressPercent = `${progress > 0 ? progress : 0}%`;

    const barStyle = {
      width: progressPercent,
      height: '15px',
      backgroundColor: '#00D7DA',
      margin: '-11px 0px 20px 0px'
    };

    let lastRow;

    if (this.state.addItem) {
      return <AddItem close={() => this.toggleSubView('addItem')} save={item => this.addInsta(item)} />;
    }

    if (this.state.editItem) {
      return <EditItem insta={this.state.selectedInsta} close={() => this.toggleSubView('editItem')} save={item => this.editInsta(item)} delete={item => this.deleteInsta(item)} />;
    }

    if (this.state.addingNewInsta) {
      lastRow = (<tr>
        <td className={style.td2} width="28%" >
          <HashLoader color={'#00D7DA'} size={35} loading={this.state.loading} />
        </td>
      </tr>);
    } else {
      lastRow = (
        <tr style={{ cursor: 'pointer' }} onClick={() => this.toggleSubView('addItem')}>
          <td className={style.tdAddTask} width="28%" >
            <span className={style.addtask} style={{ fontSize: '22px' }}>+ Add Task</span>
          </td>
        </tr>
      );
    }


    return (

      <div className={style.content}>
        <hr className={style.line} />

        <table width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>

              <td width="48%">
                <i className={style.likesTitle}>Daily likes</i>
              </td>

              <td width="16%" />

              <td width="32%">
                <p className={style.likesCount}><b>{ this.props.totals.sessionLikes }</b> of { this.props.totals.maxLikes }</p>
              </td>

            </tr>
          </tbody>
        </table>

        <div
          style={{
            width: '100%',
            backgroundColor: '#f0f0f0',
            marginTop: '5px'
          }}
        > <div
          style={barStyle}
        /></div>
        
        <div>
          <p className={addStyle.gotaquestion111}>Like Limit Per Day <br/>
          {maxLikeError ? <span className={addStyle.gotaquestion112}>Must Be greater than current like count of { sessionLikes }</span>  : null}</p>
          <div className={addStyle.container}>
          <input
            type="text"
            placeholder="Eg - 1400"
            onChange={this.handleMaxLikesUpdate.bind(this)}
            value={this.state.maxLikes}
          />
        </div>

        </div>

        <hr className={style.line} />

        <table
          width="100%" cellPadding="0" cellSpacing="0"
          style={{ borderSpacing: '0px 12px' }}
        >
          <tbody>
            { this.makeRows(this.props.instas) }
          </tbody>
        </table>


        <table
          className={style.table2} style={{
            margin: '5px 0px 20px 0px'
          }}
        >
          <tbody>
            {lastRow}
          </tbody>
        </table>
      </div>
    );
  }
}



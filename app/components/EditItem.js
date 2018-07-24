import React, { Component } from 'react';
import { HashLoader } from 'react-spinners';
import style from './AddItem.css';

import hashtagIcon from '../assets/images/hash_2x.png';
import locationIcon from '../assets/images/location_2x.png';
import deleteIcon from '../assets/images/delete_forever_2x.png';

export default class EditItem extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { ...this.props.insta };
  
  }
  setSearchValue = (event) => {

    let searchValue = event.target.value;
    if (searchValue.charAt(0) === '#') {
      searchValue = searchValue.substr(1);
    }

    this.setState({ searchValue,
      selectionTitle: event.target.value,
      showResultList: true },
      this.delayTimer);
  }
  close = () => {
    this.props.close();
  }
  delete = () => {

    this.props.delete(this.state);
  }
  save = () => {
    this.props.save(this.state);
  }
  maxLikesValue = (event) => {
    this.setState({ maxLikes: event.target.value });
  }
  inputSelected(name, event) {
    this.setState({ [name]: event });
  }
  delayTimer = () => {
    if ('intervalId' in this.state) { clearInterval(this.state.intervalId); }
    const intervalId = setInterval(this.performSearch, 1000);
    this.setState({ intervalId });
  }
  performSearch = () => {

    clearInterval(this.state.intervalId);
    if (!this.state.searching) {
      this.setState({ searching: true }, this.search);
    }
  }
  search = () => {
    const url = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${this.state.searchValue}`;


    fetch(url, {
      method: 'GET'
    })
    .then((response) => {
      if (response.status !== 200) {
      //need to handle in code what to do if greater than what?
        this.apiFailures = this.apiFailures + 1;
        if (this.apiFailures > 2) {
          const error = new Error('apiFailures');
          return Promise.reject(error);
        }
      }
      return response.json()
    .then((result) => {
   

      let users = [];
      let hashtags = [];
      let places = [];

      if ('users' in result) {
        users = result.users;
      }
      if ('hashtags' in result) {
        hashtags = result.hashtags;
      }
      if ('places' in result) {
        places = result.places;
      }

      this.setState({
        users,
        hashtags,
        places,
        searching: false
      });
     // return Promise.resolve(true);
    });

   // this.setState('searchResult':res)
    });
  }
  selectRow = (selection, selectionTitle) => {

    this.setState({ selection, selectionTitle, showResultList: false });
  }
  makeRows() {
    const rows = [];
 
    const combinedResult = [...this.state.users, ...this.state.hashtags, ...this.state.places]; //need to add locations

    combinedResult.sort((a, b) => a.position - b.position);

    for (let index = 0; index < combinedResult.length; index += 1) {
      const item = combinedResult[index];
      let image = null;
      let title = null;
      let selectionTitle = '';
      if ('user' in item) {
        image = <img key={`img${index}`} src={item.user.profile_pic_url} width="35" height="35" />;
        title = <p key={`p${index}`}><b key={`b${index}`}> {item.user.username}</b><br />{item.user.full_name} </p>;
        selectionTitle = item.user.username;
      } else if ('hashtag' in item) {
        image = <img key={`img${index}`} src={hashtagIcon} width="35" height="35" />;
        title = <p key={`p${index}`}><b key={`b${index}`}> {item.hashtag.name}</b><br />{item.hashtag.media_count} </p>;
        selectionTitle = `#${item.hashtag.name}`;
      } else if ('place' in item) {
        image = <img key={`img${index}`} src={locationIcon} width="20" height="27" />;
        title = <p key={`p${index}`}><b key={`b${index}`}> {item.place.title}</b><br />{item.place.subtitle} </p>;
        selectionTitle = item.place.title;
      }

      rows.push(<tr key={`tr${index}`} onClick={() => this.selectRow(item, selectionTitle)}><td key={`td1${index}`} width="20%" align="left">
        {image}</td><td key={`td2${index}`} width="80%" align="left">{title} </td></tr>
      );
    }

    return rows;
  }
  render() {
    let subSection;

    if (this.state.searching) {
      subSection = (
        <table style={{ marginTop: '20px', marginBottom: '50px' }} width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr><td width="100%" align="center" ><HashLoader color={'#00D7DA'} size={35} loading={this.state.loading} /></td></tr>
          </tbody>
        </table>);
    } else if (this.state.showResultList) {
      subSection = (
        <table style={{ marginTop: '20px', marginBottom: '50px' }} width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            { this.makeRows() }
          </tbody>
        </table>
          );
    } else {
      subSection = (
        <div>
          <p className={style.gotaquestion111}>likes per day</p>
          <div className={style.container}>
            <input
              type="text"
              placeholder="Eg - 700"
              onChange={this.maxLikesValue.bind(this)}
              value={this.state.maxLikes}
            />
          </div>
          {/*
          <label className={style.containercbox}>Do not like my posts
            <input
              type="checkbox"
              onClick={event => this.inputSelected('notMyPosts', event)}
            />
            <span className={style.checkmarkcbox} />
          </label>
          <label className={style.containercbox}>Do not like posts with ads
            <input
              type="checkbox"
              onClick={event => this.inputSelected('noAdPosts', event)}
            />
            <span className={style.checkmarkcbox} />
        </label>*/}
        </div>

      );
    }


    return (

      <div className={style.content}>

        <hr className={style.line} />

        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fff', marginTop: '20px' }}>
          <tbody>
            <tr>
              <td width="10%" valign="middle" align="left">
                <a className={style.goback1} onClick={this.save} href="#">SAVE</a>
              </td>

              <td width="30%">
                <a className={style.goback1} onClick={this.close} href="#">CANCEL</a>
              </td>

              <td width="16%" valign="middle" align="center">
                <p />
              </td>

              <td width="16%" valign="middle" align="center">
                <div style={{ marginTop: '0px' }}><a className={style.goback1} onClick={this.delete} href="#"><img role="presentation" src={deleteIcon} width="12" height="18" /></a></div>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginBottom: '50px', marginTop: '20px' }}>
          {subSection}
        </div>
      </div>
    );
  }
}

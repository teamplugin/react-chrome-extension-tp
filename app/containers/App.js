import React, { Component } from 'react';
import Header from '../components/Header';
import APIError from '../components/APIError';
import Sleep from '../components/Sleep';
import MainSection from '../components/MainSection';
import InactiveLicense from '../components/InactiveLicense';
import History from '../components/History';
import Tasks from '../components/Tasks';
import About from '../components/About';
import GoPro from '../components/GoPro';
import { HashLoader } from 'react-spinners';

export default class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      currentViews: ['main'],
      instas: [],
      totals: {},
      loading: true,
      apiBlocked: false
    };
  }
  componentDidMount() {
    this.refreshInstas();
   /* chrome.runtime.sendMessage({ type: 'getInstas' }, (response) => {
    //  this.setState({ instas: response.instas, totals: response.totals, loading: response.loading, apiCurrentLimit: response.apiCurrentLimit, apiBlocked: response.apiBlocked, isSleeping: response.isSleeping });
      this.setState({ ...response });
    });*/
  }
  setListener = () => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'instaUpdate') {
        this.setState({ ...request });
        //this.setState({ instas: request.instas, totals: request.totals });
      } else if (request.type === 'lisenceUpdate') {
        this.setState({ licenseStatus: request.licenseStatus });
      }
    });
  }
  refreshInstas = () => {
    chrome.runtime.sendMessage({ type: 'getInstas' }, (response) => {
      this.setState({ ...response });
      this.setListener();
     // this.setState({ instas: response.instas, totals: response.totals, loading: response.loading, apiCurrentLimit: response.apiCurrentLimit, apiBlocked: response.apiBlocked });
    });
  }
  resetAPIBlock = () => {
    chrome.runtime.sendMessage({ type: 'resetAPIBlock' }, () => {
      this.refreshInstas();
    });
  }
  goFowardTo = (viewName) => {
    const temp = this.state.currentViews.slice();
    temp.push(viewName);
    this.setState({ currentViews: temp });
  }
  goBack = () => {
    const temp = this.state.currentViews.slice(0, -1);
    this.setState({ currentViews: temp });
  }
  render() {

    const { loading, licenseStatus, instas, totals } = this.state;

    if (loading) {
      return (
        <table width="100%" height="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td width="25%"><HashLoader color={'#00D7DA'} size={35} loading={loading} /></td>
            </tr>
            <tr>
            <td width="75%">Loading session...</td>
          </tr>
            <tr>
              <td width="100%"><p>You must be signed into Instagram for the extension to work.</p></td>
            </tr>
          </tbody>
        </table>
      );
    }

    const activeViewName = this.state.currentViews[this.state.currentViews.length - 1];
    let activeView;
    let header;

    switch (activeViewName) {
      case 'main':
        if (licenseStatus === 'FREE_TRIAL_EXPIRED' || licenseStatus === 'INACTIVE') {
          activeView = <InactiveLicense />;
          header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack={false} />;
        } else {
          activeView = <MainSection instas={instas} totals={totals} isSleeping={this.state.isSleeping} goFowardTo={this.goFowardTo} refresh={this.refreshInstas} />;
          header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack={false} />;
        }
        break;
      case 'history':
        activeView = <History instas={this.state.instas} totals={this.state.totals} refresh={this.refreshInstas} />;
        header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack />;
        break;
      case 'tasks':
        if (licenseStatus === 'FREE_TRIAL_EXPIRED' || licenseStatus === 'INACTIVE') {
          activeView = <InactiveLicense />;
          header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack={false} />;
        } else {
          activeView = <Tasks instas={this.state.instas} totals={this.state.totals} refresh={this.refreshInstas} />;
          header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack />;
        }
        break;
      case 'about':
        activeView = <About />;
        header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack refresh={this.refreshInstas} />;
        break;
      case 'goPro':
        activeView = <GoPro />;
        header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack refresh={this.refreshInstas} />;
        break;
      default:
        activeView = <MainSection refresh={this.refreshInstas} />;
        header = <Header goBack={this.goBack} goFowardTo={this.goFowardTo} hasBack={false} />;
    }

    return (
      <div>
        {header}
        { this.state.apiBlocked ? <APIError apiCurrentLimit={this.state.apiCurrentLimit} resetAPIBlock={this.resetAPIBlock} /> : this.state.isSleeping ? <Sleep /> : null}
        {activeView}
      </div>
    );
  }
}

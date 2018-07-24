import React, { Component } from 'react';
import Moment from 'react-moment';
import style from './Activity.css';

import thumbnail from '../assets/images/more_2x.png';

export default class Activity extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      columns: 5,
      maxRows: 5,
      images: ['ant', 'bison', 'camel', 'duck', 'elephant', 'ant', 'bison', 'camel', 'duck', 'elephant', 'ant', 'bison', 'camel', 'duck', 'elephant', 'ant', 'bison', 'camel', 'duck', 'elephant', 'ant', 'bison', 'camel', 'duck', 'elephant', 'ant', 'bison', 'camel', 'duck', 'elephant'],
      totalRows: 0
    };
  }
  makeTables() {


   // type: "hashTag"

    const tables = [];
    for (let index = 0; index < this.props.instas.length; index += 1) {

      
      const hashTag = this.props.instas[index].type === 'hashTag' ? '#' : '';

      const liking = this.props.instas[index].isAwake ? ( this.props.instas[index].isActive ? true : false ) : false
      tables.push(
        <div key={`div${index}`}>
          <p key={`p1${index}`} className="hashtag"> <span key={`sp1${index}`} className={style.hashtag} style={{ textAlign: 'left' }}>{`${hashTag}${this.props.instas[index].title}`} </span><br/>
          {this.props.isSleeping ? null : <span style={{fontSize: 12 }}> {this.props.instas[index].isAwake ?  this.props.instas[index].isActive ? ' is currently liking' : 'is off' : this.props.instas[index].isActive ? <span> is resting until <Moment format="ddd, MMM Do, h:mm a" >{this.props.instas[index].restPeriodEpoch}</Moment></span>: 'is off'}</span>} </p>
          <table key={`table${index}`} width="100%" cellPadding="0" cellSpacing="0">
            <tbody key={`tbody${index}`}>
              { this.makeRows(this.props.instas[index].likes) }
            </tbody>
          </table>
        </div>
      );
    }

    return tables;
  }
  makeRows(images) {
    const rows = [];
    let currentRow = 0;
    let end = this.state.columns;
    //const images = this.props.instas.liked;
    let maxRows = -1;
    if ('maxRows' in this.props) {
      maxRows = this.props.maxRows;
    }

    //for (let index = 0; index < this.props.instas.length; index += 1) {
      //rows.push(<tr key={`trh${index}`} > <td key={`tdh${index}`} ><p key={`p1${index}`} className="hashtag"> <span key={`sp1${index}`} className={style.hashtag} style={{ textAlign: 'left' }}>{this.props.instas[index].title}</span></p></td></tr>);
    let isLast = false;
     // const images = this.props.instas[index].liked;
     // console.log('top')
    for (let index = 0; index < images.length; index += 1) {
  
    // for (let index = 0; index < (images.length / this.state.columns); index += 1) {
      if (isLast) {
         // break;
      }
      const nextImages = images.slice(currentRow, end);
      currentRow = end;
      end += this.state.columns;
      if (maxRows > 0) {
        if (end > (maxRows * this.state.columns)) {
     
          isLast = true;
          const nextRow = this.makeRow(nextImages, isLast, index, index);
          rows.push(nextRow);
          break;
        }
      }
      const nextRow = this.makeRow(nextImages, isLast, index, index);
      rows.push(nextRow);
    }
    //}
    //console.log(rows)
    return rows;
  }
  makeRow(images, isLast, sectionIndex, rowIndex) {
    const row = [];


    //const max = (images.length > this.props.maxRows ? this.props.maxRows : images.length);

    for (let index = 0; index < images.length; index += 1) {

      if (!isLast) {
        row.push(<td key={`td${sectionIndex}${index}`} width="19.999%" ><a key={`a${index}`} rel="noopener noreferrer" target="_blank" href={images[index].pageUrl}><img key={`img${index}`} src={images[index].imageUrl} width="54" height="54" /></a></td>);
      } else if (index + 1 < this.state.columns) {
        row.push(<td key={`td${sectionIndex}${index}`} width="19.999%" ><a key={`a${index}`} rel="noopener noreferrer" target="_blank" href={images[index].pageUrl}><img key={`img${index}`} src={images[index].imageUrl} width="54" height="54" /></a></td>);
      } else {
    
        row.push(<td key={`td${sectionIndex}${index}`} width="19.999%" ><a key={`a${index}`} href="#" onClick={() => { this.props.goFowardTo('history'); }} ><img key={`img${index}`} src={thumbnail} width="30" height="7" /></a></td>);
      }
    }
    return (<tr key={`tr${sectionIndex}${rowIndex}`}>{row}</tr>);
  }
  render() {
    return (
      <div style={{ topMargin: '20px' }}>
        {this.makeTables()}
      </div>
    );
  }
}

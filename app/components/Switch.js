import React, { Component } from 'react';
import Toggle from 'react-toggled';
//import './Switch.css';

export default class Switch extends Component {
  toggleSwitch = (event) => {
    this.props.onToggle(event);
  }
  render() {
    return (
      <Toggle
        onToggle={this.toggleSwitch}
        on={this.props.isOn}
      >

        {({ on, getTogglerProps }) => (
          <span
            className="container"
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '60px',
              height: '34px'
            }}
          >
            <input
              type="checkbox"
              style={{
                width: '100%',
                height: '100%',
                margin: 0
              }}
              {...getTogglerProps()}
            />
            <span
              className="switch"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <span
                className="track"
                style={{
                  flex: 1,
                  height: '100%',
                  borderRadius: '34px',
                  background: on ? '#00D7DA' : '#ccc'
                }}
              />
              <span
                className="slider"
                style={{
                  position: 'absolute',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'transform 0.4s',
                  transform: on ? 'translateX(28px)' : 'translateX(5px)'
                }}
              />
            </span>
          </span>
    )}
      </Toggle>
    );
  }
}

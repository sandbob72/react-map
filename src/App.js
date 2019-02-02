/*global google*/ 
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Map, InfoWindow, Marker, GoogleApiWrapper } from 'google-maps-react';

class App extends Component {

  render() {
    const style = {
      width: '100%',
      height: '100%'
    }
    // var points = [
    //   { lat: 7.50, lng: 97.00 },
    //   { lat: 7.50, lng: 97.05 },
    //   { lat: 7.50, lng: 97.00 },
    //   { lat: 7.50, lng: 97.05 }
    // ]

    // var bounds = new this.props.google.maps.LatLngBounds(); ใช้ปรับตำแหน่งกึ่งกลางและซูมของแผนที่
    // for (var i = 0; i < points.length; i++) {
    // bounds.extend(points[i]);
    // }
    return (
      <div className="App">
        <Map google={this.props.google}
          style={{ width: '100%', height: '100%', position: 'relative' }}
          className={'map'}
          zoom={14}>
          <Marker
            title={'The marker`s title will appear as a tooltip.'}
            name={'SOMA'}
            position={{ lat: 37.778519, lng: -122.405640 }} />
          <Marker
            name={'Dolores park'}
            position={{ lat: 37.759703, lng: -122.428093 }} />
          <Marker />
          <Marker
            name={'Your position'}
            position={{ lat: 37.762391, lng: -122.439192 }}
            icon={{
              url: "/path/to/custom_icon.png",
              anchor: new google.maps.Point(32, 32),
              scaledSize: new google.maps.Size(64, 64)
            }} />
        </Map>
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: ('AIzaSyBSfx44Vbst39S5gSLKqbo4kbqpgDo0rdE')
})(App)
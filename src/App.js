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
          style={style}
          initialCenter={{
            lat: 7.89441,
            lng: 98.352656
          }}
          // bounds={bounds} กำหนดขอบเขต 
          zoom={15}
          onClick={this.onMapClicked}>

          <Marker onClick={this.onMarkerClick}
            name={'Current location'} />

          <InfoWindow onClose={this.onInfoWindowClose}>

          </InfoWindow>
        </Map>
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: ('AIzaSyBSfx44Vbst39S5gSLKqbo4kbqpgDo0rdE')
})(App)
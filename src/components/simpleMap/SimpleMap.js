/*global google*/
import React, { Component } from 'react';
// import './App.css';
import { Map, InfoWindow, Marker, GoogleApiWrapper } from 'google-maps-react';

class SimpleMap extends Component {
  state = {
    showingInfoWindow: false,
    activeMarker: {},
    selectedPlace: {},
  };

  onMarkerClick = (props, marker, e) =>
    this.setState({
      selectedPlace: props,
      activeMarker: marker,
      showingInfoWindow: true
    });

  onMapClicked = (props) => {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null
      })
    }
  };

  

  render() {
    // const style = {
    //   width: '100%',
    //   height: '100%'
    // }
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
      <div>
        <Map google={this.props.google}
          style={{ width: '100%', height: '100%', position: 'relative' }}
          initialCenter={{
            lat: 13.724717,
            lng: 100.633072
          }}
          className={'map'}
          zoom={6}
          onClick={this.onMapClicked}>
          <Marker
            position={{ lat: 13.724717, lng: 100.633072 }}
            onClick={this.onMarkerClick}
            name={'กรุงเทพมหานคร'} />
            <Marker
            position={{ lat: 8.090982, lng: 98.908117 }}
            onClick={this.onMarkerClick}
            name={'กระบี่'} />
            <Marker
            position={{ lat: 10.497312, lng: 99.164224 }}
            onClick={this.onMarkerClick}
            name={'ชุมพร'} />
            <Marker
            position={{ lat: 7.556819, lng: 99.6098568 }}
            onClick={this.onMarkerClick}
            name={'ตรัง'} />
            <Marker
            position={{ lat: 8.430162, lng: 99.933542 }}
            onClick={this.onMarkerClick}
            name={'นครศรีธรรมราช'} />
            <Marker
            position={{ lat: 6.424768, lng: 101.806620 }}
            onClick={this.onMarkerClick}
            name={'นราธิวาส'} />
            <Marker
            position={{ lat: 6.762197, lng: 101.311243 }}
            onClick={this.onMarkerClick}
            name={'ปัตตานี'} />
            <Marker
            position={{ lat: 8.454399, lng: 98.509614 }}
            onClick={this.onMarkerClick}
            name={'พังงา'} />
            <Marker
            position={{ lat: 7.614617, lng: 100.073829 }}
            onClick={this.onMarkerClick}
            name={'พัทลุง'} />
            <Marker
            position={{ lat: 7.952629, lng: 98.331158 }}
            onClick={this.onMarkerClick}
            name={'ภูเก็ต'} />
            <Marker
            position={{ lat: 6.539778, lng: 101.273267 }}
            onClick={this.onMarkerClick}
            name={'ยะลา'} />
            <Marker
            position={{ lat: 9.953405, lng: 98.599058 }}
            onClick={this.onMarkerClick}
            name={'ระนอง'} />
            <Marker
            position={{ lat: 7.189657, lng: 100.595053 }}
            onClick={this.onMarkerClick}
            name={'สงขลา'} />
            <Marker
            position={{ lat: 6.621256, lng: 100.0652563 }}
            onClick={this.onMarkerClick}
            name={'สตูล'} />
            <Marker
            position={{ lat: 9.145186, lng: 99.296987 }}
            onClick={this.onMarkerClick}
            name={'สุราษฎร์ธานี'}/>

          
          <InfoWindow
            marker={this.state.activeMarker}
            visible={this.state.showingInfoWindow}>
            <div>
              <h1>{this.state.selectedPlace.name}</h1>
            </div>
          </InfoWindow>
        </Map>

        {/* <Map google={this.props.google}
          onClick={this.onMapClicked}
          className={'map'}
              zoom={14}>
        <Marker onClick={this.onMarkerClick}
                name={'Current location'} />
 
        <InfoWindow
          marker={this.state.activeMarker}
          visible={this.state.showingInfoWindow}>
            <div>
              <h1>{this.state.selectedPlace.name}</h1>
            </div>
        </InfoWindow>
      </Map> */}
      </div>
    );
  }
}

export default GoogleApiWrapper({
  apiKey: ('AIzaSyBSfx44Vbst39S5gSLKqbo4kbqpgDo0rdE')
})(SimpleMap)
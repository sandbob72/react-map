/*global google*/
import React, { Component } from 'react';
import './App.css';
import CustomPaginationActionsTable from './components/CustomPaginationActionsTable'
import SimpleTabs from './components/SimpleTabs'
import SimpleMap from './components/SimpleMap'
import { BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar } from 'recharts';
import MapVtwo from './components/MapVtwo'
import ReactSimpleMaps from './components/ReactSimpleMaps'


class App extends Component {

  render() {
    let data = [{ name: 'a', pv: 12, uv: 15 }]
    
    return (
      <div className="App">
        <SimpleTabs />
        <MapVtwo />
        <ReactSimpleMaps/>
        {/* <BarChart width={730} height={250} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" fill="#8884d8" />
          <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart> */}
      </div>
    );
  }
}

export default App
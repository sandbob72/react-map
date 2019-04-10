/*global google*/
import React, { Component } from 'react';
import './App.css';
import SimpleTabs from './components/SimpleTabs'
import { BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Bar } from 'recharts';
import MapVtwo from './components/simpleMap/MapVtwo'
import WithReactTooltipThai from './components/react-simple-maps/WithReactTooltipThai'
import WithReactTooltipWorld from './components/react-simple-maps/WithReactTooltipWorld'
import Index from './components/react-simple-maps/Index'
import Index2 from './components/react-simple-maps/Index2'



class App extends Component {

  render() {
    let data = [{ name: 'a', pv: 12, uv: 15 }]
    
    return (
      <div className="App">
      <Index/>
      {/* <Index2/> */}
        {/* <SimpleTabs /> */}
        {/* <MapVtwo /> */}
        {/* <h1>v.1</h1> */}
        {/* <WithReactTooltipThai/> */}
        {/* <h1>v.2</h1> */}
        {/* <WithReactTooltipWorld/> */}
        {/* <h1>v.3</h1> */}
        {/* <Index /> */}

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
/*global google*/
import React, { Component } from 'react';
import './App.css';
import CustomPaginationActionsTable from './components/CustomPaginationActionsTable'
import SimpleTabs from './components/SimpleTabs'
import SimpleMap from './components/SimpleMap'

class App extends Component {

  render() {
    
    
    return (
      <div className="App">
        <SimpleTabs />
      </div>
    );
  }
}

export default App
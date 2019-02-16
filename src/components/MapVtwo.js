import React from 'react';


function new_script(src) {
    return new Promise(function(resolve, reject){
      var script = document.createElement('script');
      script.src = src;
      script.addEventListener('load', function () {
        resolve();
      });
      script.addEventListener('error', function (e) {
        reject(e);
      });
      document.body.appendChild(script);
    })
  };
  // Promise Interface can ensure load the script only once.
  var my_script = new_script('countrymap.js');
  
  class MapVtwo extends React.Component {
  
    constructor(props) {
      super(props);
      this.state = {
        status: 'start'
      };
    }
  
    do_load = () => {
      var self = this;
      my_script.then(function() {
        self.setState({'status': 'done'});
      }).catch(function() {
        self.setState({'status': 'error'});
      })
    }
  
    render() {
      var self = this;
      if (self.state.status === 'start') {
        self.state.status = 'loading';
        setTimeout(function () {
          self.do_load()
        }, 0);
      }
  
      return (
        <div>{self.state.status}   {self.state.status === 'done' && 'here you can use the script loaded'}
        <div id="map"></div>
        </div>
      );
    }
  }   
        
export default MapVtwo;
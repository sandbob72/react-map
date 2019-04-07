import React, { Component } from "react"
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from "react-simple-maps"
import { scaleLinear } from "d3-scale"
import ReactTooltip from "react-tooltip"
import Tabletop from 'tabletop';
import { Spinner } from 'react-bootstrap'

const wrapperStyles = {
  width: "100%",
  maxWidth: 980,
  margin: "0 auto",
}

const colorScale = scaleLinear()
  .domain([1, 1200])
  .range(["#FBE9E7", "#FF5722"])

const SpinnerPage = () => {
    return (
      <>
        <div>
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
          </div>
      </>
    );
  }  

class AlbersUSA extends Component {
  constructor() {
    super()
    this.state = {
      population: [],
    }
  }
  componentDidMount() {
    Tabletop.init({
      key: '1q66ZlEv6Rj8_BT1h7Dw78kTL-ietR6deNufgflj8n3c',
      callback: googleData => {
        this.setState({
          population: googleData.Sheet2.elements
        })
        console.log('population: ', googleData.Sheet2.elements)
      },
      simpleSheet: false
    })
    setTimeout(() => {
      ReactTooltip.rebuild()
    }, 5000)
  }
  render() {

    const { population } = this.state
    if (population.length === 0) {
      return SpinnerPage()
    }

    return (
      <div style={wrapperStyles}>
        <ComposableMap
          projectionConfig={{
            scale: 4000,
          }}
          width={980}
          height={1051}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          <ZoomableGroup center={[100, 14]} disablePanning>
            <Geographies geography="/gadm36_THA_1.json" disableOptimization>
              {(geographies, projection) =>
                geographies.map((geography, i) => {
                  const statePopulation = population.find(s =>
                    s.name === geography.properties.NAME_1
                  ) || {}
                  console.log('NAME_1',geography.properties.NAME_1);
                  console.log('pop', statePopulation.name);
                  return (
                    <Geography
                      key={`state-${geography.properties.ID_1}`}
                      cacheId={`state-${geography.properties.ID_1}`}
                      round
                      data-tip={statePopulation.name}
                      geography={geography}
                      projection={projection}
                      style={{
                        default: {
                          fill: colorScale(+statePopulation.pop),
                          stroke: "#607D8B",
                          strokeWidth: 0.75,
                          outline: "none",
                        },
                        hover: {
                          fill: "#607D8B",
                          stroke: "#607D8B",
                          strokeWidth: 0.75,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#FF5722",
                          stroke: "#607D8B",
                          strokeWidth: 0.75,
                          outline: "none",
                        },
                      }}
                    />
                  )
                }
                )}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        <ReactTooltip />
      </div>
    )
  }
}

export default AlbersUSA
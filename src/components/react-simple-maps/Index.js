import React, { Component } from "react"
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from "react-simple-maps"
import { scaleLinear } from "d3-scale"
import { csv } from "d3-fetch"
import ReactTooltip from "react-tooltip"
import Tabletop from 'tabletop';

const wrapperStyles = {
  width: "100%",
  maxWidth: 980,
  margin: "0 auto",
}

const colorScale = scaleLinear()
  .domain([1, 1200])
  .range(["#FBE9E7", "#FF5722"])

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

        // console.log('data1: ', googleData)
        // console.log('data1 sheet1: ', googleData.Sheet1)
        console.log('population: ', googleData.Sheet2.elements)
      },
      simpleSheet: false
    })
    // csv("/populationThai.csv")
    //   .then(population => {
    //     this.setState({ population })
    //   })
  }
  render() {

    const { population } = this.state

    return (
      <div style={wrapperStyles}>
        <ComposableMap
          // projection="albersUsa"
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
                  return (
                    <Geography
                      key={`state-${geography.properties.ID_1}`}
                      cacheId={`state-${geography.properties.ID_1}`}
                      round
                      data-tip={geography.properties.NAME_1}
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
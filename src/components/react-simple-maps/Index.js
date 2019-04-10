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
import Typed from 'react-typed'
import { get } from "axios"
import { feature } from "topojson-client"
import { Motion, spring } from "react-motion"

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
        {/* <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner> */}
        <Typed
          strings={['Please wait...', 'loading...']}
          typeSpeed={40}
        />
      </div>
    </>
  );
}

class AlbersUSA extends Component {
  constructor() {
    super()
    this.state = {
      population: [],
      geographyPaths: [],
      center: [100, 14],
      zoom: 1,

    }
    this.loadPaths = this.loadPaths.bind(this)
    this.handleZoomIn = this.handleZoomIn.bind(this)
    this.handleZoomOut = this.handleZoomOut.bind(this)
    this.handleReset = this.handleReset.bind(this)
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
    this.loadPaths()
  }
  loadPaths() {
    get("/gadm36_THA_1.json")
      .then(res => {
        if (res.status !== 200) return
        const world = res.data
        const geographyPaths = feature(
          world,
          world.objects[Object.keys(world.objects)[0]]
        ).features
        this.setState({ geographyPaths })
        console.log('geo', geographyPaths);

      })
  }
  handleZoomIn() {
    this.setState({
      zoom: this.state.zoom * 2,
    })
  }
  handleZoomOut() {
    this.setState({
      zoom: this.state.zoom / 2,
    })
  }
  handleReset() {
    this.setState({
      center: [100, 14],
      zoom: 1,
    })
  }
  render() {

    const { population } = this.state
    if (population.length === 0) {
      return SpinnerPage()
    }

    return (
      <div style={wrapperStyles}>
      <button onClick={this.handleZoomIn}>
          { "Zoom in" }
        </button>
        <button onClick={this.handleZoomOut}>
          { "Zoom out" }
        </button>
        <button onClick={this.handleReset}>
          { "Reset" }
        </button>
        <Motion
          defaultStyle={{
            zoom: 1,
            x: 100,
            y: 14,
          }}
          style={{
            zoom: spring(this.state.zoom, {stiffness: 100, damping: 14}),
            x: spring(this.state.center[0], {stiffness: 100, damping: 14}),
            y: spring(this.state.center[1], {stiffness: 100, damping: 14}),
          }}
          >
          {({zoom,x,y}) => (
        <ComposableMap
          projectionConfig={{
            scale: 3500,
          }}
          width={980}
          height={951}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          <ZoomableGroup center={[x,y]} zoom={zoom}>
            <Geographies geography={this.state.geographyPaths} disableOptimization>
              {(geographies, projection) =>
                geographies.map((geography, i) => {
                  const statePopulation = population.find(s =>
                    s.name === geography.properties.NAME_1
                  ) || {}
                  // console.log('NAME_1',geography.properties.NAME_1);
                  // console.log('pop', statePopulation.name);
                  return (
                    <Geography
                      key={`state-${geography.properties.ID_1}`}
                      cacheId={`state-${geography.properties.ID_1}`}
                      round
                      data-html="true"
                      data-tip={statePopulation.tag}
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
        )}
        </Motion>
        <ReactTooltip/>
        
      </div>
    )
  }
}

export default AlbersUSA
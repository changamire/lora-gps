import React from 'react';

import Map from 'pigeon-maps'
import Marker from 'pigeon-marker'

import axios from 'axios';

const mapboxEnabled = false;

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiY2hhbmdhbWlyZSIsImEiOiJmTlBHOFpZIn0.IITyPUdol6WX_UrVyzxWEg';

const mapbox = (mapboxId, accessToken) => (x, y, z, dpr) => {
  return `https://api.mapbox.com/styles/v1/mapbox/${mapboxId}/tiles/256/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}?access_token=${accessToken}`
}


const providers = {
  osm: (x, y, z) => {
    const s = String.fromCharCode(97 + (x + y + z) % 3)
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
  },
  wikimedia: (x, y, z, dpr) => {
    return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`
  },
  stamen: (x, y, z, dpr) => {
    return `https://stamen-tiles.a.ssl.fastly.net/terrain/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.jpg`
  },
  streets: mapbox('streets-v10', MAPBOX_ACCESS_TOKEN),
  satellite: mapbox('satellite-streets-v10', MAPBOX_ACCESS_TOKEN),
  outdoors: mapbox('outdoors-v10', MAPBOX_ACCESS_TOKEN),
  light: mapbox('light-v9', MAPBOX_ACCESS_TOKEN),
  dark: mapbox('dark-v9', MAPBOX_ACCESS_TOKEN)
}

function isMapBox(provider) {
  return provider === 'streets' || provider === 'satellite' || provider === 'outdoors' || provider === 'light' || provider === 'dark'
}


const MapboxAttribution = () => (
  <span className='map-attribution'>
    <span>© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a></span>{' | '}
    <span>© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a></span>{' | '}
    <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>
  </span>
)

const StamenAttribution = () => (
  <span className='map-attribution'>
    Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a
    href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a
    href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.
  </span>
)

const WikimediaAttribution = () => (
  <span className='map-attribution'>
    Map tiles by <a
    href='https://foundation.wikimedia.org/w/index.php?title=Maps_Terms_of_Use#Where_does_the_map_data_come_from.3F'>Wikimedia</a>. Data by <a
    href="http://openstreetmap.org">OpenStreetMap</a>
  </span>
)

// const markers = {
//   leuven1: [[50.879, 4.6997], 13],
//   leuven2: [[50.874, 4.6947], 13],
//   brussels: [[50.85050, 4.35149], 11],
//   ghent: [[51.0514, 3.7103], 12],
//   coast: [[51.2214, 2.9541], 10]
// }

export default class extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      center: [-31.9447, 115.9105],
      zoom: 6,
      provider: 'wikimedia',
      metaWheelZoom: false,
      twoFingerDrag: false,
      animate: true,
      animating: false,
      zoomSnap: true,
      mouseEvents: true,
      touchEvents: true,
      minZoom: 1,
      maxZoom: 18,
      dragAnchor: [48.8565, 2.3475],
      markers: []
    }
  }

  render() {
    const {center, zoom, provider, animate, metaWheelZoom, twoFingerDrag, zoomSnap, mouseEvents, touchEvents, minZoom, maxZoom} = this.state

    return (
      <div style={{textAlign: 'center', marginTop: 50}}>
        <div style={{maxWidth: 600, margin: '0 auto'}}>
          <Map
            limitBounds='edge'
            center={center}
            zoom={zoom}
            provider={providers[provider]}
            dprs={[1, 2]}
            onBoundsChanged={this.handleBoundsChange}
            onClick={this.handleClick}
            onAnimationStart={this.handleAnimationStart}
            onAnimationStop={this.handleAnimationStop}
            animate={animate}
            metaWheelZoom={metaWheelZoom}
            twoFingerDrag={twoFingerDrag}
            zoomSnap={zoomSnap}
            mouseEvents={mouseEvents}
            touchEvents={touchEvents}
            minZoom={minZoom}
            maxZoom={maxZoom}
            attribution={
              isMapBox(provider)
                ? <MapboxAttribution/>
                : provider === 'stamen'
                ? <StamenAttribution/>
                : provider === 'wikimedia'
                  ? <WikimediaAttribution/>
                  : null}
            defaultWidth={600}
            height={400}
            boxClassname="pigeon-filters">
            {Object.keys(this.state.markers).map(key => (
              <Marker key={key} anchor={this.state.markers[key][0]} payload={key} onClick={this.handleMarkerClick}/>
            ))}

            {isMapBox(provider) && <span className='mapbox-wordmark'/>}
          </Map>
        </div>
      </div>
    )
  }

  componentDidMount() {
    let self = this;
    let url = Config.apiConfig.url;
    const apiKey = Config.apiConfig.key;
    axios.get(url, {headers: {'x-api-key': apiKey}})
      .then(res => {
        console.log(res.data);
        self.setState({markers:res.data});
      });
  };
};

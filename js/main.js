$(document).ready(function(){
  $('#map').css({height:$(window).height(),width:$(window).width()});
  drawMap();
});

var globalMap;

function drawMap(){
  // L.mapbox.accessToken = 'pk.eyJ1Ijoia3ppZWwiLCJhIjoiaVROWDVNcyJ9.hxCBMTpnmZjG8X_03FYMBg';
  // var map = L.mapbox.map('map', 'kziel.l04pnpnd', {
  //   attributionControl: false,
  //   infoControl: true
  // })
  greatCircle();
  // var generator = new arc.GreatCircle(
  //   obj([40.6397, -73.7789]),
  //   obj([50.1166667, 8.6833333]));
  // var line = generator.Arc(100, { offset: 10 });
  // var map = L.map('map').setView([45,-40], 4);
  // L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
  //   attribution:'&copy; <a href="http://osm.org/copyright" title="OpenStreetMap" target="_blank">OpenStreetMap</a> contributors | Tiles Courtesy of <a href="http://www.mapquest.com/" title="MapQuest" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" width="16" height="16">',
  //   subdomains: ['otile1','otile2','otile3','otile4']
  // }).addTo(map);

  // var jfkMarker = L.marker([40.6397, -73.7789]).addTo(map);
  // var fraMarker = L.marker([50.1166667, 8.6833333]).addTo(map);
  // var pointA = new L.LatLng(50.1166667, 8.6833333);
  // var pointB = new L.LatLng(40.6397, -73.7789);
  // var pointList = [pointA, pointB];
  //
  // var firstpolyline = new L.Polyline(pointList, {
  //   color: 'red',
  //   weight: 3,
  //   opacity: 0.5,
  //   smoothFactor: 1
  //
  // });
  // firstpolyline.addTo(map);
}

function greatCircle() {
  L.mapbox.accessToken = 'pk.eyJ1Ijoia3ppZWwiLCJhIjoiaVROWDVNcyJ9.hxCBMTpnmZjG8X_03FYMBg';
  var map = L.mapbox.map('map', 'kziel.l04pnpnd', {
    attributionControl: false,
    infoControl: true
  })
  .setView([20, 0], 2);
  map.dragging.disable();
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();
  globalMap = map;
  if (map.tap) map.tap.disable();
  function obj(ll) { return { y: ll[0], x: ll[1] }; }
  // for (var i = 0; i < 1; i++) {
  //   var generator = new arc.GreatCircle(
  //     obj([40.6397, -73.7789]),
  //     obj([50.1166667, 8.6833333]));
  //     var line = generator.Arc(100, { offset: 10 });
  //     var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
  //       return c.reverse();
  //     }), {
  //       color: '#fff',
  //       weight: 2,
  //       opacity: 1
  //     })
  //     .addTo(map);
  //     var totalLength = newLine._path.getTotalLength();
  //     newLine._path.classList.add('path-start');
  //     newLine._path.style.strokeDashoffset = totalLength;
  //     newLine._path.style.strokeDasharray = totalLength;
  //     setTimeout((function(path) {
  //       return function() {
  //         path.style.strokeDashoffset = 0;
  //       };
  //     })(newLine._path), i * 100);
  //     setTimeout(function(){
  //       map.dragging.enable();
  //       map.touchZoom.enable();
  //       map.doubleClickZoom.enable();
  //       map.scrollWheelZoom.enable();
  //     },5000)
  //     }

      // Note that calling `.eachLayer` here depends on setting GeoJSON _directly_
      // above. If you're loading GeoJSON asynchronously, like from CSV or from a file,
      // you will need to do this within a `featureLayer.on('ready'` event.
}
var globalMarker
function parseFlight(data) {
  var generator = new arc.GreatCircle(
    obj(data.origin.coordinates),
    obj(data.destination.coordinates));
    var line = generator.Arc(100, { offset: 10 });
    var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
      return c.reverse();
    }), {
      color: '#fff',
      weight: 2,
      opacity: 1
    })
    .addTo(globalMap);
    setTimeout((function(path) {
            return function() {
              path.style.strokeDashoffset = 0;
            };
          })(newLine._path),0);
    var totalLength = newLine._path.getTotalLength();
    newLine._path.classList.add('path-start');
    newLine._path.style.strokeDashoffset = totalLength;
    newLine._path.style.strokeDasharray = totalLength;
    addMarker({data:data.origin,coordinates:data.origin.coordinates,symbol:'airport'});
    addMarker({data:data.destination,coordinates:data.destination.coordinates,symbol:'airport'});
}
function addMarker(args) {
  if(!args) {
    return false;
  }
  var featureLayer = L.mapbox.featureLayer({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        'marker-color': args.color || '#548cba',
        'marker-size': args.size || 'large',
        'marker-symbol': args.symbol
      },
      geometry: {
        type: 'Point',
        coordinates: [args.coordinates[1],args.coordinates[0]]
      }
    }]
  }).addTo(globalMap);
  if(args.symbol) {
    if(args.symbol == 'airport') {
      featureLayer.eachLayer(function(layer) {
        var content = '<h2>' + args.data.name + '<\/h2>'
        layer.bindPopup(content);
      });
    } else if (args.symbol == 'ferry') {
      featureLayer.eachLayer(function(layer) {
        var content = '<h2>' + args.data.name + '<\/h2>'
        layer.bindPopup(content);
      });
    } else if(args.ferry == 'hotel') {
      featureLayer.eachLayer(function(layer) {
        var content = '<h2>' + args.data.name + '<\/h2>'
        layer.bindPopup(content);
      });
    }
  }
}
function obj(ll) { return { y: ll[0], x: ll[1] }; }

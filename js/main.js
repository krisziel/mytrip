$(document).ready(function(){
  $('#map').css({height:$(window).height()-25,width:$(window).width()});
  drawMap();
  parseTimeline();
});

var globalMap;
var tweets = {};

function drawMap(){
  L.mapbox.accessToken = 'pk.eyJ1Ijoia3ppZWwiLCJhIjoiaVROWDVNcyJ9.hxCBMTpnmZjG8X_03FYMBg';
  var map = L.mapbox.map('map', 'kziel.l04pnpnd', {
    attributionControl: false,
    infoControl: true
  })
  .setView([0, 0], 2);
  globalMap = map;
  loadFlights();
  getTweets();
}
function loadFlights() {
  $.each(data,function(i,segment){
    setTimeout(function(){
      if(segment.type == "flight") {
        drawFlight(segment);
      } else if(segment.type == "ferry") {
        drawFerry(segment);
	} else if(segment.type == "lodging") {
        drawLodging(segment);
      }
    },i*1000);
  });
}
function drawFlight(data) {
  var generator = new arc.GreatCircle(
    obj(data.origin.coordinates),
    obj(data.destination.coordinates));
    var line = generator.Arc(100, { offset: 10 });
    var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
      return c.reverse();
    }), {
      color: '#000000',
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
    setTimeout(function(){
      addMarker({data:data.destination,coordinates:data.destination.coordinates,symbol:'airport',markerId:data.id});
    },1000);
}
function drawFerry(data) {
  var generator = new arc.GreatCircle(
    obj(data.origin.coordinates),
    obj(data.destination.coordinates));
    var line = generator.Arc(100, { offset: 10 });
    var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
      return c.reverse();
    }), {
      color: '#ffffff',
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
    addMarker({data:data.origin,coordinates:data.origin.coordinates,symbol:'ferry'});
    setTimeout(function(){
      addMarker({data:data.destination,coordinates:data.destination.coordinates,symbol:'ferry',markerId:data.id});
    },1000);
}
function drawLodging(data) {
  addMarker({symbol:'lodging',data:data,coordinates:data.coordinates,markerId:data.id});
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
        title:args.markerId,
        'marker-color': args.color || '#548cba',
        'marker-size': args.size || 'large',
        'marker-symbol': args.symbol
      },
      geometry: {
        type: 'Point',
        coordinates: [args.coordinates[1],args.coordinates[0]]
      },
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
    } else if(args.symbol == 'lodging') {
      featureLayer.eachLayer(function(layer) {
        var content = '<h2>' + args.data.name + '<\/h2>'
        layer.bindPopup(content);
      });
    }
  }
}
function getTweets() {
  $.getJSON("http://kziel.herokuapp.com/kziel?count=10&since_id=10&exclude_replies=false",function(data){
    for(i=0;i<data.length;i++) {
      tweet = data[i];
      tweets[tweet.id_str] = tweet;
    }
    $.each(data,function(i,tweet){
      parseTweet(tweet);
    });
  });
}
function parseTweet(tweet) {
  if(tweet.coordinates) {
    drawTweet(tweet);
  } else if(tweet.place) {
    tweet.coordinates = centerPolygon(tweet.place.bounding_box.coordinates);
    tweet.coordinates.coordinates = tweet.coordinates;
	  addTweetMarker(tweet);
  }
  timelineTweet(tweet);
}
function drawTweet(tweet) {
  addTweetMarker(tweet)
}
function addTweetMarker(data) {
  var featureLayer = L.mapbox.featureLayer({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        'marker-color': '#' + data.user.profile_sidebar_fill_color,
        'marker-size': 'large',
        'marker-symbol': 'mobilephone',
        title:'tweet' + data.id_str
      },
      geometry: {
        type: 'Point',
        coordinates: [data.coordinates.coordinates[0],data.coordinates.coordinates[1]]
      }
    }]
  }).addTo(globalMap);
  featureLayer.eachLayer(function(layer) {
    var content = '<h2><a href="http://twitter.com/' + data.user.screen_name + '">@' + data.user.screen_name + '</a> (' + data.user.name + ')<\/h2>';
    content += '<p>' + parseTweetLinks(data) + '</p>';
    content += '<p><a href="http://twitter.com/' + data.user.screen_name + '/status/' + data.id_str + '" target="_blank">' + timeMachine(data.created_at) + '</a></p>';
    content += imageGrid(data);
    layer.bindPopup(content);
  });
  $('.leaflet-popup-pane').bind('DOMSubtreeModified',function(){
    $('.popup-container').remove();
    $('.tweet-image').bind('click',function(){
      imageLightbox($(this).attr('data-imagesrc'));
    })
  });
}
function imageGrid(data) {
  content = '';
  if((data.extended_entities)&&(data.extended_entities.media)) {
    var imagesLength = data.extended_entities.media.length;
    var imgMultiplier = 1
    if(imagesLength == 1) {
      imgMultiplier = 2.0357;
    }
    var entities_array = data.extended_entities.media
    var imageGrid = '';
    var dataUrls = [];
    $.each(data.extended_entities.media,function(i,media){
      size = media.sizes.large;
      if((size.h*2)>size.w) {
        imgWidth = 140;
        imgHeight = (size.h*(140/size.w));
        imgTop = -((imgHeight-70)/2);
        imgLeft = 0;
      } else {
        imgWidth = (size.w*(70/size.h));
        imgHeight = 70;
        imgTop = 0;
        imgLeft = -((imgWidth-140)/2);
      }
      dataUrls.push(media.media_url);
      imageGrid += '<div class="tweet-image" data-tweetid="' + data.id + '" data-imagesrc="' + media.media_url + '"><img src="' + media.media_url + '" id="image' + media.id + '" style="width:' + imgWidth*imgMultiplier + 'px;height:' + imgHeight*imgMultiplier + 'px;margin-top:' + imgTop*imgMultiplier + 'px;margin-left:' + imgLeft*imgMultiplier + 'px;" data-imageid="' + media.id + '" /></div>';
    });
    content += '<div class="gallery" data-images="' + imagesLength + '" data-imageurls="' + dataUrls.join('\\\/\\\/\\\/') + '">';
    content += imageGrid;
    content += '</div>';
    return content;
  } else {
    return '';
  }
}
function parseTweetLinks(tweet) {
  var text = tweet.text;
  var html = text;
  if(tweet.entities.media) {
    $.each(tweet.entities.media,function(i,entity){
      var newText = text.slice(entity.indices[0],entity.indices[1]);
      var newHtml = '<a target="_blank" href="' + entity.expanded_url + '" title="' + entity.expanded_url + '">' + newText + '</a>';
      html = html.replace(newText,newHtml);
    });
  }
  if(tweet.entities.urls) {
    $.each(tweet.entities.urls,function(i,entity){
      var newText = text.slice(entity.indices[0],entity.indices[1]);
      var newHtml = '<a target="_blank" href="' + entity.expanded_url + '" title="' + entity.expanded_url + '">' + newText + '</a>';
      html = html.replace(newText,newHtml);
    });
  }
  return html;
}
function centerPolygon(polygon) {
  var newCoords = [0,0];
  $.each(polygon[0],function(i,coord){
    newCoords[0] += coord[0];
    newCoords[1] += coord[1];
  });
  newCoords[0] = (newCoords[0]/4);
  newCoords[1] = (newCoords[1]/4);
  return newCoords;
}
function imageLightbox(image) {
  $('.overlay').css({height:$(window).height(),width:$(window).width(),display:'block'});
  setTimeout(function(){ $('.overlay').css({opacity:1}); },1);
  var newImage = new Image();
  newImage.src = image;
  imgHeight = newImage.height;
  imgWidth = newImage.width;
  imgTop = -(imgHeight/2);
  imgLeft = -(imgWidth/2);
  $('.overlay').html('<img src="' + image + '" style="width:' + imgWidth + 'px;height:' + imgHeight + 'px;margin-top:' + imgTop + 'px;margin-left:' + imgLeft + 'px;">');
  var leftArrow = $('<div>',{
    style:'margin-left:' + (imgLeft-40) + 'px',
    id:'leftArrow',
    class:'Icon arrow'
  });
  leftArrow.bind('click',function(){
    navigateLightbox('left');
  });
  var rightArrow = $('<div>',{
    style:'margin-left:' + (-imgLeft+10) + 'px',
    id:'rightArrow',
    class:'Icon arrow'
  });
  rightArrow.bind('click',function(){
    navigateLightbox('right');
  });
  var close = $('<div>',{
    id:'closeLightbox',
    class:'Icon close'
  });
  close.bind('click',function(){
    closeLightbox();
  });
  var images = $('.gallery').attr('data-imageurls').split('\\\/\\\/\\\/');
  if(images.length > 1) {
    $('.overlay').append(leftArrow);
    $('.overlay').append(rightArrow);
  }
  $('.overlay').append(close);
  $(window).bind('keydown',function(e){
    lightboxKeyCode(e.keyCode);
  });
}
function lightboxKeyCode(keyCode) {
  if(keyCode === 27) {
    closeLightbox();
  } else if(keyCode === 39) {
    navigateLightbox('right');
  } else if (keyCode === 37) {
    navigateLightbox('left');
  }
}
function navigateLightbox(direction) {
  var images = $('.gallery').attr('data-imageurls').split('\\\/\\\/\\\/');
  var currentIndex = images.indexOf($('.overlay img').attr("src"));
  var newImage = '';
  if(direction === 'right') {
    if(images[currentIndex+1]) {
      newImage = images[currentIndex+1];
    } else {
      newImage = images[0];
    }
  } else if(direction === 'left') {
    if(images[currentIndex-1]) {
      newImage = images[currentIndex-1];
    } else {
      newImage = images[images.length-1];
    }
  }
  imageLightbox(newImage);
}
function closeLightbox() {
  $('.overlay').css({opacity:0});
  setTimeout(function(){ $('.overlay').css({display:'none'}); },300);
  $(window).unbind('keydown');
}
function timeMachine(date) {
  return date;
  var date = new Date(date);
}

function obj(ll) { return { y: ll[0], x: ll[1] }; }

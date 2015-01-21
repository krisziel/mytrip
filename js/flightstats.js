var flightArray = [];
var flightObject = {};
function selectFlights(){
  $.each(data,function(i,segment){
    if(segment.type === "flight") {
      flight = {
        carrier: segment.info.airline,
        flight: segment.info.flight,
        date: segment.info.date,
        origin: segment.origin.code,
        seat: segment.info.seat,
        class: segment.info.class,
        markerid: segment.id
      }
      flightArray.push(flight);
    }
  });
  downloadData();
}
function downloadData() {
  $.each(flightArray,function(i, value) {
    var range = new Date();
    var flight = new Date(value.date);
    range.setDate(range.getDate()+2);
    var urlDate = flight.getFullYear() + '/' + (parseInt(flight.getMonth())+1) + '/' + flight.getDate();
    params = { origin: value.origin };
    if(flight <= range) {
      var uri = '/flex/flightstatus/rest/v2/json/flight/status/' + value.carrier + '/' + value.flight + '/dep/' + urlDate;
    } else {
      var uri = '/flex/schedules/rest/v1/json/flight/' + value.carrier + '/' + value.flight + '/departing/' + urlDate;
    }
    flightStatsData({uri:uri,i:i,params:params});
  });
}
function flightStatsData(args) {
  if(!args) {
    return false;
  }
  uri = args.uri;
  i = args.i;
  if(args.params) {
    params = args.params;
  } else {
    params = '';
  }
  $.ajax({
    url: 'https://api.flightstats.com' + uri + '?appId=8e45847d&appKey=c57485c1d166d52b3281f836b3d07ceb&airport=' + params.origin,
    type: 'GET',
    crossDomain: true,
    success: function(data) {
      processFlightData({data:data,params:params});
    },
    error: function() {
    }
  });
}
function processFlightData(args) {
  if (!args) {
    return false;
  }
  var departure;
  var arrival;
  var data = args.data;
  var origin;
  $.each(flightArray,function(i,value) {
    if(data.request.flight&&(value.flight == data.request.flight.requested)&&(value.carrier == data.request.airline.requestedCode)) {
      origin = value.origin;
      return false;
    } else if(data.request.flightNumber&&(value.flight == data.request.flightNumber.requested)&&(value.carrier == data.request.carrier.requestedCode)) {
      origin = value.origin;
      return false;
    }
  });
  if(data.scheduledFlights) {
    var sched = data.scheduledFlights;
    if(sched.length > 1) {
      $.each(sched, function(i,value){
        if(value.departureAirportFsCode == origin) {
          thisFlight = value;
        }
      });
    } else {
      thisFlight = sched[0];
    }
    departure = thisFlight.departureTime;
    arrival = thisFlight.arrivalTime;
  } else if(data.flightStatuses) {
    var status = data.flightStatuses;
    if(status.length > 1) {
      $.each(status, function(i,value){
        if(value.departureAirportFsCode == origin) {
          thisFlight = value;
        }
      });
    } else {
      thisFlight = status[0];
    }
    var flightId = thisFlight.flightId;
    arrival = thisFlight.operationalTimes.estimatedGateArrival || thisFlight.operationalTimes.scheduledGateArrival;
    departure = thisFlight.operationalTimes.estimatedGateDeparture || thisFlight.operationalTimes.scheduledGateDeparture;
    arrival = arrival.dateUtc;
    departure = departure.dateUtc;
    var flightStart = new Date(departure).getTime();
    var flightEnd = new Date(arrival).getTime();
    var left = ((flightStart-start)/mspp);
    var width = ((flightEnd-flightStart)/mspp);
    var thisFlightBlock = $('<li>',{
      id:'flight' + flightId,
      class:'flight',
      style:'left:' + left + 'px;width:' + width + 'px;'
    });
    thisFlightBlock.attr('data-flightid',flightId);
    thisFlightBlock.bind('click',function(){
      openFlight($(this).attr('data-flightid'));
    });
    $('#timeline').append(thisFlightBlock);
    flightObject[flightId] = thisFlight;
  }
}
function openFlight(id) {
  console.log(id);
  // $('.tweet.selected').removeClass('selected');
  // $('#tt' + id).addClass('selected');
  data = flightObject[id];
  globalMap.closePopup();
  if($('.popup-container').length > 0) {
    $('.popup-container').remove();
  }
  var timelineLeft = $('#flight' + id).position().left;
  if((timelineLeft-160) <= 10) {
    var paneLeft = 10;
    var tipLeft = (timelineLeft-167);
  } else {
    var paneLeft = (timelineLeft-157);
    var tipLeft = 0;
  }
  var pane = '<div class="popup-container" style="left:' + paneLeft + 'px;">';
  pane += '<div class="leaflet-popup-tip-container" style="left:' + tipLeft + 'px;"><div class="leaflet-popup-tip"></div></div>';
  pane += '<div class="popup-body">';
  pane += '<div class="close Icon" id="close-popup"></div>';
  var content = '<h2>' + data.carrierFsCode + data.flightNumber + ' ' + data.departureAirportFsCode + '-' + data.arrivalAirportFsCode + '<\/h2>';
  // content += '<p>' + parseTweetLinks(data) + '</p>';
  // content += '<p><a href="http://twitter.com/' + data.user.screen_name + '/status/' + data.id_str + '" target="_blank">' + timeMachine(data.created_at) + '</a></p>';
  // content += imageGrid(data);
  pane += content;
  pane += '</div>';
  pane += '</div>';
  $('body').append(pane);
  $('#close-popup').bind('click',function(){
    closePopup();
  });
}
function makeTime(time) {
  time.getHours() > 12 ? hours = (time.getHours() - 12) : hours = time.getHours();
  minutes = "0" + time.getMinutes();
  minutes = minutes.substr(-2,2);
  if(time.getHours() > 11) {
    time = hours + ":" + minutes + " PM";
  } else {
    hours == 1 ? hours = 12 : hours = hours;
    time = hours + ":" + minutes + " AM";
  }
  return time;
}

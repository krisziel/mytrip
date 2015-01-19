var flightArray = [
  {
    carrier: 'UA',
    flight: '758',
    date: '1/21/2015',
    origin: 'SFO'
  },
  {
    carrier: 'SQ',
    flight: '25',
    date: '1/21/2015',
    origin: 'JFK'
  },
  {
    carrier: 'SQ',
    flight: '25',
    date: '1/22/2015',
    origin: 'FRA'
  },
  {
    carrier: 'SQ',
    flight: '2',
    date: '1/23/2015',
    origin: 'SIN'
  },
  {
    carrier: 'UA',
    flight: '862',
    date: '1/26/2015',
    origin: 'HKG'
  }
];
var flightData = [];
var flightInfo = [];
var timelineRange = {
  arrival:new Date("2000-01-01"),
  departure:new Date("2020-12-31"),
  duration:0,
  ppms:0,
  timeOffset:0
};

$(window).load(function(){ downloadData(); });
var windowWidth = $(window).width()

function downloadData() {
  // $('*[tooltip]').tooltip();
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
  // console.log(args.data);
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
    arrival = thisFlight.operationalTimes.estimatedGateArrival.dateLocal;
    departure = thisFlight.operationalTimes.estimatedGateDeparture.dateLocal;
  }
  arrival = new Date(arrival);
  arrival = new Date(arrival.getTime() + arrival.getTimezoneOffset()*60000);
  if(arrival >= timelineRange.arrival) {
    timelineRange.arrival = arrival;
  }
  departure = new Date(departure);
  departure = new Date(departure.getTime() + departure.getTimezoneOffset()*60000);
  if(departure <= timelineRange.departure) {
    timelineRange.departure = departure;
  }
  flightInfo.push(thisFlight);
  flightData.push(data);
  generateTimeline();
}
function generateTimeline() {
  if(flightArray.length > flightData.length) {
    return false;
  }
  var start = new Date();
  var end = new Date();
  start = start.setTime(timelineRange.departure.getTime() - (4*60*60*1000));
  end = end.setTime(timelineRange.arrival.getTime() + (4*60*60*1000));
  var duration = end - start;
  timelineRange.ppms = windowWidth/duration;
  timelineRange.duration = duration;
  startTime = start;
  endTime = end;
  var timeOffset = timelineRange.arrival.getTimezoneOffset()*60000;
  var route = {
    origin:'',
    destination:''
  }
  $.each(flightInfo,function(i,value){
    var fullData = flightData[i];
    left = 0;
    $.each(fullData.appendix.airports,function(i,vx){
      if(vx.fs == value.departureAirportFsCode) {
        depOffset = vx.utcOffsetHours;
        route.origin = vx.fs;
        value.originOffset = vx.utcOffsetHours;
      } else if(vx.fs == value.arrivalAirportFsCode) {
        arrOffset = vx.utcOffsetHours;
        route.destination = vx.fs;
        value.destinationOffset = vx.utcOffsetHours;
      }
    });
    if(value.operationalTimes) {
      flightStart = new Date(value.operationalTimes.estimatedGateDeparture.dateLocal).getTime() + depOffset*-60*60*1000;
      flightEnd = new Date(value.operationalTimes.estimatedGateArrival.dateLocal).getTime() + arrOffset*-60*60*1000;
      left = flightStart - startTime;
      block = flightEnd - flightStart;
      var flight = fullData.request.airline.requestedCode + fullData.request.flight.requested;
      // block = ;
    } else {
      flightStart = new Date(value.departureTime).getTime() + depOffset*-60*60*1000;
      flightEnd = new Date(value.arrivalTime).getTime() + arrOffset*-60*60*1000;
      left = flightStart - startTime;
      block = flightEnd - flightStart;
      var flight = fullData.request.carrier.requestedCode + fullData.request.flightNumber.requested;
    }
    $('.timeline').append('<div class="flight" style="left:' + Math.round(left*timelineRange.ppms) + 'px; width:' + Math.round(block*timelineRange.ppms) + 'px;" id="flight' + i + '" flight="' + i + '"><flight>' + flight + '</flight><route>' + route.origin + '-' + route.destination + '</route></div>')
  });
  $('.flight').each(function() {
    $(this).bind('click',function(){ showFlightData($(this).attr('flight'),flightData); })
  })
}
function showFlightData(flight,flightData) {
  var data = flightData[flight];
  var flightData = flightInfo[flight];
  var flightNumber = 2;
  var carrier = data.appendix.airlines[0].name;
  $.each(data.appendix.airlines,function(i,airline) {
    if(data.request.carrier) {
      reqCarrier = data.request.carrier.requestedCode;
    } else {
      reqCarrier = data.request.airline.requestedCode;
    }
    if(airline.fs == reqCarrier) {
      carrier = airline.name;
    }
  })
  if(!flightData.operationalTimes) {
    var flightNumber = flightData.flightNumber;
    var equipment = flightData.flightEquipmentIataCode;
    // var originName = ;
    var originCode = flightData.departureAirportFsCode;
    var schedDep = new Date(flightData.departureTime).getFullYear();
    var actualDep = "";
    // var destinationName = ;
    var destinationCode = flightData.arrivalAirportFsCode;
    var schedArr = new Date(flightData.arrivalTime).getFullYear();
    var actualArr = "";
  } else if(flightData.operationalTimes.actualGateDeparture) {
    var flightNumber = flightData.flightNumber;
    if(flightData.flightEquipment.actualEquipmentIataCode) {
      equip = flightData.flightEquipment.actualEquipmentIataCode;
    } else {
      equip = flightData.flightEquipment.scheduledEquipmentIataCode;
    }
    var equipment = equip + ' (' + flightData.flightEquipment.tailNumber + ')';
    // var originName = ;
    var originCode = flightData.departureAirportFsCode;
    var sDD = new Date(flightData.operationalTimes.scheduledGateDeparture.dateUtc);
    var aDD = new Date(flightData.operationalTimes.actualGateDeparture.dateUtc);
    var schedDep = new Date(sDD.getTime() + flightData.originOffset*60000);
    var actualDep = new Date(aDD.getTime() + flightData.originOffset*60000);
    // var destinationName = ;
    var destinationCode = flightData.arrivalAirportFsCode;
    var schedArr = new Date(flightData.operationalTimes.scheduledGateArrival.dateUtc);
    var actualArr = new Date(flightData.operationalTimes.estimatedGateArrival.dateUtc);
    var scheduledDuration = new Date(flightData.operationalTimes.estimatedGateArrival.dateUtc.replace("Z","")).getTime() - new Date(flightData.operationalTimes.actualGateDeparture.dateUtc).getTime();
    var now = new Date();
    var currentUTC = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    console.log(actualDep.getTime());
    console.log(currentUTC.getTime());
    console.log(schedArr.getTime());
    var elapsed = currentUTC.getTime() - actualDep.getTime();
    var remaining = schedArr.getTime() - currentUTC.getTime();
  } else if(flightData.operationalTimes.scheduledGateDeparture) {
    console.log('soon');
  } else {
  }
  console.log(flightData.operationalTimes.scheduledGateArrival)
  $('.popup > flight').html(carrier + ' ' + flightNumber);
  $('.popup > equipment').html(equipment);
  $('.popup > origin > airport').html(originCode);
  $('.popup > destination > airport').html(destinationCode);
  $('.popup > origin > sched > time').html(makeTime(schedDep));
  $('.popup > origin > actual > time').html(makeTime(actualDep));
  $('.popup > destination > sched > time').html(makeTime(schedArr));
  $('.popup > destination > actual > time').html(makeTime(actualArr));
  $('.popup > .flightLength > .elapsed').html(elapsed);
  $('.popup > .flightLength > .remaining').html(remaining);
  $('.popup > .flightLength > .statusPlane').css({textAlign:'left'});
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
function offsetTime(time,offset) {
  // Wed Aug 29 17:12:58 +0000 2012
}

// <div class="popup">
// <flight>United 976</flight>
// <equipment>777 (N784UA)</equipment>
// <origin>
// <airport>IAD</airport>
// <sched>10:15PM <small>Scheduled</small></sched>
// <actual>10:10PM <small>Actual</small></actual>
// </origin>
// <destination>
// <airport>DXB</airport>
// <sched>8:15PM (+1) <small>Scheduled</small></sched>
// <actual>8:00PM (+1) <small>Estimated</small></actual>
// </destination>
// <ul class="flightLength">
// <div class="flightLine"></div>
// <li class="elapsed">5:50</li>
// <li class="remaining">8:10</li>
// <li class="statusPlane" style="left: 100px;"></li>
// </ul>
// </div>

var start = new Date('1/20/2015').getTime();
var end = new Date('1/26/2015 09:00').getTime();
var mspp = ((end-start)/$(window).width());
var lastLeft = 9999;
var utcOffset = 8;

function parseTimeline() {
  selectFlights();
  var now = new Date().getTime();
  var fromStart = now-start;
  var left = (fromStart/mspp);
  var nowLine = $('<li>',{
    id:'now',
    class:'now',
    style:'left:' + left + 'px;'
  });
  $('#timeline').append(nowLine);
}
function timelineHotel(hotel) {

  var blockStart = localize(hotel.date[0], utcOffset).getTime();
  var blockEnd = localize(hotel.date[1], utcOffset).getTime();
  var width = ((blockEnd-blockStart)/mspp);
  var fromStart = blockStart-start;
  var left = (fromStart/mspp);
  var hotelBlock = $('<li>',{
    id:'hotel' + hotel.id,
    class:'hotel',
    style:'left:' + left + 'px;width:' + width + 'px'
  });
  $('#timeline').append(hotelBlock);
}
function timelineFerry(ferry) {
  var blockStart = localize(ferry.date[0], utcOffset).getTime();
  var blockEnd = localize(ferry.date[1], utcOffset).getTime();
  var width = ((blockEnd-blockStart)/mspp);
  var fromStart = blockStart-start;
  var left = (fromStart/mspp);
  var ferryBlock = $('<li>',{
    id:'ferry' + ferry.id,
    class:'ferry',
    style:'left:' + left + 'px;width:' + width + 'px'
  });
  $('#timeline').append(ferryBlock);
}
function timelineTweet(tweet) {
  var time = new Date(tweet.created_at).getTime();
  var fromStart = time-start;
  if((lastLeft-4)<(fromStart/mspp)) {
    var left = lastLeft-4;
  } else {
    var left = (fromStart/mspp);
  }
  lastLeft = left;
  var tt = $('<li>',{
    id:'tt'+tweet.id_str,
    class:'tweet',
    style:'left:' + left + 'px;background:#' + tweet.user.profile_sidebar_fill_color
  });
  tt.attr('data-tweetid',tweet.id_str)
  tt.bind('click',function(){
    openTweet($(this).attr("data-tweetid"));
  });
  $('#timeline').append(tt);
}
function openTweet(id) {
  $('.tweet.selected').removeClass('selected');
  $('#tt' + id).addClass('selected');
  if($('.leaflet-marker-icon[title="tweet' + id + '"]').length > 0) {
    $('.popup-container').remove();
    $('.leaflet-marker-icon[title="tweet' + id + '"]').click();
    $('.tweet-image').bind('click',function(){
      imageLightbox($(this).attr('data-imagesrc'));
    });
  } else {
    data = tweets[id];
    if($('.popup-container').length > 0) {
      $('.popup-container').remove();
    }
    globalMap.closePopup();
    var timelineLeft = $('#tt' + id).position().left;
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
    var content = '<h2><a href="http://twitter.com/' + data.user.screen_name + '">@' + data.user.screen_name + '</a> (' + data.user.name + ')<\/h2>';
    content += '<p>' + parseTweetLinks(data) + '</p>';
    content += '<p><a href="http://twitter.com/' + data.user.screen_name + '/status/' + data.id_str + '" target="_blank">' + timeMachine(data.created_at) + '</a></p>';
    content += imageGrid(data);
    pane += content;
    pane += '</div>';
    pane += '</div>';
    $('body').append(pane);
    $('#close-popup').bind('click',function(){
      closePopup();
    });
  }
}
function closePopup() {
  $('.popup-container').remove();
  $('.tweet.selected').removeClass('selected');
}

var start = new Date('1/19/2015').getTime();
var end = new Date('1/23/2015').getTime();
var mspp = ((end-start)/$(window).width());

function parseTimeline() {

}
function timelineTweet(tweet) {
  var time = new Date(tweet.created_at).getTime();
  var fromStart = time-start;
  var left = (fromStart/mspp);
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
      var tipLeft = (timelineLeft-165);
    } else {
      var paneLeft = (timelineLeft-155);
      var tipLeft = 0;
    }
    var pane = '<div class="popup-container" style="left:' + paneLeft + 'px;">';
    pane += '<div class="leaflet-popup-tip-container" style="left:' + tipLeft + 'px;"><div class="leaflet-popup-tip"></div></div>';
    pane += '<div class="popup-body">';
    var content = '<h2><a href="http://twitter.com/' + data.user.screen_name + '">@' + data.user.screen_name + '</a> (' + data.user.name + ')<\/h2>';
    content += '<p>' + parseTweetLinks(data) + '</p>';
    content += '<p><a href="http://twitter.com/' + data.user.screen_name + '/status/' + data.id_str + '" target="_blank">' + timeMachine(data.created_at) + '</a></p>';
    content += imageGrid(data);
    pane += content;
    pane += '</div>';
    pane += '</div>';
    $('body').append(pane);
  }
}
function closePane() {
  $('.popup-container').remove();
}


var ge;

if (Meteor.isClient) {

  var user_access_token = "none";

  Meteor.startup(function() {

    document.getElementsByTagName("body")[0].style.margin = "0";

    SC.initialize({
      client_id:'d60a5d4319bb04cf49a854e98ec89c12'
    });

    google.load("earth", "1", {other_params: "sensor=false", callback: function() {
      google.earth.createInstance("map3d", function(instance) {
        ge = instance;
        ge.getWindow().setVisibility(true);
      }, function(errorCode) {
        //failure
      });
    }});

    $( "#getAlbum" ).submit(function( event ) {
    event.preventDefault();
    var requestData = {
          access_token : user_access_token, 
          fields : "photos"
        }
    $.get('https://graph.facebook.com/' + $('#albumSelect').val(),requestData,function(data){
      var place = _.find(data.photos.data, function(photo) {
        return _.has(photo, 'place');
      }).place;
      var SCSearchString = place.name + " " + place.location.city + " " + place.location.country + " traditional";
    })
    });


  });

  window.fbAsyncInit = function() {
  FB.init({
    appId      : '600241133350638', // App ID
    channelUrl : '//hackmit.meteor.com/channel.html', // Channel File
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    xfbml      : true  // parse XFBML
  });

  
  FB.Event.subscribe('auth.authResponseChange', function(response) { 
    if (response.status === 'connected') {
      user_access_token = response.authResponse.accessToken;
      loadAlbums();
    } else if (response.status === 'not_authorized') {
      FB.login(function(response){console.log(response);},{scope: 'user_photos'});
    } else {
      FB.login(function(response){console.log(response);},{scope: 'user_photos'});
    }
  });
  };

  // Load the SDK asynchronously
  (function(d){
   var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement('script'); js.id = id; js.async = true;
   js.src = "//connect.facebook.net/en_US/all.js";
   ref.parentNode.insertBefore(js, ref);
  }(document));


  Template.hello.events({
    'click #make_map' : function () {
      // template data, if any, is available in 'this'
      var mockList = 
      [
        {latitude: 37, longitude:-119, photos:[], SCSearchString: "Yosemite Valley"}, 
        {latitude: 42, longitude: -71, photos:[], SCSearchString: "Boston"}
      ];
      present(mockList);
    }
  });

}

var present = function(list) {
  if (list.length === 0) {
    return;
  };
  var item = list.shift();
  var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
  lookAt.setLatitude(item.latitude);
  lookAt.setLongitude(item.longitude);
  lookAt.setRange(5000.0);
  SC.get('/tracks', {q: item.SCSearchString}, function(tracks) {
    SC.stream('/tracks/' + tracks[0].id, function(sound) {
      sound.play();
      ge.getView().setAbstractView(lookAt);
      present(list);
    });
  });
}

function loadAlbums() {
  FB.getLoginStatus(function(response) {
  if (response.status === 'connected') {
    var requestData = {
      access_token : response.authResponse.accessToken, 
      fields : "name,albums"
    }
    $.get('https://graph.facebook.com/me',requestData,function(data){
      console.log(data);
      createAlbumForm(data.albums);
    })
  } else if (response.status === 'not_authorized') {
    // the user is logged in to Facebook, 
    // but has not authenticated your app
  } else {
    // the user isn't logged in to Facebook.
  }
 });
}

function createAlbumForm(albums) {
  var albumSelect = $("#albumSelect");
  for (var i = 0; i < albums.data.length; i++){
    albumSelect.append('<option value=' + albums.data[i].id + '>' + albums.data[i].name + '</option>')
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

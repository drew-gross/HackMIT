
var ge;
var mapPoints = {};
var user_access_token = "none";

if (Meteor.isClient) {

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
    console.log($('#albumSelect').val());
    var requestData = {
          access_token : user_access_token, 
          fields : "name,place,source,created_time"
        }
    $.get('https://graph.facebook.com/' + $('#albumSelect').val() + "/photos",requestData,function(data){
          populatePoints(data);
          console.log(mapPoints);

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
      var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
      lookAt.setLatitude(36.584207);
      lookAt.setLongitude(-121.754322);
      lookAt.setRange(5000.0);
      SC.get('/tracks', { q: 'Malaysia'}, function(tracks) {
        SC.stream('/tracks/' + tracks[1].id, function(sound) {
          SC.whenStreamingReady(function() {
            ge.getView().setAbstractView(lookAt);
            sound.play()
          });
        });
      }); 
    }
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

function populatePoints(objData) {
  var obj;
  var hash;
  var newPlace;
  for (var i = 0; i < objData.data.length; i++) {
    obj = objData.data[i];
    if (obj.hasOwnProperty('place')){
      hash = placeHash(obj.place.location.latitude,obj.place.location.longitude)
      if (!mapPoints.hasOwnProperty(hash)){
        newPlace = {
            latitude : obj.place.location.latitude,
            longitude : obj.place.location.longitude,
            photos : []
            }
        mapPoints[hash] = newPlace; 
      }
      mapPoints[hash].photos.push(obj.source);
    }
  }
  if (objData.paging.hasOwnProperty('next')){
    $.get(objData.paging.next,{},function(data){
      populatePoints(data);
    })
  }
  else {
    mapAnimation();
  }
  console.log(mapPoints);

}

function placeHash(lat,lon){
  return 'place:' + lat + ':' + lon;
}

function mapAnimation(){
  var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
  lookAt.setRange(5000.0);

  for(var i in mapPoints){
    console.log(i);
    setTimeout(function()())
    lookAt.setLatitude(mapPoints[i].latitude);
    lookAt.setLongitude(mapPoints[i].longitude);
    ge.getView().setAbstractView(lookAt);
  }

}



}

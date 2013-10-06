
var ge;
var mapPoints = {};
var mapList = [];
var user_access_token = "none";

if (Meteor.isClient) {

  Meteor.startup(function() {

    document.getElementsByTagName("body")[0].style.margin = "0";
    SC.initialize({
      client_id:'d60a5d4319bb04cf49a854e98ec89c12'
    });
    SC.whenStreamingReady(function() {
      google.load("earth", "1", {other_params: "sensor=false", callback: function() {
        google.earth.createInstance("map3d", function(instance) {
          ge = instance;
          ge.getWindow().setVisibility(true);
        }, function(errorCode) {
          //failure
        });
      }});
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
    'click #present': function() {
      var requestData = {
            access_token : user_access_token, 
            fields : "name,place,source,created_time"
          }
      $.get('https://graph.facebook.com/' + $('#albumSelect').val() + "/photos",requestData,function(data){
            populatePoints(data);
            console.log(mapPoints);
      })
    }
  });

}

var present = function(list) {
  if (list.length === 0) {
    return;
  };
  var hash = list.shift();
  var item = mapPoints[hash];
  var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
  lookAt.setLatitude(item.latitude);
  lookAt.setLongitude(item.longitude);
  lookAt.setRange(5000.0);

  createPlacemark(hash,item);

  SC.get('/tracks', {q: item.SCSearchString}, function(tracks) {
    SC.stream('/tracks/' + tracks[0].id, function(sound) {
      sound.play();
      ge.getView().setAbstractView(lookAt);
      setTimeout(function() {
        sound.stop();
        present(list);
      }, 5000);
    });
  });
}

function createPlacemark(hash,item) {
  var placemark = ge.createPlacemark('');
  var point = ge.createPoint('');
  point.setLatitude(item.latitude);
  point.setLongitude(item.longitude);
  placemark.setGeometry(point);
  ge.getFeatures().appendChild(placemark);

  google.earth.addEventListener(placemark,'click',function(event){alert(hash)})
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
        mapList.push(hash);
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
    present(mapList);
  }
  console.log(mapPoints);

}

function placeHash(lat,lon){
  return 'place:' + lat + ':' + lon;
}






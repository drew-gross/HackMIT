
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

var presentMap = function(list) {
  if (_.isEmpty(list)) {
    return;
  };
  var hash = list.shift();
  var item = mapPoints[hash];
  var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
  lookAt.setLatitude(item.latitude);
  lookAt.setLongitude(item.longitude);
  lookAt.setRange(5000.0);

  createPlacemark(hash,item);

      ge.getView().setAbstractView(lookAt);
      setTimeout(function() {
        presentMap(list);
      }, 5000);
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

var getSoundList = function(soundList, searchLists, cb) {
  if (_.isEmpty(searchLists)) {
    cb(soundList);
    return;
  }
  var searchList = searchLists.shift();
  SC.get('/tracks', {q: searchList[0]}, function(tracks) {
    if (_.isEmpty(tracks)){
      SC.get('/tracks', {q: searchList[1]}, function(tracks) {
        if (_.isEmpty(tracks)){
          SC.get('/tracks', {q: searchList[2]}, function(tracks) {
            if (!_isEmpty(tracks)) {
              SC.stream('/tracks/' + tracks[0].id, function(sound) {
                soundList.push(sound);
                sound.load();
              });
            }
          });
        } else {
          SC.stream('/tracks/' + tracks[0].id, function(sound) {
            soundList.push(sound);
            sound.load();
          });
        }
      });
    } else {
      SC.stream('/tracks/' + tracks[0].id, function(sound) {
        soundList.push(sound);
        sound.load();
      });
    }
  });
};

var playSoundList = function(list) {
  if (_.isEmpty(list)) {
    return;
  };
  sound = list.shift();
  setTimeout(function() {
    sound.stop();
    playSoundList(list);
  }, 5000);
};

var presentSoundCloud = function(list) {
  var searchLists = _.map(list, function(item) {
    return mapPoints[item].SCSearchStrings;
  });
  getSoundList([], searchLists, function(soundList) {
    _.each(soundList, function(sound) {
      sound.load();
    });
    playSoundList();
  });
};

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
    if (_.has(obj, 'place')){
      hash = placeHash(obj.place.location.latitude,obj.place.location.longitude)
      if (!_.has(mapPoints, hash)){
        newPlace = {
            latitude : obj.place.location.latitude,
            longitude : obj.place.location.longitude,
            photos : [],
            SCSearchStrings : [obj.place.name, obj.place.location.city, obj.place.location.country]
            }
        mapPoints[hash] = newPlace; 
        mapList.push(hash);
      }
      mapPoints[hash].photos.push(obj.source);
    }
  }
  if (_.has(objData.paging, 'next')){
    $.get(objData.paging.next,{},function(data){
      populatePoints(data);
    })
  }
  else {
    presentSoundCloud(mapList);
    presentMap(mapList);
  }
  console.log(mapPoints);

}

function placeHash(lat,lon){
  return 'place:' + lat + ':' + lon;
}






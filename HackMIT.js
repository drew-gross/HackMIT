
var ge;
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

  $(".slideImg").click(function(event){
    nextSlide();
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
            populatePoints(data, {}, []);
      })
    }
  });

}

var presentMap = function(mapPoints, mapList) {
  if (_.isEmpty(mapList)) {
    return;
  };
  var hash = mapList.shift();
  var item = mapPoints[hash];
  var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
  lookAt.setLatitude(item.latitude);
  lookAt.setLongitude(item.longitude);
  lookAt.setRange(5000.0);


  var placemark = createPlacemark(mapPoints, hash,item);

  ge.getView().setAbstractView(lookAt);
  updateSlides(mapPoints, hash);
  setTimeout(function() {
    presentMap(mapPoints, mapList);
  }, 5000);
}

var getSound = function(searchStringList, cb) {
  if (_.isEmpty(searchStringList)) {
    cb(0);
  }
  var searchString = searchStringList.shift();
  SC.get('/tracks', {q: searchString}, function(tracks) {
    tracks = _.filter(tracks, function(track) {
      return track.streamable;
    });
    if (_.isEmpty(tracks)) {
      getSound(searchStringList, cb);
    } else {
      cb(tracks[0]);
    }
  });
}

function createPlacemark(mapPoints, hash,item) {
  var placemark = ge.createPlacemark('');
  var point = ge.createPoint('');
  point.setLatitude(item.latitude);
  point.setLongitude(item.longitude);
  placemark.setGeometry(point);
  ge.getFeatures().appendChild(placemark);

  google.earth.addEventListener(placemark,'click',function(event){updateSlides(mapPoints, hash)})

  return placemark;
}

function updateSlides(mapPoints, hash) {
  console.log("updating slides");
  var slides = $("#slides");
  slides.empty();
  slides.find(".slideImg").remove();
  for (var i in mapPoints[hash].photos){
    slides.append('<img class="slideImg" src="' + mapPoints[hash].photos[i] + '">')
  }
  slides.children().first().addClass('active');
}


function nextSlide() {
    var active = $('.active');
    var next = $active.next();

    active.addClass('last-active');
        
    next.css({opacity: 0.0})
        .addClass('active')
        .animate({opacity: 1.0}, 1000, function() {
            active.removeClass('active last-active');
        });

}


var getSoundList = function(soundList, searchLists, cb) {
  if (_.isEmpty(searchLists)) {
    cb(soundList);
    return;
  }
  var searchList = searchLists.shift();
  getSound(searchList, function(track) {
    if (track != 0) {
      SC.stream('/tracks/' + track.id, function(sound) {
        soundList.push(sound);
        sound.load();
        getSoundList(soundList, searchLists, cb);
       });
    }
  });
};

var playSoundList = function(list) {
  if (_.isEmpty(list)) {
    return;
  };
  sound = list.shift();
  sound.play();
  setTimeout(function() {
    sound.stop();
    playSoundList(list);
  }, 5000);
};

var presentSoundCloud = function(mapPoints, mapList) {
  var searchLists = _.map(mapList, function(item) {
    return mapPoints[item].SCSearchStrings;
  });
  getSoundList([], searchLists, function(soundList) {
    _.each(soundList, function(sound) {
      sound.load();
    });
    playSoundList(soundList);
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

function populatePoints(objData, mapPoints, mapList) {
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
      populatePoints(data, mapPoints, mapList);
    })
  }
  else {
    presentSoundCloud(mapPoints, mapList);
    presentMap(mapPoints, mapList);
  }
}

function placeHash(lat,lon){
  return 'place:' + lat + ':' + lon;
}

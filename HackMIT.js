var ge;

if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to HackMIT.";
  };

  Template.hello.events({
    'click #make_map' : function () {
      // template data, if any, is available in 'this'
      ge.getWindow().setVisibility(true);
      var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
      lookAt.setLatitude(36.584207);
      lookAt.setLongitude(-121.754322);
      lookAt.setRange(5000.0);
      SC.initialize({
        client_id:'d60a5d4319bb04cf49a854e98ec89c12'
      });
      SC.get('/tracks', { q: 'Malaysia'}, function(tracks) {
        SC.stream('/tracks/' + tracks[1].id, function(sound) {
          sound.play();
          setTimeout(function() {
            ge.getView().setAbstractView(lookAt);
          }, 500);
        });
      }); 
    }
  });
  Meteor.startup(function() {
    document.getElementsByTagName("body")[0].style.margin = "0";
    google.load("earth", "1", {other_params: "sensor=false", callback: function() {
      google.earth.createInstance("map3d", function(instance) {
        ge = instance;
      }, function(errorCode) {
        //failure
      });
    }});
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to HackMIT.";
  };

  Template.hello.events({
    'click #make_map' : function () {
      // template data, if any, is available in 'this'
      google.load("earth", "1", {"other_params":"sensor=false", "callback":function(){
        google.earth.createInstance("map3d", function (ge){
          //success
          ge.getWindow().setVisibility(true);
          var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
          lookAt.setLatitude(36.584207);
          lookAt.setLongitude(-121.754322);
          lookAt.setRange(5000.0);
          ge.getView().setAbstractView(lookAt);
        }, function(errorCode) {
          //failure
        });
      }});
    },
    'click #start_sound' : function () {
      SC.initialize({
        client_id:'d60a5d4319bb04cf49a854e98ec89c12'
      });
      SC.stream("/tracks/293", function(sound) {
        sound.play();
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

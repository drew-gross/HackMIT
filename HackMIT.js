if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to HackMIT.";
  };

  Template.hello.events({
    'click input' : function () {
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
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

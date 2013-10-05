if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to HackMIT.";
  };

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      google.load("earth", "1", {"other_params":"sensor=false", "callback":function(){
        google.earth.createInstance("map3d", function (instance){
          //success
          instance.getWindow().setVisibility(true);
        }, function(errorCode) {
          //failure
        });}});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

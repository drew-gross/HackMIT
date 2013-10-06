Package.describe({
  summary: "Slides Plugin"
});

Package.on_use(function (api) {
  api.use('jquery', 'client');
  api.add_files(['jquery.slides.min.js'], 'client');

});
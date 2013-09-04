module.exports = function(grunt) {
  grunt.file.watchFiles = true;
  grunt.initConfig({
    jshint: {
      grunt: 'Gruntfile.js',
      bin: 'bin/multishot',
      scripts: [
        'lib/**/*.js'
      ]
    },
    watch: {
      options: {
        nospawn: true,
        livereload: false
      },

      scripts: {
        files: [
          'lib/**/*.js',
          'bin/multishot',
          'Gruntfile.js'
        ],
        tasks: ['jshint']
      }
    }
  });
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['jshint', 'watch']);
};

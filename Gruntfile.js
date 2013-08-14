'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> <%= pkg.version %>' +
      ' | (c) <%= grunt.template.today("yyyy") %>' +
      ' | Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    clean: {
      files: ['dist']
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['src/jquery.whenitype.js'],
        dest: 'dist/jquery.whenitype.js'
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/jquery.whenitype.min.js'
      },
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      src: {
        options: {
          jshintrc: 'src/.jshintrc'
        },
        src: ['src/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.registerTask('bower', 'Install Bower packages.', function() {
    var done = this.async();
    var bower = require('bower');
    bower.commands.install()
      .on('error', function(error) {
        grunt.log.writeln('Bower install error: ');
        grunt.log.error(error);
      })
      .on('end', function(data) {
        grunt.log.writeln('Bower installed packages successfully.');
        done();
      });
  });

  grunt.registerTask("nuget", "Create a nuget package", function () {
    var done = this.async();

    var distDirectory = 'dist/';
    var nugetScriptsDirectory = 'nuget/Content/Scripts/';
    var fileNames = ['jquery.whenitype.js', 'jquery.whenitype.min.js'];
    fileNames.forEach(function(fileName) {
      grunt.file.copy(distDirectory + fileName, nugetScriptsDirectory + fileName);
      grunt.log.writeln('Copied file "' + fileName + '" from "' + distDirectory + '" to "' + nugetScriptsDirectory + '"');
    });
    grunt.log.writeln();

    var outputDirectory = 'dist/nuget';
    grunt.file.mkdir(outputDirectory);

    grunt.util.spawn({
      cmd: "nuget.exe",
      args: [
        "pack", "nuget/jQuery.WhenIType.nuspec",
        "-OutputDirectory", outputDirectory,
        "-Version", grunt.config.get("pkg").version
      ]
    }, function (error, result) {
      if (error) {
        grunt.log.error('Failed to create nuget package')
        grunt.log.error(error);
      } else {
        grunt.log.write(result);
      }
      done();
    });
  });

  grunt.registerTask('default', ['jshint', 'bower', 'qunit', 'clean', 'concat', 'uglify']);
};

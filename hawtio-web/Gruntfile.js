
module.exports = function(grunt) {

  grunt.log.writeln("Building hawt.io");

  grunt.config.init({

    pkg: grunt.file.readJSON("package.json"),

    /* task configuration */

    // grunt-contrib-connect
    connect: {
      devserver: {
        options: {
          port: 8010,
          base: 'src/main/webapp',
//          middleware: function(connect, options) {
//          },
          keepalive: true
        }
      }
    },

    // grunt-karma
    karma: {
      unit: {
        configFile: "src/test/config/karma.conf.js",
        // override karmaConfig.js settings here:
        singleRun: true,
        autoWatch: false
      },
      chrome: {
        configFile: "src/test/config/karma.conf.js",
        browsers: [ "Chrome" ]
      }
    },

    // grunt-typescript (~8 seconds)
    typescript: {
      base: {
        src: [ "src/main/d.ts/*.d.ts", "src/main/webapp/app/**/*.ts" ],
//        dest: "src/main/webapp/app/app.js",
        dest: ".tscache/tsc",
        options: {
          comments: true,
          module: "commonjs",
          target: "ES5",
          declaration: false,
          watch: grunt.option("watch") ? {
            path: "src/main/webapp/app",
            after: [ "concat:appjs" ],
            atBegin: true
          } : false
        }
      }
    },

    // grunt-contrib-watch
    watch: {
      tsc: {
        files: [ "src/main/webapp/app/**/*.ts" ],
        tasks: [ "typescript:base" ]
      }
    },

    // grunt-contrib-concat
    concat: {
      options: {
        separator: "//~\n"
      },
      appjs: {
        src: [ ".tscache/tsc/**/*.js" ],
        dest: "src/main/webapp/app/app.js"
      }
    }

  });

  /* load & register tasks */

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  /* task aliases */

  // "grunt webserver" starts a webserver which hosts hawt.io without backend Java server
  // this might be however very useful to connect to existing Jolokia agent
  grunt.registerTask("webserver", "Starts a webserver which hosts hawt.io without backend Java server", [ "connect:devserver" ]);

  grunt.registerTask("test", "Runs unit tests once", [ "karma:unit" ]);
  grunt.registerTask("test-chrome", "Runs unit tests continuously with autowatching", [ "karma:chrome" ]);

  if (grunt.option("watch")) {
    grunt.registerTask("tsc", "Runs TypeScript compiler", [ "typescript:base", "watch:tsc" ]);
  } else {
    grunt.registerTask("tsc", "Runs TypeScript compiler", [ "typescript:base" ]);
  }

};

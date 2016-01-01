module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            dist: {
                files: {
                    'build/CommonVariable.min.js': ['src/CommonVariable.js'],
                    'build/BusMainPage.min.js': ['src/BusMainPage.js'],
                    'build/BusDivPage.min.js': ['src/BusDivPage.js'],
                    'build/BusRender.min.js': ['src/BusRender.js']
                }
            }
        },
        cssmin: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            add_banner: {
                files: {
                    'build/BusMain.min.css': ['src/BusMain.css'],
                    'build/BusDiv.min.css': ['src/BusDiv.css']
                }
            }
        },
        processhtml: {
          dist: {
            options: {
              data: {
                message: 'Go to production distribution'
              }
            },
            files: {
              'index.html': ['devindex.html']
            }
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-processhtml');

    grunt.registerTask('default', ['uglify','cssmin','processhtml']);
};

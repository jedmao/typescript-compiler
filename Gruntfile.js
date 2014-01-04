﻿module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['test/**/*.js'],
        typescript: {
            base: {
                src: ['test/**/*.ts'],
                dest: '',
                options: {
                    module: 'commonjs',
                    target: 'es5'
                }
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    clearRequireCache: true
                },
                src: ['test/**/*.js']
            }
        },
        watch: {
            ts: {
                files: '**/*.ts',
                tasks: ['test']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['build', 'mochaTest']);
    grunt.registerTask('build', ['clean', 'typescript']);

};

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-ts')

  grunt.initConfig({
    ts: {
      lib: {                                 // a particular target
        src: "src/**/*.ts",        // The source typescript files, http://gruntjs.com/configuring-tasks#files
        outDir: 'dist',                // If specified, generate an out.js file which is the merged js file
        options: {                    // use to override the default options, http://gruntjs.com/configuring-tasks#options
          target: 'es5',            // 'es3' (default) | 'es5'
          module: 'commonjs',       // 'amd' (default) | 'commonjs'
          declaration: false,       // true | false  (default)
          verbose: true
        },
        watch: 'src'
      }
    }
  })

  grunt.registerTask('default', 'ts');

}
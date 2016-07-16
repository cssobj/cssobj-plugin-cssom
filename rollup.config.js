// rollup.config.js

export default {
  entry: 'src/cssobj-plugin-post-cssom.js',
  moduleName: 'cssobj_plugin_post_cssom',
  moduleId: 'cssobj_plugin_post_cssom',
  targets: [
    { format: 'iife', dest: 'dist/cssobj-plugin-post-cssom.iife.js' },
    { format: 'amd',  dest: 'dist/cssobj-plugin-post-cssom.amd.js'  },
    { format: 'cjs',  dest: 'dist/cssobj-plugin-post-cssom.cjs.js'  },
    { format: 'es',   dest: 'dist/cssobj-plugin-post-cssom.es.js'   }
  ]
}

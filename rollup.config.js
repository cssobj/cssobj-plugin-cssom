// rollup.config.js

export default {
  entry: 'src/cssobj-plugin-cssom.js',
  moduleName: 'cssobj_plugin_cssom',
  moduleId: 'cssobj_plugin_cssom',
  targets: [
    { format: 'iife', dest: 'dist/cssobj-plugin-cssom.iife.js' },
    { format: 'amd',  dest: 'dist/cssobj-plugin-cssom.amd.js'  },
    { format: 'cjs',  dest: 'dist/cssobj-plugin-cssom.cjs.js'  },
    { format: 'es',   dest: 'dist/cssobj-plugin-cssom.es.js'   }
  ]
}

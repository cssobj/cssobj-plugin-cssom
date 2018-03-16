// rollup.config.js
import {readFileSync} from 'fs'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

var commitHash = (function () {
  try {
    return readFileSync('.commithash', 'utf-8').trim()
  } catch (err ) {
    return 'unknown'
  }
})()

var pkg = JSON.parse(readFileSync('package.json', 'utf8'))
var banner = readFileSync('./src/zbanner.js', 'utf8')
    .replace('<@VERSION@>', pkg.version)
    .replace('<@TIME@>', new Date())
    .replace('<@commitHash@>', commitHash)
var name = 'cssobj_plugin_cssom'

export default {
  input: 'src/cssobj-plugin-cssom.js',
  banner: banner,
  output: [
      { format: 'iife', file: 'dist/cssobj-plugin-cssom.iife.js', name },
      { format: 'amd',  file: 'dist/cssobj-plugin-cssom.amd.js',name },
      { format: 'umd',  file: 'dist/cssobj-plugin-cssom.umd.js',name  },
      { format: 'cjs',  file: 'dist/cssobj-plugin-cssom.cjs.js'  },
      { format: 'es',   file: 'dist/cssobj-plugin-cssom.es.js'   }
  ],
  plugins:[
    nodeResolve(),
    commonjs()
  ],
}

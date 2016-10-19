# cssobj-plugin-cssom

[![Join the chat at https://gitter.im/css-in-js/cssobj](https://badges.gitter.im/css-in-js/cssobj.svg)](https://gitter.im/css-in-js/cssobj)

Apply cssobj Virtual CSS into browser's [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model).

This plugin already integrated into [cssobj](https://github.com/cssobj/cssobj), don't apply it twice if you use **cssobj**.

## Usage

``` javascript
var cssobj_core = require('cssobj-core')
var pluginCSSOM = require('cssobj-plugin-cssom')
var cssobj = cssobj_core({plugins: [pluginCSSOM(option)] })
cssobj(obj)

// cssobj will auto applied into <head>
```

## Install

``` javascript
npm install cssobj/cssobj-plugin-cssom
```

## API

### `var plugin = pluginCSSOM(option)`

Get plugin function to apply, pass option.

### *PARAMS*

### `option`

 - `name` : {string} The id for `<style>` tag, if omit, will using random string.

 - `attrs` : {object} The key/val to apply to `<style>` tag as attributes.

### *RETURN*

A function can be as cssobj plugin.


## Example

``` javascript
pluginCSSOM({name:'index-page-style'})

pluginCSSOM({name:'index-page-style', attrs:{type:'text/css', media:'screen'} })

```

## Helpers

This plugin can use with [plugin-csstext](https://github.com/cssobj/cssobj-plugin-csstext) to display cssText from generated CSSOM.




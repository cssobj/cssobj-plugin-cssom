// plugin for cssobj

function dashify(str) {
  return str
    .replace(/([A-Z])/g, function(m){return "-"+m.toLowerCase()})
    .replace(/(^\s+|\s+$)/g, '')
}



function createDOM (id, option) {
  var el = document.createElement('style')
  document.getElementsByTagName('head')[0].appendChild(el)
  el.setAttribute('id', id)
  if (option && typeof option == 'object' && option.attrs)
    for (var i in option.attrs) {
      el.setAttribute(i, option.attrs[i])
    }
  return el
}

var addCSSRule  = function (parent, selector, body, selSep) {
  var rules = parent.cssRules || parent.rules
  var pos = rules.length
  var omArr = []
  if ('insertRule' in parent) {
    parent.insertRule(selector + '{' + body + '}', pos)
  } else if ('addRule' in parent) {
    try{
      [].concat(selSep||selector).forEach(function(v) {
        parent.addRule(v, body, pos)
      })
    }catch(e) {
      console.log(e, selector, body)
    }
  }

  for(var i = pos, len = rules.length; i < len; i++) {
    omArr.push(rules[i])
  }
  return omArr
}

var reWholeRule = /keyframes|page/

var atomGroupRule = function(node) {
  return !node ? false : reWholeRule.test(node.at) || node.parentRule && reWholeRule.test(node.parentRule.at)
}


function cssobj_plugin_post_cssom (option) {

  option = option || {}

  if (!option.name) option.name = +new Date()
  option.name += ''

  var id = 'style_cssobj_' + option.name.replace(/[^a-zA-Z0-9$_]/g, '')

  var dom = document.getElementById(id) || createDOM(id, option)
  var sheet = dom.sheet || dom.styleSheet
  window.s = sheet


  return function (result) {

    var walk = function(node, opt) {
      if (!node) return

      // cssobj generate vanilla Array, it's safe to use constructor, fast
      if (node.constructor === Array) return node.map(function (v) {walk(v, opt)})

      var postArr = []
      var children = node.children
      var isGroup = node.type=='group'

      var prop = node.prop
      var selText = node.selText

      if(atomGroupRule(node)) opt = opt || []

      var parent = node.parentRule && node.parentRule.omGroup || sheet

      // get cssText from prop
      var cssText = Object.keys(prop).map(function(k) {
        for(var v, s='', i=prop[k].length; i--; ) {
          v = prop[k][i]
          s += k.charAt(0)=='@'
            ? dashify(k)+' '+v+';'
            : dashify(k)+': '+v+';'
        }
        return s
      }).join('')

      if(isGroup) {
        if(!atomGroupRule(node)) node.omGroup = addCSSRule(parent, node.groupText, '{}').pop()||null
      }

      if (cssText) {
        if(!atomGroupRule(node) && (!node.parentRule || node.parentRule.omGroup!==null)){
          node.omRule = addCSSRule(parent, selText, cssText, node.selSep)
        }
        opt && opt.push( selText ? selText + ' {' + cssText +'}' : cssText )
      }

      for (var c in children) {
        if(c==='' || children[c].at=='@media ') postArr.push(c)
        else walk(children[c], opt)
      }

      if(isGroup) {
        if(atomGroupRule(node)) {
          node.omRule = addCSSRule(parent, node.groupText, opt.join(''))
          delete opt
        }
      }

      // media rules need a stand alone block
      postArr.map(function(v) {
        walk(children[v], opt)
      })

    }

    if(!result.diff){
      walk(result.root)
    }else{
      console.log(result.diff)
    }


    return result
  }

}

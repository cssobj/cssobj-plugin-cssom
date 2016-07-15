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
      // console.log(e, selector, body)
    }
  }

  for(var i = pos, len = rules.length; i < len; i++) {
    omArr.push(rules[i])
  }
  return omArr
}

function getBodyCss(prop) {
  // get cssText from prop
  return Object.keys(prop).map(function(k) {
    for(var v, ret='', i=prop[k].length; i--; ) {
      v = prop[k][i]
      ret += k.charAt(0)=='@'
        ? dashify(k)+' '+v+';'
        : dashify(k)+': '+v+';'
    }
    return ret
  }).join('')
}

function cssobj_plugin_post_cssom (option) {

  option = option || {}

  if (!option.name) option.name = +new Date()
  option.name += ''

  var id = 'style_cssobj_' + option.name.replace(/[^a-zA-Z0-9$_]/g, '')

  var dom = document.getElementById(id) || createDOM(id, option)
  var sheet = dom.sheet || dom.styleSheet
  window.s = sheet

  // helper regexp & function
  var reWholeRule = /keyframes|page/
  var atomGroupRule = function(node) {
    return !node ? false : reWholeRule.test(node.at) || node.parentRule && reWholeRule.test(node.parentRule.at)
  }
  var getOm = function(node) {
    var p = node.parentRule
    return p && ('omGroup' in p) ? p.omGroup : sheet
  }


  return function (result) {

    var walk = function(node, opt) {
      if (!node) return

      // cssobj generate vanilla Array, it's safe to use constructor, fast
      if (node.constructor === Array) return node.map(function (v) {walk(v, opt)})

      var postArr = []
      var children = node.children
      var isGroup = node.type=='group'

      var selText = node.selText
      var cssText = getBodyCss(node.prop)

      if(atomGroupRule(node)) opt = opt || []


      if(isGroup) {
        if(!atomGroupRule(node)) node.omGroup = addCSSRule(sheet, node.groupText, '{}').pop()||null
      }

      if (cssText) {
        if(!atomGroupRule(node) && (!node.parentRule || node.parentRule.omGroup!==null)){
          node.omRule = addCSSRule(getOm(node), selText, cssText, node.selSep)
        }
        opt && opt.push( selText ? selText + ' {' + cssText +'}' : cssText )
      }

      for (var c in children) {
        if(c==='' || children[c].at=='@media ') postArr.push(c)
        else walk(children[c], opt)
      }

      if(isGroup) {
        if(atomGroupRule(node) && getOm(node)) {
          node.omRule = addCSSRule(getOm(node), node.groupText, opt.join(''))
          delete opt
        }
      }

      // media rules need a stand alone block
      postArr.map(function(v) {
        walk(children[v], opt)
      })

    }

    if(!result.diff) {
      walk(result.root)
    } else {

      var diff = result.diff

      if(diff.added) diff.added.forEach(function(node) {
        walk(node)
      })

      if(diff.removed) diff.removed.forEach(function(node) {
        node.omRule && node.omRule.forEach(function(rule) {
          var parent = rule.parentRule || sheet
          var rules = parent.cssRules || parent.rules
          var index = -1
          for(var i = 0, len = rules.length; i < len; i++) {
            if(rules[i]===rule) {
              index = i
              break
            }
          }
          if(index<0) return
          parent.removeRule
            ? parent.removeRule(index)
            : parent.deleteRule(index)
        })
      })

      if(diff.changed) diff.changed.forEach(function(node) {

        var om = node.omRule
        var diff = node.diff

        diff.added && diff.added.forEach(function(v) {
          om.forEach(function(rule) {
            rule.style[v] = node.prop[v][0]
          })
        })

        diff.changed && diff.changed.forEach(function(v) {
          om.forEach(function(rule) {
            rule.style[v] = node.prop[v][0]
          })
        })

        diff.removed && diff.removed.forEach(function(v) {
          om.forEach(function(rule) {
            rule.style.removeProperty
              ? rule.style.removeProperty(v)
              : rule.style.removeAttribute(v)
          })
        })

      })
    }


    return result
  }

}

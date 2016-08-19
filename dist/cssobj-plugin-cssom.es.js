// convert js prop into css prop (dashified)
function dashify(str) {
  return str.replace(/[A-Z]/g, function(m) {
    return '-' + m.toLowerCase()
  })
}

// capitalize str
function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.substr(1)
}

// random string, should used across all cssobj plugins
var random = (function () {
  var count = 0
  return function () {
    count++
    return '_' + Math.floor(Math.random() * Math.pow(2, 32)).toString(36) + count + '_'
  }
})()

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

var addCSSRule = function (parent, selector, body, node) {
  var isImportRule = /@import/i.test(node.selText)
  var rules = parent.cssRules || parent.rules
  var index=0

  var omArr = []
  var str = node.inline
      ? body.map(function(v) {
        return [node.selText, ' ', v]
      })
      : [[selector, '{', body.join(''), '}']]

  str.forEach(function(text) {
    if (parent.cssRules) {
      try {
        index = isImportRule ? 0 : rules.length
        parent.appendRule
          ? parent.appendRule(text.join(''))  // keyframes.appendRule return undefined
          : parent.insertRule(text.join(''), index) //firefox <16 also return undefined...

        omArr.push(rules[index])

      } catch(e) {
        // modern browser with prefix check, now only -webkit-
        // http://shouldiprefix.com/#animations
        // if(selector && selector.indexOf('@keyframes')==0) for(var ret, i = 0, len = cssPrefixes.length; i < len; i++) {
        //   ret = addCSSRule(parent, selector.replace('@keyframes', '@-'+cssPrefixes[i].toLowerCase()+'-keyframes'), body, node)
        //   if(ret.length) return ret
        // }
        // the rule is not supported, fail silently
        // console.log(e, selector, body, pos)
      }
    } else if (parent.addRule) {
      // https://msdn.microsoft.com/en-us/library/hh781508(v=vs.85).aspx
      // only supported @rule will accept: @import
      // old IE addRule don't support 'dd,dl' form, add one by one
      // selector normally is node.selTextPart, but have to be array type
      ![].concat(selector).forEach(function (sel) {
        try {
          // remove ALL @-rule support for old IE
          if(isImportRule) {
            index = parent.addImport(text[2])
            omArr.push(parent.imports[index])

            // IE addPageRule() return: not implemented!!!!
            // } else if (/@page/.test(sel)) {
            //   index = parent.addPageRule(sel, text[2], -1)
            //   omArr.push(rules[rules.length-1])

          } else if (!/^\s*@/.test(sel)) {
            parent.addRule(sel, text[2], rules.length)
            // old IE have bug: addRule will always return -1!!!
            omArr.push(rules[rules.length-1])
          }
        } catch(e) {
          // console.log(e, selector, body)
        }
      })
    }
  })

  return omArr
}

function getBodyCss (node) {
  // get cssText from prop
  var prop = node.prop
  return Object.keys(prop).map(function (k) {
    // skip $prop, e.g. $id, $order
    if(k.charAt(0)=='$') return ''
    for (var v, ret='', i = prop[k].length; i--;) {
      v = prop[k][i]

      // display:flex expand for vendor prefix
      var vArr = k=='display' && v=='flex'
        ? ['-webkit-box', '-ms-flexbox', '-webkit-flex', 'flex']
        : [v]

      ret += vArr.map(function(v2) {
        return node.inline ? k : dashify(prefixProp(k, true)) + ':' + v2 + ';'
      }).join('')
    }
    return ret
  })
}

// vendor prefix support
// borrowed from jQuery 1.12
var	cssPrefixes = [ "Webkit", "Moz", "ms", "O" ]
var cssPrefixesReg = new RegExp('^(?:' + cssPrefixes.join('|') + ')[A-Z]')
var	emptyStyle = document.createElement( "div" ).style
var testProp  = function (list) {
  for(var i = list.length; i--;) {
    if(list[i] in emptyStyle) return list[i]
  }
}

// cache cssProps
var	cssProps = {
  // normalize float css property
  'float': testProp(['styleFloat', 'cssFloat', 'float']),
  'flex': testProp(['WebkitBoxFlex', 'msFlex', 'WebkitFlex', 'flex'])
}


// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

  // shortcut for names that are not vendor prefixed
  if ( name in emptyStyle ) return

  // check for vendor prefixed names
  var preName, capName = name.charAt( 0 ).toUpperCase() + name.slice( 1 )
  var i = cssPrefixes.length

  while ( i-- ) {
    preName = cssPrefixes[ i ] + capName
    if ( preName in emptyStyle ) return preName
  }
}

// apply prop to get right vendor prefix
// cap=0 for no cap; cap=1 for capitalize prefix
function prefixProp (name, inCSS) {
  // $prop will skip
  if(name.charAt(0)=='$') return ''
  // find name and cache the name for next time use
  var retName = cssProps[ name ] ||
      ( cssProps[ name ] = vendorPropName( name ) || name)
  return inCSS   // if hasPrefix in prop
      ? cssPrefixesReg.test(retName) ? capitalize(retName) : name=='float' && name || retName  // fix float in CSS, avoid return cssFloat
      : retName
}


function cssobj_plugin_post_cssom (option) {
  option = option || {}

  var id = option.name
      ? (option.name+'').replace(/[^a-zA-Z0-9$_-]/g, '')
      : 'style_cssobj' + random()

  var dom = document.getElementById(id) || createDOM(id, option)
  var sheet = dom.sheet || dom.styleSheet

  // sheet.insertRule ("@import url('test.css');", 0)  // it's ok to insert @import, but only at top
  // sheet.insertRule ("@charset 'UTF-8';", 0)  // throw SyntaxError https://www.w3.org/Bugs/Public/show_bug.cgi?id=22207

  // IE has a bug, first comma rule not work! insert a dummy here
  // addCSSRule(sheet, 'html,body', [], {})

  // helper regexp & function
  // @page in FF not allowed pseudo @page :first{}, with SyntaxError: An invalid or illegal string was specified
  var reWholeRule = /page/i
  var atomGroupRule = function (node) {
    return !node ? false : reWholeRule.test(node.at) || node.parentRule && reWholeRule.test(node.parentRule.at)
  }

  var getParent = function (node) {
    var p = 'omGroup' in node ? node : node.parentRule
    return p && p.omGroup || sheet
  }

  var validParent = function (node) {
    return !node.parentRule || node.parentRule.omGroup !== null
  }

  var removeOneRule = function (rule) {
    if (!rule) return
    var parent = rule.parentRule || sheet
    var rules = parent.cssRules || parent.rules
    var removeFunc = function (v, i) {
      if((v===rule)) {
        parent.deleteRule
          ? parent.deleteRule(rule.keyText || i)
          : parent.removeRule(i)
        return true
      }
    }
    // sheet.imports have bugs in IE:
    // > sheet.removeImport(0)  it's work, then again
    // > sheet.removeImport(0)  it's not work!!!
    //
    // parent.imports && [].some.call(parent.imports, removeFunc)
    ![].some.call(rules, removeFunc)
  }

  function removeNode (node) {
    // remove mediaStore for old IE
    var groupIdx = mediaStore.indexOf(node)
    if (groupIdx > -1) {
      // before remove from mediaStore
      // don't forget to remove all children, by a walk
      node.mediaEnabled = false
      walk(node)
      mediaStore.splice(groupIdx, 1)
    }
    // remove Group rule and Nomal rule
    ![node.omGroup].concat(node.omRule).forEach(removeOneRule)
  }

  // helper function for addNormalrule
  var addNormalRule = function (node, selText, cssText) {
    if(!cssText) return
    // get parent to add
    var parent = getParent(node)
    if (validParent(node))
      return node.omRule = addCSSRule(parent, selText, cssText, node)
    else if (node.parentRule) {
      // for old IE not support @media, check mediaEnabled, add child nodes
      if (node.parentRule.mediaEnabled) {
        if (!node.omRule) return node.omRule = addCSSRule(parent, selText, cssText, node)
      }else if (node.omRule) {
        node.omRule.forEach(removeOneRule)
        delete node.omRule
      }
    }
  }

  var mediaStore = []

  var checkMediaList = function () {
    mediaStore.forEach(function (v) {
      v.mediaEnabled = v.mediaTest()
      walk(v)
    })
  }

  if (window.attachEvent) {
    window.attachEvent('onresize', checkMediaList)
  } else if (window.addEventListener) {
    window.addEventListener('resize', checkMediaList, true)
  }

  var walk = function (node, store) {
    if (!node) return

    // cssobj generate vanilla Array, it's safe to use constructor, fast
    if (node.constructor === Array) return node.map(function (v) {walk(v, store)})

    // skip $key node
    if(node.key && node.key.charAt(0)=='$' || !node.prop) return

    // nested media rule will pending proceed
    if(node.at=='media' && node.selParent && node.selParent.postArr) {
      return node.selParent.postArr.push(node)
    }

    node.postArr = []
    var children = node.children
    var isGroup = node.type == 'group'

    if (atomGroupRule(node)) store = store || []

    if (isGroup) {
      // if it's not @page, @keyframes (which is not groupRule in fact)
      if (!atomGroupRule(node)) {
        var reAdd = 'omGroup' in node
        if (node.at=='media' && option.noMedia) node.omGroup = null
        else [''].concat(cssPrefixes).some(function (v) {
          return node.omGroup = addCSSRule(
            // all groupRule will be added to root sheet
            sheet,
            '@' + (v ? '-' + v.toLowerCase() + '-' : v) + node.groupText.slice(1), [], node
          ).pop() || null
        })


        // when add media rule failed, build test function then check on window.resize
        if (node.at == 'media' && !reAdd && !node.omGroup) {
          // build test function from @media rule
          var mediaTest = new Function(
            'return ' + node.groupText
              .replace(/@media\s*/i, '')
              .replace(/min-width:/ig, '>=')
              .replace(/max-width:/ig, '<=')
              .replace(/(px)?\s*\)/ig, ')')
              .replace(/\band\b/ig, '&&')
              .replace(/,/g, '||')
              .replace(/\(/g, '(document.documentElement.offsetWidth')
          )

          try {
            // first test if it's valid function
            mediaTest()
            node.mediaTest = mediaTest
            node.mediaEnabled = mediaTest()
            mediaStore.push(node)
          } catch(e) {}
        }
      }
    }

    var selText = node.selTextPart
    var cssText = getBodyCss(node)

    // it's normal css rule
    if (cssText.join('')) {
      if (!atomGroupRule(node)) {
        addNormalRule(node, selText, cssText)
      }
      store && store.push(selText ? selText + ' {' + cssText.join('') + '}' : cssText)
    }

    for (var c in children) {
      // empty key will pending proceed
      if (c === '') node.postArr.push(children[c])
      else walk(children[c], store)
    }

    if (isGroup) {
      // if it's @page, @keyframes
      if (atomGroupRule(node) && validParent(node)) {
        addNormalRule(node, node.groupText, store)
        store = null
      }
    }

    // media rules need a stand alone block
    var postArr = node.postArr
    delete node.postArr
    postArr.map(function (v) {
      walk(v, store)
    })
  }

  return {
    post: function (result) {
      result.cssdom = dom
      if (!result.diff) {
        // it's first time render
        walk(result.root)
      } else {
        // it's not first time, patch the diff result to CSSOM
        var diff = result.diff

        // node added
        if (diff.added) diff.added.forEach(function (node) {
          walk(node)
        })

        // node removed
        if (diff.removed) diff.removed.forEach(function (node) {
          // also remove all child group & sel
          node.selChild && node.selChild.forEach(removeNode)
          removeNode(node)
        })

        // node changed, find which part should be patched
        if (diff.changed) diff.changed.forEach(function (node) {
          var om = node.omRule
          var diff = node.diff

          if (!om) om = addNormalRule(node, node.selTextPart, getBodyCss(node))

          // added have same action as changed, can be merged... just for clarity
          diff.added && diff.added.forEach(function (v) {
            var prefixV = prefixProp(v)
            prefixV && om && om.forEach(function (rule) {
              try{
                rule.style[prefixV] = node.prop[v][0]
              }catch(e){}
            })
          })

          diff.changed && diff.changed.forEach(function (v) {
            var prefixV = prefixProp(v)
            prefixV && om && om.forEach(function (rule) {
              try{
                rule.style[prefixV] = node.prop[v][0]
              }catch(e){}
            })
          })

          diff.removed && diff.removed.forEach(function (v) {
            var prefixV = prefixProp(v)
            prefixV && om && om.forEach(function (rule) {
              try{
                rule.style.removeProperty
                  ? rule.style.removeProperty(prefixV)
                  : rule.style.removeAttribute(prefixV)
              }catch(e){}
            })
          })
        })
      }

      return result
    }
  }
}

export default cssobj_plugin_post_cssom;
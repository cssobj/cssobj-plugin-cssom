// version: '3.0.0'
// commitHash: 23445070d1843c35fdcbaf4b4dbe21989859dca5
// time: Thu Dec 15 2016 13:58:38 GMT+0800 (HKT)



// helper functions for cssobj

// check n is numeric, or string of numeric


function own(o, k) {
  return {}.hasOwnProperty.call(o, k)
}

// set default option (not deeply)


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

// repeat str for num times


// random string, should used across all cssobj plugins
var random = (function () {
  var count = 0;
  return function (prefix) {
    count++;
    return '_' + (prefix||'') + Math.floor(Math.random() * Math.pow(2, 32)).toString(36) + count + '_'
  }
})();

// extend obj from source, if it's no key in obj, create one


// ensure obj[k] as array, then push v into it
function arrayKV (obj, k, v, reverse, unique) {
  obj[k] = k in obj ? [].concat(obj[k]) : [];
  if(unique && obj[k].indexOf(v)>-1) return
  reverse ? obj[k].unshift(v) : obj[k].push(v);
}

// replace find in str, with rep function result


// get parents array from node (when it's passed the test)


// split selector etc. aware of css attributes


// checking for valid css value

// plugin for cssobj

function createDOM (rootDoc, id, option) {
  var el = rootDoc.getElementById(id);
  var head = rootDoc.getElementsByTagName('head')[0];
  if(el) {
    if(option.append) return el
    el.parentNode && el.parentNode.removeChild(el);
  }
  el = rootDoc.createElement('style');
  head.appendChild(el);
  el.setAttribute('id', id);
  if (option.attrs)
    for (var i in option.attrs) {
      el.setAttribute(i, option.attrs[i]);
    }
  return el
}

var addCSSRule = function (parent, selector, body, node) {
  var isImportRule = /@import/i.test(node.selText);
  var rules = parent.cssRules || parent.rules;
  var index=0;

  var omArr = [];
  var str = node.inline
      ? body.map(function(v) {
        return [node.selText, ' ', v]
      })
      : [[selector, '{', body.join(''), '}']];

  str.forEach(function(text) {
    if (parent.cssRules) {
      try {
        index = isImportRule ? 0 : rules.length;
        parent.appendRule
          ? parent.appendRule(text.join(''))  // keyframes.appendRule return undefined
          : parent.insertRule(text.join(''), index); //firefox <16 also return undefined...

        omArr.push(rules[index]);

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
      [].concat(selector).forEach(function (sel) {
        try {
          // remove ALL @-rule support for old IE
          if(isImportRule) {
            index = parent.addImport(text[2]);
            omArr.push(parent.imports[index]);

            // IE addPageRule() return: not implemented!!!!
            // } else if (/@page/.test(sel)) {
            //   index = parent.addPageRule(sel, text[2], -1)
            //   omArr.push(rules[rules.length-1])

          } else if (!/^\s*@/.test(sel)) {
            parent.addRule(sel, text[2], rules.length);
            // old IE have bug: addRule will always return -1!!!
            omArr.push(rules[rules.length-1]);
          }
        } catch(e) {
          // console.log(e, selector, body)
        }
      });
    }
  });

  return omArr
};

function getBodyCss (node) {
  // get cssText from prop
  var prop = node.prop;
  return Object.keys(prop).map(function (k) {
    // skip $prop, e.g. $id, $order
    if(k[0]=='$') return ''
    for (var v, ret='', i = prop[k].length; i--;) {
      v = prop[k][i];

      // value expand & merge should be done as value function/plugin in cssobj-core >=0.5.0
      ret += node.inline ? k : dashify(prefixProp(k, true)) + ':' + v + ';';
    }
    return ret
  })
}

// vendor prefix support
// borrowed from jQuery 1.12
var cssPrefixes = [ "Webkit", "Moz", "ms", "O" ];
var cssPrefixesReg = new RegExp('^(?:' + cssPrefixes.join('|') + ')[A-Z]');
var emptyStyle = document.createElement( "div" ).style;
var testProp  = function (list) {
  for(var i = list.length; i--;) {
    if(list[i] in emptyStyle) return list[i]
  }
};

//
/**
 * cache cssProps
 * the value is JS format, will be used:
 * 1. diff & patch properties for CSSOM
 * 2. vendorPrefix property name checking
 */
var cssProps = {
  // normalize float css property
  'float': testProp(['styleFloat', 'cssFloat', 'float'])
};


// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

  // shortcut for names that are not vendor prefixed
  // when name already have '-' as first char, don't prefix
  if ( name in emptyStyle || name[0] == '-') return

  // check for vendor prefixed names
  var preName, capName = capitalize(name);
  var i = cssPrefixes.length;

  while ( i-- ) {
    preName = cssPrefixes[ i ] + capName;
    if ( preName in emptyStyle ) return preName
  }
}

// apply prop to get right vendor prefix
// inCSS false=camelcase; true=dashed
function prefixProp (name, inCSS) {
  // $prop will skip
  if(name[0]=='$') return ''
  // find name and cache the name for next time use
  var retName = cssProps[ name ] ||
      ( cssProps[ name ] = vendorPropName( name ) || name);
  return inCSS   // if hasPrefix in prop
      ? cssPrefixesReg.test(retName) ? capitalize(retName) : name=='float' && name || retName  // fix float in CSS, avoid return cssFloat
      : retName
}

/**
 * Get value and important flag from value str
 * @param {CSSStyleRule} rule css style rule object
 * @param {string} prop prop to set
 * @param {string} val value string
 */
function setCSSProperty (styleObj, prop, val) {
  var value;
  var important = /^(.*)!(important)\s*$/i.exec(val);
  var propCamel = prefixProp(prop);
  var propDash = prefixProp(prop, true);
  if(important) {
    value = important[1];
    important = important[2];
    if(styleObj.setProperty) styleObj.setProperty(propDash, value, important);
    else {
      // for old IE, cssText is writable, and below is valid for contain !important
      // don't use styleObj.setAttribute since it's not set important
      // should do: delete styleObj[propCamel], but not affect result

      // only work on <= IE8: s.style['FONT-SIZE'] = '12px!important'
      styleObj[propDash.toUpperCase()] = val;
      // refresh cssText, the whole rule!
      styleObj.cssText = styleObj.cssText;
    }
  } else {
    styleObj[propCamel] = val;
  }
}

function cssobj_plugin_post_cssom (option) {
  option = option || {};

  // prefixes array can change the global default vendor prefixes
  if(option.vendors) cssPrefixes = option.vendors;

  var id = option.id || 'cssobj' + random();

  var frame = option.frame;
  var rootDoc = frame ? frame.contentDocument||frame.contentWindow.document : document;
  var dom = createDOM(rootDoc, id, option);
  var sheet = dom.sheet || dom.styleSheet;

  // sheet.insertRule ("@import url('test.css');", 0)  // it's ok to insert @import, but only at top
  // sheet.insertRule ("@charset 'UTF-8';", 0)  // throw SyntaxError https://www.w3.org/Bugs/Public/show_bug.cgi?id=22207

  // IE has a bug, first comma rule not work! insert a dummy here
  // addCSSRule(sheet, 'html,body', [], {})

  // helper regexp & function
  // @page in FF not allowed pseudo @page :first{}, with SyntaxError: An invalid or illegal string was specified
  var reWholeRule = /page/i;
  var atomGroupRule = function (node) {
    return !node ? false : reWholeRule.test(node.at) || node.parentRule && reWholeRule.test(node.parentRule.at)
  };

  var getParent = function (node) {
    var p = 'omGroup' in node ? node : node.parentRule;
    return p && p.omGroup || sheet
  };

  var validParent = function (node) {
    return !node.parentRule || node.parentRule.omGroup !== null
  };

  var removeOneRule = function (rule) {
    if (!rule) return
    var parent = rule.parentRule || sheet;
    var rules = parent.cssRules || parent.rules;
    var removeFunc = function (v, i) {
      if((v===rule)) {
        parent.deleteRule
          ? parent.deleteRule(rule.keyText || i)
          : parent.removeRule(i);
        return true
      }
    };[].some.call(rules, removeFunc);
  };

  function removeNode (node) {
    // remove mediaStore for old IE
    var groupIdx = mediaStore.indexOf(node);
    if (groupIdx > -1) {
      // before remove from mediaStore
      // don't forget to remove all children, by a walk
      node.mediaEnabled = false;
      walk(node);
      mediaStore.splice(groupIdx, 1);
    }
    // remove Group rule and Nomal rule
    [node.omGroup].concat(node.omRule).forEach(removeOneRule);
  }

  // helper function for addNormalrule
  var addNormalRule = function (node, selText, cssText) {
    if(!cssText) return
    // get parent to add
    var parent = getParent(node);
    if (validParent(node))
      return node.omRule = addCSSRule(parent, selText, cssText, node)
    else if (node.parentRule) {
      // for old IE not support @media, check mediaEnabled, add child nodes
      if (node.parentRule.mediaEnabled) {
        if (!node.omRule) return node.omRule = addCSSRule(parent, selText, cssText, node)
      } else if (node.omRule) {
        node.omRule.forEach(removeOneRule);
        delete node.omRule;
      }
    }
  };

  var mediaStore = [];

  var checkMediaList = function () {
    mediaStore.forEach(function (v) {
      v.mediaEnabled = v.mediaTest(rootDoc);
      walk(v);
    });
  };

  if (window.attachEvent) {
    window.attachEvent('onresize', checkMediaList);
  } else if (window.addEventListener) {
    window.addEventListener('resize', checkMediaList, true);
  }

  var walk = function (node, store) {
    if (!node) return

    // cssobj generate vanilla Array, it's safe to use constructor, fast
    if (node.constructor === Array) return node.map(function (v) {walk(v, store);})

    // skip $key node
    if(node.key && node.key[0]=='$' || !node.prop) return

    // nested media rule will pending proceed
    if(node.at=='media' && node.selParent && node.selParent.postArr) {
      return node.selParent.postArr.push(node)
    }

    node.postArr = [];
    var children = node.children;
    var isGroup = node.type == 'group';

    if (atomGroupRule(node)) store = store || [];

    if (isGroup) {
      // if it's not @page, @keyframes (which is not groupRule in fact)
      if (!atomGroupRule(node)) {
        var reAdd = 'omGroup' in node;
        if (node.at=='media' && option.noMedia) node.omGroup = null;
        else [''].concat(cssPrefixes).some(function (v) {
          return node.omGroup = addCSSRule(
            // all groupRule will be added to root sheet
            sheet,
            '@' + (v ? '-' + v.toLowerCase() + '-' : v) + node.groupText.slice(1), [], node
          ).pop() || null
        });


        // when add media rule failed, build test function then check on window.resize
        if (node.at == 'media' && !reAdd && !node.omGroup) {
          // build test function from @media rule
          var mediaTest = new Function('doc',
            'return ' + node.groupText
              .replace(/@media\s*/i, '')
              .replace(/min-width:/ig, '>=')
              .replace(/max-width:/ig, '<=')
              .replace(/(px)?\s*\)/ig, ')')
              .replace(/\band\b/ig, '&&')
              .replace(/,/g, '||')
              .replace(/\(/g, '(doc.documentElement.offsetWidth')
          );

          try {
            // first test if it's valid function
            var mediaEnabled = mediaTest(rootDoc);
            node.mediaTest = mediaTest;
            node.mediaEnabled = mediaEnabled;
            mediaStore.push(node);
          } catch(e) {}
        }
      }
    }

    var selText = node.selTextPart;
    var cssText = getBodyCss(node);

    // it's normal css rule
    if (cssText.join('')) {
      if (!atomGroupRule(node)) {
        addNormalRule(node, selText, cssText);
      }
      store && store.push(selText ? selText + ' {' + cssText.join('') + '}' : cssText);
    }

    for (var c in children) {
      // empty key will pending proceed
      if (c === '') node.postArr.push(children[c]);
      else walk(children[c], store);
    }

    if (isGroup) {
      // if it's @page, @keyframes
      if (atomGroupRule(node) && validParent(node)) {
        addNormalRule(node, node.groupText, store);
        store = null;
      }
    }

    // media rules need a stand alone block
    var postArr = node.postArr;
    delete node.postArr;
    postArr.map(function (v) {
      walk(v, store);
    });
  };

  return {
    post: function (result) {
      result.cssdom = dom;
      if (!result.diff) {
        // it's first time render
        walk(result.root);
      } else {
        // it's not first time, patch the diff result to CSSOM
        var diff = result.diff;

        // node added
        if (diff.added) diff.added.forEach(function (node) {
          walk(node);
        });

        // node removed
        if (diff.removed) diff.removed.forEach(function (node) {
          // also remove all child group & sel
          node.selChild && node.selChild.forEach(removeNode);
          removeNode(node);
        });

        // node changed, find which part should be patched
        if (diff.changed) diff.changed.forEach(function (node) {
          var om = node.omRule;
          var diff = node.diff;

          if (!om) om = addNormalRule(node, node.selTextPart, getBodyCss(node))

          // added have same action as changed, can be merged... just for clarity
          ;[].concat(diff.added, diff.changed).forEach(function (v) {
            v && om && om.forEach(function (rule) {
              try{
                setCSSProperty(rule.style, v, node.prop[v][0]);
              }catch(e){}
            });
          });

          diff.removed && diff.removed.forEach(function (v) {
            var prefixV = prefixProp(v);
            prefixV && om && om.forEach(function (rule) {
              try{
                rule.style.removeProperty
                  ? rule.style.removeProperty(prefixV)
                  : rule.style.removeAttribute(prefixV);
              }catch(e){}
            });
          });
        });
      }

      return result
    }
  }
}

export default cssobj_plugin_post_cssom;

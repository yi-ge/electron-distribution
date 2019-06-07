/* eslint-disable no-extend-native */
// https://github.com/afshinm/Json-to-HTML-Table/blob/master/json-to-table.js
/**
 * JavaScript format string function
 *
 */
String.prototype.format = function () {
  var args = arguments
  return this.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number]
      : '{' + number + '}'
  })
}

/**
 * Return just the keys from the input array, optionally only for the specified search_value
 * version: 1109.2015
 *  discuss at: http://phpjs.org/functions/arrayKeys
 *  +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
 *  +      input by: Brett Zamir (http://brett-zamir.me)
 *  +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
 *  +   improved by: jd
 *  +   improved by: Brett Zamir (http://brett-zamir.me)
 *  +   input by: P
 *  +   bugfixed by: Brett Zamir (http://brett-zamir.me)
 *  *     example 1: arrayKeys( {firstname: 'Kevin', surname: 'van Zonneveld'} );
 *  *     returns 1: {0: 'firstname', 1: 'surname'}
 */
const arrayKeys = (input, searchValue, argStrict) => {
  var search = typeof searchValue !== 'undefined'
  var tmpArr = []
  var strict = !!argStrict
  var include = true
  var key = ''

  if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
    return input.keys(searchValue, argStrict)
  }

  for (key in input) {
    if (input.hasOwnProperty(key)) {
      include = true
      if (search) {
        if (strict && input[key] !== searchValue) {
          include = false
        } else if (input[key] !== searchValue) {
          include = false
        }
      }
      if (include) {
        tmpArr[tmpArr.length] = key
      }
    }
  }
  return tmpArr
}

/**
 * Convert a Javascript Oject array or String array to an HTML table
 * JSON parsing has to be made before function call
 * It allows use of other JSON parsing methods like jQuery.parseJSON
 * http(s)://, ftp://, file:// and javascript:; links are automatically computed
 *
 * JSON data samples that should be parsed and then can be converted to an HTML table
 *     var objectArray = '[{"Total":"34","Version":"1.0.4","Office":"New York"},{"Total":"67","Version":"1.1.0","Office":"Paris"}]';
 *     var stringArray = '["New York","Berlin","Paris","Marrakech","Moscow"]';
 *     var nestedTable = '[{ key1: "val1", key2: "val2", key3: { tableId: "tblIdNested1", tableClassName: "clsNested", linkText: "Download", data: [{ subkey1: "subval1", subkey2: "subval2", subkey3: "subval3" }] } }]';
 *
 * Code sample to create a HTML table Javascript String
 *     var jsonHtmlTable = ConvertJsonToTable(eval(dataString), 'jsonTable', null, 'Download');
 *
 * Code sample explaned
 *  - eval is used to parse a JSON dataString
 *  - table HTML id attribute will be 'jsonTable'
 *  - table HTML class attribute will not be added
 *  - 'Download' text will be displayed instead of the link itself
 *
 * @author Afshin Mehrabani <afshin dot meh at gmail dot com>
 *
 * @class ConvertJsonToTable
 *
 * @method ConvertJsonToTable
 *
 * @param parsedJson object Parsed JSON data
 * @param tableId string Optional table id
 * @param tableClassName string Optional table css class name
 * @param linkText string Optional text replacement for link pattern
 *
 * @return string Converted JSON to HTML table
 */

const convertJsonToTable = (parsedJson, tableId, tableClassName, linkText) => {
  // Patterns for links and NULL value
  let italic = '<i>{0}</i>'
  let link = linkText ? '<a href="{0}">' + linkText + '</a>'
    : '<a href="{0}">{0}</a>'
  let log = '<a href="javascript:showLog(\'{0}\')">{0}</a>'

  // Pattern for table
  let idMarkup = tableId ? ' id="' + tableId + '"'
    : ''

  let classMarkup = tableClassName ? ' class="' + tableClassName + '"'
    : ''

  let tbl = '<table border="1" cellpadding="1" cellspacing="1"' + idMarkup + classMarkup + '>{0}{1}</table>'

  // Patterns for table content
  let th = '<thead>{0}</thead>'
  let tb = '<tbody>{0}</tbody>'
  let tr = '<tr>{0}</tr>'
  let thRow = '<th>{0}</th>'
  let tdRow = '<td>{0}</td>'
  let thCon = ''
  let tbCon = ''
  let trCon = ''

  if (parsedJson) {
    let isStringArray = typeof (parsedJson[0]) === 'string'
    let headers

    // Create table headers from JSON data
    // If JSON data is a simple string array we create a single table header
    if (isStringArray) {
      thCon += thRow.format('value')
    } else {
      // If JSON data is an object array, headers are automatically computed
      if (typeof (parsedJson[0]) === 'object') {
        headers = arrayKeys(parsedJson[0])

        for (let i = 0; i < headers.length; i++) {
          thCon += thRow.format(headers[i])
        }
      }
    }
    th = th.format(tr.format(thCon))

    // Create table rows from Json data
    if (isStringArray) {
      for (let i = 0; i < parsedJson.length; i++) {
        tbCon += tdRow.format(parsedJson[i])
        trCon += tr.format(tbCon)
        tbCon = ''
      }
    } else {
      if (headers) {
        let urlRegExp = new RegExp(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig) // eslint-disable-line
        let javascriptRegExp = new RegExp(/(^javascript:[\s\S]*;$)/ig)
        let logRegExp = new RegExp(/(.log$)/ig)

        for (let i = 0; i < parsedJson.length; i++) {
          for (let j = 0; j < headers.length; j++) {
            let value = parsedJson[i][headers[j]]
            let isUrl = urlRegExp.test(value) || javascriptRegExp.test(value)
            let isLog = logRegExp.test(value)

            if (isUrl) { // If value is URL we auto-create a link
              tbCon += tdRow.format(link.format(value))
            } else if (isLog) {
              tbCon += tdRow.format(log.format(value))
            } else {
              if (value) {
                if (typeof (value) === 'object') {
                  // for supporting nested tables
                  tbCon += tdRow.format(convertJsonToTable(eval(value.data), value.tableId, value.tableClassName, value.linkText)) // eslint-disable-line
                } else {
                  tbCon += tdRow.format(value)
                }
              } else { // If value == null we format it like PhpMyAdmin NULL values
                tbCon += tdRow.format(italic.format(value).toUpperCase())
              }
            }
          }
          trCon += tr.format(tbCon)
          tbCon = ''
        }
      }
    }
    tb = tb.format(trCon)
    tbl = tbl.format(th, tb)

    return tbl
  }
  return null
}

window.convertJsonToTable = convertJsonToTable

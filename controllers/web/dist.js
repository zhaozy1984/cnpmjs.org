/**!
 * cnpmjs.org - controllers/web/dist.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:web:dist');
var mime = require('mime');
var Dist = require('../../proxy/dist');
var config = require('../../config');
var downloadAsReadStream = require('../utils').downloadAsReadStream;

function padding(max, current, pad) {
  pad = pad || ' ';
  var left = max - current;
  var str = '';
  for (var i = 0; i < left; i++) {
    str += pad;
  }
  return str;
}

exports.list = function* (next) {
  var params = this.params;
  var url = params[0] || '/';
  var isDir = url[url.length - 1] === '/';
  if (!isDir) {
    return yield* download.call(this, next);
  }

  var items = yield* Dist.listdir(url);
  yield this.render('dist', {
    title: 'Mirror index of ' + config.disturl + url,
    disturl: config.disturl,
    dirname: url,
    items: items,
    padding: padding
  });
};

 function* download(next) {
  var fullname = this.params[0];
  var info = yield* Dist.getfile(fullname);
  debug('download %s got %j', fullname, info);
  if (!info || !info.url) {
    return yield* next;
  }

  if (info.url.indexOf('http') === 0) {
    return this.redirect(info.url);
  }

  // download it from nfs
  if (typeof info.size === 'number') {
    this.set('Content-Length', info.size);
  }
  this.set('Content-Type', mime.lookup(info.url));
  this.set('Content-Disposition', 'attachment; filename="' + info.name + '"');
  this.set('ETag', info.sha1);

  this.body = yield* downloadAsReadStream(info.url);
}

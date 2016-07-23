/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Scott Beck @bline
*/

var loaderUtils = require('loader-utils');
var path = require('path');

module.exports = function(source) {

  this.cacheable && this.cacheable(true);

  var query = loaderUtils.parseQuery(this.query),
      options = this.options,
      pugConfig = options[query.configKey || 'pugHtml'] || {},
      pug = pugConfig.pug || require('pug'),
      pugOptions = {
        filename: this.resourcePath,
        compileDebug: query.compileDebug || pugConfig.compileDebug,
        basedir: query.basedir || pugConfig.basedir,
        pretty: query.pretty || pugConfig.pretty,
        doctype: query.doctype || pugConfig.doctype,
        inlineRuntimeFunctions: query.inlineRuntimeFunctions || pugConfig.inlineRuntimeFunctions,
        globals: query.globals || pugConfig.globals,
        self: query.self || pugConfig.self,
        includeSources: query.compileDebug || pugConfig.compileDebug,
        debug: query.debug || pugConfig.debug,
        templateName: query.name  || pugConfig.name,
        filters: query.filters || pugConfig.filters,
        filterOptions: query.filterOptions || pugConfig.filterOptions,
        plugins: query.plugins || pugConfig.plugins
      },
      template = pug.compileClientWithDependenciesTracked(source, pugOptions),
      modOptions = Object.keys(options).reduce(function(acc, key) {
        acc[key] = options[key];
        return acc;
      }, {}),
      moduleBody, module, moduleRequire;

  template.dependencies.forEach(function(dep) {
    this.addDependency(dep);
  }.bind(this));

  modOptions.recursive = true;
  modOptions.resolve = {
    loaders: options.module ? options.module.loaders : options.resolve.loaders,
    extensions: options.resolve.extensions,
    modulesDirectories: (options.resolve.modulesDirectories || []).concat(options.resolve.fallback || [])
  };

  moduleBody = 'var pug=require(' + resolve('pug-runtime') + ');' +
    'require=require(' + resolve('enhanced-require') + ')' +
    '(module,require(' + resolve('./json2regexp') + ')' +
    '(' + JSON.stringify(modOptions, toString) + '));' +
    template.body + ';module.exports=template;template.__require=require';
  module = this.exec(moduleBody, this.resource);
  moduleRequire = module.__require;

  for (var file in moduleRequire.contentCache) {
    this.addDependency && this.addDependency(file);
  }

  return module(query.locals || query);

};

function resolve(path) {
  return JSON.stringify(require.resolve(path));
}

function toString(key, value) {
  if (!(value instanceof RegExp)) return value;
  return value.toString();
}

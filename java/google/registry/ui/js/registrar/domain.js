// Copyright 2017 The Nomulus Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('registry.registrar.Domain');

goog.require('goog.json');
goog.require('registry.registrar.XmlResourceComponent');
goog.require('registry.soy.forms');
goog.require('registry.soy.registrar.domain');
goog.require('registry.soy.registrar.domainepp');
goog.require('registry.util');

goog.forwardDeclare('registry.registrar.Console');



/**
 * CRUD for EPP domain objects.
 * @param {!registry.registrar.Console} console
 * @constructor
 * @extends {registry.registrar.XmlResourceComponent}
 * @final
 */
registry.registrar.Domain = function(console) {
  registry.registrar.Domain.base(
      this, 'constructor',
      /** @type {function()} */ (registry.soy.registrar.domain.item),
      registry.soy.registrar.domainepp,
      console);
};
goog.inherits(registry.registrar.Domain,
              registry.registrar.XmlResourceComponent);


/** @override */
registry.registrar.Domain.prototype.newModel = function() {
  var newModel = {item: {'domain:period': ''}};
  return newModel;
};


/**
 * Prepare a fetch query for the domain by its id.
 * @param {!Object} params should have a name field with a
 *    possibly extended domain name id of the form "example.tld:1234"
 *    where the 1234 is the domain application id assigned by the
 *    backend flows.
 * @override
 */
registry.registrar.Domain.prototype.prepareFetch = function(params) {
  return registry.soy.registrar.domainepp.info(
        /** @type {{clTrid: ?, id: ?}} */ (params)).toString();
};


/** @override */
registry.registrar.Domain.prototype.processItem = function() {
  this.model.item = this.model['epp']['response']['resData']['domain:infData'];
  // Hoist extensions for easy soy access.
  var extension = this.model['epp']['response']['extension'];
  if (extension && extension['launch:infData']) {
    var extendedInfData = extension['launch:infData'];

    var mark = extendedInfData['mark:mark'];
    if (mark) {
      this.model.item['mark:mark'] = {'keyValue': goog.json.serialize(mark)};
    }
  }

  // Wrap single item into an array.
  if (this.model.item['domain:ns'] &&
      this.model.item['domain:ns']['domain:hostObj']) {
    var hostObj = this.model.item['domain:ns']['domain:hostObj'];
    if (!goog.isArray(hostObj)) {
      this.model.item['domain:ns']['domain:hostObj'] = [hostObj];
    }
  }
};


/** @override */
registry.registrar.Domain.prototype.setupEditor = function(objArgs) {
  this.typeCounts['contact'] = objArgs.item['domain:contact'] ?
      objArgs.item['domain:contact'].length : 0;

  var ji = objArgs.item['domain:ns'];
  this.typeCounts['host'] =
      ji && ji['domain:hostObj'] ? ji['domain:hostObj'].length : 0;

  this.formInputRowRemovable(
      document.querySelectorAll('input.domain-hostObj[readonly]'));

  this.formInputRowRemovable(
      document.querySelectorAll('input.domain-contact[readonly]'));

  this.addRemBtnHandlers(
      'contact',
      goog.bind(function() {
        return 'domain:contact[' + this.typeCounts['contact'] + ']';
      }, this),
      goog.bind(function(newFieldName) {
        return registry.util.renderBeforeRow(
            'domain-contacts-footer',
            /** @type {function()} */(registry.soy.forms.selectRow), {
              label: 'Type',
              name: newFieldName + '.@type',
              options: ['admin', 'tech', 'billing']
            });
      }, this));

  this.addRemBtnHandlers('host', goog.bind(function() {
    return 'domain:ns.domain:hostObj[' + this.typeCounts['host'] + ']';
  }, this));
};


/** @override */
registry.registrar.Domain.prototype.prepareCreate = function(params) {
  var form = params.item;
  params.nextId = form['domain:name'];

  // The presence of this field is used to signal extended template, so remove
  // if not used.
  if (form['smd:encodedSignedMark'] == '') {
    delete form['smd:encodedSignedMark'];
  }
  var xml = registry.soy.registrar.domainepp.create(
      /** @type {{clTrid: ?, item: ?}} */(params));
  return xml.toString();
};


/** @override */
registry.registrar.Domain.prototype.prepareUpdate =
    function(params) {
  var form = params.item;
  var nextId = form['domain:name'];
  params.nextId = nextId;

  if (form['domain:contact']) {
    this.addRem(form['domain:contact'], 'Contacts', params);
  }

  if (form['domain:ns'] && form['domain:ns']['domain:hostObj']) {
    this.addRem(form['domain:ns']['domain:hostObj'], 'Hosts', params);
  }

  if (form['domain:ns'] && form['domain:ns']['domain:hostObj']) {
    this.addRem(form['domain:ns']['domain:hostObj'], 'Hosts', params);
  }
  this.addRem(form['domain:contact'], 'Contacts', params);
  var xml = registry.soy.registrar.domainepp.update(
      /** @type {{clTrid: ?, item: ?}} */(params));

  return xml.toString();
};

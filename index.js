'use strict';

import PropTypes from 'prop-types';
import { Component } from 'react';
import defaultMessages from './defaultMessages';
import defaultRules from './defaultRules';

export default class ValidationComponent extends Component {

  constructor(props) {
      super(props);
      // array to store error on each fields
      // ex:
      // [{ fieldName: "name", messages: ["The field name is required."] }]
      this.errors = [];
      // Retrieve props
      this.deviceLocale = props.deviceLocale || 'en'; // ex: en, fr
      this.rules = props.rules || defaultRules; // rules for Validation
      this.messages = props.messages || defaultMessages;
      this.state = { error: false };
  }

  /*
  * Method validate to verify if each children respect the validator rules
  * Fields example (Array) :
  * fields = {
  *  input1: {
  *    required:true,
  *     numbers:true,
  *     maxLength:5
  *  }
  *}
  */
  validate(fields) {
    // Reset errors
    this._resetErrors();
    // Iterate over inner state
    this.validateObject(fields, this.state)
    return this.isFormValid();
  }

  validateObject(fields, object, parentFieldName) {
    if(object == null || object==='undefined') return;
    
    for (const key of Object.keys(object)) {
      if(typeof object[key] === 'object' && !Array.isArray(object[key]) && fields[key]){
        this.validateObject(fields[key], object[key], key)
      }
      else{
        // Check if child name is equals to fields array set up in parameters
        const rules = fields[key];
        if (rules) {
          // Check rule for current field
          if(parentFieldName == null || parentFieldName==='undefined')
            this._checkRules(key, rules, object[key]);
          else
            this._checkRules(parentFieldName + "." + key, rules, object[key]);
        }
      }
    }
  }

  // Method to check rules on a spefific field
  _checkRules(fieldName, rules, value) {
    if (!value && !rules.required ) {
      return; // if value is empty AND its not required by the rules, no need to check any other rules
    }

    for (const key of Object.keys(rules)) {
      const isRuleFn = (typeof this.rules[key] == "function");
      const isRegExp = (this.rules[key] instanceof RegExp);
      if ((isRuleFn && !this.rules[key](rules[key], value)) || (isRegExp && !this.rules[key].test(value))) {
        this._addError(fieldName, key, rules[key], isRuleFn);
      }
    }
  }

  // Add error
  // ex:
  // [{ fieldName: "name", messages: ["The field name is required."] }]
  _addError(fieldName, rule, value, isFn) {
    value = rule == 'minlength'? value-1 : value;
    const errMsg = this.messages[this.deviceLocale][rule].replace("{0}", fieldName).replace("{1}", value);
    let [error] = this.errors.filter(err => err.fieldName === fieldName);
    // error already exists
    if (error) {
      // Update existing element
      const index = this.errors.indexOf(error);
      error.messages.push(errMsg);
      error.failedRules.push(rule);
      this.errors[index] = error;
    } else {
      // Add new item
      this.errors.push({
        fieldName,
        failedRules: [rule],
        messages: [errMsg]
      });
    }
    this.setState({ error: true });
  }

  // Reset error fields
  _resetErrors() {
    this.errors = [];
  }

  // Method to check if the field is in error
  isFieldInError(fieldName) {
    return (this.errors.filter(err => err.fieldName === fieldName).length > 0);
  }

  isFormValid() {
    return this.errors.length == 0;
  }

  // Return an object where the keys are the field names and the value is an array with the rules that failed validation
  getFailedRules() {
    let failedRulesPerField = {}
    for (let index = 0; index < this.errors.length; index++) {
      let error = this.errors[index];
      failedRulesPerField[error.fieldName] = error.failedRules
    }
    return failedRulesPerField
  }

  // Return the rules that failed validation for the given field
  getFailedRulesInField(fieldName) {
    const foundError = this.errors.find(err => err.fieldName === fieldName)
    if (!foundError) {
      return []
    }
    return foundError.failedRules
  }

  // Concatenate each error messages
  getErrorMessages(separator="\n") {
    return this.errors.map((err) => err.messages.join(separator)).join(separator);
  }

  // Method to return errors on a specific field
  getErrorsInField(fieldName) {
    const foundError = this.errors.find(err => err.fieldName === fieldName)
    if (!foundError) {
      return []
    }
    return foundError.messages
  }
}

// PropTypes for component
ValidationComponent.propTypes = {
  deviceLocale: PropTypes.string, // Used for language locale
  rules: PropTypes.object, // rules for validations
  messages : PropTypes.object // messages for validation errors
}

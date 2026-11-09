/**
 * Reciprocating Pump Performance Calculator
 * Validation Module (validation.js)
 * Handles input verification, constraints, and error messaging.
 */

(function (window) {
  'use strict';

  var PumpValidator = {
    /**
     * Checks if a reading is currently in the initial zero/empty state.
     * @param {object} reading - Object containing rpm, pd, ps, r, t, tp.
     * @returns {boolean}
     */
    isInitialState: function (reading) {
      if (!reading) return true;
      var vals = [reading.rpm, reading.pd, reading.ps, reading.r, reading.t, reading.tp];
      return vals.every(function (v) {
        return v === '' || v === null || v === undefined || parseFloat(v) === 0;
      });
    },

    /**
     * Validates an individual numeric input.
     * @param {string|number} value - The input value to validate.
     * @param {string} fieldName - Human-readable field name.
     * @param {object} options - Rules: min, max, allowZero.
     * @returns {object} { isValid: boolean, message: string, parsedValue: number }
     */
    validateField: function (value, fieldName, options) {
      options = options || {};
      var min = options.min !== undefined ? options.min : 0;
      var max = options.max !== undefined ? options.max : Infinity;
      var allowZero = options.allowZero !== undefined ? options.allowZero : false;

      // Check empty or whitespace
      if (value === null || value === undefined || String(value).trim() === '') {
        return {
          isValid: false,
          message: fieldName + ' is required.',
          parsedValue: NaN
        };
      }

      var num = parseFloat(value);

      // Check NaN or non-finite
      if (isNaN(num) || !isFinite(num)) {
        return {
          isValid: false,
          message: fieldName + ' must be a valid number.',
          parsedValue: NaN
        };
      }

      // Check zero constraint
      if (!allowZero && num <= 0) {
        return {
          isValid: false,
          message: fieldName + ' must be greater than zero.',
          parsedValue: num
        };
      }

      // Check minimum
      if (num < min) {
        return {
          isValid: false,
          message: fieldName + ' cannot be less than ' + min + '.',
          parsedValue: num
        };
      }

      // Check maximum
      if (num > max) {
        return {
          isValid: false,
          message: fieldName + ' cannot exceed ' + max + '.',
          parsedValue: num
        };
      }

      return {
        isValid: true,
        message: '',
        parsedValue: num
      };
    },

    /**
     * Validates a complete reading set.
     * @param {object} reading - Object containing rpm, pd, ps, r, t, tp.
     * @param {number} readingIndex - 1, 2, or 3.
     * @returns {object} { isValid: boolean, isZeroState: boolean, errors: string[], values: object }
     */
    validateReading: function (reading, readingIndex) {
      if (this.isInitialState(reading)) {
        return {
          isValid: false,
          isZeroState: true,
          errors: [],
          values: { rpm: 0, pd: 0, ps: 0, r: 0, t: 0, tp: 0 }
        };
      }

      var errors = [];
      var cleanValues = {};
      var prefix = 'Reading ' + readingIndex + ': ';

      // 1. Pump RPM (N) - must be > 0
      var rpmCheck = this.validateField(reading.rpm, prefix + 'Pump RPM (N)', { min: 1, max: 5000, allowZero: false });
      if (!rpmCheck.isValid) {
        errors.push(rpmCheck.message);
      } else {
        cleanValues.rpm = rpmCheck.parsedValue;
      }

      // 2. Gauge Pressure (Pd) - kg/cm², allow zero or positive
      var pdCheck = this.validateField(reading.pd, prefix + 'Gauge Pressure (Pd)', { min: 0, max: 100, allowZero: true });
      if (!pdCheck.isValid) {
        errors.push(pdCheck.message);
      } else {
        cleanValues.pd = pdCheck.parsedValue;
      }

      // 3. Vacuum Pressure (Ps) - mmHg, allow zero or positive
      var psCheck = this.validateField(reading.ps, prefix + 'Vacuum Pressure (Ps)', { min: 0, max: 760, allowZero: true });
      if (!psCheck.isValid) {
        errors.push(psCheck.message);
      } else {
        cleanValues.ps = psCheck.parsedValue;
      }

      // 4. Water Rise (R) - m, allows both meter and cm values up to 50
      var rCheck = this.validateField(reading.r, prefix + 'Water Rise (R)', { min: 0.0001, max: 50, allowZero: false });
      if (!rCheck.isValid) {
        errors.push(rCheck.message);
      } else {
        cleanValues.r = rCheck.parsedValue;
      }

      // 5. Water Rise Time (t) - s, must be > 0
      var tCheck = this.validateField(reading.t, prefix + 'Water Rise Time (t)', { min: 0.01, max: 3600, allowZero: false });
      if (!tCheck.isValid) {
        errors.push(tCheck.message);
      } else {
        cleanValues.t = tCheck.parsedValue;
      }

      // 6. Energy Meter Time (tp) - s, must be > 0
      var tpCheck = this.validateField(reading.tp, prefix + 'Energy Meter Time (tp)', { min: 0.01, max: 3600, allowZero: false });
      if (!tpCheck.isValid) {
        errors.push(tpCheck.message);
      } else {
        cleanValues.tp = tpCheck.parsedValue;
      }

      return {
        isValid: errors.length === 0,
        isZeroState: false,
        errors: errors,
        values: cleanValues
      };
    },

    /**
     * Updates an input element's visual state.
     * @param {HTMLElement} inputElem - The input element to mark.
     * @param {boolean} isValid - Whether input is valid.
     */
    setInputState: function (inputElem, isValid) {
      if (!inputElem) return;
      if (isValid) {
        inputElem.classList.remove('is-invalid');
      } else {
        inputElem.classList.add('is-invalid');
      }
    }
  };

  window.PumpValidator = PumpValidator;
})(window);

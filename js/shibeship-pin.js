/**
 * ShibeShip escrow PIN — 5 Doge words + 8-char security code (6th position).
 * Legacy 6-word dictionary PINs remain supported for decrypt.
 */
(function (global) {
  'use strict';

  var DOGEEMONIC = ['69', '420', 'DOGECOIN', 'DOGE', 'MOON', 'HAPPY', 'COMMUNITY', 'KIND', 'KINDNESS', 'SMILE', 'PEOPLE', 'CURRENCY', 'SO', 'PAW', 'DOGELEY', 'HELP', 'POSITIVE', 'TRUE', 'GIVE', 'GIVEN', 'SHARE', 'LOVE', 'HUG', 'KISS', 'DEV', 'DESCENTRALIZE', 'SELF', 'CUSTODY', 'WALLET', 'KEYS', '88', '13', '2013', 'NINTONDO', 'BILLY', 'JACKSON'];
  var SECURITY_CODE_LENGTH = 8;
  var SECURITY_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var dictSet = null;

  function getDictSet() {
    if (!dictSet) {
      dictSet = {};
      DOGEEMONIC.forEach(function (w) { dictSet[w] = true; });
    }
    return dictSet;
  }

  function getDogeemonicWords() {
    return DOGEEMONIC.slice();
  }

  function normalizePin(pin) {
    return String(pin).trim().replace(/\s+/g, ' ');
  }

  function isPinSecurityCode(token) {
    var t = String(token).toUpperCase();
    return new RegExp('^[A-Z0-9]{' + SECURITY_CODE_LENGTH + '}$').test(t);
  }

  function secureRandomInt(max) {
    if (max <= 0) {
      return 0;
    }
    var buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }

  function generateSecurityCode() {
    var dict = getDictSet();
    var code;
    var attempts = 0;
    do {
      code = '';
      for (var i = 0; i < SECURITY_CODE_LENGTH; i++) {
        code += SECURITY_CHARSET.charAt(secureRandomInt(SECURITY_CHARSET.length));
      }
      attempts++;
    } while (dict[code] && attempts < 64);
    return code;
  }

  function randomDogeWord() {
    return DOGEEMONIC[secureRandomInt(DOGEEMONIC.length)];
  }

  function generateCheckoutPin() {
    var words = [];
    var i;
    for (i = 0; i < 5; i++) {
      words.push(randomDogeWord());
    }
    words.push(generateSecurityCode());
    return words;
  }

  function parsePinWordsLegacy(pin) {
    var words = DOGEEMONIC.slice().sort(function (a, b) { return b.length - a.length; });
    var rest = String(pin).toUpperCase().replace(/\s+/g, '');
    if (!rest) {
      return null;
    }
    var found = [];
    while (rest.length) {
      var matched = false;
      var j;
      for (j = 0; j < words.length; j++) {
        var word = words[j];
        if (rest.indexOf(word) === 0) {
          found.push(word);
          rest = rest.slice(word.length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        return null;
      }
    }
    return found.length === 6 ? found.join(' ') : null;
  }

  function parsePinWordsV2(pin) {
    var tokens = normalizePin(pin).toUpperCase().split(' ').filter(Boolean);
    var dict = getDictSet();
    var code;
    var i;
    if (tokens.length !== 6) {
      return null;
    }
    code = tokens[5];
    if (!isPinSecurityCode(code) || dict[code]) {
      return null;
    }
    for (i = 0; i < 5; i++) {
      if (!dict[tokens[i]]) {
        return null;
      }
    }
    return tokens.join(' ');
  }

  function parsePinWords(pin) {
    return parsePinWordsV2(pin) || parsePinWordsLegacy(pin);
  }

  function pinCandidates(pin) {
    var out = [];
    var n = normalizePin(pin);
    var p;
    var upper;
    if (n) {
      out.push(n);
    }
    p = parsePinWords(pin);
    if (p && out.indexOf(p) === -1) {
      out.push(p);
    }
    if (n) {
      upper = n.toUpperCase();
      if (upper && out.indexOf(upper) === -1) {
        out.push(upper);
      }
    }
    return out;
  }

  function countPinParts(pin) {
    var tokens = normalizePin(pin).split(' ').filter(Boolean);
    return Math.min(6, tokens.length);
  }

  function isPinComplete(pin) {
    return parsePinWords(pin) !== null;
  }

  global.ShibeShipPin = {
    DOGEEMONIC: DOGEEMONIC,
    SECURITY_CODE_LENGTH: SECURITY_CODE_LENGTH,
    getDogeemonicWords: getDogeemonicWords,
    normalizePin: normalizePin,
    isPinSecurityCode: isPinSecurityCode,
    generateSecurityCode: generateSecurityCode,
    generateCheckoutPin: generateCheckoutPin,
    parsePinWords: parsePinWords,
    parsePinWordsLegacy: parsePinWordsLegacy,
    parsePinWordsV2: parsePinWordsV2,
    pinCandidates: pinCandidates,
    countPinParts: countPinParts,
    isPinComplete: isPinComplete
  };
})(typeof window !== 'undefined' ? window : this);

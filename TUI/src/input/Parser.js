/**
 * Raw input parser for terminal input.
 */
class Parser {
  /**
   * Parse input buffer to recognized input events.
   * @param {Buffer|string} data - Input data
   * @returns {object[]} Array of parsed input events
   */
  static parse(data) {
    const events = [];
    const str = typeof data === 'string' ? data : data.toString();

    let i = 0;
    while (i < str.length) {
      const char = str[i];

      if (char === '\x1b') {
        const escapeEvent = this.parseEscape(str, i);
        if (escapeEvent) {
          events.push(escapeEvent);
          i += escapeEvent.length || 1;
        } else {
          events.push({ type: 'key', key: 'escape' });
          i++;
        }
      } else if (char === '\r' || char === '\n') {
        events.push({ type: 'key', key: 'enter' });
        i++;
      } else if (char === '\x7f') {
        events.push({ type: 'key', key: 'backspace' });
        i++;
      } else if (char === '\x09') {
        events.push({ type: 'key', key: 'tab' });
        i++;
      } else if (char.charCodeAt(0) < 32) {
        const ctrl = String.fromCharCode(char.charCodeAt(0) + 64);
        events.push({ type: 'key', key: ctrl, ctrl: true });
        i++;
      } else {
        events.push({ type: 'key', key: char });
        i++;
      }
    }

    return events;
  }

  /**
   * Parse escape sequences.
   * @private
   */
  static parseEscape(str, start) {
    if (str[start] !== '\x1b') return null;

    const next = str[start + 1];

    if (next === '[') {
      const seqStart = start + 2;
      let seqEnd = seqStart;
      while (seqEnd < str.length && !/[A-Z]/i.test(str[seqEnd])) {
        seqEnd++;
      }

      if (seqEnd >= str.length) return null;

      const seq = str.substring(seqStart, seqEnd + 1);
      const code = str[seqEnd];

      const arrowMap = {
        A: 'up',
        B: 'down',
        C: 'right',
        D: 'left',
        H: 'home',
        F: 'end',
        '5~': 'pageup',
        '6~': 'pagedown',
      };

      const key = arrowMap[seq + code] || arrowMap[code];
      if (key) {
        return { type: 'key', key, length: seqEnd - start + 1 };
      }

      const funcMatch = seq.match(/^(\d+)/);
      if (funcMatch) {
        const fNum = parseInt(funcMatch[1], 10);
        if (fNum >= 1 && fNum <= 12) {
          return { type: 'key', key: `f${fNum}`, length: seqEnd - start + 1 };
        }
      }
    } else if (next === 'O') {
      const code = str[start + 2];
      const funcMap = {
        P: 'f1',
        Q: 'f2',
        R: 'f3',
        S: 'f4',
      };
      if (funcMap[code]) {
        return { type: 'key', key: funcMap[code], length: 3 };
      }
    }

    return null;
  }
}

module.exports = { Parser };

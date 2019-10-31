function main() {
  var msgFunc;
  var answers = [];
  var statusDiv = document.querySelector('#status');
  function makeNewConnection() {
    console.log('connecting...');
    // statusDiv.textContent = 'connecting...';
    var connection = new WebSocket('ws://localhost:8080');

    connection.onopen = function () {
      // statusDiv.textContent = 'connected.';
      console.log('connected.');
      ask({Opcode: 'DeviceList',
           Space: 'SNES',
           Flags: null,
           Operands: null
          }, function(m1) {
            if (!JSON.parse(m1).Results.length) {
              console.log('connected, but no snes found. connect snes and reload page.');
              // statusDiv.textContent = 'connected, but no snes found. connect snes and reload page.';
              return;
            }
            ask({
              Opcode: 'Attach',
              Space: 'SNES',
              Flags: null,
              Operands: JSON.parse(m1).Results
            });
            ask({
              Opcode: 'Name',
              Space: 'SNES',
              Flags: null,
              Operands: ['Buttz']
            });
            var last;
            var count = 0;
            function doGetAddress() {
              getAddress('F50071', function(x) { // smw us death
                x = (new Uint8Array(x))[0];
                if (x !== last) {
                  console.log(last + ' x' + count);
                  last = x;
                  count = 0;
                  if (last === 9) { // smw us death
                    addDeath();
                  }
                } else {
                  count++;
                }
                doGetAddress();
              });
            }
            doGetAddress();
          });
    };

    connection.onerror = function (error) {
      console.log('error');
      // statusDiv.textContent = 'error!';
    };

    connection.onclose = function () {
      console.log('close');
      // statusDiv.textContent = 'connection closed.';
      // document.querySelector('#status').style.display = 'block';
      // cxn = makeNewConnection();
    };

    connection.onmessage = msgFunc = function (message) {
      // console.log(message.data);
      answers.length && answers.shift()(message.data);
    };

    window.send = function(r) {
      connection.send(r);
    };
    window.getAddress = function(addr, cb) {
      ask({
        Opcode: 'GetAddress',
        Space: 'SNES',
        Flags: null,
        Operands: [addr + '', '1']
      }, function(m1) {
        var fr = new FileReader();
        fr.onload = function(evt) {
          cb(evt.target.result);
        };
        fr.readAsArrayBuffer(m1);
      });
    };
    return connection;
    function ask(question, answer) {
      if (answer) {
        answers.push(answer);
      }
      connection.send(typeof question === 'string' ? question : JSON.stringify(question));
    }
  }
  var cxn = makeNewConnection();
}

main();

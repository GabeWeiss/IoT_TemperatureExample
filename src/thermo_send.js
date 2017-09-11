
/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the `License`);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an `AS IS` BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var five = require('johnny-five');
var jwt = require('jsonwebtoken');
var mqtt = require('mqtt');
var fs = require('fs');
var program = require('commander');
var SevenSegment = require('node-led').SevenSegment;

// https://www.npmjs.com/package/commander
program.description('The receiving end for the temperature/fan with device example')
  .option('--project_id <project_id>', 'GCP cloud project name. Only the name, not path.')
  .option('--cloud_region <cloud_region>', 'GCP cloud region.', 'us-central1')
  .option('--registry_id <registry_id>', 'IoT Core device registry name')
  .option('--device_id <device_id>', 'IoT Core device id.')
  .option('--ssh_public_key <ssh_public_key>', 'Path to the public key file')
  .option('--ssh_algorithm <ssh_algorithm>', 'Encoding algorithm for the SSH key', 'RS256')
  .option('--device_port <device_port>', 'If device is plugged in, what port is it plugged into. Included for johnny-five implementation.')
  .option('--deploy_room_temperature', 'Instead of the normal demo reporting, this puts the script into room temperature mode to broadcast current room temperature')
  .parse(process.argv);

// fail out if we don't have any of our required args.
if (!program.project_id) 
  throw new Error('--project_id required')
if (!program.registry_id) 
  throw new Error('--registry_id required')
if (!program.device_id) 
  throw new Error('--device_id required')
if (!program.ssh_public_key) 
  throw new Error('--ssh_public_key required')
if (!program.device_port) 
  throw new Error('--device_port required')

// Create a JWT to authenticate this device. The device will be disconnected
// after the token expires, and will have to reconnect with a new token. The
// audience field should always be set to the GCP project id.
function createJwt () {
  const token = {
    'iat': parseInt(Date.now() / 1000),
    'exp': parseInt(Date.now() / 1000) + 60 * 60,  // 1 hour
    'aud': program.project_id
  };
  const privateKey = fs.readFileSync(program.ssh_public_key);
  return jwt.sign(token, privateKey, { algorithm: program.ssh_algorithm });
}

const mqttClientId = `projects/${program.project_id}/locations/${program.cloud_region}/registries/${program.registry_id}/devices/${program.device_id}`;
var connectionArgs = {
    host: "mqtt.googleapis.com",
    port: 8883,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(),
    protocol: 'mqtts'
};
const mqttTopic = `/devices/${program.device_id}/events`;

// http://johnny-five.io/
var board = new five.Board({
    port: program.device_port
});

board.on("ready", function () {
  const thermoPin = 3;
  board.io.sendOneWireConfig(thermoPin, true);
  board.io.sendOneWireSearch(thermoPin, function(error, devices) {
    if(error) {
      console.error(error);
      return;
    }

    var temperature = new five.Thermometer({
        controller: "DS18B20",
        pin: thermoPin
    });

    temperature.on("change", function() {
      var temp = this.F;
      var client = mqtt.connect(connectionArgs);
      var tmpJson = `{"temperature": ${temp}, "ts": ${Date.now()}}`;

      var opts = {
        address: 0x70
      };
      var display = new SevenSegment(board, opts);
      display.writeText(temp);


      client.on("connect", function() {
          client.publish(mqttTopic, tmpJson, { qos: 1 });
          client.end();
      });
      client.on("error", function(error) {

          if (error.message.indexOf("Error: Connection refused: Bad username or password" !== -1)) {
              connectionArgs = {
                host: "mqtt.googleapis.com",
                port: 8883,
                clientId: mqttClientId,
                username: 'unused',
                password: createJwt(),
                protocol: 'mqtts'
              };
          }
          else {
              console.log(error);

              var opts = {
                address: 0x70
              };
              var display = new SevenSegment(board, opts);
              display.clearDisplay();
          }
          client.end();
      });
    });
  });
});

board.on("exit", function () {
    var opts = {
      address: 0x70
    };
    var display = new SevenSegment(board, opts);
    display.clearDisplay();
});


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
var program = require('commander');

// https://www.npmjs.com/package/commander
program.description('The receiving end for the temperature/fan with device example')
  .option('--project_id <project_id>', 'GCP cloud project name. Only the name, not path.')
  .option('--device_port <device_port>', 'If device is plugged in, what port is it plugged into.')
  .option('--pubsub_topic <pubsub_topic>', 'Topic name from pubsub associated with the device registry.')
  .option('--pubsub_subscription <pubsub_subscription>', 'Subscription name from pubsub associated with the device regsitry.')
  .option('--service_account_json <service_account_json>', 'Path to the service account json file')
  .parse(process.argv);

// fail out if we don't have any of our required args.
if (!program.project_id) 
  throw new Error('--project_id required')
if (!program.device_port) 
  throw new Error('--device_port required')
if (!program.pubsub_topic)
  throw new Error('--pubsub_topic required')
if (!program.pubsub_subscription) 
  throw new Error('--pubsub_subscription required')
if (!program.service_account_json) 
  throw new Error('--service_account_json required')

// Information on creating service accounts and generating credentials:
// https://cloud.google.com/iam/docs/service-accounts?hl=en_US&_ga=1.221302744.1127203517.1497463231
var pubsub = require('@google-cloud/pubsub')({
  projectId: program.project_id,
  keyFilename: program.service_account_json
});
const pubsub_topic = `projects/${program.project_id}/topics/${program.pubsub_topic}`;
const pubsub_subscription = `projects/${program.project_id}/subscriptions/${program.pubsub_subscription}`;

// http://johnny-five.io/
var board = new five.Board({
    port: program.device_port
});

board.on("ready", function () {

    // https://googlecloudplatform.github.io/google-cloud-node/#/docs/pubsub/0.11.0/pubsub/subscription
    var subscription = pubsub.subscription(pubsub_subscription, {
      autoAck: true
    });

    var led = new five.Led.RGB([6,5,3]);
    led.on();
    led.color("#FFFFFF");

    subscription.on("message", function(message) {
      var msgJson = message.data;
      if (msgJson.temperature > 80.0) {
        led.color("#FF0000")
      }
      else {
        led.color("#00FF00");
      }
    });
});

// 
board.on("exit", function() {
    var led = new five.Led.RGB([6,5,3]);
    led.off();
});

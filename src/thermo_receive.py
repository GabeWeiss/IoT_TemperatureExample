# Copyright 2017, Google, Inc.
# Licensed under the Apache License, Version 2.0 (the `License`);
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an `AS IS` BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script assumes that you've setup the Google Cloud SDK and init'd
# using the project the telemetry data is being sent to. The Service Account
# must have Pub/Sub read permissions only

import argparse
import rainbowhat as rh
import time
import json

from google.cloud import pubsub

led_0 = [0,255,200]
led_1 = [0,255,0]
led_2 = [100,255,0]
led_3 = [150,200,0]
led_4 = [200,100,0]
led_5 = [255,50,0]
led_6 = [255,0,0]


def receive_message(topic_name, subscription_name, service_account_file):
  pubsub_client = pubsub.Client.from_service_account_json(service_account_file)
  topic = pubsub_client.topic(topic_name)
  subscription = topic.subscription(subscription_name)

  results = subscription.pull(return_immediately=True)

  for ack_id, message in results:
    msg_json = json.loads(message.data)
    temp = msg_json['temperature']

    rh.display.clear()
    rh.display.print_float(temp)
    rh.display.show()

    if temp > 68:
      r,g,b = led_0
      rh.rainbow.set_pixel(0, r, g, b)
    if temp > 70:
      r,g,b = led_1
      rh.rainbow.set_pixel(1, r, g, b)
    if temp > 72:
      r,g,b = led_2
      rh.rainbow.set_pixel(2, r, g, b)
    if temp > 74:
      r,g,b = led_3
      rh.rainbow.set_pixel(3, r, g, b)
    if temp > 76:
      r,g,b = led_4
      rh.rainbow.set_pixel(4, r, g, b)
    if temp > 78:
      r,g,b = led_5
      rh.rainbow.set_pixel(5, r, g, b)
    if temp > 80:
      r,g,b = led_6
      rh.rainbow.set_pixel(6, r, g, b)
    rh.rainbow.show()

  if results:
    subscription.acknowledge([ack_id for ack_id, message in results])

def parse_command_line_args():
  parser = argparse.ArgumentParser(description='Raspberry Pi script to receieve temperature telemetry data from Pub/Sub')
  parser.add_argument(
    '--service_account_json_file', required=True, help='Full path and name of service account credentials file.')
  parser.add_argument(
    '--pubsub_topic', required=True, help='Cloud Pub/Sub topic name.')
  parser.add_argument(
    '--pubsub_subscription', required=True, help='Cloud Pub/Sub subscription name.')
  return parser.parse_args()

args = parse_command_line_args()

while True:
  receive_message(args.pubsub_topic, args.pubsub_subscription, args.service_account_json_file)
  time.sleep(0.5)

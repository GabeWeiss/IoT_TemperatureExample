** This is not an official Google product **

# Temperature Internet of Things example with Cloud IoT Core
This example (in node.js) covers two devices talking to IoT Core and Pubsub on Google's Cloud Platform. It's intended to be run on two different devices (although could be done all in one if the code is merged into one file) connected to a computer and run from there.

For my devices I ran Arduino Unos with a DS18B20 temperature sensor (https://www.sparkfun.com/products/245) on one, and an RGB LED on the other. ConfigurableFirmata is required for the DS18B20 sensor device.

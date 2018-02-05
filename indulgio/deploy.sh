#!/bin/bash

cd "$(dirname "$0")" && rm -rf ../timers && npm run build && mv build ../timers && git add ../timers

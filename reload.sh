#!/bin/bash

git pull
cd 
npx pm2 restart ./gobot/ecosystem.config.cjs

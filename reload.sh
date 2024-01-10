#!/bin/bash

git pull
npx pm2 restart ecosystem.config.cjs

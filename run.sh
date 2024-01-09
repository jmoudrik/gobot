#!/bin/sh

[ -e lock.pid ] && {
	PREV=$(cat lock.pid)
	echo killing $PREV
	kill $PREV
	echo $?
}

. ./config.sh
node gobot.js &
echo $! > lock.pid
cat lock.pid

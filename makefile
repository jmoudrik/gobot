deploy: 
	git push
	ssh j2m "cd gobot; git pull"

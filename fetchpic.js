import fetch from "node-fetch";

export const picfetch = async (url) => {
	const ret = await fetch(url);
	console.log("PIC" + ret.status)
	if (ret.status != 200) {
		return null;
	}

	return ret.arrayBuffer();
}

/*
(async () => {
	const blob = await picfetch('https://goweb.cz/wp-content/uploads/2019/10/Pandanet-logo-300x198-e1578055710645.jpg')
	console.dir(blob)

})();
// */

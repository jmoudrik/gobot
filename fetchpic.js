import fetch from "node-fetch";

export const picfetch = async (url) => {
	const ret = await fetch(url);
	if (ret.status != 200) {
		console.log("picfetch: failed with " + ret.status);
		return null;
	}

	const blob = await ret.arrayBuffer();
	const len = blob.byteLength ?? 0;
	console.log(`picfetch: got ${len}B for '${url}'`);

	return Buffer.from(blob);
}

/*
(async () => {
	const blob = await picfetch('https://goweb.cz/wp-content/uploads/2019/10/Pandanet-logo-300x198-e1578055710645.jpg')
	console.dir(blob)

})();
// */

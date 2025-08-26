import { check } from "k6";
import { sha256 } from "k6/crypto";
import { b64encode } from "k6/encoding";
import http from "k6/http";

export const options = {
	vus: 10,
	duration: "30s",
};

// FIXME signature appears to be invalid
async function generateDpop(access_token) {
	const { privateKey, publicKey } = await crypto.subtle.generateKey(
		{
			name: "ECDSA",
			namedCurve: "P-256",
		},
		true,
		["sign", "verify"],
	);
	const ath = sha256(access_token, "base64rawurl");

	const header = {
		typ: "dpop+jwt",
		alg: "ES256",
		jwk: await crypto.subtle.exportKey("jwk", publicKey),
	};
	const payload = {
		jti: "jti",
		htm: "POST",
		htu: "http://localhost:5000/credential",
		iat: Math.floor(Date.now() / 1000),
		ath,
	};

	const encodedJwt =
		b64encode(JSON.stringify(header), "rawurl") +
		"." +
		b64encode(JSON.stringify(payload), "rawurl");

	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: { name: "SHA-256" } },
		privateKey,
		string2ArrayBuffer(encodedJwt),
	);

	return `${encodedJwt}.${b64encode(signature, "rawurl")}`;
}

async function generateProof(nonce) {
	const { privateKey, publicKey } = await crypto.subtle.generateKey(
		{
			name: "ECDSA",
			namedCurve: "P-256",
		},
		true,
		["sign", "verify"],
	);

	const header = {
		alg: "ES256",
		jwk: await crypto.subtle.exportKey("jwk", publicKey),
	};
	const payload = {
		nonce,
	};

	const encodedJwt =
		b64encode(JSON.stringify(header), "rawurl") +
		"." +
		b64encode(JSON.stringify(payload), "rawurl");

	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: { name: "SHA-256" } },
		privateKey,
		string2ArrayBuffer(encodedJwt),
	);

	return `${encodedJwt}.${b64encode(signature, "rawurl")}`;
}

// from k6 documentation
function string2ArrayBuffer(str) {
	const buf = new ArrayBuffer(str.length);
	const bufView = new Uint8Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

// The default exported function is gonna be picked up by k6 as the entry point for the test script. It will be executed repeatedly in "iterations" for the whole duration of the test.
export default async function () {
	// credential offer
	const scope = "pid:sd_jwt_dc";
	const credentialOffer = http.get(`http://localhost:5000/offer/${scope}`, {
		headers: { Accept: "application/json" },
	});
	const [_all1, issuer_state] = /issuer_state%22%3A%22([^%]+)%22/.exec(
		JSON.parse(credentialOffer.body).credential_offer_url,
	) || [""];

	check(credentialOffer, {
		"credentialOffer is status 200": (r) => r.status === 200,
	});

	// pushed authorization request
	const response_type = "code";
	const client_id = "CLIENT123";
	const redirect_uri = "http://localhost:3000";
	const pushedAuthorizationRequest = http.post(
		"http://localhost:5000/pushed-authorization-request",
		{
			response_type,
			client_id,
			redirect_uri,
			scope,
			issuer_state,
		},
	);

	const request_uri = JSON.parse(pushedAuthorizationRequest.body).request_uri;

	check(pushedAuthorizationRequest, {
		"pushedAuthorizationRequest is status 200": (r) => r.status === 200,
	});

	// authorize
	const authorize = http.get(
		`http://localhost:5000/authorize?client_id=${client_id}&request_uri=${request_uri}`,
	);

	check(authorize, {
		"authorize is status 200": (r) => r.status === 200,
	});

	//authenticate
	const authenticate = http.post(
		`http://localhost:5000/authorize?client_id=${client_id}&request_uri=${request_uri}`,
		{
			username: "wwwallet",
			password: "tellawww",
		},
		{ redirects: 0 },
	);

	const [_all2, authorization_code] =
		/code=([^&]+)/.exec(authenticate.headers.Location) || [];

	check(authenticate, {
		"authenticate is status 302": (r) => r.status === 302,
	});

	// token
	const token = http.post(`http://localhost:5000/token`, {
		client_id,
		redirect_uri,
		grant_type: "authorization_code",
		code: authorization_code,
	});

	const access_token = JSON.parse(token.body).access_token;

	check(token, {
		"token is status 200": (r) => r.status === 200,
	});

	const nonce = http.post(`http://localhost:5000/nonce`);

	const c_nonce = JSON.parse(nonce.body).c_nonce;

	check(nonce, {
		"nonce is status 200": (r) => r.status === 200,
	});

	// credential
	const dpop = await generateDpop(access_token);

	const credential = http.post(
		`http://localhost:5000/credential`,
		JSON.stringify({
			credential_configuration_ids: ["urn:eudi:pid:1:dc"],
			proofs: {
				jwt: [await generateProof(c_nonce)],
			},
		}),
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${access_token}`,
				DPoP: dpop,
			},
		},
	);

	check(credential, {
		"credential is status 200": (r) => r.status === 200,
	});
}

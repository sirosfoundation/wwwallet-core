import { check } from "k6";
import http from "k6/http";

export const options = {
	vus: 10,
	duration: "30s",
};

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

	check(token, {
		"token is status 200": (r) => r.status === 200,
	});

	// credential
	// NOTE we cannot use jose to craft the dpop token according to the access token,
	//	the dependency requiring TextEncoder to be defined https://github.com/grafana/k6/issues/2440.
	//	Those are then to be filled manually from tests for example, looking for a solution to the issue
	const access_token = "";
	const dpop = "";

	const credential = http.post(
		`http://localhost:5000/credential`,
		{
			credential_configuration_ids: ["urn:eudi:pid:1:dc"],
		},
		{
			headers: {
				Authorization: `DPoP ${access_token}`,
				DPoP: dpop,
			},
		},
	);

	check(credential, {
		"credential is status 401": (r) => r.status === 401,
	});
}

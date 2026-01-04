import { Protocols, Storage } from "@wwwallet/server-core";
import { Container } from "inversify";
import { createClient, type RedisClientType } from "redis";
import { config } from "./config";
import { RedisEventStore } from "./redis-event-store";

const container = new Container();

const client: RedisClientType = createClient({
	url: config.redis_url,
});

client.on("error", (err) => {
	console.error("Redis Client Error", err);
});

if (config.redis_url) {
	config.eventStore = new RedisEventStore({ client });
}

container.bind<RedisClientType>("RedisClient").toConstantValue(client);
container.bind<Protocols>("Protocols").toConstantValue(new Protocols(config));
container.bind<Storage>("Storage").toConstantValue(new Storage(config));

const protocols = container.get<Protocols>("Protocols");
const storage = container.get<Storage>("Storage");
const redisClient = container.get<RedisClientType>("RedisClient");

export { container, protocols, storage, redisClient };

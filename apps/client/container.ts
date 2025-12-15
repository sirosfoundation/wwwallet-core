import { Protocols, Storage } from "@wwwallet/server-core";
import { Container } from "inversify";
import { config } from "./config";

const container = new Container();

container.bind<Protocols>("Protocols").toConstantValue(new Protocols(config));
container.bind<Storage>("Storage").toConstantValue(new Storage(config));

const protocols = container.get<Protocols>("Protocols");
const storage = container.get<Storage>("Storage");

export { container, protocols, storage };

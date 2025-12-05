import { Protocols } from "@wwwallet/server-core";
import { Container } from "inversify";
import { config } from "./config";

const container = new Container();

container.bind<Protocols>("Protocols").toConstantValue(new Protocols(config));

const protocols = container.get<Protocols>("Protocols");

export { container, protocols };

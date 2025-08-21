import { Core } from "@wwwallet/core";
import { Container } from "inversify";
import { config } from "./main.config";

const container = new Container();

container.bind<Core>("Core").toConstantValue(new Core(config));

const core = container.get<Core>("Core");

export { container, core };

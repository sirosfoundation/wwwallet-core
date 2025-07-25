import { Container } from "inversify";

import { config } from "./config";
import { Core } from "./src";

const container = new Container();

container.bind<Core>("Core").toConstantValue(new Core(config));

const core = container.get<Core>("Core");

export { container, core };

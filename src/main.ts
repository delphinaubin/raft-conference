import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";

import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";

createApp(App).use(store).use(VNetworkGraph).mount("#app");

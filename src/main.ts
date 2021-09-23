import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";

import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";
import "ant-design-vue/dist/antd.css";
import { Button } from "ant-design-vue";

const app = createApp(App);
app.use(store);
app.use(VNetworkGraph);

app.use(Button);
app.mount("#app");

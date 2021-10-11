import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";

import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";
import "ant-design-vue/dist/antd.css";
import { Button, Drawer, Form, Input, Popover, Timeline } from "ant-design-vue";

const app = createApp(App);
app.use(store);
app.use(VNetworkGraph);

app.use(Form);
app.use(Input);
app.use(Button);
app.use(Timeline);
app.use(Popover);
app.use(Drawer);
app.mount("#app");

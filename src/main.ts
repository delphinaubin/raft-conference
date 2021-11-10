import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";

import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";
import "ant-design-vue/dist/antd.dark.less";
import {
  Alert,
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Popover,
  Progress,
  Row,
  Switch,
  Table,
  Tag,
  Timeline,
  Tooltip,
} from "ant-design-vue";

const app = createApp(App);
app.use(store);
app.use(VNetworkGraph);

app.use(Form);
app.use(Input);
app.use(Button);
app.use(Timeline);
app.use(Popover);
app.use(Drawer);
app.use(Row);
app.use(Col);
app.use(Table);
app.use(Switch);
app.use(Alert);
app.use(Progress);
app.use(Tooltip);
app.use(Tag);
app.mount("#app");

// To call manually in the console to stop debugging
(window as any).stopDebug = () => {
  (window as any).isDebugModeActivated = false;
};

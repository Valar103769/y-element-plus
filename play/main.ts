import { createApp } from "vue";
import App from "./app.vue";

import ElIcon from "@y-element-plus/components/icon";
import "@y-element-plus/theme-chalk/src/index.scss";
const app = createApp(App);
app.use(ElIcon);
app.mount("#app");

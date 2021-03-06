import { createApp } from "vue"
import App from "./app.vue"
import AElIcon from "element-plus"

import ElIcon from "@y-element-plus/components/icon"
import "@y-element-plus/theme-chalk/src/index.scss"
const app = createApp(App)
app.use(ElIcon)
app.mount("#app")

console.log(AElIcon)

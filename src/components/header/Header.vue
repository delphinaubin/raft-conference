<template>
  <div class="header-container">
    <h1>Raft algorithm demo</h1>
    <a-button @click="toggleDebugMode" type="primary">
      <BugOutlined /> Debug</a-button
    >
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { BugOutlined } from "@ant-design/icons-vue";

@Options({
  components: {
    BugOutlined,
  },
})
export default class Header extends Vue {
  toggleDebugMode(): void {
    (window as any).isDebugModeActivated = true;
  }
}
</script>
<style scoped>
.header-container {
  padding-top: 1rem;
  text-align: center;
}
</style>
